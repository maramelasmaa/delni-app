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
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Cairo-Bold', color: colors.gold, marginBottom: 4 }}>
                اكتشف حسب المجال
              </Text>
              <Text style={{ fontSize: 21, fontFamily: 'Cairo-Black', color: colors.textPrimary }}>
                التخصصات الرئيسية
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row-reverse',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              {categories.slice(0, 4).map((item) => (
                <HomeCategoryCard key={item.id} category={item} colors={colors} />
              ))}

              <Pressable
                onPress={() => router.push('/categories')}
                style={({ pressed }) => [
                  {
                    width: '100%',
                    height: 54,
                    flexDirection: 'row-reverse',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                    borderColor: pressed ? colors.gold : colors.border,
                    borderStyle: 'dashed',
                    borderRadius: 16,
                    borderWidth: 1,
                    gap: 8,
                    marginTop: 4,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: 'rgba(234,179,8,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="grid-outline" size={16} color={colors.gold} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
                  عرض جميع التخصصات والخدمات
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
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
        <View style={{ marginHorizontal: 20, marginTop: 42, borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : [colors.surface, colors.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
              borderRadius: 24,
              paddingVertical: 36,
              paddingHorizontal: 24,
              position: 'relative',
              overflow: 'hidden',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            {/* Decorative background glow element */}
            <View
              style={{
                position: 'absolute',
                top: -60,
                left: -60,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: colors.primary,
                opacity: isDark ? 0.15 : 0.05,
              }}
            />

            <View style={{ alignItems: 'flex-end', gap: 10 }}>
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20
                }}
              >
                <Ionicons name="briefcase" size={12} color={colors.gold} />
                <Text style={{ color: colors.gold, fontSize: 11, fontFamily: 'Cairo-Bold', letterSpacing: 0.3 }}>
                  شريك النجاح
                </Text>
              </View>

              <Text
                style={{
                  textAlign: 'right',
                  fontSize: 24,
                  fontFamily: 'Cairo-Black',
                  color: colors.textPrimary,
                  lineHeight: 34,
                  marginTop: 4,
                }}
              >
                هل أنت صاحب عمل أو مستقل؟
              </Text>

              <Text
                style={{
                  textAlign: 'right',
                  fontSize: 14,
                  lineHeight: 24,
                  fontFamily: 'Cairo-Regular',
                  color: colors.textSecondary,
                  maxWidth: '92%',
                }}
              >
                حوّل خبرتك ومجالك إلى مصدر دخل مستدام. انضم إلى نُخبة المتخصصين واجعل العملاء يصلون إليك بكبسة زر.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 26 }}>
              <Pressable
                onPress={() => router.push('/contact')}
                style={({ pressed }) => ({
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 26,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 2,
                })}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Cairo-Bold', color: colors.textOnPrimary }}>
                  ابدأ رحلتك
                </Text>
                {/* RTL directional layout arrow */}
                <Ionicons name="arrow-back" size={16} color={colors.textOnPrimary} />
              </Pressable>
            </View>
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
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
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
    width: '48.2%',
    height: 116,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,

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
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,

    ...(Platform.OS === 'ios' && {
      borderCurve: 'continuous',
    }),
  },

  categoryImageIcon: {
    width: 28,
    height: 28,
  },

  categoryTitle: {
    width: '100%',
    minHeight: 32,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
