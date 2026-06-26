# Navigation Audit

**Date:** 2026-06-24
**Router:** `expo-router` (file-based).

| Flow | Source | Target | Status |
|---|---|---|---|
| Home → category | `(tabs)/index.tsx:513` | `/category/[slug]` (`params.slug`) | PASS — passes real `category.slug` |
| Home "show all" → categories | `index.tsx:511` | `/(tabs)/categories` | PASS |
| Categories → category | `categories.tsx:31` | `/category/[slug]` | PASS |
| Home/cards → provider | `ProviderRowCard.tsx:21` | `/provider/${slug}` | PASS |
| Category → subcategory filter | `category/[slug].tsx:325` | `setParams({subcategorySlug})` | PASS (in-screen) |
| Subcategory deep link → category | `subcategory/[slug].tsx:21/29` | `/category/${categorySlug}` w/ `subcategorySlug` | PASS — falls back to API-resolved parent slug |
| Banner → category/provider/url | `BannerCarousel.tsx:72-79` | route or external | PASS — url now via `openExternalUrl` |
| Provider → WhatsApp/phone/social | `provider/[slug].tsx` | external apps | FIXED (safe-open) |
| Provider → login (gated favorite/review) | `:64/:111/:437` | `/(auth)/login` w/ `redirectTo` | PASS |
| Back buttons | `router.back()` (provider, category) | previous | PASS |
| Review modal / gallery modal close | `setShow…(false)` / `onRequestClose` | dismiss | PASS (gallery added) |

## Findings
- **No broken route names, wrong params, or stale-ID usage found.** All navigation uses `slug` (matching backend route-model-binding by `slug`), not DB ids.
- `redirectTo` is threaded through auth so post-login returns to the originating provider/category. Verify the login screen actually consumes `redirectTo` — **REVIEW** (auth screens not line-audited).
- Modal dismissal: review modal (button), gallery modal (button + Android hardware back via `onRequestClose`). PASS.

## No fixes required in this report (navigation is sound). External-link opening covered in `social-links-audit.md`.
