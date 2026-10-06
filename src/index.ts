import { Platform } from 'react-native';

import type { AuthState, PlatformId, Player } from './ExpoGameServices.types';
import ExpoGameServicesModule from './ExpoGameServicesModule';

export * from './ExpoGameServices.types';

/** The subscription returned by `addAuthStateListener`; call `remove()` to stop listening. */
export type AuthStateSubscription = ReturnType<typeof ExpoGameServicesModule.addListener>;

/** Picks the id for the current platform, or undefined when there is none. */
export function resolvePlatformId(id: PlatformId): string | undefined {
  if (typeof id === 'string') return id;
  if (Platform.OS === 'ios') return id.ios;
  if (Platform.OS === 'android') return id.android;
  return undefined;
}

function assertInteger(name: string, value: number) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be a safe integer, received ${value}`);
  }
}

/**
 * Whether the native game service can be used on this device: always true on
 * iOS, true on Android when the app was configured with a Play Games project
 * id (`androidAppId` in the config plugin) and false on web.
 */
export function isAvailable(): boolean {
  return ExpoGameServicesModule.isAvailable();
}

/** Whether the local player is signed in. Never shows UI. */
export function isAuthenticated(): Promise<boolean> {
  return ExpoGameServicesModule.isAuthenticated();
}

/**
 * Signs the local player in, presenting the platform sign-in UI when needed.
 * Resolves with the resulting state instead of rejecting when the user
 * declines, so callers can treat sign-in as optional.
 */
export function signIn(): Promise<AuthState> {
  return ExpoGameServicesModule.signIn();
}

/** The signed-in player, or null. */
export function getPlayer(): Promise<Player | null> {
  return ExpoGameServicesModule.getPlayer();
}

/**
 * Submits a score to a leaderboard. Both stores keep the player's best score
 * themselves, so submitting a lower score is harmless. Rejects when the
 * player is signed out or the request fails (for example offline), and
 * resolves without doing anything when the id has no value for this platform.
 */
export async function submitScore(leaderboardId: PlatformId, score: number): Promise<void> {
  assertInteger('score', score);
  const id = resolvePlatformId(leaderboardId);
  if (id === undefined) return;
  await ExpoGameServicesModule.submitScore(id, score);
}

/**
 * Presents the native leaderboard UI, for one leaderboard or, with no id, for
 * all of them. Resolves when the UI is dismissed.
 */
export async function showLeaderboard(leaderboardId?: PlatformId): Promise<void> {
  const id = leaderboardId === undefined ? null : resolvePlatformId(leaderboardId);
  if (id === undefined) return;
  await ExpoGameServicesModule.showLeaderboard(id);
}

/** Marks an achievement as complete. Repeated calls are harmless. */
export async function unlockAchievement(achievementId: PlatformId): Promise<void> {
  const id = resolvePlatformId(achievementId);
  if (id === undefined) return;
  await ExpoGameServicesModule.unlockAchievement(id);
}

/**
 * Sets the absolute progress of an incremental achievement. `steps` is the
 * number of completed steps out of `totalSteps`, which must match the value
 * configured in the store. Reaching `totalSteps` unlocks the achievement.
 * Absolute values make the call idempotent, so apps can keep their own
 * counters and resend them after being offline.
 */
export async function setAchievementProgress(
  achievementId: PlatformId,
  steps: number,
  totalSteps: number
): Promise<void> {
  assertInteger('steps', steps);
  assertInteger('totalSteps', totalSteps);
  if (totalSteps <= 0) throw new RangeError('totalSteps must be greater than zero');
  const id = resolvePlatformId(achievementId);
  if (id === undefined) return;
  await ExpoGameServicesModule.setAchievementProgress(id, Math.min(steps, totalSteps), totalSteps);
}

/** Presents the native achievements UI. Resolves when it is dismissed. */
export function showAchievements(): Promise<void> {
  return ExpoGameServicesModule.showAchievements();
}

/**
 * Listens for sign-in state changes. On iOS this fires whenever Game Center
 * reports a change, including sign-ins made from the system UI. On Android it
 * fires after `signIn` completes.
 */
export function addAuthStateListener(listener: (state: AuthState) => void): AuthStateSubscription {
  return ExpoGameServicesModule.addListener('onAuthStateChange', listener);
}
