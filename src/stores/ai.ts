import { create } from 'zustand';

const STORAGE_KEY = 'dazzle-ai-config';

export const ENV_DEFAULTS = {
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  baseUrl: import.meta.env.VITE_AI_BASE_URL || 'https://api.deepseek.com/v1',
  model: import.meta.env.VITE_AI_MODEL || 'deepseek-chat',
};

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface AIState {
  config: AIConfig;
  setConfig: (config: Partial<AIConfig>) => void;
  isConfigured: () => boolean;
  getEffectiveConfig: () => AIConfig;
}

function loadConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AIConfig;
    }
  } catch {
    // ignore parse errors
  }
  return { apiKey: '', baseUrl: '', model: '' };
}

function saveConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function mergeWithDefaults(config: AIConfig): AIConfig {
  return {
    apiKey: config.apiKey || ENV_DEFAULTS.apiKey,
    baseUrl: config.baseUrl || ENV_DEFAULTS.baseUrl,
    model: config.model || ENV_DEFAULTS.model,
  };
}

export const useAIStore = create<AIState>((set, get) => ({
  config: loadConfig(),

  setConfig: (partial) => {
    const updated = { ...get().config, ...partial };
    saveConfig(updated);
    set({ config: updated });
  },

  isConfigured: () => {
    const effective = mergeWithDefaults(get().config);
    return effective.apiKey !== '';
  },

  getEffectiveConfig: () => {
    return mergeWithDefaults(get().config);
  },
}));
