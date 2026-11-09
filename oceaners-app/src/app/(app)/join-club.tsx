import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-providers";
import { supabase } from "@/lib/supabase";
import { joinClubWithCode } from "@/features/invitations/api";

export default function JoinClubScreen() {
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingCode = session?.user.user_metadata?.pending_club_code;
  const initialCode = typeof pendingCode === "string" ? pendingCode : "";
  const clubCode = editedCode ?? initialCode;

  const handleJoin = async () => {
    console.log();
    if (isJoining || !clubCode.trim()) return;

    setErrorMessage(null);
    setIsJoining(true);

    try {
      console.log("SignUp session:", session?.user?.id ?? null);

      await joinClubWithCode(clubCode);

      await supabase.auth.updateUser({
        data: {
          pending_club_code: null,
        },
      });

      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({
        queryKey: ["profile-details"],
      });

      router.replace("/(app)/(tabs)/home");
    } catch (error: unknown) {
      console.error("Erreur join_club_with_code :", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de rejoindre le club. Vérifie le code ou réessaie.",
      );

      // setErrorMessage(
      //   "Impossible de rejoindre le club. Vérifie le code ou réessaie.",
      // );
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#0BB0C9" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejoins ton club.</Text>

      <Text style={styles.description}>
        Ton compte est prêt. Confirme le code transmis par ton club pour obtenir
        ton adhésion.
      </Text>

      <TextInput
        accessibilityLabel="Code du club"
        value={clubCode}
        onChangeText={setEditedCode}
        placeholder="Code du club"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isJoining}
        style={styles.input}
      />

      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isJoining || !clubCode.trim()}
        onPress={() => {
          void handleJoin();
        }}
        style={[
          styles.button,
          (isJoining || !clubCode.trim()) && styles.disabled,
        ]}
      >
        {isJoining ? (
          <ActivityIndicator color="#142532" />
        ) : (
          <Text style={styles.buttonText}>Rejoindre le club</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    gap: 18,
    backgroundColor: "#F1F5F9",
  },
  title: {
    color: "#142532",
    fontSize: 28,
    fontWeight: "800",
  },
  description: {
    color: "#667085",
    fontSize: 14,
    lineHeight: 22,
  },
  input: {
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E4EAF0",
    color: "#142532",
  },
  button: {
    minHeight: 50,
    backgroundColor: "#A3E635",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#142532",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: "#B42318",
    lineHeight: 20,
  },
});
