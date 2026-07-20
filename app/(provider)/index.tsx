import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumButton } from '../../components/auth/premiumAuth';
import { ProviderStatItem } from '../../components/provider/ProviderStatItem';
import { ErrorView } from '../../components/ui/ErrorView';
import { useProviderDashboard } from '../../src/hooks/useProviderDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import { getProviderLogo } from '../../src/utils/imageFallback';

function formatRating(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}

function formatAccessRemaining(accessEndsAt: string | null | undefined) {
  if (!accessEndsAt) return 'غير نشط';
  const end = new Date(accessEndsAt);
  if (Number.isNaN(end.getTime())) return 'غير نشط';

  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'منتهي';
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
}

function DashboardSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 116 }}>
        <View style={styles.header}>
          <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.surfaceAlt }]} />
        </View>
        <View style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.skeletonLogo, { backgroundColor: colors.surfaceAlt }]} />
          <View style={styles.identityText}>
            <View style={[styles.skeletonLine, { width: '72%', backgroundColor: colors.surfaceAlt }]} />
          </View>
        </View>
        <View style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.skeletonStat, { backgroundColor: colors.surface, borderColor: colors.border }]} />)}
        </View>
        <View style={[styles.skeletonCard, { height: 142, backgroundColor: colors.surface, borderColor: colors.border }]} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideStep({
  step,
  title,
  body,
  status,
  icon,
  onPress,
  colors,
}: {
  step: string;
  title: string;
  body: string;
  status: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.guideStep, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.guideStepTop}>
        <View style={[styles.stepNumber, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}>
          <Text style={[styles.stepNumberText, { color: colors.goldText }]}>{step}</Text>
        </View>
        <View style={[styles.guideIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
      </View>
      <View style={styles.guideText}>
        <Text style={[styles.guideStepTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.guideStepBody, { color: colors.textMuted }]}>{body}</Text>
        <Text style={[styles.guideStepStatus, { color: colors.goldText }]}>{status}</Text>
      </View>
      <PremiumButton
        title="اضغط هنا"
        icon="arrow-back"
        onPress={onPress}
        style={styles.guideAction}
      />
    </View>
  );
}

export default function ProviderDashboardScreen() {
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useProviderDashboard();

  if (isLoading) return <DashboardSkeleton colors={colors} />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  const { profile, stats } = data;
  const logo = getProviderLogo(profile.logo_url, profile.id);
  const showVisibilityNotice = stats.is_complete && !stats.is_discoverable;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 116 }}
      >
        <View style={styles.header}>
          <View style={styles.pageTitleRow}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>لوحة التحكم</Text>
            <Text style={[styles.pageTitle, { color: colors.gold }]}>.</Text>
          </View>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>ملخص أداء ملفك التجاري</Text>
        </View>

        <View style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
          <View style={styles.identityText}>
            <Text numberOfLines={2} style={[styles.businessName, { color: colors.textPrimary }]}>{profile.name}</Text>
          </View>
        </View>

        <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.guideHeader}>
            <Text style={[styles.guideKicker, { color: colors.gold }]}>دليل تجهيز حسابك</Text>
            <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>جهّز ملفك بخطوات واضحة</Text>
            <Text style={[styles.guideIntro, { color: colors.textMuted }]}>
              حدّث بياناتك، أضف أعمالك، ثم أضف شهاداتك حتى يظهر ملفك بشكل أقوى للعملاء.
            </Text>
          </View>
          <GuideStep
            step="1"
            title="الملف التجاري"
            body="حدّث الاسم، الصور، التصنيف، المدينة، أرقام التواصل، والروابط التي تظهر للعميل."
            status={`اكتمال الملف: ${stats.completion_percentage}%`}
            icon="person-circle-outline"
            onPress={() => router.push('/(provider)/profile-edit' as never)}
            colors={colors}
          />
          <GuideStep
            step="2"
            title="الأعمال والمشاريع"
            body="أضف صور مشاريعك السابقة حتى يفهم العميل مستوى شغلك قبل التواصل."
            status={`المشاريع الحالية: ${stats.portfolio_items_count}`}
            icon="images-outline"
            onPress={() => router.push('/(provider)/portfolio' as never)}
            colors={colors}
          />
          <GuideStep
            step="3"
            title="الشهادات والخبرات"
            body="أضف الشهادات، الخبرات، وروابط التحقق التي ترفع الثقة في ملفك."
            status={`الشهادات الحالية: ${stats.credentials_count}`}
            icon="ribbon-outline"
            onPress={() => router.push('/(provider)/credentials' as never)}
            colors={colors}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionMarker, { backgroundColor: colors.gold }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>نظرة عامة</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <ProviderStatItem label="متوسط التقييم" value={formatRating(stats.rating_average)} icon="star" />
          <ProviderStatItem label="إجمالي التقييمات" value={String(stats.reviews_count)} icon="chatbubbles" />
          <ProviderStatItem label="المدة المتبقية" value={formatAccessRemaining(stats.provider_access_ends_at)} icon="time" />
        </View>

        {showVisibilityNotice ? (
          <View style={[styles.notice, { backgroundColor: colors.goldSoft, borderColor: colors.goldBorder }]}>
            <Ionicons name="eye-off-outline" size={19} color={colors.goldText} />
            <View style={styles.noticeText}>
              <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>ملفك غير ظاهر للعملاء</Text>
              <Text style={[styles.noticeMessage, { color: colors.textMuted }]}>بيانات ملفك مكتملة، لكنه لا يظهر حالياً في نتائج البحث.</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="مراجعة حالة الملف"
                onPress={() => router.push('/(provider)/profile' as never)}
                style={({ pressed }) => [styles.noticeAction, { borderColor: colors.goldBorder, opacity: pressed ? 0.82 : 1 }]}
              >
                <Text style={[styles.noticeActionText, { color: colors.goldText }]}>مراجعة الملف</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'flex-end',
  },
  pageTitleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  pageTitle: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pageSubtitle: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  identityCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 18,
  },
  identityText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  guideHeader: {
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  guideKicker: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideTitle: {
    marginTop: 2,
    fontSize: 20,
    lineHeight: 29,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideIntro: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 21,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideStep: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  guideStepTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNumber: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: 'Cairo-Black',
  },
  guideIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: {
    alignItems: 'flex-end',
  },
  guideStepTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideStepBody: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 21,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideStepStatus: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guideAction: {
    width: 142,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 20,
    minHeight: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionMarker: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  statsGrid: {
    marginTop: 10,
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  notice: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  noticeTitle: {
    fontSize: 14.5,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noticeMessage: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noticeAction: {
    minHeight: 34,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeActionText: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
  skeletonLine: {
    height: 16,
    borderRadius: 999,
    alignSelf: 'center',
  },
  skeletonTitle: {
    width: 86,
    height: 28,
  },
  skeletonLogo: {
    width: 62,
    height: 62,
    borderRadius: 18,
  },
  skeletonCard: {
    height: 124,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  skeletonStat: {
    width: '48.5%',
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
  },
});
