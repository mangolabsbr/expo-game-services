import { NativeModule, requireNativeModule } from 'expo';

import type { AuthState, ExpoGameServicesModuleEvents, Player } from './ExpoGameServices.types';

declare class ExpoGameServicesModule extends NativeModule<ExpoGameServicesModuleEvents> {
  isAvailable(): boolean;
  isAuthenticated(): Promise<boolean>;
  signIn(): Promise<AuthState>;
  getPlayer(): Promise<Player | null>;
  submitScore(leaderboardId: string, score: number): Promise<void>;
  showLeaderboard(leaderboardId: string | null): Promise<void>;
  unlockAchievement(achievementId: string): Promise<void>;
  setAchievementProgress(achievementId: string, steps: number, totalSteps: number): Promise<void>;
  showAchievements(): Promise<void>;
}

export default requireNativeModule<ExpoGameServicesModule>('ExpoGameServices');
