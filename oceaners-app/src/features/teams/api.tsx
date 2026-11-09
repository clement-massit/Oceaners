import { supabase } from "@/lib/supabase";

import type {
  Team,
  TeamsByRole,
  TeamPlayer,
  RosterRow,
  ClubMemberCandidate,
  RemovePlayerFromSectionInput,
  AddMemberToSectionInput,
} from "./types";

type ProfileTeamsResponse = {
  club_members: Array<{
    role: string | null;
    id_club: string;
    section_members: Array<{
      id_section: string;
      team_role: string | null;
      section: {
        id_section: string;
        name: string;
        season: string | number | null;
        category: string | null;
      } | null;
    }> | null;
  }> | null;
};

export async function fetchUserTeams(userId: string): Promise<TeamsByRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id_profile,
      club_members (
        id_club_member,
        id_club,
        role,
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
    .maybeSingle<ProfileTeamsResponse>();

  if (error) {
    throw error;
  }
  console.log("[fetchUserTeams] raw profile:", JSON.stringify(data, null, 2));

  const memberships = data?.club_members ?? [];

  const playerTeamsById = new Map<string, Team>();
  const managedTeamsById = new Map<string, Team>();

  // Les sections auxquelles l'utilisateur est directement rattaché.
  for (const membership of memberships) {
    for (const sectionMembership of membership.section_members ?? []) {
      const section = sectionMembership.section;

      if (!section) {
        continue;
      }

      const team: Team = {
        id_section: section.id_section,
        name: section.name,
        season: section.season,
        category: section.category,
        team_role: sectionMembership.team_role ?? "member",
      };

      if (sectionMembership.team_role === "player") {
        playerTeamsById.set(section.id_section, team);
      }

      if (sectionMembership.team_role === "coach") {
        managedTeamsById.set(section.id_section, team);
      }
    }
  }

  // Les clubs dans lesquels l'utilisateur appartient au bureau.
  const bureauClubIds = [
    ...new Set(
      memberships
        .filter((membership) => membership.role === "bureau")
        .map((membership) => membership.id_club),
    ),
  ];

  // Le bureau voit toutes les sections de ces clubs,
  // même sans ligne personnelle dans section_members.
  if (bureauClubIds.length > 0) {
    const { data: clubSections, error: clubSectionsError } = await supabase
      .from("sections")
      .select("id_section, name, season, category")
      .in("id_club", bureauClubIds)
      .order("name");

    if (clubSectionsError) {
      throw clubSectionsError;
    }

    for (const section of clubSections ?? []) {
      // Si l'utilisateur est déjà coach de cette section,
      // on conserve son rôle réel plutôt que de l'écraser.
      if (managedTeamsById.has(section.id_section)) {
        continue;
      }

      managedTeamsById.set(section.id_section, {
        id_section: section.id_section,
        name: section.name,
        season: section.season,
        category: section.category,
        team_role: "bureau",
      });
    }
  }

  const sortByName = (a: Team, b: Team) => a.name.localeCompare(b.name, "fr");

  return {
    playerTeams: Array.from(playerTeamsById.values()).sort(sortByName),
    managedTeams: Array.from(managedTeamsById.values()).sort(sortByName),
  };
}

export async function fetchTeamRoster(
  sectionId: string,
): Promise<TeamPlayer[]> {
  const { data, error } = await supabase
    .from("section_members")
    .select(
      `
      id_section_member,
      club_members (
        id_club_member,
        profile:profiles (
            id_profile,
            first_name,
            last_name
        )
    )
      
    `,
    )
    .eq("id_section", sectionId);

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((member) => {
    const clubMember = Array.isArray(member.club_members)
      ? member.club_members[0]
      : member.club_members;

    const profile = Array.isArray(clubMember?.profile)
      ? clubMember.profile[0]
      : clubMember?.profile;

    if (!profile?.id_profile) {
      return [];
    }

    return {
      id_section_member: member.id_section_member,
      id_profile: profile.id_profile ?? "",
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
    };
  });
}

export async function fetchSectionMemberCandidates(
  sectionId: string,
): Promise<ClubMemberCandidate[]> {
  const { data, error } = await supabase.rpc("get_section_member_candidates", {
    p_section_id: sectionId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function addMemberToSection({
  sectionId,
  clubMemberId,
  teamRole,
}: AddMemberToSectionInput): Promise<string> {
  const { data, error } = await supabase.rpc("add_player_to_section", {
    p_section_id: sectionId,
    p_club_member_id: clubMemberId,
    p_team_role: teamRole,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("Le serveur n’a pas confirmé le rattachement du membre.");
  }

  return data;
}

export async function removePlayerFromSection({
  sectionId,
  sectionMemberId,
}: RemovePlayerFromSectionInput): Promise<string> {
  const { data, error } = await supabase.rpc("remove_player_from_section", {
    p_section_id: sectionId,
    p_section_member_id: sectionMemberId,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("Le serveur n’a pas confirmé le retrait du membre.");
  }

  return data;
}
