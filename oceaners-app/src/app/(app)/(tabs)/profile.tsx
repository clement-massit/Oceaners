import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-providers";

import { useQuery } from "@tanstack/react-query";
import {
  countClubMember,
  fetchProfileDetails,
  countSections,
} from "@/features/profile/api";

import { ProfileHeader } from "@/features/profile/ProfileHeader";
import { MembershipCard } from "@/features/profile/MembershipCard";
import { PlayerProfileContent } from "@/features/profile/PlayerProfileContent";
import { CoachProfileContent } from "@/features/profile/CoachProfileContent";
import { BureauProfileContent } from "@/features/profile/BureauProfileContent";
import { PersonalInfoCard } from "@/features/profile/PersonalInfoCard";
import { EditProfileModal } from "@/features/profile/EditProfileModal";
import { COLORS } from "@/constants/theme";

import type {
  MembershipCardData,
  MembershipStatus,
  ProfileViewRole,
} from "@/features/profile/types";

function toMembershipStatus(
  value: string | null | undefined,
): MembershipStatus | null {
  switch (value) {
    case "active":
    case "pending":
    case "inactive":
      return value;

    default:
      return null;
  }
}

export default function ProfileScreen() {
  const { session, signOut, isLoading: isAuthLoading } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const [signOutError, setSignOutError] = useState<string | null>(null);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const userId = session?.user.id;

  const {
    data: profileDetails,
    isPending: isProfilePending,
    isError: isProfileError,
    error: profileError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["profile-details", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Utilisateur non connecté.");
      }

      return fetchProfileDetails(userId);
    },

    enabled: !isAuthLoading && Boolean(userId),

    refetchOnMount: "always",

    retry: 1,
  });

  const { data: count_clubMember, isLoading } = useQuery({
    queryKey: ["count-club_members", userId],
    queryFn: countClubMember,
    enabled: !isAuthLoading && Boolean(userId),
    refetchOnMount: "always",
    retry: 1,
  });

  const { data: count_sections } = useQuery({
    queryKey: ["count-sections", userId],
    queryFn: countSections,
    enabled: !isAuthLoading && Boolean(userId),
    refetchOnMount: "always",
    retry: 1,
  });

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.header} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isProfilePending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.header} size="large" />
        <Text style={styles.secondaryText}>Chargement du profil…</Text>
      </View>
    );
  }

  if (isProfileError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Impossible de charger ton profil.</Text>

        <Text style={styles.secondaryText}>{profileError.message}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={() => {
            void refetch();
          }}
          style={[styles.editButton, isFetching && styles.pressed]}
        >
          <Text style={styles.editButtonText}>
            {isFetching ? "Chargement…" : "Réessayer"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const memberships = profileDetails?.club_members ?? [];

  const hasMultipleMemberships = memberships.length > 1;

  const membership = memberships.length === 1 ? memberships[0] : null;

  const sectionMemberships = membership?.section_members ?? [];

  const club = membership?.club;

  const phone = profileDetails?.phone;

  // Ne conserve que les adhésions dont la section est visible.
  const availableSections = sectionMemberships.flatMap((sectionMembership) => {
    const section = sectionMembership.section;

    return section
      ? [
          {
            section,
            teamRole: sectionMembership.team_role,
          },
        ]
      : [];
  });

  // Une seule section : sélection automatique.
  // Plusieurs sections : choix explicite de l'utilisateur.
  const selectedSection =
    availableSections.find(
      (item) => item.section.id_section === selectedSectionId,
    ) ?? (availableSections.length === 1 ? availableSections[0] : null);

  const hasMultipleSections = availableSections.length > 1;

  const clubRole: string | null = membership?.role ?? null;

  const sectionRole: string | null = selectedSection?.teamRole ?? null;

  // Le bureau dépend du club.
  // Le coach/joueur dépend ici de la section sélectionnée.
  let viewRole: ProfileViewRole | null = null;

  if (clubRole === "bureau") {
    viewRole = "bureau";
  } else if (sectionRole === "coach") {
    viewRole = "coach";
  } else if (sectionRole === "player") {
    viewRole = "player";
  }

  const roleLabel = hasMultipleMemberships
    ? "Choisis un club"
    : !membership
      ? "Sans adhésion"
      : viewRole === "bureau"
        ? "Bureau"
        : viewRole === "coach"
          ? "Coach"
          : viewRole === "player"
            ? "Joueur"
            : hasMultipleSections && !selectedSection
              ? "Choisis une section"
              : "Membre";

  const membershipCardData: MembershipCardData | null =
    membership && selectedSection
      ? {
          teamName: selectedSection.section.name,
          season:
            selectedSection.section.season == null
              ? null
              : String(selectedSection.section.season),
          status: toMembershipStatus(membership.status),
          email: session.user.email ?? null,
          phone: phone,
        }
      : null;

  const handlePlanning = () => {
    Alert.alert("Planning", "Ce bouton sera relié au planning de ton équipe.");
  };

  const handleEdit = () => {
    setIsEditProfileOpen(true);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      setSignOutError("La déconnexion a échoué. Réessaie dans un instant.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          firstName={profileDetails?.first_name}
          lastName={profileDetails?.last_name}
          club={club?.[0]?.name}
          roleLabel={roleLabel}
        />

        <View style={styles.body}>
          {membershipCardData ? (
            <>
              <MembershipCard
                membership={membershipCardData}
                onPlanningPress={handlePlanning}
                onEditPress={handleEdit}
              />

              <Text style={styles.infoText}>
                La section, la saison, le téléphone et le prochain entraînement
                ne sont pas encore chargés.
              </Text>
            </>
          ) : (
            // membership ? (
            //   <View style={styles.noticeCard}>
            //     <Text style={styles.noticeTitle}>
            //       {hasMultipleMemberships
            //         ? "Choisis un club"
            //         : "Aucune adhésion disponible"}
            //     </Text>

            //     <Text style={styles.secondaryText}>
            //       caca
            //       {hasMultipleMemberships
            //         ? "Ton compte possède plusieurs adhésions. Un sélecteur de club doit être ajouté pour afficher les bonnes informations."
            //         : "Aucune adhésion n’a été retournée pour ce profil."}
            //     </Text>
            //   </View>
            // ) :
            <PersonalInfoCard
              firstName={profileDetails?.first_name}
              lastName={profileDetails?.last_name}
              email={session.user.email ?? null}
              phone={phone}
              clubName={club?.name ?? null}
              onEditPress={handleEdit}
            />
          )}

          {membership && viewRole ? (
            <View style={styles.roleContent}>
              {viewRole === "player" ? (
                <PlayerProfileContent attendedCount={null} totalCount={null} />
              ) : viewRole === "coach" ? (
                <CoachProfileContent
                  playerCount={null}
                  upcomingTrainingCount={null}
                />
              ) : (
                <BureauProfileContent
                  memberCount={count_clubMember ?? 0}
                  sectionCount={count_sections ?? 0}
                />
              )}
            </View>
          ) : null}

          {membership && !viewRole ? (
            <Text style={styles.infoText}>
              Aucun visuel spécifique n’est encore associé au rôle «{" "}
              {membership.role} ».
            </Text>
          ) : null}

          <View style={styles.logoutSection}>
            {signOutError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {signOutError}
              </Text>
            ) : null}

            {clubRole === "bureau" && (
              <Pressable
                style={styles.adminButton}
                onPress={() => router.push("/club/manage")}
              >
                <Text style={styles.adminButtonText}>Gestion du club</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: isSigningOut,
              }}
              disabled={isSigningOut}
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.logoutButton,
                (pressed || isSigningOut) && styles.pressed,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color={COLORS.purple} />
              ) : (
                <Text style={styles.logoutText}>Déconnexion</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {isEditProfileOpen && profileDetails ? (
        <EditProfileModal
          key={session.user.id}
          userId={session.user.id}
          firstName={profileDetails.first_name}
          lastName={profileDetails.last_name}
          phone={profileDetails.phone}
          email={session.user.email}
          onClose={() => setIsEditProfileOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.header,
  },
  loadingContainer: {
    flex: 1,
    padding: 24,
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  roleContent: {
    marginTop: 28,
  },
  secondaryText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  noticeCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  planningButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  planningButtonText: {
    color: "#658D18",
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#253B08",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginTop: "auto",
    paddingTop: 36,
    gap: 12,
  },
  logoutButton: {
    minWidth: 105,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: "#B42318",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.6,
  },

  adminButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  adminButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
