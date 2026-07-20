import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import type { AdminReview, ApiResponse, PaginationMeta, ProviderReport } from '../types';

export interface AdminReviewFilters {
  status?: 'pending' | 'approved' | 'rejected';
  flagged?: boolean;
  page?: number;
  per_page?: number;
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

export async function suspendUser(id: number, reason: string): Promise<void> {
  await api.post(ENDPOINTS.admin.suspendUser(id), { suspension_reason: reason });
}

export async function getOpenProviderReports(): Promise<ProviderReport[]> {
  const res = await api.get<ApiResponse<ProviderReport[]>>(ENDPOINTS.admin.providerReports, {
    params: { per_page: 100 },
  });
  return res.data.data;
}

export async function resolveProviderReport(
  reportId: number,
  decision: 'resolve' | 'dismiss',
  resolutionNote?: string,
): Promise<ProviderReport> {
  const res = await api.post<ApiResponse<ProviderReport>>(ENDPOINTS.admin.resolveProviderReport(reportId), {
    decision,
    resolution_note: resolutionNote,
  });
  return res.data.data;
}
