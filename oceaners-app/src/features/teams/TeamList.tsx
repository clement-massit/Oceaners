import { StyleSheet, Text, View } from "react-native";

import { COLORS as C } from "@/constants/theme";

import { TeamCard } from "./TeamCard";
import type { Team } from "./types";

type TeamListProps = {
  title: string;
  teams: Team[];
  onTeamPress?: (team: Team) => void;
};

export function TeamList({ title, teams, onTeamPress }: TeamListProps) {
  if (teams.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{title}</Text>

      <View style={styles.list}>
        {teams.map((team) => (
          <TeamCard
            key={team.id_section}
            team={team}
            onPress={onTeamPress ? () => onTeamPress(team) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  eyebrow: {
    color: C.purple,
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 2.5,
  },
});
