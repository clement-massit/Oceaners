import { Pressable, StyleSheet, Text, View } from "react-native";

import { PROFILE_COLORS as C } from "./theme";
import type { MembershipCardData, MembershipStatus } from "./types";

type MembershipCardProps = {
  membership: MembershipCardData;
  nextTrainingLabel?: string | null;
  onPlanningPress?: () => void;
  onEditPress?: () => void;
};

const STATUS: Record<MembershipStatus, { label: string; color: string }> = {
  active: {
    label: "Actif",
    color: C.green,
  },
  pending: {
    label: "En essai",
    color: "#F59E0B",
  },
  inactive: {
    label: "Suspendu",
    color: "#EF4444",
  },
};

export function MembershipCard({
  membership,
  nextTrainingLabel,
  onPlanningPress,
  onEditPress,
}: MembershipCardProps) {
  const status = membership.status
    ? STATUS[membership.status]
    : {
        label: "Statut non renseigné",
        color: C.muted,
      };

  return (
    <View style={styles.card}>
      <Text style={styles.teamName}>{membership.teamName}</Text>

      {membership.clubName ? (
        <Text style={styles.secondary}>{membership.clubName}</Text>
      ) : null}
      {membership.season ? (
        <Text style={styles.season}>Saison {membership.season}</Text>
      ) : null}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Text style={styles.statusText}>{status.label}</Text>
      </View>
      <View style={styles.contact}>
        <Text selectable style={styles.email}>
          {membership.email || "Email non renseigné"}
        </Text>

        <Text selectable style={styles.secondary}>
          {membership.phone || "Téléphone non renseigné"}
        </Text>
      </View>
      {/* <View style={styles.training}>
        <Text style={styles.secondary}>Prochain entraînement</Text>

        <Text style={styles.trainingDate}>
          {nextTrainingLabel || "Aucun entraînement prévu"}
        </Text>
      </View> */}
      {onPlanningPress || onEditPress ? (
        <View style={styles.actions}>
          {onPlanningPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPlanningPress}
              style={({ pressed }) => [
                styles.button,
                styles.planningButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.planningText}>Planning</Text>
            </Pressable>
          ) : null}

          {onEditPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onEditPress}
              style={({ pressed }) => [
                styles.button,
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.editText}>Modifier</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#172033",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  teamName: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  secondary: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  season: {
    color: C.text,
    fontSize: 11,
    textAlign: "right",
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: C.text,
    fontSize: 12,
  },
  contact: {
    marginTop: 30,
    gap: 5,
  },
  email: {
    color: C.text,
    fontSize: 14,
  },
  training: {
    marginTop: 24,
    gap: 3,
  },
  trainingDate: {
    color: C.text,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  planningButton: {
    borderWidth: 1,
    borderColor: C.border,
  },
  planningText: {
    color: "#658D18",
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: C.lime,
  },
  editText: {
    color: "#253B08",
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.6,
  },
});
