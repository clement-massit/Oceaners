import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS as C } from "@/constants/theme";

import type { Team } from "./types";

type TeamCardProps = {
  team: Team;
  onPress?: () => void;
};

export function TeamCard({ team, onPress }: TeamCardProps) {
  const season = team.season == null ? null : `Saison ${String(team.season)}`;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`Ouvrir la section ${team.name}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{team.name}</Text>

        {team.category ? (
          <Text style={styles.category}>{team.category}</Text>
        ) : null}
      </View>

      {season ? <Text style={styles.season}>{season}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  category: {
    color: C.purple,
    fontSize: 11,
    fontWeight: "700",
  },
  season: {
    color: C.muted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
