# Social / Contact Links Audit

**Date:** 2026-06-24

## Backend contract (verified)

`app/Http/Resources/ProviderDetailResource.php` returns:
- `whatsapp_url` → server-built `https://wa.me/<digits>` (`:71`) — **safe/openable**.
- `website` → raw `$this->website` (`:72`) — **as-typed by provider**.
- `social_links.{facebook,instagram,linkedin,github}` → raw column values (`:73-78`) — **as-typed**.

`/contact` (`HomeController::contact`) returns raw `whatsapp`, `phone`, `email`, `facebook`, `address`.

The backend has normalized columns (`instagram_handle`, `facebook_slug`, …) but the resource does **not** use them, so the client receives whatever the provider typed: a full URL, a bare domain (`facebook.com/x`), or a bare handle (`myshop`).

## Bug (BLOCKER for the feature) — links opened without normalization or error handling

| # | Location | Before | Risk |
|---|---|---|---|
| SL-1 | `app/provider/[slug].tsx:334` | `Linking.openURL(item.url)` on raw social/website value | Bare handle/domain → no scheme → iOS rejects, Android may throw; **link silently does nothing** |
| SL-2 | `app/provider/[slug].tsx` whatsapp/phone | `Linking.openURL(...)` no try/catch | Unhandled rejection if app missing |
| SL-3 | `components/provider/ProviderRowCard.tsx:25` | `Linking.openURL(provider.whatsapp_url)` | No error handling |
| SL-4 | `components/home/BannerCarousel.tsx:79` | `Linking.openURL(banner.link_value)` | Filament `url` banner without scheme → fails silently |
| SL-5 | `app/contact.tsx:89` | `Linking.openURL(contact.facebook)` raw | Bare handle → fails |

**Severity:** HIGH. Icons render correctly (Ionicons, hidden when missing — good), but the tap can be a no-op for non-URL values — exactly the "social icon appears but cannot be clicked" symptom in the brief.

## Fix applied

New helper `src/utils/links.ts`:
- `normalizeExternalUrl(raw)` — trims, passes trusted schemes through (collapsing accidental `https://https://`), prefixes `https://` for bare domains/paths.
- `buildSocialUrl(platform, raw)` — per-platform: full URL/domain → normalized; bare handle → `https://<platform>/<handle>` (strips leading `@`).
- `openExternalUrl(raw, {errorMessage})` — normalizes, gates non-http schemes behind `Linking.canOpenURL`, and shows an Arabic `Alert` instead of crashing/failing silently. Returns `boolean`.

Applied at all five sites above plus `/contact` (whatsapp/phone/email/maps). Missing values still hide the button (unchanged). Pattern follows [RN Linking guidance](https://reactnative.dev/docs/linking) and [Expo linking docs](https://docs.expo.dev/linking/into-other-apps/).

## Normalization test matrix (logic in `buildSocialUrl`/`normalizeExternalUrl`)

| Input | Platform | Result |
|---|---|---|
| `facebook.com/name` | facebook | `https://facebook.com/name` |
| `https://facebook.com/name` | facebook | `https://facebook.com/name` |
| `myhandle` | instagram | `https://instagram.com/myhandle` |
| `@myhandle` | instagram | `https://instagram.com/myhandle` |
| `https://instagram.com/x` | instagram | `https://instagram.com/x` |
| `example.com` | website | `https://example.com` |
| `https://https://x.com` | website | `https://x.com` |
| `""` / `null` | any | `null` (button hidden / no-op suppressed) |

> No jest runner is configured in the project, so these are documented as the helper's contract rather than executed tests. Adding `jest-expo` is a dependency change deferred for approval.

## Not changed (by design)

- Backend contract left intact per the brief ("do not change API contracts unless a real blocker"). The client now normalizes, which fully resolves the user-facing issue without a server change. Optional future improvement: have `ProviderDetailResource` emit already-normalized URLs using its existing `*_handle`/`*_slug` columns.
