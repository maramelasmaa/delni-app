import { useCallback, useState } from 'react';
import { useSubmitReview } from './useApi';

export function useReviewModal(slug: string) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const submitReview = useSubmitReview();

  const handleReviewSubmit = useCallback(() => {
    setReviewError('');
    submitReview.mutate(
      { slug, rating: reviewRating, comment: reviewComment },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewComment('');
          setReviewError('');
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setReviewError(
            axiosErr?.response?.data?.message ||
              'حدث خطأ أثناء إرسال التقييم، حاول مجدداً.'
          );
        },
      }
    );
  }, [slug, reviewRating, reviewComment, submitReview]);

  return {
    showReviewModal,
    setShowReviewModal,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    reviewError,
    handleReviewSubmit,
    isPending: submitReview.isPending,
  };
}
