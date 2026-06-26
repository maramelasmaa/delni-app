# API Data Rendering Audit

**Date:** 2026-06-24
**Method:** Mapped each consumed endpoint's fields (`src/types/index.ts` + backend Resources) to its render site.

| Endpoint | Field | Rendered in | Expected UI | Status / notes |
|---|---|---|---|---|
| `/home` | banners[] | `BannerCarousel` | image carousel | PASS — empty → hidden |
| `/home` | featured/providers[] | `FeaturedCard`/`ProviderRowCard` | cards | PASS |
| `/home` | stats | home header | counts | REVIEW (manual) |
| `/categories` | name / name_ar | category cards | RTL text | PASS (`textAlign:right`) |
| `/categories` | icon_url | `CategoryIcon` | SVG icon | PASS (SvgUri + fallback) |
| `/categories/{slug}` | category.name / subcategories[] | header + pills | RTL chips | PASS |
| `/search` | data[] (providers) | `ProviderRowCard` | cards, paginated | PASS |
| `/providers/{slug}` | name | title | RTL bold | PASS |
| | description (bio) | "نبذة عنا" | RTL multiline | PASS — section hidden if null |
| | rating_average / reviews_count | `StarRating` | stars + count | PASS — hidden if 0 reviews |
| | whatsapp_url | WhatsApp btn | wa.me action | PASS (server-built) |
| | phone | Call btn | `tel:` | FIXED (safe-open) |
| | website / social_links.* | social icons | icon buttons | **FIXED** — were opened raw |
| | logo_url / cover_url | images | with fallback | PASS |
| | portfolio_items[].images[] | gallery | lightbox | **FIXED** (was no-op) |
| | credentials[] | cards | title/issuer/date | PASS — null fields guarded |
| | years_experience | meta chip | "خبرة N سنوات" | PASS — guarded vs null/undefined |
| `/providers/{slug}/reviews` | user_name / comment / rating / created_at | `ReviewCard` | RTL card | PASS — comment hidden if empty |
| `/contact` | whatsapp/phone/email/facebook/address | `ContactRow` | action rows | FIXED (safe-open); empty → "لا توجد معلومات" |
| `/cities` | name | city sheet | list | REVIEW |
| `/auth/me` | user | settings | profile | REVIEW |

## Null / empty handling — PASS (pattern verified)
Every optional field uses `field ? (<JSX>) : null` or `?? fallback`. No place renders a bare `null`/`undefined`. Examples: provider description, category, city, rating block, credential issuer/date, review comment all conditionally rendered. Numbers use `toFixed(1)`. No raw HTML/JSON/SVG/URL text is rendered to the user anywhere inspected.

## Raw-URL exposure check — PASS
Grep for visible URL text in UI found none except `contact.tsx` `value` (intentionally shows the channel value like a phone number/handle as a subtitle — acceptable; the action is iconified). Social URLs in the provider profile are **icons only**, never text.
