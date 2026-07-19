import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import * as adminService from '../services/admin';
import type {
  AdminCatalogFilters,
  AdminCatalogInput,
  AdminCatalogKind,
  AdminProviderFilters,
  AdminReviewFilters,
  AdminUserFilters,
} from '../services/admin';

function useIsAdmin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return isAuthenticated && !!user?.is_admin;
}

export function useAdminUsers(filters: AdminUserFilters) {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminService.getUsers(filters),
    enabled,
    retry: false,
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.suspendUser(id, reason),
    onSuccess: invalidate,
  });

  const reinstate = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.reinstateUser(id, reason),
    onSuccess: invalidate,
  });

  return { suspend, reinstate };
}

export function useAdminProviders(filters: AdminProviderFilters) {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-providers', filters],
    queryFn: () => adminService.getProviders(filters),
    enabled,
    retry: false,
  });
}

export function useAdminCatalog(kind: AdminCatalogKind, filters: AdminCatalogFilters) {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-catalog', kind, filters],
    queryFn: () => adminService.getCatalog(kind, filters),
    enabled,
    retry: false,
  });
}

export function useAdminCatalogMutations(kind: AdminCatalogKind) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['cities'] });
    queryClient.invalidateQueries({ queryKey: ['provider-types'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (input: AdminCatalogInput) => adminService.createCatalogItem(kind, input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminCatalogInput }) => adminService.updateCatalogItem(kind, id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminService.deleteCatalogItem(kind, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useAdminReviews(filters: AdminReviewFilters) {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: () => adminService.getReviews(filters),
    enabled,
    retry: false,
  });
}

export function useAdminReviewMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const moderate = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: 'approved' | 'rejected'; note?: string }) =>
      adminService.moderateReview(id, status, note),
    onSuccess: invalidate,
  });

  const resolveFlag = useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: 'accept' | 'reject'; note?: string }) =>
      adminService.resolveReviewFlag(id, decision, note),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => adminService.deleteReview(id, note),
    onSuccess: invalidate,
  });

  return { moderate, resolveFlag, remove };
}
