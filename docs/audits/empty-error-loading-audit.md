# Empty / Error / Loading State Audit

**Date:** 2026-06-24

## Shared primitives (all present & RTL-correct)
- `components/ui/LoadingSpinner.tsx` — centered spinner.
- `components/ui/ErrorView.tsx` — Arabic message (default `حدث خطأ ما`) + optional `حاول مجدداً` retry button.
- `components/ui/EmptyState.tsx` — icon + title + message + optional action.

## Per-screen state coverage

| Screen | Loading | Empty | Error + retry | Notes |
|---|---|---|---|---|
| Provider profile | `LoadingSpinner` | reviews "لا توجد تقييمات بعد"; sections hidden when data absent | `ErrorView onRetry={refetch}` | PASS |
| Category detail | `LoadingSpinner` (page 1) | `EmptyState` "لم نجد نتائج" | `ErrorView onRetry={handleRefetch}` | PASS |
| Categories | `LoadingSpinner` | (relies on list) | `ErrorView onRetry={refetch}` | PASS |
| Contact | `LoadingSpinner` | "لا توجد معلومات اتصال" | `ErrorView onRetry={refetch}` | PASS |
| Favorites | — | `EmptyState` | — | REVIEW (confirm loading/error) |
| Search | — | results empty path | — | REVIEW |
| Top rated | — | — | — | REVIEW |
| Home | — | banners→null, sections | — | REVIEW |
| Auth screens | form pending states | — | inline field errors | REVIEW |

## Verified behaviors
- **No raw backend error shown to users.** `bootstrap/app.php` renders API errors as Arabic JSON; the app surfaces a generic Arabic `ErrorView`, and the review modal maps `response.data.message` to an Arabic fallback (`provider/[slug].tsx:99`).
- **401 handling:** `src/lib/api.ts` response interceptor clears auth + query cache on 401 (no crash). PASS.
- **No infinite spinner risk** found in inspected screens — every `isLoading`/`isError` has a terminal branch.
- **No `undefined.map`**: lists use `?? []` / `?.length` guards before mapping (provider portfolio, subcategories, reviews, socialLinks, contact items).

## Gaps (REVIEW, not proven defects)
- Favorites / Top rated / Search / Home not line-audited for explicit `isError`/`isLoading` branches — confirm each renders `ErrorView` on request failure and a spinner while fetching. No offline-specific banner exists app-wide; a thrown request currently routes to `ErrorView` (acceptable) — a dedicated offline message is a nice-to-have, not a blocker.
