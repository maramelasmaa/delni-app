import { AxiosError } from 'axios';
import { parseApiError } from './error-parser';

export const REPORT_MESSAGES = {
  loginRequired: 'يرجى تسجيل الدخول لإرسال البلاغ.',
  ownReview: 'لا يمكنك الإبلاغ عن تقييم كتبته أنت.',
  hiddenProvider: 'لا يمكن الإبلاغ عن هذا التقييم لأن مقدم الخدمة غير ظاهر حالياً.',
  providerOutsideOwnProfile: 'حساب مقدم الخدمة يمكنه الإبلاغ فقط عن تقييمات ملفه الشخصي.',
  reasonTooShort: 'تفاصيل البلاغ يجب أن تكون 10 أحرف على الأقل.',
  rateLimited: 'لقد وصلت إلى الحد اليومي للبلاغات. حاول مرة أخرى لاحقاً.',
  unauthorized: 'لا يمكنك إرسال هذا البلاغ لهذا التقييم.',
} as const;

export function parseReportError(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const parsed = parseApiError(error);
    const serverMessage = parsed.message?.trim();

    if (status === 401) return REPORT_MESSAGES.loginRequired;
    if (status === 422) return serverMessage || REPORT_MESSAGES.reasonTooShort;
    if (status === 429) return REPORT_MESSAGES.rateLimited;
    if (status === 403) return serverMessage || REPORT_MESSAGES.unauthorized;
  }

  return parseApiError(error).message;
}
