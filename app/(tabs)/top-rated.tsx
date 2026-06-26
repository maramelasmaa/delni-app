import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTopRated, useCategories, useToggleFavorite } from '../../src/hooks/useApi';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/auth';
import { useCityStore } from '../../src/store/city';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Provider } from '../../src/types';

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TopRatedScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryParam = getSingleParam(params.category);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : [],
  );
  const [page, setPage] = useState(1);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const activeCity = useCityStore((s) => s.activeCity);
  const prevCityRef = useRef(activeCity?.slug);
  const categoriesKey = selectedCategories.join(',');
  const prevCategoryKeyRef = useRef(categoriesKey);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleFavorite = useToggleFavorite();



  const { data, isLoading, isError, isFetching, refetch } = useTopRated({
    category: categoriesKey || undefined,
    city: activeCity?.slug || undefined,
    page,
  });
  const { data: categories } = useCategories();

  // Reset when category or city filter changes
  if (prevCategoryKeyRef.current !== categoriesKey || prevCityRef.current !== activeCity?.slug) {
    prevCategoryKeyRef.current = categoriesKey;
    prevCityRef.current = activeCity?.slug;
    setPage(1);
    setAllProviders([]);
  }

  useEffect(() => {
    const fresh = data?.data;
    if (!fresh?.length) return;
    setAllProviders((prev) =>
      page === 1 ? fresh : [...prev, ...fresh.filter((p) => !prev.some((x) => x.id === p.id))],
    );
  }, [data?.data, page]);

  const handleFavorite = useCallback(
    (slug: string, isFavorited: boolean) => {
      if (!isAuthenticated) {
        router.push({ pathname: '/(auth)/login', params: { redirectTo: '/top-rated' } });
        return;
      }
      toggleFavorite.mutate({ slug, isFavorited });
      setAllProviders((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, is_favorited: !isFavorited } : p))
      );
    },
    [isAuthenticated, toggleFavorite],
  );

  const handleCategoryToggle = useCallback((slug: string) => {
    setSelectedCategories((prev) => {
      if (slug === '') return [];
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      router.setParams({ category: next.join(',') || undefined });
      return next;
    });
  }, []);

  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  }, [isFetching, hasMore]);

  const podium = allProviders.slice(0, 3);
  const rest = allProviders.slice(3);

  if (isLoading && page === 1) return <LoadingSpinner />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={rest}
        keyExtractor={(p) => `tr-${p.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 28, gap: 12 }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                  الأعلى تقييماً
                </Text>
                <Text style={{ fontSize: 28, fontFamily: 'Cairo-Black', color: colors.gold }}>.</Text>
              </View>
              <Text style={{ textAlign: 'right', fontSize: 15, fontFamily: 'Cairo-SemiBold', color: colors.textMuted, marginTop: 4 }}>
                أفضل مقدمي الخدمات بناءً على تقييمات العملاء
              </Text>
            </View>

            {/* Category Filter Pills */}
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={[{ id: 0, name: 'الكل', slug: '' }, ...(categories ?? [])]}
              keyExtractor={(cat) => `tr-cat-${cat.id}`}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 12,
                gap: 8,
              }}
              renderItem={({ item: cat }) => {
                const isActive = cat.slug === ''
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(cat.slug);
                return (
                  <Pressable
                    onPress={() => handleCategoryToggle(cat.slug)}
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
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
                          color: isActive ? colors.textOnPrimary : colors.textSecondary,
                        }}
                      >
                        {cat.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />

            {/* Podium */}
            {podium.length > 0 ? <PodiumSection providers={podium} colors={colors} /> : null}

            {rest.length > 0 ? (
              <Text
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 6,
                  textAlign: 'right',
                  fontSize: 12,
                  fontFamily: 'Cairo-Bold',
                  color: colors.textMuted,
                }}
              >
                المراتب التالية
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item: p, index }) => (
          <View style={{ marginHorizontal: 16, marginVertical: 0 }}>
            <ProviderRowCard provider={p} rank={index + 4} onFavoritePress={handleFavorite} />
          </View>
        )}
        ListEmptyComponent={
          podium.length === 0 ? (
            <EmptyState icon="star-outline" title="لا يوجد مزودون بعد" />
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={handleLoadMore}
              disabled={isFetching}
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
              {isFetching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ fontFamily: 'Cairo-Bold', color: colors.primary, fontSize: 14 }}>تحميل المزيد</Text>
              )}
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function RibbonBadge({ position }: { position: number }) {
  const badgeColors = ['#D4A017', '#94A3B8', '#CD7F32'];
  const rank = position + 1;
  const color = badgeColors[position];

  return (
    <View style={{ height: 26, width: 26, alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
      {/* Ribbon Tails */}
      <View
        style={{
          position: 'absolute',
          bottom: -4,
          left: 4,
          width: 5,
          height: 12,
          backgroundColor: color,
          transform: [{ rotate: '-25deg' }],
          borderBottomRightRadius: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -4,
          right: 4,
          width: 5,
          height: 12,
          backgroundColor: color,
          transform: [{ rotate: '25deg' }],
          borderBottomLeftRadius: 1,
        }}
      />
      {/* Ribbon Circle */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1.41,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
}

function PedestalBase({ position, height }: { position: number; height: number }) {
  const bgColors = ['#FDF8EA', '#F1F5F9', '#FAF3E3'];
  const borderColors = ['#EAD49E', '#E2E8F0', '#EAD0B8'];
  const starColors = ['#D4A017', '#94A3B8', '#CD7F32'];

  const color = starColors[position];
  const bgColor = bgColors[position];
  const borderColor = borderColors[position];

  return (
    <View
      className="w-full items-center justify-center rounded-t-2xl shadow-sm relative overflow-hidden"
      style={{
        height,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
      }}
    >
      <View className="flex-row items-center gap-1.5 opacity-80">
        {position === 0 ? (
          <>
            <Ionicons
              name="leaf"
              size={12}
              color={color}
              style={{ transform: [{ rotate: '-35deg' }] }}
            />
            <Ionicons name="star" size={16} color={color} />
            <Ionicons
              name="leaf"
              size={12}
              color={color}
              style={{ transform: [{ scaleX: -1 }, { rotate: '35deg' }] }}
            />
          </>
        ) : (
          <Ionicons name="star" size={14} color={color} />
        )}
      </View>
    </View>
  );
}

function PodiumSection({ providers, colors }: { providers: Provider[]; colors: ThemeColors }) {
  const [gold, silver, bronze] = providers;

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 8,
        marginTop: 8,
        borderRadius: 28,
        backgroundColor: colors.surface,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      }}
    >
      {/* Header Title with Laurel Wreath Leaves */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        <Ionicons
          name="leaf"
          size={15}
          color={colors.star}
          style={{ transform: [{ rotate: '-15deg' }] }}
        />
        <Text style={{ textAlign: 'center', fontSize: 14, color: colors.textPrimary, fontFamily: 'Cairo-Black' }}>
          منصة التكريم
        </Text>
        <Ionicons
          name="leaf"
          size={15}
          color={colors.star}
          style={{ transform: [{ scaleX: -1 }, { rotate: '15deg' }] }}
        />
      </View>

      {/* Staggered Pedestal Columns */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
        {silver ? (
          <PodiumEntry provider={silver} position={1} height={68} colors={colors} />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {gold ? (
          <PodiumEntry provider={gold} position={0} height={92} colors={colors} />
        ) : null}
        {bronze ? (
          <PodiumEntry provider={bronze} position={2} height={52} colors={colors} />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>


    </View>
  );
}

function PodiumEntry({ provider, position, height, colors }: { provider: Provider; position: number; height: number; colors: ThemeColors }) {
  const isGold = position === 0;
  const avatarSize = isGold ? 74 : position === 1 ? 64 : 58;
  const badgeBorderColor = isGold ? '#D4A017' : position === 1 ? '#94A3B8' : '#CD7F32';

  return (
    <Pressable
      onPress={() => router.push(`/provider/${provider.slug}`)}
      style={{ flex: 1, alignItems: 'center' }}
    >
      {/* Avatar Container with Ribbon Badge */}
      <View style={{ position: 'relative', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ position: 'absolute', top: -12, zIndex: 20 }}>
          <RibbonBadge position={position} />
        </View>

        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            overflow: 'hidden',
            backgroundColor: colors.surfaceAlt,
            borderColor: badgeBorderColor,
            borderWidth: isGold ? 2.5 : 2,
          }}
        >
          <Avatar
            logoUrl={provider.logo_url}
            name={provider.name}
            id={provider.id}
            size={avatarSize}
            radius={avatarSize / 2}
            recyclingKey={`podium-${provider.id}`}
          />
        </View>
      </View>

      {/* Provider Name */}
      <Text
        style={{ textAlign: 'center', fontFamily: 'Cairo-Bold', color: colors.textPrimary, paddingHorizontal: 4, fontSize: isGold ? 11 : 10, lineHeight: 14 }}
        numberOfLines={2}
      >
        {provider.name}
      </Text>

      {/* Average rating badge */}
      {provider.rating_average > 0 ? (
        <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
          <Ionicons name="star" size={10} color={colors.star} />
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'Cairo-Bold' }}>
            {provider.rating_average.toFixed(1)}
          </Text>
        </View>
      ) : null}

      {/* Reviews Count */}
      <Text style={{ fontSize: 9, color: colors.textMuted, fontFamily: 'Cairo-SemiBold', marginBottom: 4 }}>
        ({provider.reviews_count ?? 0} تقييم)
      </Text>

      {/* City location */}
      {provider.city ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center', marginBottom: 12 }}>
          <Ionicons name="location-outline" size={10} color={colors.textMuted} />
          <Text style={{ fontSize: 9, color: colors.textMuted, fontFamily: 'Cairo-SemiBold' }}>
            {provider.city.name}
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 12, height: 13 }} />
      )}

      {/* Pedestal Base */}
      <PedestalBase position={position} height={height} />
    </Pressable>
  );
}
