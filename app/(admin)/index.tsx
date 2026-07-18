import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminModeSwitch } from '../../components/provider/AdminModeSwitch';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAdminDashboard } from '../../src/hooks/useAdminDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { Provider, Review } from '../../src/types';
import type { ThemeColors } from '../../src/theme/tokens';

function StatTile({ label, value, icon, colors }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; colors: ThemeColors }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[styles.statIcon, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}> 
        <Ionicons name={icon} size={18} color={colors.goldText} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function ProviderRow({ provider, colors }: { provider: Provider; colors: ThemeColors }) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}> 
      <Ionicons name="briefcase-outline" size={19} color={colors.primary} />
      <View style={{ flex: 1, alignItems: 'flex-end' }}> 
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.textPrimary }]}>{provider.name}</Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.textMuted }]}>{provider.category?.name || 'بدون فئة'} · {provider.city?.name || 'بدون مدينة'}</Text>
      </View>
    </View>
  );
}

function ReviewRow({ review, colors }: { review: Review; colors: ThemeColors }) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}> 
      <View style={styles.ratingPill}> 
        <Ionicons name="star" size={14} color={colors.star} />
        <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{review.rating}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}> 
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.textPrimary }]}>{review.user_name}</Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.textMuted }]}>{review.status || 'review'} · {review.comment || 'بدون تعليق'}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  const stats = data.stats;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 116 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}> 
          <AdminModeSwitch mode="admin" compact />
          <View style={styles.brandRow}> 
            <Text style={[styles.brandDot, { color: colors.gold }]}>.</Text>
            <Text style={[styles.brand, { color: colors.textPrimary }]}>دلني</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={[styles.heroIcon, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}> 
            <Ionicons name="shield-checkmark" size={30} color={colors.goldText} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}> 
            <Text style={[styles.kicker, { color: colors.gold }]}>لوحة الإدارة</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>حالة المنصة اليوم</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>نظرة سريعة على المستخدمين والمقدمين والمراجعات</Text>
          </View>
        </View>

        <View style={styles.statsGrid}> 
          <StatTile label="المستخدمون" value={String(stats.users_count)} icon="people" colors={colors} />
          <StatTile label="المقدمون" value={String(stats.providers_count)} icon="briefcase" colors={colors} />
          <StatTile label="الملفات" value={String(stats.profiles_count)} icon="id-card" colors={colors} />
          <StatTile label="الظاهرة" value={String(stats.visible_profiles_count)} icon="eye" colors={colors} />
          <StatTile label="المراجعات" value={String(stats.reviews_count)} icon="chatbubbles" colors={colors} />
          <StatTile label="بانتظار" value={String(stats.pending_reviews_count)} icon="time" colors={colors} />
        </View>

        <View style={styles.sectionHeader}> 
          <Text style={[styles.sectionKicker, { color: colors.gold }]}>المحتوى</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>آخر مقدمي الخدمة</Text>
        </View>
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {data.recent_providers.length > 0 ? data.recent_providers.map((provider) => <ProviderRow key={provider.id} provider={provider} colors={colors} />) : <Text style={[styles.empty, { color: colors.textMuted }]}>لا يوجد مقدمون بعد</Text>}
        </View>

        <View style={styles.sectionHeader}> 
          <Text style={[styles.sectionKicker, { color: colors.gold }]}>الثقة</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>آخر المراجعات</Text>
        </View>
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {data.recent_reviews.length > 0 ? data.recent_reviews.map((review) => <ReviewRow key={review.id} review={review} colors={colors} />) : <Text style={[styles.empty, { color: colors.textMuted }]}>لا توجد مراجعات بعد</Text>}
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
  heroIcon: { width: 66, height: 66, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  title: { marginTop: 2, fontSize: 21, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { marginTop: 2, fontSize: 12.5, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  statsGrid: { paddingHorizontal: 20, marginTop: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '48.5%', minHeight: 112, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end' },
  statIcon: { width: 36, height: 36, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { marginTop: 8, fontSize: 23, fontFamily: 'Cairo-Black', textAlign: 'right' },
  statLabel: { fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  sectionHeader: { marginTop: 28, marginBottom: 12, paddingHorizontal: 20, alignItems: 'flex-end' },
  sectionKicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { marginTop: 2, fontSize: 20, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  listCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 62, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  rowSubtitle: { marginTop: 1, fontSize: 12, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  ratingPill: { minWidth: 46, minHeight: 32, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontFamily: 'Cairo-Bold' },
  empty: { padding: 20, textAlign: 'center', fontSize: 13, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
});
