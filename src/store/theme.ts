import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const THEME_KEY = 'delni_theme_preference';

/** User's explicit choice. 'system' follows the OS appearance. */
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  hasHydrated: boolean;
  setPreference: (pref: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  hasHydrated: false,

  setPreference: (preference) => {
    set({ preference });
    SecureStore.setItemAsync(THEME_KEY, preference).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(THEME_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        set({ preference: raw, hasHydrated: true });
        return;
      }
    } catch {
      // Corrupt storage — fall back to system
    }
    set({ hasHydrated: true });
  },
}));
