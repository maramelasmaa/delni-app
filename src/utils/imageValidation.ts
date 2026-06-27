/**
 * Checks if a URL is valid for display (not a placeholder or invalid)
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    !url.includes('placeholder') &&
    !url.includes('default') &&
    url.trim() !== '' &&
    !url.includes('localhost:8000')
  );
}
