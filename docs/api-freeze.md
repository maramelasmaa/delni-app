# Delni API Contract - Freeze Document

**Base URL:** `EXPO_PUBLIC_API_URL` (e.g. `http://<host>/api/v1`)  
**Auth:** Laravel Sanctum - Bearer token in `Authorization: Bearer <token>` header  
**Content-Type:** `application/json`  
**Date frozen:** 2026-06-22  
**Version:** `v1`

---

## Freeze Notes

- All supported API routes are versioned under `/api/v1`.
- Clients still calling `/api/...` must be updated to `/api/v1/...`.
- Response field names were preserved during versioning and auth hardening.
- Onboarding and panel login changes were server-side hardening only; they do not change API payload shapes.

---

## Response Envelope

Every endpoint returns this wrapper:

```ts
{
  success: boolean
  data: T
  message?: string          // present on mutations and auth responses
  pagination?: {            // present on paginated endpoints only
    current_page: number
    per_page: number
    total: number
    last_page: number
    has_more: boolean
  }
  errors?: Record<string, string[]>  // present on 422 validation failures
}
```

---

## Shared Object Shapes

### City
```ts
{ id: number; slug: string; name: string; discoverable_profiles_count: number }
```

### Category
```ts
{
  id: number; slug: string; name: string
  icon_url: string | null
  providers_count: number
  subcategories_count: number
  subcategories?: Subcategory[]   // only when loaded
}
```

### Subcategory
```ts
{ id: number; slug: string; name: string; icon_url: string | null; providers_count: number }
```

### ProviderCard  _(used in listings, search, favorites, top-rated)_
```ts
{
  id: number; slug: string; name: string
  logo_url: string | null
  cover_url: string | null
  city?: City
  category?: Category
  subcategories?: Subcategory[]
  rating_average: number          // 0.0-5.0, one decimal place
  reviews_count: number
  is_featured: boolean
  whatsapp_url: string | null     // pre-formatted "https://wa.me/<digits>" or null
  phone: string | null
}
```

### ProviderDetail  _(used only on GET /providers/:slug)_
All `ProviderCard` fields plus:
```ts
{
  description: string | null      // maps to profile.bio
  portfolio_images: string[]      // flat array of absolute image URLs
  portfolio_items: PortfolioItem[]
  website: string | null
  social_links: { facebook: string | null; instagram: string | null; linkedin: string | null }
  service_area_note: string | null
  years_experience: number | null  // maps to profile.experience_years
  credentials: ProviderCredential[]
  reviews: Review[]               // approved reviews, embedded (also paginated via /reviews)
  is_favorited: boolean           // false when unauthenticated
  can_review: boolean
  review_status_message: string | null
}
```

### PortfolioItem
```ts
{
  id: number; title: string
  description: string | null      // falls back to short_description
  link: string | null             // falls back to main_url
  images: string[]                // absolute URLs (NOT objects - flat strings)
}
```

> **Note:** `PortfolioItemResource` returns `images` as `string[]`, not objects.

### ProviderCredential
```ts
{ id: number; title: string; issuer?: string; verification_url?: string; issue_date?: string; notes?: string }
```

### Review
```ts
{
  id: number; rating: number; comment: string | null
  user_name: string               // reviewer's display name, default "????"
  status?: string                 // only present if viewer is review owner or admin
  created_at: string              // ISO 8601
}
```

### User  _(auth endpoints only)_
```ts
{ id: number; name: string; email: string; is_provider: boolean }
```

---

## Public Endpoints

### `GET /health`
Full path: `GET /api/v1/health`

Health check.
```json
{ "success": true, "message": "???? ???? ???? ?????." }
```

---

### `GET /home`
Full path: `GET /api/v1/home`

Homepage data. Cached.

**Query params:** `city` (slug, optional) - filters featured/suggested providers to that city.

**Response `data`:**
```ts
{
  stats: {
    visible_providers_count: number
    categories_count: number
    cities_count: number
    reviews_count: number
  }
  categories: Category[]
  featured_providers: ProviderCard[]
  suggested_providers: ProviderCard[]
}
```

---

### `GET /cities`
Full path: `GET /api/v1/cities`

All active cities with discoverable provider counts.

**Response `data`:** `City[]`

---

### `GET /contact`
Full path: `GET /api/v1/contact`

Platform contact information.

**Response `data`:**
```ts
{ whatsapp?: string; phone?: string; email?: string; facebook?: string; address?: string }
```

---

### `GET /categories`
Full path: `GET /api/v1/categories`

All active categories.

**Response `data`:** `Category[]`

---

### `GET /categories/:slug`
Full path: `GET /api/v1/categories/:slug`

Single category with its subcategories.

**Response `data`:** `Category` (with `subcategories` loaded)

---

### `GET /subcategories/:slug`
Full path: `GET /api/v1/subcategories/:slug`

Single subcategory.

**Response `data`:** `Subcategory`

---

### `GET /search`
Full path: `GET /api/v1/search`

Paginated provider search.  
**Rate limit:** search throttle middleware is applied.

**Query params:**
| Param | Type | Notes |
|---|---|---|
| `q` | string | Supported keyword alias |
| `keyword` | string | Full-text search |
| `city` | string | City slug |
| `city_id` | number | City ID |
| `category` | string | Category slug |
| `category_id` | number | Category ID |
| `service` | string | Subcategory slug alias |
| `subcategory_id` | number | Subcategory ID |
| `provider_type` | string | Provider type code |
| `remote` | boolean | Remote-capable filter |
| `sort` | `rating` \| `reviews` \| `newest` | Default backend fallback |
| `page` | number | Default: 1 |
| `per_page` | number | Default: 15, enforced range: 5-30 |

**Response `data`:** `ProviderCard[]` + `pagination`

---

### `GET /providers/:slug`
Full path: `GET /api/v1/providers/:slug`

Provider detail page.

**Response `data`:** `ProviderDetail`

> `is_favorited` is always `false` for unauthenticated requests.  
> `can_review` is always `false` for unauthenticated requests.

---

### `GET /providers/:slug/reviews`
Full path: `GET /api/v1/providers/:slug/reviews`

Paginated approved reviews for a provider.

**Query params:** `per_page` (5-30, default 15)

**Response `data`:** `Review[]` + `pagination`

---

### `GET /top-rated`
Full path: `GET /api/v1/top-rated`

Top providers by rating, paginated.

**Query params:** `category` (slug), `city` (slug), `page`, `per_page`

**Response `data`:** `ProviderCard[]` + `pagination`

---

## Auth Endpoints

All auth endpoints live under `/api/v1/auth/*`.

### `POST /auth/register`
Full path: `POST /api/v1/auth/register`

**Rate limit:** `throttle:api.register`

**Body:**
```ts
{ name: string; email: string; password: string; password_confirmation: string; device_name?: string }
```

**Password rules:** min 8 chars, mixed case, at least one number.

**Response `data`:**
```ts
{ token: string; user: User }
```

---

### `POST /auth/login`
Full path: `POST /api/v1/auth/login`

**Rate limit:** `throttle:api.login`

**Body:**
```ts
{ email: string; password: string; device_name?: string }
```

**Response `data`:**
```ts
{ token: string; user: User }
```

**Behavior notes:**
- Failed logins now increment server-side lock counters.
- Successful login clears prior failed-attempt counters.

**Errors (422):**
- Account inactive, suspended, or temporarily locked -> error on `email` field

---

### `POST /auth/forgot-password`
Full path: `POST /api/v1/auth/forgot-password`

**Rate limit:** `throttle:api.forgot-password`

**Body:** `{ email: string }`

Response is always `success: true` (no email enumeration).

---

### `POST /auth/reset-password`
Full path: `POST /api/v1/auth/reset-password`

**Rate limit:** `throttle:api.reset-password`

**Body:**
```ts
{ email: string; password: string; password_confirmation: string; token: string }
```

---

## Protected Endpoints

`Authorization: Bearer <token>` required.

Middleware stack for protected marketplace actions:  
`auth:sanctum` -> `account.locked` -> `user.active` -> `user.not_suspended`

### `GET /auth/me`
Full path: `GET /api/v1/auth/me`

**Response `data`:** `User`

---

### `POST /auth/logout`
Full path: `POST /api/v1/auth/logout`

Revokes current token.  
**Response `data`:** `[]`

---

### `DELETE /auth/account`
Full path: `DELETE /api/v1/auth/account`

Soft-deletes account and revokes all tokens.  
**Response `data`:** `[]`

---

### `GET /favorites`
Full path: `GET /api/v1/favorites`

Paginated list of favorited providers (visible ones only).

**Query params:** `per_page` (5-30, default 15)

**Response `data`:** `ProviderCard[]` + `pagination`

---

### `POST /favorites/:providerSlug`
Full path: `POST /api/v1/favorites/:providerSlug`

Add provider to favorites. Idempotent.  
**Response `data`:** `[]`

---

### `DELETE /favorites/:providerSlug`
Full path: `DELETE /api/v1/favorites/:providerSlug`

Remove provider from favorites.  
**Response `data`:** `[]`

---

### `POST /providers/:slug/reviews`
Full path: `POST /api/v1/providers/:slug/reviews`

Submit a review.  
**Rate limit:** `throttle:reviews.create`  
**Middleware:** `review.eligible`

**Body:**
```ts
{ rating: number; comment?: string }
```

**Response `data`:** `Review`

---

### `POST /reviews/:id/flag`
Full path: `POST /api/v1/reviews/:id/flag`

Flag a review for moderation.  
**Rate limit:** `throttle:reviews.flag`

**Body:** `{ reason: string }`  
**Response `data`:** `[]`

---

## Error Responses

| HTTP | Meaning |
|---|---|
| 422 | Validation failed - `errors` key present |
| 401 | Unauthenticated - token missing or expired |
| 403 | Forbidden |
| 404 | Resource not found or not discoverable |
| 429 | Rate limit exceeded |

---

## Mobile Client Notes

- `EXPO_PUBLIC_API_URL` must now point to the versioned API root, for example: `http://192.168.x.x:8000/api/v1`
- Any client still calling `/api/...` directly must be updated to `/api/v1/...`
- `whatsapp_url` from the API is already a full `https://wa.me/<digits>` URL.
- `portfolio_items[].images` is `string[]`, not objects.
- The `status` field on `Review` is conditional; do not rely on it for standard public UI.
- `name` on `ProviderCard` and `ProviderDetail` is derived from `profile.business_name`, otherwise `user.name`.
