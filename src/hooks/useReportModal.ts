import { useCallback, useState } from 'react';
import { useFlagReview } from './useApi';
import { parseReportError, REPORT_MESSAGES } from '../lib/report-errors';

type ReportReason = 'offensive' | 'misleading' | 'spam' | 'other';

export function useReportModal() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewIdState, setReportReviewIdState] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<ReportReason>('offensive');
  const [customReportReason, setCustomReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const flagReview = useFlagReview();

  const handleReportSubmit = useCallback(() => {
    if (!reportReviewIdState) {
      setReportError('تعذر تحديد التقييم المراد الإبلاغ عنه. أغلق النافذة وحاول مرة أخرى.');
      return;
    }

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
      setReportError(REPORT_MESSAGES.reasonTooShort);
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
        onError: (error) => {
          setReportError(parseReportError(error));
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
