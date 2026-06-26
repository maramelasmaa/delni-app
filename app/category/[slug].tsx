import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useCategory, useToggleFavorite, useCities, useProviderTypes } from '../../src/hooks/useApi';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import { useCityStore } from '../../src/store/city';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider, ApiResponse, SearchFilters, CategoryDetailData } from '../../src/types';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { ENDPOINTS } from '../../src/constants/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث', icon: 'calendar-outline' },
  { value: 'rating', label: 'الأعلى تقييماً', icon: 'star-outline' },
] as const;

const FALLBACK_PROVIDER_TYPES = [
  { code: 'individual', name: 'فرد' },
  { code: 'company', name: 'شركة' },
  { code: 'agency', name: 'وكالة' },
  { code: 'clinic', name: 'عيادة' },
  { code: 'studio', name: 'استوديو' },
  { code: 'freelancer', name: 'مستقل' },
  { code: 'other', name: 'أخرى' },
] as const;

export default function CategoryScreen() {
  const { colors } = useTheme();
  const { slug, subcategorySlug } = useLocalSearchParams<{ slug: string; subcategorySlug?: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleFavorite = useToggleFavorite();
  const insets = useSafeAreaInsets();
  const activeCity = useCityStore((s) => s.activeCity);

  const [page, setPage] = useState(1);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);

  const isCityInitial = useRef(true);
  const isKeywordInitial = useRef(true);

  // Local filter states
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [filters, setFilters] = useState<SearchFilters>({
    category: slug,
    keyword: undefined,
    city: activeCity?.slug || undefined,
    provider_type: undefined,
    remote: false,
    sort: 'rating',
    page: 1,
  });

  const [modalFilters, setModalFilters] = useState<SearchFilters>({
    category: slug,
    keyword: undefined,
    city: activeCity?.slug || undefined,
    provider_type: undefined,
    remote: false,
    sort: 'rating',
    page: 1,
  });

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

  const providerParams = {
    category: slug,
    category_id: categoryId || undefined,
    service: activeSub || undefined,
    subcategory_id: subcategoryId || undefined,
    keyword: filters.keyword || undefined,
    city: filters.city || undefined,
    city_id: cityId || undefined,
    provider_type: filters.provider_type || undefined,
    remote: filters.remote,
    sort: filters.sort || undefined,
    page,
  };

  const hasActiveFilters = !!(
    filters.keyword ||
    (filters.city && filters.city !== activeCity?.slug) ||
    filters.provider_type ||
    filters.remote ||
    filters.sort !== 'rating'
  );

  const shouldUseSearch = !!activeSub || hasActiveFilters;

  const {
    data: searchData,
    isLoading: isProvidersLoading,
    isFetching: isProvidersFetching,
    isError: isSearchError,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: ['category-providers', slug, activeSub ?? null, filters, page, categoryId, cityId, subcategoryId],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(providerParams).filter(([k, v]) => {
          // Keep remote=true, but exclude false (means "show all, not just remote")
          if (k === 'remote') return v === true;
          // Exclude undefined, empty strings, and 0
          return v !== undefined && v !== '' && v !== 0;
        }),
      );
      if (!shouldUseSearch) {
        // "الكل" (All) tab is active and no active search filters -> Fetch from the category details endpoint directly.
        const res = await api.get<ApiResponse<CategoryDetailData>>(ENDPOINTS.category(slug), { params });
        if (__DEV__) {
          console.log('[CategoryScreen] GET category', ENDPOINTS.category(slug), params, '→ total', res.data?.data?.pagination?.total, 'items', res.data?.data?.providers?.length);
        }
        return {
          data: res.data.data.providers ?? [],
          pagination: res.data.data.pagination,
        };
      } else {
        // Specific subcategory tab or active filters -> Fetch from search endpoint.
        const res = await api.get<ApiResponse<Provider[]>>(ENDPOINTS.search, { params });
        if (__DEV__) {
          console.log('[CategoryScreen] GET search', ENDPOINTS.search, params, '→ total', res.data?.pagination?.total, 'items', res.data?.data?.length);
        }
        return res.data;
      }
    },
    enabled: !!slug,
  });

  const prevSlugRef = useRef(slug);
  const prevSubcatSlugsRef = useRef(subcategorySlug);

  if (prevSlugRef.current !== slug || prevSubcatSlugsRef.current !== subcategorySlug) {
    prevSlugRef.current = slug;
    prevSubcatSlugsRef.current = subcategorySlug;
    setPage(1);
    setAllProviders([]);
  }



  useEffect(() => {
    if (!searchData) return;
    const fresh = searchData.data ?? [];
    setAllProviders((prev) =>
      page === 1 ? fresh : [...prev, ...fresh.filter((p) => !prev.some((x) => x.id === p.id))],
    );
  }, [searchData, page]);

  const category = categoryData?.category;
  const subcategories = category?.subcategories ?? [];

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
      remote: !!filters.remote,
      sort: filters.sort || 'rating',
      page: 1,
    });
    setCityDropdownOpen(false);
    setShowFilters(true);
  }, [filters, slug]);

  const handleModalFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setModalFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    try {
      setFilters((f) => ({
        ...f,
        keyword: modalFilters.keyword ?? undefined,
        city: modalFilters.city ?? undefined,
        provider_type: modalFilters.provider_type ?? undefined,
        remote: !!modalFilters.remote,
        sort: modalFilters.sort ?? 'rating',
        page: 1,
      }));
      setPage(1);
      setAllProviders([]);
      setKeyword(modalFilters.keyword || '');
      setShowFilters(false);
    } catch (err) {
      console.error('[CategoryScreen] handleApplyFilters error:', err);
    }
  }, [modalFilters]);

  const handleResetFilters = useCallback(() => {
    try {
      const defaults = {
        category: slug,
        keyword: undefined,
        city: activeCity?.slug || undefined,
        provider_type: undefined,
        remote: false,
        sort: 'rating' as const,
        page: 1,
      };
      setModalFilters(defaults);
      setFilters(defaults);
      setPage(1);
      setAllProviders([]);
      setKeyword('');
      setShowFilters(false);
    } catch (err) {
      console.error('[CategoryScreen] handleResetFilters error:', err);
    }
  }, [activeCity?.slug, slug]);

  // Debounced search text binding
  useEffect(() => {
    if (isKeywordInitial.current) {
      isKeywordInitial.current = false;
      return;
    }
    const t = setTimeout(() => {
      setFilters((f) => ({
        ...f,
        keyword: keyword ? keyword.trim() : undefined,
        page: 1,
      }));
      setPage(1);
      setAllProviders([]);
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  // Automatically filter when global activeCity changes
  useEffect(() => {
    if (isCityInitial.current) {
      isCityInitial.current = false;
      return;
    }
    setFilters((f) => ({
      ...f,
      city: activeCity?.slug || undefined,
      page: 1,
    }));
    setPage(1);
    setAllProviders([]);
  }, [activeCity?.slug]);

  const activeFilterCount = [
    filters.city && filters.city !== activeCity?.slug ? filters.city : null,
    filters.provider_type,
    filters.remote ? 'remote' : null,
    filters.sort !== 'rating' ? filters.sort : null,
  ].filter(Boolean).length;

  const handleLoadMore = useCallback(() => {
    if (!isProvidersFetching && hasMore) setPage((p) => p + 1);
  }, [isProvidersFetching, hasMore]);

  const handleFavorite = useCallback(
    (providerSlug: string, isFavorited: boolean) => {
      if (!isAuthenticated) {
        router.push({
          pathname: '/(auth)/login',
          params: { redirectTo: `/category/${String(slug)}${subcategorySlug ? `?subcategorySlug=${subcategorySlug}` : ''}` }
        });
        return;
      }
      toggleFavorite.mutate({ slug: providerSlug, isFavorited });
      setAllProviders((prev) =>
        prev.map((p) => (p.slug === providerSlug ? { ...p, is_favorited: !isFavorited } : p))
      );
    },
    [isAuthenticated, slug, subcategorySlug, toggleFavorite],
  );

  // Single-select: tap a subcategory to filter to it; tap "الكل" or the active
  // pill again to clear back to the whole category.
  const handleSelectSubcategory = useCallback((subSlug: string | null) => {
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
  if (isError && allProviders.length === 0) return <ErrorView onRetry={handleRefetch} />;

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
            <EmptyState
              icon="briefcase-outline"
              title="لم نجد نتائج"
              message="لا يوجد مقدمي خدمات في هذا القسم حالياً."
            />
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
                    alignItems: 'center',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    paddingVertical: 12,
                    backgroundColor: pressed ? colors.primarySoft : 'transparent',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>عرض المزيد</Text>
                </Pressable>
              ) : null}
            </>
          )
        }
      />

      {/* Filter modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceElevated }}>
          {/* Modal header */}
          <View
            style={{
              flexDirection: 'row-reverse',
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
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 10 }}>
              <Ionicons name="search-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>البحث عن اسم أو خدمة</Text>
            </View>
            <View
              style={{
                flexDirection: 'row-reverse',
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
                placeholder="ابحث عن خدمة أو مزود..."
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
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="location-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>المدينة</Text>
            </View>
            <Pressable
              onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
              style={{
                flexDirection: 'row-reverse',
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
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
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
                          flexDirection: 'row-reverse',
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
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>نوع المزود</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row-reverse', gap: 10, paddingHorizontal: 4, paddingVertical: 4 }}
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
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="star-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>الترتيب حسب</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 10, paddingVertical: 4 }}>
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
                      borderColor: isSelected ? colors.primary : colors.borderStrong,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? colors.textOnPrimary : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Cairo-Bold',
                        color: isSelected ? colors.textOnPrimary : colors.textSecondary,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row-reverse', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={handleApplyFilters}
              style={{
                flex: 2,
                backgroundColor: colors.primary,
                borderRadius: 16,
                height: 52,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="funnel-outline" size={18} color={colors.textOnPrimary} />
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
                flexDirection: 'row-reverse',
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

// Helper to resolve icons for subcategories
function getSubcategoryIcon(slug: string, name: string): keyof typeof Ionicons.glyphMap {
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('graphic') || s.includes('جرافيك')) return 'color-palette-outline';
  if (s.includes('web') || s.includes('مواقع') || s.includes('موقع')) return 'desktop-outline';
  if (s.includes('ui') || s.includes('ux') || s.includes('واجهات') || s.includes('واجهة')) return 'grid-outline';
  if (s.includes('video') || s.includes('فيديو') || s.includes('موشن')) return 'play-circle-outline';
  if (s.includes('identity') || s.includes('هوية') || s.includes('شعار')) return 'id-card-outline';
  if (s.includes('photo') || s.includes('تصوير') || s.includes('فوتو')) return 'camera-outline';
  if (s.includes('paint') || s.includes('دهان') || s.includes('طلاء')) return 'brush-outline';
  if (s.includes('clean') || s.includes('تنظيف')) return 'water-outline';
  if (s.includes('electric') || s.includes('كهرباء') || s.includes('كهربائي')) return 'flash-outline';
  if (s.includes('plumb') || s.includes('سباكة') || s.includes('سباك')) return 'construct-outline';
  return 'briefcase-outline';
}

// Redesigned Section Title with Yellow Dash
function SectionTitle({ title, extra, colors }: { title: string; extra?: React.ReactNode; colors: ThemeColors }) {
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
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
          flexDirection: 'row-reverse',
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
            shadowOpacity: 0.03,
            shadowRadius: 5,
            elevation: 1,
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
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        {/* Left/Middle: Title Info */}
        <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 16 }}>
          <Text
            style={{
              textAlign: 'right',
              fontSize: 24,
              fontFamily: 'Cairo-Black',
              color: colors.textPrimary,
              lineHeight: 32,
            }}
            numberOfLines={2}
          >
            {category?.name ?? ''}
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
            flexDirection: 'row-reverse',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1.5,
            borderColor: colors.borderStrong,
            elevation: 2,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="ابحث عن خدمة أو مزود..."
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
              backgroundColor: activeFilterCount > 0 ? colors.primary : 'transparent',
              borderRadius: 10,
              borderWidth: activeFilterCount > 0 ? 1 : 0,
              borderColor: colors.primary,
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? colors.textOnPrimary : colors.textSecondary}
            />
            {activeFilterCount > 0 ? (
              <View style={{
                position: 'absolute', right: -4, top: -4,
                width: 14, height: 14, borderRadius: 7,
                backgroundColor: colors.gold,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 8, fontFamily: 'Cairo-Black', color: '#FFFFFF', lineHeight: 10 }}>{activeFilterCount}</Text>
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
                      shadowOpacity: 0.02,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: isActive ? 'Cairo-Bold' : 'Cairo-SemiBold',
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
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
        title={totalCount !== undefined ? `المزودين (${totalCount})` : 'المزودين'}
        colors={colors}
      />
    </>
  );
}

