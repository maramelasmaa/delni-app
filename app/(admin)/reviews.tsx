import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { StarRating } from '../../components/ui/StarRating';
import {
  useAdminFlaggedReviews,
  useAdminOpenProviderReports,
  useAdminReviewMutations,
  useAdminReviews,
  useResolveProviderReport,
  useSuspendUser,
} from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { AdminReview, ProviderReport } from '../../src/types';
import type { ThemeColors } from '../../src/theme/tokens';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'reported', label: 'المبلغ عنها' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  approved: 'منشور',
  pending: 'قيد المراجعة',
  rejected: 'مرفوض',
};

type ReportItem = AdminReview | ProviderReport;

type ReportSection =
  | { key: 'reviews'; title: string; data: AdminReview[] }
  | { key: 'providers'; title: string; data: ProviderReport[] };

const ReportSectionList = SectionList<ReportItem, ReportSection>;

export default function AdminReviewsScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [suspendTarget, setSuspendTarget] = useState<AdminReview | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState('');

  const allReviewsQuery = useAdminReviews({});
  const flaggedReviewsQuery = useAdminFlaggedReviews();
  const providerReportsQuery = useAdminOpenProviderReports();

  const { moderate, resolveFlag, remove } = useAdminReviewMutations();
  const resolveProviderReport = useResolveProviderReport();
  const suspendUser = useSuspendUser();

  const busy = moderate.isPending || resolveFlag.isPending || remove.isPending || suspendUser.isPending;

  const onError = (err: unknown) => showAlert('تعذر التنفيذ', parseApiError(err).message, [{ text: 'حسناً' }]);

  const confirmDelete = (review: AdminReview) => {
    showAlert('حذف التقييم', 'سيتم إخفاء التقييم نهائياً من المنصة.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => remove.mutate({ id: review.id }, { onError }) },
    ]);
  };

  const openSuspend = (review: AdminReview) => {
    setSuspendReason('');
    setSuspendError('');
    setSuspendTarget(review);
  };

  const submitSuspend = () => {
    if (!suspendTarget) return;
    const reason = suspendReason.trim();
    if (reason.length < 10) {
      setSuspendError('سبب الإيقاف يجب أن يكون 10 أحرف على الأقل.');
      return;
    }
    suspendUser.mutate(
      { id: suspendTarget.user_id, reason },
      {
        onSuccess: () => {
          setSuspendTarget(null);
          showAlert('تم الإيقاف', 'تم إيقاف حساب المستخدم.', [{ text: 'حسناً' }]);
        },
        onError: (err) => setSuspendError(parseApiError(err).message),
      },
    );
  };

  const confirmResolveProviderReport = (report: ProviderReport, decision: 'resolve' | 'dismiss') => {
    resolveProviderReport.mutate({ reportId: report.id, decision }, { onError });
  };

  const renderReviewActions = (review: AdminReview) => {
    if (review.flag_pending) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton label="قبول البلاغ وإخفاء التقييم" bg={colors.errorSoft} fg={colors.error} disabled={busy} onPress={() => resolveFlag.mutate({ id: review.id, decision: 'accept' }, { onError })} />
          <ActionButton label="رفض البلاغ" bg={colors.surfaceAlt} fg={colors.textPrimary} disabled={busy} onPress={() => resolveFlag.mutate({ id: review.id, decision: 'reject' }, { onError })} />
          <ActionButton label="حذف التقييم" bg={colors.errorSoft} fg={colors.error} disabled={busy} onPress={() => confirmDelete(review)} />
          <ActionButton label="إيقاف المستخدم" bg={colors.surfaceAlt} fg={colors.textPrimary} disabled={busy} onPress={() => openSuspend(review)} />
        </View>
      );
    }

    return (
      <View style={styles.actionsRow}>
        {review.status !== 'approved' && (
          <ActionButton label="نشر" bg={colors.goldSoft} fg={colors.goldText} disabled={busy} onPress={() => moderate.mutate({ id: review.id, status: 'approved' }, { onError })} />
        )}
        {review.status !== 'rejected' && (
          <ActionButton label="رفض" bg={colors.surfaceAlt} fg={colors.textPrimary} disabled={busy} onPress={() => moderate.mutate({ id: review.id, status: 'rejected' }, { onError })} />
        )}
        <ActionButton label="حذف" bg={colors.errorSoft} fg={colors.error} disabled={busy} onPress={() => confirmDelete(review)} />
      </View>
    );
  };

  const renderReviewCard = (item: AdminReview) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
        </View>
        <View style={styles.reviewerRow}>
          <Text style={[styles.reviewer, { color: colors.textPrimary }]}>{item.user_name}</Text>
          {item.provider_slug ? (
            <Pressable
              onPress={() => router.push({ pathname: '/provider/[slug]', params: { slug: item.provider_slug! } })}
              hitSlop={8}
              style={({ pressed }) => [styles.viewProfileBtn, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.75 : 1 }]}
            >
              <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {item.provider_name ? (
        <Text style={[styles.providerName, { color: colors.textMuted }]}>على: {item.provider_name}</Text>
      ) : null}
      <StarRating value={item.rating} size={14} />
      {item.comment ? <Text style={[styles.comment, { color: colors.textMuted }]}>{item.comment}</Text> : null}
      {item.flag_pending && item.flagged_reason ? (
        <View style={[styles.flagBox, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="flag" size={13} color={colors.error} style={styles.flagIcon} />
          <Text style={[styles.flagText, { color: colors.error }]}>سبب البلاغ: {item.flagged_reason}</Text>
        </View>
      ) : null}
      {renderReviewActions(item)}
    </View>
  );

  const renderProviderReportCard = (item: ProviderReport) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.statusPill, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="flag" size={12} color={colors.error} />
        </View>
        <View style={styles.reviewerRow}>
          <Text style={[styles.reviewer, { color: colors.textPrimary }]}>{item.provider_name ?? 'مزود غير معروف'}</Text>
          {item.provider_slug ? (
            <Pressable
              onPress={() => router.push({ pathname: '/provider/[slug]', params: { slug: item.provider_slug! } })}
              hitSlop={8}
              style={({ pressed }) => [styles.viewProfileBtn, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.75 : 1 }]}
            >
              <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {item.reporter_name ? (
        <Text style={[styles.providerName, { color: colors.textMuted }]}>بلّغ عنه: {item.reporter_name}</Text>
      ) : null}
      <View style={[styles.flagBox, { backgroundColor: colors.errorSoft }]}>
        <Ionicons name="flag" size={13} color={colors.error} style={styles.flagIcon} />
        <Text style={[styles.flagText, { color: colors.error }]}>سبب البلاغ: {item.reason}</Text>
      </View>
      <View style={styles.actionsRow}>
        <ActionButton label="قبول البلاغ" bg={colors.errorSoft} fg={colors.error} disabled={resolveProviderReport.isPending} onPress={() => confirmResolveProviderReport(item, 'resolve')} />
        <ActionButton label="تجاهل البلاغ" bg={colors.surfaceAlt} fg={colors.textPrimary} disabled={resolveProviderReport.isPending} onPress={() => confirmResolveProviderReport(item, 'dismiss')} />
      </View>
    </View>
  );

  const reportSections = useMemo<ReportSection[]>(() => {
    const sections: ReportSection[] = [];
    if (flaggedReviewsQuery.data?.reviews.length) {
      sections.push({ key: 'reviews', title: 'تقييمات مُبلّغ عنها', data: flaggedReviewsQuery.data.reviews });
    }
    if (providerReportsQuery.data?.length) {
      sections.push({ key: 'providers', title: 'مقدمو خدمة مُبلّغ عنهم', data: providerReportsQuery.data });
    }
    return sections;
  }, [flaggedReviewsQuery.data, providerReportsQuery.data]);

  const reportedLoading = flaggedReviewsQuery.isLoading || providerReportsQuery.isLoading;
  const reportedError = flaggedReviewsQuery.isError || providerReportsQuery.isError;
  const reportedRefetching = flaggedReviewsQuery.isRefetching || providerReportsQuery.isRefetching;
  const retryReported = () => {
    flaggedReviewsQuery.refetch();
    providerReportsQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>إدارة التقييمات</Text>
            <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>مراجعة التقييمات والبلاغات المفتوحة</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textMuted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {filter === 'all' ? (
        allReviewsQuery.isLoading ? (
          <LoadingSpinner />
        ) : allReviewsQuery.isError || !allReviewsQuery.data ? (
          <ErrorView error={allReviewsQuery.error} onRetry={allReviewsQuery.refetch} />
        ) : (
          <FlatList
            data={allReviewsQuery.reviews}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 4 }}
            refreshControl={<RefreshControl refreshing={allReviewsQuery.isRefetching} onRefresh={allReviewsQuery.refetch} tintColor={colors.primary} colors={[colors.primary]} />}
            ListEmptyComponent={<EmptyState icon="star-outline" title="لا توجد تقييمات" message="لا يوجد ما يحتاج مراجعتك حالياً." />}
            onEndReached={() => allReviewsQuery.hasNextPage && allReviewsQuery.fetchNextPage()}
            onEndReachedThreshold={0.4}
            ListFooterComponent={allReviewsQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
            renderItem={({ item }) => renderReviewCard(item)}
          />
        )
      ) : reportedLoading ? (
        <LoadingSpinner />
      ) : reportedError ? (
        <ErrorView error={flaggedReviewsQuery.error ?? providerReportsQuery.error} onRetry={retryReported} />
      ) : (
        <ReportSectionList
          sections={reportSections}
          keyExtractor={(item, index) => `${'user_name' in item ? 'review' : 'provider'}-${item.id}-${index}`}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={reportedRefetching} onRefresh={retryReported} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="flag-outline" title="لا توجد بلاغات مفتوحة" message="لا توجد تقييمات أو مزودون مُبلّغ عنهم حالياً." />}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.textMuted, backgroundColor: colors.bg }]}>{section.title}</Text>
          )}
          renderItem={({ item, section }) =>
            section.key === 'reviews' ? renderReviewCard(item as AdminReview) : renderProviderReportCard(item as ProviderReport)
          }
          stickySectionHeadersEnabled={false}
        />
      )}


      <SuspendUserModal
        visible={!!suspendTarget}
        reason={suspendReason}
        error={suspendError}
        pending={suspendUser.isPending}
        colors={colors}
        onChangeReason={(text) => { setSuspendReason(text); setSuspendError(''); }}
        onCancel={() => setSuspendTarget(null)}
        onSubmit={submitSuspend}
      />

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

function ActionButton({ label, bg, fg, disabled, onPress }: { label: string; bg: string; fg: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.actionBtn, { backgroundColor: bg, opacity: disabled || pressed ? 0.6 : 1 }]}
    >
      <Text style={[styles.actionText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

function SuspendUserModal({
  visible,
  reason,
  error,
  pending,
  colors,
  onChangeReason,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  reason: string;
  error: string;
  pending: boolean;
  colors: ThemeColors;
  onChangeReason: (text: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>إيقاف المستخدم</Text>
        <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>سبب الإيقاف</Text>
        <TextInput
          value={reason}
          onChangeText={onChangeReason}
          placeholder="اكتب سبب الإيقاف هنا... (10 أحرف على الأقل)"
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={3}
          textAlign="right"
          style={[styles.modalInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceAlt }]}
        />
        {error ? <Text style={[styles.modalError, { color: colors.error }]}>{error}</Text> : null}
        <View style={styles.modalActions}>
          <Pressable onPress={onSubmit} disabled={pending} style={[styles.modalSubmit, { backgroundColor: colors.error, opacity: pending ? 0.7 : 1 }]}>
            <Text style={styles.modalSubmitText}>{pending ? 'جاري الإيقاف...' : 'إيقاف'}</Text>
          </Pressable>
          <Pressable onPress={onCancel} disabled={pending} style={[styles.modalCancel, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>إلغاء</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, flexDirection: 'row-reverse', alignItems: 'center' },
  titleWrap: { alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerSubtitle: { marginTop: 1, fontSize: 13, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  filterRow: { direction: 'rtl', flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  sectionHeader: { fontSize: 13, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl', paddingBottom: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end', gap: 6 },
  cardTop: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  reviewerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  reviewer: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  viewProfileBtn: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  providerName: { fontSize: 12, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
  statusPill: { paddingHorizontal: 10, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 11, fontFamily: 'Cairo-Bold' },
  comment: { fontSize: 13, lineHeight: 22, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  flagBox: { width: '100%', borderRadius: 12, padding: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  flagIcon: { marginTop: 1 },
  flagText: { flex: 1, fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  actionsRow: { width: '100%', flexDirection: 'row-reverse', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 14, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 22, borderWidth: 1, padding: 18, gap: 10 },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  modalInput: { minHeight: 90, borderRadius: 14, borderWidth: 1, padding: 12, fontFamily: 'Cairo-Regular', fontSize: 14, writingDirection: 'rtl', textAlignVertical: 'top' },
  modalError: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  modalActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 4 },
  modalSubmit: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Cairo-Bold' },
  modalCancel: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
