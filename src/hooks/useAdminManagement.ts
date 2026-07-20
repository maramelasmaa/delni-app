import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import * as adminService from '../services/admin';
import type { AdminReviewFilters } from '../services/admin';

function useIsAdmin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return isAuthenticated && !!user?.is_admin;
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

export function useAdminFlaggedReviews() {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-reviews-flagged'],
    queryFn: () => adminService.getReviews({ flagged: true, per_page: 100 }),
    enabled,
    retry: false,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminService.suspendUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
  });
}

export function useAdminOpenProviderReports() {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: ['admin-provider-reports'],
    queryFn: () => adminService.getOpenProviderReports(),
    enabled,
    retry: false,
  });
}

export function useResolveProviderReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      decision,
      resolutionNote,
    }: {
      reportId: number;
      decision: 'resolve' | 'dismiss';
      resolutionNote?: string;
    }) => adminService.resolveProviderReport(reportId, decision, resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}
