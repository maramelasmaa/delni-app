import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/auth';
import type { ApiResponse, AuthCredentials, RegisterData, User } from '../types';
import { ENDPOINTS } from '../constants/api';
import { showNativeAlert } from '../utils/themedAlert';

function resolveRedirectTarget(redirectTo?: string, user?: User) {
  // Must be an in-app absolute path. Reject protocol-relative ("//host") and
  // scheme-like values so a crafted redirectTo can never point off-app.
  const isSafeInAppPath =
    !!redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//');

  if (isSafeInAppPath) return redirectTo;

  if (user?.is_admin) return '/(admin)/';
  return user?.is_provider ? '/(provider)/' : '/(tabs)/';
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async ({ redirectTo: _redirectTo, ...credentials }: AuthCredentials & { redirectTo?: string }) => {
      const res = await api.post<ApiResponse<{ user: User; token: string }>>(
        ENDPOINTS.auth.login,
        credentials,
      );
      return res.data.data;
    },
    onSuccess: async ({ user, token }, variables) => {
      await setAuth(user, token);
      queryClient.clear();
      requestAnimationFrame(() => {
        router.replace(resolveRedirectTarget(variables.redirectTo, user) as never);
      });
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async ({ redirectTo: _redirectTo, ...data }: RegisterData & { redirectTo?: string }) => {
      const res = await api.post<ApiResponse<{ user: User; token: string }>>(
        ENDPOINTS.auth.register,
        data,
      );
      return res.data.data;
    },
    onSuccess: async ({ user, token }, variables) => {
      await setAuth(user, token);
      queryClient.clear();
      requestAnimationFrame(() => {
        router.replace(resolveRedirectTarget(variables.redirectTo, user) as never);
      });
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => {
      await api.post(ENDPOINTS.auth.logout);
    },
    onSettled: async () => {
      await clearAuth();
      queryClient.clear();
      requestAnimationFrame(() => {
        router.replace('/(auth)/login');
      });
    },
  });
}

interface UseMeOptions {
  enabled?: boolean;
}

export function useMe(options?: UseMeOptions) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>(ENDPOINTS.auth.me);
      setUser(res.data.data);
      return res.data.data;
    },
    enabled: options?.enabled ?? isAuthenticated,
    retry: false,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post(ENDPOINTS.auth.forgotPassword, { email });
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; email: string; password: string; password_confirmation: string }) => {
      const res = await api.post(ENDPOINTS.auth.resetPassword, data);
      return res.data;
    },
    onSuccess: () => {
      requestAnimationFrame(() => {
        router.replace('/(auth)/login');
      });
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (data: Partial<{ name: string; phone: string; email: string }>) => {
      const res = await api.patch<ApiResponse<User>>(ENDPOINTS.auth.updateProfile, data);
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { current_password: string; password: string; password_confirmation: string }) => {
      const res = await api.post(ENDPOINTS.auth.changePassword, data);
      return res.data;
    },
  });
}

export function useDeleteAccount() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => {
      await api.delete(ENDPOINTS.auth.deleteAccount);
    },
    onSuccess: async () => {
      await clearAuth();
      queryClient.clear();
      requestAnimationFrame(() => {
        router.replace('/(auth)/login');
      });
    },
    onError: () => {
      showNativeAlert(
        'تعذر حذف الحساب',
        'لم نتمكن من حذف الحساب الآن. تحقق من اتصالك وحاول مرة أخرى.',
      );
    },
  });
}

