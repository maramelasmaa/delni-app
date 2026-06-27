/**
 * Utility to format dates and times nicely in Arabic.
 */
import { toEnglishNumbers } from './numberFormatter';

/**
 * Formats an ISO 8601 date string to a friendly relative time (e.g. "منذ يومين", "أمس", "الآن").
 * Falls back to formatAbsoluteDate if the date is older than 7 days.
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If in the future, just show absolute date
  if (diffInSeconds < 0) {
    return formatAbsoluteDate(dateString);
  }

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'الآن';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return 'منذ دقيقة';
    if (diffInMinutes === 2) return 'منذ دقيقتين';
    if (diffInMinutes >= 3 && diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
    return `منذ ${diffInMinutes} دقيقة`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return 'منذ ساعة';
    if (diffInHours === 2) return 'منذ ساعتين';
    if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
    return `منذ ${diffInHours} ساعة`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) return 'أمس';
    if (diffInDays === 2) return 'منذ يومين';
    if (diffInDays >= 3 && diffInDays <= 6) return `منذ ${diffInDays} أيام`;
  }

  // Fallback to absolute date if older than 7 days
  return formatAbsoluteDate(dateString);
}

/**
 * Formats a date string to a clean Arabic date (e.g. "25 يونيو 2026").
 */
export function formatAbsoluteDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return toEnglishNumbers(dateString);
  }

  try {
    // Format using standard Egyptian/Arabic locale with Western digits (1, 2, 3) for clean Cairo font look
    const formatted = new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
    }).format(date);
    return toEnglishNumbers(formatted);
  } catch (e) {
    // Fallback simple parsing
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return toEnglishNumbers(`${year}/${month}/${day}`);
  }
}

/**
 * Formats issue date of credentials (e.g. "2024-05" -> "مايو 2024").
 */
export function formatIssueDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const trimmed = dateString.trim();
  // If it's just a year, return it directly
  if (/^\d{4}$/.test(trimmed)) {
    return toEnglishNumbers(trimmed);
  }

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    return toEnglishNumbers(dateString);
  }

  try {
    const formatted = new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
    }).format(date);
    return toEnglishNumbers(formatted);
  } catch (e) {
    return toEnglishNumbers(dateString);
  }
}
