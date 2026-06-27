import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import { useAuthStore } from '../store/auth';
import type {
  ApiResponse,
  Category,
  CategoryDetailData,
  City,
  ContactInfo,
  HomeData,
  PaginatedData,
  Provider,
  Review,
  SearchFilters,
  SubcategoryDetailData,
  ProviderType,
} from '../types';

function requirePagination<T>(response: ApiResponse<T>, endpoint: string) {
  if (!response.pagination) {
    throw new Error(`Missing pagination metadata for ${endpoint}`);
  }

  return response.pagination;
}

export function useHome(city?: string) {
  return useQuery({
    queryKey: ['home', city ?? null],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HomeData>>(ENDPOINTS.home, {
        params: city ? { city } : undefined,
      });
      return res.data.data;
    },
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<City[]>>(ENDPOINTS.cities);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useProviderTypes() {
  return useQuery({
    queryKey: ['provider-types'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProviderType[]>>(ENDPOINTS.providerTypes);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>(ENDPOINTS.categories);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useCategory(slug: string, page = 1, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['category', slug, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CategoryDetailData>>(
        ENDPOINTS.category(slug),
        { params: { page } },
      );
      return res.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled && !!slug : !!slug,
  });
}

export function useSubcategory(slug: string, page = 1, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['subcategory', slug, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SubcategoryDetailData>>(
        ENDPOINTS.subcategory(slug),
        { params: { page } },
      );
      return res.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled && !!slug : !!slug,
  });
}

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ suggestions: string[] }>>(
        ENDPOINTS.searchSuggestions,
        { params: { q } },
      );
      return res.data.data.suggestions ?? [];
    },
    enabled: q.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== '' && v !== false && v !== 0)
          .map(([key, value]) => [key, key === 'remote' && value === true ? 1 : value]),
      );
      const res = await api.get<ApiResponse<Provider[]>>(ENDPOINTS.search, { params });
      return {
        data: res.data.data,
        pagination: requirePagination(res.data, ENDPOINTS.search),
      } satisfies PaginatedData<Provider>;
    },
    enabled: true,
  });
}

export function useTopRated(params?: { city?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: ['top-rated', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Provider[]>>(ENDPOINTS.providers.topRated, { params });
      return {
        data: res.data.data,
        pagination: requirePagination(res.data, ENDPOINTS.providers.topRated),
      } satisfies PaginatedData<Provider>;
    },
  });
}

export function useProvider(slug: string) {
  return useQuery({
    queryKey: ['provider', slug],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Provider>>(ENDPOINTS.providers.show(slug));
      return res.data.data;
    },
    enabled: !!slug,
    staleTime: 0, // Always fetch fresh — ensures new fields like offers_remote_work are picked up
  });
}

export function useProviderReviews(slug: string, page = 1) {
  return useQuery({
    queryKey: ['provider-reviews', slug, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Review[]>>(ENDPOINTS.providers.reviews(slug), {
        params: { page },
      });
      return {
        data: res.data.data,
        pagination: requirePagination(res.data, ENDPOINTS.providers.reviews(slug)),
      } satisfies PaginatedData<Review>;
    },
    enabled: !!slug,
  });
}

export function useFavorites(page = 1) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['favorites', page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Provider[]>>(ENDPOINTS.favorites.index, {
        params: { page },
      });
      return {
        data: res.data.data,
        pagination: requirePagination(res.data, ENDPOINTS.favorites.index),
      } satisfies PaginatedData<Provider>;
    },
    enabled: isAuthenticated,
  });
}

export function useContact() {
  return useQuery({
    queryKey: ['contact'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ContactInfo>>(ENDPOINTS.contact);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, isFavorited }: { slug: string; isFavorited: boolean }) => {
      if (isFavorited) {
        await api.delete(ENDPOINTS.favorites.destroy(slug));
      } else {
        await api.post(ENDPOINTS.favorites.store(slug));
      }
    },
    onMutate: async ({ slug, isFavorited }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['favorites'] });
      await qc.cancelQueries({ queryKey: ['home'] });
      await qc.cancelQueries({ queryKey: ['top-rated'] });
      await qc.cancelQueries({ queryKey: ['search'] });
      await qc.cancelQueries({ queryKey: ['category'] });
      await qc.cancelQueries({ queryKey: ['subcategory'] });

      // Snapshot the previous values across all pages/caches
      const previousFavorites = qc.getQueriesData<PaginatedData<Provider>>({ queryKey: ['favorites'] });
      const previousHome = qc.getQueriesData<HomeData>({ queryKey: ['home'] });
      const previousTopRated = qc.getQueriesData<PaginatedData<Provider>>({ queryKey: ['top-rated'] });
      const previousSearch = qc.getQueriesData<PaginatedData<Provider>>({ queryKey: ['search'] });
      const previousCategory = qc.getQueriesData<CategoryDetailData>({ queryKey: ['category'] });
      const previousSubcategory = qc.getQueriesData<SubcategoryDetailData>({ queryKey: ['subcategory'] });
      const previousProvider = qc.getQueryData<Provider>(['provider', slug]);

      // 1. Update favorites queries
      qc.setQueriesData<PaginatedData<Provider>>({ queryKey: ['favorites'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: isFavorited
            ? oldData.data.filter((p) => p.slug !== slug)
            : oldData.data,
        };
      });

      // 2. Update home queries
      qc.setQueriesData<HomeData>({ queryKey: ['home'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          featured_providers: oldData.featured_providers?.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ) ?? [],
          suggested_providers: oldData.suggested_providers?.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ) ?? [],
        };
      });

      // 3. Update top-rated queries
      qc.setQueriesData<PaginatedData<Provider>>({ queryKey: ['top-rated'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ),
        };
      });

      // 4. Update search queries
      qc.setQueriesData<PaginatedData<Provider>>({ queryKey: ['search'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ),
        };
      });

      // 5. Update category queries
      qc.setQueriesData<CategoryDetailData>({ queryKey: ['category'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          providers: oldData.providers.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ),
        };
      });

      // 6. Update subcategory queries
      qc.setQueriesData<SubcategoryDetailData>({ queryKey: ['subcategory'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          providers: oldData.providers.map((p) =>
            p.slug === slug ? { ...p, is_favorited: !isFavorited } : p
          ),
        };
      });

      // 7. Update individual provider query if cached
      if (previousProvider) {
        qc.setQueryData<Provider>(['provider', slug], {
          ...previousProvider,
          is_favorited: !isFavorited,
        });
      }

      return {
        previousFavorites,
        previousHome,
        previousTopRated,
        previousSearch,
        previousCategory,
        previousSubcategory,
        previousProvider,
      };
    },
    onError: (err, newTodo, context) => {
      // Rollback favorites lists
      if (context?.previousFavorites) {
        context.previousFavorites.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback home lists
      if (context?.previousHome) {
        context.previousHome.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback top-rated lists
      if (context?.previousTopRated) {
        context.previousTopRated.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback search lists
      if (context?.previousSearch) {
        context.previousSearch.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback category lists
      if (context?.previousCategory) {
        context.previousCategory.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback subcategory lists
      if (context?.previousSubcategory) {
        context.previousSubcategory.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      // Rollback individual provider
      if (context?.previousProvider) {
        qc.setQueryData(['provider', context.previousProvider.slug], context.previousProvider);
      }
    },
    onSettled: async (_data, _error, { slug }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['favorites'] }),
        qc.invalidateQueries({ queryKey: ['provider', slug] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
        qc.invalidateQueries({ queryKey: ['search'] }),
        qc.invalidateQueries({ queryKey: ['top-rated'] }),
        qc.invalidateQueries({ queryKey: ['category'] }),
        qc.invalidateQueries({ queryKey: ['subcategory'] }),
      ]);
    },
  });
}

/** Report (flag) a review for objectionable content — App Store Guideline 1.2 UGC moderation. */
export function useFlagReview() {
  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: number; reason: string }) => {
      const res = await api.post(ENDPOINTS.providers.flagReview(reviewId), { reason });
      return res.data;
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, rating, comment }: { slug: string; rating: number; comment: string }) => {
      const res = await api.post(ENDPOINTS.providers.storeReview(slug), { rating, comment });
      return res.data;
    },
    onSuccess: async (_data, { slug }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['provider-reviews', slug] }),
        qc.invalidateQueries({ queryKey: ['provider', slug] }),
        qc.invalidateQueries({ queryKey: ['home'] }),
        qc.invalidateQueries({ queryKey: ['search'] }),
        qc.invalidateQueries({ queryKey: ['top-rated'] }),
        qc.invalidateQueries({ queryKey: ['category'] }),
        qc.invalidateQueries({ queryKey: ['subcategory'] }),
        qc.invalidateQueries({ queryKey: ['favorites'] }),
      ]);
    },
  });
}
