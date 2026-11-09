import { supabase } from "@/lib/supabase";

import { UpdatePersonalProfileInput } from "./types";

export async function fetchProfileDetails(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id_profile,
      first_name,
      last_name,
      phone,
      club_members (
        id_club_member,
        club:clubs(id_club,name),
        role,
        status,
        section_members (
          id_section,
          team_role,
          section:sections (
            id_section,
            name,
            season,
            category
          )
        )
      )
    `,
    )
    .eq("id_profile", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePersonalProfile({
  userId,
  firstName,
  lastName,
  phone,
}: UpdatePersonalProfileInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    })
    .eq("id_profile", userId)
    .select("id_profile, first_name, last_name, phone")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function requestEmailChange(email: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: email.trim(),
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function countClubMember() {
  const { count, error } = await supabase
    .from("club_members")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function countSections() {
  const { count, error } = await supabase
    .from("sections")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

// STATS DU PLAYER - TAUX DE PRESENCE
export async function fetchPlayerAttendanceRate() {
  const { data, error } = await supabase.rpc(
    "get_player_global_attendance_rate",
  );

  if (error) throw error;

  return data ?? 0;
}
