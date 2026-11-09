import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getEventById, updateEvent } from "@/features/calendar/api";
import type {
  CalendarEvent,
  EventType,
  UpdateEventFormValues,
} from "@/features/calendar/type";
import { useCurrentUserMembership } from "@/features/calendar/useCurrentUserMembership";
import DateTimeField from "@/features/calendar/DateTimeField";
import { COLORS, Spacing } from "@/constants/theme";
import { ArrowLeft } from "lucide-react-native";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "training", label: "Entraînement" },
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournoi" },
  { value: "club_event", label: "Événement club" },
];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const queryClient = useQueryClient();

  const { data: membership, isLoading: isLoadingMembership } =
    useCurrentUserMembership();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id),
    enabled: Boolean(id),
  });

  const [form, setForm] = useState<UpdateEventFormValues | null>(null);

  function initializeForm(currentEvent: CalendarEvent) {
    if (form) return form;

    return {
      title: currentEvent.title,
      type: currentEvent.type,
      description: currentEvent.description ?? "",
      starts_at: currentEvent.starts_at,
      ends_at: currentEvent.ends_at,
      location_name: currentEvent.location_name ?? "",
      location_address: currentEvent.location_address ?? "",
      location_url: currentEvent.location_url ?? "",
      opponent: currentEvent.opponent ?? "",
      competition: currentEvent.competition ?? "",
    };
  }

  const currentForm = event ? initializeForm(event) : null;

  const updateMutation = useMutation({
    mutationFn: (values: UpdateEventFormValues) => {
      if (!membership) {
        throw new Error("Tu n’as pas les droits pour modifier cet événement.");
      }

      if (membership.clubRole !== "bureau") {
        const isCoachOwner =
          membership.clubRole === "coach" &&
          membership.id_profile === event?.created_by;

        if (!isCoachOwner) {
          throw new Error(
            "Tu ne peux modifier que les événements que tu as créés.",
          );
        }
      }

      return updateEvent({
        id_event: event!.id_event,
        ...values,
      });
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["event", id],
      });

      void queryClient.invalidateQueries({
        queryKey: ["calendar-events"],
      });

      router.back();
    },
  });

  function updateField<K extends keyof UpdateEventFormValues>(
    field: K,
    value: UpdateEventFormValues[K],
  ) {
    if (!currentForm) return;

    setForm({
      ...currentForm,
      [field]: value,
    });
  }

  if (isLoading || isLoadingMembership) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.header} />
        <Text style={styles.mutedText}>Chargement de l’événement…</Text>
      </View>
    );
  }

  if (error || !event || !currentForm) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Impossible de charger cet événement.
        </Text>
      </View>
    );
  }

  const canEdit =
    membership?.clubRole === "bureau" ||
    (membership?.clubRole === "coach" &&
      membership?.id_profile === event.created_by);

  if (!canEdit) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Tu ne peux modifier que les événements que tu as créés.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Modifier l’événement",
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(app)/(tabs)/calendar")}
          style={styles.infoRow}
        >
          <ArrowLeft size={18} />
          <Text style={styles.infoText}>Calendrier</Text>
        </Pressable>
        <Text style={styles.label}>Titre</Text>

        <TextInput
          style={styles.input}
          value={currentForm.title}
          onChangeText={(value) => updateField("title", value)}
          placeholder="Titre de l’événement"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Type</Text>

        <View style={styles.types}>
          {EVENT_TYPES.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => updateField("type", option.value)}
              style={[
                styles.chip,
                currentForm.type === option.value && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  currentForm.type === option.value && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <DateTimeField
          label="Début"
          mode="date"
          value={new Date(currentForm.starts_at)}
          onChange={(date) =>
            updateField(
              "starts_at",
              mergeDateAndTime(currentForm.starts_at, date).toISOString(),
            )
          }
        />

        <DateTimeField
          label="Heure de début"
          mode="time"
          value={new Date(currentForm.starts_at)}
          onChange={(date) =>
            updateField(
              "starts_at",
              mergeDateAndTime(currentForm.starts_at, date).toISOString(),
            )
          }
        />

        {/* <DateTimeField
          label="Date de fin"
          mode="date"
          value={
            currentForm.ends_at ? new Date(currentForm.ends_at) : new Date()
          }
          onChange={(date) =>
            updateField(
              "ends_at",
              currentForm.ends_at
                ? mergeDateAndTime(currentForm.ends_at, date).toISOString()
                : date.toISOString(),
            )
          }
        />

        <DateTimeField
          label="Heure de fin"
          mode="time"
          value={
            currentForm.ends_at ? new Date(currentForm.ends_at) : new Date()
          }
          onChange={(date) =>
            updateField(
              "ends_at",
              currentForm.ends_at
                ? mergeDateAndTime(currentForm.ends_at, date).toISOString()
                : date.toISOString(),
            )
          }
        /> */}

        <Text style={styles.label}>Lieu</Text>

        <TextInput
          style={styles.input}
          value={currentForm.location_name ?? ""}
          onChangeText={(value) => updateField("location_name", value)}
          placeholder="Nom du lieu"
          placeholderTextColor={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          value={currentForm.location_address ?? ""}
          onChangeText={(value) => updateField("location_address", value)}
          placeholder="Adresse"
          placeholderTextColor={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          value={currentForm.location_url ?? ""}
          onChangeText={(value) => updateField("location_url", value)}
          placeholder="Lien Maps ou site"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Match / compétition</Text>

        <TextInput
          style={styles.input}
          value={currentForm.opponent ?? ""}
          onChangeText={(value) => updateField("opponent", value)}
          placeholder="Adversaire"
          placeholderTextColor={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          value={currentForm.competition ?? ""}
          onChangeText={(value) => updateField("competition", value)}
          placeholder="Compétition"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Description</Text>

        <TextInput
          style={[styles.input, styles.description]}
          value={currentForm.description ?? ""}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Informations pour les joueurs"
          placeholderTextColor={COLORS.muted}
          multiline
        />

        {updateMutation.isError && (
          <Text style={styles.errorText}>{updateMutation.error.message}</Text>
        )}

        <Pressable
          style={[
            styles.submitButton,
            updateMutation.isPending && styles.disabled,
          ]}
          onPress={() => updateMutation.mutate(currentForm)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              Enregistrer les modifications
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

function mergeDateAndTime(currentIsoDate: string, selectedDate: Date): Date {
  const current = new Date(currentIsoDate);
  const next = new Date(selectedDate);

  next.setHours(current.getHours(), current.getMinutes(), 0, 0);

  return next;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: COLORS.background,
    padding: Spacing.three,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: Spacing.one,
  },

  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.text,
  },

  description: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  types: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipSelected: {
    backgroundColor: COLORS.header,
    borderColor: COLORS.header,
  },

  chipText: {
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
  },

  chipTextSelected: {
    color: COLORS.white,
  },

  submitButton: {
    marginTop: Spacing.three,
    backgroundColor: COLORS.header,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  submitButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },

  errorText: {
    color: COLORS.error,
    textAlign: "center",
    fontSize: 14,
  },

  mutedText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },

  infoText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
});
