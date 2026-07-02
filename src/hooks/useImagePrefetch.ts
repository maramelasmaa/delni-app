import { useEffect, useMemo } from 'react';
import { Image } from 'expo-image';

type CachePolicy = 'disk' | 'memory' | 'memory-disk';

function normalizeUrls(urls: Array<string | null | undefined>, limit: number) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= limit) break;
  }

  return out;
}

export function usePrefetchImages(
  urls: Array<string | null | undefined>,
  options?: {
    cachePolicy?: CachePolicy;
    limit?: number;
  },
) {
  const cachePolicy = options?.cachePolicy ?? 'memory-disk';
  const limit = options?.limit ?? 8;
  const urlKey = useMemo(() => urls.map((url) => (url ? url.trim() : '')).join('|'), [urls]);

  const normalized = useMemo(() => normalizeUrls(urls, limit), [limit, urlKey]);
  const key = normalized.join('|');

  useEffect(() => {
    if (normalized.length === 0) return;
    void Image.prefetch(normalized, { cachePolicy }).catch(() => false);
  }, [cachePolicy, key]);
}
