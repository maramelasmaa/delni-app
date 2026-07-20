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
    users: '/admin/users',
    suspendUser: (id: number) => `/admin/users/${id}/suspend`,
    reinstateUser: (id: number) => `/admin/users/${id}/reinstate`,
    providers: '/admin/providers',
    provider: (id: number) => `/admin/providers/${id}`,
    extendProviderAccess: (id: number) => `/admin/providers/${id}/extend-access`,
    providerOnboardingLink: (id: number) => `/admin/providers/${id}/onboarding-link`,
    clearProviderSecurityFlag: (id: number) => `/admin/providers/${id}/clear-security-flag`,
    providerReports: (userId: number) => `/admin/providers/${userId}/reports`,
    resolveProviderReport: (userId: number, reportId: number) => `/admin/providers/${userId}/reports/${reportId}/resolve`,
    categories: '/admin/categories',
    category: (id: number) => `/admin/categories/${id}`,
    subcategories: '/admin/subcategories',
    subcategory: (id: number) => `/admin/subcategories/${id}`,
    cities: '/admin/cities',
    city: (id: number) => `/admin/cities/${id}`,
    providerTypes: '/admin/provider-types',
    providerType: (id: number) => `/admin/provider-types/${id}`,
    reviews: '/admin/reviews',
    moderateReview: (id: number) => `/admin/reviews/${id}/moderate`,
    reviewFlagDecision: (id: number) => `/admin/reviews/${id}/flag-decision`,
    deleteReview: (id: number) => `/admin/reviews/${id}`,
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

