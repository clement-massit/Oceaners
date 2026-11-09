import { StyleSheet, Text, View, Pressable } from "react-native";

import { COLORS as C } from "@/constants/theme";

import type { TeamPlayer } from "./types";

type TeamRosterProps = {
  players: TeamPlayer[];
  currentUserId: string;
  onManagePlayer?: (player: TeamPlayer) => void;
};

const ROLE_LABELS: Record<string, string> = {
  player: "Joueur",
  coach: "Coach",
  captain: "Capitaine",
};

function getRoleLabel(role: string | null) {
  if (!role) return "Membre";

  return ROLE_LABELS[role.toLowerCase()] ?? role;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const initials = `${firstName?.charAt(0) ?? ""}${
    lastName?.charAt(0) ?? ""
  }`.toUpperCase();

  return initials || "?";
}

export function TeamRoster({
  players,
  currentUserId,
  onManagePlayer,
}: TeamRosterProps) {
  return (
    <View style={styles.roster}>
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>TEAM ROSTER</Text>
        <Text style={styles.rosterCount}>
          {players.length} JOUEUR{players.length > 1 ? "S" : ""}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.numberColumn]}>#</Text>
        <Text style={[styles.headerCell, styles.playerColumn]}>JOUEUR</Text>
        <Text style={[styles.headerCell, styles.roleColumn]}>POSTE</Text>
      </View>

      {players.map((player, index) => {
        const isCurrentUser = player.id_profile === currentUserId;

        return (
          <View
            key={player.id_profile}
            style={[
              styles.row,
              index % 2 === 1 && styles.rowAlt,
              isCurrentUser && styles.currentUserRow,
            ]}
          >
            <Text style={[styles.number, styles.numberColumn]}>
              {String(index + 1).padStart(2, "0")}
            </Text>

            <View style={styles.playerColumn}>
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(player.first_name, player.last_name)}
                  </Text>
                </View>

                <View>
                  <Text style={styles.playerName}>
                    {player.first_name} {player.last_name}
                  </Text>

                  {isCurrentUser ? (
                    <Text style={styles.currentUserBadge}>TOI</Text>
                  ) : null}

                  {onManagePlayer ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Gérer ${player.first_name} ${player.last_name}`}
                      onPress={() => onManagePlayer(player)}
                      style={({ pressed }) => [
                        styles.manageButton,
                        pressed && styles.managePressed,
                      ]}
                    >
                      <Text style={styles.manageText}>Gérer le membre</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>

            {/* <Text style={[styles.role, styles.roleColumn]}>
              {getRoleLabel(player.team_role)}
            </Text> */}
          </View>
        );
      })}

      {players.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>ROSTER EN CONSTRUCTION</Text>
          <Text style={styles.emptyText}>
            Aucun joueur n’est encore rattaché à cette équipe.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  roster: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0B1D2A",
    borderWidth: 1,
    borderColor: "#1E3A4C",
  },
  rosterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#082433",
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A4C",
  },
  rosterTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  rosterCount: {
    color: "#5CC8E8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0E2735",
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A4C",
  },
  headerCell: {
    color: "#7FA6B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  numberColumn: {
    width: 38,
  },
  playerColumn: {
    flex: 1,
  },
  roleColumn: {
    width: 82,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#16303F",
  },
  rowAlt: {
    backgroundColor: "#0E2735",
  },
  currentUserRow: {
    backgroundColor: "#123243",
    borderLeftWidth: 3,
    borderLeftColor: C.lime,
  },
  number: {
    color: "#5CC8E8",
    fontSize: 15,
    fontWeight: "900",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#123B4D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#5CC8E8",
    fontSize: 12,
    fontWeight: "900",
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  currentUserBadge: {
    marginTop: 2,
    color: C.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  role: {
    color: "#AFC4D1",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  emptyText: {
    color: "#7FA6B8",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  manageButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  manageText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: "700",
  },
  managePressed: {
    opacity: 0.65,
  },
});
