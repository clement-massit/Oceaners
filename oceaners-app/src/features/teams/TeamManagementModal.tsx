import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS as C } from "@/constants/theme";

type TeamManagementModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function TeamManagementModal({
  title,
  subtitle,
  onClose,
  children,
}: TeamManagementModalProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View accessibilityViewIsModal style={styles.card}>
            <View style={styles.header}>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>ESPACE COACH</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>

                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer la fenêtre"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90%",
    borderRadius: 24,
    backgroundColor: C.white,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heading: {
    flex: 1,
    gap: 7,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
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
    lineHeight: 32,
  },
  content: {
    padding: 22,
    gap: 16,
  },
  pressed: {
    opacity: 0.65,
  },
});
