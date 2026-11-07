# Quietlane full app audit — 8 November 2026

What this repo does: Quietlane stores preferences and measured usage on one device, then filters selected social websites inside a native browser. Focus and sleep features are local. Load assumed: one person on one phone; no backend or shared server state.

All application source, routes, config, tests, dependencies and main user flows were reviewed. An independent reviewer checked routing, persistence, browser guards and the final browser delta.

## Must fix — resolved

1. **Short foreground stalls undercounted activity** (`mobile/src/model.ts`, tick/flushUsage).
   What this is: foreground browsing time drives daily budgets.
   Problem: a 20-second JavaScript stall recorded at most five seconds.
   Fix: use actual elapsed foreground time and a monotonic clock, reset at background/resume, and keep brief-visit flushes.
   If skipped: users can exceed their chosen budgets while totals remain too small.
   Evidence: model lifecycle regression simulates a delayed tick, background time and resume.

2. **Several switches did nothing** (`mobile/src/social-screens.tsx`, Controls; `mobile/src/engine.ts`, availableRules).
   Problem: Recommendations appeared outside YouTube, and some feed/Explore options had no implementation.
   Fix: one supported-rule map limits controls and Home's enabled-filter count to implemented combinations.
   If skipped: the UI claims a protection that does not happen.

3. **Ordinary Facebook posts matched an ad selector** (`mobile/src/engine.ts`, injection).
   Problem: the generic data-ad-preview=message selector can identify regular post message containers too.
   Fix: remove it. Facebook's unverified ad toggle is not offered.
   If skipped: normal content may disappear.
   Evidence: a regression rejects the broad selector.

4. **Encoded feed routes bypassed guards** (`mobile/src/engine.ts`, blockedRoute).
   Problem: /%73horts/ and /%72eels/ did not match known routes.
   Fix: decode and normalize route paths before matching; malformed encodings fail closed.
   If skipped: a link bypasses the selected feed restriction.
   Evidence: encoded-path and exact-video tests.

5. **Explore controls disagreed between platforms** (`mobile/src/engine.ts`, blockedRoute).
   Problem: Snapchat Discover was tied to Shorts, while TikTok Explore lacked a route guard.
   Fix: separate discovery from short-form settings and guard implemented discovery routes.
   If skipped: toggles can hide navigation while leaving the destination open.
   Evidence: independent Snapchat/TikTok toggle tests.

6. **Reinjected scripts kept old click handlers** (`mobile/src/engine.ts`, injection).
   Problem: a new configuration could coexist with an old listener that still blocked a disabled rule.
   Fix: remove prior listeners/observer/history wrappers before installing the new script. Do not inject filtering into identity-provider hosts.
   If skipped: navigation and restored pages can obey stale settings.
   Evidence: inject twice, disable Shorts, click a Short link, assert it is no longer prevented.

7. **Web switches did not respond to normal clicks** (`mobile/src/toggle.web.tsx`).
   Problem: the old universal-host wrapper exposed a switch without forwarding a normal click to its hidden web input.
   Fix: use React Native's standard web switch; keep Expo native switches on phones with an accessible parent label.
   If skipped: browser settings appear to change but retain the old value.
   Evidence: live browser check reproduced enabled=true after the old click; after the fix, a normal click persisted enabled=false.

8. **Login redirects and temporary blank documents could disturb browser loading** (`mobile/src/browser.tsx`).
   Problem: redirect URLs were fed into controlled source loads; about:blank could replace the requested page or dismiss the loading timeout.
   Fix: separate requested source from observed URL, ignore blank load callbacks, add a timed error/retry and Instagram sign-in recovery.
   If skipped: an empty web document can persist without a useful recovery action.
   Evidence: native-component callback regressions, not a claim of authenticated device validation.

9. **Authentication child frames were treated as external page launches** (`mobile/src/browser.tsx`).
   Problem: an iOS HTTPS challenge iframe on another host was blocked using the main-page platform whitelist.
   Fix: permit credential-free HTTPS child-frame navigation when the native callback explicitly marks it as a child frame; keep the top-level platform whitelist and main-frame-only injection.
   If skipped: an embedded challenge can fail without leaving the platform.
   Evidence: component regression. Android's installed WebView does not supply this frame flag; Android challenge compatibility is still device-unverified.

10. **Release permissions/transport were too broad** (`mobile/app.json`, browser).
    Fix: deny live media capture, block Android camera/microphone/broad media/overlay permissions, disable Android backup and arbitrary insecure iOS transport.
    Evidence: browser capture-denial regression, Android native prebuild, generated manifest directives and iOS config introspection.
    Live capture is deliberately disabled in the release defaults; unnecessary device permissions are excluded.

## Should fix — resolved

11. **Lifecycle and failed-save behavior lacked tests** (`mobile/tests/model.test.ts`).
    Added foreground/background, delayed-tick, failed-write recovery and final-reset persistence checks. Existing serialized writes were correct; no invented reset race was reported.

12. **Sleep schedule could be enabled with no selected days** (`mobile/src/time-screens.tsx`).
    Enabling with no days now shows feedback; removing the last enabled day pauses the schedule. Apply feedback no longer falsely promises a completed disk save before the save succeeds.

13. **Release navigation and branding were incomplete** (Router routes, App, config, assets).
    Replaced state-only navigation with Expo Router per AGENTS.md; one root model/confirmation dialog prevents duplicate offscreen browsers. Added unknown-route/error fallbacks, all static platform routes, original Quietlane icon/splash and new identifiers. Public pages are the fresh-install default. No app account was added.

14. **Dependency audit reported moderate advisories** (`mobile/package.json`).
    Patched affected glob/minimatch ranges through scoped overrides. Used Expo-compatible ESLint 9 because its bundled React plugin fails under ESLint 10.
    Latest npm audit returned zero vulnerabilities. These overrides should be revisited when Expo updates its own dependency ranges.

15. **Public privacy HTML collided with the app route** (`mobile/public/`, store-listing publicPaths).
    Problem: /privacy.html was also generated for the app's /privacy route; loading the public URL could hydrate into a missing-route screen.
    Fix: use the distinct /privacy-policy.html filename, update support/listing links, and export the pages again.
    Evidence: regression for filename collisions; cold production URLs returned HTTP 200 with the complete standalone policy/support copy.


## Release gates — still open

- Native iPhone/Android execution, live platform DOM behavior, authenticated third-party compatibility, device accessibility and long-running background/resume checks. A browser preview or a JavaScript bundle is not a signed native app.
- EAS project linking, cloud resource use, signing credentials, binary builds and any public hosting/uploads. Cloud/native signing and store publishing are separate from this source release.
- Public HTTPS support/privacy URLs must be deployed from the prepared pages; store records, real-device screenshots, privacy/content-rating declarations and review must be completed.
- The product name and identifiers must be accepted by the operator's store accounts; no trademark clearance is claimed.

Verdict: local release candidate with corrected audited bugs and passing local checks. Do not call it publicly released or fully device-certified until the release gates are closed.
Not checked: physical devices, private social accounts, OS termination during the last pending write, native compiled archives or store acceptance.
