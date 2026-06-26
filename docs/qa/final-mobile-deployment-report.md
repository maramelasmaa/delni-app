# Final Mobile Deployment Report

**Audit date:** June 26, 2026
**Target finish date:** July 3, 2026
**Target deploy date:** July 5, 2026
**App:** `delni-app`
**Stack:** Expo SDK 54, React Native 0.81, Expo Router

## Overall verdict

**NOT READY**

## Release blockers

1. **Store submission config is incomplete, so release submission cannot succeed yet.**
   - `eas.json:27` points Android submission at `./google-service-account.json`, but that file is missing in this repo (`Test-Path .\google-service-account.json` -> `False`).
   - `eas.json:31-33` still contains placeholder iOS submit values:
     - `your-apple-id@example.com`
     - `YOUR_APP_STORE_CONNECT_APP_ID`
     - `YOUR_APPLE_TEAM_ID`
   - Impact: the team cannot perform a real Android/iOS production submission from the current repo state.

2. **A release build has not been verified, and this audit cannot mark the app ready without that proof.**
   - The deployment brief requires a passing release build before calling the app ready.
   - I verified config with `expo config --json`, but I did not verify an Android release build or an iOS release build in this environment.
   - Impact: there is no evidence yet that the production app boots, links, authenticates, and renders correctly in a release binary.

## High-risk findings

1. **RTL config is internally contradictory and still needs device confirmation on real hardware.**
   - `app.json:18-20` declares RTL support.
   - `app/_layout.tsx:48-56` explicitly disables RTL at runtime with `I18nManager.allowRTL(false)` and `I18nManager.forceRTL(false)`.
   - The comments explain why this was done, so this may be intentional rather than a bug, but for an Arabic-first app it is still a release risk until it is verified on small and large iOS/Android devices.

2. **The API base URL fallback risk has been reduced, but env wiring still needs to stay correct.**
   - Fixed in `src/constants/api.ts:1-7`.
   - Production now falls back to `https://delni.ly/api/v1`, while development still uses the local emulator URL.
   - Impact: a misconfigured release build is now far less likely to point at a local backend by accident.

3. **There is still debug logging in the data layer and category screen.**
   - `src/lib/api.ts:26-28`
   - `app/category/[slug].tsx:142-153`
   - These logs are `__DEV__` guarded, so they are lower risk than unconditional logs, but they should still be reviewed before final release.

## Command results

- `cmd /c npx expo config --json` -> passed. Confirmed:
  - `sdkVersion: 54.0.0`
  - `scheme: delni`
  - `ios.bundleIdentifier: com.delni.app`
  - `android.package: com.delni.app`
  - production API env present in `eas.json`
- `cmd /c .\node_modules\.bin\tsc.cmd --noEmit` -> passed with exit code `0`
- `cmd /c npm run typecheck` -> passed with exit code `0`
- `cmd /c npx.cmd expo-doctor` -> passed with `18/18 checks passed. No issues detected!`
- `cmd /c .\node_modules\.bin\expo.cmd doctor` -> failed by design with:
  - `expo doctor is not supported in the local CLI, please use npx expo-doctor instead`
- `package.json:49-56` now includes:
  - `typecheck`
  - `doctor`
  - still no `lint`
  - still no `test`

## What looks good from this repo pass

- Auth token storage uses `expo-secure-store` in `src/store/auth.ts`
- Production EAS profile points at `https://delni.ly/api/v1` in `eas.json:17-21`
- Production runtime fallback now also points to `https://delni.ly/api/v1` in `src/constants/api.ts:1-7`
- App identifiers are present:
  - `app.json:13` -> iOS bundle identifier
  - `app.json:27` -> Android package
- Auth flows, redirects, and protected routes are wired through Expo Router and React Query:
  - `src/hooks/useAuth.ts`
  - `src/components/auth/AuthBootstrap.tsx`
- Validation commands are now scriptable through `package.json:49-56`

## Remaining risks before July 3, 2026

- Real device RTL pass on iPhone and Android
- Real release build verification
- Deep-link/password-reset confirmation in a production-like email flow
- App-store submission credential setup
- Missing automated test coverage for deployment-critical flows

## Recommended next step

Fix the submission blockers first, then run a release-mode validation pass:

1. Add the real Android service account file or update the Android submit path.
2. Replace the placeholder iOS submit values in `eas.json`.
3. Produce a production Android build and an iOS release build.
4. Verify login, register, forgot password, reset password, favorites, provider contact actions, and city selection on physical devices.
5. Re-run `expo-doctor` to completion and capture the output.
