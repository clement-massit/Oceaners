import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS as C } from "@/constants/theme";

type PersonalInfoCardProps = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  clubName?: string | null;
  onEditPress?: () => void;
};

export function PersonalInfoCard({
  firstName,
  lastName,
  email,
  phone,
  clubName,
  onEditPress,
}: PersonalInfoCardProps) {
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || "Non renseigné";
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mes informations</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{fullName}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email || "Non renseigné"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Téléphone</Text>
        <Text style={styles.value}>{phone || "Non renseigné"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Club</Text>
        <Text style={styles.value}>{clubName || "Aucun club"}</Text>
      </View>

      <Text style={styles.notice}>
        Tu n’es pas encore rattaché à une section. Ton club pourra t’ajouter à
        une équipe depuis son espace d’administration.
      </Text>

      {onEditPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onEditPress}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.editText}>Modifier mes informations</Text>
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
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    gap: 2,
  },
  label: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
  },
  notice: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  editButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  editText: {
    color: "#253B08",
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.65,
  },
});
