import { Pressable, StyleSheet, Text, View } from "react-native";

import { PROFILE_COLORS as C } from "./theme";

type CoachProfileContentProps = {
  playerCount: number | null;
  upcomingTrainingCount: number | null;
  onViewPlayers?: () => void;
  onManageTrainings?: () => void;
};

export function CoachProfileContent({
  playerCount,
  upcomingTrainingCount,
  onViewPlayers,
  onManageTrainings,
}: CoachProfileContentProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mon espace coach</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{playerCount ?? "—"}</Text>
          <Text style={styles.caption}>Joueurs</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.value}>{upcomingTrainingCount ?? "—"}</Text>
          <Text style={styles.caption}>Séances à venir</Text>
        </View>
      </View>

      {onViewPlayers ? (
        <Pressable
          accessibilityRole="button"
          onPress={onViewPlayers}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Voir les joueurs</Text>
        </Pressable>
      ) : null}

      {onManageTrainings ? (
        <Pressable
          accessibilityRole="button"
          onPress={onManageTrainings}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Gérer les entraînements</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  title: {
    color: C.purple,
    fontSize: 14,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  value: {
    color: C.purple,
    fontSize: 26,
    fontWeight: "700",
  },
  caption: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
  },
  button: {
    minHeight: 44,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F5F0FC",
    justifyContent: "center",
  },
  buttonText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.6,
  },
});
