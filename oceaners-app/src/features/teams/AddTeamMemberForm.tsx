import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { COLORS as C } from "@/constants/theme";
import { fetchSectionMemberCandidates, addMemberToSection } from "./api";

type AddTeamMemberFormProps = {
  sectionId: string;
  currentUserId: string;
  onSuccess?: () => void;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function AddTeamMemberForm({
  sectionId,
  currentUserId,
  onSuccess,
}: AddTeamMemberFormProps) {
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [teamRole, setTeamRole] = useState<"player" | "coach">("player");

  const queryClient = useQueryClient();

  const addMemberMutation = useMutation({
    mutationFn: (clubMemberId: string) =>
      addMemberToSection({
        sectionId,
        clubMemberId,
        teamRole,
      }),
    retry: false,
  });

  const {
    data: members = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["section-member-candidates", currentUserId, sectionId],
    queryFn: () => fetchSectionMemberCandidates(sectionId),
    retry: 1,
  });

  if (isPending) {
    return (
      <View style={styles.feedback}>
        <ActivityIndicator color={C.header} />
        <Text style={styles.secondary}>Chargement des membres du club…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.feedback}>
        <Text accessibilityRole="alert" style={styles.error}>
          Impossible de charger les membres. Vérifie également que ton compte
          est coach de cette section.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={() => {
            void refetch();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {isFetching ? "Chargement…" : "Réessayer"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const normalizedSearch = normalizeSearch(search);

  const filteredMembers = members.filter((member) =>
    normalizeSearch(
      `${member.first_name ?? ""} ${member.last_name ?? ""}`,
    ).includes(normalizedSearch),
  );

  const selectedMember = members.find(
    (member) =>
      member.id_club_member === selectedMemberId && !member.already_assigned,
  );

  const availableCount = members.filter(
    (member) => !member.already_assigned,
  ).length;

  const handleSubmit = async () => {
    if (!selectedMember || addMemberMutation.isPending) {
      return;
    }

    try {
      await addMemberMutation.mutateAsync(selectedMember.id_club_member);
    } catch {
      // L'erreur est affichée dans le formulaire via la mutation.
      return;
    }

    setSelectedMemberId(null);

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["section-member-candidates"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["team-roster"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["user-teams"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["profile-details"],
      }),
    ]);

    onSuccess?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membres du club</Text>

      <Text style={styles.secondary}>
        {availableCount} membre
        {availableCount > 1 ? "s" : ""} disponible
        {availableCount > 1 ? "s" : ""} pour cette section.
      </Text>

      <TextInput
        accessibilityLabel="Rechercher un membre du club"
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un prénom ou un nom"
        placeholderTextColor={C.muted}
        autoCorrect={false}
        style={styles.searchInput}
      />

      <View style={styles.list}>
        {filteredMembers.map((member) => {
          const isSelected = member.id_club_member === selectedMemberId;

          const fullName =
            [member.first_name, member.last_name].filter(Boolean).join(" ") ||
            "Nom non renseigné";

          const initials =
            `${member.first_name?.charAt(0) ?? ""}${
              member.last_name?.charAt(0) ?? ""
            }`.toUpperCase() || "?";

          return (
            <Pressable
              key={member.id_club_member}
              accessibilityRole="radio"
              accessibilityLabel={fullName}
              accessibilityState={{
                checked: isSelected,
                disabled: member.already_assigned,
              }}
              disabled={member.already_assigned || addMemberMutation.isPending}
              onPress={() => {
                addMemberMutation.reset();
                setSelectedMemberId(member.id_club_member);
              }}
              style={({ pressed }) => [
                styles.memberRow,
                isSelected && styles.selectedRow,
                member.already_assigned && styles.disabledRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.initials}>{initials}</Text>
              </View>

              <View style={styles.identity}>
                <Text style={styles.memberName}>{fullName}</Text>

                <Text style={styles.secondary}>
                  {member.already_assigned
                    ? "Déjà dans la section"
                    : isSelected
                      ? "Sélectionné"
                      : "Disponible"}
                </Text>
              </View>

              <View style={[styles.radio, isSelected && styles.selectedRadio]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {filteredMembers.length === 0 ? (
        <Text style={styles.secondary}>
          {members.length === 0
            ? "Aucun membre n’a été retourné pour ce club."
            : "Aucun membre ne correspond à ta recherche."}
        </Text>
      ) : null}

      {selectedMember ? (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionTitle}>Membre sélectionné</Text>

          <Text style={styles.memberName}>
            {[selectedMember.first_name, selectedMember.last_name]
              .filter(Boolean)
              .join(" ") || "Nom non renseigné"}
          </Text>

          <Text style={styles.secondary}>
            Ce membre sera ajouté à cette section.
          </Text>

          {addMemberMutation.isError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {addMemberMutation.error.message ||
                "Impossible d’ajouter ce membre. Réessaie."}
            </Text>
          ) : null}

          <Text style={styles.title}>Rôle dans la section</Text>

          <View style={styles.roleRow}>
            <Pressable
              style={[
                styles.roleButton,
                teamRole === "player" && styles.roleButtonActive,
              ]}
              onPress={() => setTeamRole("player")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  teamRole === "player" && styles.roleButtonTextActive,
                ]}
              >
                Joueur
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleButton,
                teamRole === "coach" && styles.roleButtonActive,
              ]}
              onPress={() => setTeamRole("coach")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  teamRole === "coach" && styles.roleButtonTextActive,
                ]}
              >
                Coach
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: !selectedMember || addMemberMutation.isPending,
              busy: addMemberMutation.isPending,
            }}
            disabled={!selectedMember || addMemberMutation.isPending}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || !selectedMember || addMemberMutation.isPending) &&
                styles.pressed,
            ]}
          >
            {addMemberMutation.isPending ? (
              <ActivityIndicator color={C.text} />
            ) : (
              <Text style={styles.submitText}>Ajouter à la section</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  title: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  searchInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.text,
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  selectedRow: {
    borderColor: C.header,
    backgroundColor: "#EFFBFD",
  },
  disabledRow: {
    opacity: 0.55,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DDF8FC",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#08788B",
    fontSize: 14,
    fontWeight: "800",
  },
  identity: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: C.header,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.header,
  },
  selectionSummary: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.background,
    gap: 6,
  },
  selectionTitle: {
    color: C.purple,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  feedback: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  error: {
    color: C.error,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  retryText: {
    color: C.purple,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.65,
  },
  submitButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },

  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  roleButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },

  roleButtonActive: {
    borderColor: C.header,
    backgroundColor: C.header,
  },

  roleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  roleButtonTextActive: {
    color: C.white,
  },
});
