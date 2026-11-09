export type TeamRole = "player" | "coach" | string;

export type Team = {
  id_section: string;
  name: string;
  season: string | number | null;
  category: string | null;
  team_role: TeamRole;
};

export type TeamsByRole = {
  playerTeams: Team[];
  managedTeams: Team[];
};

export type TeamPlayer = {
  id_section_member: string;
  id_profile: string;
  first_name: string;
  last_name: string;
};

export type RosterRow = {
  id_section: string;
  profile:
    | {
        id_profile: string;
        first_name: string;
        last_name: string;
      }
    | Array<{
        id_profile: string;
        first_name: string;
        last_name: string;
      }>
    | null;
};

export type ManagementModalState =
  | { mode: "add" }
  | { mode: "manage"; member: TeamPlayer }
  | null;

export type ClubMemberCandidate = {
  id_club_member: string;
  id_profile: string;
  first_name: string | null;
  last_name: string | null;
  already_assigned: boolean;
};

export type AddMemberToSectionInput = {
  sectionId: string;
  clubMemberId: string;
  teamRole: string;
};

export type RemovePlayerFromSectionInput = {
  sectionId: string;
  sectionMemberId: string;
};
