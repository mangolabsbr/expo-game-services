import { NativeModule, registerWebModule } from 'expo';

import type { AuthState, ExpoGameServicesModuleEvents, Player } from './ExpoGameServices.types';

// There is no game service on the web: every call is a no-op and the player is never signed in.
class ExpoGameServicesModule extends NativeModule<ExpoGameServicesModuleEvents> {
  isAvailable(): boolean {
    return false;
  }
  async isAuthenticated(): Promise<boolean> {
    return false;
  }
  async signIn(): Promise<AuthState> {
    return {
      isAuthenticated: false,
      player: null,
      error: 'Game services are not available on web',
    };
  }
  async getPlayer(): Promise<Player | null> {
    return null;
  }
  async submitScore(_leaderboardId: string, _score: number): Promise<void> {}
  async showLeaderboard(_leaderboardId: string | null): Promise<void> {}
  async unlockAchievement(_achievementId: string): Promise<void> {}
  async setAchievementProgress(
    _achievementId: string,
    _steps: number,
    _totalSteps: number
  ): Promise<void> {}
  async showAchievements(): Promise<void> {}
}

export default registerWebModule(ExpoGameServicesModule, 'ExpoGameServicesModule');
