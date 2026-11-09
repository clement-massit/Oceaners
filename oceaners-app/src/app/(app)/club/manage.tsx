import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { COLORS, Spacing } from "@/constants/theme";

import type { ClubMember, ClubSection } from "@/features/clubManagement/types";
import {
  createClubSection,
  fetchClubMembers,
  fetchClubSections,
  fetchCurrentUserClubMembership,
} from "@/features/clubManagement/api";
import { ManageMemberModal } from "@/features/clubManagement/ManageMemberModal";

export default function ClubManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [createSectionVisible, setCreateSectionVisible] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionCategory, setSectionCategory] = useState("");
  const [sectionSeason, setSectionSeason] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");

  const membershipQuery = useQuery({
    queryKey: ["club-manage-membership"],
    queryFn: fetchCurrentUserClubMembership,
  });

  const membership = membershipQuery.data;
  const clubId = membership?.id_club ?? null;
  const isBureau = membership?.role === "bureau";

  useEffect(() => {
    if (!membershipQuery.isLoading && membership && !isBureau) {
      router.replace("/(app)/(tabs)/home");
    }
  }, [membershipQuery.isLoading, membership, isBureau, router]);

  const sectionsQuery = useQuery({
    queryKey: ["club-manage-sections", clubId],
    enabled: Boolean(clubId && isBureau),
    queryFn: () => fetchClubSections(clubId!),
  });

  const membersQuery = useQuery({
    queryKey: ["club-manage-members", clubId],
    enabled: Boolean(clubId && isBureau),
    queryFn: () => fetchClubMembers(clubId!),
  });

  const sections = sectionsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return members.filter((member) => {
      const fullName =
        `${member.profile?.first_name ?? ""} ${member.profile?.last_name ?? ""}`
          .trim()
          .toLowerCase();

      const matchesSearch = !search || fullName.includes(search);

      const matchesStatus =
        memberStatusFilter === "all" ||
        (member.status ?? "active") === memberStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, memberSearch, memberStatusFilter]);

  const stats = useMemo(() => {
    const activeMembers = members.filter(
      (member) => !member.status || member.status === "active",
    ).length;

    return {
      totalMembers: members.length,
      activeMembers,
      sectionsCount: sections.length,
    };
  }, [members, sections]);

  const getMemberName = (member: ClubMember) => {
    const fullName =
      `${member.profile?.first_name ?? ""} ${member.profile?.last_name ?? ""}`.trim();

    return fullName || "Membre sans nom";
  };

  const handleCreateSection = async () => {
    if (!clubId) return;

    const name = sectionName.trim();

    if (!name) {
      Alert.alert("Nom requis", "Le nom de la section est obligatoire.");
      return;
    }

    setCreatingSection(true);

    try {
      await createClubSection({
        clubId,
        name,
        category: sectionCategory,
        season: sectionSeason,
      });

      setSectionName("");
      setSectionCategory("");
      setSectionSeason("");
      setCreateSectionVisible(false);

      await queryClient.invalidateQueries({
        queryKey: ["club-manage-sections", clubId],
      });
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de créer la section.",
      );
    } finally {
      setCreatingSection(false);
    }
  };

  if (membershipQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.header} />
      </SafeAreaView>
    );
  }

  if (!membership || !isBureau) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.deniedTitle}>Accès réservé</Text>
        <Text style={styles.deniedText}>
          Cette page est réservée aux membres du bureau.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/profile")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>

          <Text style={styles.title}>Gestion du club</Text>
          <Text style={styles.subtitle}>
            Sections, membres et organisation du club
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Membres</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>
              {stats.activeMembers}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.purple }]}>
              {stats.sectionsCount}
            </Text>
            <Text style={styles.statLabel}>Sections</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sections</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => setCreateSectionVisible(true)}
          >
            <Text style={styles.primaryButtonText}>+ Créer</Text>
          </Pressable>
        </View>

        {sectionsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.header} />
        ) : sections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune section pour le moment.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sections.map((section: ClubSection) => (
              <View key={section.id_section} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{section.name}</Text>

                  {section.category ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{section.category}</Text>
                    </View>
                  ) : null}
                </View>

                {section.season ? (
                  <Text style={styles.cardSubtitle}>
                    Saison {section.season}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres du club</Text>
          <Text style={styles.countText}>
            {filteredMembers.length}/{members.length}
          </Text>
        </View>

        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un membre"
            placeholderTextColor={COLORS.muted}
            value={memberSearch}
            onChangeText={setMemberSearch}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterRow}>
          {[
            { value: "all", label: "Tous" },
            { value: "active", label: "Actifs" },
            { value: "inactive", label: "Inactifs" },
            { value: "pending", label: "En attente" },
          ].map((filter) => (
            <Pressable
              key={filter.value}
              style={[
                styles.filterChip,
                memberStatusFilter === filter.value && styles.filterChipActive,
              ]}
              onPress={() =>
                setMemberStatusFilter(filter.value as typeof memberStatusFilter)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  memberStatusFilter === filter.value &&
                    styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {membersQuery.isLoading ? (
          <ActivityIndicator color={COLORS.header} />
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun membre trouvé.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(member) => member.id_club_member}
            scrollEnabled={false}
            contentContainerStyle={styles.memberList}
            renderItem={({ item }) => {
              const firstName = item.profile?.first_name ?? "";
              const lastName = item.profile?.last_name ?? "";
              const initials =
                `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
                "?";

              const status = item.status ?? "active";

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.memberCard,
                    pressed && styles.memberCardPressed,
                  ]}
                  onPress={() => {
                    setSelectedMember(item);
                    setMemberModalVisible(true);
                  }}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{initials}</Text>
                  </View>

                  <View style={styles.memberMain}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {getMemberName(item)}
                    </Text>

                    <Text style={styles.memberMeta}>
                      {item.role} • {status}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      status === "active" && styles.statusActive,
                      status === "inactive" && styles.statusInactive,
                      status === "pending" && styles.statusPending,
                    ]}
                  />
                </Pressable>
              );
            }}
          />
        )}

        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres du club</Text>
        </View>

        {membersQuery.isLoading ? (
          <ActivityIndicator color={COLORS.header} />
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun membre dans le club.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {members.map((member: ClubMember) => (
              <Pressable
                key={member.id_club_member}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  setSelectedMember(member);
                  setMemberModalVisible(true);
                }}
              >
                <View style={styles.memberRow}>
                  <View style={styles.memberIdentity}>
                    <Text style={styles.cardTitle}>
                      {getMemberName(member)}
                    </Text>

                    <Text style={styles.memberStatus}>
                      Statut : {member.status ?? "active"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      member.role === "bureau" && styles.roleBadgeBureau,
                      member.role === "coach" && styles.roleBadgeCoach,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>{member.role}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )} */}
      </ScrollView>

      <Modal
        visible={createSectionVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateSectionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Créer une section</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de la section"
              placeholderTextColor={COLORS.muted}
              value={sectionName}
              onChangeText={setSectionName}
            />

            <TextInput
              style={styles.input}
              placeholder="Catégorie"
              placeholderTextColor={COLORS.muted}
              value={sectionCategory}
              onChangeText={setSectionCategory}
            />

            <TextInput
              style={styles.input}
              placeholder="Saison"
              placeholderTextColor={COLORS.muted}
              value={sectionSeason}
              onChangeText={setSectionSeason}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setCreateSectionVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={handleCreateSection}
                disabled={creatingSection}
              >
                {creatingSection ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Créer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ManageMemberModal
        visible={memberModalVisible}
        clubMemberId={selectedMember?.id_club_member ?? null}
        sections={sections}
        onClose={() => {
          setMemberModalVisible(false);
          setSelectedMember(null);
        }}
        onUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: ["club-manage-members", clubId],
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    backgroundColor: COLORS.background,
    gap: Spacing.two,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.two,
  },
  backText: {
    color: COLORS.header,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: Spacing.three,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    marginTop: Spacing.half,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
  },
  cardSubtitle: {
    marginTop: Spacing.one,
    fontSize: 13,
    color: COLORS.muted,
  },
  badge: {
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.header,
    fontSize: 11,
    fontWeight: "700",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  memberIdentity: {
    flex: 1,
  },
  memberStatus: {
    marginTop: Spacing.half,
    fontSize: 13,
    color: COLORS.muted,
  },
  roleBadge: {
    backgroundColor: COLORS.header,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeBureau: {
    backgroundColor: COLORS.purple,
  },
  roleBadgeCoach: {
    backgroundColor: COLORS.lime,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: Spacing.four,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.header,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.three,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  deniedText: {
    textAlign: "center",
    color: COLORS.muted,
  },

  countText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    height: 44,
    fontSize: 15,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: COLORS.header,
    borderColor: COLORS.header,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  memberList: {
    gap: Spacing.two,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  memberCardPressed: {
    opacity: 0.7,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.buttonBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: COLORS.header,
    fontSize: 14,
    fontWeight: "800",
  },
  memberMain: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  memberMeta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
    textTransform: "capitalize",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.muted,
  },
  statusActive: {
    backgroundColor: COLORS.green,
  },
  statusInactive: {
    backgroundColor: COLORS.error,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
});
