import type { GeminiConfig } from './api';

export interface UserSettings {
  // Backend API Base URL Configuration (Required, must be configured by user)
  backendBaseUrl: string;

  // Gemini Configuration
  apiKey: string;
  model: string;

  // Custom Models Configuration
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;

  // System & Integration Toggles
  enableReasoning: boolean;
  enableMcp: boolean;
}

const STORAGE_KEYS = {
  BACKEND_BASE_URL: 'aic_settings_backend_base_url',
  API_KEY: 'aic_settings_api_key',
  MODEL: 'aic_settings_model',
  CUSTOM_BASE_URL: 'aic_settings_custom_base_url',
  CUSTOM_API_KEY: 'aic_settings_custom_api_key',
  CUSTOM_MODEL: 'aic_settings_custom_model',
  REASONING: 'aic_settings_reasoning',
  MCP: 'aic_settings_mcp',
} as const;

export const GEMINI_AVAILABLE_MODELS = [
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', badge: 'Khuyên dùng' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
] as const;

export const DEFAULT_SETTINGS: UserSettings = {
  backendBaseUrl: '',
  apiKey: 'AQ.Ab8RN6KtvDj5lXE8G6oGfQh-HuvMdjlf4XJF3vq4GVLBKFMSvA',
  model: 'gemini-3.1-flash-lite',
  customBaseUrl: '',
  customApiKey: '',
  customModel: '',
  enableReasoning: true,
  enableMcp: true,
};

/**
 * Retrieve user settings from localStorage (purely user-provided, no env fallback for backend).
 */
export function getStoredSettings(): UserSettings {
  try {
    const backendBaseUrl = localStorage.getItem(STORAGE_KEYS.BACKEND_BASE_URL) ?? '';
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) ?? DEFAULT_SETTINGS.apiKey;
    
    // Ensure model is one of the 2 valid Gemini models if not set properly
    const rawModel = localStorage.getItem(STORAGE_KEYS.MODEL);
    const validGeminiModels = GEMINI_AVAILABLE_MODELS.map((m) => m.value);
    const model = rawModel && validGeminiModels.includes(rawModel as any)
      ? rawModel
      : DEFAULT_SETTINGS.model;

    const customBaseUrl = localStorage.getItem(STORAGE_KEYS.CUSTOM_BASE_URL) ?? DEFAULT_SETTINGS.customBaseUrl;
    const customApiKey = localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) ?? DEFAULT_SETTINGS.customApiKey;
    const customModel = localStorage.getItem(STORAGE_KEYS.CUSTOM_MODEL) ?? DEFAULT_SETTINGS.customModel;

    const reasoningRaw = localStorage.getItem(STORAGE_KEYS.REASONING);
    const mcpRaw = localStorage.getItem(STORAGE_KEYS.MCP);

    return {
      backendBaseUrl,
      apiKey,
      model,
      customBaseUrl,
      customApiKey,
      customModel,
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
    if (settings.backendBaseUrl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.BACKEND_BASE_URL, settings.backendBaseUrl.trim());
    }
    if (settings.apiKey !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, settings.apiKey.trim());
    }
    if (settings.model !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MODEL, settings.model.trim());
    }
    if (settings.customBaseUrl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BASE_URL, settings.customBaseUrl.trim());
    }
    if (settings.customApiKey !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, settings.customApiKey.trim());
    }
    if (settings.customModel !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MODEL, settings.customModel.trim());
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
 * Check if the user has configured the Backend Base URL in settings.
 */
export function isBackendConfigured(): boolean {
  const settings = getStoredSettings();
  return Boolean(settings.backendBaseUrl && settings.backendBaseUrl.trim().length > 0);
}

/**
 * Get the active backend API base URL directly from user settings.
 * Throws a clear descriptive error if the user has not configured it yet.
 */
export function getBackendBaseUrl(): string {
  const settings = getStoredSettings();
  const raw = settings.backendBaseUrl?.trim();
  if (!raw) {
    throw new Error('Chưa cấu hình Backend Base URL. Vui lòng vào Cài đặt (Settings) để nhập địa chỉ máy chủ API backend trước khi tiếp tục.');
  }
  return raw.replace(/\/$/, '');
}

/**
 * Generate GeminiConfig payload for Google Gemini requests.
 */
export function getGeminiConfig(): GeminiConfig {
  const settings = getStoredSettings();
  return {
    api_key: settings.apiKey?.trim() || null,
    model: settings.model?.trim() || DEFAULT_SETTINGS.model,
    base_url: null,
  };
}

/**
 * Generate config payload for Custom Models / OpenAI-compatible endpoint requests.
 */
export function getCustomModelConfig(): GeminiConfig {
  const settings = getStoredSettings();
  return {
    api_key: settings.customApiKey?.trim() || null,
    model: settings.customModel?.trim() || 'custom-model',
    base_url: settings.customBaseUrl?.trim() || null,
  };
}
