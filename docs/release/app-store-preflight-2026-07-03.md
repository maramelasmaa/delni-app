# App Store Preflight Audit - 2026-07-03

Target: first Apple Developer account submission for `delni-app`.

## Sources checked

- Apple App Review Guidelines, last updated June 8, 2026: https://developer.apple.com/app-store/review/guidelines/
- Expo SDK 54 docs: https://docs.expo.dev/versions/v54.0.0/
- Expo SDK 54 app config reference: https://docs.expo.dev/versions/v54.0.0/config/app/

## Proof collected

- `npm.cmd run typecheck` passed.
- `npx.cmd expo config --json` passed and resolved:
  - `sdkVersion: 54.0.0`
  - `ios.bundleIdentifier: com.delniapp.mobile`
  - `android.package: com.delniapp.mobile`
  - `ios.infoPlist.ExpoLocalization_supportsRTL: true`
  - location permission text present in Arabic.
- `npx.cmd expo-doctor` passed: `18/18 checks passed. No issues detected!`
- Production API probe passed:
  - `curl.exe -I --max-time 20 https://delni.ly/api/v1/home`
  - Result: `HTTP/1.1 200 OK`
  - JSON response includes live home data, categories, providers, and stats.

## App Store rejection risks found

### Blocker: EAS iOS submit config still has a placeholder

Evidence: `eas.json` still contains:

```json
"ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
```

Impact: this is not an App Review guideline rejection by itself, but it can block automated submission through EAS.

Fix before submit: replace it with the real numeric App Store Connect app ID for the created app record.

### High risk: UGC has report flow but no visible block-user flow

Apple Guideline 1.2 requires apps with user-generated content to include filtering, reporting, blocking abusive users, and published contact info.

Evidence found:

- Review reporting exists in `app/provider/[slug].tsx`.
- Review flag API exists through `/reviews/{id}/flag`.
- Contact/support screen exists at `/contact`.
- No mobile block-user flow was found by searching `block`.

Recommended fix: add a visible "block user/reviewer" action for review authors, or disable public user-to-user review content until the block flow exists. If backend moderation filters objectionable reviews before display, mention that in App Review notes, but Apple still explicitly asks for a user block mechanism.

## Passes / low-risk areas

- Privacy policy is accessible in-app from Settings and describes collected data, retention/deletion, location use, and account deletion.
- Terms are accessible in-app from Settings.
- Account deletion exists in `app/account.tsx`.
- Production API is HTTPS and reachable.
- App config declares no tracking in iOS privacy manifests.
- No tracking/ads SDKs were found in `package.json`.
- No Stripe, StoreKit, IAP, or subscription SDK was found in the mobile app.
- Location is the only sensitive device permission found, and the iOS purpose string is specific.
- API fallback points to production in release builds.

## Submission notes to include

- Provide a real reviewer demo account if Apple needs to test favorites, reviews, report review, account edit, and account deletion.
- Tell App Review that the app can be browsed as a guest, but authenticated actions require the demo account.
- Mention that location is optional and only used to suggest the nearest city.
- Mention that provider contact/payment happens outside the iOS app and the iOS app does not sell digital goods or subscriptions.
- Ensure App Store Connect privacy labels match the app privacy manifest: name, email, user content/reviews, and location.
