# Master Search, Filter & Discovery System Audit

Date: 2026-06-29
Scope: Expo SDK 54 mobile app in `C:\laragon\www\delni-app`
Verification: Static reverse engineering plus `npm.cmd run typecheck` (pass)

Expo note: Project uses Expo `~54.0.35`, React Native `0.81.5`, React `19.1.0`. Expo SDK 54 docs were checked before audit work.

## 0. Web Proof And Fixes Applied

Primary-source proof checked before the fixes:

| Proof | Source | Fix justified |
|---|---|---|
| Expo SDK 54 targets React Native `0.81` and React `19.1.0`, matching this app's package versions. | [Expo SDK 54 reference](https://docs.expo.dev/versions/v54.0.0/) | Kept changes within current SDK/runtime assumptions. |
| Expo Router search params can be read via `useLocalSearchParams`, and `router.setParams` updates URL params without pushing a new history entry. | [Expo Router URL parameters](https://docs.expo.dev/router/reference/url-parameters/) | Used `router.setParams` for subcategory filter state and made "All while already All" a no-op. |
| TanStack Query gives every query function an `AbortSignal`; consuming it lets out-of-date/inactive queries cancel. | [TanStack Query cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation) | Passed `signal` into search, category, suggestions, top-rated, and other GET query calls. |
| Axios `v0.22.0+` supports `AbortController` by passing `signal` in request config. | [Axios cancellation](https://axios-http.com/docs/cancellation) | Wired React Query's signal through `api.get(..., { signal })`. |

Fixes applied after the audit:

| File | Fix |
|---|---|
| `src/hooks/useApi.ts` | Added `signal` to React Query `queryFn` calls and passed it to Axios GET requests to prevent stale requests from continuing after query invalidation/unmount. |
| `app/category/[slug].tsx` | `Clear All` now clears active `subcategorySlug`; pressing the All subcategory pill while already on All is now a no-op. |
| `app/category/[slug].tsx` | The custom category providers query now passes React Query's `signal` to both `/categories/:slug` and `/search` requests. |
| `app/(tabs)/top-rated.tsx` | Category filter changed from undocumented comma-joined multi-select to a single selected category slug. |
| `app/(tabs)/search.tsx` | Route numeric params now use safe positive-integer parsing instead of `Number(...)`, preventing `NaN` from entering search state. |

Post-fix verification: `npm.cmd run typecheck` passes.

## 0.1 Remediation Pass 2

Additional fixes applied after the "FIX ALL THE ISSUES" request:

| File | Fix |
|---|---|
| `src/utils/searchFilters.ts` | Added shared parsing, normalization, route serialization, request serialization, and duplicate-safe merge helpers for search/filter state. |
| `src/hooks/useApi.ts` | `/search` now uses the shared endpoint-specific serializer, including `remote=true -> 1` and `subcategory -> service` mapping. |
| `app/(tabs)/search.tsx` | Removed local duplicated route parsing/serialization, normalized route hydration/apply/reset/search transitions, included keyword/sort in active filter count, and stopped client-side remote post-filtering so pagination totals match visible rows. |
| `app/category/[slug].tsx` | Category filter state is now route-restorable for keyword/city/provider type/remote/sort, and category provider results now always come from `/search`; `/categories/:slug` is used for metadata only. |
| `app/category/[slug].tsx` | Keyword and active-city changes update route params without clearing `subcategorySlug` unless Clear All explicitly resets it. |
| `app/(tabs)/top-rated.tsx` | Handles legacy comma category params by taking a single slug, matching the documented singular API contract. |
| `src/hooks/useProviderDetail.ts`, `app/provider/[slug].tsx` | Review pagination now uses duplicate-safe merge logic shared with provider lists. |

Post-remediation verification: `npm.cmd run typecheck` passes.

## 1. Complete Search & Filter Architecture

Conceptual architecture:

```text
Expo Router routes
  app/(tabs)/index.tsx
    -> useHome(activeCity.slug)
    -> /home?city=
    -> category/provider navigation

  app/(tabs)/search.tsx
    -> URL params: keyword, category, category_id, city, city_id, sort, provider_type, remote, show_filters
    -> local state: keyword, debouncedQ, filters, modalFilters, allProviders
    -> useSearch(filters) -> GET /search
    -> useSearchSuggestions(debouncedQ.trim()) -> GET /search/suggestions
    -> useCities(), useCategories(), useProviderTypes()

  app/category/[slug].tsx
    -> URL params: slug, subcategorySlug
    -> global state: activeCity
    -> local state: page, allProviders, keyword, filters, modalFilters
    -> useCategory(slug, 1) for metadata
    -> custom useQuery(["category-providers", ...]) chooses:
       - GET /categories/:slug when no subcategory and no active filters
       - GET /search when subcategory or active filters exist

  app/(tabs)/top-rated.tsx
    -> URL param: category
    -> global state: activeCity
    -> local state: selectedCategories[], page, allProviders
    -> useTopRated({ category: selectedCategories.join(","), city, page })

  app/(tabs)/categories.tsx
    -> local client-side category-name search only
    -> useCategories()

  app/subcategory/[slug].tsx
    -> redirect shim to /category/:categorySlug?subcategorySlug=:slug

Shared data layer
  src/hooks/useApi.ts
    -> React Query wrappers and cache updates
  src/constants/api.ts
    -> endpoint names
  src/types/index.ts
    -> SearchFilters, Provider, Category, PaginationMeta
  src/store/city.ts
    -> persisted activeCity source of truth
```

State ownership summary:

| State | Owner | Persisted | URL-restorable |
|---|---|---:|---:|
| Search keyword | `search.tsx`, `category/[slug].tsx` | No | Search: yes, Category: no |
| Category filter | Route slug or search filters | No | Yes |
| Subcategory filter | `subcategorySlug` route param | No | Yes |
| City filter | `useCityStore` plus local filter copies | Yes | Search: yes, Category: no |
| Provider type | `filters.provider_type` | No | Search: yes, Category: no |
| Remote | `filters.remote` | No | Search: yes, Category: no |
| Sort | `filters.sort` | No | Search: yes, Category: no |
| Page | local state / filter page | No | No |
| Accumulated rows | `allProviders` screen state | No | No |
| Favorites | React Query caches + backend | Backend | N/A |

## 2. Inferred Business Rules Specification

| Rule | Source |
|---|---|
| `/search` is paginated and supports keyword, city, category, service/subcategory, provider_type, remote, sort, page, per_page. | `docs/api-freeze.md:219-242` |
| Search filters should reset pagination to page 1. | `docs/fixes-log.md:41`, screen implementations |
| Old pages must not merge into a new query. | Prompt requirement and page accumulation logic |
| Category detail "All" means whole current category, not global all categories. | `app/category/[slug].tsx:112-114`, `:164-176` |
| A subcategory pill is single-select; tapping active pill or All clears subcategory only. | `app/category/[slug].tsx:352-356` |
| City is a global discovery default, but a local search/category city override can differ. | `src/store/city.ts:6-27`, `app/category/[slug].tsx:134-142` |
| Sort must not clear keyword/category/city/provider_type/remote; it should reset page only. | Prompt rule; implemented via modal changes |
| Search text should persist across sort/filter changes unless Clear All is explicitly used. | Prompt rule; partially implemented |
| Clear All in search resets all search facets and keyword. | `app/(tabs)/search.tsx:171-188` |
| Clear All in category resets local filters to category + active city, not subcategory. | `app/category/[slug].tsx:272-289` |
| The provider detail route is separate from provider filtering; there is no selected provider filter in current code. | `components/provider/ProviderRowCard.tsx:22` |

## 3. State Transition Matrix

| Transition | Should change | Should remain | Current result |
|---|---|---|---|
| Search keyword commit | keyword, page, URL | category, city, sort, provider_type, remote | Pass in search tab (`search.tsx:245-255`) |
| Search input clear | keyword, page, URL | category, city, sort, provider_type, remote | Pass, with stale-closure risk (`search.tsx:496-502`) |
| Open filters | modalFilters copy | applied filters | Pass (`search.tsx:133-145`) |
| Apply filters | filters, keyword, URL, page | none outside facets | Pass (`search.tsx:150-168`) |
| Search Clear All | all search facets, keyword, URL | provider detail route history | Expected by implementation (`search.tsx:171-188`) |
| Category keyword debounce | category-local keyword, page | subcategory, provider_type, remote, sort, city | Pass (`category/[slug].tsx:297-312`) |
| Category active city change | local city, page | keyword, provider_type, remote, sort, subcategory | Mostly pass (`category/[slug].tsx:315-326`) |
| Category Clear All | local filters, keyword, page | route slug, subcategory route param | Partial: leaves subcategory selected (`category/[slug].tsx:272-289`) |
| Category All pill | subcategorySlug only | keyword/city/provider_type/remote/sort | Pass (`category/[slug].tsx:354-356`) |
| Top-rated category toggle | selectedCategories, route category | city | Mostly pass, but multi-category may violate API (`top-rated.tsx:83-90`) |
| Pagination | page | filters | Pass guard on fetching, but stale response can still flash |
| Logout/401 | auth cache | public discovery cache ideally | Risk: `queryClient.clear()` drops all caches (`src/lib/api.ts:21-35`) |

## 4. Search State Machine Diagram

```text
Idle/default
  -> typing keyword -> Suggesting
  -> submit/suggestion -> Fetching(page=1)
  -> open modal -> EditingModal

EditingModal
  -> apply -> Fetching(page=1)
  -> clear all -> DefaultFetching(page=1)
  -> close -> previous AppliedState

Fetching(page=1)
  -> success non-empty -> Results
  -> success empty -> Empty
  -> error -> Error

Results
  -> end reached -> Fetching(page+n)
  -> filter/search change -> Fetching(page=1) with accumulated rows cleared
  -> favorite toggle -> OptimisticResults -> Results/ErrorRollback

Category detail adds:
  NoSubcategoryNoActiveFilters -> CategoryEndpoint
  SubcategoryOrActiveFilters -> SearchEndpoint
```

## 5. Dependency Matrices

Filter dependency matrix:

| Input | API param | Page reset | Clears rows | URL synced |
|---|---|---:|---:|---:|
| keyword | `keyword` | Yes | Yes | Search only |
| city | `city`, `city_id` | Yes | Yes | Search only |
| category | `category`, `category_id` | Yes | Yes | Search route/category route |
| subcategory | `service`, `subcategory_id` | Yes | Yes | Category only |
| provider_type | `provider_type` | Yes | Yes | Search only |
| remote | `remote=1` | Yes | Yes | Search only |
| sort | `sort` | Yes | Yes | Search only |

Provider dependency matrix:

| Action | Provider card list | Provider detail route | Favorite cache |
|---|---|---|---|
| Tap provider | unchanged | navigates to `/provider/:slug` | unchanged |
| Favorite in list | optimistic toggle | unchanged | updates search/category/top-rated/home/favorites |
| Clear All | search/category list changes | route history remains | unchanged |
| Category All pill | category list changes | unchanged | unchanged |

Category dependency matrix:

| Action | Category | Subcategory | Other filters |
|---|---|---|---|
| Open category route | route slug | from `subcategorySlug` if present | initialized local defaults |
| Tap subcategory | preserved | set to slug | preserved |
| Tap active subcategory | preserved | cleared | preserved |
| Tap All | preserved | cleared | preserved |
| Category Clear All | preserved | currently preserved | other filters reset |

## 6. Top 50 Search/Filter Bugs And Risks

1. **High - Architecture issue**: There is no single canonical search state model. Expected: one normalized query object. Actual: URL params, `filters`, `modalFilters`, `keyword`, `page`, `allProviders`, and `activeCity` duplicate state. Evidence: `search.tsx:108-131`, `category/[slug].tsx:54-89`. Repro: change URL params while modal is open. Fix: reducer/query-state module.
2. **High - State synchronization**: Category filters are not URL-restorable except subcategory. Expected: deep link restores city/provider_type/remote/sort/keyword. Actual: local-only state. Evidence: `category/[slug].tsx:73-89`, no `router.setParams` in `handleApplyFilters`. Fix: sync full category query to route params.
3. **High - Filter bug**: Category Clear All leaves selected subcategory active. Expected: "Clear All" clears all filter facets in that screen, including subcategory, or label must say "Clear filters". Actual: `subcategorySlug` untouched. Evidence: `category/[slug].tsx:272-289`. Repro: category -> subcategory -> Clear All. Fix: include `router.setParams({ subcategorySlug: undefined })` or rename behavior.
4. **High - Business rule mismatch**: The prompt's "selected provider" state does not exist in this app. Expected: explicit provider selection model if provider can be selected as a filter. Actual: provider is only detail navigation. Evidence: `ProviderRowCard.tsx:22`. Fix: define product term as `provider_type` or add provider facet.
5. **High - Documentation mismatch**: API freeze says search sort supports `reviews`; UI removed it and types exclude it. Evidence: `docs/api-freeze.md:238`, `src/types/index.ts:142`, `search.tsx:35-38`. Fix: align API contract and client.
6. **High - Documentation mismatch**: `docs/fixes-log.md` says backend only accepts `top_rated/newest`, but API freeze says `rating/reviews/newest`. Evidence: `docs/fixes-log.md:49`, `docs/api-freeze.md:238`. Fix: update backend or freeze doc.
7. **High - Logic bug**: Category screen uses `/categories/:slug` for All/no filters and `/search` otherwise, so result ranking and field semantics can change when toggling a neutral filter. Evidence: `category/[slug].tsx:142-176`. Repro: category All -> toggle sort rating -> apply. Fix: use one listing endpoint for category providers.
8. **High - Filter bug**: Remote is sent to backend and then filtered client-side again. Expected: one source of truth. Actual: `remote=1` plus `freshRaw.filter(getOffersRemoteWork)`. Evidence: `search.tsx:210`, `category/[slug].tsx:198`. Fix: trust backend or move to client only with accurate pagination.
9. **High - Pagination bug**: Client-side remote post-filter can make pagination totals and hasMore wrong. Evidence: `search.tsx:210-212`, `search.tsx:242-243`, `category/[slug].tsx:198-215`. Repro: backend returns mixed remote/non-remote page with `remote=1` unsupported. Fix: backend-only remote filter.
10. **High - Pagination bug**: If a remote page is filtered to zero rows but backend has more pages, UI can show empty state while `hasMore` is true but no visible load affordance in search. Evidence: `search.tsx:618-629`, `search.tsx:691-713`. Fix: do not post-filter paginated results.
11. **Medium - Race condition**: `allProviders` is cleared in a separate effect after filters change, so old rows can render for one commit. Evidence: `search.tsx:203-205`. Fix: derive visible rows from query identity or reducer transition.
12. **Medium - Race condition**: Category uses `searchData` from previous query until new query settles unless cleared by effects. Evidence: `category/[slug].tsx:195-203`. Fix: key accumulated rows by serialized query.
13. **Medium - Race condition**: Search `commitSearch` depends on selected filter fields but spreads `filters` from the closure. Evidence: `search.tsx:245-255`. Repro: apply filters and immediately submit. Fix: functional reducer.
14. **Medium - UI inconsistency**: Search Clear All closes modal immediately and clears keyword; users may expect only modal facets to reset. Evidence: `search.tsx:171-188`. Fix: split "Reset filters" and "Clear search".
15. **Medium - UI inconsistency**: Search active filter count excludes keyword and sort. Evidence: `search.tsx:301-306`. Expected badge reflects active query facets or label clarifies. Fix: include keyword/sort or rename badge.
16. **Medium - UI inconsistency**: Category active filter count excludes keyword and subcategory. Evidence: `category/[slug].tsx:329-336`. Fix: include all visible active constraints.
17. **Medium - State synchronization**: Search modal `modalFilters.keyword` can diverge from top input while typing behind/around modal lifecycle. Evidence: `search.tsx:133-145`, `search.tsx:217-231`. Fix: modal edits should be draft state initialized from canonical reducer.
18. **Medium - Search bug**: Search suggestions are enabled based on untrimmed length in hook, while caller passes trimmed text. Evidence: `useApi.ts:101-111`, `search.tsx:196`. Low impact now, fragile API. Fix: normalize in hook.
19. **Medium - Search bug**: Suggestions query does not pass an AbortSignal to Axios. React Query can ignore stale data, but network still runs. Evidence: `useApi.ts:101-110`. Fix: accept `signal` in queryFn and pass to `api.get`.
20. **Medium - Race condition**: Search requests do not pass React Query abort signals either. Evidence: `useApi.ts:116-129`. Fix: wire `signal`.
21. **Medium - Pagination bug**: `useSearch` filters out `per_page=0`, page=0, false values globally; this is okay now but conflates valid false/zero semantics. Evidence: `useApi.ts:120-123`. Fix: endpoint-specific serializer.
22. **Medium - Logic bug**: Category `hasActiveFilters` treats activeCity as not an active filter, but still sends activeCity to `/categories/:slug` when no other filters exist. Evidence: `category/[slug].tsx:126`, `:134-142`, `:164-166`. If category endpoint ignores `city`, header/list mismatch possible. Fix: route all city-filtered category lists through `/search` or confirm endpoint contract.
23. **Medium - API contract gap**: `GET /provider-types` is used but not documented in API freeze. Evidence: `src/constants/api.ts:14`, `useApi.ts:51-61`, no docs entry. Fix: document or remove dynamic call.
24. **Medium - Top-rated filter bug**: Client allows multiple selected categories but `/top-rated` docs specify singular `category` slug. Evidence: `top-rated.tsx:83-90`, `docs/api-freeze.md:274`. Repro: select two categories. Fix: single-select or backend array support.
25. **Medium - Top-rated UX**: Tapping an active category removes it; tapping All clears all. This may be intended, but no active count or explicit clear affordance exists. Evidence: `top-rated.tsx:83-90`. Fix: product decision.
26. **Medium - Deep link bug**: Search route params parse invalid numeric IDs with `Number(...)`, yielding `NaN` in filters. Evidence: `search.tsx:111`, `:123`, `:223`, `:225`. Fix: safe integer parser.
27. **Medium - Deep link bug**: `sort` deep link values other than `newest` silently become `rating`. Evidence: `search.tsx:114`, `:125`, `:226`. Fix: validate and canonicalize URL.
28. **Medium - State synchronization**: Search `router.setParams(toSearchRouteParams(defaults))` relies on undefined removing params. Expo Router generally supports this, but behavior should be verified on SDK 54 for all platforms. Evidence: `search.tsx:187`. Fix: use explicit `router.replace` for canonical URL.
29. **Medium - Business rule gap**: No recent searches, saved filters, or history exist despite audit scope. Evidence: no matches for recent/history/saved filters. Fix: define as out of scope or implement.
30. **Medium - Business rule gap**: No offline-specific search UX; request errors show generic error. Evidence: `docs/audits/empty-error-loading-audit.md:31`, `search.tsx:608-614`. Fix: network-aware error copy.
31. **Low - UI inconsistency**: Search initial empty screen can appear after `/search` fetch returns no providers with no query, even though hook always fetches. Evidence: `useApi.ts:130`, `search.tsx:635-668`. Fix: disable initial fetch until a query/facet exists or show default discovery.
32. **Low - Performance**: Search `queryKey: ['search', filters]` changes object identity on every set, okay in React Query hashing but harder to reason. Evidence: `useApi.ts:118`. Fix: serialized stable query key.
33. **Low - Performance**: Category `queryKey` includes entire `filters` object. Evidence: `category/[slug].tsx:151`. Fix: serialized normalized params.
34. **Low - Performance**: `prev.some` duplicate check is O(n^2) across pages. Evidence: `search.tsx:212`, `category/[slug].tsx:201`, `top-rated.tsx:65`. Fix: Set of IDs.
35. **Low - UI consistency**: Category search text is debounced but pressing return does not explicitly commit. Evidence: `CategoryHeader` input has no `onSubmitEditing`. Fix: add search return behavior.
36. **Low - UI consistency**: Search suggestions show only for top input, not modal search input. Evidence: `search.tsx:514-527`, modal input `:781-802`. Fix: product choice.
37. **Low - Logic bug**: Category `handleProviderTypeContentSizeChange` returns cleanup from an event handler, which React Native ignores. Evidence: `category/[slug].tsx:58-62`. Fix: use ref timeout cleanup effect or no timeout.
38. **Low - Regression risk**: Category `getSubcategoryIcon` is unused. Evidence: `category/[slug].tsx:779`. Fix: remove in cleanup.
39. **Low - Regression risk**: `useAuthStore` imported but unused in search/category. Evidence: `search.tsx:29`, `category/[slug].tsx:16`. Fix: remove.
40. **Low - Regression risk**: Category imports `Linking` but does not use it. Evidence: `category/[slug].tsx:4`. Fix: remove.
41. **Low - Search normalization**: Category list search uses `includes` without casing/diacritics normalization. Evidence: `categories.tsx:22-26`. Fix: normalize Arabic/Latin strings.
42. **Low - Search normalization**: Provider search relies on backend normalization; frontend only trims. Evidence: `search.tsx:245-247`. Fix: document backend behavior.
43. **Low - Edge case**: Whitespace-only modal keyword persists as `keyword: ''` in modal until apply normalizes. Evidence: `category/[slug].tsx:247-263`, `search.tsx:150-168`. Fix: normalize draft display or on change.
44. **Low - UX**: Category Clear All resets city back to global activeCity, not all cities. Evidence: `category/[slug].tsx:276-279`. Expected ambiguous. Fix: label "Reset to city default" or clear city.
45. **Low - UX**: Search Clear All resets city to all cities, different from category Clear All. Evidence: `search.tsx:171-188`, `category/[slug].tsx:272-289`. Fix: standardize.
46. **Low - Cache behavior**: 401 clears all query cache, including public discovery. Evidence: `src/lib/api.ts:21-35`. Fix: clear auth-scoped queries only.
47. **Low - API resilience**: Category custom query does not require pagination metadata, unlike `useSearch`. Evidence: `category/[slug].tsx:170-172`, `useApi.ts:5-12`. Fix: reuse `requirePagination`.
48. **Low - API resilience**: Top-rated has no `per_page` control though API supports it. Evidence: `useApi.ts:135-145`, `docs/api-freeze.md:274`. Fix: add per_page if needed.
49. **Low - UX**: Search filter modal category All updates `category` and `category_id` via two separate state calls. Evidence: `search.tsx:337-340`. Fix: single reducer action to avoid transient mismatches.
50. **Low - UX**: City selection similarly updates `city` and `city_id` via separate state calls. Evidence: `search.tsx:851-854`. Fix: single reducer action.

## 7. Required Bug Detail Template For Highest-Priority Bugs

### Bug A: Category Clear All Does Not Clear Subcategory

Severity: High
Bug type: Filter bug / business rule violation
Expected behavior: Clear All should clear all active category-screen filters, including subcategory, or the action should not be named Clear All.
Actual behavior: It resets local filters but leaves `subcategorySlug` route param untouched.
Root cause: Subcategory state is URL-owned (`subcategorySlug`), while Clear All only mutates local `filters`, `modalFilters`, `page`, `allProviders`, and `keyword`.
Evidence: `app/category/[slug].tsx:96-101`, `:272-289`, `:354-356`
Reproduction: Open category -> tap a subcategory -> open filters -> tap Clear All.
Regression risk: Changing this affects deep-linked subcategory pages and users expecting Clear All to preserve subcategory.
Recommended fix: Promote category query state into one reducer and make Clear All explicitly reset route subcategory plus local facets in one transition.

### Bug B: Client-Side Remote Filtering Corrupts Pagination Semantics

Severity: High
Bug type: Pagination bug / filter bug
Expected behavior: `remote` filtering and pagination totals must describe the same result set.
Actual behavior: The app sends `remote=1` and then filters returned rows client-side, while still trusting backend pagination.
Root cause: Remote availability has two authorities: backend query param and frontend `getOffersRemoteWork`.
Evidence: `src/hooks/useApi.ts:123`, `app/(tabs)/search.tsx:210-212`, `app/category/[slug].tsx:198-203`
Reproduction: Use remote filter against an endpoint/build where backend returns mixed rows or field aliases differ.
Regression risk: Removing client filter before backend support is verified could show non-remote providers.
Recommended fix: Contract-test backend `remote` support and remove client post-filter; otherwise fetch unpaginated/continue pages until enough remote rows fill UI.

### Bug C: Category Detail Switches Between Two Provider Listing Endpoints

Severity: High
Bug type: Architecture issue / business rule risk
Expected behavior: Same category list should use one ranking/filter contract regardless of neutral filter state.
Actual behavior: No filters uses `/categories/:slug`; any subcategory or active filter uses `/search`.
Root cause: Screen-local branching in `queryFn`.
Evidence: `app/category/[slug].tsx:142-176`
Reproduction: Open category All, then apply default sort or subcategory; compare ordering/count semantics.
Regression risk: Consolidating endpoints can change ordering, count, and cache keys.
Recommended fix: Make `/search?category=:slug` the single source for provider listings, with category endpoint used only for metadata.

### Bug D: Top Rated Multi-Select Sends Undocumented Category Param

Severity: Medium
Bug type: API contract violation
Expected behavior: Top-rated category filter should send one slug or documented array syntax.
Actual behavior: Multiple selected categories are joined as comma-separated string.
Root cause: UI state is `selectedCategories[]`, but API docs specify singular `category`.
Evidence: `app/(tabs)/top-rated.tsx:31-35`, `:83-90`, `docs/api-freeze.md:274`
Reproduction: Select two category pills in top-rated.
Regression risk: Switching to single-select changes current UI behavior.
Recommended fix: Confirm backend support. If absent, make top-rated category single-select.

### Bug E: Search/Category State Is Duplicated Across URL, Local, Draft, And Accumulated Rows

Severity: High
Bug type: Architecture issue / state synchronization
Expected behavior: One canonical normalized query object should drive URL, query key, request params, badge counts, and row accumulation.
Actual behavior: Each screen manually syncs several state copies with effects.
Root cause: No reducer or domain model for search transitions.
Evidence: `app/(tabs)/search.tsx:108-131`, `:203-231`, `app/category/[slug].tsx:54-89`, `:186-203`
Reproduction: Rapidly apply filters, type, tap Clear, paginate, and navigate back/forward.
Regression risk: Fixing locally can regress URL restoration or pagination.
Recommended fix: Introduce `SearchQueryState`, `normalizeSearchQuery`, `serializeSearchParams`, and reducer actions.

## 8. Hidden State Synchronization Issues

- Search has four keyword representations: route param, `keyword`, `debouncedQ`, and `filters.keyword`.
- Search modal has an independent `modalFilters` draft that can become stale while route params change.
- Category has `page` separate from `filters.page`; `providerParams.page` uses `page`, while `filters.page` is still updated in some transitions.
- Category city state is both global (`activeCity`) and local (`filters.city`), and activeCity is not considered active in badge count.
- Top-rated selected categories are local, but URL back/forward also updates them; multi-select is not documented by the API.

## 9. Race Conditions

- Requests are not passed React Query abort signals (`useApi.ts:101-129`, category custom query at `category/[slug].tsx:151-181`).
- Accumulated rows are cleared in effects after state changes, creating a possible one-frame stale list.
- Favorite optimistic updates touch many query families and invalidate them all, so a slow refetch can reorder rows while pagination is active (`useApi.ts:214-371`).
- Rapid modal apply + input submit can use closure state in `commitSearch`.

## 10. UX Inconsistencies

- Clear All means "all filters plus keyword and city" on search, but "reset to active city and keep subcategory" on category.
- Badge counts exclude keyword and subcategory on category, and exclude keyword/sort on search.
- Search has suggestions in the main input only, not in the modal keyword input.
- Category filters are not deep-linkable, while search filters are.
- Empty state copy can appear for a filtered remote result while backend pagination still says more rows exist.

## 11. Business Rule Violations

- "Clear All" is not consistent across screens.
- Category "All" works correctly for subcategory only, but there is no explicit no-op guard when already All; it still calls `router.setParams({ subcategorySlug: '' })`.
- Top-rated category filtering is multi-select despite singular API contract.
- The app does not implement recent searches, saved filters, or search history, so those should be declared out of scope or added.

## 12. Documentation vs Implementation Mismatches

| Topic | Documentation | Implementation |
|---|---|---|
| Search sort | `rating`, `reviews`, `newest` in API freeze | UI/types only `rating`, `newest` |
| Backend sort | fixes log says only `top_rated/newest` accepted | Client sends `rating` |
| Provider types endpoint | Used by app | Missing from API freeze |
| Category filtering | Docs say category view uses `/categories/{slug}` | Current category list sometimes uses `/search` |
| Empty/error audit | Older docs marked Search as REVIEW | Current search has explicit loading/error/empty branches |

## 13. Regression Risks

- Consolidating category listing onto `/search` can alter ranking and counts.
- Changing Clear All to clear subcategory may surprise users who view subcategory as navigation rather than a filter.
- Removing client-side remote filtering requires backend contract confidence.
- Making top-rated single-select can change current behavior if backend secretly supports comma lists.
- URL canonicalization may affect Expo Router back/forward behavior.

## 14. Prioritized Remediation Plan

1. Define a canonical `SearchQueryState` model with safe parsing, normalization, and serialization.
2. Add reducer actions for `setKeyword`, `setFacet`, `clearFacet`, `clearAll`, `setPage`, `loadMore`, and `hydrateFromRoute`.
3. Move `/search` param serialization out of `useApi.ts` and make it endpoint-specific.
4. Make category provider listings use one endpoint; use category detail endpoint only for metadata.
5. Resolve API contract for `sort`, `remote`, `provider-types`, and top-rated category multiplicity.
6. Fix Category Clear All semantics and badge counts after product decides whether subcategory is navigation or a filter.
7. Wire React Query `signal` into Axios search/category/suggestion requests.
8. Key accumulated rows by normalized query signature to prevent stale-page merges.
9. Add focused interaction tests for Clear All, All pill, sort preserve, remote pagination, top-rated category toggles, and deep-link restoration.
10. Add manual QA scripts for rapid taps, pagination during filter changes, offline/error states, and back/forward restoration.
