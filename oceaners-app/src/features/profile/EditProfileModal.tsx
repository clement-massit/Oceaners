import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { COLORS as C } from "@/constants/theme";

import { requestEmailChange, updatePersonalProfile } from "./api";

type EditProfileModalProps = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  onClose: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export function EditProfileModal({
  userId,
  firstName,
  lastName,
  phone,
  email,
  onClose,
}: EditProfileModalProps) {
  const queryClient = useQueryClient();

  const [firstNameInput, setFirstNameInput] = useState(firstName ?? "");
  const [lastNameInput, setLastNameInput] = useState(lastName ?? "");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [emailInput, setEmailInput] = useState(email ?? "");

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const profileMutation = useMutation({
    mutationFn: updatePersonalProfile,
    retry: false,
  });

  const emailMutation = useMutation({
    mutationFn: requestEmailChange,
    retry: false,
  });

  const isBusy = profileMutation.isPending || emailMutation.isPending;

  const hasEmailChanged = emailInput.trim() !== (email ?? "").trim();

  const handleClose = () => {
    if (!isBusy) {
      onClose();
    }
  };

  const handleSaveProfile = async () => {
    if (isBusy) return;

    setProfileError(null);
    setProfileMessage(null);

    if (!firstNameInput.trim() || !lastNameInput.trim()) {
      setProfileError("Renseigne ton prénom et ton nom.");
      return;
    }

    try {
      await profileMutation.mutateAsync({
        userId,
        firstName: firstNameInput,
        lastName: lastNameInput,
        phone: phoneInput,
      });
    } catch (error: unknown) {
      setProfileError(
        getErrorMessage(error, "Impossible d’enregistrer ton profil."),
      );
      return;
    }

    setProfileMessage("Tes informations ont été enregistrées.");

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["profile-details", userId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["team-roster"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["section-member-candidates"],
      }),
    ]);

    handleClose();
  };

  const handleChangeEmail = async () => {
    if (isBusy || !hasEmailChanged) return;

    setEmailError(null);
    setEmailMessage(null);

    const cleanEmail = emailInput.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Renseigne une adresse email valide.");
      return;
    }

    try {
      const updatedUser = await emailMutation.mutateAsync(cleanEmail);

      if (updatedUser.email === cleanEmail) {
        setEmailMessage("Ton adresse email a été modifiée.");
      } else {
        setEmailMessage(
          "La demande a été envoyée. Vérifie les messages reçus " +
            "sur ton ancienne et ta nouvelle adresse pour confirmer " +
            "le changement. Ton email de connexion reste inchangé " +
            "jusqu’à sa validation.",
        );
      }
    } catch (error: unknown) {
      setEmailError(
        getErrorMessage(error, "Impossible de demander le changement d’email."),
      );
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View accessibilityViewIsModal style={styles.modalCard}>
            <View style={styles.header}>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>MON COMPTE</Text>
                <Text style={styles.title}>Modifier mon profil</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer le formulaire"
                disabled={isBusy}
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Informations personnelles
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    accessibilityLabel="Prénom"
                    value={firstNameInput}
                    onChangeText={setFirstNameInput}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    editable={!isBusy}
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    accessibilityLabel="Nom"
                    value={lastNameInput}
                    onChangeText={setLastNameInput}
                    autoComplete="family-name"
                    autoCapitalize="words"
                    editable={!isBusy}
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Téléphone de contact</Text>
                  <TextInput
                    accessibilityLabel="Téléphone de contact"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor={C.muted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!isBusy}
                    style={styles.input}
                  />
                  <Text style={styles.secondary}>
                    Facultatif. Ce numéro ne modifie pas ton mode de connexion.
                  </Text>
                </View>

                {profileError ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {profileError}
                  </Text>
                ) : null}

                {profileMessage ? (
                  <Text style={styles.success}>{profileMessage}</Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => {
                    void handleSaveProfile();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    styles.primaryButton,
                    (pressed || isBusy) && styles.pressed,
                  ]}
                >
                  {profileMutation.isPending ? (
                    <ActivityIndicator color={C.text} />
                  ) : (
                    <Text style={styles.primaryText}>
                      Enregistrer mes informations
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* <View style={styles.emailSection}>
                <Text style={styles.sectionTitle}>Email de connexion</Text>

                <Text style={styles.secondary}>
                  Adresse actuelle : {email || "Non renseignée"}
                </Text>

                <TextInput
                  accessibilityLabel="Nouvelle adresse email"
                  value={emailInput}
                  onChangeText={(value) => {
                    setEmailInput(value);
                    setEmailError(null);
                    setEmailMessage(null);
                  }}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  style={styles.input}
                />

                {emailError ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {emailError}
                  </Text>
                ) : null}

                {emailMessage ? (
                  <Text style={styles.secondary}>{emailMessage}</Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy || !hasEmailChanged}
                  onPress={() => {
                    void handleChangeEmail();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    styles.secondaryButton,
                    (pressed || isBusy || !hasEmailChanged) && styles.pressed,
                  ]}
                >
                  {emailMutation.isPending ? (
                    <ActivityIndicator color={C.purple} />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Demander le changement d’email
                    </Text>
                  )}
                </Pressable>
              </View> */}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(11, 29, 42, 0.65)",
  },
  keyboard: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90%",
    borderRadius: 24,
    backgroundColor: C.white,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heading: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    color: C.purple,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: C.text,
    fontSize: 22,
    fontWeight: "800",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: C.text,
    fontSize: 28,
  },
  content: {
    padding: 22,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  emailSection: {
    gap: 14,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
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
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.text,
    fontSize: 15,
  },
  secondary: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: C.lime,
  },
  primaryText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: C.border,
  },
  secondaryButtonText: {
    color: C.purple,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    color: C.error,
    fontSize: 12,
    lineHeight: 18,
  },
  success: {
    color: "#087F5B",
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.65,
  },
});
