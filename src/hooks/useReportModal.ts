import { useCallback, useState } from 'react';
import { useFlagReview } from './useApi';

type ReportReason = 'offensive' | 'misleading' | 'spam' | 'other';

export function useReportModal() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewIdState, setReportReviewIdState] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<ReportReason>('offensive');
  const [customReportReason, setCustomReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const flagReview = useFlagReview();

  const handleReportSubmit = useCallback(() => {
    if (!reportReviewIdState) return;

    const label =
      reportReasonType === 'offensive'
        ? 'محتوى مسيء أو غير لائق'
        : reportReasonType === 'misleading'
          ? 'معلومات مضللة أو كاذبة'
          : reportReasonType === 'spam'
            ? 'رسائل مزعجة (سبام)'
            : 'سبب آخر';

    const combinedReason = customReportReason.trim()
      ? `${label}: ${customReportReason.trim()}`
      : `تم الإبلاغ من مستخدم التطبيق - ${label}`;

    if (combinedReason.length < 10) {
      setReportError('تفاصيل البلاغ يجب أن تكون 10 أحرف على الأقل.');
      return;
    }

    if (reportReasonType === 'other' && !customReportReason.trim()) {
      setReportError('يرجى كتابة تفاصيل السبب الآخر.');
      return;
    }

    flagReview.mutate(
      { reviewId: reportReviewIdState, reason: combinedReason },
      {
        onSuccess: () => {
          setShowReportModal(false);
          setReportReviewIdState(null);
          setCustomReportReason('');
          setReportReasonType('offensive');
          setReportError('');
        },
        onError: () => {
          setReportError('تعذر إرسال البلاغ، يرجى المحاولة مجدداً.');
        },
      }
    );
  }, [reportReviewIdState, reportReasonType, customReportReason, flagReview]);

  return {
    showReportModal,
    setShowReportModal,
    reportReviewIdState,
    setReportReviewIdState,
    reportReasonType,
    setReportReasonType,
    customReportReason,
    setCustomReportReason,
    reportError,
    setReportError,
    handleReportSubmit,
    isPending: flagReview.isPending,
  };
}
