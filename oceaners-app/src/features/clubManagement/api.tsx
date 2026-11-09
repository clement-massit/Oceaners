import { supabase } from "@/lib/supabase";

import type {
  ClubMembership,
  ClubSection,
  ClubMember,
  CreateSectionInput,
  UpdateClubMemberStatusInput,
  ClubMemberDetail,
  RemoveSectionMembershipInput,
  UpsertSectionMembershipInput,
} from "./types";

export async function fetchCurrentUserClubMembership(): Promise<ClubMembership | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("club_members")
    .select(
      `
      id_club_member,
      id_club,
      role,
      status
    `,
    )
    .eq("id_profile", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ClubMembership | null;
}

export async function fetchClubSections(
  clubId: string,
): Promise<ClubSection[]> {
  const { data, error } = await supabase
    .from("sections")
    .select(
      `
      id_section,
      name,
      category,
      season
    `,
    )
    .eq("id_club", clubId)
    .order("name");

  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as ClubSection[];
}

export async function fetchClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from("club_members")
    .select(
      `
      id_club_member,
      role,
      status,
      profile:id_profile (
        id_profile,
        first_name,
        last_name
      )
    `,
    )
    .eq("id_club", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as ClubMember[];
}

export async function createClubSection({
  clubId,
  name,
  category,
  season,
}: CreateSectionInput): Promise<ClubSection> {
  const { data, error } = await supabase
    .from("sections")
    .insert({
      id_club: clubId,
      name,
      category: category?.trim() || null,
      season: season?.trim() || null,
    })
    .select(
      `
      id_section,
      name,
      category,
      season
    `,
    )
    .single();

  if (error) {
    console.log(error);
    throw error;
  }

  return data as unknown as ClubSection;
}

export async function fetchClubMemberDetail(
  clubMemberId: string,
): Promise<ClubMemberDetail> {
  const { data, error } = await supabase
    .from("club_members")
    .select(
      `
      id_club_member,
      role,
      status,
      profile:id_profile (
        id_profile,
        first_name,
        last_name
      ),
      section_members (
        id_section_member,
        id_section,
        team_role,
        status,
        section:id_section (
          id_section,
          name
        )
      )
    `,
    )
    .eq("id_club_member", clubMemberId)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as ClubMemberDetail;
}

export async function updateClubMemberStatus({
  clubMemberId,
  status,
}: UpdateClubMemberStatusInput): Promise<void> {
  const { error } = await supabase
    .from("club_members")
    .update({ status })
    .eq("id_club_member", clubMemberId);

  if (error) {
    throw error;
  }
}

export async function upsertSectionMembership({
  clubMemberId,
  sectionId,
  teamRole,
  status,
}: UpsertSectionMembershipInput): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("section_members")
    .select("id_section_member")
    .eq("id_club_member", clubMemberId)
    .eq("id_section", sectionId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing?.id_section_member) {
    const { error } = await supabase
      .from("section_members")
      .update({
        team_role: teamRole,
        status,
      })
      .eq("id_section_member", existing.id_section_member);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("section_members").insert({
    id_club_member: clubMemberId,
    id_section: sectionId,
    team_role: teamRole,
    status,
  });

  if (error) {
    throw error;
  }
}

export async function removeSectionMembership({
  sectionMemberId,
}: RemoveSectionMembershipInput): Promise<void> {
  const { error } = await supabase
    .from("section_members")
    .delete()
    .eq("id_section_member", sectionMemberId);

  if (error) {
    throw error;
  }
}
