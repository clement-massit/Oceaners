import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { COLORS as C } from "@/constants/theme";
import { fetchTeamRoster } from "./api";
import type { Team, TeamPlayer, ManagementModalState } from "./types";
import { TeamRoster } from "./TeamRoster";
import { TeamManagementModal } from "./TeamManagementModal";
import { AddTeamMemberForm } from "./AddTeamMemberForm";
import { ManageTeamMemberForm } from "./ManageTeamMemberForm";

type TeamDashboardProps = {
  team: Team;
  currentUserId: string;
  canManage?: boolean;
};

export function TeamDashboard({
  team,
  currentUserId,
  canManage = false,
}: TeamDashboardProps) {
  const [managementModal, setManagementModal] =
    useState<ManagementModalState>(null);

  const [isManagementBusy, setIsManagementBusy] = useState(false);

  const {
    data: players,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["team-roster", team.id_section, currentUserId],
    queryFn: () => fetchTeamRoster(team.id_section),
    retry: 1,
  });

  const handleAddMember = () => {
    if (!canManage) return;
    setManagementModal({ mode: "add" });
  };
  const handleManageMember = (member: TeamPlayer) => {
    const name =
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      "Ce membre";

    if (!canManage) return;

    setManagementModal({
      mode: "manage",
      member,
    });
  };

  const handleCloseModal = () => {
    if (isManagementBusy) return;
    setManagementModal(null);
  };

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.header} />
        <Text style={styles.secondaryText}>Chargement de l’équipe…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Impossible de charger les membres de l’équipe.
        </Text>
        <Text style={styles.secondaryText}>{error.message}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={() => {
            void refetch();
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>
            {isFetching ? "Chargement…" : "Réessayer"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const playerCount = players.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {canManage ? "ESPACE COACH" : "MON ÉQUIPE"}
        </Text>

        <Text style={styles.title}>{team.name}</Text>

        <Text style={styles.secondary}>
          {[
            team.category,
            team.season != null ? `Saison ${String(team.season)}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>

        <View style={styles.stats}>
          {/* <Text style={styles.stat}>
            {playerCount} joueur{playerCount > 1 ? "s" : ""}
          </Text> */}

          {/* <Text style={styles.stat}>
            {coachCount} coach{coachCount > 1 ? "s" : ""}
          </Text> */}
        </View>
      </View>

      {canManage ? (
        <View style={styles.management}>
          <View style={styles.managementText}>
            <Text style={styles.managementTitle}>Gestion de la section</Text>
            <Text style={styles.secondary}>
              Gère les rattachements des membres à cette équipe.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleAddMember}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>+ Ajouter un membre</Text>
          </Pressable>
        </View>
      ) : null}

      <TeamRoster
        players={players}
        currentUserId={currentUserId}
        onManagePlayer={canManage ? handleManageMember : undefined}
      />

      {canManage && managementModal ? (
        <TeamManagementModal
          title={
            managementModal.mode === "add"
              ? "Ajouter un membre"
              : "Gérer le membre"
          }
          subtitle={team.name}
          onClose={handleCloseModal}
        >
          {managementModal.mode === "add" ? (
            <AddTeamMemberForm
              key={team.id_section}
              sectionId={team.id_section}
              currentUserId={currentUserId}
              onSuccess={handleCloseModal}
            />
          ) : (
            <>
              <ManageTeamMemberForm
                key={managementModal.member.id_section_member}
                sectionId={team.id_section}
                sectionName={team.name}
                currentUserId={currentUserId}
                member={managementModal.member}
                onBusyChange={setIsManagementBusy}
                onRemoved={() => {
                  setIsManagementBusy(false);
                  setManagementModal(null);
                }}
              />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={handleCloseModal}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Fermer</Text>
          </Pressable>
        </TeamManagementModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: C.purple,
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 2.5,
  },
  title: {
    color: C.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  secondary: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  stat: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  management: {
    padding: 16,
    gap: 14,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  managementText: {
    gap: 4,
  },
  managementTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  actionButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
  },
  feedback: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  error: {
    color: C.error,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.65,
  },
  teamName: {
    flex: 1,
    color: C.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  category: {
    color: C.purple,
    fontSize: 12,
    fontWeight: "700",
  },
  season: {
    color: C.muted,
    fontSize: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  roster: {
    gap: 10,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DDF8FC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#08788B",
    fontSize: 15,
    fontWeight: "800",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  playerRole: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  center: {
    padding: 24,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    gap: 10,
  },
  secondaryText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  modalSectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  memberSummary: {
    padding: 16,
    gap: 6,
    borderRadius: 14,
    backgroundColor: C.background,
  },
  formPlaceholder: {
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: C.background,
  },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "600",
  },
});
