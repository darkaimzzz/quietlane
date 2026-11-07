# Quietlane verification — 8 November 2026

Final local release-candidate status:
- `npm run verify`: exit 0. TypeScript passed; lint passed with zero warnings; 29 tests passed, zero failed.
- `npx expo-doctor`: 20/20 checks passed.
- `npm audit --audit-level=low`: zero vulnerabilities.
- `npx expo export --platform all --output-dir dist`: exit 0. iOS and Android Hermes bundles plus web bundles and 18 static routes were emitted.
- Android native prebuild completed. The app manifest has INTERNET and VIBRATE as positive declarations; camera, microphone, broad storage/media and overlay permissions have removal directives.
- iOS native config introspection: identifiers/version correct; arbitrary insecure network loads disabled; local networking permitted. No compiled/signed iOS archive was produced.
- Release metadata tests validate matching versions/identifiers, title/keyword lengths, restricted permissions and a 1024 × 1024 RGB (non-alpha) icon.
- Native browser callback tests reproduce/fix blank document replacement, redirect re-requesting, stalled load recovery, iOS child-frame allowance, transient blank-load timeout cancellation and default capture denial.
- Generated filter code is executed after production-style minification; shared feed URLs, encoded routes, exact video IDs, reinjection and control boundaries are tested.
- Model tests cover short and delayed foreground accounting, background exclusion, failed-write recovery and reset ordering.

Browser walkthrough (local app pages only, no private accounts):
- Fresh production origin showed onboarding with no credential fields; Get started opened all local tools.
- Instagram enabled switch was reproduced as nonresponsive before the fix, then verified to persist false after a normal click; restored to true afterward.
- Supported-only Instagram controls rendered.
- Focus session started without login and blocked an Instagram launch; early-end confirmation worked.
- Invalid 99:99 sleep time showed validation and left the saved 22:00 start intact; valid input restored.
- Bundled privacy page rendered the supplied support email with no horizontal overflow.
- Home fit 320px width without horizontal overflow.
- Cold exported /platform/instagram route returned HTTP 200 and no error screen.
- Inspected 390 × 844 previews are in release/screenshots. These are web-renderer previews, not native store screenshots.
- A temporary stale Metro module ID occurred during live edits/prebuild. Fresh export and cold production serving passed; it is not counted as an app release pass before recovery.

Independent review found no additional important source/config regression. It confirmed the child-frame flag is available on iOS but not supplied by Android's installed WebView; Android authentication/challenge behavior remains unverified.

Test tooling emits upstream react-test-renderer deprecation warnings. ESLint 9 is retained because Expo's current React plugin fails on ESLint 10. Scoped glob/minimatch overrides bring the dependency audit to zero.

Live capture is disabled and unnecessary Android permissions are excluded.

Not performed:
- Physical iPhone/Android execution, authenticated social use, native accessibility, native media/device process termination, signed APK/AAB/IPA compilation, TestFlight/Play upload, public hosting or store review.
- No EAS project or store record was created. No account credentials are included in this repository.
- A successful JavaScript export and Android project generation do not establish native archive success or store acceptance.

See release/CHECKLIST.md for the exact remaining steps.




Local-only completion update:
- Source release scope: no EAS project, cloud build, hosted deployment or store upload was created.
- Final suite: **29 tests passed**, TypeScript passed and lint passed with zero warnings.
- Public HTML collision fixed: canonical hosted policy path is /privacy-policy.html; support links to that path. Both exported static pages were checked at HTTP 200 with complete no-account/privacy/support text and no app initialization dependency.
- A release regression now rejects public HTML filenames that shadow Router screens.
- Source ZIP was regenerated after the collision fix; SHA256 is stored beside it.
