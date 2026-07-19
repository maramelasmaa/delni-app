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

type ProviderRoute = '/(provider)/profile-edit' | '/(provider)/portfolio' | '/(provider)/credentials' | '/(provider)/reviews';

function StatTile({ label, value, icon, colors }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; colors: ThemeColors }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}>
        <Ionicons name={icon} size={18} color={colors.goldText} />
      </View>
      <Text numberOfLines={1} style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, route, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; route: ProviderRoute; colors: ThemeColors }) {
  return (
    <Pressable onPress={() => router.push(route as never)} style={({ pressed }) => [styles.actionPressable, { opacity: pressed ? 0.86 : 1 }]}>
      <View style={[styles.actionRow, { borderColor: colors.border }]}>
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        <View style={styles.actionTextWrap}>
          <Text numberOfLines={1} style={[styles.actionTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text numberOfLines={2} style={[styles.actionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.actionIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name={icon} size={21} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function ReviewRow({ review, colors }: { review: Review; colors: ThemeColors }) {
  return (
    <View style={[styles.reviewRow, { borderColor: colors.border }]}>
      <View style={[styles.reviewRating, { backgroundColor: colors.goldSoft }]}>
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
  const statusText = stats.is_discoverable ? 'ظاهر للعملاء' : stats.is_complete ? 'جاهز للمراجعة' : 'يحتاج إكمال';
  const statusIcon = stats.is_discoverable ? 'checkmark-circle' : stats.is_complete ? 'time-outline' : 'alert-circle-outline';
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
          <View style={styles.headerText}>
            <View style={styles.brandRow}>
              <Text style={[styles.brandDot, { color: colors.gold }]}>.</Text>
              <Text style={[styles.brand, { color: colors.textPrimary }]}>دلني</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>إدارة ملفك التجاري</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text numberOfLines={1} style={[styles.kicker, { color: colors.gold }]}>لوحة مقدم الخدمة</Text>
            <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary }]}>{profile.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}>
              <Ionicons name={statusIcon} size={15} color={statusColor} />
              <Text numberOfLines={1} style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatTile label="التقييم" value={stats.rating_average.toFixed(1)} icon="star" colors={colors} />
          <StatTile label="المراجعات" value={String(stats.reviews_count)} icon="chatbubbles" colors={colors} />
          <StatTile label="الأعمال" value={String(stats.portfolio_items_count)} icon="images" colors={colors} />
          <StatTile label="الشهادات" value={String(stats.credentials_count)} icon="ribbon" colors={colors} />
        </View>

        <View style={[styles.completionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionPercent, { color: colors.textPrimary }]}>{stats.completion_percentage}%</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>اكتمال الملف</Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>كلما اكتمل ملفك زادت فرصة ظهوره للعملاء.</Text>
            </View>
          </View>
          <View style={[styles.progressShell, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.progressFill, { width: `${stats.completion_percentage}%`, backgroundColor: colors.gold }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionKicker, { color: colors.gold }]}>الإدارة</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ماذا تريد تعديله؟</Text>
        </View>

        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActionRow icon="create-outline" title="بيانات الملف التجاري" subtitle="الاسم، الوصف، التواصل، الفئة والمدينة" route="/(provider)/profile-edit" colors={colors} />
          <ActionRow icon="images-outline" title="الأعمال والمعرض" subtitle="أضف صور المشاريع وروابط أعمالك" route="/(provider)/portfolio" colors={colors} />
          <ActionRow icon="ribbon-outline" title="الشهادات والخبرات" subtitle="اعرض الاعتمادات وسنوات الخبرة" route="/(provider)/credentials" colors={colors} />
          <ActionRow icon="chatbubbles-outline" title="التقييمات" subtitle="تابع آراء العملاء وردود الفعل" route="/(provider)/reviews" colors={colors} />
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
  headerText: { flex: 1, alignItems: 'flex-end' },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  brand: { fontSize: 26, fontFamily: 'Cairo-Black' },
  brandDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerSubtitle: { marginTop: -2, fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  hero: { marginHorizontal: 20, marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row-reverse', gap: 14, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: 20 },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  title: { marginTop: 2, fontSize: 21, lineHeight: 30, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  statusPill: { marginTop: 10, minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  statusText: { fontSize: 12, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  statsGrid: { paddingHorizontal: 20, marginTop: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '48.5%', minHeight: 112, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end' },
  statIcon: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { marginTop: 10, fontSize: 23, fontFamily: 'Cairo-Black', textAlign: 'right' },
  statLabel: { fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  completionCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, padding: 16 },
  completionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  completionPercent: { fontSize: 28, fontFamily: 'Cairo-Black' },
  progressShell: { width: '100%', height: 9, borderRadius: 999, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  sectionHeader: { marginTop: 26, marginBottom: 12, paddingHorizontal: 20, alignItems: 'flex-end' },
  sectionKicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  sectionHint: { marginTop: 2, fontSize: 12, lineHeight: 19, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  actionCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  actionPressable: { minHeight: 76 },
  actionRow: { minHeight: 76, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionTextWrap: { flex: 1, alignItems: 'flex-end' },
  actionIcon: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  actionSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 18, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
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
