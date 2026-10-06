# @mangolabs/expo-game-services

Leaderboards and achievements for Expo apps, backed by Game Center on iOS and
Google Play Games Services v2 on Android, behind one small typed API.

- Sign-in state and player info
- Submit scores and show the native leaderboard UI
- Unlock achievements, set incremental progress and show the native achievements UI
- Ids can differ per store (`{ ios, android }`) and unknown ids are no-ops, so a
  leaderboard or achievement can exist on one store only
- No-op implementation on web

Requires Expo SDK 54 or newer with a development build (not Expo Go) and iOS 16.4+.

## Installation

```sh
npx expo install @mangolabs/expo-game-services
```

Add the config plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [["@mangolabs/expo-game-services", { "androidAppId": "123456789012" }]]
  }
}
```

Then run `npx expo prebuild` and rebuild the development build.

| Option         | Platform | Description                                                                                                                                        |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `androidAppId` | Android  | The numeric Play Games Services project id from the Play Console. When omitted, `isAvailable()` returns `false` on Android and every call rejects. |

The plugin adds the `com.apple.developer.game-center` entitlement on iOS and the
`com.google.android.gms.games.APP_ID` meta-data on Android.

### Store setup

**App Store Connect**

1. Enable the Game Center capability on the app identifier in the developer portal.
2. In App Store Connect, open the app, go to Game Center and create the
   leaderboards and achievements. Their ids are the values used in code.

Leaderboards and achievements work in development builds as soon as they exist.
The iOS simulator can sign in to Game Center with a regular Apple ID.

**Play Console**

1. Open Play Games Services for the app and create a game project linked to the app.
2. Add an OAuth client for the app with the SHA-1 of every signing key you use
   (the debug keystore, and the Play App Signing key for store builds).
3. Create the leaderboards and achievements. Their ids (strings starting with `Cgk`) are the values used in code.
4. Add your Google account under Testers. Until the game project is published, only testers can sign in.

## Usage

```ts
import * as GameServices from '@mangolabs/expo-game-services';

const LEADERBOARDS = {
  easy: { ios: 'com.example.easy', android: 'CgkI...EAIQAQ' },
  hard: { ios: 'com.example.hard', android: 'CgkI...EAIQAg' },
};

const FIRST_WIN = { ios: 'com.example.first_win', android: 'CgkI...EAIQAw' };

// At app start. Shows the platform sign-in UI when the player is not signed in.
const state = await GameServices.signIn();
if (state.isAuthenticated) {
  console.log(`Hello ${state.player?.displayName}`);
}

// When a run ends. Both stores keep the best score, so send every result.
await GameServices.submitScore(LEADERBOARDS.easy, 4200);

// From a button.
await GameServices.showLeaderboard(LEADERBOARDS.easy); // or showLeaderboard() for all

// Achievements.
await GameServices.unlockAchievement(FIRST_WIN);
await GameServices.setAchievementProgress(WORDS_SOLVED_100, solvedCount, 100);
await GameServices.showAchievements();
```

### API

| Function                                        | Description                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `isAvailable(): boolean`                        | `true` on iOS, `true` on Android when `androidAppId` was configured, `false` on web.                                                          |
| `isAuthenticated(): Promise<boolean>`           | Whether the local player is signed in. Never shows UI.                                                                                        |
| `signIn(): Promise<AuthState>`                  | Signs in, showing the platform UI when needed. Resolves with `isAuthenticated: false` and an `error` when the user declines; does not reject. |
| `getPlayer(): Promise<Player \| null>`          | The signed-in player.                                                                                                                         |
| `submitScore(id, score): Promise<void>`         | Submits an integer score. Rejects when signed out or offline.                                                                                 |
| `showLeaderboard(id?): Promise<void>`           | Shows one leaderboard, or all of them without an id. Resolves when dismissed.                                                                 |
| `unlockAchievement(id): Promise<void>`          | Marks an achievement complete. Idempotent.                                                                                                    |
| `setAchievementProgress(id, steps, totalSteps)` | Sets absolute progress of an incremental achievement. `totalSteps` must match the store configuration. Idempotent.                            |
| `showAchievements(): Promise<void>`             | Shows the native achievements UI. Resolves when dismissed.                                                                                    |
| `addAuthStateListener(listener)`                | Subscribes to sign-in changes. Returns a subscription with `remove()`.                                                                        |
| `resolvePlatformId(id)`                         | The id for the current platform, or `undefined`.                                                                                              |

Every id argument is a `PlatformId`: a string used on both platforms, or
`{ ios?: string; android?: string }`.

### Offline play

Neither SDK queues requests made while offline: `submitScore`, `unlockAchievement`
and `setAchievementProgress` reject. Keep the authoritative values in the app
(best score per leaderboard, achievement counters) and resend them after
`signIn()` resolves or whenever `addAuthStateListener` reports a sign-in. Both
stores ignore lower scores and repeated unlocks, so resending is safe.

## Development

```sh
pnpm install
pnpm run prepare       # builds src/ and plugin/
pnpm run typecheck
pnpm run lint
cd example && pnpm install && npx expo run:ios   # or run:android
```

The example app links the module from the parent folder through
`expo.autolinking.nativeModulesDir`, so native changes only need a rebuild.
