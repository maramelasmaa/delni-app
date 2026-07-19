import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import type {
  AdminReview,
  AdminUser,
  ApiResponse,
  PaginationMeta,
  Provider,
} from '../types';

export interface AdminUserFilters {
  search?: string;
  role?: 'provider' | 'user' | 'super_admin';
  suspended?: boolean;
  active?: boolean;
  page?: number;
}

export async function getUsers(filters: AdminUserFilters = {}) {
  const res = await api.get<ApiResponse<AdminUser[]> & { pagination: PaginationMeta }>(
    ENDPOINTS.admin.users,
    { params: filters },
  );
  return { users: res.data.data, pagination: res.data.pagination };
}

export async function suspendUser(id: number, reason: string): Promise<AdminUser> {
  const res = await api.post<ApiResponse<AdminUser>>(ENDPOINTS.admin.suspendUser(id), {
    suspension_reason: reason,
  });
  return res.data.data;
}

export async function reinstateUser(id: number, reason: string): Promise<AdminUser> {
  const res = await api.post<ApiResponse<AdminUser>>(ENDPOINTS.admin.reinstateUser(id), {
    reinstatement_reason: reason,
  });
  return res.data.data;
}

export interface AdminProviderFilters {
  search?: string;
  complete?: boolean;
  page?: number;
}

export async function getProviders(filters: AdminProviderFilters = {}) {
  const res = await api.get<ApiResponse<Provider[]> & { pagination: PaginationMeta }>(
    ENDPOINTS.admin.providers,
    { params: filters },
  );
  return { providers: res.data.data, pagination: res.data.pagination };
}

export interface AdminReviewFilters {
  status?: 'pending' | 'approved' | 'rejected';
  flagged?: boolean;
  page?: number;
}

export async function getReviews(filters: AdminReviewFilters = {}) {
  const res = await api.get<ApiResponse<AdminReview[]> & { pagination: PaginationMeta }>(
    ENDPOINTS.admin.reviews,
    { params: filters },
  );
  return { reviews: res.data.data, pagination: res.data.pagination };
}

export async function moderateReview(
  id: number,
  status: 'approved' | 'rejected',
  note?: string,
): Promise<AdminReview> {
  const res = await api.post<ApiResponse<AdminReview>>(ENDPOINTS.admin.moderateReview(id), {
    status,
    moderation_note: note,
  });
  return res.data.data;
}

export async function resolveReviewFlag(
  id: number,
  decision: 'accept' | 'reject',
  note?: string,
): Promise<AdminReview> {
  const res = await api.post<ApiResponse<AdminReview>>(ENDPOINTS.admin.reviewFlagDecision(id), {
    decision,
    moderation_note: note,
  });
  return res.data.data;
}

export async function deleteReview(id: number, note?: string): Promise<void> {
  await api.delete(ENDPOINTS.admin.deleteReview(id), {
    data: note ? { moderation_note: note } : undefined,
  });
}
