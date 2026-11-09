import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, Spacing } from "@/constants/theme";

import {
  fetchClubMemberDetail,
  removeSectionMembership,
  updateClubMemberStatus,
  upsertSectionMembership,
} from "./api";
import type { ClubMemberDetail, ClubSection, SectionMembership } from "./types";
import { showAlert } from "@/lib/alert";

type Props = {
  visible: boolean;
  clubMemberId: string | null;
  sections: ClubSection[];
  onClose: () => void;
  onUpdated: () => void;
};

const CLUB_STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "pending", label: "En attente" },
];

const SECTION_STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "pending", label: "En attente" },
];

const TEAM_ROLE_OPTIONS = [
  { value: "player", label: "Joueur" },
  { value: "coach", label: "Coach" },
];

export function ManageMemberModal({
  visible,
  clubMemberId,
  sections,
  onClose,
  onUpdated,
}: Props) {
  const [member, setMember] = useState<ClubMemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [teamRole, setTeamRole] = useState("player");
  const [sectionStatus, setSectionStatus] = useState("active");

  const loadMember = async () => {
    if (!clubMemberId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchClubMemberDetail(clubMemberId);
      setMember(data);
    } catch (err) {
      console.error("[ManageMemberModal] fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Impossible de charger le membre.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && clubMemberId) {
      loadMember();
    }

    if (!visible) {
      setMember(null);
      setSelectedSectionId(null);
      setTeamRole("player");
      setSectionStatus("active");
      setError(null);
    }
  }, [visible, clubMemberId]);

  const handleUpdateClubStatus = async (status: string) => {
    if (!clubMemberId || member?.status === status) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateClubMemberStatus({ clubMemberId, status });
      await loadMember();
      onUpdated();
    } catch (err) {
      console.error("[ManageMemberModal] status error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le statut du club.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSectionMembership = async () => {
    if (!clubMemberId || !selectedSectionId) {
      setError("Sélectionne d’abord une section.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await upsertSectionMembership({
        clubMemberId,
        sectionId: selectedSectionId,
        teamRole,
        status: sectionStatus,
      });

      setSelectedSectionId(null);
      setTeamRole("player");
      setSectionStatus("active");

      await loadMember();
      onUpdated();
    } catch (err) {
      console.error("[ManageMemberModal] membership error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer le rattachement.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMembership = (membership: SectionMembership) => {
    showAlert(
      "Retirer de la section",
      `Retirer ce membre de « ${membership.section?.name ?? "cette section"} » ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            setError(null);

            try {
              await removeSectionMembership({
                sectionMemberId: membership.id_section_member,
              });

              await loadMember();
              onUpdated();
            } catch (err) {
              console.error("[ManageMemberModal] remove error:", err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Impossible de retirer le membre.",
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  const memberName = member
    ? `${member.profile?.first_name ?? ""} ${member.profile?.last_name ?? ""}`.trim() ||
      "Membre"
    : "";

  const currentStatusLabel =
    CLUB_STATUS_OPTIONS.find((option) => option.value === member?.status)
      ?.label ?? "Actif";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{memberName || "Membre"}</Text>

            {isLoading ? (
              <ActivityIndicator color={COLORS.header} />
            ) : error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Action impossible</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : member ? (
              <>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Rôle dans le club</Text>
                    <Text style={styles.infoValue}>{member.role}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Statut actuel</Text>
                    <Text style={styles.infoValue}>{currentStatusLabel}</Text>
                  </View>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Adhésion au club</Text>
                  <Text style={styles.formDescription}>
                    Ce statut concerne l’appartenance générale du membre au
                    club.
                  </Text>

                  <View style={styles.optionRow}>
                    {CLUB_STATUS_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.optionButton,
                          member.status === option.value &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => handleUpdateClubStatus(option.value)}
                        disabled={isSaving}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            member.status === option.value &&
                              styles.optionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Sections du membre</Text>
                  <Text style={styles.formDescription}>
                    Les sections représentent les équipes auxquelles ce membre
                    est rattaché.
                  </Text>

                  {member.section_members?.length ? (
                    <View style={styles.membershipList}>
                      {member.section_members.map((membership) => (
                        <View
                          key={membership.id_section_member}
                          style={styles.membershipCard}
                        >
                          <View style={styles.membershipHeader}>
                            <Text style={styles.membershipName}>
                              {membership.section?.name ?? "Section"}
                            </Text>

                            <View style={styles.membershipBadge}>
                              <Text style={styles.membershipBadgeText}>
                                {membership.team_role === "coach"
                                  ? "Coach"
                                  : "Joueur"}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            style={styles.removeButton}
                            onPress={() => handleRemoveMembership(membership)}
                            disabled={isSaving}
                          >
                            <Text style={styles.removeButtonText}>
                              Retirer de cette section
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      Ce membre n’est rattaché à aucune section.
                    </Text>
                  )}
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Ajouter à une section</Text>
                  <Text style={styles.formDescription}>
                    Sélectionne une section, puis choisis le rôle du membre dans
                    cette équipe.
                  </Text>

                  <Text style={styles.fieldLabel}>Section</Text>

                  <View style={styles.optionRow}>
                    {sections.map((section) => (
                      <Pressable
                        key={section.id_section}
                        style={[
                          styles.optionButton,
                          selectedSectionId === section.id_section &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedSectionId(section.id_section)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedSectionId === section.id_section &&
                              styles.optionTextActive,
                          ]}
                        >
                          {section.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Rôle dans la section</Text>

                  <View style={styles.roleRow}>
                    {TEAM_ROLE_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.roleButton,
                          teamRole === option.value && styles.roleButtonActive,
                        ]}
                        onPress={() => setTeamRole(option.value)}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            teamRole === option.value &&
                              styles.roleButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    style={[
                      styles.primaryButton,
                      (!selectedSectionId || isSaving) && styles.buttonDisabled,
                    ]}
                    onPress={handleSaveSectionMembership}
                    disabled={!selectedSectionId || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {teamRole === "coach"
                          ? "Ajouter comme coach"
                          : "Ajouter comme joueur"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>Aucune donnée chargée.</Text>
            )}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    marginBottom: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textTransform: "capitalize",
  },
  formCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  formDescription: {
    fontSize: 13,
    color: COLORS.muted,
  },
  fieldLabel: {
    marginTop: Spacing.one,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  optionButtonActive: {
    backgroundColor: COLORS.header,
    borderColor: COLORS.header,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.white,
  },
  membershipList: {
    gap: Spacing.two,
  },
  membershipCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  membershipName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  membershipBadge: {
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipBadgeText: {
    color: COLORS.header,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  membershipMeta: {
    fontSize: 13,
    color: COLORS.muted,
  },
  removeButton: {
    alignSelf: "flex-start",
    marginTop: Spacing.one,
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: COLORS.errorBackground,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.header,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  closeButton: {
    paddingTop: Spacing.three,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "700",
  },
  roleRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },

  roleButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  roleButtonActive: {
    borderColor: COLORS.header,
    backgroundColor: COLORS.header,
  },

  roleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  roleButtonTextActive: {
    color: COLORS.white,
  },
});
