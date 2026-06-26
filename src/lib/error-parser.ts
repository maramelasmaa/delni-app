import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;

    if (error.response?.status === 422 && data?.errors) {
      const fieldErrors: Record<string, string> = {};
      let firstMessage = '';
      for (const [field, messages] of Object.entries(data.errors)) {
        const msg = Array.isArray(messages) ? (messages[0] ?? '') : String(messages);
        fieldErrors[field] = msg;
        if (!firstMessage) firstMessage = msg;
      }
      return {
        message: firstMessage || data.message || 'يوجد خطأ في البيانات المدخلة',
        fieldErrors,
      };
    }

    const serverMessage = data?.message;
    if (serverMessage) return { message: serverMessage, fieldErrors: {} };

    const status = error.response?.status;
    if (status === 401) return { message: 'انتهت الجلسة، يرجى تسجيل الدخول مجددًا', fieldErrors: {} };
    if (status === 403) return { message: 'غير مصرح لك بهذا الإجراء', fieldErrors: {} };
    if (status === 404) return { message: 'العنصر المطلوب غير موجود', fieldErrors: {} };
    if (status === 429) return { message: 'لقد تجاوزت الحد المسموح به، حاول مرة أخرى لاحقًا', fieldErrors: {} };
    if (error.code === 'ECONNABORTED') return { message: 'انتهت مهلة الاتصال، تحقق من اتصالك بالإنترنت', fieldErrors: {} };
    if (!error.response) return { message: 'لا يوجد اتصال بالإنترنت، تحقق من الشبكة', fieldErrors: {} };
  }

  return { message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى', fieldErrors: {} };
}

/** Picks the first non-empty field error string for a given field name. */
export function getFieldError(parsed: ParsedApiError, field: string): string | undefined {
  return parsed.fieldErrors[field] || undefined;
}
