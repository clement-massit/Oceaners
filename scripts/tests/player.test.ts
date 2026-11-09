import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const anon: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let playerClient: SupabaseClient;

const run = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const playerEmail = `${run}@test.oceaners.dev`;
const otherPlayerEmail = `${run}_other@test.oceaners.dev`;

// const email = "joueur.test@oceaners.app";
const password = "testoceaners";

let playerId: string;
let otherPlayerId: string;

let clubId: string;
let otherClubId: string;

let sectionId: string;
let otherSectionId: string;

let playerClubMemberId: string;
let otherPlayerClubMemberId: string;

let playerSectionMemberId: string;
let otherPlayerSectionMemberId: string;

let trainingId: string;
let otherTrainingId: string;
let otherAttendanceId: string;

async function createTestUser(
  email: string,
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
  },
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
    },
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();

  return data.user!.id;
}

async function deleteUser(userId: string) {
  await admin.auth.admin.deleteUser(userId);
}
beforeAll(async () => {
  // Users
  playerId = await createTestUser(playerEmail, {
    first_name: "Joueur",
    last_name: "Test",
    phone: "+33600000001",
  });

  otherPlayerId = await createTestUser(otherPlayerEmail, {
    first_name: "Autre",
    last_name: "Joueur",
    phone: "+33600000002",
  });

  // Clubs
  const { data: clubs, error: clubsError } = await admin
    .from("clubs")
    .insert([
      {
        name: `Oceaners Test ${run}`,
        slug: `oceaners-test-${run}`,
        city: "Arcachon",
      },
      {
        name: `Autre Club Test ${run}`,
        slug: `autre-club-test-${run}`,
        city: "Bordeaux",
      },
    ])
    .select("id_club");

  expect(clubsError).toBeNull();
  expect(clubs).toHaveLength(2);

  clubId = clubs![0].id_club;
  otherClubId = clubs![1].id_club;

  // Club memberships
  const { data: memberships, error: membershipsError } = await admin
    .from("club_members")
    .insert([
      {
        id_club: clubId,
        id_profile: playerId,
        role: "player",
        status: "active",
      },
      {
        id_club: clubId,
        id_profile: otherPlayerId,
        role: "player",
        status: "active",
      },
    ])
    .select("id_club_member, id_profile");

  expect(membershipsError).toBeNull();
  expect(memberships).toHaveLength(2);

  playerClubMemberId = memberships!.find(
    (m) => m.id_profile === playerId,
  )!.id_club_member;

  otherPlayerClubMemberId = memberships!.find(
    (m) => m.id_profile === otherPlayerId,
  )!.id_club_member;

  // Sections
  const { data: sections, error: sectionsError } = await admin
    .from("sections")
    .insert([
      {
        id_club: clubId,
        name: "Seniors",
        category: "Senior",
        season: "2026-2027",
      },
      {
        id_club: clubId,
        name: "U18",
        category: "U18",
        season: "2026-2027",
      },
    ])
    .select("id_section, name");

  expect(sectionsError).toBeNull();
  expect(sections).toHaveLength(2);

  sectionId = sections!.find((s) => s.name === "Seniors")!.id_section;
  otherSectionId = sections!.find((s) => s.name === "U18")!.id_section;

  // Section memberships
  const { data: sectionMembers, error: sectionMembersError } = await admin
    .from("section_members")
    .insert([
      {
        id_section: sectionId,
        id_club_member: playerClubMemberId,
        team_role: "player",
        status: "active",
      },
      {
        id_section: sectionId,
        id_club_member: otherPlayerClubMemberId,
        team_role: "player",
        status: "active",
      },
    ])
    .select("id_section_member, id_club_member");

  expect(sectionMembersError).toBeNull();
  expect(sectionMembers).toHaveLength(2);

  playerSectionMemberId = sectionMembers!.find(
    (sm) => sm.id_club_member === playerClubMemberId,
  )!.id_section_member;

  otherPlayerSectionMemberId = sectionMembers!.find(
    (sm) => sm.id_club_member === otherPlayerClubMemberId,
  )!.id_section_member;

  // Trainings
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setHours(19, 30, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setHours(21, 0, 0, 0);

  const { data: trainings, error: trainingsError } = await admin
    .from("training_sessions")
    .insert([
      {
        id_section: sectionId,
        title: "Entraînement joueur",
        description: "Séance normale",
        location: "Gymnase André Égron",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
      {
        id_section: otherSectionId,
        title: "Entraînement autre section",
        description: "Ne doit pas être visible par le joueur",
        location: "Autre gymnase",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
    ])
    .select("id_training, title");

  expect(trainingsError).toBeNull();
  expect(trainings).toHaveLength(2);

  trainingId = trainings!.find(
    (t) => t.title === "Entraînement joueur",
  )!.id_training;

  otherTrainingId = trainings!.find(
    (t) => t.title === "Entraînement autre section",
  )!.id_training;

  const { data: otherAttendanceRows, error: otherAttendanceError } = await admin
    .from("training_attendance")
    .insert({
      id_training: trainingId,
      id_section_member: otherPlayerSectionMemberId,
      status: "pending",
    })
    .select("id_attendance, status");

  expect(otherAttendanceError).toBeNull();
  expect(otherAttendanceRows).toHaveLength(1);

  otherAttendanceId = otherAttendanceRows![0].id_attendance;

  // Sign in as player
  const { data: signInData, error: signInError } =
    await admin.auth.signInWithPassword({
      email: playerEmail,
      password: password,
    });

  expect(signInError).toBeNull();
  expect(signInData.session).not.toBeNull();

  playerClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${signInData.session!.access_token}`,
      },
    },
  });
});

afterAll(async () => {
  // Delete in dependency-friendly order.
  await admin
    .from("training_attendance")
    .delete()
    .in("id_training", [trainingId, otherTrainingId]);

  await admin
    .from("training_sessions")
    .delete()
    .in("id_training", [trainingId, otherTrainingId]);

  await admin
    .from("section_members")
    .delete()
    .in("id_section", [sectionId, otherSectionId]);

  await admin
    .from("sections")
    .delete()
    .in("id_section", [sectionId, otherSectionId]);

  await admin
    .from("club_members")
    .delete()
    .in("id_club", [clubId, otherClubId]);

  await admin.from("clubs").delete().in("id_club", [clubId, otherClubId]);

  await admin
    .from("profiles")
    .delete()
    .in("id_profile", [playerId, otherPlayerId]);

  await deleteUser(playerId);
  await deleteUser(otherPlayerId);
});

describe("Joueur : profil", () => {
  it("peut lire son propre profil", async () => {
    const { data, error } = await playerClient
      .from("profiles")
      .select("*")
      .eq("id_profile", playerId)
      .single();

    expect(error).toBeNull();
    expect(data?.id_profile).toBe(playerId);
  });

  it("ne peut pas lire le profil d’un autre joueur", async () => {
    const { data, error } = await playerClient
      .from("profiles")
      .select("*")
      .eq("id_profile", otherPlayerId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("peut mettre à jour son propre profil", async () => {
    const { error } = await playerClient
      .from("profiles")
      .update({ phone: "+33600000099" })
      .eq("id_profile", playerId);

    expect(error).toBeNull();
  });

  it("ne peut pas mettre à jour le profil d’un autre joueur", async () => {
    const { data, error } = await playerClient
      .from("profiles")
      .update({ phone: "+33600000000" })
      .eq("id_profile", otherPlayerId)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

describe("Joueur : club", () => {
  it("peut lire son club", async () => {
    const { data, error } = await playerClient
      .from("clubs")
      .select("*")
      .eq("id_club", clubId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_club).toBe(clubId);
  });

  it("ne peut pas lire un autre club", async () => {
    const { data, error } = await playerClient
      .from("clubs")
      .select("*")
      .eq("id_club", otherClubId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("peut lire sa propre adhésion au club", async () => {
    const { data, error } = await playerClient
      .from("club_members")
      .select("*")
      .eq("id_club_member", playerClubMemberId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_profile).toBe(playerId);
  });

  it("ne peut pas lire l’adhésion d’un autre joueur", async () => {
    const { data, error } = await playerClient
      .from("club_members")
      .select("*")
      .eq("id_club_member", otherPlayerClubMemberId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

describe("Joueur : sections", () => {
  it("peut lire la section dont il est membre", async () => {
    const { data, error } = await playerClient
      .from("sections")
      .select("*")
      .eq("id_section", sectionId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_section).toBe(sectionId);
  });

  it("ne peut pas lire une section dont il n’est pas membre", async () => {
    const { data, error } = await playerClient
      .from("sections")
      .select("*")
      .eq("id_section", otherSectionId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("ne voit que ses sections, pas toutes les sections du club", async () => {
    const { data, error } = await playerClient
      .from("sections")
      .select("*")
      .eq("id_club", clubId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].id_section).toBe(sectionId);
  });
});

describe("Joueur : entraînements", () => {
  it("peut lire les entraînements de sa section", async () => {
    const { data, error } = await playerClient
      .from("training_sessions")
      .select(
        `
        id_training,
        title,
        starts_at,
        ends_at,
        location,
        section:sections (
          id_section,
          name
        )
      `,
      )
      .eq("id_training", trainingId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_training).toBe(trainingId);
    expect(data?.section?.id_section).toBe(sectionId);
  });

  it("ne peut pas lire un entraînement d’une autre section", async () => {
    const { data, error } = await playerClient
      .from("training_sessions")
      .select("*")
      .eq("id_training", otherTrainingId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("ne peut pas créer un entraînement", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 8);

    const { data, error } = await playerClient
      .from("training_sessions")
      .insert({
        id_section: sectionId,
        title: "Tentative joueur",
        starts_at: startsAt.toISOString(),
      })
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("ne peut pas modifier un entraînement de sa section", async () => {
    const { data, error } = await playerClient
      .from("training_sessions")
      .update({ title: "Titre modifié par un joueur" })
      .eq("id_training", trainingId)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("ne peut pas supprimer un entraînement de sa section", async () => {
    const { data, error } = await playerClient
      .from("training_sessions")
      .delete()
      .eq("id_training", trainingId)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

describe("Joueur : présence", () => {
  it("peut créer puis relire sa propre présence", async () => {
    const { error: insertError } = await playerClient
      .from("training_attendance")
      .insert({
        id_training: trainingId,
        id_section_member: playerSectionMemberId,
        status: "pending",
        note: "Je viens",
      });

    expect(insertError).toBeNull();

    const { data, error: selectError } = await playerClient
      .from("training_attendance")
      .select("id_attendance, status, note")
      .eq("id_training", trainingId)
      .eq("id_section_member", playerSectionMemberId)
      .single();

    expect(selectError).toBeNull();
    expect(data?.status).toBe("pending");
  });

  it("peut modifier sa propre présence", async () => {
    const { data: attendance } = await playerClient
      .from("training_attendance")
      .select("id_attendance")
      .eq("id_training", trainingId)
      .eq("id_section_member", playerSectionMemberId)
      .single();

    expect(attendance).not.toBeNull();

    const { error } = await playerClient
      .from("training_attendance")
      .update({
        status: "present",
        note: "Présent",
        responded_at: new Date().toISOString(),
      })
      .eq("id_attendance", attendance!.id_attendance);

    expect(error).toBeNull();
  });

  it("ne peut pas créer une présence pour un autre joueur", async () => {
    const { data, error } = await playerClient
      .from("training_attendance")
      .insert({
        id_training: trainingId,
        id_section_member: otherPlayerSectionMemberId,
        status: "present",
      })
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("ne peut pas créer une présence pour un entraînement d’une autre section", async () => {
    const { data, error } = await playerClient
      .from("training_attendance")
      .insert({
        id_training: otherTrainingId,
        id_section_member: playerSectionMemberId,
        status: "present",
      })
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

describe("Joueur : utilisateur non connecté", () => {
  it("n’a pas de session active", async () => {
    const { data } = await anon.auth.getUser();
    expect(data.user).toBeNull();
  });

  it("ne peut lire aucun club", async () => {
    const { data, error } = await anon.from("clubs").select("*");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("ne peut lire aucune section", async () => {
    const { data, error } = await anon.from("sections").select("*");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("ne peut lire aucun entraînement", async () => {
    const { data, error } = await anon.from("training_sessions").select("*");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
