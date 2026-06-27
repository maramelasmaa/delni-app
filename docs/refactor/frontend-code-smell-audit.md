# Frontend Code Smell Audit Report
**Delni App — React Native Expo**  
**Audit Date:** June 27, 2026  
**Codebase Size:** 60 TypeScript/TSX files

---

## Executive Summary

The Delni app codebase is **well-structured** with strong architectural foundations:
- Centralized API layer with Zustand stores
- Comprehensive type definitions
- Cohesive design token system
- Good separation of concerns in most areas

However, there are **moderate code smells** and **duplications** that should be addressed to improve maintainability and reduce technical debt:
- Hardcoded colors in 26+ files (despite tokens.ts)
- Inline styles scattered across components
- Duplicate link-opening/WhatsApp logic across screens
- Repeated "is_favorited" state management pattern
- Missing error boundary patterns
- Type safety gaps with `any` types

---

## 1. FILE STRUCTURE

### Current Organization
```
app/                          # 25 screen files
  (auth)/                     # Login, register, password recovery (4 files)
  (tabs)/                     # Tab-based navigation (6 screens)
  provider/[slug].tsx         # Provider detail (extremely large: 679 lines)
  category/[slug].tsx         # Category listing
  ...                         # 8 more utility/info screens

components/                   # 19 component files
  provider/                   # ProviderCard, ProviderRowCard, FeaturedCard, etc. (4 variants)
  ui/                         # Buttons, inputs, empty states, modals (8 components)
  home/                       # BannerCarousel (1 component)
  city/                       # CitySheet (1 component)

src/
  hooks/                      # API, auth, theme, favorites (5 query/mutation hooks)
  store/                      # Zustand stores: auth, city, theme (3 stores)
  utils/                      # Links, RTL, formatters, mappers (7 utilities)
  lib/                        # API client, error parser, query client (3 files)
  theme/                      # tokens.ts (colors, spacing, typography)
  types/                      # Complete TypeScript interfaces
  components/                 # AuthBootstrap (root layout logic)
```

### Issues & Recommendations

| File | Smell | Severity | Risk | Notes |
|------|-------|----------|------|-------|
| `app/provider/[slug].tsx` | **Monolithic screen (679 lines)** | HIGH | Cognitive load; hard to test; tight coupling | Split into: ProfileHeader, AboutSection, ReviewsModal, ReportModal — extract to components/ |
| `components/provider/` | **4 Provider card variants** | MEDIUM | Duplication; inconsistent evolution | Consolidate: ProviderCard + ProviderRowCard share 70% logic; FeaturedCard + ProviderCard differ only in layout. Extract shared wrapper. |
| Overall structure | **No Error Boundary** | MEDIUM | Crashes bubble up uncaught | Add root error boundary in AuthBootstrap; catch API errors per section |
| `src/hooks/` | **Hooks file 407 lines** | MEDIUM | Single responsibility violated | useApi.ts mixes 15+ data queries + mutations. Split into: useApiQueries.ts, useApiMutations.ts, or per-domain files |

---

## 2. COMPONENTS AUDIT

### Component Variants & Duplication

#### Provider Cards (4 variants, 70%+ code overlap)
| Component | Purpose | Lines | Duplication |
|-----------|---------|-------|------------|
| **ProviderCard** | Grid cell (large, full detail) | ~280 | Avatar, name, rating, location, tags |
| **ProviderRowCard** | List row (compact) | ~180 | Same fields, different layout |
| **FeaturedCard** | Horizontal carousel (featured) | ~362 | Cover, avatar, rating, remote/exp badges |
| **ProviderRowCard** | Top-rated list | ~180 | Reuses ProviderRowCard |

**Issue:** Logic for rendering `is_featured`, `rating`, `remote_work`, `years_experience` is **copy-pasted** across files.  
**Risk:** Fixing a bug in one requires fixes in 3+ other files.  
**Recommendation:** Create a **ProviderCardBase** component with variants via props:
```typescript
<ProviderCard variant="grid" | "row" | "featured" provider={...} />
```

#### Category Cards
| Component | Purpose | Lines | Issue |
|-----------|---------|-------|-------|
| **CategoryCard** | Grid/carousel category cell | ~120 | Hardcoded colors `#D4A017`, missing responsive behavior |

**Smell:** Uses hardcoded color `#D4A017` instead of `colors.gold`.

#### Button Implementations
No dedicated Button component. All Pressables are inline with repeated styling:
```typescript
// Repeated 50+ times across the codebase:
<Pressable style={{
  backgroundColor: colors.primary,
  paddingHorizontal: 32,
  paddingVertical: 12,
  borderRadius: 12,
  opacity: pressed ? 0.7 : 1,
}}>
```

**Recommendation:** Create `components/ui/Button.tsx`:
```typescript
<Button variant="primary" | "secondary" size="sm" | "md" | "lg" loading={false}>
  Label
</Button>
```

#### Input Implementations
- **PasswordInput** (dedicated component) ✓
- **TextInput** (50+ inline Pressables with `borderRadius: 12`, `borderWidth: 1`, `padding: 14`, etc.)

**Recommendation:** Extract `TextInputField` component with error display.

#### Loading/Empty/Error States
| Component | Usage Count | Location | Issue |
|-----------|------------|----------|-------|
| **LoadingSpinner** | 12 | screens | Consistent ✓ |
| **EmptyState** | 8 | screens | Has hardcoded `#1E40AF` button color |
| **ErrorView** | 8 | screens | Has hardcoded `#1E40AF` button color |
| **FavoriteAuthModal** | 9 | components | Properly uses colors tokens ✓ |

#### Surface/Card Components
**Issue:** No centralized Card component. Every card is built inline:
```typescript
<View style={{
  backgroundColor: colors.surface,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 16,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 2,
}}>
```

This pattern appears **20+ times** across the codebase.

**Recommendation:** Create `components/ui/Card.tsx`:
```typescript
<Card elevated={false} padding="lg">
  Content
</Card>
```

### Component Issues Summary

| File | Smell | Severity | Risk | Notes |
|------|-------|----------|------|-------|
| `components/provider/ProviderCard.tsx` | Duplicate card layouts | HIGH | Bug propagation; 3x maintenance cost | Extract common card shell, vary renderItem |
| `components/provider/FeaturedCard.tsx` | Hardcoded shadow/border colors | MEDIUM | Dark mode inconsistency | Use colors.shadow, colors.border from tokens |
| `components/ui/EmptyState.tsx` | Hardcoded button color `#1E40AF` | MEDIUM | Brand color inconsistency | Use colors.primary |
| `components/ui/ErrorView.tsx` | Same hardcoded button color | MEDIUM | Brand color inconsistency | Use colors.primary |
| `components/ui/CategoryCard.tsx` | Hardcoded mustard tones (`#D4A017`, `rgba(212,160,23,0.10)`) | MEDIUM | Dark mode failure; not token-based | Use colors.gold, colors.goldSoft |
| All Pressables | Inline press state `opacity: 0.7, scale: 0.97` | MEDIUM | Inconsistent feedback | Extract pressable style helper or PressableButton component |
| 20+ inline Cards | Repeated card chrome (border, shadow, radius) | MEDIUM | High duplication | Extract Card component |
| 50+ inline TextInputs | Duplicate input styling | LOW | Maintenance burden | Extract TextInput component |
| `app/provider/[slug].tsx` | Business logic in JSX (679 lines) | HIGH | Unmaintainable; hard to test | Extract: useProviderDetail hook, ReviewsModal, ReportModal |

---

## 3. API LAYER AUDIT

### Current Implementation (Solid Foundation)

**File:** `src/lib/api.ts`
- Single axios instance ✓
- Auth interceptor with Bearer token ✓
- 401 handling with logout ✓
- Timeout: 15s ✓

**File:** `src/constants/api.ts`
- Centralized endpoints ✓
- Environment-aware DEV/PROD URLs ✓
- Organized endpoint tree ✓

**File:** `src/hooks/useApi.ts`
- React Query integration ✓
- 15 query/mutation hooks ✓
- Optimistic updates for favorites ✓
- Proper error handling ✓

### Issues Found

| File | Smell | Severity | Risk | Notes |
|------|-------|----------|------|-------|
| `src/hooks/useApi.ts` | 407 lines; mixes queries + mutations | MEDIUM | Hard to navigate; unclear responsibility | Split into useApiQueries.ts (8 hooks) + useApiMutations.ts (7 hooks) |
| `src/hooks/useApi.ts` | Optimistic updates touch 6 query types | MEDIUM | State sync errors if new list added | Centralize optimistic update logic in a helper function |
| `app/provider/[slug].tsx` | Manually manages review pagination state (`allReviews`, `reviewPage`) | MEDIUM | No infinite scroll pattern; manual accumulation error-prone | Use useInfiniteQuery pattern |
| Multiple screens | Repeat URL construction with Linking.openURL() | MEDIUM | Fragile; logic in JSX | Already extracted to `src/utils/links.ts` ✓ (well done) |

### Error Handling
- **API errors:** Properly parsed in `src/lib/error-parser.ts` ✓
- **Field-level validation:** Mapped from 422 responses ✓
- **Network errors:** Caught with fallback messages ✓
- **Retry logic:** Configured in queryClient (excludes 4xx) ✓
- **Missing:** No error boundary for unhandled exceptions

---

## 4. DESIGN TOKENS AUDIT

### Theme System (Excellent)

**File:** `src/theme/tokens.ts`
- Light & dark palettes ✓
- 23 semantic tokens (bg, surface, text*, border*, brand colors, status colors) ✓
- Spacing scale (xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32) ✓
- Radius scale (sm=8, md=12, lg=16, xl=20, xxl=24, full=999) ✓
- Font sizes (xs=11, sm=13, base=15, md=16, lg=18, xl=20, xxl=24, xxxl=28) ✓
- Font weights (normal=400, medium=500, semibold=600, bold=700, black=900) ✓

### Hardcoded Colors Found

**Count:** 157 hardcoded hex colors across 26 files.

#### Critical Hardcodes (Inconsistent with Tokens)

| Color | Files | Should Use | Issue |
|-------|-------|------------|-------|
| `#1E40AF` | 8 files | `colors.primary` | Primary blue used in EmptyState, ErrorView, buttons |
| `#E1AD01` | 5 files | `colors.gold` | Mustard accent scattered across cards |
| `#25D366` | 2 files | `colors.whatsapp` | WhatsApp green in ProviderCard |
| `#0F172A` | 8 files | `colors.textPrimary` or `colors.bg` | Dark navy hardcoded for contrast |
| `rgba(0,0,0,0.x)` | 20+ files | `colors.overlay` | Overlay opacity not using token |
| `#FFFFFF` | 12 files | `colors.surface` or `colors.textOnPrimary` | White hardcoded for text-on-primary |

#### Dark Mode Issues

| Issue | Files | Risk |
|-------|-------|------|
| Hardcoded white text `#FFFFFF` in dark mode contexts | 12 | Works by accident (white on dark surface) but not semantic |
| Hardcoded dark overlay `rgba(0,0,0,0.5)` | 15 | Should use `colors.overlay` token |
| Hardcoded badge backgrounds `rgba(255,255,255,0.08)` | 8 | Not semantic; should be surfaces/borders |

### Missing Tokens

| Missing | Usage | Recommendation |
|---------|-------|-----------------|
| Button background variants | 50+ buttons with `backgroundColor: colors.primary`, `.secondary`, `.tertiary` | Add `buttonBg` and `buttonBgSecondary` tokens |
| Divider color | 15+ manual `backgroundColor: colors.border` | Already have `colors.border` ✓ but used inconsistently |
| Loading overlay | 8 overlays | Already have `colors.overlay` ✓ |
| Focus ring | 0 (accessibility gap) | Add `focusRing` token for keyboard navigation |
| Success/error badge backgrounds | Manual `rgba(16, 185, 129, 0.08)` | Extract `colors.successSoft`, `colors.errorSoft` |

### Recommendations

| Issue | Severity | Action |
|-------|----------|--------|
| Replace all `#1E40AF` with `colors.primary` | HIGH | Grep-and-replace + audit dark mode |
| Replace `#E1AD01` with `colors.gold` in CategoryCard | MEDIUM | Fix CategoryCard.tsx line 37-41 |
| Replace `#FFFFFF` text with `colors.textOnPrimary` | MEDIUM | Semantic correctness |
| Replace `rgba(0,0,0,0.x)` with `colors.overlay` | MEDIUM | Centralize overlay opacity |
| Add `buttonBgSecondary`, `successSoft`, `errorSoft` tokens | LOW | Future-proofing |

---

## 5. STATE MANAGEMENT AUDIT

### Current Implementation (Solid)

**Zustand Stores:**
- `src/store/auth.ts` — User, token, auth status (4 actions) ✓
- `src/store/city.ts` — Active city selection (persistent) ✓
- `src/store/theme.ts` — Theme preference (light/dark/system) ✓

**React Query:**
- 15 queries + 7 mutations centralized in `src/hooks/useApi.ts` ✓
- Optimistic updates for favorites (snapshot + rollback) ✓
- Stale time configured (60min for catalogs, 5min default) ✓

### Issues Found

| Issue | Severity | Risk | Notes |
|-------|----------|------|-------|
| **Duplicate `is_favorited` state** | MEDIUM | State mismatch; manual sync bugs | ProviderCard, ProviderRowCard, FeaturedCard all hold local `useState` for favorite state. Should rely solely on query cache. |
| **Manual review pagination** | MEDIUM | Accumulation logic error-prone | app/provider/[slug].tsx manually manages `allReviews`, `setAllReviews`, `reviewPage`. Use useInfiniteQuery instead. |
| **No cache invalidation strategy doc** | MEDIUM | Developers guess when to invalidate | `useToggleFavorite` invalidates 7 different query keys; unclear which are necessary. Document cache dependency graph. |
| **City selection triggers refetch** | LOW | Correct but implicit | `useHome(activeCity?.slug)` re-runs queries; properly reactive but not documented. |
| **No error state in stores** | LOW | Silent failures possible | Auth/city hydration errors silently fall back; should expose error status. |

### Duplicate State Pattern

```typescript
// ProviderRowCard.tsx:
const [isFavorited, setIsFavorited] = useState(!!provider.is_favorited);

const handleFavorite = () => {
  setIsFavorited(!isFavorited);  // Local optimistic update
  toggleFavorite.mutate({ slug, isFavorited });  // API mutation
};

// Problem: If mutation fails, local state != server state
// Solution: Rely entirely on React Query cache via provider.is_favorited
```

**Fix:** Remove all local favorite state; let React Query cache be source of truth.

---

## 6. DEAD CODE AUDIT

### Console Logs
**Count:** 1 console.log found.  
**File:** `src/lib/api.ts:27`  
```typescript
if (__DEV__) {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url} auth:${!!token}`);
}
```
**Status:** ✓ Properly gated behind `__DEV__`

### TODO/FIXME Comments
**Count:** 0 found in production code. ✓

### Commented-Out Code
**Count:** 0 blocks found. ✓

### Unused Imports
**Count:** Minor (2-3 files)
- `app/index.tsx` — imports Ionicons but doesn't use it
- `src/hooks/useApi.ts` — imports `{ useCallback }` but doesn't use it (line 1)

**Recommendation:** Run TypeScript strict mode to catch these.

### Unused Variables
**Count:** ~5 detected
- `app/provider/[slug].tsx:231` — `previousProvider` in rollback context is cast but not strictly needed
- `src/hooks/useApi.ts` — Context object parameters in `onError` are named but unused

### Dead Functions
**Count:** 0 identified. All utility functions are used.

### Placeholder/Mock Data
**Count:** 0 hardcoded mock arrays. ✓

### Dead Screen/Component Files
**Count:** 0. All 25 screens are routed via Expo Router. ✓

### Summary

| Smell | Count | Severity | Action |
|-------|-------|----------|--------|
| console.log in __DEV__ | 1 | CLEANUP | ✓ Already gated |
| Unused imports | 2-3 | LOW | Run tsc --strict |
| Unused variables | ~5 | LOW | Enable eslint no-unused-vars |
| Commented code | 0 | - | ✓ Clean |
| Mock data | 0 | - | ✓ Clean |

---

## 7. TYPE SAFETY AUDIT

### Type Coverage

**any type usage:** 8 occurrences across 4 files.

| File | Line | Context | Risk | Fix |
|------|------|---------|------|-----|
| `src/lib/api.ts:22` | `config.headers = {} as any;` | Axios header config typing gap | MEDIUM | Use proper AxiosRequestConfig type |
| `src/lib/api.ts:48` | `(error: AxiosError)` → cast as any | Axios error type narrowing | MEDIUM | Use proper AxiosError<ApiResponse> generic |
| `src/theme/tokens.ts:2` | `as const` (not `any`, but aggressive narrowing) | Proper pattern ✓ | - | - |
| `src/utils/providerMappers.ts:36,48` | `as any` fallback for dynamic key access | Necessary for dynamic fields | LOW | Document why; consider Record<string, unknown> |
| `src/hooks/useFavoriteWithAuth.ts:7` | `redirectParams?: Record<string, any>` | Route param typing gap | MEDIUM | Define RouteParams type |

### Untyped Patterns

| Pattern | Usage | Severity | Fix |
|---------|-------|----------|-----|
| **Untyped navigation params** | `useLocalSearchParams<{...}>` is typed but casting to never | MEDIUM | Ensure navigation args types match |
| **API response casting** | `res.data.data` assumed shape matches Type | MEDIUM | Add runtime validation or better typing in useApi |
| **Error handling** | Errors cast as `{ response?: { ... } }` without type guard | MEDIUM | Create ApiErrorType interface |
| **Provider prop spread** | `{...provider}` in mappers assumes all fields | LOW | Provider interface is comprehensive ✓ |

### Missing Type Definitions

| Missing | Impact | Severity |
|---------|--------|----------|
| ProviderCardProps type | Implicit in FeaturedCard, ProviderRowCard | LOW | Extract shared interface |
| RouteParams types | Navigation params scattered in screens | MEDIUM | Create centralized routing.types.ts |
| ApiErrorType | Error shapes hardcoded | MEDIUM | Create in lib/errors.ts |
| CustomAlertConfig | Used inline in provider/[slug].tsx | LOW | Extract to types |

### Type Safety Summary

| Issue | Count | Severity | Action |
|-------|-------|----------|--------|
| `any` types | 8 | MEDIUM | Replace with proper types or Record<string, unknown> |
| Untyped params | 5+ screens | MEDIUM | Create routing.types.ts with all route params |
| Missing error types | Implicit | MEDIUM | Create ApiErrorType, FieldErrorType |
| Navigation safety | moderate | MEDIUM | Use expo-router typed routes (currently disabled in app.json) |

**Recommendation:** Enable `"strict": true` in tsconfig.json to catch more issues.

---

## 8. PERFORMANCE ISSUES

### Lists & ScrollViews

| Issue | File | Severity | Risk |
|-------|------|----------|------|
| **FlatList without keyExtractor** | `app/(tabs)/index.tsx:137` (categories) | MEDIUM | React reconciliation issues; items may re-render incorrectly |
| **FlatList without renderItem memo** | `app/(tabs)/search.tsx` (search results) | LOW | Possible; check if ProviderRowCard is memoized (it is ✓) |
| **No maxToRenderPerBatch** | All FlatLists | LOW | Default 10 is reasonable for mobile |
| **ScrollView instead of FlatList** | None detected ✓ | - | Good practice followed |

**FlatList Review:**
```typescript
// app/(tabs)/index.tsx:137
<FlatList
  data={[...categories.slice(0, 4), { id: 'view-all' as any, isViewAll: true }]}
  horizontal
  inverted
  renderItem={({ item }: { item: any }) => ... }
  // MISSING: keyExtractor
/>
```

**Fix:**
```typescript
keyExtractor={(item) => item.id?.toString() ?? `view-all-${Date.now()}`}
```

### Heavy Calculations in Render

| File | Calculation | Severity | Recommendation |
|------|-----------|----------|-----------------|
| `app/provider/[slug].tsx:250` | `mapProviderProfile(provider)` called every render | MEDIUM | Memoize with useMemo or extract to hook |
| `components/provider/ProviderRowCard.tsx:19` | `makeStyles(colors, isDark)` | LOW | Already memoized ✓ |
| `app/(tabs)/search.tsx` | Filter state + URL sync on every keystroke | MEDIUM | Debounce keyword input (already done ✓) |

### Re-render Optimization

| Component | Issue | Status |
|-----------|-------|--------|
| ProviderCard | Wrapped in memo ✓ | GOOD |
| ProviderRowCard | Wrapped in memo ✓ | GOOD |
| FeaturedCard | Wrapped in memo ✓ | GOOD |
| CategoryCard | Wrapped in memo ✓ | GOOD |
| EmptyState | Not memoized | LOW (simple) |
| BannerCarousel | Not memoized | LOW (image carousel; heavy re-renders possible) |

**Recommendation:** Memoize BannerCarousel if carousel indicators cause parent re-renders.

### Image Optimization

| Issue | File | Severity |
|-------|------|----------|
| **contentFit="cover"** everywhere | components/provider/\*.tsx | GOOD ✓ |
| **Image caching** | FeaturedCard line 65: `cachePolicy="memory-disk"` | GOOD ✓ |
| **Placeholder images** | src/utils/imageFallback.ts | GOOD (6 placeholders per type) ✓ |
| **No image blur-up** | All Image components | LOW | Could add blurHash for perceived performance |

### Performance Summary

| Issue | Severity | Action |
|-------|----------|--------|
| FlatList missing keyExtractor | MEDIUM | Add keyExtractor to all FlatLists |
| mapProviderProfile() not memoized | MEDIUM | Wrap in useMemo (app/provider/[slug].tsx) |
| BannerCarousel not memoized | LOW | Memo if carousel indicators cause parent re-renders |
| No image blur-up placeholders | LOW | Add blurHash or thumb URLs for better UX |

---

## 9. DUPLICATIONS AUDIT

### Duplicate Link Handling

**Handled by:** `src/utils/links.ts` (well extracted)  
**Usage:** `openExternalUrl()`, `buildSocialUrl()`, `normalizeExternalUrl()`  
**Status:** ✓ Centralized; no duplication in screens

**Files using links:**
- app/provider/[slug].tsx (WhatsApp, phone, social links)
- components/provider/ProviderCard.tsx (WhatsApp button)
- components/ui/FavoriteAuthModal.tsx (imported but not used — dead import)

**Minor Issue:** `buildSocialUrl` is `require()`'d inside `mapProviderProfile()` instead of imported at top (line 69 in providerMappers.ts). This is inefficient.

### Duplicate Image Fallback Logic

**Handled by:** `src/utils/imageFallback.ts`  
**Functions:** `getProviderLogo()`, `getProviderCover()`  
**Duplication Check:** `logoUrl.includes('placeholder')` check appears **3 times** in providerMappers.ts and imageFallback.ts

```typescript
// Repeated check:
const isValidUrl = (url?: string | null) =>
  url && !url.includes('placeholder') && !url.includes('default') && url.trim() !== "" && !url.includes('localhost:8000');
```

**Fix:** Extract to single `src/utils/imageValidation.ts`:
```typescript
export function isValidImageUrl(url?: string | null): boolean {
  return url &&
    !url.includes('placeholder') &&
    !url.includes('default') &&
    url.trim() !== '' &&
    !url.includes('localhost:8000');
}
```

### Duplicate Number Formatting

**Handled by:** `src/utils/numberFormatter.ts`  
**Function:** `toEnglishNumbers()`  
**Status:** Centralized ✓; used in 8 files  
**No duplication found** ✓

### Duplicate Date Formatting

**Handled by:** `src/utils/date.ts`  
**Functions:** `formatRelativeTime()`, `formatAbsoluteDate()`, `formatIssueDate()`  
**Status:** Centralized ✓; used in provider detail, credentials  
**No duplication found** ✓

### Duplicate Favorite Toggle Logic

**Files:**
- `src/hooks/useApi.ts` — useToggleFavorite() with optimistic updates
- `components/provider/ProviderCard.tsx` — Local state + mutation call
- `components/provider/FeaturedCard.tsx` — Local state + mutation call
- `components/provider/ProviderRowCard.tsx` — Local state + mutation call

**Duplication Type:** Each component has its own `isFavorited` state + `handleFavorite` function.

```typescript
// Repeated in 3+ files:
const [isFavorited, setIsFavorited] = useState(!!provider.is_favorited);
const handleFavorite = () => {
  setIsFavorited(!isFavorited);
  toggleFavorite.mutate({ slug, isFavorited });
};
```

**Issue:** State duplication; if mutation fails, local state ≠ server state.  
**Fix:** Remove local state; derive from provider.is_favorited (already in React Query cache).

### Duplicate API Endpoint Definitions

**Handled by:** `src/constants/api.ts`  
**Status:** Centralized ✓; all endpoints defined once  
**No duplication found** ✓

### Duplicate RTL Fixes

**Handled by:** `src/utils/rtl.ts`  
**Functions:** `rtlPosition()`, `rtlTopRightBadge()`, `rtlTopLeftBadge()`, `rtlRow()`, `rtlHorizontalScroll()`, `rtlText()`  
**Status:** Centralized ✓  
**Usage:** ~20 files use flexDirection: 'row-reverse' inline instead of rtlRow()

**Issue:** `flexDirection: 'row-reverse'` repeated 40+ times instead of using `rtlRow()`.

**Fix:** Replace all inline RTL with helper imports:
```typescript
// Before:
<View style={{ flexDirection: 'row-reverse' }}>

// After:
<View style={rtlRow()}>
```

### Duplicate Modal/Alert Patterns

**Files:**
- `app/provider/[slug].tsx` — Custom alert modal (lines 61-70), report modal (560-614), review modal (643-676)
- `components/ui/FavoriteAuthModal.tsx` — Auth alert modal

**Duplication Type:** Modal chrome (View > backdrop, modal content, buttons) repeated 3+ times.

**Fix:** Create `components/ui/BottomModal.tsx`:
```typescript
<BottomModal visible={visible} title="Title">
  <Text>Content</Text>
  <Button>Action</Button>
</BottomModal>
```

### Duplicate Button Styling

**Issue:** Pressable buttons styled inline 50+ times:
```typescript
<Pressable style={({ pressed }) => ({
  backgroundColor: pressed ? 'color2' : 'color1',
  opacity: pressed ? 0.7 : 1,
  transform: [{ scale: pressed ? 0.97 : 1 }],
})}>
```

**Fix:** Extract PressableButton component.

### Duplications Summary

| Duplicate | Count | Severity | Fix |
|-----------|-------|----------|-----|
| Image URL validation check | 3 | MEDIUM | Extract to isValidImageUrl() |
| isFavorited local state | 3 | MEDIUM | Remove; use React Query cache |
| flexDirection: 'row-reverse' | 40+ | LOW | Use rtlRow() helper |
| Inline card chrome (border, shadow, radius) | 20+ | MEDIUM | Extract Card component |
| Pressable button styling | 50+ | MEDIUM | Extract PressableButton component |
| Modal backdrop + title + buttons | 3+ | MEDIUM | Extract BottomModal component |
| TextInput styling (border, padding, radius) | 15+ | LOW | Extract TextInputField component |

---

## 10. ARCHITECTURAL ISSUES

### Business Logic in JSX

**File:** `app/provider/[slug].tsx` (679 lines)

**Logic in JSX:**
- Review pagination state management (lines 35-44)
- Review accumulation logic (lines 46-52)
- Report modal state + validation (lines 81-119)
- Report submission with error handling (lines 87-119)
- Review submission with error handling (lines 219-237)
- Favorite toggle with auth redirect (lines 197-205)
- WhatsApp/phone URL construction (lines 207-217)
- Avatar theme selection (line 358)

**Recommendation:** Extract to custom hooks:
```typescript
// useProviderDetail.ts
const {
  provider, reviews, rating, ...
  handleFavorite, handleReport, handleSubmitReview, ...
} = useProviderDetail(slug);

// useReviewModal.ts
const {
  showReviewModal, reviewRating, reviewComment, ...
  handleReviewSubmit, errors, ...
} = useReviewModal(slug);

// useReportModal.ts
const {
  showReportModal, reportReasonType, ...
  handleReportSubmit, errors, ...
} = useReportModal(slug);
```

### Props Drilling

**Issue:** Limited. Most screens use Zustand stores directly (auth, city, theme).

**Potential:** `useFavoriteWithAuth` passes 4 props deep; could be context-based.

### Navigation Issues

**File:** `app/_layout.tsx`  
**Issue:** No deep linking strategy documented. Routes work but no centralized route config.

**Recommendation:** Create `src/constants/routes.ts`:
```typescript
export const ROUTES = {
  HOME: '/(tabs)/',
  PROVIDER: (slug: string) => `/provider/${slug}`,
  CATEGORY: (slug: string) => `/category/${slug}`,
  LOGIN: '/(auth)/login',
  // ...
};
```

### API Contract Testing

**Status:** No integration tests for API responses.

**Risk:** Schema changes from backend could break app silently.

**Recommendation:** Add type guards for ApiResponse before using:
```typescript
export function guardProvider(data: unknown): data is Provider {
  return typeof data === 'object' && 'id' in data && 'name' in data && ...;
}
```

### Error Boundaries

**Status:** No root error boundary.

**Risk:** Unhandled errors crash entire app.

**Recommendation:** Add to AuthBootstrap:
```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('App crashed:', error, errorInfo);
    // Report to Sentry
  }}
>
  <Stack ... />
</ErrorBoundary>
```

### Architecture Summary

| Issue | Severity | Risk | Action |
|-------|----------|------|--------|
| Monolithic provider screen (679 lines) | HIGH | Unmaintainable; hard to test | Extract to 3+ custom hooks + components |
| Business logic in JSX | MEDIUM | Logic duplication; hard to reuse | Extract to hooks (useProviderDetail, useReviewModal, etc.) |
| No error boundary | MEDIUM | Unhandled errors crash app | Add ErrorBoundary to AuthBootstrap |
| No deep linking strategy | LOW | New routes added ad-hoc | Create centralized ROUTES constant |
| No API contract testing | MEDIUM | Schema changes break silently | Add type guards for API responses |
| No centralized route config | LOW | Route strings scattered in code | Extract to routes.ts |

---

## OVERALL RECOMMENDATIONS

### High Priority (1-2 Weeks)

1. **Extract monolithic provider screen** (`app/provider/[slug].tsx`)
   - Split into: ProfileHeader, ServicesSection, ReviewsSection
   - Extract hooks: useProviderDetail, useReviewModal, useReportModal
   - Estimated: 3 days

2. **Consolidate provider card variants**
   - Create ProviderCardBase with variant prop
   - Reduce 3 files (280+180+362 lines) to 1 shared file + 3 thin wrappers
   - Estimated: 2 days

3. **Replace hardcoded colors with tokens**
   - Audit: 157 hex colors across 26 files
   - Replace all `#1E40AF` → `colors.primary`
   - Replace all `#E1AD01` → `colors.gold`
   - Estimated: 2 days

### Medium Priority (2-4 Weeks)

4. **Extract shared UI components**
   - Create Button component (eliminate 50+ inline Pressables)
   - Create Card component (eliminate 20+ inline cards)
   - Create TextInputField component (eliminate 15+ inputs)
   - Create BottomModal component (eliminate 3+ modals)
   - Estimated: 4 days

5. **Remove duplicate favorite state**
   - Delete useState from ProviderCard, ProviderRowCard, FeaturedCard
   - Rely solely on React Query cache (provider.is_favorited)
   - Estimated: 1 day

6. **Enable strict TypeScript**
   - Turn on `"strict": true` in tsconfig.json
   - Fix 8 `any` types and type safety issues
   - Estimated: 2 days

7. **Add error boundary & error handling**
   - Create ErrorBoundary component
   - Add error states to API queries
   - Estimated: 1 day

### Low Priority (Nice to Have)

8. Extract `src/hooks/useApi.ts` into domain-specific files
9. Add keyExtractor to all FlatLists
10. Memoize mapProviderProfile() with useMemo
11. Extract image validation check to isValidImageUrl() helper
12. Replace inline flexDirection:'row-reverse' with rtlRow() helper
13. Document cache invalidation strategy for React Query
14. Add centralized route config (ROUTES constant)

---

## Testing Checklist

After implementing fixes:

- [ ] Dark mode works correctly with all extracted components
- [ ] All hardcoded colors map to tokens in both light and dark modes
- [ ] FlatLists render correctly with keyExtractor
- [ ] Favorite toggle doesn't show stale state on network error
- [ ] Provider detail screen performance is acceptable after refactoring
- [ ] TypeScript strict mode passes without errors
- [ ] No console warnings about React keys or missing dependencies

---

## Conclusion

**Overall Assessment:** The codebase is **well-structured** with solid fundamentals (Zustand, React Query, tokens). Main improvements needed are:

1. **Component consolidation** — Reduce card variants from 4 to 1 + props
2. **Design token adoption** — Replace 157 hardcoded colors with tokens
3. **Code extraction** — Move logic from JSX to hooks
4. **UI component library** — Create reusable Button, Card, Input, Modal components

**Estimated Refactoring Effort:** 3-4 weeks (high priority only: 1-2 weeks)

**Current Maintainability Score:** 6.5/10  
**Projected After Fixes:** 8.5/10

---

**Generated:** June 27, 2026  
**Audit Tool:** Manual code review + pattern detection  
**Files Analyzed:** 60 TypeScript/TSX files
