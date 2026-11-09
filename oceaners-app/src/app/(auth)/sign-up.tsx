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
import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-providers";
import { supabase } from "@/lib/supabase";

import { COLORS as C } from "@/constants/theme";

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { session, isLoading, signUp } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [confirmationCode, setConfirmationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  const [hasCompletedAuthFlow, setHasCompletedAuthFlow] = useState(false);

  const handleVerifyEmail = async () => {
    if (!confirmationEmail || isVerifying) return;

    const token = confirmationCode.trim();

    if (!token) {
      setVerificationError("Saisis le code reçu par email.");
      return;
    }

    setVerificationError(null);
    setIsVerifying(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: confirmationEmail,
        token: confirmationCode.trim(),
        type: "email",
      });

      if (error) throw error;

      setHasCompletedAuthFlow(true);
    } catch {
      setVerificationError(
        "Le code n’a pas pu être validé. Vérifie-le ou demande un nouveau code.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    setErrorMessage(null);

    const cleanEmail = email.trim();

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Renseigne ton prénom et ton nom.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Renseigne une adresse email valide.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `Choisis un mot de passe d’au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        firstName,
        lastName,
        email: cleanEmail,
        password,
      });

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(cleanEmail);
        setPassword("");
        setPasswordConfirmation("");
      } else {
        setHasCompletedAuthFlow(true);
      }

      // Si une session est créée immédiatement,
      // le Redirect ci-dessous prend le relais.
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Inscription impossible. Réessaie dans un instant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.header} size="large" />
      </View>
    );
  }
  if (hasCompletedAuthFlow && session) {
    return <Redirect href="/(app)/join-club" />;
  }

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

          {confirmationEmail ? (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>DERNIÈRE ÉTAPE</Text>

              <Text style={styles.title}>Vérifie tes emails.</Text>

              <Text style={styles.description}>
                Si cette adresse peut être inscrite, tu recevras un message à :
              </Text>

              <Text selectable style={styles.emailHighlight}>
                {confirmationEmail}
              </Text>

              <Text style={styles.description}>
                Suis les instructions reçues, puis reviens te connecter à
                l’application. Pense aussi à vérifier tes courriers
                indésirables.
              </Text>

              <TextInput
                accessibilityLabel="Code de confirmation"
                style={styles.input}
                placeholder="Code reçu par email"
                placeholderTextColor={C.muted}
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isVerifying}
              />

              {verificationError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {verificationError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isVerifying || !confirmationCode.trim()}
                onPress={() => {
                  void handleVerifyEmail();
                }}
                style={[
                  styles.submitButton,
                  (isVerifying || !confirmationCode.trim()) && styles.pressed,
                ]}
              >
                {isVerifying ? (
                  <ActivityIndicator color={C.text} />
                ) : (
                  <Text style={styles.submitText}>Confirmer mon email</Text>
                )}
              </Pressable>

              <Link href="/(auth)/sign-in" asChild>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.submitText}>Aller à la connexion</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>BIENVENUE DANS LE COLLECTIF</Text>

              <Text style={styles.title}>Crée ton compte.</Text>

              <Text style={styles.description}>
                Ton espace pour retrouver ton équipe, les entraînements et la
                vie du club.
              </Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Prénom</Text>

                  <TextInput
                    accessibilityLabel="Prénom"
                    style={styles.input}
                    placeholder="Mary"
                    placeholderTextColor={C.muted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Nom</Text>

                  <TextInput
                    accessibilityLabel="Nom"
                    style={styles.input}
                    placeholder="Jane"
                    placeholderTextColor={C.muted}
                    value={lastName}
                    onChangeText={setLastName}
                    autoComplete="family-name"
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>

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
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Mot de passe</Text>

                  <TextInput
                    accessibilityLabel="Mot de passe"
                    style={styles.input}
                    placeholder="Au moins 8 caractères"
                    placeholderTextColor={C.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>

                  <TextInput
                    accessibilityLabel="Confirmation du mot de passe"
                    style={styles.input}
                    placeholder="Saisis à nouveau ton mot de passe"
                    placeholderTextColor={C.muted}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleSignUp();
                    }}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => {
                    setShowPassword((value) => !value);
                  }}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.linkText}>
                    {showPassword
                      ? "Masquer les mots de passe"
                      : "Afficher les mots de passe"}
                  </Text>
                </Pressable>

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
                    disabled: isSubmitting,
                  }}
                  disabled={isSubmitting}
                  onPress={() => {
                    void handleSignUp();
                  }}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (pressed || isSubmitting) && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={C.text} />
                  ) : (
                    <Text style={styles.submitText}>Créer mon compte</Text>
                  )}
                </Pressable>

                <View style={styles.signInRow}>
                  <Text style={styles.signInCaption}>Déjà un compte ?</Text>

                  <Link href="/(auth)/sign-in" asChild>
                    <Pressable
                      disabled={isSubmitting}
                      style={styles.signInLink}
                    >
                      <Text style={styles.linkText}>Se connecter</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          )}
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
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
  signInRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
  },
  signInCaption: {
    color: C.muted,
    fontSize: 12,
  },
  signInLink: {
    minHeight: 44,
    justifyContent: "center",
  },
  emailHighlight: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    marginVertical: 16,
  },
  pressed: {
    opacity: 0.65,
  },
});
