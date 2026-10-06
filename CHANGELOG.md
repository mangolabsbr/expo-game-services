# Changelog

## Unreleased

### 🐛 Bug fixes

- iOS: `signIn` no longer hangs when called again after GameKit already reported a failed or dismissed sign-in; it resolves with the last outcome, since GameKit prompts only once per launch.

### 🎉 New features

- Initial release: sign-in, leaderboards and achievements for Game Center (iOS) and Play Games Services v2 (Android), with a config plugin that adds the Game Center entitlement and the Play Games app id.
