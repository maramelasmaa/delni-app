import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorView } from '../../components/ui/ErrorView';
import { useAdminDashboard } from '../../src/hooks/useAdminDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';

function DashboardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 116 }}>
        <View style={styles.header}>
          <View style={[styles.skeletonLine, { width: 90, backgroundColor: colors.surfaceAlt }]} />
        </View>
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={[styles.statTile, { height: 112, backgroundColor: colors.surface, borderColor: colors.border }]} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminDashboard();

  if (isLoading) return <DashboardSkeleton colors={colors} />;
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
          <View style={styles.brandRow}>
            <Text style={[styles.brand, { color: colors.textPrimary }]}>دلني</Text>
            <Text style={[styles.brandDot, { color: colors.gold }]}>.</Text>
          </View>
        </View>

        <View style={styles.pageTitleWrap}>
          <Text style={[styles.kicker, { color: colors.gold }]}>لوحة التحكم</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>إحصاءات المنصة</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>ملخص سريع لأهم الأرقام الحالية</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatTile label="المستخدمون" value={String(stats.users_count)} icon="people" colors={colors} />
          <StatTile label="مقدمو الخدمة" value={String(stats.providers_count)} icon="briefcase" colors={colors} />
          <StatTile label="الملفات التجارية" value={String(stats.profiles_count)} icon="id-card" colors={colors} />
          <StatTile label="الملفات الظاهرة" value={String(stats.visible_profiles_count)} icon="eye" colors={colors} />
          <StatTile label="التقييمات" value={String(stats.reviews_count)} icon="chatbubbles" colors={colors} />
          <StatTile label="قيد المراجعة" value={String(stats.pending_reviews_count)} icon="time" colors={colors} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', flexShrink: 0 },
  brand: { fontSize: 26, fontFamily: 'Cairo-Black' },
  brandDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  pageTitleWrap: { marginTop: 8, paddingHorizontal: 20, alignItems: 'flex-end' },
  kicker: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  title: { marginTop: 2, fontSize: 21, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { marginTop: 2, fontSize: 12.5, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  statsGrid: { paddingHorizontal: 20, marginTop: 18, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '48.5%', minHeight: 112, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end' },
  statIcon: { width: 36, height: 36, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { marginTop: 8, fontSize: 23, fontFamily: 'Cairo-Black', textAlign: 'right' },
  statLabel: { fontSize: 12, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  skeletonLine: { height: 16, borderRadius: 999 },
});
