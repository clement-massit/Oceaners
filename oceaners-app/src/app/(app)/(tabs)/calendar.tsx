// src/app/(tabs)/calendar.tsx
import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Calendar, MarkedDates } from "react-native-calendars";
import { getLocalDay } from "@/features/calendar/utils";
import { useCalendarEvents } from "@/features/calendar/useCalendarEvents";
import type {
  CalendarEvent,
  CreateEventFormValues,
  UpdateEventInput,
} from "@/features/calendar/type";
import { COLORS, Spacing } from "@/constants/theme";
import { createEvent } from "@/features/calendar/api";
import CreateEventModal from "@/features/calendar/CreateEventModal";
import ManageEventModal from "@/features/calendar/ManageEventModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeEvent, updateEvent } from "@/features/calendar/api";
import { showAlert } from "@/lib/alert";
import { Trash2, SquarePenIcon, Pencil } from "lucide-react-native";

import { Alert } from "react-native";

const TYPE_COLORS: Record<string, string> = {
  training: COLORS.header, // Teal Oceaners
  match: COLORS.purple, // Violet
  tournament: COLORS.lime, // Lime
  club_event: COLORS.green, // Vert
};

const TYPE_LABELS: Record<string, string> = {
  training: "Entraînement",
  match: "Match",
  tournament: "Tournoi",
  club_event: "Événement",
};

function buildMarkedDates(
  events: CalendarEvent[] | undefined,
  selectedDate: string,
): MarkedDates {
  const marked: MarkedDates = {};

  for (const event of events ?? []) {
    const dayEvents = (events ?? []).filter(
      (event) => getLocalDay(event.starts_at) === selectedDate,
    );
    const day = getLocalDay(event.starts_at);
    const eventColor = TYPE_COLORS[event.type] ?? COLORS.header;

    marked[day] = {
      marked: true,
      dotColor: eventColor,
      activeOpacity: 0,
      selected: day === selectedDate,
      selectedColor: COLORS.header,
      selectedTextColor: COLORS.white,
    };
  }

  return marked;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const now = new Date();

  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();

  const {
    data: events,
    isLoading,
    error,
    membership,
    isLoadingMembership,
    membershipError,
  } = useCalendarEvents();

  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [eventToManage, setEventToManage] = useState<CalendarEvent | null>(
    null,
  );

  const createMutation = useMutation({
    mutationFn: async (values: CreateEventFormValues) => {
      if (!membership?.canManageEvents) {
        throw new Error("Tu n’as pas les droits pour créer un événement.");
      }

      return createEvent({
        ...values,
        id_club: membership.id_club,
        id_section: membership.id_section,
        created_by: membership.id_profile,
      });
    },

    onSuccess: () => {
      setIsCreateModalOpen(false);

      void queryClient.invalidateQueries({
        queryKey: ["calendar-events"],
      });
    },
    onError: (mutationError) => {
      console.error("[createMutation] Échec création :", mutationError);
    },
  });

  function canManageEvent(event: CalendarEvent): boolean {
    if (!membership) return false;

    if (membership.clubRole === "bureau") return true;

    return (
      membership.clubRole === "coach" &&
      membership.id_profile === event.created_by
    );
  }

  const updateMutation = useMutation({
    mutationFn: async ({
      event,
      values,
    }: {
      event: CalendarEvent;
      values: Omit<UpdateEventInput, "id_event">;
    }) => {
      if (!membership?.canManageEvents) {
        throw new Error("Tu n’as pas les droits pour modifier cet événement.");
      }

      return updateEvent({
        id_event: event.id_event,
        ...values,
      });
    },

    onSuccess: () => {
      setEventToManage(null);

      void queryClient.invalidateQueries({
        queryKey: ["calendar-events"],
      });
    },
  });

  function openCreateModal() {
    createMutation.reset();
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (createMutation.isPending) return;

    setIsCreateModalOpen(false);
    createMutation.reset();
  }

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => removeEvent(eventId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["calendar-events"],
      });
    },
  });
  function handleDelete(eventId: string) {
    showAlert(
      "Supprimer l’événement",
      "Cette action est définitive. Veux-tu vraiment supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate(eventId),
        },
      ],
    );
  }

  const markedDates = useMemo(
    () => buildMarkedDates(events, selectedDate),
    [events, selectedDate],
  );

  const dayEvents = (events ?? []).filter(
    (event) => event.starts_at.slice(0, 10) === selectedDate,
  );

  if (isLoading || isLoadingMembership) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Chargement du calendrier…</Text>
      </View>
    );
  }

  if (membershipError || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Impossible de charger le calendrier.
        </Text>
      </View>
    );
  }

  if (!membership) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>
          Tu n’es rattaché à aucun club pour le moment.
        </Text>
      </View>
    );
  }

  return (
    // <View style={styles.container}>
    //   <Text style={styles.title}>Calendrier</Text>

    //   {membership?.canManageEvents && (
    //     <Pressable onPress={openCreateModal} style={styles.createButton}>
    //       <Text style={styles.createButtonText}>+ Créer un événement</Text>
    //     </Pressable>
    //   )}

    //   <View style={styles.calendarCard}>
    //     <Calendar
    //       current={selectedDate}
    //       onDayPress={(day) => setSelectedDate(day.dateString)}
    //       markedDates={markedDates}
    //       markingType="dot"
    //       theme={{
    //         calendarBackground: "transparent",
    //         monthTextColor: COLORS.text,
    //         textMonthFontWeight: "700",
    //         textMonthFontSize: 18,
    //         arrowColor: COLORS.header,
    //         dayTextColor: COLORS.text,
    //         textDayFontSize: 15,
    //         textDayFontWeight: "500",
    //         textDisabledColor: "#C3C9D1",
    //         todayTextColor: COLORS.header,
    //         todayBackgroundColor: "rgba(11, 176, 201, 0.10)",
    //         selectedDayBackgroundColor: COLORS.header,
    //         selectedDayTextColor: COLORS.white,
    //         textSectionTitleColor: COLORS.muted,
    //         textDayHeaderFontSize: 12,
    //         textDayHeaderFontWeight: "600",
    //       }}
    //     />
    //   </View>

    //   <Text style={styles.sectionTitle}>
    //     {new Date(selectedDate).toLocaleDateString("fr-FR", {
    //       weekday: "long",
    //       day: "numeric",
    //       month: "long",
    //     })}
    //   </Text>

    //   <FlatList
    //     data={dayEvents}
    //     keyExtractor={(item) => item.id_event}
    //     contentContainerStyle={styles.listContent}
    //     renderItem={({ item }) => {
    //       const eventColor = TYPE_COLORS[item.type] ?? COLORS.header;

    //       return (
    //         <View style={styles.eventCard}>
    //           <View
    //             style={[styles.eventAccent, { backgroundColor: eventColor }]}
    //           />

    //           <View style={styles.eventContent}>
    //             <Pressable
    //               onPress={() => {
    //                 console.log("event:", item.title, {
    //                   clubRole: membership?.clubRole,
    //                   sectionRole: membership?.sectionRole,
    //                   canManageEvents: membership?.canManageEvents,
    //                 });
    //                 router.push({
    //                   pathname: "/event/[id]",
    //                   params: { id: item.id_event },
    //                 });
    //               }}
    //               style={styles.eventPressable}
    //             >
    //               <Text style={[styles.eventType, { color: eventColor }]}>
    //                 {TYPE_LABELS[item.type] ?? item.type}
    //               </Text>

    //               <Text style={styles.eventTitle}>{item.title}</Text>

    //               <Text style={styles.eventMeta}>
    //                 {new Date(item.starts_at).toLocaleDateString("fr-FR", {
    //                   weekday: "short",
    //                   day: "numeric",
    //                   month: "short",
    //                 })}
    //                 {" • "}
    //                 {new Date(item.starts_at).toLocaleTimeString("fr-FR", {
    //                   hour: "2-digit",
    //                   minute: "2-digit",
    //                 })}
    //                 {item.location_name ? ` • ${item.location_name}` : ""}
    //               </Text>
    //             </Pressable>

    //             {membership?.canManageEvents && (
    //               <View style={styles.buttonContainer}>
    //                 {/* <Pressable
    //                   onPress={() => {
    //                     handleDelete(item.id_event);
    //                   }}
    //                   disabled={deleteMutation.isPending}
    //                   style={styles.manageButton}
    //                   hitSlop={8}
    //                 >
    //                   <SquarePenIcon size={18} color={COLORS.header} />
    //                 </Pressable> */}

    //                 {canManageEvent(item) && (
    //                   <Pressable
    //                     onPress={() => setEventToManage(item)}
    //                     disabled={
    //                       updateMutation.isPending || deleteMutation.isPending
    //                     }
    //                     style={styles.manageButton}
    //                     hitSlop={8}
    //                   >
    //                     <Pencil size={18} color={COLORS.header} />
    //                   </Pressable>
    //                 )}
    //                 {canManageEvent(item) && (
    //                   <Pressable
    //                     onPress={() => {
    //                       handleDelete(item.id_event);
    //                     }}
    //                     disabled={deleteMutation.isPending}
    //                     style={styles.deleteButton}
    //                     hitSlop={8}
    //                   >
    //                     <Trash2 size={18} color={COLORS.error} />
    //                   </Pressable>
    //                 )}
    //               </View>
    //             )}
    //           </View>
    //         </View>
    //       );
    //     }}
    //     ListEmptyComponent={
    //       <Text style={styles.mutedText}>Aucun événement ce jour-là.</Text>
    //     }
    //   />
    //   {isCreateModalOpen && membership?.canManageEvents && (
    //     <CreateEventModal
    //       initialDate={selectedDate}
    //       scopeLabel={
    //         membership.id_section
    //           ? "Pour la section sélectionnée"
    //           : "Événement global du club"
    //       }
    //       isPending={createMutation.isPending}
    //       error={
    //         createMutation.isError
    //           ? "Impossible de créer l’événement. Vérifie les champs et tes droits."
    //           : null
    //       }
    //       onClose={closeCreateModal}
    //       onSubmit={(values) => createMutation.mutate(values)}
    //     />
    //   )}
    //   {eventToManage && membership?.canManageEvents && (
    //     <ManageEventModal
    //       key={eventToManage.id_event}
    //       event={eventToManage}
    //       scopeLabel="Modifier l’événement"
    //       isPending={updateMutation.isPending}
    //       error={
    //         updateMutation.isError
    //           ? "Impossible de modifier l’événement."
    //           : null
    //       }
    //       onClose={() => {
    //         if (updateMutation.isPending) return;
    //         setEventToManage(null);
    //         updateMutation.reset();
    //       }}
    //       onSubmit={(values) =>
    //         updateMutation.mutate({
    //           event: eventToManage,
    //           values,
    //         })
    //       }
    //     />
    //   )}
    //   {deleteMutation.isError && (
    //     <Text style={styles.errorText}>
    //       {String(deleteMutation.error?.message).includes("FORBIDDEN")
    //         ? "Tu n’as pas les droits pour supprimer cet événement."
    //         : "Impossible de supprimer l’événement."}
    //     </Text>
    //   )}
    // </View>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Calendrier</Text>

      {membership?.canManageEvents && (
        <Pressable onPress={openCreateModal} style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Créer un événement</Text>
        </Pressable>
      )}

      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="dot"
          theme={{
            calendarBackground: "transparent",
            monthTextColor: COLORS.text,
            textMonthFontWeight: "700",
            textMonthFontSize: 18,
            arrowColor: COLORS.header,
            dayTextColor: COLORS.text,
            textDayFontSize: 15,
            textDayFontWeight: "500",
            textDisabledColor: "#C3C9D1",
            todayTextColor: COLORS.header,
            todayBackgroundColor: "rgba(11, 176, 201, 0.10)",
            selectedDayBackgroundColor: COLORS.header,
            selectedDayTextColor: COLORS.white,
            textSectionTitleColor: COLORS.muted,
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: "600",
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>
        {new Date(selectedDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </Text>

      {dayEvents.length === 0 && (
        <Text style={styles.mutedText}>Aucun événement ce jour-là.</Text>
      )}

      {dayEvents.map((item) => {
        const eventColor = TYPE_COLORS[item.type] ?? COLORS.header;

        return (
          <View key={item.id_event} style={styles.eventCard}>
            <View
              style={[styles.eventAccent, { backgroundColor: eventColor }]}
            />

            <View style={styles.eventContent}>
              <Pressable
                style={styles.eventPressable}
                onPress={() =>
                  router.push({
                    pathname: "/event/[id]",
                    params: { id: item.id_event },
                  })
                }
              >
                <Text style={[styles.eventType, { color: eventColor }]}>
                  {TYPE_LABELS[item.type] ?? item.type}
                </Text>

                <Text style={styles.eventTitle}>
                  {item.opponent
                    ? `${item.title} • ${item.opponent}`
                    : `${item.title}`}
                </Text>

                <Text style={styles.eventMeta}>
                  {new Date(item.starts_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {item.location_name ? ` • ${item.location_name}` : ""}
                </Text>
              </Pressable>

              {membership?.canManageEvents && canManageEvent(item) && (
                <View style={styles.buttonContainer}>
                  <Pressable
                    onPress={() => setEventToManage(item)}
                    disabled={
                      updateMutation.isPending || deleteMutation.isPending
                    }
                    style={styles.manageButton}
                    hitSlop={8}
                  >
                    <Pencil size={18} color={COLORS.header} />
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(item.id_event)}
                    disabled={deleteMutation.isPending}
                    style={styles.deleteButton}
                    hitSlop={8}
                  >
                    <Trash2 size={18} color={COLORS.error} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {isCreateModalOpen && membership?.canManageEvents && (
        <CreateEventModal
          initialDate={selectedDate}
          scopeLabel={
            membership.id_section
              ? "Pour la section sélectionnée"
              : "Événement global du club"
          }
          isPending={createMutation.isPending}
          error={
            createMutation.isError
              ? "Impossible de créer l’événement. Vérifie les champs et tes droits."
              : null
          }
          onClose={closeCreateModal}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
      {eventToManage && membership?.canManageEvents && (
        <ManageEventModal
          key={eventToManage.id_event}
          event={eventToManage}
          scopeLabel="Modifier l’événement"
          isPending={updateMutation.isPending}
          error={
            updateMutation.isError
              ? "Impossible de modifier l’événement."
              : null
          }
          onClose={() => {
            if (updateMutation.isPending) return;
            setEventToManage(null);
            updateMutation.reset();
          }}
          onSubmit={(values) =>
            updateMutation.mutate({
              event: eventToManage,
              values,
            })
          }
        />
      )}
      {deleteMutation.isError && (
        <Text style={styles.errorText}>
          {String(deleteMutation.error?.message).includes("FORBIDDEN")
            ? "Tu n’as pas les droits pour supprimer cet événement."
            : "Impossible de supprimer l’événement."}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // paddingHorizontal: Spacing.three,
    // paddingTop: Spacing.four,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: Spacing.three,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: Spacing.three,
    marginTop: Spacing.five,
  },

  calendarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#0B0F19",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sectionTitle: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textTransform: "capitalize",
  },

  listContent: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },

  buttonContainer: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  eventCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  eventAccent: {
    width: 6,
  },

  eventContent: {
    flex: 1,
    padding: Spacing.three,
  },

  eventType: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  eventTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  eventMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },
  eventPressable: {
    flex: 1,
  },

  mutedText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
  },

  errorText: {
    color: COLORS.error,
    fontSize: 15,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: COLORS.header,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: Spacing.three,
    alignItems: "center",
  },

  createButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },

  deleteButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.errorBackground,
  },

  deleteButtonText: {
    color: COLORS.error,
    fontWeight: "700",
    fontSize: 13,
  },

  manageButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.buttonBackground,
  },
});
