# Media / SVG / Icon Audit

**Date:** 2026-06-24

## Renderers in use
- `expo-image` (`Image`) — raster (png/jpg/webp): covers, logos, portfolio, banners, avatars.
- `react-native-svg` (`SvgUri`) — remote SVG category/subcategory icons.
- `@expo/vector-icons` (`Ionicons`) — static UI icons + fallbacks.
- No `react-native-webview` (not needed).

This matches current guidance: `expo-image` cannot draw SVG, so remote SVGs must use `react-native-svg`'s `SvgUri` ([Expo SVG docs](https://docs.expo.dev/versions/latest/sdk/svg/)).

## Category / subcategory icons (backend SVG) — PASS
`components/ui/CategoryIcon.tsx`:
- Resolves URL via `src/utils/assetUrl.ts` `resolveAssetUrl` (handles absolute, relative `/storage/...`, and rewrites `localhost/127.0.0.1` hosts to the API origin).
- Renders `<SvgUri uri … onError={() => setFailed(true)} />`.
- On missing URL **or** load failure → falls back to an Ionicon.
- ✅ SVG never shows as raw XML; ✅ URL never shown as text; ✅ clean fallback; ✅ consistent `size`.

## Raster media — PASS with fallbacks
| Media | Source field | Fallback |
|---|---|---|
| Provider logo | `logo_url` | `getProviderLogo()` + backend `getFallbackLogo()` (deterministic Unsplash) |
| Provider cover | `cover_url` | `getProviderCover()` + backend fallback |
| Portfolio images | `portfolio_items[].images[]` | section hidden if none |
| Banner image | `image_url` | carousel hidden if no banners; locked 2:1 ratio |
| Avatar (cards) | `logo_url` + `name` initial | `components/ui/Avatar.tsx` |

- Absolute `https` URLs from `asset('storage/...')` — depends on Laravel `storage:link` (present in deploy entrypoint). Documented.
- `expo-image` shows its own background while loading; `recyclingKey` used in lists to avoid flicker.

## Observations / minor (not blocking)
- **MED:** Fallback logos/covers are remote Unsplash URLs (`ProviderDetailResource` + `imageFallback.ts`). If the device is offline or Unsplash is blocked, fallbacks fail too. Consider a bundled local placeholder asset. (Cosmetic; tracked, not fixed.)
- **LOW:** `getProviderLogo` treats any URL containing `localhost:8000` as invalid → fallback; correct for the old dev host, harmless in prod.
- SVG `color` prop only tints SVGs using `currentColor`; hard-coded-fill SVGs keep their colors (documented in the component). Acceptable.

## Verdict: media pipeline is sound. No code change required.
