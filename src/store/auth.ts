import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { TOKEN_KEY } from '../constants/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  finishBootstrap: () => void;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  hasHydrated: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ user, token, isAuthenticated: true, hasHydrated: true, isLoading: false });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false, hasHydrated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  finishBootstrap: () => set({ hasHydrated: true, isLoading: false }),

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
