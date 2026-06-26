import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const CITY_KEY = 'delni_active_city';

export interface ActiveCity {
  id: number;
  slug: string;
  name: string;
}

interface CityState {
  activeCity: ActiveCity | null;
  hasHydrated: boolean;
  setCity: (city: ActiveCity | null) => void;
  hydrate: () => Promise<void>;
}

export const useCityStore = create<CityState>((set) => ({
  activeCity: null,
  hasHydrated: false,

  setCity: (city) => {
    set({ activeCity: city });
    if (city) {
      SecureStore.setItemAsync(CITY_KEY, JSON.stringify(city)).catch(() => {});
    } else {
      SecureStore.deleteItemAsync(CITY_KEY).catch(() => {});
    }
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(CITY_KEY);
      if (raw) {
        const city = JSON.parse(raw) as ActiveCity;
        set({ activeCity: city, hasHydrated: true });
        return;
      }
    } catch {
      // Corrupt storage — start with no city
    }
    set({ hasHydrated: true });
  },
}));
