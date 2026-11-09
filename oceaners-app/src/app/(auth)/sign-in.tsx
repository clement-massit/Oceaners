import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-providers";

import { COLORS as C } from "@/constants/theme";

const MIN_PASSWORD_LENGTH = 6;

export default function SignInScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid =
    email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH;

  const handleSignIn = async () => {
    if (isLoading) return;

    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Merci de renseigner ton email et ton mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email.trim(), password);

      router.replace("/(app)/(tabs)/home");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Connexion impossible. Vérifie tes identifiants ou réessaie plus tard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Text style={styles.brandName}>Oceaners</Text>
            <Text style={styles.brandCaption}>UN COLLECTIF. UNE ÉNERGIE.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>BON RETOUR</Text>

            <Text style={styles.title}>Connecte-toi.</Text>

            <Text style={styles.description}>
              Retrouve ton équipe, les entraînements et la vie du club.
            </Text>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>

                <TextInput
                  accessibilityLabel="Adresse email"
                  style={styles.input}
                  placeholder="ton@email.fr"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>

                <TextInput
                  accessibilityLabel="Mot de passe"
                  style={styles.input}
                  placeholder="Ton mot de passe"
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleSignIn();
                  }}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setShowPassword((value) => !value);
                  }}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.linkText}>
                    {showPassword ? "Masquer" : "Afficher"}
                  </Text>
                </Pressable>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isLoading || !isFormValid,
                }}
                disabled={isLoading || !isFormValid}
                onPress={() => {
                  void handleSignIn();
                }}
                style={({ pressed }) => [
                  styles.submitButton,
                  (pressed || isLoading || !isFormValid) && styles.pressed,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={C.text} />
                ) : (
                  <Text style={styles.submitText}>Se connecter</Text>
                )}
              </Pressable>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpCaption}>Pas encore de compte ?</Text>

                <Link href="/(auth)/sign-up" asChild>
                  <Pressable disabled={isLoading} style={styles.signUpLink}>
                    <Text style={styles.linkText}>Créer un compte</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandName: {
    color: C.header,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  brandCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.8,
    marginTop: 6,
  },
  card: {
    padding: 24,
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  eyebrow: {
    color: C.purple,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
  },
  description: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
  form: {
    marginTop: 24,
    gap: 16,
  },
  field: {
    gap: 7,
  },
  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.text,
    fontSize: 15,
  },
  passwordToggle: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "600",
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: C.errorBackground,
  },
  errorText: {
    color: C.error,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 50,
    backgroundColor: C.lime,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  submitText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  signUpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
    marginTop: 8,
  },
  signUpCaption: {
    color: C.muted,
    fontSize: 12,
  },
  signUpLink: {
    minHeight: 44,
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
