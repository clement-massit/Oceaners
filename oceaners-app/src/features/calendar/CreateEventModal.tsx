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

import { COLORS } from "@/constants/theme";
import type { CalendarEvent, CreateEventFormValues, EventType } from "./type";
import { parseLocalDate } from "./utils";
import DateTimeField from "./DateTimeField";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "training", label: "Entraînement" },
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournoi" },
  { value: "club_event", label: "Événement club" },
];

type Props = {
  initialDate: string;
  scopeLabel: string;
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: CreateEventFormValues) => void;
};

export default function CreateEventModal({
  initialDate,
  scopeLabel,
  isPending,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("training");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [startsAt, setStartsAt] = useState<Date>(() => {
    const parsed = new Date(`${initialDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  function handleSubmit() {
    if (isPending) return;

    setValidationError(null);

    if (!title.trim()) {
      setValidationError("Indique un titre.");
      return;
    }

    if (!location.trim()) {
      setValidationError("Indique un lieu.");
      return;
    }

    // const startsAt = parseLocalDate(date, time);

    if (!startsAt) {
      setValidationError(
        "Indique une date AAAA-MM-JJ et une heure HH:mm valides.",
      );
      return;
    }

    onSubmit({
      title: title.trim(),
      type,
      starts_at: startsAt.toISOString(),
      location_name: location.trim() || null,
      description: description.trim() || null,
      created_by: null,
    });
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isPending) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.title}>Créer un événement</Text>
              <Text style={styles.subtitle}>{scopeLabel}</Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isPending}
              accessibilityLabel="Fermer la popup"
              hitSlop={12}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.form}
          >
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex. Entraînement collectif"
              placeholderTextColor={COLORS.muted}
              editable={!isPending}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.types}>
              {EVENT_TYPES.map((option) => (
                <Pressable
                  key={option.value}
                  disabled={isPending}
                  onPress={() => setType(option.value)}
                  style={[
                    styles.chip,
                    type === option.value && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      type === option.value && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* <Text style={styles.label}>Date — AAAA-MM-JJ</Text> */}
            {/* <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-11-05"
              placeholderTextColor={COLORS.muted}
              editable={!isPending}
              maxLength={10}
            /> */}
            <DateTimeField
              label="Date"
              mode="date"
              value={startsAt}
              onChange={setStartsAt}
            />

            {/* <Text style={styles.label}>Heure — HH:mm</Text> */}
            {/* <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="19:00"
              placeholderTextColor={COLORS.muted}
              editable={!isPending}
              maxLength={5}
            /> */}
            <DateTimeField
              label="Heure"
              mode="time"
              value={startsAt}
              onChange={setStartsAt}
            />

            <Text style={styles.label}>Lieu</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Terrain, gymnase…"
              placeholderTextColor={COLORS.muted}
              editable={!isPending}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.description]}
              value={description}
              onChangeText={setDescription}
              placeholder="Informations utiles pour les joueurs"
              placeholderTextColor={COLORS.muted}
              multiline
              editable={!isPending}
            />

            {(validationError || error) && (
              <Text style={styles.error}>{validationError || error}</Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={isPending}
              style={[styles.button, isPending && styles.disabled]}
            >
              {isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Créer l’événement</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(32, 33, 36, 0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heading: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  subtitle: { marginTop: 4, fontSize: 13, color: COLORS.muted },
  close: { fontSize: 20, color: COLORS.muted },
  form: { padding: 20, gap: 10 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
  },
  description: { minHeight: 90, textAlignVertical: "top" },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  chipSelected: { backgroundColor: COLORS.header },
  chipText: { color: COLORS.muted, fontWeight: "600", fontSize: 12 },
  chipTextSelected: { color: COLORS.white },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.header,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  error: { color: COLORS.error, fontSize: 13 },
});
