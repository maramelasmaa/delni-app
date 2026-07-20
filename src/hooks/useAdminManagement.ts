import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import * as adminService from '../services/admin';
import type {
  AdminCatalogFilters,
  AdminCatalogInput,
  AdminCatalogKind,
  AdminProviderInput,
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
  const query = useInfiniteQuery({
    queryKey: ['admin-users', filters],
    queryFn: ({ pageParam }) => adminService.getUsers({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    enabled,
    retry: false,
  });

  return {
    ...query,
    users: query.data?.pages.flatMap((page) => page.users) ?? [],
    pagination: query.data?.pages[query.data.pages.length - 1]?.pagination,
  };
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
  const query = useInfiniteQuery({
    queryKey: ['admin-providers', filters],
    queryFn: ({ pageParam }) => adminService.getProviders({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    enabled,
    retry: false,
  });

  return {
    ...query,
    providers: query.data?.pages.flatMap((page) => page.providers) ?? [],
    pagination: query.data?.pages[query.data.pages.length - 1]?.pagination,
  };
}

export function useAdminProvider(id?: number) {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-provider', id],
    queryFn: () => adminService.getProvider(id as number),
    enabled: enabled && !!id,
    retry: false,
  });
}

export function useAdminProviderMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-provider'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (input: AdminProviderInput) => adminService.createProvider(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminProviderInput }) =>
      adminService.updateProvider(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminService.deleteProvider(id),
    onSuccess: invalidate,
  });

  const extendAccess = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      adminService.extendProviderAccess(id, days),
    onSuccess: invalidate,
  });

  const clearSecurityFlag = useMutation({
    mutationFn: (id: number) => adminService.clearProviderSecurityFlag(id),
    onSuccess: invalidate,
  });

  const onboardingLink = useMutation({
    mutationFn: (id: number) => adminService.generateProviderOnboardingLink(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, extendAccess, clearSecurityFlag, onboardingLink };
}

export function useAdminProviderReports(userId?: number, enabled = false) {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: ['admin-provider-reports', userId],
    queryFn: () => adminService.getProviderReports(userId as number),
    enabled: isAdmin && !!userId && enabled,
    retry: false,
  });
}

export function useResolveProviderReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      reportId,
      decision,
      resolutionNote,
    }: {
      userId: number;
      reportId: number;
      decision: 'resolve' | 'dismiss';
      resolutionNote?: string;
    }) => adminService.resolveProviderReport(userId, reportId, decision, resolutionNote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-provider'] });
      queryClient.invalidateQueries({ queryKey: ['admin-provider-reports', variables.userId] });
    },
  });
}

export function useAdminCatalog(kind: AdminCatalogKind, filters: AdminCatalogFilters) {
  const enabled = useIsAdmin();
  const query = useInfiniteQuery({
    queryKey: ['admin-catalog', kind, filters],
    queryFn: ({ pageParam }) => adminService.getCatalog(kind, { ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    enabled,
    retry: false,
  });

  return {
    ...query,
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    pagination: query.data?.pages[query.data.pages.length - 1]?.pagination,
  };
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
  const query = useInfiniteQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: ({ pageParam }) => adminService.getReviews({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    enabled,
    retry: false,
  });

  return {
    ...query,
    reviews: query.data?.pages.flatMap((page) => page.reviews) ?? [],
    pagination: query.data?.pages[query.data.pages.length - 1]?.pagination,
  };
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
