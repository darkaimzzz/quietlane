# Quietlane release handoff

## Prepared
- App name Quietlane; version 1.0.0; package/bundle identifier com.quietlane.mobile.
- No Quietlane account, registration, subscription, credential database or analytics service.
- New original opaque app icon, adaptive icons and splash screen; store listing copy and support email.
- Native camera/microphone capture disabled. Existing-file uploads depend on platform/system support.
- Public privacy/support HTML in public/; bundled policy in the app.
- Preview APK and production AAB/iOS build profiles. Remote version incrementing configured.
- Android native generation and permission inspection; iOS config introspection.
- Source archive and local QA report. Preview screenshots are web-renderer captures, not signed native store screenshots.

## Next external steps (not run)
These alter the developer account or consume cloud resources. These external native-release steps have not been run.

1. Confirm the desired Expo owner and create/link Quietlane:
   `cd mobile`
   `npx eas-cli@latest init`
2. Build an Android preview APK: `npx eas-cli@latest build -p android --profile preview`.
3. Configure Apple/Google signing in the correct developer accounts. Never commit credentials. Build production binaries:
   `npx eas-cli@latest build --platform all --profile production`.
4. Install preview/TestFlight builds on real iPhone and Android devices. Test every supported public site signed out, login pages, app background/resume, keyboard/large text, media denial and browser recovery. Private social sign-in is optional and should be performed by the account owner.
5. Publish public/privacy-policy.html and public/support.html on stable HTTPS URLs. Use those exact verified URLs in both store consoles. EAS Hosting or another static host can serve them; no app login backend is needed.
6. Create store records, upload native screenshots at current required dimensions, fill content rating/privacy data disclosures and reviewer notes from store-listing.json. The pages loaded inside the browser have their own data practices; don't infer a store privacy declaration solely from the absence of an app backend.
7. Submit verified builds to internal/TestFlight tracks before public review. An uploaded build does not prove store approval or availability.

## Credentials and publishing
Configure your own Expo and store credentials when preparing signed builds. No EAS project ID, signing credentials, public policy URL, App Store Connect app ID or Play Console app record has been invented. Cloud builds/hosting may use plan resources. Native build and store readiness remain unverified until those steps actually succeed.

## Required review checks
`npm run verify`
`npx expo-doctor`
`npm audit`
`npx expo export --platform all`

Test runner warning: react-test-renderer is deprecated upstream; these tests use it only for mocked native callback/lifecycle regressions. They do not replace device tests.
