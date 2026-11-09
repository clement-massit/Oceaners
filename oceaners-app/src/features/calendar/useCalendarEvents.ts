// src/features/calendar/hooks/useCalendarEvents.ts
import { useQuery } from "@tanstack/react-query";
import { useCurrentUserMembership } from "./useCurrentUserMembership";
import { getCalendarEvents } from "./api";
import { CalendarEvent } from "./type";

export function useCalendarEvents() {
  // from: string, to: string
  const {
    data: membership,
    isLoading: isLoadingMembership,
    error: membershipError,
  } = useCurrentUserMembership();

  const query = useQuery({
    queryKey: [
      "calendar-events",
      membership?.id_club ?? null,
      // membership?.id_section ?? null,
      //   from,
      //   to,
    ],

    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!membership?.id_club) {
        console.warn(
          "[useCalendarEvents] Pas de membership : requête non exécutée.",
        );
        return [];
      }

      const events = await getCalendarEvents({
        id_club: membership.id_club,
        id_section: membership.id_section,
        // from,
        // to,
      });

      console.log("[useCalendarEvents] Événements reçus :", events.length);

      return events;
    },

    enabled: Boolean(membership?.id_club),

    // Important : ne met pas [] dans le cache
    placeholderData: [],

    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    membership,
    isLoadingMembership,
    membershipError,
  };
}
