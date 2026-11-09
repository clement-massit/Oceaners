export type HomeDetails = {
  id_profile: string;
  first_name: string | null;
  last_name: string | null;

  club_members: Array<{
    club: {
      id_club: string;
      name: string;
    } | null;

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
