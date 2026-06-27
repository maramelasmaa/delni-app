# Frontend Refactor Plan — Delni React Native App

**Date:** June 27, 2026  
**Current Score:** 6.5/10  
**Target Score:** 8.5/10  
**Total Estimated Effort:** 3-4 weeks (or 1-2 weeks for high-priority only)

---

## Overview

The codebase has solid architectural foundations but suffers from:
1. **157 hardcoded colors** despite having a comprehensive token system
2. **4 provider card variants** with 70%+ duplicate logic
3. **Monolithic provider detail screen** (679 lines)
4. **50+ inline button implementations** that should be unified
5. **Duplicated state management** (especially favorites)

This plan breaks refactoring into safe, testable phases with clear rollback points.

---

## Phase 1: No-Risk Cleanup (2-3 days)

**Goal:** Remove dead code, fix unused imports, prepare codebase.  
**Risk:** MINIMAL — no behavior changes  
**Testing:** Type checking + linting

### 1.1 Fix Unused Imports & Variables

**Files:**
- `app/index.tsx` — Remove unused Ionicons import (line 8)
- `src/hooks/useApi.ts` — Remove unused useCallback import (line 1)

**Steps:**
```bash
# Run type checking
npx tsc --strict

# Run linter
npm run lint

# Review and fix errors
```

**Verification:**
```bash
npm run typecheck  # Should pass with 0 errors
```

### 1.2 Enable Strict TypeScript

**File:** `tsconfig.json`

**Change:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Expected Impact:** 8-12 type errors to fix in Phase 2.

### 1.3 Extract Image URL Validation

**Create:** `src/utils/imageValidation.ts`

```typescript
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    !url.includes('placeholder') &&
    !url.includes('default') &&
    url.trim() !== '' &&
    !url.includes('localhost:8000')
  );
}
```

**Update:** `src/utils/imageFallback.ts` and `src/utils/providerMappers.ts` to use this function.

**Verification:**
```bash
# Run tests if they exist
npm test

# Manually check: provider images still load
```

---

## Phase 2: Design Token Cleanup (2-3 days)

**Goal:** Replace all hardcoded colors with design tokens.  
**Risk:** LOW — colors should match 1:1  
**Testing:** Visual inspection in light & dark modes

### 2.1 Audit Hardcoded Colors

**Files with most hardcodes:**
- `components/provider/FeaturedCard.tsx` — 12 hardcoded colors
- `components/ui/EmptyState.tsx` — 3 hardcoded colors
- `components/ui/ErrorView.tsx` — 3 hardcoded colors
- `components/ui/CategoryCard.tsx` — 2 hardcoded colors
- `components/provider/ProviderCard.tsx` — 8 hardcoded colors

**Steps:**

1. Replace `#1E40AF` (primary blue) everywhere:
   ```bash
   find . -type f -name "*.tsx" -o -name "*.ts" | xargs grep -l "#1E40AF"
   # Replace with: colors.primary
   ```

2. Replace `#E1AD01` (gold) in CategoryCard:
   ```typescript
   // components/ui/CategoryCard.tsx
   // Line 37: backgroundColor: '#E1AD01' → backgroundColor: colors.gold
   ```

3. Replace `#FFFFFF` (white) with semantic tokens:
   ```typescript
   // In dark mode contexts: colors.textOnPrimary or colors.surface
   // In light mode contexts: colors.surface
   ```

4. Replace `rgba(0,0,0,0.x)` overlays:
   ```typescript
   // Create overlay opacity tokens in src/theme/tokens.ts
   export const OVERLAYS = {
     light: 'rgba(0,0,0,0.3)',
     medium: 'rgba(0,0,0,0.5)',
     heavy: 'rgba(0,0,0,0.7)',
   };
   ```

### 2.2 Add Missing Tokens

**Update:** `src/theme/tokens.ts`

Add these tokens:
```typescript
export const COLORS_EXTENDED = {
  // Overlay opacity
  overlayLight: 'rgba(0,0,0,0.3)',
  overlayMedium: 'rgba(0,0,0,0.5)',
  overlayHeavy: 'rgba(0,0,0,0.7)',
  
  // Social platforms
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E4405F',
  
  // Semantic surfaces
  successSoft: 'rgba(16, 185, 129, 0.1)',
  errorSoft: 'rgba(239, 68, 68, 0.1)',
};
```

### 2.3 Test Dark Mode

**Manual Testing:**
- [ ] Run app in light mode — all colors match design
- [ ] Run app in dark mode — overlays not too dark or too light
- [ ] Test EmptyState, ErrorView — buttons are visible in both modes
- [ ] Test CategoryCard — gold color visible in both modes

---

## Phase 3: Component Deduplication (3-4 days)

**Goal:** Consolidate provider card variants; extract shared UI components.  
**Risk:** MEDIUM — requires careful refactoring  
**Testing:** Verify all card types render correctly

### 3.1 Consolidate Provider Card Variants

**Current State:**
- `ProviderCard.tsx` — 280 lines (grid card)
- `ProviderRowCard.tsx` — 180 lines (list row)
- `FeaturedCard.tsx` — 362 lines (carousel card)

**Target:** Single `ProviderCardBase` with variant prop.

**Steps:**

1. Create `components/provider/ProviderCardBase.tsx`:
```typescript
export interface ProviderCardProps {
  provider: ProviderWithRating;
  variant: 'grid' | 'row' | 'featured';
  onPress?: (slug: string) => void;
  onFavoritesPress?: () => void;
  onWhatsAppPress?: () => void;
}

export const ProviderCardBase = React.memo(({
  provider,
  variant,
  onPress,
  onFavoritesPress,
  onWhatsAppPress,
}: ProviderCardProps) => {
  // Conditional rendering based on variant
  if (variant === 'grid') return <GridCard ... />;
  if (variant === 'row') return <RowCard ... />;
  if (variant === 'featured') return <FeaturedCardLayout ... />;
});
```

2. Replace usage in screens:
   - `ProviderCard` → `<ProviderCardBase variant="grid" />`
   - `ProviderRowCard` → `<ProviderCardBase variant="row" />`
   - `FeaturedCard` → `<ProviderCardBase variant="featured" />`

3. Keep thin wrapper files for backward compatibility:
```typescript
// components/provider/ProviderCard.tsx
export const ProviderCard = (props) => (
  <ProviderCardBase variant="grid" {...props} />
);
```

**Verification:**
```bash
# Manual testing:
# [ ] Home screen — featured cards render
# [ ] Search screen — row cards render with no glitches
# [ ] Categories → Favorites — grid cards render
# [ ] Favorite toggle works in all variants
```

### 3.2 Extract Shared Button Component

**Create:** `components/ui/Button.tsx`

```typescript
export interface ButtonProps extends Pressable {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export const Button = React.memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  ...rest
}: ButtonProps) => {
  const { colors } = useTheme();
  
  const sizeStyles = {
    sm: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
    md: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
    lg: { paddingHorizontal: 24, paddingVertical: 14, fontSize: 15 },
  };
  
  const variantStyles = {
    primary: { backgroundColor: colors.primary, textColor: colors.textOnPrimary },
    secondary: { backgroundColor: colors.surfaceAlt, textColor: colors.textPrimary },
    // ...
  };
  
  return (
    <Pressable
      style={({ pressed }) => ({
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: pressed ? 0.7 : 1,
        borderRadius: 12,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
      })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <ActivityIndicator />}
      {icon && <Ionicons name={icon as any} size={16} />}
      <Text>{children}</Text>
    </Pressable>
  );
});
```

**Replace in screens:**
- `auth/login.tsx` — 8 inline buttons → `<Button variant="primary">`
- `auth/register.tsx` — 6 buttons
- `provider/[slug].tsx` — 12+ buttons
- etc.

### 3.3 Extract Shared Card Component

**Create:** `components/ui/Card.tsx`

```typescript
export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  borderWidth?: number;
  backgroundColor?: string;
}

export const Card = React.memo(({
  children,
  padding = 'md',
  elevated = true,
  borderWidth = 1,
  backgroundColor,
}: CardProps) => {
  const { colors } = useTheme();
  
  const paddingSizes = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 20,
  };
  
  return (
    <View style={{
      backgroundColor: backgroundColor || colors.surface,
      borderRadius: 16,
      borderWidth,
      borderColor: colors.border,
      padding: paddingSizes[padding],
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: elevated ? 4 : 0 },
      shadowOpacity: elevated ? 0.1 : 0,
      shadowRadius: 8,
      elevation: elevated ? 2 : 0,
    }}>
      {children}
    </View>
  );
});
```

**Replace in components:**
- 20+ inline card definitions → `<Card>`

### 3.4 Extract Shared Modal Component

**Create:** `components/ui/BottomModal.tsx`

```typescript
export interface BottomModalProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}

export const BottomModal = React.memo(({
  visible,
  title,
  children,
  onClose,
  footer,
}: BottomModalProps) => {
  const { colors } = useTheme();
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', flex: 1 }} />
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Cairo-Bold', color: colors.textPrimary }}>
              {title}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} />
            </Pressable>
          </View>
          
          <ScrollView>
            {children}
          </ScrollView>
          
          {footer && <View style={{ marginTop: 20 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});
```

**Replace in `app/provider/[slug].tsx`:**
- Report modal → `<BottomModal title="الإبلاغ عن التقييم" ... />`
- Review modal → `<BottomModal title="أضف تقييمك" ... />`

---

## Phase 4: State & API Layer Cleanup (2-3 days)

**Goal:** Remove duplicate favorite state; clean API hooks.  
**Risk:** MEDIUM — touches state management  
**Testing:** Favorite toggle in all card variants; network error handling

### 4.1 Remove Duplicate Favorite State

**Files to update:**
- `components/provider/ProviderCard.tsx`
- `components/provider/ProviderRowCard.tsx`
- `components/provider/FeaturedCard.tsx`

**Before:**
```typescript
const [isFavorited, setIsFavorited] = useState(!!provider.is_favorited);

const handleFavorite = () => {
  setIsFavorited(!isFavorited);
  toggleFavorite.mutate({ slug, isFavorited });
};

// Render: use isFavorited
```

**After:**
```typescript
// Remove useState entirely
const { colors } = useTheme();
const toggleFavorite = useToggleFavorite();

const handleFavorite = () => {
  toggleFavorite.mutate({ slug, isFavorited: !!provider.is_favorited });
};

// Render: use provider.is_favorited (from React Query cache)
```

**Why:** React Query optimistically updates the cache on mutation. No need for local state. If mutation fails, UI shows correct state via cache.

### 4.2 Split useApi.ts Hook

**File:** `src/hooks/useApi.ts` (407 lines)

**Split into:**

1. `src/hooks/useProviderQueries.ts` (8 queries):
   - useHome
   - useCategories
   - useProvider
   - useProviderReviews
   - useSearch
   - useFavorites
   - useTopRated
   - useCity

2. `src/hooks/useProviderMutations.ts` (7 mutations):
   - useToggleFavorite
   - useSubmitReview
   - useFlagReview
   - useLogin
   - useRegister
   - useForgotPassword
   - useResetPassword

3. Keep `useApi.ts` as re-export for backward compatibility:
```typescript
// src/hooks/useApi.ts
export * from './useProviderQueries';
export * from './useProviderMutations';
```

### 4.3 Use useInfiniteQuery for Reviews

**File:** `app/provider/[slug].tsx`

**Before:**
```typescript
const [reviewPage, setReviewPage] = useState(1);
const [allReviews, setAllReviews] = useState<Review[]>([]);
const { data: reviewsData } = useProviderReviews(slug, reviewPage);

useEffect(() => {
  const fresh = reviewsData?.data;
  if (!fresh?.length) return;
  setAllReviews((prev) =>
    reviewPage === 1 ? fresh : [...prev, ...fresh.filter((r) => !prev.some((x) => x.id === r.id))]
  );
}, [reviewsData?.data, reviewPage]);
```

**After:**
```typescript
const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ['provider-reviews', slug],
  queryFn: ({ pageParam = 1 }) => fetchProviderReviews(slug, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  initialPageParam: 1,
});

const allReviews = data?.pages.flatMap(p => p.data) ?? [];
```

---

## Phase 5: Screen Simplification (3-4 days)

**Goal:** Extract logic from monolithic provider screen.  
**Risk:** HIGH — refactor complex screen  
**Testing:** All provider detail features work; no regressions

### 5.1 Extract useProviderDetail Hook

**Create:** `src/hooks/useProviderDetail.ts`

```typescript
export function useProviderDetail(slug: string) {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { data: provider, isLoading, isError, refetch } = useProvider(slug);
  const toggleFavorite = useToggleFavorite();
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  
  const profile = useMemo(() => mapProviderProfile(provider), [provider]);
  
  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirectTo: `/provider/${slug}` } });
      return;
    }
    if (provider) {
      toggleFavorite.mutate({ slug: String(slug), isFavorited: !!provider.is_favorited });
    }
  }, [isAuthenticated, slug, provider, toggleFavorite]);
  
  // ... more handlers ...
  
  return {
    provider,
    profile,
    isLoading,
    isError,
    refetch,
    isAuthenticated,
    user,
    allReviews,
    handleFavorite,
    // ... handlers ...
  };
}
```

### 5.2 Extract useReviewModal Hook

**Create:** `src/hooks/useReviewModal.ts`

```typescript
export function useReviewModal(slug: string) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const submitReview = useSubmitReview();
  
  const handleReviewSubmit = useCallback(() => {
    submitReview.mutate(
      { slug: String(slug), rating: reviewRating, comment: reviewComment },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewComment("");
          setReviewError("");
        },
        onError: (err: unknown) => {
          setReviewError(/* ... */);
        }
      }
    );
  }, [slug, reviewRating, reviewComment, submitReview]);
  
  return {
    showReviewModal,
    setShowReviewModal,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    reviewError,
    handleReviewSubmit,
    isPending: submitReview.isPending,
  };
}
```

### 5.3 Extract useReportModal Hook

**Create:** `src/hooks/useReportModal.ts`

```typescript
export function useReportModal(slug: string) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewIdState, setReportReviewIdState] = useState<number | null>(null);
  const [reportReasonType, setReportReasonType] = useState<ReportReason>('offensive');
  const [customReportReason, setCustomReportReason] = useState("");
  const [reportError, setReportError] = useState("");
  const flagReview = useFlagReview();
  
  const handleReportSubmit = useCallback(() => {
    // ... validation and submission logic ...
  }, [/* deps */]);
  
  return {
    showReportModal,
    setShowReportModal,
    reportReviewIdState,
    setReportReviewIdState,
    reportReasonType,
    setReportReasonType,
    customReportReason,
    setCustomReportReason,
    reportError,
    handleReportSubmit,
  };
}
```

### 5.4 Refactor app/provider/[slug].tsx

**Before:** 679 lines  
**After:** ~150 lines

```typescript
import { useProviderDetail } from '@/hooks/useProviderDetail';
import { useReviewModal } from '@/hooks/useReviewModal';
import { useReportModal } from '@/hooks/useReportModal';

export default function ProviderScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const detail = useProviderDetail(slug as string);
  const reviewModal = useReviewModal(slug as string);
  const reportModal = useReportModal(slug as string);
  
  if (detail.isLoading) return <LoadingSpinner />;
  if (detail.isError || !detail.provider) return <ErrorView onRetry={detail.refetch} />;
  
  return (
    <SafeAreaView>
      <ScrollView>
        <ProviderProfileHeader {...detail.profile} onFavoritePress={detail.handleFavorite} />
        <ProviderSections {...detail} />
        <ReviewsSection
          reviews={detail.allReviews}
          onWriteReviewPress={() => reviewModal.setShowReviewModal(true)}
          onReportReview={(id) => reportModal.setReportReviewIdState(id)}
        />
      </ScrollView>
      
      <ReviewModal {...reviewModal} slug={slug} />
      <ReportModal {...reportModal} onSubmit={reportModal.handleReportSubmit} />
    </SafeAreaView>
  );
}
```

---

## Phase 6: Type Safety Improvements (1-2 days)

**Goal:** Fix remaining `any` types; enable strict TypeScript.  
**Risk:** LOW — type fixes don't change behavior  
**Testing:** `npm run typecheck` passes

### 6.1 Fix Remaining `any` Types

**File:** `src/lib/api.ts`

Replace:
```typescript
config.headers = {} as any;
```

With:
```typescript
config.headers = config.headers || {};
```

**File:** `src/utils/providerMappers.ts`

Create typed helper:
```typescript
export function getFieldValue<T = unknown>(
  obj: Record<string, unknown>,
  key: string,
  fallback: T
): T {
  return (obj[key] as T) || fallback;
}
```

### 6.2 Create Type Definitions

**Create:** `src/types/routing.ts`

```typescript
export type RouteParams = {
  '/(tabs)': undefined;
  '/(tabs)/index': undefined;
  '/provider/[slug]': { slug: string; writeReview?: string; reportReviewId?: string };
  '/category/[slug]': { slug: string };
  '/(auth)/login': { redirectTo?: string };
  '/(auth)/register': undefined;
  // ... all routes ...
};
```

**Create:** `src/types/api-errors.ts`

```typescript
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface FieldError {
  field: string;
  message: string;
}

export function isFieldError(error: unknown): error is FieldError {
  return typeof error === 'object' && error !== null && 'field' in error && 'message' in error;
}
```

---

## Phase 7: RTL & Utils Cleanup (1 day)

**Goal:** Replace inline RTL with helper functions.  
**Risk:** LOW — style-only changes  
**Testing:** RTL alignment correct in all screens

### 7.1 Update RTL Helpers

**File:** `src/utils/rtl.ts`

Add helper styles:
```typescript
export const rtlStyles = {
  row: { flexDirection: 'row-reverse' as const },
  rowCenter: { flexDirection: 'row-reverse' as const, alignItems: 'center' as const },
  rowSpaceBetween: { 
    flexDirection: 'row-reverse' as const, 
    justifyContent: 'space-between' as const 
  },
  text: { textAlign: 'right' as const, writingDirection: 'rtl' as const },
};
```

### 7.2 Replace Inline Styles

**Before:**
```typescript
<View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
```

**After:**
```typescript
<View style={rtlStyles.rowCenter}>
```

---

## Phase 8: Performance Optimization (1-2 days)

**Goal:** Fix FlatList issues; memoize expensive operations.  
**Risk:** LOW — optimization only  
**Testing:** Lists render smoothly; no console warnings

### 8.1 Fix FlatList keyExtractor

**File:** `app/(tabs)/index.tsx`

```typescript
<FlatList
  data={[...categories.slice(0, 4), { id: 'view-all' as any, isViewAll: true }]}
  keyExtractor={(item) => item.id?.toString() ?? `view-all-${Date.now()}`}
  // ...
/>
```

### 8.2 Memoize mapProviderProfile

**File:** `app/provider/[slug].tsx`

```typescript
const profile = useMemo(() => mapProviderProfile(provider), [provider]);
```

### 8.3 Memoize BannerCarousel

**File:** `components/home/BannerCarousel.tsx`

```typescript
export const BannerCarousel = React.memo(function BannerCarousel({ ... }) {
  // ...
});
```

---

## Testing & Verification

### Before Starting Each Phase

```bash
# Ensure clean state
git status  # No uncommitted changes

# Run type check
npm run typecheck

# Run linter
npm run lint
```

### After Each Phase

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Manual testing (per phase):
# 1. App starts
# 2. All screens load
# 3. Critical flows work
# 4. No console errors/warnings
# 5. Dark mode looks correct
```

### Critical Flows to Test

- [ ] **Home:** Load real API data, city selector works
- [ ] **Search:** Filter by category, keyword, city
- [ ] **Provider Profile:** Load, view reviews, favorite toggle, WhatsApp/call buttons work
- [ ] **Favorites:** Add/remove, persist across app restart
- [ ] **Auth:** Login, register, forgot password flows
- [ ] **Categories:** Browse, filter by subcategory
- [ ] **Settings:** Switch dark mode, change language (if applicable)

---

## Rollback Strategy

Each phase is designed to be independently rollbackable:

```bash
# If phase breaks something, revert just that phase
git revert HEAD~N  # Revert last N commits

# Or cherry-pick only the good commits
git cherry-pick <commit-hash>
```

---

## Commit Strategy

**One commit per minor fix; one commit per phase completion.**

```bash
# Phase 1
git commit -m "chore: remove unused imports and variables"

# Phase 2
git commit -m "refactor: replace hardcoded colors with design tokens"
git commit -m "feat: add overlay and platform color tokens"

# Phase 3
git commit -m "refactor: consolidate provider card variants into ProviderCardBase"
git commit -m "components: add reusable Button component"
# ... etc
```

---

## Timeline Estimate

| Phase | Duration | Priority | Risk |
|-------|----------|----------|------|
| Phase 1: Cleanup | 2-3 days | HIGH | MINIMAL |
| Phase 2: Design Tokens | 2-3 days | HIGH | LOW |
| Phase 3: Component Dedup | 3-4 days | HIGH | MEDIUM |
| Phase 4: State & API | 2-3 days | HIGH | MEDIUM |
| Phase 5: Screen Simplification | 3-4 days | MEDIUM | HIGH |
| Phase 6: Type Safety | 1-2 days | MEDIUM | LOW |
| Phase 7: RTL/Utils | 1 day | LOW | LOW |
| Phase 8: Performance | 1-2 days | LOW | LOW |
| **Total** | **3-4 weeks** | | |

**Fast Track (High Priority Only):** 1-2 weeks (Phases 1-4)

---

## Success Criteria

After completing all phases:

- [ ] No console errors or warnings in production build
- [ ] TypeScript strict mode passes (0 errors)
- [ ] No hardcoded colors outside of theme/tokens.ts
- [ ] All buttons use Button component
- [ ] All cards use Card component
- [ ] Provider screens use extracted hooks
- [ ] FlatLists have keyExtractor
- [ ] No duplicate state (favorites rely on React Query cache)
- [ ] Dark mode works correctly throughout
- [ ] All critical flows tested manually
- [ ] No regressions reported

**Target Maintainability Score:** 8.5/10

---

## Next Steps

1. **Read this plan** — Understand the phases
2. **Start Phase 1** — Low-risk cleanup as foundation
3. **Track progress** — Commit regularly; test after each phase
4. **Review & Adjust** — If any phase reveals unexpected issues, document and adjust downstream phases

---

**Plan Created:** June 27, 2026  
**Expected Completion:** July 10-24, 2026 (depending on parallel work)
