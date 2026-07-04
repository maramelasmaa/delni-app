import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { FavoriteAuthModal } from '../../components/ui/FavoriteAuthModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useCategory, useToggleFavorite, useCities, useProviderTypes } from '../../src/hooks/useApi';
import { useFavoriteWithAuth } from '../../src/hooks/useFavoriteWithAuth';
import { usePrefetchImages } from '../../src/hooks/useImagePrefetch';
import { useTheme } from '../../src/hooks/useTheme';
import { useCityStore } from '../../src/store/city';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider, ApiResponse, SearchFilters } from '../../src/types';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { ENDPOINTS } from '../../src/constants/api';
import { rtlRow } from '../../src/utils/rtl';
import { getProviderLogo } from '../../src/utils/imageFallback';
import { PROVIDER_TYPE_FILTER_OPTIONS } from '../../src/utils/providerTypes';
import {
  getSingleParam,
  mergeUniqueProviders,
  normalizeSearchFilters,
  parseRemoteParam,
  parseSortParam,
  toSearchRequestParams,
} from '../../src/utils/searchFilters';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث', icon: 'calendar-outline' },
  { value: 'rating', label: 'الأعلى تقييماً', icon: 'star-outline' },
] as const;

// Shared single source of truth (was a hardcoded copy that drifted from the others).
const FALLBACK_PROVIDER_TYPES = PROVIDER_TYPE_FILTER_OPTIONS;

function toCategoryRouteParams(filters: Partial<SearchFilters>, subcategorySlug?: string) {
  const normalized = normalizeSearchFilters(filters);

  const params: {
    keyword?: string;
    city?: string;
    provider_type?: string;
    remote?: string;
    sort?: string;
    subcategorySlug?: string;
  } = {
    keyword: normalized.keyword,
    city: normalized.city,
    provider_type: normalized.provider_type,
    remote: normalized.remote ? '1' : undefined,
    sort: normalized.sort === 'newest' ? 'newest' : undefined,
  };

  if (subcategorySlug !== undefined) {
    params.subcategorySlug = subcategorySlug;
  }

  return params;
}

export default function CategoryScreen() {
  const { colors } = useTheme();
  const {
    slug,
    subcategorySlug,
    keyword: keywordRouteParam,
    city: cityRouteParam,
    provider_type: providerTypeRouteParam,
    remote: remoteRouteParam,
    sort: sortRouteParam,
  } = useLocalSearchParams<{
    slug: string;
    subcategorySlug?: string;
    keyword?: string;
    city?: string;
    provider_type?: string;
    remote?: string;
    sort?: string;
  }>();
  const toggleFavorite = useToggleFavorite();
  const insets = useSafeAreaInsets();
  const activeCity = useCityStore((s) => s.activeCity);
  const keywordParam = getSingleParam(keywordRouteParam);
  const cityParam = getSingleParam(cityRouteParam);
  const providerTypeParam = getSingleParam(providerTypeRouteParam);
  const remoteParam = getSingleParam(remoteRouteParam);
  const sortParam = getSingleParam(sortRouteParam);
  const routeFilters = normalizeSearchFilters({
    category: slug,
    keyword: keywordParam,
    city: cityParam || undefined,
    provider_type: providerTypeParam,
    remote: parseRemoteParam(remoteParam),
    sort: parseSortParam(sortParam),
    page: 1,
  });
  const { showAuthAlert, handleFavoritePress, handleConfirmLogin, handleDismiss } = useFavoriteWithAuth({
    redirectPath: `/category/${String(slug)}${subcategorySlug ? `?subcategorySlug=${subcategorySlug}` : ''}`,
  });

  const [page, setPage] = useState(1);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const providerTypeScrollRef = useRef<ScrollView>(null);

  const handleProviderTypeContentSizeChange = (width: number) => {
    const timer = setTimeout(() => {
      providerTypeScrollRef.current?.scrollTo({ x: width, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  };

  const isCityInitial = useRef(true);
  const isKeywordInitial = useRef(true);

  // Local filter states
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [keyword, setKeyword] = useState(routeFilters.keyword || '');

  const [filters, setFilters] = useState<SearchFilters>(routeFilters);

  // Always-latest snapshot of filters so the keyword/city effects below can compute
  // the next filter set OUTSIDE the setState updater (updaters must stay pure — see
  // https://react.dev/reference/react/useState) without re-subscribing to `filters`
  // in their dependency arrays (which would defeat the keyword debounce).
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [modalFilters, setModalFilters] = useState<SearchFilters>(routeFilters);

  const { data: cities } = useCities();
  const { data: providerTypes } = useProviderTypes();

  const activeSubcategorySlugs = subcategorySlug && subcategorySlug !== 'null' && subcategorySlug !== 'undefined'
    ? subcategorySlug.split(',').filter((s) => s && s !== 'null' && s !== 'undefined')
    : [];

  // Single active subcategory (0 or 1). "الكل" = none selected.
  const activeSub = activeSubcategorySlugs[0];

  // Category metadata (name + subcategory pills only — NOT the provider list).
  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    error: categoryError,
    refetch: refetchCategory,
  } = useCategory(slug, 1);

  // One source of truth for BOTH the provider list and the header count:
  //   • "الكل"      → /search?category=<slug>              (all providers in the category)
  //   • subcategory → /search?category=<slug>&service=<sub>
  //   • filters     → city/keyword/provider_type/remote/sort layered on top
  // Because the count and the list read the same response, they can never disagree.
  const categoryId = categoryData?.category?.id ?? null;
  const cityId = (cities ?? []).find((c) => c.slug === filters.city)?.id ?? null;
  const subcategoryId = (categoryData?.category?.subcategories ?? []).find((s) => s.slug === activeSub)?.id ?? null;

  const providerParams = normalizeSearchFilters({
    category: slug,
    category_id: categoryId || undefined,
    subcategory: activeSub || undefined,
    subcategory_id: subcategoryId || undefined,
    keyword: filters.keyword || undefined,
    city: filters.city || undefined,
    city_id: cityId || undefined,
    provider_type: filters.provider_type || undefined,
    remote: filters.remote,
    sort: filters.sort || undefined,
    page,
  });

  const {
    data: searchData,
    isLoading: isProvidersLoading,
    isFetching: isProvidersFetching,
    isError: isSearchError,
    error: searchError,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: ['category-providers', slug, activeSub ?? null, filters, page, categoryId, cityId, subcategoryId],
    queryFn: async ({ signal }) => {
      const params = {
        ...toSearchRequestParams(providerParams),
      };
      if (__DEV__) {
        console.log('[CategoryScreen] GET search', ENDPOINTS.search, params);
      }
      const res = await api.get<ApiResponse<Provider[]>>(ENDPOINTS.search, { params, signal });
      return res.data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    // Don't clear allProviders here. The accumulation effect below is the SINGLE writer:
    // it REPLACES the list whenever page === 1 (and the query key changed → searchData
    // changed). Clearing here separately created a desync where Clear All landing on a
    // cached query emptied the list but never refilled it → every provider vanished.
    setPage(1);
    setShowFilters(false);
    setCityDropdownOpen(false);
  }, [slug, subcategorySlug]);

  useEffect(() => {
    const nextFilters = normalizeSearchFilters({
      category: slug,
      keyword: keywordParam,
      city: cityParam || undefined,
      provider_type: providerTypeParam,
      remote: parseRemoteParam(remoteParam),
      sort: parseSortParam(sortParam),
      page: 1,
    });
    setFilters(nextFilters);
    setModalFilters(nextFilters);
    setKeyword(nextFilters.keyword || '');
    setPage(1);
    // NOTE: activeCity?.slug is intentionally NOT a dependency here — this effect
    // only reacts to URL params (cityParam etc.). Global-city changes are owned by
    // the dedicated effect below, which sets the city and updates the URL (the URL
    // change then re-runs this effect via cityParam). Listing activeCity here caused
    // a redundant, stale-city reset on every global-city change.
    // https://react.dev/learn/removing-effect-dependencies
  }, [cityParam, keywordParam, providerTypeParam, remoteParam, slug, sortParam]);



  useEffect(() => {
    if (!searchData) return;
    const freshRaw = searchData.data ?? [];

    setAllProviders((prev) =>
      page === 1 ? freshRaw : mergeUniqueProviders(prev, freshRaw),
    );
  }, [searchData, page]);

  const category = categoryData?.category;
  const subcategories = category?.subcategories ?? [];

  usePrefetchImages(
    allProviders.slice(0, 8).map((provider) => getProviderLogo(provider.logo_url, provider.id)),
    { cachePolicy: 'memory-disk', limit: 8 },
  );

  // Count + "has more" come from the SAME query that fills the list.
  const hasMore = searchData?.pagination
    ? searchData.pagination.current_page < searchData.pagination.last_page
    : false;

  const totalCount = searchData?.pagination?.total ?? 0;

  const palette = { bg: colors.goldSoft, border: colors.goldBorder, icon: colors.gold };
  const iconName = getCategoryIcon(slug, category?.name ?? '');

  // Filter actions
  const openFilters = useCallback(() => {
    setModalFilters({
      keyword: filters.keyword || '',
      city: filters.city || undefined,
      category: slug,
      provider_type: filters.provider_type || undefined,
      remote: filters.remote === true,
      sort: filters.sort || 'rating',
      page: 1,
    });
    setCityDropdownOpen(false);
    setShowFilters(true);
  }, [filters, slug]);

  const handleModalFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    if (__DEV__) {
      console.log('[CategoryScreen] Modal filter changed:', { key, value });
    }
    setModalFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    try {
      const newFilters = normalizeSearchFilters({
        category: slug,
        keyword: modalFilters.keyword,
        city: modalFilters.city ?? undefined,
        provider_type: modalFilters.provider_type ?? undefined,
        remote: modalFilters.remote === true,
        sort: modalFilters.sort ?? 'rating',
        page: 1,
      });
      if (__DEV__) {
        console.log('[CategoryScreen] Applying filters:', newFilters);
      }
      setFilters(newFilters);
      setPage(1);
      setKeyword(newFilters.keyword || '');
      setShowFilters(false);
      router.setParams(toCategoryRouteParams(newFilters));
    } catch (err) {
      if (__DEV__) {
        console.error('[CategoryScreen] handleApplyFilters error:', err);
      }
    }
  }, [modalFilters, slug]);

  const handleResetFilters = useCallback(() => {
    try {
      const defaults = normalizeSearchFilters({
        category: slug,
        keyword: undefined,
        city: undefined,
        provider_type: undefined,
        remote: false,
        sort: 'rating' as const,
        page: 1,
      });
      setModalFilters(defaults);
      setFilters(defaults);
      setPage(1);
      setKeyword('');
      setShowFilters(false);
      router.setParams(toCategoryRouteParams(defaults, ''));
    } catch (err) {
      if (__DEV__) {
        console.error('[CategoryScreen] handleResetFilters error:', err);
      }
    }
  }, [activeSubcategorySlugs.length, slug]);

  // Debounced search text binding
  useEffect(() => {
    if (isKeywordInitial.current) {
      isKeywordInitial.current = false;
      return;
    }
    const t = setTimeout(() => {
      const nextFilters = normalizeSearchFilters({
        ...filtersRef.current,
        keyword,
        page: 1,
      });
      setFilters(nextFilters);
      router.setParams(toCategoryRouteParams(nextFilters));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  // Automatically filter when global activeCity changes
  useEffect(() => {
    if (isCityInitial.current) {
      isCityInitial.current = false;
      return;
    }
    const nextFilters = normalizeSearchFilters({
      ...filtersRef.current,
      city: activeCity?.slug || undefined,
      page: 1,
    });
    setFilters(nextFilters);
    router.setParams(toCategoryRouteParams(nextFilters));
    setPage(1);
  }, [activeCity?.slug]);

  const activeFilterCount = [
    filters.city,
    filters.keyword,
    activeSub,
    filters.provider_type,
    filters.remote ? 'remote' : null,
    filters.sort !== 'rating' ? filters.sort : null,
  ].filter(Boolean).length;

  const handleLoadMore = useCallback(() => {
    if (!isProvidersFetching && hasMore) setPage((p) => p + 1);
  }, [isProvidersFetching, hasMore]);

  const handleFavorite = useCallback(
    (providerSlug: string, isFavorited: boolean) => {
      handleFavoritePress(() => {
        toggleFavorite.mutate({ slug: providerSlug, isFavorited });
        setAllProviders((prev) =>
          prev.map((p) => (p.slug === providerSlug ? { ...p, is_favorited: !isFavorited } : p))
        );
      }, providerSlug);
    },
    [handleFavoritePress, toggleFavorite],
  );

  // Single-select: tap a subcategory to filter to it; tap "الكل" or the active
  // pill again to clear back to the whole category.
  const handleSelectSubcategory = useCallback((subSlug: string | null) => {
    if (!subSlug && activeSubcategorySlugs.length === 0) {
      return;
    }
    const next = !subSlug || activeSubcategorySlugs[0] === subSlug ? '' : subSlug;
    router.setParams({ subcategorySlug: next });
  }, [activeSubcategorySlugs]);

  const isLoading = (isCategoryLoading || isProvidersLoading) && page === 1;
  const isError = (!!categoryError || isSearchError) && allProviders.length === 0;

  const handleRefetch = () => {
    refetchCategory();
    refetchProviders();
  };

  if (isLoading && page === 1) return <LoadingSpinner />;
  if (isError && allProviders.length === 0) return <ErrorView error={categoryError ?? searchError} onRetry={handleRefetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={allProviders}
        keyExtractor={(p) => `cat-p-${p.id}`}
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        ListHeaderComponent={
          <CategoryHeader
            category={category}
            subcategories={subcategories}
            palette={palette}
            iconName={iconName}
            slug={slug}
            totalCount={totalCount}
            insetTop={insets.top}
            activeSubcategorySlugs={activeSubcategorySlugs}
            onSelectSubcategory={handleSelectSubcategory}
            keyword={keyword}
            setKeyword={setKeyword}
            openFilters={openFilters}
            activeFilterCount={activeFilterCount}
            colors={colors}
          />
        }
        renderItem={({ item: p }) => (
          <View style={{ marginHorizontal: 16, marginVertical: 0 }}>
            <ProviderRowCard provider={p} onFavoritePress={handleFavorite} />
          </View>
        )}
        ListEmptyComponent={
          /* Only show "no results" once the query has settled with a zero count —
             never during the fetch gap, so the count and the list always agree. */
          !isProvidersFetching && totalCount === 0 ? (
            filters.remote ? (
              <EmptyState
                icon="desktop-outline"
                title="لا توجد خدمات متاحة عن بُعد"
                message="لا توجد حالياً خدمات متاحة عن بُعد ضمن هذا القسم"
                actionLabel="مسح التصفيات"
                onAction={handleResetFilters}
              />
            ) : (
              <EmptyState
              icon="briefcase-outline"
              title="لا توجد نتائج"
              message={activeFilterCount > 0 ? 'لا توجد خدمات تطابق التصفيات الحالية. جرّب مسح التصفيات أو اختر قسماً آخر.' : 'لا توجد خدمات في هذا القسم الآن. جرّب تصفح تخصصات أخرى.'}
              actionLabel={activeFilterCount > 0 ? 'مسح التصفيات' : 'تصفح التخصصات'}
              onAction={activeFilterCount > 0 ? handleResetFilters : () => router.push('/categories')}
              />
            )
          ) : null
        }
        ListFooterComponent={
          isProvidersFetching ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              {hasMore ? (
                <Pressable
                  onPress={handleLoadMore}
                  style={({ pressed }) => ({
                    marginHorizontal: 16,
                    marginBottom: 16,
                    marginTop: 8,
                    alignItems: 'flex-end',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? colors.primarySoft : 'transparent',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>عرض المزيد</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ) : allProviders.length > 0 ? (
                <Text
                  style={{
                    paddingVertical: 16,
                    textAlign: 'center',
                    fontSize: 12,
                    fontFamily: 'Cairo-SemiBold',
                    color: colors.textMuted,
                  }}
                >
                  وصلت إلى نهاية النتائج
                </Text>
              ) : null}
            </>
          )
        }
      />

      {/* Favorite Auth Modal */}
      <FavoriteAuthModal
        visible={showAuthAlert}
        colors={colors}
        onConfirm={handleConfirmLogin}
        onDismiss={handleDismiss}
      />

      {/* Filter modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceElevated }}>
          {/* Modal header */}
          <View
            style={{
              ...rtlRow(),
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: 20,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>تصفية</Text>
            <Pressable
              onPress={() => {
                setShowFilters(false);
                setCityDropdownOpen(false);
              }}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Search TextInput block inside the filters modal */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 10 }}>
              <Ionicons name="search-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>ابحث عن خدمة أو مقدم</Text>
            </View>
            <View
              style={{
                ...rtlRow(),
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1.5,
                borderColor: colors.borderStrong,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 48,
                gap: 8,
              }}
            >
              <Ionicons name="search-outline" size={18} color={colors.primary} />
              <TextInput
                value={modalFilters.keyword || ''}
                onChangeText={(text) => handleModalFilterChange('keyword', text)}
                placeholder="ابحث عن خدمة أو مقدم..."
                placeholderTextColor={colors.textMuted}
                textAlign="right"
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  fontFamily: 'Cairo-SemiBold',
                  fontSize: 14,
                  writingDirection: 'rtl',
                  paddingVertical: 8,
                }}
              />
              {modalFilters.keyword ? (
                <Pressable
                  onPress={() => handleModalFilterChange('keyword', '')}
                  hitSlop={8}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {/* City filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="location-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>المدينة</Text>
            </View>
            <Pressable
              onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
              style={{
                ...rtlRow(),
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1.5,
                borderColor: colors.borderStrong,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ ...rtlRow(), alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={{ fontFamily: 'Cairo-SemiBold', fontSize: 14, color: colors.textPrimary }}>
                  {(cities ?? []).find((c) => c.slug === modalFilters.city)?.name || 'كل المدن'}
                </Text>
              </View>
              <Ionicons name={cityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </Pressable>
            {cityDropdownOpen && (
              <View style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.borderStrong,
                borderRadius: 16,
                marginTop: 8,
                overflow: 'hidden',
                maxHeight: 200,
                zIndex: 50,
              }}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {[{ id: 0, name: 'كل المدن', slug: '' }, ...(cities ?? [])].filter(Boolean).map((city) => {
                    const isSelected = modalFilters.city === city.slug || (!modalFilters.city && !city.slug);
                    return (
                      <Pressable
                        key={city.id}
                        onPress={() => {
                          handleModalFilterChange('city', city.slug || undefined);
                          setCityDropdownOpen(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          ...rtlRow(),
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{
                          fontFamily: isSelected ? 'Cairo-Bold' : 'Cairo-SemiBold',
                          fontSize: 13,
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}>
                          {city.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Provider Type filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>نوع مقدم الخدمة</Text>
            </View>
            <ScrollView
              ref={providerTypeScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={handleProviderTypeContentSizeChange}
              contentContainerStyle={{ ...rtlRow(), gap: 10, paddingHorizontal: 4, paddingVertical: 4 }}
            >
              {[{ code: '', name: 'الكل' }, ...(providerTypes?.length ? providerTypes : FALLBACK_PROVIDER_TYPES)].map((type) => {
                const isSelected = (modalFilters.provider_type || '') === type.code;
                return (
                  <Pressable
                    key={type.code}
                    onPress={() => handleModalFilterChange('provider_type', type.code || undefined)}
                    style={{
                      minWidth: 76,
                      height: 48,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.borderStrong,
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                    }}
                  >
                    {isSelected && (
                      <View style={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Cairo-Bold',
                        textAlign: 'center',
                        color: isSelected ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {type.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Sort filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="star-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>الترتيب حسب</Text>
            </View>
            <View style={{ ...rtlRow(), gap: 10, paddingVertical: 4 }}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = modalFilters.sort === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleModalFilterChange('sort', opt.value)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#1E40AF' : colors.borderStrong,
                      backgroundColor: isSelected ? '#1E40AF' : colors.surface,
                      ...rtlRow(),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Cairo-Bold',
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Remote Work Filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.surfaceAlt, borderRadius: 16 }}>
              <View style={{ ...rtlRow(), alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons name="desktop-outline" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-SemiBold', color: colors.textPrimary }}>العمل عن بُعد</Text>
              </View>
              <Switch
                value={modalFilters.remote === true}
                onValueChange={(value) => handleModalFilterChange('remote', value)}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={modalFilters.remote === true ? colors.primary : colors.textMuted}
              />
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={{ ...rtlRow(), gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={handleApplyFilters}
              style={{
                flex: 2,
                backgroundColor: '#1E40AF',
                borderRadius: 16,
                height: 52,
                ...rtlRow(),
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="funnel-outline" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>تطبيق</Text>
            </Pressable>

            <Pressable
              onPress={handleResetFilters}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.primary,
                height: 52,
                ...rtlRow(),
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.primary }}>مسح الكل</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function formatCategoryHeroTitle(name: string | null | undefined): string {
  const text = (name ?? '').trim();
  if (!text) return '';

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return text;
  if (words.length === 3) return `${words.slice(0, 2).join(' ')}\n${words[2]}`;
  if (words.length === 4) return `${words.slice(0, 2).join(' ')}\n${words.slice(2).join(' ')}`;

  const splitIndex = Math.ceil(words.length / 2);
  return `${words.slice(0, splitIndex).join(' ')}\n${words.slice(splitIndex).join(' ')}`;
}

// Redesigned Section Title with Yellow Dash
function SectionTitle({ title, extra, colors }: { title: string; extra?: React.ReactNode; colors: ThemeColors }) {
  return (
    <View
      style={{
        ...rtlRow(),
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
      }}
    >
      <View style={{ ...rtlRow(), alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 4, backgroundColor: colors.gold, borderRadius: 2 }} />
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Cairo-Black',
            color: colors.textPrimary,
            textAlign: 'right',
          }}
        >
          {title}
        </Text>
      </View>
      {extra}
    </View>
  );
}

// ─── Extracted header component so FlatList stays fast ───
function CategoryHeader({
  category,
  subcategories,
  palette,
  iconName,
  slug,
  totalCount,
  insetTop,
  activeSubcategorySlugs,
  onSelectSubcategory,
  keyword,
  setKeyword,
  openFilters,
  activeFilterCount,
  colors,
}: {
  category: any;
  subcategories: any[];
  palette: any;
  iconName: any;
  slug: string;
  totalCount: number;
  insetTop: number;
  activeSubcategorySlugs: string[];
  onSelectSubcategory: (subSlug: string | null) => void;
  keyword: string;
  setKeyword: (text: string) => void;
  openFilters: () => void;
  activeFilterCount: number;
  colors: ThemeColors;
}) {
  const isAllActive = activeSubcategorySlugs.length === 0;

  return (
    <>
      {/* ── Transparent Top Navbar on Screen Background ── */}
      <View
        style={{
          ...rtlRow(),
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          paddingTop: Math.max(insetTop, 16),
          paddingBottom: 12,
        }}
      >
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0,
            shadowRadius: 5,
            elevation: 0,
          })}
        >
          <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* ── Category Hero Card (White Container with Gold Accent) ── */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          marginHorizontal: 20,
          marginTop: 8,
          padding: 20,
          ...rtlRow(),
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0,
          shadowRadius: 12,
          elevation: 0,
        }}
      >
        {/* Left/Middle: Title Info */}
        <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 16 }}>
          <Text
            style={{
              textAlign: 'right',
              fontSize: 18,
              fontFamily: 'Cairo-Black',
              color: colors.textPrimary,
              lineHeight: 26,
              maxWidth: '100%',
              flexShrink: 1,
            }}
            numberOfLines={3}
          >
            {formatCategoryHeroTitle(category?.name)}
          </Text>
          <Text
            style={{
              textAlign: 'right',
              fontSize: 13,
              fontFamily: 'Cairo-SemiBold',
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {subcategories.length} خدمة فرعية
          </Text>
          {/* Gold Line Accent */}
          <View
            style={{
              width: 32,
              height: 3,
              backgroundColor: colors.gold,
              borderRadius: 99,
              marginTop: 8,
              alignSelf: 'flex-end',
            }}
          />
        </View>

        {/* Right: Large Icon container */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.border,
            overflow: 'hidden',
          }}
        >
          <CategoryIcon iconUrl={category?.icon_url} fallbackName={iconName} size={36} color={palette.icon} />
        </View>
      </View>

      {/* ── Search TextInput Row with nested Filter button ── */}
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <View
          style={{
            ...rtlRow(),
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1.5,
            borderColor: colors.borderStrong,
            elevation: 0,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0,
            shadowRadius: 8,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="ابحث عن خدمة أو مقدم..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontFamily: 'Cairo-SemiBold',
              fontSize: 14,
              writingDirection: 'rtl',
              paddingVertical: 8,
            }}
          />
          {keyword ? (
            <Pressable onPress={() => setKeyword('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}

          {/* Filter button nested inside search input */}
          <Pressable
            onPress={openFilters}
            hitSlop={8}
            style={{
              paddingHorizontal: 6,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeFilterCount > 0 ? '#1E40AF' : 'transparent',
              borderRadius: 10,
              borderWidth: activeFilterCount > 0 ? 1 : 0,
              borderColor: '#1E40AF',
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? '#FFFFFF' : colors.textSecondary}
            />
            {activeFilterCount > 0 ? (
              <View style={{
                position: 'absolute', right: -4, top: -4,
                width: 14, height: 14, borderRadius: 7,
                backgroundColor: colors.gold,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 8, fontFamily: 'Cairo-Black', color: '#123A6F', lineHeight: 14, textAlign: 'center', includeFontPadding: false }}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* ── Subcategories Horizontal Scroll ── */}
      {subcategories.length > 0 ? (
        <View>
          <SectionTitle title="الأقسام الفرعية" colors={colors} />
          <FlatList
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            data={[{ id: 0, slug: null, name: 'الكل' }, ...subcategories]}
            keyExtractor={(item) => `sub-pill-${item.id}`}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 4,
              gap: 8,
            }}
            renderItem={({ item: sub }) => {
              const isAll = sub.slug === null;
              const isActive = isAll ? isAllActive : activeSubcategorySlugs.includes(sub.slug);
              return (
                <Pressable
                  onPress={() => onSelectSubcategory(sub.slug)}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? palette.icon : colors.surface,
                      borderWidth: 1,
                      borderColor: isActive ? palette.icon : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: colors.shadow,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0,
                      shadowRadius: 3,
                      elevation: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: isActive ? 'Cairo-Bold' : 'Cairo-SemiBold',
                        color: isActive ? '#123A6F' : colors.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      {sub.name}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}

      {/* ── Providers List Section Header ── */}
      <SectionTitle
        title={totalCount !== undefined ? `مقدمي الخدمات (${totalCount})` : 'مقدمي الخدمات'}
        colors={colors}
      />
    </>
  );
}
