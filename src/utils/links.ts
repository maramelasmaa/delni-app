import { Alert, Linking } from 'react-native';

/**
 * Link normalization + safe opening for backend-supplied URLs.
 *
 * The Laravel API returns raw provider/contact fields (e.g. `facebook`, `website`)
 * exactly as the provider typed them — which may be a bare handle (`myshop`), a
 * domain without a scheme (`facebook.com/myshop`), or a full URL. Passing those
 * straight to `Linking.openURL` fails silently on iOS and can reject on Android.
 *
 * These helpers normalize the value into an openable URL and open it defensively.
 */

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'github' | 'website';

const SCHEME_RE = /^(https?|mailto|tel|sms|whatsapp|geo):/i;

/**
 * Turn an arbitrary string into an openable URL, or return null if empty.
 * - Trusted schemes (http, mailto, tel, …) pass through (double scheme collapsed).
 * - Anything else is treated as a web address and gets an `https://` prefix.
 */
export function normalizeExternalUrl(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }

  let url = raw.trim();
  if (url === '') {
    return null;
  }

  if (SCHEME_RE.test(url)) {
    // Collapse an accidental double protocol, e.g. "https://https://x.com".
    return url.replace(/^(https?:\/\/)(?:https?:\/\/)+/i, '$1');
  }

  // Bare domain / path / handle → assume https.
  return `https://${url.replace(/^\/+/, '')}`;
}

const SOCIAL_BASES: Record<Exclude<SocialPlatform, 'website'>, string> = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  linkedin: 'https://www.linkedin.com/in/',
  github: 'https://github.com/',
};

/**
 * Build an openable profile URL for a social platform from a raw value that may
 * be a full URL, a bare domain, or just a username/handle.
 */
export function buildSocialUrl(platform: SocialPlatform, raw?: string | null): string | null {
  if (!raw) {
    return null;
  }

  const value = raw.trim();
  if (value === '') {
    return null;
  }

  if (platform === 'website') {
    return normalizeExternalUrl(value);
  }

  // Already a URL or recognizable domain → normalize the scheme only.
  if (SCHEME_RE.test(value) || /\.[a-z]{2,}(\/|$)/i.test(value)) {
    return normalizeExternalUrl(value);
  }

  // Bare handle → attach to the platform's profile base (strip a leading @).
  return `${SOCIAL_BASES[platform]}${value.replace(/^@+/, '')}`;
}

/**
 * Open an external URL safely. Returns true on success. Shows an Arabic alert
 * (no crash, no unhandled rejection) when the link is missing or cannot open.
 */
export async function openExternalUrl(
  raw?: string | null,
  options?: { errorMessage?: string },
): Promise<boolean> {
  const url = normalizeExternalUrl(raw);
  if (!url) {
    return false;
  }

  const message = options?.errorMessage ?? 'تعذّر فتح الرابط على جهازك.';

  try {
    // http/https are universally supported; only gate custom schemes (tel, mailto,
    // whatsapp, …) behind canOpenURL, which needs query-scheme entitlements.
    if (!/^https?:/i.test(url)) {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('تعذّر فتح الرابط', message);
        return false;
      }
    }

    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('تعذّر فتح الرابط', message);
    return false;
  }
}
