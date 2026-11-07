# Contributing to Quietlane

## Set up
Fork and clone the repository, then run `npm ci` inside `mobile/`. Use Node 26 to match CI. Start with `npx expo start --go`; web previews use `npm run web`.

Read `mobile/AGENTS.md` for project conventions. Use SDK 58 documentation and `npx expo install` for compatible dependencies.

## Before a pull request
- Keep the change focused and explain its user-visible effect.
- For a bug, include a reproduction and a regression test when practical.
- Run `npm run verify`, `npx expo-doctor`, and relevant exports.
- State whether native devices were tested. Mocked WebView tests do not establish live platform compatibility.
- Do not commit credentials, cookies, private messages, generated native folders, or device-specific files.

For filtering changes, test public/signed-out pages first. Never include private account content in issues or screenshots. Platform DOM rules are best effort and must be maintained.

By contributing, you agree that your contribution can be distributed under the repository's MIT license.
