import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import type {
  AdminReview,
  AdminUser,
  AdminProviderDetail,
  ApiResponse,
  PaginationMeta,
  Provider,
  ProviderReport,
} from '../types';

export type AdminCatalogKind = 'categories' | 'subcategories' | 'cities' | 'providerTypes';

export interface AdminCatalogItem {
  id: number;
  name: string;
  name_ar?: string | null;
  localized_name?: string | null;
  slug?: string | null;
  code?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  search_name?: string | null;
  icon?: string | null;
  sort_order?: number | null;
  is_active: boolean;
  profiles_count?: number | null;
  subcategories_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type AdminCatalogInput = Partial<Pick<AdminCatalogItem, 'name' | 'name_ar' | 'slug' | 'code' | 'category_id' | 'search_name' | 'icon' | 'sort_order' | 'is_active'>>;

export interface AdminCatalogFilters {
  search?: string;
  category_id?: number;
  page?: number;
}

const catalogEndpoint = (kind: AdminCatalogKind) => {
  switch (kind) {
    case 'categories':
      return ENDPOINTS.admin.categories;
    case 'subcategories':
      return ENDPOINTS.admin.subcategories;
    case 'cities':
      return ENDPOINTS.admin.cities;
    case 'providerTypes':
      return ENDPOINTS.admin.providerTypes;
  }
};

const catalogItemEndpoint = (kind: AdminCatalogKind, id: number) => {
  switch (kind) {
    case 'categories':
      return ENDPOINTS.admin.category(id);
    case 'subcategories':
      return ENDPOINTS.admin.subcategory(id);
    case 'cities':
      return ENDPOINTS.admin.city(id);
    case 'providerTypes':
      return ENDPOINTS.admin.providerType(id);
  }
};

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

export interface AdminProviderInput {
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  is_active?: boolean;
  is_suspended?: boolean;
  business_name?: string | null;
  provider_type?: string | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  city_id?: number | null;
  bio?: string | null;
  profile_phone?: string | null;
  whatsapp?: string | null;
  offers_remote_work?: boolean;
  travels_to_cities?: boolean;
  service_area_note?: string | null;
  map_url?: string | null;
  website?: string | null;
  instagram_handle?: string | null;
  facebook_slug?: string | null;
  linkedin_slug?: string | null;
  github_username?: string | null;
  experience_years?: number | null;
  provider_access_ends_at?: string | null;
  has_venue_calendar?: boolean;
  homepage_featured?: boolean;
  homepage_featured_until?: string | null;
}

export async function getProviders(filters: AdminProviderFilters = {}) {
  const res = await api.get<ApiResponse<Provider[]> & { pagination: PaginationMeta }>(
    ENDPOINTS.admin.providers,
    { params: filters },
  );
  return { providers: res.data.data, pagination: res.data.pagination };
}

export async function getProvider(id: number): Promise<AdminProviderDetail> {
  const res = await api.get<ApiResponse<AdminProviderDetail>>(ENDPOINTS.admin.provider(id));
  return res.data.data;
}

export async function createProvider(input: AdminProviderInput): Promise<AdminProviderDetail> {
  const res = await api.post<ApiResponse<AdminProviderDetail>>(ENDPOINTS.admin.providers, input);
  return res.data.data;
}

export async function updateProvider(id: number, input: AdminProviderInput): Promise<AdminProviderDetail> {
  const res = await api.patch<ApiResponse<AdminProviderDetail>>(ENDPOINTS.admin.provider(id), input);
  return res.data.data;
}

export async function deleteProvider(id: number): Promise<void> {
  await api.delete(ENDPOINTS.admin.provider(id));
}

export async function extendProviderAccess(id: number, days: number): Promise<AdminProviderDetail> {
  const res = await api.post<ApiResponse<AdminProviderDetail>>(ENDPOINTS.admin.extendProviderAccess(id), { days });
  return res.data.data;
}

export async function clearProviderSecurityFlag(id: number): Promise<AdminProviderDetail> {
  const res = await api.post<ApiResponse<AdminProviderDetail>>(ENDPOINTS.admin.clearProviderSecurityFlag(id));
  return res.data.data;
}

export async function generateProviderOnboardingLink(id: number): Promise<{ setup_url: string; provider: AdminProviderDetail }> {
  const res = await api.post<ApiResponse<{ setup_url: string; provider: AdminProviderDetail }>>(ENDPOINTS.admin.providerOnboardingLink(id));
  return res.data.data;
}

export async function getCatalog(kind: AdminCatalogKind, filters: AdminCatalogFilters = {}) {
  const res = await api.get<ApiResponse<{ items: AdminCatalogItem[]; pagination: PaginationMeta }>>(
    catalogEndpoint(kind),
    { params: filters },
  );
  return res.data.data;
}

export async function createCatalogItem(kind: AdminCatalogKind, input: AdminCatalogInput): Promise<AdminCatalogItem> {
  const res = await api.post<ApiResponse<AdminCatalogItem>>(catalogEndpoint(kind), input);
  return res.data.data;
}

export async function updateCatalogItem(kind: AdminCatalogKind, id: number, input: AdminCatalogInput): Promise<AdminCatalogItem> {
  const res = await api.patch<ApiResponse<AdminCatalogItem>>(catalogItemEndpoint(kind, id), input);
  return res.data.data;
}

export async function deleteCatalogItem(kind: AdminCatalogKind, id: number): Promise<void> {
  await api.delete(catalogItemEndpoint(kind, id));
}

export async function getProviderReports(userId: number): Promise<ProviderReport[]> {
  const res = await api.get<ApiResponse<ProviderReport[]>>(ENDPOINTS.admin.providerReports(userId));
  return res.data.data;
}

export async function resolveProviderReport(
  userId: number,
  reportId: number,
  decision: 'resolve' | 'dismiss',
  resolutionNote?: string,
): Promise<ProviderReport> {
  const res = await api.post<ApiResponse<ProviderReport>>(ENDPOINTS.admin.resolveProviderReport(userId, reportId), {
    decision,
    resolution_note: resolutionNote,
  });
  return res.data.data;
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
