import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorView } from '../../components/ui/ErrorView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RTLAlert, useRTLAlert } from '../../components/ui/RTLAlert';
import { StarRating } from '../../components/ui/StarRating';
import { useAdminReviewMutations, useAdminReviews } from '../../src/hooks/useAdminManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseApiError } from '../../src/lib/error-parser';
import type { AdminReview } from '../../src/types';

const FILTERS = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'flagged', label: 'المبلغ عنها' },
  { key: 'all', label: 'الكل' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  approved: 'منشور',
  pending: 'قيد المراجعة',
  rejected: 'مرفوض',
};

export default function AdminReviewsScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [filter, setFilter] = useState<FilterKey>('pending');

  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminReviews({
    status: filter === 'pending' ? 'pending' : undefined,
    flagged: filter === 'flagged' ? true : undefined,
  });
  const { moderate, resolveFlag, remove } = useAdminReviewMutations();

  const busy = moderate.isPending || resolveFlag.isPending || remove.isPending;

  const onError = (err: unknown) => showAlert('تعذر التنفيذ', parseApiError(err).message, [{ text: 'حسناً' }]);

  const confirmDelete = (review: AdminReview) => {
    showAlert('حذف التقييم', 'سيتم إخفاء التقييم نهائياً من المنصة.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => remove.mutate({ id: review.id }, { onError }) },
    ]);
  };

  const renderActions = (review: AdminReview) => {
    if (review.flag_pending) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton label="قبول البلاغ وإخفاء التقييم" bg={colors.errorSoft} fg={colors.error} disabled={busy} onPress={() => resolveFlag.mutate({ id: review.id, decision: 'accept' }, { onError })} />
          <ActionButton label="رفض البلاغ" bg={colors.surfaceAlt} fg={colors.textPrimary} disabled={busy} onPress={() => resolveFlag.mutate({ id: review.id, decision: 'reject' }, { onError })} />
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>إدارة التقييمات</Text>
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

      {isLoading ? (
        <LoadingSpinner />
      ) : isError || !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data.reviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="star-outline" title="لا توجد تقييمات" message="لا يوجد ما يحتاج مراجعتك في هذا الفلتر." />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.statusPill, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.statusText, { color: colors.textMuted }]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
                <Text style={[styles.reviewer, { color: colors.textPrimary }]}>{item.user_name}</Text>
              </View>
              {item.provider_name ? (
                <Text style={[styles.providerName, { color: colors.textMuted }]}>على: {item.provider_name}</Text>
              ) : null}
              <StarRating value={item.rating} size={14} />
              {item.comment ? <Text style={[styles.comment, { color: colors.textMuted }]}>{item.comment}</Text> : null}
              {item.flag_pending && item.flagged_reason ? (
                <View style={[styles.flagBox, { backgroundColor: colors.errorSoft }]}>
                  <Text style={[styles.flagText, { color: colors.error }]}>سبب البلاغ: {item.flagged_reason}</Text>
                </View>
              ) : null}
              {renderActions(item)}
            </View>
          )}
        />
      )}

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

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 26, fontFamily: 'Cairo-Black' },
  filterRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end', gap: 6 },
  cardTop: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  reviewer: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  providerName: { fontSize: 12, fontFamily: 'Cairo-SemiBold', writingDirection: 'rtl' },
  statusPill: { paddingHorizontal: 10, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 11, fontFamily: 'Cairo-Bold' },
  comment: { fontSize: 13, lineHeight: 22, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  flagBox: { width: '100%', borderRadius: 12, padding: 10 },
  flagText: { fontSize: 12, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  actionsRow: { width: '100%', flexDirection: 'row-reverse', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 14, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontFamily: 'Cairo-Bold' },
});
