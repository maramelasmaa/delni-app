import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useProvider, useProviderReviews, useToggleFavorite } from './useApi';
import { useAuthStore } from '../store/auth';
import type { Review } from '../types';
import { mapProviderProfile } from '../utils/providerMappers';

export function useProviderDetail(slug: string) {
  // Data fetching
  const { data: provider, isLoading, isError, refetch } = useProvider(slug);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const toggleFavorite = useToggleFavorite();

  // Review pagination
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const prevSlugRef = useRef(slug);
  const { data: reviewsData, isFetching: isFetchingReviews } = useProviderReviews(slug, reviewPage);

  // Reset on slug change
  if (prevSlugRef.current !== slug) {
    prevSlugRef.current = slug;
    setReviewPage(1);
    setAllReviews([]);
  }

  // Accumulate reviews
  useEffect(() => {
    const fresh = reviewsData?.data;
    if (!fresh?.length) return;
    setAllReviews((prev) =>
      reviewPage === 1 ? fresh : [...prev, ...fresh.filter((r) => !prev.some((x) => x.id === r.id))]
    );
  }, [reviewsData?.data, reviewPage]);

  // Derived data
  const profile = provider ? mapProviderProfile(provider) : null;
  const reviewPagination = reviewsData?.pagination;
  const hasMoreReviews =
    reviewPagination ? reviewPagination.current_page < reviewPagination.last_page : false;

  // Handlers
  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirectTo: `/provider/${String(slug)}` } });
      return;
    }
    if (provider) {
      toggleFavorite.mutate({ slug: String(slug), isFavorited: !!provider.is_favorited });
    }
  }, [isAuthenticated, slug, provider, toggleFavorite]);

  const handleWhatsApp = useCallback(() => {
    if (provider?.whatsapp_url) {
      // openExternalUrl call would go here
    }
  }, [provider?.whatsapp_url]);

  const handlePhone = useCallback(() => {
    if (provider?.phone) {
      // openExternalUrl call would go here
    }
  }, [provider?.phone]);

  return {
    // Loading states
    isLoading,
    isError,
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
