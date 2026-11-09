import { StyleSheet, Text, View } from "react-native";

import { COLORS as C } from "@/constants/theme";

type TeamEmptyStateProps = {
  title: string;
  description: string;
};

export function TeamEmptyState({ title, description }: TeamEmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
    gap: 8,
  },
  title: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
