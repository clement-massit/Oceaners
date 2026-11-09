import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { COLORS as C } from "@/constants/theme";
import { removePlayerFromSection } from "./api";
import type { TeamPlayer } from "./types";

type ManageTeamMemberFormProps = {
  sectionId: string;
  sectionName: string;
  currentUserId: string;
  member: TeamPlayer;
  onRemoved: () => void;
  onBusyChange?: (busy: boolean) => void;
};

const ROLE_LABELS: Record<string, string> = {
  player: "Joueur",
  coach: "Coach",
};

export function ManageTeamMemberForm({
  sectionId,
  sectionName,
  currentUserId,
  member,
  onRemoved,
  onBusyChange,
}: ManageTeamMemberFormProps) {
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  const queryClient = useQueryClient();

  const removalMutation = useMutation({
    mutationFn: () =>
      removePlayerFromSection({
        sectionId,
        sectionMemberId: member.id_section_member,
      }),
    retry: false,
  });

  const fullName =
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    "Nom non renseigné";

  const initials =
    `${member.first_name?.charAt(0) ?? ""}${
      member.last_name?.charAt(0) ?? ""
    }`.toUpperCase() || "?";

  const roleLabel = ROLE_LABELS[member.id_section_member ?? ""] ?? "Membre";

  const canRemove = member.id_profile !== currentUserId;

  const handleRemove = async () => {
    if (!canRemove || removalMutation.isPending) return;

    onBusyChange?.(true);

    try {
      await removalMutation.mutateAsync();
    } catch {
      onBusyChange?.(false);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["team-roster"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["section-member-candidates"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["user-teams"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["profile-details"],
      }),
    ]);

    onBusyChange?.(false);
    onRemoved();
  };

  return (
    <View style={styles.container}>
      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.secondary}>
            {roleLabel} · {sectionName}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques du joueur</Text>

        <Text style={styles.secondary}>
          Les statistiques de cette section ne sont pas encore reliées à des
          données de présence ou de match.
        </Text>

        <View style={styles.stats}>
          <StatCard label="Présence" />
          <StatCard label="Matchs joués" />
          <StatCard label="Touchdowns" />
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Rattachement à la section</Text>

        {!canRemove ? (
          <Text style={styles.secondary}>
            Le retrait de ce membre n’est pas autorisé depuis cet écran. Tu peux
            consulter ses informations.
          </Text>
        ) : isConfirmingRemoval ? (
          <>
            <Text style={styles.confirmationText}>
              Retirer {fullName} de « {sectionName} » ?
            </Text>

            <Text style={styles.secondary}>
              Son compte et son adhésion au club seront conservés. Il ne sera
              plus rattaché à cette section.
            </Text>

            {removalMutation.isError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {removalMutation.error.message ||
                  "Le retrait a échoué. Réessaie."}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={removalMutation.isPending}
                onPress={() => {
                  removalMutation.reset();
                  setIsConfirmingRemoval(false);
                }}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={removalMutation.isPending}
                onPress={() => {
                  void handleRemove();
                }}
                style={({ pressed }) => [
                  styles.button,
                  styles.removeButton,
                  (pressed || removalMutation.isPending) && styles.pressed,
                ]}
              >
                {removalMutation.isPending ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={styles.removeText}>Confirmer le retrait</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.secondary}>
              Retirer ce joueur uniquement de cette section.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsConfirmingRemoval(true)}
              style={({ pressed }) => [
                styles.button,
                styles.removeOutline,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.error}>Retirer de la section</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function StatCard({ label }: { label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>—</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statStatus}>Non disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.background,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DDF8FC",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#08788B",
    fontSize: 18,
    fontWeight: "800",
  },
  identity: {
    flex: 1,
    gap: 5,
  },
  name: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },
  secondary: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 110,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#0B1D2A",
    gap: 6,
  },
  statValue: {
    color: C.lime,
    fontSize: 28,
    fontWeight: "900",
  },
  statLabel: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
  },
  statStatus: {
    color: "#AFC4D1",
    fontSize: 10,
  },
  dangerZone: {
    padding: 16,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECDCA",
    backgroundColor: C.errorBackground,
  },
  dangerTitle: {
    color: C.error,
    fontSize: 14,
    fontWeight: "700",
  },
  confirmationText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: C.error,
  },
  removeText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
  },
  removeOutline: {
    alignSelf: "flex-start",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#FECDCA",
  },
  error: {
    color: C.error,
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.65,
  },
});
