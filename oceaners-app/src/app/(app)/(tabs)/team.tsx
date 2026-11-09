import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";

import { useAuth } from "@/providers/auth-providers";
import { fetchUserTeams } from "@/features/teams/api";
import { TeamList } from "@/features/teams/TeamList";
import { TeamEmptyState } from "@/features/teams/TeamEmptyState";
import { TeamDashboard } from "@/features/teams/TeamDashboard";
import { COLORS as C } from "@/constants/theme";

export default function TeamScreen() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const userId = session?.user.id;

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["user-teams", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Utilisateur non connecté.");
      }

      return fetchUserTeams(userId);
    },
    enabled: !isAuthLoading && Boolean(userId),
    refetchOnMount: "always",
    retry: 1,
  });

  const playerTeams = data?.playerTeams ?? [];
  const managedTeams = data?.managedTeams ?? [];

  const hasManagementAccess = managedTeams.length > 0;

  const isPlayerRosterOnly =
    playerTeams.length === 1 && managedTeams.length === 0;

  const selectedPlayerTeam =
    playerTeams.find((team) => team.id_section === selectedSectionId) ?? null;

  const selectedManagedTeam =
    managedTeams.find((team) => team.id_section === selectedSectionId) ?? null;

  const selectedTeam = selectedManagedTeam ?? selectedPlayerTeam ?? null;

  useEffect(() => {
    if (isPending || isError) return;

    if (isPlayerRosterOnly) {
      setSelectedSectionId(playerTeams[0].id_section);
    }
  }, [isPending, isError, isPlayerRosterOnly, playerTeams]);

  if (isAuthLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.header} size="large" />
        <Text style={styles.secondaryText}>Chargement…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.header} size="large" />
        <Text style={styles.secondaryText}>Chargement de tes sections…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Impossible de charger tes sections.
        </Text>

        <Text style={styles.secondaryText}>{error.message}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={() => void refetch()}
          style={[styles.retryButton, isFetching && styles.pressed]}
        >
          <Text style={styles.retryText}>
            {isFetching ? "Chargement…" : "Réessayer"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const screenTitle = hasManagementAccess
    ? selectedManagedTeam
      ? "Gestion de l’équipe"
      : "Mes sections à gérer"
    : "Mon équipe";

  console.log(data);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        key={`${session.user.id}-${selectedTeam?.id_section ?? "sections"}`}
        contentContainerStyle={styles.content}
      >
        {/* <Text style={styles.screenTitle}>{screenTitle}</Text> */}

        {hasManagementAccess ? (
          selectedManagedTeam ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Revenir aux sections à gérer"
                onPress={() => setSelectedSectionId(null)}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Mes sections à gérer</Text>
              </Pressable>

              <TeamDashboard
                key={selectedManagedTeam.id_section}
                team={selectedManagedTeam}
                currentUserId={session.user.id}
                canManage
              />
            </>
          ) : (
            <TeamList
              title="SECTIONS DISPONIBLES"
              teams={managedTeams}
              onTeamPress={(team) => setSelectedSectionId(team.id_section)}
            />
          )
        ) : playerTeams.length > 1 ? (
          selectedPlayerTeam ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Revenir à mes équipes"
                onPress={() => setSelectedSectionId(null)}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Mes équipes</Text>
              </Pressable>

              <TeamDashboard
                key={selectedPlayerTeam.id_section}
                team={selectedPlayerTeam}
                currentUserId={session.user.id}
                canManage={false}
              />
            </>
          ) : (
            <TeamList
              title="MES ÉQUIPES"
              teams={playerTeams}
              onTeamPress={(team) => setSelectedSectionId(team.id_section)}
            />
          )
        ) : playerTeams.length === 1 ? (
          <TeamDashboard
            key={playerTeams[0].id_section}
            team={playerTeams[0]}
            currentUserId={session.user.id}
            canManage={false}
          />
        ) : (
          <TeamEmptyState
            title="Aucune section disponible"
            description="Tu n’es rattaché à aucune section de joueur et tu n’as aucune section à gérer."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  content: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },

  screenTitle: {
    color: C.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: C.background,
  },

  secondaryText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  errorText: {
    color: C.error,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  retryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    color: "#253B08",
    fontSize: 12,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.65,
  },

  backButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },

  backText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "600",
  },
});
