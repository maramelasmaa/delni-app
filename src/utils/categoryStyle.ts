import type { Ionicons } from '@expo/vector-icons';

export function getCategoryIcon(slug: string, name: string): keyof typeof Ionicons.glyphMap {
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('maintenance') || s.includes('صيانة') || s.includes('تصليح') || s.includes('كهرباء') || s.includes('سباكة')) {
    return 'construct-outline';
  }
  if (s.includes('design') || s.includes('تصميم') || s.includes('فنون') || s.includes('ديكور')) {
    return 'color-palette-outline';
  }
  if (s.includes('car') || s.includes('سيارات') || s.includes('نقل') || s.includes('سائق')) {
    return 'car-outline';
  }
  if (s.includes('medical') || s.includes('طب') || s.includes('صحة') || s.includes('علاج')) {
    return 'medkit-outline';
  }
  if (s.includes('edu') || s.includes('تعليم') || s.includes('تدريس') || s.includes('دراسة')) {
    return 'book-outline';
  }
  if (s.includes('beauty') || s.includes('تجميل') || s.includes('صالون') || s.includes('شعر')) {
    return 'sparkles-outline';
  }
  if (s.includes('tech') || s.includes('code') || s.includes('program') || s.includes('برمجة') || s.includes('تطوير') || s.includes('كمبيوتر') || s.includes('تقنية')) {
    return 'code-slash-outline';
  }
  if (s.includes('market') || s.includes('adver') || s.includes('promo') || s.includes('تسويق') || s.includes('اعلان') || s.includes('إعلان')) {
    return 'megaphone-outline';
  }
  if (s.includes('photo') || s.includes('camera') || s.includes('media') || s.includes('تصوير') || s.includes('كاميرا') || s.includes('ميديا') || s.includes('إعلام') || s.includes('اعلام')) {
    return 'camera-outline';
  }
  if (s.includes('clean') || s.includes('تنظيف') || s.includes('غسيل')) {
    return 'water-outline';
  }
  if (s.includes('cook') || s.includes('طباخ') || s.includes('أكل') || s.includes('مطعم')) {
    return 'restaurant-outline';
  }
  return 'briefcase-outline';
}


export interface CategoryPalette {
  bg: string;
  border: string;
  icon: string;
  activeBg?: string;
}

const MUSTARD_PALETTE: CategoryPalette = {
  bg: '#FFFBEB',
  border: '#FDE68A',
  icon: '#E1AD01',
  activeBg: '#FEF3C7',
};

// All categories share the same mustard yellow brand palette.
// New categories added from Filament automatically use this.
export function getCategoryPalette(_slug: string, _name: string): CategoryPalette {
  return MUSTARD_PALETTE;
}

/**
 * Correct Arabic pluralization for provider counts.
 *   0        → لا يوجد مزودون
 *   1        → مزود واحد
 *   2        → مزودان
 *   3–10     → X مزودين
 *   11+      → X مزود
 */
export function formatProviderCount(count: number): string {
  if (count === 0) return 'لا يوجد مزودون';
  if (count === 1) return 'مزود واحد';
  if (count === 2) return 'مزودان';
  if (count <= 10) return `${count} مزودين`;
  return `${count} مزود`;
}

/**
 * Correct Arabic pluralization for subcategory counts.
 *   1        → 1 خدمة فرعية
 *   2        → 2 خدمة فرعية
 *   3–10     → X خدمات فرعية
 *   11+      → X خدمة فرعية
 */
export function formatSubcategoryCount(count: number): string {
  if (count === 1) return '1 خدمة فرعية';
  if (count === 2) return '2 خدمة فرعية';
  if (count <= 10) return `${count} خدمات فرعية`;
  return `${count} خدمة فرعية`;
}

