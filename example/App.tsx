import * as GameServices from '@mangolabs/expo-game-services';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

// Replace with ids created in App Store Connect and the Play Console.
const LEADERBOARD = { ios: 'com.example.leaderboard', android: 'CgkIxxxxxxxxEAIQAQ' };
const ACHIEVEMENT = { ios: 'com.example.first_win', android: 'CgkIxxxxxxxxEAIQAg' };

export default function App() {
  const [auth, setAuth] = useState<GameServices.AuthState | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((lines) => [line, ...lines].slice(0, 20));
  const run = (label: string, action: () => Promise<unknown>) => async () => {
    try {
      const result = await action();
      append(`${label}: ${result === undefined ? 'ok' : JSON.stringify(result)}`);
    } catch (error) {
      append(`${label} failed: ${String(error)}`);
    }
  };

  useEffect(() => {
    const subscription = GameServices.addAuthStateListener(setAuth);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>expo-game-services</Text>
        <Text>Available: {String(GameServices.isAvailable())}</Text>
        <Text>Signed in: {String(auth?.isAuthenticated ?? false)}</Text>
        <Text>Player: {auth?.player?.displayName ?? '-'}</Text>
        <Group name="Sign in">
          <Button title="Sign in" onPress={run('signIn', GameServices.signIn)} />
          <Button title="Is authenticated" onPress={run('isAuthenticated', GameServices.isAuthenticated)} />
          <Button title="Get player" onPress={run('getPlayer', GameServices.getPlayer)} />
        </Group>
        <Group name="Leaderboards">
          <Button
            title="Submit score 1234"
            onPress={run('submitScore', () => GameServices.submitScore(LEADERBOARD, 1234))}
          />
          <Button
            title="Show leaderboard"
            onPress={run('showLeaderboard', () => GameServices.showLeaderboard(LEADERBOARD))}
          />
          <Button title="Show all leaderboards" onPress={run('showLeaderboard', () => GameServices.showLeaderboard())} />
        </Group>
        <Group name="Achievements">
          <Button
            title="Unlock achievement"
            onPress={run('unlockAchievement', () => GameServices.unlockAchievement(ACHIEVEMENT))}
          />
          <Button
            title="Progress 1 / 3"
            onPress={run('setAchievementProgress', () => GameServices.setAchievementProgress(ACHIEVEMENT, 1, 3))}
          />
          <Button title="Show achievements" onPress={run('showAchievements', GameServices.showAchievements)} />
        </Group>
        <Group name="Log">
          {log.map((line, index) => (
            <Text key={index} style={styles.log}>
              {line}
            </Text>
          ))}
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee' },
  content: { padding: 20, gap: 12 },
  header: { fontSize: 30 },
  groupHeader: { fontSize: 20, marginBottom: 12 },
  group: { backgroundColor: '#fff', borderRadius: 10, padding: 20, gap: 8 },
  log: { fontFamily: 'Menlo', fontSize: 12 },
});
