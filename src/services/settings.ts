import type { GeminiConfig } from './api';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  // Backend API Base URL Configuration (Must be configured by user in Settings)
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

export interface UserSettingsSupabaseRow {
  user_id: string;
  backend_base_url: string;
  gemini_apikey: string;
  selected_gemini_model: string;
  custom_models_baseurl: string;
  custom_models_apikey: string;
  custom_models_id: string;
  enable_reasoning: boolean;
  enable_mcps: boolean;
  created_at?: string;
  updated_at?: string;
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

export const DEFAULT_BACKEND_URL = 'https://opossum-excuse-spinning.ngrok-free.dev/api/v1';

export const DEFAULT_SETTINGS: UserSettings = {
  backendBaseUrl: DEFAULT_BACKEND_URL,
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
    const rawBackendBaseUrl = localStorage.getItem(STORAGE_KEYS.BACKEND_BASE_URL);
    const backendBaseUrl = rawBackendBaseUrl !== null && rawBackendBaseUrl.trim().length > 0
      ? rawBackendBaseUrl
      : DEFAULT_SETTINGS.backendBaseUrl;
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) ?? DEFAULT_SETTINGS.apiKey;
    
    // Ensure model is one of the 2 valid Gemini models if not set properly
    const rawModel = localStorage.getItem(STORAGE_KEYS.MODEL);
    const validGeminiModels = GEMINI_AVAILABLE_MODELS.map((m) => m.value);
    const model = rawModel && validGeminiModels.includes(rawModel as (typeof validGeminiModels)[number])
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
 * Get the active backend API base URL from settings or environment.
 * Fallback to DEFAULT_BACKEND_URL.
 */
export function getBackendBaseUrl(): string {
  const settings = getStoredSettings();
  const raw = settings.backendBaseUrl?.trim();
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as unknown as { process?: { env?: Record<string, string> } }) : undefined;
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> })?.env : undefined;
  const envUrl =
    metaEnv?.VITE_API_BASE_URL ||
    metaEnv?.VITE_API_URL ||
    globalObj?.process?.env?.NEXT_PUBLIC_API_URL ||
    globalObj?.process?.env?.VITE_API_BASE_URL;

  const candidate = (raw || envUrl || DEFAULT_BACKEND_URL).trim();
  let clean = candidate.replace(/\/+$/, '');

  // If only the ngrok domain without /api/v1 is provided, ensure /api/v1 is present
  if (clean === 'https://opossum-excuse-spinning.ngrok-free.dev') {
    clean = 'https://opossum-excuse-spinning.ngrok-free.dev/api/v1';
  }

  return clean;
}

/**
 * Fetch settings from Supabase table `user_settings` and update local cache.
 */
export async function fetchSettingsFromSupabase(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch settings from Supabase:', error.message);
      return null;
    }

    if (data) {
      const remoteSettings: UserSettings = {
        backendBaseUrl: data.backend_base_url ?? '',
        apiKey: data.gemini_apikey ?? '',
        model: data.selected_gemini_model || DEFAULT_SETTINGS.model,
        customBaseUrl: data.custom_models_baseurl ?? '',
        customApiKey: data.custom_models_apikey ?? '',
        customModel: data.custom_models_id ?? '',
        enableReasoning: data.enable_reasoning ?? DEFAULT_SETTINGS.enableReasoning,
        enableMcp: data.enable_mcps ?? DEFAULT_SETTINGS.enableMcp,
      };
      saveStoredSettings(remoteSettings);
      return remoteSettings;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching Supabase settings:', err);
    return null;
  }
}

/**
 * Save settings to Supabase table `user_settings` for the current user.
 */
export async function saveSettingsToSupabase(userId: string, settings: UserSettings): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        backend_base_url: settings.backendBaseUrl.trim(),
        gemini_apikey: settings.apiKey.trim(),
        selected_gemini_model: settings.model.trim() || DEFAULT_SETTINGS.model,
        custom_models_baseurl: settings.customBaseUrl.trim(),
        custom_models_apikey: settings.customApiKey.trim(),
        custom_models_id: settings.customModel.trim(),
        enable_reasoning: settings.enableReasoning,
        enable_mcps: settings.enableMcp,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving settings to Supabase:', error.message);
    }
  } catch (err) {
    console.error('Failed to sync settings with Supabase:', err);
  }
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
