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
import { LinearGradient } from 'expo-linear-gradient';
import { BannerCarousel } from '../../components/home/BannerCarousel';
import { CitySheet } from '../../components/city/CitySheet';
import { FeaturedCard } from '../../components/provider/FeaturedCard';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../src/hooks/useTheme';
import { useHome } from '../../src/hooks/useApi';
import { useCityStore } from '../../src/store/city';
import { getCategoryIcon } from '../../src/utils/categoryStyle';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Category } from '../../src/types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const activeCity = useCityStore((s) => s.activeCity);
  const { data, isLoading, isError, refetch, isRefetching } = useHome(activeCity?.slug);

  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

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
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
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
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: pressed ? colors.primary : colors.border,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, fontFamily: 'Cairo-Bold', color: colors.textPrimary }} numberOfLines={1}>
                {activeCity ? activeCity.name : 'جميع المدن'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
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
          <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4 }}>
                اكتشف حسب المجال
              </Text>
              <Text style={{ fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                التخصصات
              </Text>
            </View>

            <FlatList
              data={categories}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 14,
                paddingLeft: 4,
                paddingRight: 2,
                paddingVertical: 4,
              }}
              renderItem={({ item }) => (
                <HomeCategoryCard category={item} colors={colors} />
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {/* ─── Featured ─── */}
        {featured.length > 0 && (
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4 }}>
                اختيارات بارزة لك
              </Text>
              <Text style={{ fontSize: 20, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                {activeCity ? `مزودون مميزون في ${activeCity.name}` : 'مزودون مميزون'}
              </Text>
            </View>

            <FlatList
              data={featured}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingLeft: 4 }}
              renderItem={({ item }) => <FeaturedCard provider={item} />}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {/* ─── Business CTA ─── */}
        <View style={{ marginHorizontal: 20, marginTop: 32, borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={isDark ? ['#1A1D36', '#0B0D19'] : ['#0F152B', '#1E2548']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <View style={{ width: 3, height: 14, backgroundColor: colors.gold, borderRadius: 2 }} />
                <Text style={{ color: colors.gold, fontSize: 12, fontFamily: 'Cairo-Bold' }}>
                  دلني للأعمال
                </Text>
              </View>

              <Text style={{ textAlign: 'right', fontSize: 20, fontFamily: 'Cairo-Black', color: '#FFFFFF', lineHeight: 28 }}>
                سجّل نشاطك في <Text style={{ color: colors.gold }}>دلني</Text>
              </Text>

              <Text style={{ textAlign: 'right', fontSize: 13, lineHeight: 20, fontFamily: 'Cairo-Regular', color: 'rgba(255,255,255,0.7)', marginTop: 8, maxWidth: '85%' }}>
                انضم إلى دليلنا المهني واظهر أمام الباحثين عن خدماتك في مدينتك.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/contact')}
              style={({ pressed }) => ({
                marginTop: 20,
                alignSelf: 'flex-start',
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.gold,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 20,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: '#0F152B' }}>
                تواصل معنا للتسجيل
              </Text>
              <Ionicons name="arrow-back" size={16} color="#0F152B" />
            </Pressable>
          </LinearGradient>
        </View>
      </ScrollView>

      <CitySheet visible={citySheetOpen} onClose={() => setCitySheetOpen(false)} />
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

  const blue = colors.primary ?? '#3B82F6';
  const gold = colors.gold ?? '#EAB308';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.categoryCard,
        {
          backgroundColor: colors.surface,
          borderColor: pressed ? gold : 'rgba(255,255,255,0.16)',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.965 : 1 }],
        },
      ]}
    >
      <View style={styles.categoryCenterStack}>
        <View
          style={[
            styles.categoryIconBox,
            {
              backgroundColor: 'rgba(59,130,246,0.13)',
              borderColor: 'rgba(59,130,246,0.34)',
            },
          ]}
        >
          {category.icon_url ? (
            <Image
              source={{ uri: category.icon_url }}
              style={styles.categoryImageIcon}
              contentFit="contain"
            />
          ) : (
            <Ionicons name={iconName} size={31} color={blue} />
          )}
        </View>

        <Text numberOfLines={2} style={[styles.categoryTitle, { color: colors.textPrimary }]}>
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  categoryCard: {
    width: 128,
    height: 138,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,

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
    width: 62,
    height: 62,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  categoryImageIcon: {
    width: 36,
    height: 36,
  },

  categoryTitle: {
    width: '100%',
    minHeight: 40,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
