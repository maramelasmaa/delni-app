const DEV_API_BASE_URL = 'https://delni.ly/api/v1';
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
    report: (profileId: string | number) => `/providers/${profileId}/report`,
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
  provider: {
    dashboard: '/provider/dashboard',
    profile: '/provider/profile',
    reviews: '/provider/reviews',
    portfolio: '/provider/portfolio',
    portfolioItem: (id: number) => `/provider/portfolio/${id}`,
    credentials: '/provider/credentials',
    credential: (id: number) => `/provider/credentials/${id}`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    broadcast: '/admin/notifications/broadcast',
    reviews: '/admin/reviews',
    moderateReview: (id: number) => `/admin/reviews/${id}/moderate`,
    reviewFlagDecision: (id: number) => `/admin/reviews/${id}/flag-decision`,
    deleteReview: (id: number) => `/admin/reviews/${id}`,
    suspendUser: (id: number) => `/admin/users/${id}/suspend`,
    providerReports: '/admin/provider-reports',
    resolveProviderReport: (reportId: number) => `/admin/provider-reports/${reportId}/resolve`,
  },
  notifications: {
    registerDevice: '/notifications/devices',
    unregisterDevice: '/notifications/devices',
  },
  favorites: {
    index: '/favorites',
    store: (slug: string) => `/favorites/${slug}`,
    destroy: (slug: string) => `/favorites/${slug}`,
  },
};

