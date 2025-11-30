import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AISettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

type AISettingsState = {
  settings: AISettings;
  updateSettings: (settings: Partial<AISettings>) => void;
  resetSettings: () => void;
};

const defaultSettings: AISettings = {
  // Leave empty so that the server can fall back to its own default
  // OPENAI_BASE_URL / OPENAI_MODEL when the user has not provided overrides.
  baseUrl: '',
  apiKey: '',
  model: '',
};

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'ai-settings-storage',
    }
  )
);
