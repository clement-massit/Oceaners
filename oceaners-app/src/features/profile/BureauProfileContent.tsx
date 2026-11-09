import { Pressable, StyleSheet, Text, View } from "react-native";

import { PROFILE_COLORS as C } from "./theme";

type BureauProfileContentProps = {
  memberCount: number | null;
  sectionCount: number | null;
  onManageMembers?: () => void;
  onManageSections?: () => void;
};

export function BureauProfileContent({
  memberCount,
  sectionCount,
  onManageMembers,
  onManageSections,
}: BureauProfileContentProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Administration du club</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{memberCount ?? "0"}</Text>
          <Text style={styles.caption}>Membres</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.value}>{sectionCount ?? "0"}</Text>
          <Text style={styles.caption}>Sections</Text>
        </View>
      </View>

      {onManageMembers ? (
        <Pressable
          accessibilityRole="button"
          onPress={onManageMembers}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Gérer les membres</Text>
        </Pressable>
      ) : null}

      {onManageSections ? (
        <Pressable
          accessibilityRole="button"
          onPress={onManageSections}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Gérer les sections</Text>
        </Pressable>
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
    gap: 12,
  },
  title: {
    color: C.purple,
    fontSize: 14,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  value: {
    color: C.purple,
    fontSize: 26,
    fontWeight: "700",
  },
  caption: {
    color: C.muted,
    fontSize: 12,
  },
  button: {
    minHeight: 44,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F5F0FC",
    justifyContent: "center",
  },
  buttonText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.6,
  },
});
