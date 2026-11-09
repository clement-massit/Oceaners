// src/features/calendar/hooks/useCurrentUserMembership.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserMembership } from "./type";

export function useCurrentUserMembership() {
  return useQuery({
    queryKey: ["current-user-membership"],

    queryFn: async (): Promise<UserMembership | null> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id_profile,
          club_members (
            id_club,
            id_club_member,
            role,
            section_members (
              id_section_member,
              id_section,
              team_role
            )
          )
        `,
        )
        .eq("id_profile", user.id)
        .maybeSingle();

      if (error) throw error;

      const clubMember = data?.club_members?.[0];
      if (!clubMember) return null;

      const sectionMember = clubMember.section_members?.[0] ?? null;

      const clubRole = clubMember.role ?? null;
      const sectionRole = sectionMember?.team_role ?? null;

      const canManageEvents =
        clubRole === "bureau" ||
        (clubRole === "coach" && sectionRole === "coach");

      return {
        id_profile: user.id,
        id_club: clubMember.id_club,
        id_section: sectionMember?.id_section ?? null,
        id_club_member: clubMember.id_club_member,
        id_section_member: sectionMember?.id_section_member ?? null,
        clubRole,
        sectionRole,
        canManageEvents,
      };
    },

    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
