const DEV_API_BASE_URL = 'http://192.168.20.54:8000/api/v1';
const PROD_API_BASE_URL = 'https://delni.ly/api/v1';

// Expo inlines EXPO_PUBLIC_* variables at bundle time. Keep a safe production
// fallback so a misconfigured release build never points at a local emulator.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL);

export const TOKEN_KEY = 'delni_auth_token';

export const ENDPOINTS = {
  home: '/home',
  cities: '/cities',
  providerTypes: '/provider-types',
  contact: '/contact',
  categories: '/categories',
  category: (slug: string) => `/categories/${slug}`,
  subcategory: (slug: string) => `/subcategories/${slug}`,
  search: '/search',
  searchSuggestions: '/search/suggestions',
  providers: {
    topRated: '/top-rated',
    show: (slug: string) => `/providers/${slug}`,
    reviews: (slug: string) => `/providers/${slug}/reviews`,
    storeReview: (slug: string) => `/providers/${slug}/reviews`,
    flagReview: (id: number) => `/reviews/${id}/flag`,
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    updateProfile: '/auth/profile',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    deleteAccount: '/auth/account',
  },
  favorites: {
    index: '/favorites',
    store: (slug: string) => `/favorites/${slug}`,
    destroy: (slug: string) => `/favorites/${slug}`,
  },
};
