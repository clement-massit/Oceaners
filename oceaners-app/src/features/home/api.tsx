import { supabase } from "@/lib/supabase";
import { HomeDetails } from "./type";

export async function fetchHomeInfos(
  userId: string,
): Promise<HomeDetails | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id_profile,
      first_name,
      last_name,
      club_members(
        club:clubs(id_club,name),
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
    .maybeSingle<HomeDetails>();

  if (error) {
    throw error;
  }

  return data;
}
