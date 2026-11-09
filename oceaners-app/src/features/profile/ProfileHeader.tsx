import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { PROFILE_COLORS as C } from "./theme";

type ProfileHeaderProps = {
  firstName?: string | null;
  lastName?: string | null;
  club?: string | null;
  roleLabel: string;
  avatarUrl?: string | null;
};

export function ProfileHeader({
  firstName,
  lastName,
  club,
  roleLabel,
  avatarUrl,
}: ProfileHeaderProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || "Mon profil";

  const initials =
    `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() ||
    "O";

  const showAvatar = Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.role}>{club}</Text>
        <Text style={styles.role}>{roleLabel}</Text>
      </View>

      <View
        style={styles.avatar}
        accessible
        accessibilityLabel={`Avatar de ${fullName}`}
      >
        {showAvatar && avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.image}
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 145,
    paddingHorizontal: 28,
    paddingVertical: 28,
    backgroundColor: C.header,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  identity: {
    flex: 1,
  },
  name: {
    color: C.white,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  role: {
    color: "#DCF7FC",
    fontSize: 22,
    marginTop: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFFFFF80",
    backgroundColor: "#DDF8FC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: "#08788B",
    fontSize: 21,
    fontWeight: "800",
  },
});
