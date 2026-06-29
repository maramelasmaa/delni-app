import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { FavoriteAuthModal } from '../../components/ui/FavoriteAuthModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import {
  useSearch,
  useSearchSuggestions,
  useCities,
  useCategories,
  useToggleFavorite,
  useProviderTypes,
} from '../../src/hooks/useApi';
import { useFavoriteWithAuth } from '../../src/hooks/useFavoriteWithAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import type { Provider, SearchFilters } from '../../src/types';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import { getOffersRemoteWork } from '../../src/utils/providerMappers';
import { rtlRow } from '../../src/utils/rtl';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث', icon: 'calendar-outline' },
  { value: 'rating', label: 'الأعلى تقييماً', icon: 'star-outline' },
] as const;

const FALLBACK_PROVIDER_TYPES = [
  { code: '', name: 'الكل' },
  { code: 'individual', name: 'فرد' },
  { code: 'company', name: 'شركة' },
  { code: 'agency', name: 'وكالة' },
  { code: 'clinic', name: 'عيادة' },
  { code: 'studio', name: 'استوديو' },
  { code: 'freelancer', name: 'مستقل' },
  { code: 'other', name: 'أخرى' },
] as const;

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function isRemoteParamEnabled(value?: string) {
  return value === '1' || value === 'true';
}

function toSearchRouteParams(filters: Partial<SearchFilters>) {
  return {
    keyword: filters.keyword || undefined,
    category: filters.category || undefined,
    category_id: filters.category_id ? String(filters.category_id) : undefined,
    city: filters.city || undefined,
    city_id: filters.city_id ? String(filters.city_id) : undefined,
    sort: filters.sort || undefined,
    provider_type: filters.provider_type || undefined,
    remote: filters.remote ? '1' : undefined,
  };
}

export default function SearchTabScreen() {
  const params = useLocalSearchParams<{
    keyword?: string;
    category?: string;
    category_id?: string;
    city?: string;
    city_id?: string;
    sort?: string;
    provider_type?: string;
    remote?: string;
    show_filters?: string;
  }>();
  const { colors } = useTheme();

  const keywordParam = getSingleParam(params.keyword);
  const categoryParam = getSingleParam(params.category);
  const categoryIdParam = getSingleParam(params.category_id);
  const cityParam = getSingleParam(params.city);
  const cityIdParam = getSingleParam(params.city_id);
  const sortParam = getSingleParam(params.sort);
  const providerTypeParam = getSingleParam(params.provider_type);
  const remoteParam = getSingleParam(params.remote);

  const inputRef = useRef<TextInput>(null);
  const { showAuthAlert, handleFavoritePress, handleConfirmLogin, handleDismiss } = useFavoriteWithAuth({
    redirectPath: `/(tabs)/search?keyword=${keywordParam || ''}`,
  });

  const [keyword, setKeyword] = useState(keywordParam);
  const [debouncedQ, setDebouncedQ] = useState(keywordParam);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: keywordParam,
    category: categoryParam,
    category_id: categoryIdParam ? Number(categoryIdParam) : undefined,
    city: cityParam,
    city_id: cityIdParam ? Number(cityIdParam) : undefined,
    sort: sortParam === 'newest' ? 'newest' : 'rating',
    provider_type: providerTypeParam || undefined,
    remote: isRemoteParamEnabled(remoteParam),
    page: 1,
  });
  const [modalFilters, setModalFilters] = useState<SearchFilters>({
    keyword: keywordParam,
    category: categoryParam,
    category_id: categoryIdParam ? Number(categoryIdParam) : undefined,
    city: cityParam,
    city_id: cityIdParam ? Number(cityIdParam) : undefined,
    sort: sortParam === 'newest' ? 'newest' : 'rating',
    provider_type: providerTypeParam || undefined,
    remote: isRemoteParamEnabled(remoteParam),
    page: 1,
  });

  const [allProviders, setAllProviders] = useState<Provider[]>([]);

  const openFilters = useCallback(() => {
    setModalFilters({
      keyword: filters.keyword || '',
      city: filters.city || undefined,
      city_id: filters.city_id || undefined,
      category: filters.category || undefined,
      category_id: filters.category_id || undefined,
      provider_type: filters.provider_type || undefined,
      remote: !!filters.remote,
      sort: filters.sort || 'rating',
      page: 1,
    });
    setCityDropdownOpen(false);
    setShowFilters(true);
  }, [filters]);

  const handleModalFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setModalFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    const nextFilters: SearchFilters = {
      keyword: modalFilters.keyword,
      city: modalFilters.city,
      city_id: modalFilters.city_id,
      category: modalFilters.category,
      category_id: modalFilters.category_id,
      provider_type: modalFilters.provider_type,
      remote: modalFilters.remote === true,
      sort: modalFilters.sort || 'rating',
      page: 1,
    };
    setFilters(nextFilters);
    setKeyword(nextFilters.keyword || '');
    setShowFilters(false);
    router.setParams(toSearchRouteParams(nextFilters));
  }, [modalFilters]);

  const handleResetFilters = useCallback(() => {
    const defaults: SearchFilters = {
      keyword: undefined,
      category: undefined,
      category_id: undefined,
      city: undefined,
      city_id: undefined,
      sort: 'rating' as const,
      provider_type: undefined,
      remote: false,
      page: 1,
    };
    setModalFilters(defaults);
    setFilters(defaults);
    setKeyword('');
    setShowFilters(false);
    router.setParams(toSearchRouteParams(defaults));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const { data, isLoading, isFetching, isError, refetch } = useSearch(filters);
  const { data: suggestions } = useSearchSuggestions(debouncedQ);
  const { data: cities } = useCities();
  const { data: categories } = useCategories();
  const { data: providerTypes } = useProviderTypes();
  const toggleFavorite = useToggleFavorite();

  // Clear providers when core filters change to prevent "flash" of old results
  useEffect(() => {
    setAllProviders([]);
  }, [filters.keyword, filters.category, filters.city, filters.sort, filters.provider_type, filters.remote]);

  useEffect(() => {
    const freshRaw = data?.data;
    if (!freshRaw) return;
    const fresh = filters.remote ? freshRaw.filter((provider) => getOffersRemoteWork(provider)) : freshRaw;
    setAllProviders((prev) =>
      (filters.page ?? 1) === 1 ? fresh : [...prev, ...fresh.filter((p) => !prev.some((x) => x.id === p.id))],
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data, filters.page, filters.remote]);

  useEffect(() => {
    setKeyword(keywordParam);
    setFilters((cur) => ({
      ...cur,
      keyword: keywordParam,
      category: categoryParam,
      category_id: categoryIdParam ? Number(categoryIdParam) : undefined,
      city: cityParam,
      city_id: cityIdParam ? Number(cityIdParam) : undefined,
      sort: sortParam === 'newest' ? 'newest' : 'rating',
      provider_type: providerTypeParam || undefined,
      remote: isRemoteParamEnabled(remoteParam),
      page: 1,
    }));
  }, [keywordParam, categoryParam, categoryIdParam, cityParam, cityIdParam, sortParam, providerTypeParam, remoteParam]);

  useEffect(() => {
    if (params.show_filters === 'true') {
      openFilters();
      Promise.resolve().then(() => {
        router.setParams({ show_filters: undefined });
      });
    }
  }, [params.show_filters, openFilters]);

  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  const commitSearch = useCallback(
    (term: string) => {
      setShowSuggestions(false);
      const nextFilters: SearchFilters = { ...filters, keyword: term, page: 1 };
      setFilters(nextFilters);
      router.setParams(toSearchRouteParams(nextFilters));
    },
    [filters.category, filters.category_id, filters.city, filters.city_id, filters.sort, filters.provider_type, filters.remote],
  );

  const handleSearch = useCallback(() => commitSearch(keyword), [commitSearch, keyword]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      setKeyword(suggestion);
      setDebouncedQ(suggestion);
      commitSearch(suggestion);
    },
    [commitSearch],
  );



  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }));
    }
  }, [isFetching, hasMore]);

  const buildRedirect = useCallback(() => {
    const q = new URLSearchParams();
    if (filters.keyword) q.set('keyword', filters.keyword);
    if (filters.category) q.set('category', filters.category);
    if (filters.city) q.set('city', filters.city);
    if (filters.sort) q.set('sort', filters.sort);
    if (filters.provider_type) q.set('provider_type', filters.provider_type);
    if (filters.remote) q.set('remote', '1');
    const qs = q.toString();
    return qs ? `/(tabs)/search?${qs}` : '/(tabs)/search';
  }, [filters]);

  const handleFavorite = useCallback(
    (slug: string, isFavorited: boolean) => {
      handleFavoritePress(() => {
        toggleFavorite.mutate({ slug, isFavorited });
        setAllProviders((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, is_favorited: !isFavorited } : p))
        );
      }, slug);
    },
    [handleFavoritePress, toggleFavorite],
  );

  const activeFilterCount = [
    filters.city,
    filters.category,
    filters.provider_type,
    filters.remote ? 'remote' : null,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ textAlign: 'right', fontSize: 28, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
          البحث
        </Text>

        {/* Search input row */}
        <View
          style={{
            ...rtlRow(),
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              ...rtlRow(),
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
              ref={inputRef}
              value={keyword}
              onChangeText={(text) => {
                setKeyword(text);
                setShowSuggestions(text.length >= 2);
              }}
              placeholder="ابحث عن خدمة أو مقدم..."
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              onFocus={() => setShowSuggestions(keyword.length >= 2)}
              style={{
                flex: 1,
                textAlign: 'right',
                color: colors.textPrimary,
                fontFamily: 'Cairo-SemiBold',
                fontSize: 14,
                writingDirection: 'rtl',
                paddingVertical: 8,
              }}
            />
            {keyword.length > 0 ? (
              <Pressable
                onPress={() => {
                  setKeyword('');
                  setDebouncedQ('');
                  setShowSuggestions(false);
                  setFilters((f) => ({ ...f, keyword: '', page: 1 }));
                }}
                hitSlop={8}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.88 : 1 }] })}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </View>
              </Pressable>
            ) : null}

            {/* Filter button nested inside search input, matching index.tsx */}
            <Pressable
              onPress={openFilters}
              hitSlop={8}
              style={({ pressed }) => ({
                paddingHorizontal: 6,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeFilterCount > 0 ? '#1E40AF' : 'transparent',
                borderRadius: 10,
                borderWidth: activeFilterCount > 0 ? 1 : 0,
                borderColor: '#1E40AF',
                transform: [{ scale: pressed ? 0.9 : 1 }],
              })}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={activeFilterCount > 0 ? '#FFFFFF' : colors.textSecondary}
              />
              {activeFilterCount > 0 ? (
                <View style={{
                  position: 'absolute', start: -4, top: -4,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: colors.gold,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Cairo-Black', color: '#0F172A', lineHeight: 14, textAlign: 'center', includeFontPadding: false }}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions && suggestions.length > 0 ? (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            elevation: 6,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          }}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={`${s}-${i}`}
              onPress={() => handleSuggestionPress(s)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                ...rtlRow(),
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              })}
            >
              <Ionicons name="search-outline" size={14} color={colors.textMuted} />
              <Text
                style={{
                  flex: 1,
                  textAlign: 'right',
                  fontSize: 14,
                  fontFamily: 'Cairo-SemiBold',
                  color: colors.textPrimary,
                  writingDirection: 'rtl',
                }}
                numberOfLines={1}
              >
                {s}
              </Text>
              <Ionicons name="arrow-up-outline" size={13} color={colors.textDisabled} style={{ transform: [{ rotate: '225deg' }] }} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Results */}
      {isError && !isFetching ? (
        <ErrorView message="فشل البحث" onRetry={refetch} />
      ) : isLoading && (filters.page ?? 1) === 1 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : allProviders.length === 0 && !isFetching ? (
        filters.remote ? (
          <EmptyState
            icon="desktop-outline"
            title="لا توجد خدمات متاحة عن بُعد"
            message="لم نعثر حالياً على خدمات متاحة عن بُعد بهذه التصفية"
          />
        ) : keyword || filters.category || filters.city ? (
          <EmptyState
            icon="search-outline"
            title="لا توجد نتائج"
            message="جرّب كلمات أخرى أو غيّر التصفية"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
              paddingBottom: 60,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search-outline" size={30} color={colors.primary} />
            </View>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontFamily: 'Cairo-Bold',
                color: colors.textPrimary,
                marginBottom: 6,
              }}
            >
              ابحث عن خدمة أو مقدم
            </Text>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 13,
                fontFamily: 'Cairo-Regular',
                color: colors.textMuted,
                lineHeight: 22,
              }}
            >
              اكتب اسم الخدمة أو مقدم الخدمة
            </Text>
          </View>
        )
      ) : (
        <FlatList
          data={allProviders}
          keyExtractor={(p) => `tab-search-${p.id}`}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 28, gap: 12 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pagination && pagination.total > 0 ? (
              <Text
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  textAlign: 'right',
                  fontSize: 12,
                  fontFamily: 'Cairo-Bold',
                  color: colors.textMuted,
                }}
              >
                {pagination.total} نتيجة
              </Text>
            ) : null
          }
          renderItem={({ item: p }) => (
            <View style={{ marginHorizontal: 16, marginVertical: 0 }}>
              <ProviderRowCard provider={p} onFavoritePress={handleFavorite} />
            </View>
          )}
          ListFooterComponent={
            isFetching && (filters.page ?? 1) > 1 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

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
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>البحث عن اسم أو خدمة</Text>
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
                  {cities?.find((c) => c.slug === modalFilters.city)?.name || 'كل المدن'}
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
                  {[{ id: 0, name: 'كل المدن', slug: '' }, ...(cities ?? [])].map((city) => {
                    const isSelected = modalFilters.city === city.slug || (!modalFilters.city && !city.slug);
                    return (
                      <Pressable
                        key={city.id}
                        onPress={() => {
                          handleModalFilterChange('city', city.slug || undefined);
                          handleModalFilterChange('city_id', city.id || undefined);
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

            {/* Category filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="apps-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>القسم</Text>
            </View>
            <FlatList
              horizontal
              inverted
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              data={[{ id: 0, name: 'الكل', slug: '' }, ...(categories ?? [])]}
              keyExtractor={(item) => `cat-${item.id}`}
              contentContainerStyle={{ ...rtlRow(), gap: 10, paddingHorizontal: 4, paddingVertical: 4 }}
              renderItem={({ item: cat }) => {
                const isSelected = modalFilters.category === cat.slug || (!modalFilters.category && !cat.slug);
                const iconName = cat.slug === '' ? 'apps-outline' : getCategoryIcon(cat.slug, cat.name);
                return (
                  <Pressable
                    onPress={() => {
                      handleModalFilterChange('category', cat.slug || undefined);
                      handleModalFilterChange('category_id', cat.id || undefined);
                    }}
                    style={{
                      width: 80,
                      height: 96,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.borderStrong,
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                    }}
                  >
                    {isSelected && (
                      <View style={{ position: 'absolute', top: 6, start: 6, zIndex: 10 }}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      </View>
                    )}
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: isSelected ? colors.surface : colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <Ionicons name={iconName} size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 11,
                        fontFamily: 'Cairo-Bold',
                        textAlign: 'center',
                        color: isSelected ? colors.primary : colors.textSecondary,
                        lineHeight: 14,
                      }}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {/* Provider Type filter */}
            <View style={{ ...rtlRow(), alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 }}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>نوع مقدم الخدمة</Text>
            </View>
            <FlatList
              horizontal
              inverted
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              data={[{ code: '', name: 'الكل' }, ...(providerTypes && providerTypes.length > 0 ? providerTypes : FALLBACK_PROVIDER_TYPES)]}
              keyExtractor={(item) => `ptype-${item.code}`}
              contentContainerStyle={{ ...rtlRow(), gap: 10, paddingHorizontal: 4, paddingVertical: 4 }}
              renderItem={({ item: type }) => {
                const isSelected = (modalFilters.provider_type || '') === type.code;
                return (
                  <Pressable
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
                      <View style={{ position: 'absolute', top: 4, start: 4, zIndex: 10 }}>
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
              }}
            />

            {/* Remote Work filter */}
            <View
              style={{
                ...rtlRow(),
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 24,
                paddingVertical: 8,
              }}
            >
              <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 16 }}>
                <View style={{ ...rtlRow(), alignItems: 'center', gap: 6 }}>
                  <Ionicons name="globe-outline" size={16} color={colors.textPrimary} />
                  <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>العمل عن بُعد</Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'Cairo-Regular', color: colors.textSecondary, marginTop: 2, textAlign: 'right' }}>
                  عرض الخدمات المتاحة عن بُعد فقط
                </Text>
              </View>
              <Switch
                value={!!modalFilters.remote}
                onValueChange={(val) => handleModalFilterChange('remote', val)}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor={modalFilters.remote ? colors.primary : colors.surface}
              />
            </View>

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

      {/* Favorite Auth Modal */}
      <FavoriteAuthModal
        visible={showAuthAlert}
        colors={colors}
        onConfirm={handleConfirmLogin}
        onDismiss={handleDismiss}
      />
    </SafeAreaView>
  );
}
