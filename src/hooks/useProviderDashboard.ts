import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../constants/api';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { ApiResponse, ProviderDashboardData } from '../types';

export function useProviderDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProviderDashboardData>>(ENDPOINTS.provider.dashboard);
      return res.data.data;
    },
    enabled: isAuthenticated && !!user?.is_provider,
    retry: false,
  });
}
