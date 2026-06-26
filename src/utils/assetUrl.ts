import { API_BASE_URL } from '../constants/api';

function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return null;
  }
}

export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const apiOrigin = getApiOrigin();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!apiOrigin) return trimmed;

    try {
      const assetUrl = new URL(trimmed);
      const apiUrl = new URL(apiOrigin);

      if (
        assetUrl.hostname === 'localhost' ||
        assetUrl.hostname === '127.0.0.1' ||
        assetUrl.hostname === '0.0.0.0'
      ) {
        assetUrl.protocol = apiUrl.protocol;
        assetUrl.host = apiUrl.host;
      }

      return assetUrl.toString();
    } catch {
      return trimmed;
    }
  }

  if (!apiOrigin) return trimmed;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiOrigin}${normalizedPath}`;
}
