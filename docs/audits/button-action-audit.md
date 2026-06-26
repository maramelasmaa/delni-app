# Button / Pressable Action Audit

**Date:** 2026-06-24
**Method:** Grepped every `Pressable`/`onPress` across `app/` + `components/`; inspected each interactive surface for a real action, navigation target, and failure handling. No `onPress={() => {}}`, `onPress={undefined}`, `TODO`, or `FIXME` patterns were found.

| Screen | Button / icon | File | Expected | Before | Status |
|---|---|---|---|---|---|
| Provider profile | Portfolio image | `app/provider/[slug].tsx:545` | Open image lightbox | Set `galleryItem`/`galleryIndex` state — **no modal consumed it → no-op** | **FIXED** |
| Provider profile | Social icon | `:334` | Open profile | `openURL(raw)` could silently fail | **FIXED** (`openExternalUrl`) |
| Provider profile | WhatsApp / Call | `:283/:302` | Open wa.me / dialer | No error handling | **FIXED** |
| Provider profile | Favorite / Review / Flag / Back | — | navigate / mutate / alert | Correct | PASS |
| Provider row card | WhatsApp | `ProviderRowCard.tsx:103` | Open wa.me | No error handling | **FIXED** |
| Provider row card | Card / Favorite | — | provider→ / toggle | Correct | PASS |
| Banner | Banner tap | `BannerCarousel.tsx:144` | category/provider/url | `url` type `openURL` no handling | **FIXED** |
| Category detail | Subcategory pill / filters / load more | `category/[slug].tsx` | filter / paginate | Correct | PASS |
| Categories | Category card | `categories.tsx:30` | category→ | Correct (passes real slug) | PASS |
| Home | Category / provider / city / search | `(tabs)/index.tsx` | navigate | Correct | PASS |
| Contact | All rows | `contact.tsx` | open channel | raw `openURL` | **FIXED** |
| Auth | Submit / nav links | `(auth)/*` | submit / navigate | Not line-audited | REVIEW |

## Headline bug — Portfolio image tap was a dead affordance

**Cause:** `app/provider/[slug].tsx` declared `const [galleryItem, setGalleryItem] = useState(...)` and called `setGalleryItem(item)` / `setGalleryIndex(imgIdx)` on image press, but the only `<Modal>` in the file was the review modal. Nothing read `galleryItem`, so tapping a portfolio image visibly pressed but did nothing.

**Fix:** Added a transparent full-screen lightbox `<Modal>` (visible when `galleryItem !== null`) with a paged horizontal `ScrollView` over `galleryItem.images`, starting at `galleryIndex`, `contentFit="contain"`, dark backdrop, RTL close button, and `onRequestClose` (Android back) → dismiss.

**Before:** tap → nothing. **After:** tap → fullscreen swipeable gallery starting at the tapped image.
**Test method:** open a provider with portfolio images, tap one → lightbox opens at that image; swipe; close via button or Android back.
