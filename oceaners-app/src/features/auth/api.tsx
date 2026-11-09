import { supabase } from "@/lib/supabase";

export async function fetchCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id_profile, first_name, last_name")
    .eq("id_profile", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
