export type ClubMembership = {
  id_club_member: string;
  id_club: string;
  role: string;
  status: string | null;
};

export type ClubSection = {
  id_section: string;
  name: string;
  category: string | null;
  season: string | null;
};

export type ClubMemberProfile = {
  id_profile: string;
  first_name: string | null;
  last_name: string | null;
};

export type ClubMember = {
  id_club_member: string;
  role: string;
  status: string | null;
  profile: ClubMemberProfile | null;
};

export type CreateSectionInput = {
  clubId: string;
  name: string;
  category?: string | null;
  season?: string | null;
};

export type UpdateClubMemberStatusInput = {
  clubMemberId: string;
  status: string;
};

export type SectionMembership = {
  id_section_member: string;
  id_section: string;
  team_role: string;
  status: string | null;
  // position: string | null;
  section: {
    id_section: string;
    name: string;
  } | null;
};

export type ClubMemberDetail = ClubMember & {
  section_members: SectionMembership[];
};

export type UpsertSectionMembershipInput = {
  clubMemberId: string;
  sectionId: string;
  teamRole: string;
  status: string;
  // position: string | null;
};

export type RemoveSectionMembershipInput = {
  sectionMemberId: string;
};
