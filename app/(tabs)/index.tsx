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
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../src/hooks/useTheme';
import { useHome, useToggleFavorite } from '../../src/hooks/useApi';
import { useFavoriteWithAuth } from '../../src/hooks/useFavoriteWithAuth';
import { useCityStore } from '../../src/store/city';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Category } from '../../src/types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const activeCity = useCityStore((s) => s.activeCity);
  const { data, isLoading, isError, refetch, isRefetching } = useHome(activeCity?.slug);
  const toggleFavorite = useToggleFavorite();
  const { showAuthAlert, handleFavoritePress, handleConfirmLogin, handleDismiss } = useFavoriteWithAuth({
    redirectPath: '/(tabs)/',
  });

  const [citySheetOpen, setCitySheetOpen] = useState(false);
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

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView onRetry={handleRetry} />;

  const banners = data.banners ?? [];
  const featured = data.featured_providers ?? [];
  const categories = data.categories ?? [];
  const refreshing = isRefetching;

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
        {/* ─── Header ─── */}
        <View
          style={{
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: colors.bg,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 26, fontFamily: 'Cairo-Black', color: colors.textPrimary, letterSpacing: -0.5 }}>
                دلني
              </Text>
              <Text style={{ fontSize: 26, fontFamily: 'Cairo-Black', color: colors.gold, letterSpacing: -0.5 }}>
                .
              </Text>
            </View>

            <Pressable
              onPress={() => setCitySheetOpen(true)}
              hitSlop={12}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.primary, textAlign: 'center' }} numberOfLines={1}>
                {activeCity ? activeCity.name : 'اختر مدينة'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Banners ─── */}
        {banners.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <BannerCarousel banners={banners} />
          </View>
        )}

        {/* ─── Categories ─── */}
        {categories.length > 0 && (
          <View style={{ marginTop: 32, marginBottom: 8 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4 }}>
                اكتشف حسب المجال
              </Text>
              <Text style={{ fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                التخصصات الرئيسية
              </Text>
            </View>

            <FlatList
              data={[...categories.slice(0, 4), { id: 'view-all' as any, isViewAll: true }] as any[]}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 10,
                paddingHorizontal: 20,
                paddingVertical: 4,
              }}
              renderItem={({ item }: { item: any }) =>
                item.isViewAll ? (
                  <Pressable
                    onPress={() => router.push('/categories')}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      {
                        borderColor: isDark ? 'rgba(240, 190, 44, 0.3)' : 'rgba(234, 179, 8, 0.35)',
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <View style={[styles.categoryCenterStack, { borderWidth: 1, borderColor: isDark ? 'rgba(240, 190, 44, 0.25)' : 'rgba(234, 179, 8, 0.3)', borderRadius: 12, padding: 8 }]}>
                      <View style={styles.categoryIconBox}>
                        <Ionicons name="grid-outline" size={24} color={colors.gold} />
                      </View>

                      <Text numberOfLines={3} style={[styles.categoryTitle, { color: colors.textPrimary }]}>
                        عرض الكل
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <HomeCategoryCard key={item.id} category={item} colors={colors} isDark={isDark} />
                )
              }
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {/* ─── Featured ─── */}
        {featured.length > 0 && (
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4 }}>
                الخدمات المميزة
              </Text>
              <Text style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                {activeCity ? `مقدمي الخدمات في ${activeCity.name}` : 'مقدمي الخدمات'}
              </Text>
            </View>

            <FlatList
              data={featured}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              renderItem={({ item }) => <ProviderRowCard provider={item} onFavoritePress={handleFavorite} />}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

      </ScrollView>

      <CitySheet visible={citySheetOpen} onClose={() => setCitySheetOpen(false)} />

      {/* Favorite Auth Modal */}
      <FavoriteAuthModal
        visible={showAuthAlert}
        colors={colors}
        isDark={isDark}
        onConfirm={handleConfirmLogin}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

// ─── Home Category Card ───
// Clean premium category card:
// - no service counter
// - one bordered card per category
// - icon + text centered on the same vertical axis
const HomeCategoryCard = memo(function HomeCategoryCard({
  category,
  colors,
  isDark,
}: {
  category: Category;
  colors: ThemeColors;
  isDark: boolean;
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
          borderColor: isDark ? 'rgba(240, 190, 44, 0.3)' : 'rgba(234, 179, 8, 0.35)',
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[styles.categoryCenterStack, { borderWidth: 1, borderColor: isDark ? 'rgba(240, 190, 44, 0.25)' : 'rgba(234, 179, 8, 0.3)', borderRadius: 12, padding: 8 }]}>
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
  categoryCard: {
    width: 104,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(234,179,8,0.06)',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,

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
    marginBottom: 6,
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
