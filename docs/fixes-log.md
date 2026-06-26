# Delni App — Fixes & Findings Log

Chronological record of changes, discoveries, and decisions made during each work session. Newest entries at the top.

---

## 2026-06-21 — Provider screen review CTA

**File:** `app/provider/[slug].tsx`

**Change:** Show `review_status_message` below the disabled review button for authenticated users who cannot write a review.

- Added `canWriteReview = Boolean(isAuthenticated && provider?.can_review)` (line 32)
- Added `reviewStatusMessage = provider?.review_status_message` (line 33)
- `handleSubmitReview` already guards on `!provider?.can_review` — no change needed there
- Wrapped the authenticated CTA `Pressable` in a `<View>` so a `<Text>` can appear beneath it
- Conditional `<Text>` renders `reviewStatusMessage` when `canWriteReview` is false and the message is non-null
- Disabled button gets `bg-slate-100` class; icon and text switch to slate-400 to signal ineligibility

**Why:** API contract (`ProviderDetail`) exposes `can_review: boolean` and `review_status_message: string | null`. The backend generates the right message for every case (already reviewed, own profile, suspended, etc.) — the frontend just needs to surface it.

**TypeScript check:** `npx tsc --noEmit` — no errors.

---

## 2026-06-21 — Mobile architecture & screen audit (session 2)

**Scope:** Full audit + implementation of Step 1 fixes (API client layer, screen pagination, type safety, build config).

### Files created
- `src/lib/error-parser.ts` — Centralized API error parser. Extracts field-level errors from 422 responses and maps HTTP status codes to Arabic user messages. Use `parseApiError(error)` anywhere a mutation can fail.
- `src/theme/tokens.ts` — Design tokens: colors, spacing, radius, fontSize, fontWeight, touchTarget constant. Single source of truth for brand values.
- `eas.json` — EAS build profiles: development (internal, local API), preview (internal, staging), production (auto-increment version, prod API). **Action required:** fill in real API URLs and App Store Connect IDs before first submission.

### Files modified
- `src/hooks/useApi.ts` — `useCategory(slug, page?)` and `useSubcategory(slug, page?)` now accept a `page` parameter and include it in the query key and request params. Backend confirmed to support `?page` via `paginateProfiles()`.
- `app/category/[slug].tsx` — **Breaking change for UX:** subcategory chips now navigate to `/subcategory/{slug}` instead of client-side filtering. Old behaviour was wrong because it filtered only within the first paginated page. Provider list now accumulates pages with load-more button. Count shown in header.
- `app/subcategory/[slug].tsx` — Removed `any` type on sibling list. Added pagination accumulation + load-more. Active subcategory highlighted in chip rail; siblings navigate to their own screen.
- `app/(tabs)/top-rated.tsx` — Added page accumulation + load-more button. Category filter change resets to page 1.
- `app/(tabs)/favorites.tsx` — Added page accumulation + load-more. Auth-change resets list. Switched to `ProviderRowCard` (consistent with other lists).
- `app/search.tsx` — Added page accumulation + load-more. Filter-change resets to page 1. Removed `reviews` sort option (backend only accepts `top_rated`/`newest`; mapped to `rating`/`newest` in frontend). Active filter count badge on filter button.
- `app/(tabs)/index.tsx` — Added `suggested_providers` section. Search icon changed from broken asset to `Ionicons search-outline`. Category cards now show icon placeholder instead of emoji. "الكل" and "المزيد" action links on section headers. Provider lists use `ProviderRowCard` for vertical native layout.
- `app/(tabs)/_layout.tsx` — Removed hardcoded `fontFamily: 'System'` from tab label style (was overriding system font resolution on Android).

### TypeScript
`npx tsc --noEmit` — no errors after all changes.

### Known issues NOT fixed in this session
- **Search sort bug (backend):** Frontend sends `sort: 'rating'` but `ProfileSearchController` only maps `'top_rated'` → rating. Sending `'rating'` falls through to `$data['sort'] = null`. Result: default backend ordering is used (still rating-based via `applySearchRanking`). Fix requires backend change to accept `rating` as a valid sort value.
- **i18n:** `expo-localization` + `i18next` installed but unused. All strings are still hardcoded. Needs a dedicated i18n pass.
- **EAS.json URLs:** Development IP, staging URL, and production URL are placeholders. Must be updated before running `eas build`.

---

## 2026-06-20 — Architecture freeze (session 1)

**Scope:** React Native app (`c:\laragon\www\delni-app`) — no backend changes in this session.

**Key decisions:**

- Architecture is: **Laravel backend + Filament panel** (web) + **React Native app** (mobile public users). No shared Blade frontend.
- Provider login is via Filament web panel only. React Native is for customers, not providers.
- API contract documented in `docs/api-freeze.md`.

**Files confirmed correct (no changes):**

- `app/provider/[slug].tsx` — review CTA block updated in this session (see entry above)
- `src/types/index.ts` — `ProviderDetail` type already includes `can_review` and `review_status_message`

---

## Ongoing — Security notes

- **Google OAuth secret exposed** in `docker-compose.local.yml` on the Laravel repo: `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`. Must be revoked in Google Cloud Console and purged from git history before any public repo access or deploy. _(Action: user to handle in Google Cloud Console.)_
