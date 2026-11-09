export type EventType = "training" | "match" | "tournament" | "club_event";

export type CalendarEvent = {
  id_event: string;
  type: EventType;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  location_address: string | null;
  location_url: string | null;
  opponent: string | null;
  competition: string | null;
  id_section: string | null;
  created_by: string | null;
};

export type GetEventsParams = {
  id_club: string;
  id_section?: string | null;
  //   from: string;
  //   to: string;
};

export type UserMembership = {
  id_profile: string;
  id_club: string;
  id_section: string | null;
  id_club_member: string | null;
  id_section_member: string | null;
  clubRole: string | null;
  sectionRole: string | null;
  canManageEvents: boolean;
};

export type CreateEventFormValues = {
  title: string;
  type: EventType;
  starts_at: string;
  location_name: string | null;
  description: string | null;
  created_by: string | null;
};

export type CreateEventInput = CreateEventFormValues & {
  id_club: string;
  id_section: string | null;
  created_by: string | null;
};

export type UpdateEventFormValues = {
  // id_event: string;
  title: string;
  type: EventType;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  location_address: string | null;
  location_url: string | null;
  opponent: string | null;
  competition: string | null;
};

export type UpdateEventInput = UpdateEventFormValues & {
  id_event: string;
};

export type TrainingAttendanceStatus =
  | "pending"
  | "present"
  | "late"
  | "absent";

export type TrainingAttendanceRow = {
  id_section_member: string;
  first_name: string | null;
  last_name: string | null;
  team_role: string | null;
  attendance_status: TrainingAttendanceStatus | null;
  attendance_id: string | null;
};
