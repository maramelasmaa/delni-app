import type { Provider, SearchFilters } from '../types';

export type RouteParamValue = string | string[] | undefined;

export function getSingleParam(value: RouteParamValue) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function parsePositiveIntegerParam(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return parsed > 0 ? parsed : undefined;
}

export function parseRemoteParam(value?: string) {
  return value === '1' || value === 'true';
}

export function parseSortParam(value?: string): SearchFilters['sort'] {
  return value === 'newest' ? 'newest' : 'rating';
}

export function normalizeSearchFilters(filters: Partial<SearchFilters>): SearchFilters {
  const keyword = filters.keyword?.trim() || undefined;
  const category = filters.category?.trim() || undefined;
  const city = filters.city?.trim() || undefined;
  const providerType = filters.provider_type?.trim() || undefined;

  return {
    keyword,
    category,
    category_id: filters.category_id && filters.category_id > 0 ? filters.category_id : undefined,
    city,
    city_id: filters.city_id && filters.city_id > 0 ? filters.city_id : undefined,
    subcategory: filters.subcategory?.trim() || undefined,
    subcategory_id: filters.subcategory_id && filters.subcategory_id > 0 ? filters.subcategory_id : undefined,
    provider_type: providerType,
    remote: filters.remote === true,
    sort: filters.sort === 'newest' ? 'newest' : 'rating',
    page: filters.page && filters.page > 0 ? filters.page : 1,
    per_page: filters.per_page && filters.per_page > 0 ? filters.per_page : undefined,
  };
}

export function toSearchRouteParams(filters: Partial<SearchFilters>) {
  const normalized = normalizeSearchFilters(filters);

  return {
    keyword: normalized.keyword,
    category: normalized.category,
    category_id: normalized.category_id ? String(normalized.category_id) : undefined,
    city: normalized.city,
    city_id: normalized.city_id ? String(normalized.city_id) : undefined,
    sort: normalized.sort === 'newest' ? 'newest' : undefined,
    provider_type: normalized.provider_type,
    remote: normalized.remote ? '1' : undefined,
  };
}

export function toSearchRequestParams(filters: Partial<SearchFilters>) {
  const normalized = normalizeSearchFilters(filters);

  return Object.fromEntries(
    Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== '' && value !== false)
      .map(([key, value]) => {
        if (key === 'remote' && value === true) {
          return [key, 1];
        }

        if (key === 'subcategory') {
          return ['service', value];
        }

        return [key, value];
      }),
  );
}

export function mergeUniqueById<T extends { id: number | string }>(previous: T[], fresh: T[]) {
  if (previous.length === 0) {
    return fresh;
  }

  const seen = new Set(previous.map((item) => item.id));
  return [...previous, ...fresh.filter((item) => !seen.has(item.id))];
}

export function mergeUniqueProviders(previous: Provider[], fresh: Provider[]) {
  return mergeUniqueById(previous, fresh);
}
