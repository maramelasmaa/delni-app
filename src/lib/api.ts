import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../constants/api';
import { queryClient } from './queryClient';
import { useAuthStore } from '../store/auth';

export { TOKEN_KEY };
let isHandlingUnauthorized = false;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url} auth:${!!token}`);
  }
  return config;
});

async function handleUnauthorizedResponse() {
  if (isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;

  try {
    await useAuthStore.getState().clearAuth();
    queryClient.clear();
  } finally {
    isHandlingUnauthorized = false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await handleUnauthorizedResponse();
    }
    return Promise.reject(error);
  },
);

export default api;
