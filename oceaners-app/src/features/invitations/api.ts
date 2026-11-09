import { supabase } from "@/lib/supabase";

export async function checkClubCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("check_club_code", {
    p_code: code.trim().toUpperCase(),
  });

  if (error) throw error;

  if (typeof data !== "string") {
    throw new Error("Impossible de retrouver le club.");
  }

  return data;
}

export async function joinClubWithCode(code: string): Promise<string> {
  console.log("Appel join_club_with_code avec :", code);

  const { data, error } = await supabase.rpc("join_club_with_code", {
    p_code: code.trim().toUpperCase(),
  });

  console.log("Réponse join_club_with_code :", { data, error });

  if (error) throw error;

  if (typeof data !== "string") {
    throw new Error("Le serveur n’a pas retourné le club rejoint.");
  }

  return data;
}
