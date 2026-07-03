import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useProvider, useProviderReviews, useToggleFavorite } from './useApi';
import { useAuthStore } from '../store/auth';
import type { Review } from '../types';
import { mapProviderProfile } from '../utils/providerMappers';
import { mergeUniqueById } from '../utils/searchFilters';
import { openExternalUrl } from '../utils/links';

export function useProviderDetail(slug: string) {
  // Data fetching
  const { data: provider, isLoading, isError, error, refetch } = useProvider(slug);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const toggleFavorite = useToggleFavorite();

  // Review pagination
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const { data: reviewsData, isFetching: isFetchingReviews } = useProviderReviews(slug, reviewPage);

  // Reset on slug change without mutating state during render.
  useEffect(() => {
    setReviewPage(1);
    setAllReviews([]);
  }, [slug]);

  // Accumulate reviews
  useEffect(() => {
    const fresh = reviewsData?.data;
    if (!fresh?.length) return;
    setAllReviews((prev) =>
      reviewPage === 1 ? fresh : mergeUniqueById(prev, fresh)
    );
  }, [reviewsData?.data, reviewPage]);

  // Derived data
  const profile = useMemo(
    () => (provider ? mapProviderProfile(provider) : null),
    [provider]
  );
  const reviewPagination = reviewsData?.pagination;
  const hasMoreReviews =
    reviewPagination ? reviewPagination.current_page < reviewPagination.last_page : false;

  // Handlers
  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      requestAnimationFrame(() => {
        router.push({ pathname: '/(auth)/login', params: { redirectTo: `/provider/${String(slug)}` } });
      });
      return;
    }
    if (provider) {
      toggleFavorite.mutate({ slug: String(slug), isFavorited: !!provider.is_favorited });
    }
  }, [isAuthenticated, slug, provider, toggleFavorite]);

  const handleWhatsApp = useCallback(() => {
    if (provider?.whatsapp_url) {
      openExternalUrl(provider.whatsapp_url, { errorMessage: 'تعذر فتح واتساب، تأكد من تثبيت التطبيق.' });
    }
  }, [provider?.whatsapp_url]);

  const handlePhone = useCallback(() => {
    if (provider?.phone) {
      openExternalUrl(`tel:${provider.phone}`, { errorMessage: 'تعذر إجراء الاتصال.' });
    }
  }, [provider?.phone]);

  return {
    // Loading states
    isLoading,
    isError,
    error,
    refetch,

    // Data
    provider,
    profile,
    isAuthenticated,
    user,

    // Reviews
    allReviews,
    reviewPage,
    setReviewPage,
    hasMoreReviews,
    isFetchingReviews,

    // Handlers
    handleFavorite,
    handleWhatsApp,
    handlePhone,
  };
}
