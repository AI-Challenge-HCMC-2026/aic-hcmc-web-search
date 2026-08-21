import type { GeminiConfig } from './api';

export interface UserSettings {
  apiKey: string;
  model: string;
  enableReasoning: boolean;
  enableMcp: boolean;
}

const STORAGE_KEYS = {
  API_KEY: 'aic_settings_api_key',
  MODEL: 'aic_settings_model',
  REASONING: 'aic_settings_reasoning',
  MCP: 'aic_settings_mcp',
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
  apiKey: 'AQ.Ab8RN6KtvDj5lXE8G6oGfQh-HuvMdjlf4XJF3vq4GVLBKFMSvA',
  model: 'gemini-3.1-flash-lite',
  enableReasoning: true,
  enableMcp: true,
};

/**
 * Retrieve user settings from localStorage (falls back to defaults).
 */
export function getStoredSettings(): UserSettings {
  try {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) ?? DEFAULT_SETTINGS.apiKey;
    const model = localStorage.getItem(STORAGE_KEYS.MODEL) ?? DEFAULT_SETTINGS.model;
    const reasoningRaw = localStorage.getItem(STORAGE_KEYS.REASONING);
    const mcpRaw = localStorage.getItem(STORAGE_KEYS.MCP);

    return {
      apiKey,
      model,
      enableReasoning: reasoningRaw !== null ? reasoningRaw === 'true' : DEFAULT_SETTINGS.enableReasoning,
      enableMcp: mcpRaw !== null ? mcpRaw === 'true' : DEFAULT_SETTINGS.enableMcp,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings to localStorage.
 */
export function saveStoredSettings(settings: Partial<UserSettings>): void {
  try {
    if (settings.apiKey !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, settings.apiKey);
    }
    if (settings.model !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
    }
    if (settings.enableReasoning !== undefined) {
      localStorage.setItem(STORAGE_KEYS.REASONING, String(settings.enableReasoning));
    }
    if (settings.enableMcp !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MCP, String(settings.enableMcp));
    }
  } catch {
    /* silent catch for restricted storage environments */
  }
}

/**
 * Generate GeminiConfig payload for API requests (base_url defaults to null).
 */
export function getGeminiConfig(): GeminiConfig {
  const settings = getStoredSettings();
  return {
    api_key: settings.apiKey?.trim() || null,
    model: settings.model?.trim() || DEFAULT_SETTINGS.model,
    base_url: null,
  };
}
