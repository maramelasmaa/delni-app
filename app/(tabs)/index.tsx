import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerCarousel } from '../../components/home/BannerCarousel';
import { CitySheet } from '../../components/city/CitySheet';
import { ProviderRowCard } from '../../components/provider/ProviderRowCard';
import { FavoriteAuthModal } from '../../components/ui/FavoriteAuthModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../src/hooks/useTheme';
import { useHome, useToggleFavorite } from '../../src/hooks/useApi';
import { useFavoriteWithAuth } from '../../src/hooks/useFavoriteWithAuth';
import { usePrefetchImages } from '../../src/hooks/useImagePrefetch';
import { useCityStore } from '../../src/store/city';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import { getProviderLogo } from '../../src/utils/imageFallback';
import { rtlRow } from '../../src/utils/rtl';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Category } from '../../src/types';

export default function HomeScreen() {
  const [citySheetVisible, setCitySheetVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const activeCity = useCityStore((s) => s.activeCity);
  const { data, isLoading, isError, error, refetch, isRefetching } = useHome(activeCity?.slug);
  const toggleFavorite = useToggleFavorite();
  const { showAuthAlert, handleFavoritePress, handleConfirmLogin, handleDismiss } = useFavoriteWithAuth({
    redirectPath: '/(tabs)/',
  });

  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFavorite = useCallback((slug: string, isFavorited: boolean) => {
    handleFavoritePress(() => {
      toggleFavorite.mutate({ slug, isFavorited });
    }, slug);
  }, [handleFavoritePress, toggleFavorite]);

  const banners = data?.banners ?? [];
  const featured = data?.featured_providers ?? [];
  const categories = data?.categories ?? [];
  const refreshing = isRefetching;
  const isHomeEmpty = banners.length === 0 && categories.length === 0 && featured.length === 0;

  usePrefetchImages(banners.map((banner) => banner.image_url), { cachePolicy: 'memory-disk', limit: 6 });
  usePrefetchImages(
    featured.map((provider) => getProviderLogo(provider.logo_url, provider.id)),
    { cachePolicy: 'memory-disk', limit: 8 },
  );

  const renderHomeCategoryItem = useCallback(
    ({ item }: { item: Category | { id: string; isViewAll: true } }) =>
      'isViewAll' in item && item.isViewAll ? (
        <Pressable
          onPress={() => router.push('/categories')}
          style={({ pressed }) => [
            styles.categoryCard,
            {
              borderColor: colors.goldBorder,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.categoryCenterStack, { borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 12, padding: 8 }]}>
            <View style={styles.categoryIconBox}>
              <Ionicons name="grid-outline" size={24} color={colors.gold} />
            </View>

            <Text numberOfLines={3} style={[styles.categoryTitle, { color: colors.textPrimary }]}>
              كل الفئات
            </Text>
          </View>
        </Pressable>
      ) : (
        <HomeCategoryCard key={item.id} category={item as Category} colors={colors} />
      ),
    [colors.gold, colors.goldBorder, colors.textPrimary],
  );

  const renderFeaturedProviderItem = useCallback(
    ({ item }: { item: import('../../src/types').Provider }) => (
      <ProviderRowCard provider={item} onFavoritePress={handleFavorite} />
    ),
    [handleFavorite],
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView error={error} onRetry={handleRetry} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* --- Header --- */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: colors.bg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* City selector pill (left) */}
          <Pressable
            onPress={() => setCitySheetVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="اختيار المدينة"
            style={({ pressed }) => [
              styles.cityPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text numberOfLines={1} style={[styles.cityPillText, { color: isDark ? colors.textSecondary : colors.textPrimary }]}>
              {activeCity ? activeCity.name : 'كل المدن'}
            </Text>
          </Pressable>

          {/* Brand (right) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 26, fontFamily: 'Cairo-Black', color: colors.gold, letterSpacing: -0.5 }}>
              .
            </Text>
            <Text style={{ fontSize: 26, fontFamily: 'Cairo-Black', color: colors.textPrimary, letterSpacing: -0.5 }}>
              دلني
            </Text>
          </View>
        </View>

        {/* --- Banners --- */}
        {banners.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <BannerCarousel banners={banners} />
          </View>
        )}

        {/* --- Categories --- */}
        {categories.length > 0 && (
          <View style={{ marginTop: 32, marginBottom: 8 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' }}>
                تصفح حسب الخدمة
              </Text>
              <Text style={{ fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}>
                الفئات الرئيسية
              </Text>
            </View>

            <FlatList<Category | { id: string; isViewAll: true }>
              data={[...categories.slice(0, 4), { id: 'view-all', isViewAll: true }]}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 10,
                paddingHorizontal: 20,
                paddingVertical: 4,
              }}
              renderItem={renderHomeCategoryItem}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {/* --- Featured --- */}
        {featured.length > 0 && (
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' }}>
                مقدمي الخدمات
              </Text>
              <Text style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' }}>
                {activeCity ? `مقدمي الخدمات المميزون في ${activeCity.name}` : 'مقدمي الخدمات المميزون'}
              </Text>
            </View>

            <FlatList
              data={featured}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={7}
              removeClippedSubviews
              renderItem={renderFeaturedProviderItem}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {isHomeEmpty ? (
          <EmptyState
            icon="search-outline"
            title="لا توجد خدمات حالياً"
            message={activeCity ? `لا توجد خدمات متاحة في ${activeCity.name} حالياً. جرب تغيير المدينة أو تصفح الفئات.` : 'لا توجد خدمات متاحة حالياً. جرب تصفح الفئات أو تغيير المدينة.'}
            actionLabel="تصفح الفئات"
            onAction={() => router.push('/categories')}
          />
        ) : null}

      </ScrollView>

      {/* City Selector */}
      <CitySheet visible={citySheetVisible} onClose={() => setCitySheetVisible(false)} />

      {/* Favorite Auth Modal */}
      <FavoriteAuthModal
        visible={showAuthAlert}
        colors={colors}
        onConfirm={handleConfirmLogin}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

// --- Home Category Card ---
// Clean premium category card:
// - no service counter
// - one bordered card per category
// - icon + text centered on the same vertical axis
const HomeCategoryCard = memo(function HomeCategoryCard({
  category,
  colors,
}: {
  category: Category;
  colors: ThemeColors;
}) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/category/[slug]',
      params: { slug: category.slug },
    });
  }, [category.slug]);

  const iconName = getCategoryIcon(category.slug, category.name);
  const mustard = colors.gold ?? '#EAB308';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.categoryCard,
        {
          borderColor: colors.goldBorder,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[styles.categoryCenterStack, { borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 12, padding: 8 }]}>
        <View style={styles.categoryIconBox}>
          {category.icon_url ? (
            <Image
              source={{ uri: category.icon_url }}
              style={styles.categoryImageIcon}
              contentFit="contain"
              tintColor={mustard}
            />
          ) : (
            <Ionicons name={iconName} size={32} color={mustard} />
          )}
        </View>

        <Text numberOfLines={3} style={[styles.categoryTitle, { color: colors.textPrimary }]}>
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cityPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 1,
    maxWidth: 180,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 3,
    elevation: 0,
  },
  cityPillText: {
    flexShrink: 1,
    marginHorizontal: 6,
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
    lineHeight: 18,
  },

  categoryCard: {
    width: 104,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(234,179,8,0.06)',

    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  categoryCenterStack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(234,179,8,0.12)',

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  categoryImageIcon: {
    width: 26,
    height: 26,
  },

  categoryTitle: {
    width: '100%',
    minHeight: 24,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    maxWidth: 90,
  },
});
