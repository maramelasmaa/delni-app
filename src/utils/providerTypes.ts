import { Ionicons } from '@expo/vector-icons';

export interface ProviderTypeOption {
  code: string;
  name: string;
}

/**
 * Single source of truth for provider / service-type Arabic labels + icons.
 *
 * Mirrors the backend `App\Models\ProviderType::DEFAULT_OPTIONS` so a given code
 * renders identically in the API, the search filter, the category filter, the
 * provider card, and the provider detail page. Previously each screen hardcoded
 * its own map, which drifted (e.g. `individual` was "مستقل" on the profile but
 * "فرد" in search).
 */
export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  individual: 'فرد',
  company: 'شركة',
  agency: 'وكالة',
  clinic: 'عيادة',
  studio: 'استوديو',
  freelancer: 'مستقل',
  other: 'أخرى',
};

export const PROVIDER_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  individual: 'person-outline',
  company: 'business-outline',
  agency: 'briefcase-outline',
  clinic: 'medkit-outline',
  studio: 'color-palette-outline',
  freelancer: 'person-outline',
  other: 'ellipsis-horizontal-outline',
};

/** Arabic label for a provider-type code; falls back to the raw code, null when empty. */
export function getProviderTypeLabel(code?: string | null): string | null {
  if (!code) return null;
  const key = code.toLowerCase().trim();
  return PROVIDER_TYPE_LABELS[key] ?? code;
}

/** Icon for a provider-type code; safe default for unknown/empty codes. */
export function getProviderTypeIcon(code?: string | null): keyof typeof Ionicons.glyphMap {
  if (!code) return 'briefcase-outline';
  return PROVIDER_TYPE_ICONS[code.toLowerCase().trim()] ?? 'briefcase-outline';
}

/** Filter-dropdown options including the leading "الكل" (All) entry. */
export const PROVIDER_TYPE_FILTER_OPTIONS: ProviderTypeOption[] = [
  { code: '', name: 'الكل' },
  ...Object.entries(PROVIDER_TYPE_LABELS).map(([code, name]) => ({ code, name })),
];
