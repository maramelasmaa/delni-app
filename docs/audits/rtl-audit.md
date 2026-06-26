# RTL / Arabic Layout Audit

**Date:** 2026-06-24
**App is Arabic-first RTL.**

## Verified-good patterns (consistent across inspected screens)
- Rows use `flexDirection: 'row-reverse'` for content that should read right→left (cards, headers, meta rows, action bars).
- Text uses `textAlign: 'right'` + `writingDirection: 'rtl'` for Arabic blocks (provider name/description, reviews, credentials, section titles).
- Long text guarded: `numberOfLines={1}` on provider/category names in cards; `numberOfLines={2}` on the provider hero title; multiline review/description wrap correctly.
- Horizontal lists that should start from the right use `inverted` (`BannerCarousel`, subcategory pills) — natural RTL scroll.
- Back affordance uses `arrow-forward` (points right) intentionally for RTL (`provider/[slug].tsx:200`, `category/[slug].tsx:858`) — correct, not a reversed-arrow bug.
- Pager dots / filter rows use `row-reverse`.

## Observations
- **PASS:** No evidence of clipped Arabic names from code (numberOfLines + flex on info column). Confirm visually with very long names — **REVIEW** on device.
- **REVIEW:** Bottom tab bar order (`(tabs)/_layout.tsx`) not line-audited for RTL ordering of tabs — confirm the tab order reads naturally right→left on device.
- **REVIEW:** Mixed Arabic + Latin/numbers (ratings like `4.5 (12 تقييم)`) render in a `row-reverse` container; looked correct in code but bidi rendering should be eyeballed on device.
## BUG (was BLOCKER) — conflicting RTL strategies double-flipped all horizontal layouts → FIXED

**Cause:** `app/_layout.tsx` called `I18nManager.allowRTL(true)` + `forceRTL(true)`, making `I18nManager.isRTL === true`. But the rest of the app is **hand-mirrored** for an LTR base — explicit `flexDirection: 'row-reverse'`, `inverted` horizontal lists, and `textAlign: 'right'`. When RTL is actually forced, the OS auto-flips horizontal layouts too, so the manual `row-reverse`/`inverted` **double-flipped back to left-to-right**. Symptom: all filter rows/carousels (top-rated category pills, category subcategory pills, search & filter-modal chips, banner carousel, city grid) started from the **left** instead of the right.

Only `components/city/CitySheet.tsx` was authored for `isRTL === true` (it branched on `I18nManager.isRTL`), so it looked correct while everything else broke — confirming the two halves of the app assumed opposite bases.

**Fix:**
1. `app/_layout.tsx` now pins the LTR base — `I18nManager.allowRTL(false)` + `forceRTL(false)` — so the explicit per-component mirroring (the app's actual, dominant convention) renders correctly. Guarantees `isRTL === false` on every device regardless of device locale.
2. `components/city/CitySheet.tsx` converted from `isRTL ? … : …` branching to the same manual-mirror convention as the rest of the app (`row-reverse`, `textAlign: 'right'`, `alignItems: 'flex-end'`, `chevron-back`, grid `row-reverse`). Removed its `I18nManager` import.
3. Removed the unused `I18nManager` import in `app/(tabs)/top-rated.tsx`.

**Before:** filters/carousels/city grid anchored left. **After:** anchored right (RTL-correct).
**Caveat:** `forceRTL` persists natively — the change takes effect after an app **reload/rebuild**; on a device that previously ran the forced-RTL build, relaunch once after updating. ✅ `tsc --noEmit` clean.
Refs: [RN RTL support](https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps), [Expo linking/RTL overview](https://docs.expo.dev/linking/overview/).

## Remaining items are device-visual confirmations, not code defects.
