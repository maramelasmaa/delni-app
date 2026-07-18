import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderModeSwitch } from '../../components/provider/ProviderModeSwitch';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useProviderDashboard } from '../../src/hooks/useProviderDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Review } from '../../src/types';
import { getProviderLogo } from '../../src/utils/imageFallback';

function StatTile({ label, value, icon, colors }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; colors: ThemeColors }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[styles.statIcon, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}> 
        <Ionicons name={icon} size={19} color={colors.goldText} />
      </View>
      <Text numberOfLines={1} style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ReviewRow({ review, colors }: { review: Review; colors: ThemeColors }) {
  return (
    <View style={[styles.reviewRow, { borderColor: colors.border }]}> 
      <View style={styles.reviewRating}> 
        <Ionicons name="star" size={15} color={colors.star} />
        <Text style={[styles.reviewRatingText, { color: colors.textPrimary }]}>{review.rating}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}> 
        <Text numberOfLines={1} style={[styles.reviewName, { color: colors.textPrimary }]}>{review.user_name}</Text>
        <Text numberOfLines={2} style={[styles.reviewComment, { color: colors.textMuted }]}>{review.comment || 'تقييم بدون تعليق'}</Text>
      </View>
    </View>
  );
}

export default function ProviderDashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } = useProviderDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  const profile = data.profile;
  const stats = data.stats;
  const logo = getProviderLogo(profile.logo_url, profile.id);
  const statusText = stats.is_discoverable ? 'ظاهر للعملاء' : stats.is_complete ? 'قيد المراجعة' : 'أكمل ملفك للظهور';
  const statusColor = stats.is_discoverable ? colors.success : colors.goldText;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 116 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}> 
          <ProviderModeSwitch mode="provider" compact />
          <View style={styles.brandRow}> 
            <Text style={[styles.brandDot, { color: colors.gold }]}>.</Text>
            <Text style={[styles.brand, { color: colors.textPrimary }]}>دلني</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
          <View style={{ flex: 1, alignItems: 'flex-end' }}> 
            <Text numberOfLines={1} style={[styles.kicker, { color: colors.gold }]}>لوحة مقدم الخدمة</Text>
            <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary }]}>{profile.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}> 
              <Ionicons name={stats.is_discoverable ? 'checkmark-circle' : 'time-outline'} size={15} color={statusColor} />
              <Text numberOfLines={1} style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}> 
          <StatTile label="التقييم" value={stats.rating_average.toFixed(1)} icon="star" colors={colors} />
          <StatTile label="المراجعات" value={String(stats.reviews_count)} icon="chatbubbles" colors={colors} />
          <StatTile label="الأعمال" value={String(stats.portfolio_items_count)} icon="images" colors={colors} />
          <StatTile label="اكتمال الملف" value={`${stats.completion_percentage}%`} icon="shield-checkmark" colors={colors} />
        </View>

        <View style={[styles.actionBand, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Pressable onPress={() => router.push('/(provider)/profile' as never)} style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}> 
            <Ionicons name="create-outline" size={19} color={colors.textOnPrimary} />
            <Text style={[styles.primaryActionText, { color: colors.textOnPrimary }]}>تحسين الملف</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/provider/[slug]', params: { slug: profile.slug } })} style={({ pressed }) => [styles.secondaryAction, { borderColor: colors.borderStrong, opacity: pressed ? 0.8 : 1 }]}> 
            <Ionicons name="eye-outline" size={19} color={colors.primary} />
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>معاينة العامة</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}> 
          <Text style={[styles.sectionKicker, { color: colors.gold }]}>آخر النشاط</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>أحدث المراجعات</Text>
        </View>

        <View style={[styles.reviewsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {data.recent_reviews.length > 0 ? data.recent_reviews.map((review) => <ReviewRow key={review.id} review={review} colors={colors} />) : (
            <View style={styles.emptyReviews}> 
              <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد مراجعات بعد</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>عندما يقيّم العملاء خدمتك ستظهر هنا مباشرة.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  brand: { fontSize: 26, fontFamily: 'Cairo-Black' },
  brandDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  hero: { marginHorizontal: 20, marginTop: 8, borderRadius: 22, borderWidth: 1, padding: 16, flexDirection: 'row-reverse', gap: 14, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: 22 },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  title: { marginTop: 2, fontSize: 21, lineHeight: 30, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  statusPill: { marginTop: 10, minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  statsGrid: { paddingHorizontal: 20, marginTop: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '48.5%', minHeight: 118, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end' },
  statIcon: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { marginTop: 10, fontSize: 24, fontFamily: 'Cairo-Black', textAlign: 'right' },
  statLabel: { fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  actionBand: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, padding: 12, gap: 10 },
  primaryAction: { minHeight: 48, borderRadius: 15, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  secondaryAction: { minHeight: 46, borderRadius: 15, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionText: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  sectionHeader: { marginTop: 28, marginBottom: 12, paddingHorizontal: 20, alignItems: 'flex-end' },
  sectionKicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { marginTop: 2, fontSize: 20, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  reviewsCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  reviewRow: { padding: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewRating: { minWidth: 48, minHeight: 34, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  reviewRatingText: { fontSize: 13, fontFamily: 'Cairo-Bold' },
  reviewName: { fontSize: 14, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  reviewComment: { marginTop: 1, fontSize: 12, lineHeight: 19, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  emptyReviews: { padding: 24, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontFamily: 'Cairo-Bold', textAlign: 'center', writingDirection: 'rtl' },
  emptyText: { marginTop: 4, fontSize: 12, lineHeight: 20, fontFamily: 'Cairo-Regular', textAlign: 'center', writingDirection: 'rtl' },
});
