import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../constants/api';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { AdminDashboardData, ApiResponse } from '../types';

export function useAdminDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdminDashboardData>>(ENDPOINTS.admin.dashboard);
      return res.data.data;
    },
    enabled: isAuthenticated && !!user?.is_admin,
    retry: false,
  });
}
