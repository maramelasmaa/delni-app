import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
import { useFlagReview } from '../../src/hooks/useApi';
import { useMyReviews } from '../../src/hooks/useProviderManagement';
import { useTheme } from '../../src/hooks/useTheme';
import { parseReportError } from '../../src/lib/report-errors';
import type { Review } from '../../src/types';

const FLAG_RESPONSE_LABELS: Record<string, string> = {
  pending: 'بانتظار رد الإدارة',
  accepted: 'تم قبول البلاغ',
  rejected: 'تم رفض البلاغ',
};

export default function ProviderReviewsScreen() {
  const { colors } = useTheme();
  const { alert, showAlert, hideAlert } = useRTLAlert();
  const [reportReview, setReportReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyReviews();
  const reviews = data?.pages.flatMap((page) => page.reviews) ?? [];
  const flagReview = useFlagReview();

  const closeReport = () => {
    if (flagReview.isPending) return;
    setReportReview(null);
    setReportReason('');
    setReportError('');
  };

  const submitReport = () => {
    if (!reportReview) return;
    const reason = reportReason.trim();
    if (reason.length < 10) {
      setReportError('سبب البلاغ يجب أن يكون 10 أحرف على الأقل.');
      return;
    }

    flagReview.mutate(
      { reviewId: reportReview.id, reason },
      {
        onSuccess: () => {
          setReportReview(null);
          setReportReason('');
          setReportError('');
          refetch();
          showAlert('تم إرسال البلاغ', 'سيقوم فريق الإدارة بمراجعة التقييم والرد على البلاغ.', [{ text: 'حسناً' }]);
        },
        onError: (reportRequestError) => setReportError(parseReportError(reportRequestError)),
      },
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>التقييمات</Text>
        <Text style={[styles.headerDot, { color: colors.gold }]}>.</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, gap: 12, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState icon="star-outline" title="لا توجد تقييمات" message="عندما يقيمك العملاء ستظهر تقييماتهم هنا." />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <Text style={[styles.reviewer, { color: colors.textPrimary }]}>{item.user_name}</Text>
              {item.can_flag ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="الإبلاغ عن التقييم"
                  hitSlop={8}
                  onPress={() => {
                    setReportReview(item);
                    setReportReason('');
                    setReportError('');
                  }}
                  style={({ pressed }) => [styles.flagIconButton, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <StarRating value={item.rating} size={14} />
            {item.created_at ? (
              <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString('ar-LY')}</Text>
            ) : null}
            {item.comment ? (
              <Text style={[styles.comment, { color: colors.textMuted }]}>{item.comment}</Text>
            ) : null}
            {item.flag_response ? (
              <View style={[styles.flagStatus, {
                backgroundColor: item.flag_response === 'accepted'
                  ? colors.successSoft
                  : item.flag_response === 'rejected'
                    ? colors.errorSoft
                    : colors.goldSoft,
              }]}> 
                <Text style={[styles.flagStatusText, {
                  color: item.flag_response === 'accepted'
                    ? colors.success
                    : item.flag_response === 'rejected'
                      ? colors.error
                      : colors.goldText,
                }]}> 
                  {FLAG_RESPONSE_LABELS[item.flag_response]}
                </Text>
              </View>
            ) : null}
            {item.moderation_note ? (
              <Text style={[styles.decisionText, { color: colors.textMuted }]}>سبب القرار: {item.moderation_note}</Text>
            ) : null}
          </View>
        )}
      />

      <Modal visible={reportReview !== null} transparent animationType="fade" onRequestClose={closeReport}>
        <View style={styles.modalOverlay}>
          <View style={[styles.reportSheet, { backgroundColor: colors.surfaceElevated }]}> 
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>الإبلاغ عن تقييم</Text>
            <Text style={[styles.modalDescription, { color: colors.textMuted }]}>سيتم إرسال سبب البلاغ للإدارة لمراجعته.</Text>
            <TextInput
              value={reportReason}
              onChangeText={(value) => {
                setReportReason(value);
                if (reportError) setReportError('');
              }}
              placeholder="اشرح سبب الإبلاغ عن هذا التقييم"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              style={[styles.reasonInput, { color: colors.textPrimary, borderColor: reportError ? colors.error : colors.border, backgroundColor: colors.surface }]}
            />
            {reportError ? <Text style={[styles.reportError, { color: colors.error }]}>{reportError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={closeReport} disabled={flagReview.isPending} style={[styles.cancelButton, { borderColor: colors.border }]}> 
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={submitReport} disabled={flagReview.isPending} style={[styles.submitButton, { backgroundColor: colors.primary }]}> 
                {flagReview.isPending ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.textOnPrimary }]}>إرسال البلاغ</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RTLAlert alert={alert} onDismiss={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: 'row-reverse', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Cairo-Black' },
  headerDot: { fontSize: 28, fontFamily: 'Cairo-Black' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'flex-end', gap: 6 },
  cardTop: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  flagIconButton: { width: 30, height: 30, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  reviewer: { fontSize: 14, fontFamily: 'Cairo-Bold', writingDirection: 'rtl' },
  comment: { fontSize: 13, lineHeight: 22, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  reviewDate: { fontSize: 11, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  flagStatus: { marginTop: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  flagStatusText: { fontSize: 11, fontFamily: 'Cairo-Bold', textAlign: 'right', writingDirection: 'rtl' },
  decisionText: { width: '100%', fontSize: 12, lineHeight: 19, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, backgroundColor: 'rgba(0,0,0,0.48)' },
  reportSheet: { borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 19, fontFamily: 'Cairo-Black', textAlign: 'right', writingDirection: 'rtl' },
  modalDescription: { marginTop: 4, fontSize: 13, lineHeight: 20, fontFamily: 'Cairo-Regular', textAlign: 'right', writingDirection: 'rtl' },
  reasonInput: { minHeight: 120, marginTop: 16, borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 13, lineHeight: 21, fontFamily: 'Cairo-Regular', textAlign: 'right', textAlignVertical: 'top', writingDirection: 'rtl' },
  reportError: { marginTop: 6, fontSize: 11, fontFamily: 'Cairo-SemiBold', textAlign: 'right', writingDirection: 'rtl' },
  modalActions: { marginTop: 18, flexDirection: 'row-reverse', gap: 10 },
  submitButton: { flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
  cancelButton: { minHeight: 48, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Cairo-Bold' },
});
