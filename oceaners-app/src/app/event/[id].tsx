import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, router, Stack } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CalendarDays,
  Clock,
  MapPin,
  Info,
  Trophy,
  User,
  Pencil,
  Trash2,
} from "lucide-react-native";

import {
  getEventById,
  getTrainingAttendance,
  removeEvent,
  saveTrainingAttendance,
} from "@/features/calendar/api";
import type { CalendarEvent } from "@/features/calendar/type";
import { useCurrentUserMembership } from "@/features/calendar/useCurrentUserMembership";
import { COLORS, Spacing } from "@/constants/theme";
import { showAlert } from "@/lib/alert";
import { useState } from "react";
import TrainingAttendance from "@/features/calendar/TrainingAttendance";

const TYPE_LABELS: Record<string, string> = {
  training: "Entraînement",
  match: "Match",
  tournament: "Tournoi",
  club_event: "Événement club",
};

const TYPE_COLORS: Record<string, string> = {
  training: COLORS.header,
  match: COLORS.purple,
  tournament: COLORS.lime,
  club_event: COLORS.green,
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const queryClient = useQueryClient();

  const { data: membership, isLoading: isLoadingMembership } =
    useCurrentUserMembership();

  const [trainingSessionId, setTrainingSessionId] = useState<string | null>(
    null,
  );

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id),
    enabled: Boolean(id),
  });

  const {
    data: attendance,
    isLoading: isLoadingAttendance,
    error: attendanceError,
  } = useQuery({
    queryKey: ["training-attendance", id],
    queryFn: () => getTrainingAttendance(id),
    enabled: Boolean(id) && event?.type === "training",
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => removeEvent(eventId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["calendar-events"],
      });

      router.back();
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: saveTrainingAttendance,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["training-attendance", id],
      });
    },
  });

  function canManageEvent(currentEvent: CalendarEvent): boolean {
    if (!membership) return false;

    if (membership.clubRole === "bureau") return true;

    return (
      membership.clubRole === "coach" &&
      membership.id_profile === currentEvent.created_by
    );
  }

  function handleDelete(currentEvent: CalendarEvent) {
    showAlert(
      "Supprimer l’événement",
      "Cette action est définitive. Veux-tu vraiment supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate(currentEvent.id_event),
        },
      ],
    );
  }

  if (isLoading || isLoadingMembership) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.header} />
        <Text style={styles.mutedText}>Chargement de l’événement…</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Impossible de charger cet événement.
        </Text>
      </View>
    );
  }

  console.log({
    membershipSectionMember: membership?.id_section_member,
    attendanceMembers: attendance?.map((row) => row.id_section_member),
  });

  const eventColor = TYPE_COLORS[event.type] ?? COLORS.header;
  const canManage = canManageEvent(event);

  const startsAt = new Date(event.starts_at);
  const endsAt = event.ends_at ? new Date(event.ends_at) : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: TYPE_LABELS[event.type] ?? "Événement",
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(app)/(tabs)/calendar")}
          style={styles.infoRow}
        >
          <Text style={styles.infoText}>← Calendrier</Text>
        </Pressable>
        <View
          style={[styles.typeBadge, { backgroundColor: `${eventColor}1A` }]}
        >
          <Text style={[styles.typeText, { color: eventColor }]}>
            {TYPE_LABELS[event.type] ?? event.type}
          </Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <CalendarDays size={18} color={COLORS.header} />

            <Text style={styles.infoText}>
              {startsAt.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color={COLORS.header} />

            <Text style={styles.infoText}>
              {startsAt.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {endsAt
                ? ` — ${endsAt.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </Text>
          </View>

          {event.location_name && (
            <View style={styles.infoRow}>
              <MapPin size={18} color={COLORS.header} />

              <Text style={styles.infoText}>{event.location_name}</Text>
            </View>
          )}

          {event.opponent && (
            <View style={styles.infoRow}>
              <Trophy size={18} color={COLORS.header} />

              <Text style={styles.infoText}>Adversaire : {event.opponent}</Text>
            </View>
          )}

          {event.created_by && (
            <View style={styles.infoRow}>
              <User size={18} color={COLORS.header} />

              <Text style={styles.infoText}>Créé par un membre du club</Text>
            </View>
          )}
        </View>

        {event.description && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Info size={18} color={COLORS.header} />

              <Text style={styles.sectionTitle}>Description</Text>
            </View>

            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* {event.location_name && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              const query = encodeURIComponent(event.location_name!);
              void Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${query}`,
              );
            }}
          >
            <Text style={styles.secondaryButtonText}>Ouvrir dans Maps</Text>
          </Pressable>
        )}

        {canManage && (
          <View style={styles.actions}>
            <Pressable
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: "/event/edit",
                  params: { id: event.id_event },
                })
              }
            >
              <Pencil size={18} color={COLORS.white} />

              <Text style={styles.editButtonText}>Modifier</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDelete(event)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={18} color={COLORS.error} />
            </Pressable>
          </View>
        )}

        {event.type === "training" &&
          (isLoadingAttendance ? (
            <ActivityIndicator />
          ) : attendanceError ? (
            <Text style={styles.errorText}>
              Impossible de charger les présences : {attendanceError.message}
            </Text>
          ) : (
            <TrainingAttendance
              attendance={attendance ?? []}
              currentSectionMemberId={membership?.id_section_member ?? null}
              canManage={false}
              onSave={(row, status) =>
                saveAttendanceMutation.mutate({
                  eventId: event.id_event,
                  idSectionMember: row.id_section_member,
                  status,
                })
              }
            />
          ))}

        {deleteMutation.isError && (
          <Text style={styles.errorText}>
            {String(deleteMutation.error?.message).includes("FORBIDDEN")
              ? "Tu n’as pas les droits pour supprimer cet événement."
              : "Impossible de supprimer l’événement."}
          </Text>
        )} */}

        {(event.location_name || canManage) && (
          <View style={styles.actions}>
            {event.location_name && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ouvrir le lieu dans Maps"
                style={[styles.actionButton, styles.mapsActionButton]}
                onPress={() => {
                  const query = encodeURIComponent(event.location_name!);

                  void Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${query}`,
                  );
                }}
              >
                <MapPin size={18} color={COLORS.header} />

                <Text style={[styles.actionLabel, styles.mapsActionLabel]}>
                  Maps
                </Text>
              </Pressable>
            )}

            {canManage && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Modifier l’événement"
                  style={[styles.actionButton, styles.editActionButton]}
                  onPress={() =>
                    router.push({
                      pathname: "/event/edit",
                      params: { id: event.id_event },
                    })
                  }
                >
                  <Pencil size={18} color={COLORS.white} />

                  <Text style={[styles.actionLabel, styles.editActionLabel]}>
                    Modifier
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer l’événement"
                  accessibilityState={{ disabled: deleteMutation.isPending }}
                  style={[
                    styles.actionButton,
                    styles.deleteActionButton,
                    deleteMutation.isPending && styles.actionDisabled,
                  ]}
                  onPress={() => handleDelete(event)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.error} />
                  ) : (
                    <Trash2 size={18} color={COLORS.error} />
                  )}

                  <Text style={[styles.actionLabel, styles.deleteActionLabel]}>
                    Supprimer
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}
        {event.type === "training" &&
          (isLoadingAttendance ? (
            <ActivityIndicator />
          ) : attendanceError ? (
            <Text style={styles.errorText}>
              Impossible de charger les présences : {attendanceError.message}
            </Text>
          ) : (
            <TrainingAttendance
              attendance={attendance ?? []}
              currentSectionMemberId={membership?.id_section_member ?? null}
              canManage={false}
              onSave={(row, status) =>
                saveAttendanceMutation.mutate({
                  eventId: event.id_event,
                  idSectionMember: row.id_section_member,
                  status,
                })
              }
            />
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },

  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: COLORS.background,
    padding: Spacing.three,
  },

  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  typeText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: Spacing.two,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.one,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  description: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },

  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.header,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: COLORS.header,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  // actions: {
  //   flexDirection: "row",
  //   alignItems: "stretch",
  //   gap: 8,
  // },

  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.header,
    borderRadius: 14,
    paddingVertical: 14,
  },

  editButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },

  deleteButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.errorBackground,
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

  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  actionLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  mapsActionButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.header,
  },

  mapsActionLabel: {
    color: COLORS.header,
  },

  editActionButton: {
    backgroundColor: COLORS.header,
    borderColor: COLORS.header,
  },

  editActionLabel: {
    color: COLORS.white,
  },

  deleteActionButton: {
    backgroundColor: COLORS.errorBackground,
    borderColor: COLORS.errorBackground,
  },

  deleteActionLabel: {
    color: COLORS.error,
  },

  actionDisabled: {
    opacity: 0.5,
  },
});
