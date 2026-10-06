/**
 * An identifier that may differ between stores. A plain string is used as-is
 * on both platforms; an object picks the id for the current platform. When
 * the current platform has no id, calls that take it resolve as a no-op so an
 * app can ship a leaderboard or achievement on one store only.
 */
export type PlatformId = string | { ios?: string; android?: string };

export type Player = {
  /** Game Center `gamePlayerID` or Play Games `playerId`. Stable per game. */
  id: string;
  displayName: string;
  /** Game Center alias. Undefined on Android. */
  alias?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  /** Null while signed out. */
  player: Player | null;
  /** Present when sign-in finished with an error, for example when the user cancelled. */
  error?: string;
};

export type ExpoGameServicesModuleEvents = {
  onAuthStateChange: (state: AuthState) => void;
};
