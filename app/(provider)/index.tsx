import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileCompletionCard } from '../../components/provider/ProfileCompletionCard';
import { ProviderStatItem } from '../../components/provider/ProviderStatItem';
import { ProviderStatusBadge } from '../../components/provider/ProviderStatusBadge';
import { ErrorView } from '../../components/ui/ErrorView';
import { useProviderDashboard } from '../../src/hooks/useProviderDashboard';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/theme/tokens';
import type { Review } from '../../src/types';
import { getProviderLogo } from '../../src/utils/imageFallback';

const REVIEW_PREVIEW_LIMIT = 3;

type ProviderManageRoute = '/(provider)/profile-edit' | '/(provider)/portfolio' | '/(provider)/credentials' | '/(provider)/reviews';

function formatRating(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}

function formatReviewDate(dateString: string | null | undefined) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      numberingSystem: 'latn',
    }).format(date);
  } catch {
    return '';
  }
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

function ReviewStatusPill({ status, colors }: { status?: string; colors: ThemeColors }) {
  if (!status || status === 'approved') return null;

  const label = status === 'pending' ? 'قيد المراجعة' : status === 'rejected' ? 'مرفوض' : status;

  return (
    <View style={[styles.reviewStatus, { backgroundColor: colors.surfaceAlt }]}>
      <Text numberOfLines={1} style={[styles.reviewStatusText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function RecentReviewRow({ review, colors }: { review: Review; colors: ThemeColors }) {
  const date = formatReviewDate(review.created_at);

  return (
    <View style={[styles.reviewRow, { borderColor: colors.border }]}>
      <View style={[styles.ratingPill, { backgroundColor: colors.goldSoft }]}>
        <Ionicons name="star" size={14} color={colors.star} />
        <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{review.rating}</Text>
      </View>
      <View style={styles.reviewContent}>
        <View style={styles.reviewTopLine}>
          {date ? <Text numberOfLines={1} style={[styles.reviewDate, { color: colors.textMuted }]}>{date}</Text> : null}
          <ReviewStatusPill status={review.status} colors={colors} />
        </View>
        <Text numberOfLines={1} style={[styles.reviewName, { color: colors.textPrimary }]}>{review.user_name || 'عميل دلني'}</Text>
        <Text numberOfLines={2} style={[styles.reviewComment, { color: colors.textMuted }]}>{review.comment || 'لم يكتب العميل تعليقًا.'}</Text>
      </View>
    </View>
  );
}

function ManageRow({
  icon,
  title,
  subtitle,
  route,
  isLast = false,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: ProviderManageRoute;
  isLast?: boolean;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => router.push(route as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}
    >
      <View style={[styles.manageRow, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 }]}>
        <Ionicons name="chevron-back" size={17} color={colors.textMuted} style={styles.manageChevron} />
        <View style={styles.manageText}>
          <Text numberOfLines={1} style={[styles.manageTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text numberOfLines={1} style={[styles.manageSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.manageIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name={icon} size={19} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
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
            <View style={[styles.skeletonLine, { width: '52%', marginTop: 10, backgroundColor: colors.surfaceAlt }]} />
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

export default function ProviderDashboardScreen() {
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useProviderDashboard();

  if (isLoading) return <DashboardSkeleton colors={colors} />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  const { profile, stats } = data;
  const logo = getProviderLogo(profile.logo_url, profile.id);
  const recentReviews = data.recent_reviews.slice(0, REVIEW_PREVIEW_LIMIT);
  const showVisibilityNotice = stats.is_complete && !stats.is_discoverable;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 116 }}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>لوحة التحكم</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>ملخص أداء ملفك التجاري</Text>
        </View>

        <View style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
          <View style={styles.identityText}>
            <Text numberOfLines={2} style={[styles.businessName, { color: colors.textPrimary }]}>{profile.name}</Text>
            <Text numberOfLines={1} style={[styles.businessMeta, { color: colors.textMuted }]}>
              {[profile.category?.name, profile.city?.name].filter(Boolean).join(' · ') || 'بيانات النشاط غير مكتملة'}
            </Text>
            <ProviderStatusBadge isComplete={stats.is_complete} isDiscoverable={stats.is_discoverable} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تعديل الملف التجاري"
            onPress={() => router.push('/(provider)/profile-edit' as never)}
            hitSlop={8}
            style={({ pressed }) => [styles.editProfileButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <ProfileCompletionCard
          percentage={stats.completion_percentage}
          isComplete={stats.is_complete}
          onCompletePress={() => router.push('/(provider)/profile-edit' as never)}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionMarker, { backgroundColor: colors.gold }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>نظرة عامة</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <ProviderStatItem label="متوسط التقييم" value={formatRating(stats.rating_average)} icon="star" />
          <ProviderStatItem label="إجمالي التقييمات" value={String(stats.reviews_count)} icon="chatbubbles" />
          <ProviderStatItem label="أعمال المعرض" value={String(stats.portfolio_items_count)} icon="images" />
          <ProviderStatItem label="الشهادات والخبرات" value={String(stats.credentials_count)} icon="ribbon" />
          <ProviderStatItem label="المدة المتبقية" value={formatAccessRemaining(stats.provider_access_ends_at)} icon="time" />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionMarker, { backgroundColor: colors.gold }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>إدارة الملف</Text>
          </View>
        </View>
        <View style={[styles.manageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ManageRow icon="create-outline" title="تعديل بيانات الملف" subtitle="الاسم والوصف ومعلومات التواصل" route="/(provider)/profile-edit" colors={colors} />
          <ManageRow icon="images-outline" title="الأعمال والمعرض" subtitle="إدارة الأعمال وصور المشاريع" route="/(provider)/portfolio" colors={colors} />
          <ManageRow icon="ribbon-outline" title="الشهادات والخبرات" subtitle="إضافة الشهادات والاعتمادات" route="/(provider)/credentials" colors={colors} />
          <ManageRow icon="chatbubbles-outline" title="التقييمات" subtitle="مراجعة تقييمات العملاء" route="/(provider)/reviews" isLast colors={colors} />
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

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionMarker, { backgroundColor: colors.gold }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>أحدث التقييمات</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="عرض كل التقييمات"
            onPress={() => router.push('/(provider)/reviews' as never)}
            hitSlop={8}
            style={({ pressed }) => [styles.sectionAction, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[styles.sectionActionText, { color: colors.primary }]}>عرض الكل</Text>
          </Pressable>
        </View>

        <View style={[styles.reviewsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {recentReviews.length > 0 ? recentReviews.map((review) => <RecentReviewRow key={review.id} review={review} colors={colors} />) : (
            <View style={styles.emptyReviews}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>لا توجد تقييمات بعد</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>ستظهر أحدث تقييمات العملاء هنا.</Text>
            </View>
          )}
        </View>
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
    padding: 14,
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
  editProfileButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Cairo-Black',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  businessMeta: {
    marginTop: 1,
    fontSize: 12.5,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
    writingDirection: 'rtl',
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
  sectionAction: {
    minHeight: 34,
    minWidth: 64,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sectionActionText: {
    fontSize: 12.5,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  manageCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  manageRow: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  manageText: {
    marginRight: 52,
    marginLeft: 29,
    alignItems: 'flex-end',
  },
  manageIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageChevron: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -8.5 }],
  },
  manageTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  manageSubtitle: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
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
  reviewsPanel: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reviewRow: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  ratingPill: {
    minWidth: 48,
    minHeight: 32,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12.5,
    fontFamily: 'Cairo-Bold',
  },
  reviewContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reviewTopLine: {
    minHeight: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
  },
  reviewStatus: {
    minHeight: 20,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewStatusText: {
    fontSize: 10.5,
    fontFamily: 'Cairo-Bold',
    writingDirection: 'rtl',
  },
  reviewName: {
    marginTop: 2,
    fontSize: 13.5,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reviewComment: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyReviews: {
    padding: 18,
    alignItems: 'flex-end',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  skeletonLine: {
    height: 16,
    borderRadius: 999,
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
