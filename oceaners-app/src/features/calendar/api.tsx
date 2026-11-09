// src/features/calendar/api.tsx
import { supabase } from "@/lib/supabase";
import {
  CalendarEvent,
  GetEventsParams,
  EventType,
  CreateEventInput,
  UpdateEventInput,
  TrainingAttendanceRow,
  TrainingAttendanceStatus,
} from "./type";

export async function getCalendarEvents({
  id_club,
  id_section,
  //   from,
  //   to,
}: GetEventsParams): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id_club", id_club)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[getCalendarEvents] Supabase error:", error);
    throw error;
  }

  return (data ?? []) as CalendarEvent[];
}

export async function createEvent(input: CreateEventInput): Promise<void> {
  const { error } = await supabase.from("events").insert(input);

  if (error) throw error;
}

export async function removeEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_event", {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }
}

export async function updateEvent(input: UpdateEventInput): Promise<void> {
  const { error } = await supabase.rpc("update_event", {
    p_event_id: input.id_event,
    p_title: input.title,
    p_type: input.type,
    p_description: input.description,
    p_starts_at: input.starts_at,
    p_ends_at: input.ends_at,
    p_location_name: input.location_name,
    p_location_address: input.location_address,
    p_location_url: input.location_url,
    p_opponent: input.opponent,
    p_competition: input.competition,
  });

  if (error) {
    console.error("[updateEvent] Supabase error:", error);
    throw error;
  }
}

export async function getEventById(eventId: string): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id_event", eventId)
    .maybeSingle();

  if (error) {
    console.error("[getEventById] Supabase error:", error);
    throw error;
  }

  if (!data) {
    throw new Error("EVENT_NOT_FOUND");
  }

  return data as CalendarEvent;
}

// export async function getTrainingAttendance(
//   eventId: string,
// ): Promise<TrainingAttendanceRow[]> {
//   // 1. Récupérer la section liée à l’événement
//   const { data: event, error: eventError } = await supabase
//     .from("events")
//     .select("id_section")
//     .eq("id_event", eventId)
//     .maybeSingle();

//   if (eventError) throw eventError;

//   if (!event?.id_section) {
//     return [];
//   }

//   // 2. Récupérer les membres de la section + leur présence
//   const { data, error } = await supabase
//     .from("section_members")
//     .select(
//       `
//       id_section_member,
//       team_role,
//       club_members (
//         profiles (
//           first_name,
//           last_name
//         )
//       ),
//       training_attendance (
//         id_attendance,
//         status
//       )
//     `,
//     )
//     .eq("id_section", event.id_section)
//     .eq("training_attendance.id_training", eventId);

//   if (error) throw error;

//   return (data ?? []).map((row) => ({
//     id_section_member: row.id_section_member,
//     first_name: row.club_members?.profiles?.first_name ?? null,
//     last_name: row.club_members?.profiles?.last_name ?? null,
//     team_role: row.team_role ?? null,
//     attendance_status: row.training_attendance?.[0]?.status ?? null,
//     attendance_id: row.training_attendance?.[0]?.id_attendance ?? null,
//   }));
// }

export async function getTrainingAttendance(
  eventId: string,
): Promise<TrainingAttendanceRow[]> {
  const { data, error } = await supabase.rpc("get_training_attendance", {
    p_event_id: eventId,
  });

  if (error) {
    console.error("[get_training_attendance]", {
      eventId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw error;
  }

  return (data ?? []) as TrainingAttendanceRow[];
}

export async function saveTrainingAttendance({
  eventId,
  idSectionMember,
  status,
}: {
  eventId: string;
  idSectionMember: string;
  status: TrainingAttendanceStatus;
}): Promise<void> {
  const { error } = await supabase.rpc("save_training_attendance", {
    p_event_id: eventId,
    p_id_section_member: idSectionMember,
    p_status: status,
  });

  if (error) {
    console.error("[saveTrainingAttendance] Supabase error:", error);
    throw error;
  }
}
