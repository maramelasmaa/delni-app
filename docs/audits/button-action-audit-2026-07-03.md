# Button / Tappable Action Audit - 2026-07-03

Scope: `app/`, `components/`, and `src/` React Native/Expo tappable surfaces.

## Commands run

- `rg -n "<Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button\\b|onPress=|router\\.(push|replace|back|navigate|setParams)|Link\\b|href=" app components src`
- `rg -n -F "onPress={() => {}}" app components src`
- `rg -n -F "onPress={undefined}" app components src`
- `rg -n -F "onPress={null}" app components src`
- `rg -n -F "openExternalUrl call would go here" app components src`
- `rg -n -F "Not implemented" app components src`
- `rg -n -F "TODO" app components src`
- `rg -n -F "FIXME" app components src`
- `npm.cmd run typecheck`
- `npx.cmd expo config --json`
- `npx.cmd expo-doctor`

## Result

- Empty `onPress={() => {}}`: none found.
- `onPress={undefined}`: none found in app usage. The reusable auth button intentionally sets `onPress` to undefined only while disabled/loading.
- `onPress={null}`: none found.
- `TODO` / `FIXME` / `Not implemented`: none found.
- Expo Doctor: passed, `18/18 checks passed`.
- TypeScript: passed.
- Expo config: resolved successfully for SDK 54.

## Fixed during this audit

### ProviderCard WhatsApp / phone buttons

The main provider screen already opened WhatsApp and phone links correctly, but the shared `components/provider/ProviderCard.tsx` path uses `src/hooks/useProviderDetail.ts`, where `handleWhatsApp` and `handlePhone` still contained placeholder comments. If that component is rendered, those buttons would tap with no visible action.

Fix: `src/hooks/useProviderDetail.ts` now calls the existing safe external-link helper:

- WhatsApp: `openExternalUrl(provider.whatsapp_url, ...)`
- Phone: `openExternalUrl(\`tel:${provider.phone}\`, ...)`

## Button groups reviewed

- Auth: login, guest continue, forgot password, register, reset password, privacy/terms links, back header.
- Settings: account, login, about, contact, privacy, terms, disclaimer, theme selector, logout.
- Account: edit/save name/email, change password expand/save, delete account confirm.
- Home: categories, city sheet, provider cards, favorite buttons, banners.
- Categories/category/subcategory: category rows, subcategory filters, filter modal controls, clear/apply/reset, pagination, back.
- Search: keyword clear, suggestions, filters, city/type/sort controls, apply/reset, provider cards/favorites.
- Top rated/favorites: category chips, load more, retry/login/empty-state actions, provider rows/favorites.
- Provider detail: back, favorite, WhatsApp, phone, social links, portfolio lightbox, write review, report review, modal close/cancel/submit, review star picker, load more.
- Contact: WhatsApp, phone, email, Facebook, map/address buttons.
- Shared UI: empty state action, error retry, password visibility toggle, RTL alert buttons, favorite auth modal.

## Remaining limitation

This is an exhaustive code/action audit plus compile/config validation. It is not a substitute for tapping through the release binary on a physical iPhone and Android device, because native link handlers such as `tel:`, WhatsApp, mail, and map apps depend on installed apps and OS prompts.
