import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  autoplay: boolean;
  skipIntro: boolean;
  saveProgress: boolean;
  quality: string;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoplay: true,
      skipIntro: false,
      saveProgress: true,
      quality: '1080p',
      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'omozoku-settings',
    }
  )
);
