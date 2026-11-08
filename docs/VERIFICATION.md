# Quietlane verification — 8 November 2026

Final local release-candidate status:
- `npm run verify`: exit 0. TypeScript passed; lint passed with zero warnings; 36 tests passed, zero failed.
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
- Physical Android execution, authenticated social use, native accessibility, native media/device process termination, signed APK/AAB/IPA compilation, TestFlight/Play upload, public hosting or store review. The limited iPhone rendering check below does not cover these flows.
- No EAS project or store record was created. No account credentials are included in this repository.
- A successful JavaScript export and Android project generation do not establish native archive success or store acceptance.

See release/CHECKLIST.md for the exact remaining steps.




Local-only completion update:
- Source release scope: no EAS project, cloud build, hosted deployment or store upload was created.
- Final suite: **36 tests passed**, TypeScript passed and lint passed with zero warnings.
- Public HTML collision fixed: canonical hosted policy path is /privacy-policy.html; support links to that path. Both exported static pages were checked at HTTP 200 with complete no-account/privacy/support text and no app initialization dependency.
- A release regression now rejects public HTML filenames that shadow Router screens.
- Source ZIP was regenerated after the collision fix; SHA256 is stored beside it.

## iPhone Instagram rendering fix

- Reproduced on a connected iPhone running iOS 27.0 in Expo Go: the page viewport had normal dimensions, but Instagram stayed at 63 elements and one script error.
- Direct development-runtime inspection showed both serialized guard functions contained Hermes [bytecode] bodies. These functions cannot be copied into a WebView with Function.toString().
- Guard JavaScript is now generated from the authoritative TypeScript declarations before shipping and imported as literal source. Tests reject stale generated output and reproduce the observed Hermes stubs.
- The connected iPhone subsequently reported 204 elements and zero script errors. The user confirmed that Instagram and its sign-in form both visibly render.
- Removed temporary diagnostics and reverted all unsuccessful user-agent, paused-filter, and private-session experiments. Normal persistent browsing and filtering remain enabled.
- Final verification: typecheck and zero-warning lint passed; 36 tests passed. iOS/Android Hermes exports and web export were rerun after the filter lifecycle changes.
- This check did not enter account credentials, validate authenticated messaging, exercise uploads, or establish full native/store readiness.

## Instagram filtering verification

- Direct inspection of Quietlane component props found all three supported Instagram rules disabled; Post Mode was not active. Enabled Reels, Explore and Home feed as requested through the existing app settings handler.
- Filter scripts are applied explicitly after document load and when configuration changes. The browser labels filters active only after the page acknowledges the exact current configuration and document revision; disabled filters are labeled accordingly and missing startup acknowledgement offers retry.
- Controls now include explicit On/Off text. Instagram Home feed also has a native/injected root-route guard rather than relying solely on a DOM selector.
- The connected iPhone acknowledged all three current rules and displayed 3 filters active.
- The user tested Instagram and confirmed: all three feeds blocked; messages work.
- Regression coverage includes stale startup acknowledgements, unsupported saved-rule counts, failed-start retry, delayed prior-document and A-to-B-to-A acknowledgements, and the Instagram home/login/profile/messages boundary.
- Independent final code review confirmed the acknowledgement race is addressed and found no further important regression. The token-race correction was tested locally; the physical-phone confirmation above preceded that final status-only correction.
