import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeInfos } from "@/features/home/api";

import { useAuth } from "@/providers/auth-providers";

const C = {
  background: "#F1F5F9",
  white: "#FFFFFF",
  text: "#142532",
  muted: "#71808E",
  turquoise: "#0BB0C9",
  turquoiseSoft: "#E0F7FB",
  turquoiseDark: "#075B6B",
  purple: "#7028C8",
  purpleSoft: "#F2EBFC",
  lime: "#A3E635",
  border: "#E7EDF2",
  navy: "#102D3C",
};

type IconName = ComponentProps<typeof Ionicons>["name"];

type AccessCardProps = {
  icon: IconName;
  title: string;
  description: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
};

function AccessCard({
  icon,
  title,
  description,
  color,
  backgroundColor,
  onPress,
}: AccessCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.accessCard, pressed && styles.pressed]}
    >
      <View style={[styles.accessIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={23} color={color} />
      </View>

      <Text style={styles.accessTitle}>{title}</Text>

      <Text style={styles.accessDescription}>{description}</Text>

      <Ionicons
        name="arrow-forward"
        size={18}
        color={color}
        style={styles.accessArrow}
      />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session, signOut, isLoading: isAuthLoading } = useAuth();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  const userId = session?.user.id;

  const {
    data: homeDetails,
    isPending: isHomePending,
    isError: isHomeError,
    error: homeError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["home-details", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("Utilisateur non connecté.");
      }

      return fetchHomeInfos(userId);
    },

    enabled: !isAuthLoading && Boolean(userId),

    refetchOnMount: "always",

    retry: 1,
  });

  const CLUB_NAME = homeDetails?.club_members?.[0]?.club?.name;

  const sections = homeDetails?.club_members?.[0]?.section_members;
  const availableSections = sections?.flatMap((sectionMembership) => {
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
  const selectedSection =
    availableSections?.find(
      (item) => item.section.id_section === selectedSectionId,
    ) ?? (availableSections?.length === 1 ? availableSections[0] : null);

  const entrance = useRef(new Animated.Value(0)).current;

  const openTrainings = () => {
    router.push("/(app)/(tabs)/calendar");
  };

  useEffect(() => {
    if (isAuthLoading || !session) return;

    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;

    const reveal = async () => {
      let reduceMotion = true;

      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        // En cas de doute, affiche sans animation.
      }

      if (disposed) return;

      if (reduceMotion) {
        entrance.setValue(1);
        return;
      }

      animation = Animated.timing(entrance, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      });

      animation.start();
    };

    void reveal();

    return () => {
      disposed = true;
      animation?.stop();
    };
  }, [entrance, isAuthLoading, session?.user.id]);

  if (isAuthLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.turquoise} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const firstName = homeDetails?.first_name?.trim();
  const initial = firstName?.charAt(0).toUpperCase() || "O";

  // const openTrainings = () => {
  //   router.push("/(app)/(tabs)/trainings");
  // };

  const openTeam = () => {
    router.push("/(app)/(tabs)/team");
  };

  const openProfile = () => {
    router.push("/(app)/(tabs)/profile");
  };

  const openPlaybook = () => {
    Alert.alert(
      "Playbook",
      "L’accès à tes schémas de jeu sera disponible ici.",
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          {/* Identité du club */}
          <View style={styles.topbar}>
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Ionicons name="flag" size={22} color={C.white} />
              </View>

              <View style={styles.brandText}>
                <Text style={styles.clubName}>{CLUB_NAME}</Text>
                <Text style={styles.brandSubtitle}>FLAG FOOTBALL</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir mon profil"
              onPress={openProfile}
              style={({ pressed }) => [
                styles.avatar,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          </View>

          {/* Accueil personnalisé */}
          <View style={styles.greeting}>
            <Text style={styles.eyebrow}>TON CLUB. TON ÉQUIPE.</Text>

            <Text style={styles.greetingTitle}>
              {firstName ? `Salut ${firstName}.` : "Salut !"}
            </Text>

            <Text style={styles.accessTitle}>
              {selectedSection?.section?.name}
            </Text>
          </View>

          {/* Carte principale */}
          <View style={styles.hero}>
            <View
              pointerEvents="none"
              accessible={false}
              style={styles.heroCircle}
            />
            <View
              pointerEvents="none"
              accessible={false}
              style={styles.heroSmallCircle}
            />

            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>
                ON SE RETROUVE SUR LE TERRAIN
              </Text>
            </View>

            <Text style={styles.heroTitle}>Prêt pour{"\n"}le terrain ?</Text>

            <Text style={styles.heroDescription}>
              Consulte les prochaines séances et indique ta disponibilité.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={openTrainings}
              style={({ pressed }) => [
                styles.heroButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.heroButtonText}>Voir les entraînements</Text>

              <Ionicons name="arrow-forward" size={19} color={C.text} />
            </Pressable>
          </View>

          {/* Accès rapides */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Ton espace</Text>

            <Text style={styles.sectionSubtitle}>L’essentiel, simplement.</Text>
          </View>

          <View style={styles.accessGrid}>
            {/* <AccessCard
              icon="calendar-outline"
              title="Planning"
              description="Séances et disponibilités"
              color={C.turquoiseDark}
              backgroundColor={C.turquoiseSoft}
              onPress={openTrainings}
            /> */}

            <AccessCard
              icon="people-outline"
              title="Mon équipe"
              description="Retrouve ton collectif"
              color={C.purple}
              backgroundColor={C.purpleSoft}
              onPress={openTeam}
            />
          </View>

          {/* Playbook */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Playbook. Fonctionnalité à venir."
            onPress={openPlaybook}
            style={({ pressed }) => [
              styles.playbookCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.playbookIcon}>
              <Ionicons name="git-network-outline" size={27} color={C.lime} />
            </View>

            <View style={styles.playbookContent}>
              <View style={styles.playbookHeading}>
                <Text style={styles.playbookTitle}>Playbook</Text>

                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>BIENTÔT</Text>
                </View>
              </View>

              <Text style={styles.playbookDescription}>
                Les schémas qui font la différence.
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={20} color={C.white} />
          </Pressable>

          {/* Accès profil */}
          <Pressable
            accessibilityRole="button"
            onPress={openProfile}
            style={({ pressed }) => [
              styles.profileRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.profileIcon}>
              <Ionicons name="person-outline" size={21} color={C.purple} />
            </View>

            <View style={styles.profileContent}>
              <Text style={styles.profileTitle}>Mon profil</Text>

              <Text style={styles.profileDescription}>
                Tes informations et ton espace personnel
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>UN COLLECTIF. UNE ÉNERGIE.</Text>
            <View style={styles.footerLine} />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
  },
  scrollContent: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 30,
  },

  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.turquoise,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
  },
  brandText: {
    flex: 1,
  },
  clubName: {
    color: C.text,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.purple,
    fontSize: 17,
    fontWeight: "700",
  },

  greeting: {
    marginTop: 32,
    marginBottom: 22,
  },
  eyebrow: {
    color: C.purple,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  greetingTitle: {
    color: C.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 8,
  },
  greetingDescription: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    padding: 24,
    borderRadius: 26,
    backgroundColor: C.turquoise,
  },
  heroCircle: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 35,
    borderColor: "#FFFFFF14",
    right: -105,
    top: -45,
  },
  heroSmallCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#FFFFFF40",
    right: -35,
    bottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.lime,
  },
  heroBadgeText: {
    flexShrink: 1,
    color: C.navy,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: C.navy,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 20,
  },
  heroDescription: {
    maxWidth: 260,
    color: C.navy,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  heroButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.lime,
  },
  heroButtonText: {
    flexShrink: 1,
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },

  sectionHeading: {
    marginTop: 30,
    marginBottom: 14,
    gap: 4,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
  },
  accessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  accessCard: {
    flexGrow: 1,
    flexBasis: 140,
    padding: 18,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  accessIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  accessTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  accessDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  accessArrow: {
    alignSelf: "flex-end",
    marginTop: 14,
  },

  playbookCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: C.navy,
  },
  playbookIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFFFFF0D",
    alignItems: "center",
    justifyContent: "center",
  },
  playbookContent: {
    flex: 1,
  },
  playbookHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  playbookTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: "#FFFFFF14",
  },
  soonText: {
    color: C.lime,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  playbookDescription: {
    color: "#C2D5DF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContent: {
    flex: 1,
  },
  profileTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  profileDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 32,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  footerText: {
    flexShrink: 1,
    color: C.muted,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.3,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});
