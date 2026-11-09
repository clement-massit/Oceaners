import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase test environment variables");
}

if (supabaseAnonKey === supabaseServiceRoleKey) {
  throw new Error("ANON_KEY and SERVICE_ROLE_KEY must be different");
}

// Client backoffice : bypass RLS, uniquement pour les fixtures.
const admin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Client réellement non connecté.
const anonClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client coach, créé après connexion.
let coachClient: SupabaseClient;

const run = `coach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const coachEmail = `${run}@test.oceaners.dev`;
const playerEmail = `${run}_player@test.oceaners.dev`;
const otherCoachEmail = `${run}_other_coach@test.oceaners.dev`;

const password = "testoceaners";

let coachId: string;
let playerId: string;
let otherCoachId: string;

let clubId: string;
let otherClubId: string;

let coachSectionId: string;
let otherSectionId: string;
let otherClubSectionId: string;

let coachClubMemberId: string;
let playerClubMemberId: string;
let otherCoachClubMemberId: string;

let coachSectionMemberId: string;
let playerSectionMemberId: string;
let otherCoachSectionMemberId: string;

let coachTrainingId: string;
let otherSectionTrainingId: string;
let otherClubTrainingId: string;

async function createTestUser(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: password,
    email_confirm: true,
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();

  return data.user!.id;
}

beforeAll(async () => {
  // 1. Utilisateurs
  coachId = await createTestUser(coachEmail);
  playerId = await createTestUser(playerEmail);
  otherCoachId = await createTestUser(otherCoachEmail);

  // 2. Profils
  //   const { error: profilesError } = await admin.from("profiles").insert([
  //     {
  //       id_profile: coachId,
  //       first_name: "Coach",
  //       last_name: "Test",
  //     },
  //     {
  //       id_profile: playerId,
  //       first_name: "Joueur",
  //       last_name: "Test",
  //     },
  //     {
  //       id_profile: otherCoachId,
  //       first_name: "Autre",
  //       last_name: "Coach",
  //     },
  //   ]);

  //   expect(profilesError).toBeNull();

  // 3. Clubs
  const { data: clubs, error: clubsError } = await admin
    .from("clubs")
    .insert([
      {
        name: `Oceaners Coach Test ${run}`,
        slug: `oceaners-coach-test-${run}`,
        city: "Arcachon",
      },
      {
        name: `Autre Club Coach Test ${run}`,
        slug: `autre-club-coach-test-${run}`,
        city: "Bordeaux",
      },
    ])
    .select("id_club");

  expect(clubsError).toBeNull();
  expect(clubs).toHaveLength(2);

  clubId = clubs![0].id_club;
  otherClubId = clubs![1].id_club;

  // 4. Adhésions club
  const { data: memberships, error: membershipsError } = await admin
    .from("club_members")
    .insert([
      {
        id_club: clubId,
        id_profile: coachId,
        role: "coach",
        status: "active",
      },
      {
        id_club: clubId,
        id_profile: playerId,
        role: "player",
        status: "active",
      },
      {
        id_club: otherClubId,
        id_profile: otherCoachId,
        role: "coach",
        status: "active",
      },
    ])
    .select("id_club_member, id_profile");

  expect(membershipsError).toBeNull();
  expect(memberships).toHaveLength(3);

  coachClubMemberId = memberships!.find(
    (m) => m.id_profile === coachId,
  )!.id_club_member;
  playerClubMemberId = memberships!.find(
    (m) => m.id_profile === playerId,
  )!.id_club_member;
  otherCoachClubMemberId = memberships!.find(
    (m) => m.id_profile === otherCoachId,
  )!.id_club_member;

  // 5. Sections
  const { data: sections, error: sectionsError } = await admin
    .from("sections")
    .insert([
      {
        id_club: clubId,
        name: "Seniors Coach",
        category: "Senior",
        season: "2026-2027",
      },
      {
        id_club: clubId,
        name: "U18 Coach",
        category: "U18",
        season: "2026-2027",
      },
      {
        id_club: otherClubId,
        name: "Seniors Autre Club",
        category: "Senior",
        season: "2026-2027",
      },
    ])
    .select("id_section, name");

  expect(sectionsError).toBeNull();
  expect(sections).toHaveLength(3);

  coachSectionId = sections!.find(
    (s) => s.name === "Seniors Coach",
  )!.id_section;
  otherSectionId = sections!.find((s) => s.name === "U18 Coach")!.id_section;
  otherClubSectionId = sections!.find(
    (s) => s.name === "Seniors Autre Club",
  )!.id_section;

  // 6. Membres de sections
  const { data: sectionMembers, error: sectionMembersError } = await admin
    .from("section_members")
    .insert([
      {
        id_section: coachSectionId,
        id_club_member: coachClubMemberId,
        team_role: "coach",
        status: "active",
      },
      {
        id_section: coachSectionId,
        id_club_member: playerClubMemberId,
        team_role: "player",
        status: "active",
      },
      {
        id_section: otherClubSectionId,
        id_club_member: otherCoachClubMemberId,
        team_role: "coach",
        status: "active",
      },
    ])
    .select("id_section_member, id_club_member");

  const { data: coachMembership, error } = await admin
    .from("section_members")
    .select("id_section_member, team_role, status")
    .eq("id_section", coachSectionId)
    .eq("id_club_member", coachClubMemberId)
    .single();

  expect(error).toBeNull();
  expect(coachMembership?.team_role).toBe("coach");
  expect(coachMembership?.status).toBe("active");

  expect(sectionMembersError).toBeNull();
  expect(sectionMembers).toHaveLength(3);

  coachSectionMemberId = sectionMembers!.find(
    (sm) => sm.id_club_member === coachClubMemberId,
  )!.id_section_member;

  playerSectionMemberId = sectionMembers!.find(
    (sm) => sm.id_club_member === playerClubMemberId,
  )!.id_section_member;

  otherCoachSectionMemberId = sectionMembers!.find(
    (sm) => sm.id_club_member === otherCoachClubMemberId,
  )!.id_section_member;

  // 7. Entraînements initiaux
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setHours(19, 30, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setHours(21, 0, 0, 0);

  const { data: trainings, error: trainingsError } = await admin
    .from("training_sessions")
    .insert([
      {
        id_section: coachSectionId,
        title: "Entraînement initial coach",
        location: "Gymnase André Égron",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
      {
        id_section: otherSectionId,
        title: "Entraînement autre section même club",
        location: "Autre gymnase",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
      {
        id_section: otherClubSectionId,
        title: "Entraînement autre club",
        location: "Gymnase Bordeaux",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
    ])
    .select("id_training, title");

  expect(trainingsError).toBeNull();
  expect(trainings).toHaveLength(3);

  coachTrainingId = trainings!.find(
    (t) => t.title === "Entraînement initial coach",
  )!.id_training;

  otherSectionTrainingId = trainings!.find(
    (t) => t.title === "Entraînement autre section même club",
  )!.id_training;

  otherClubTrainingId = trainings!.find(
    (t) => t.title === "Entraînement autre club",
  )!.id_training;

  // 8. Connexion du coach sur un client dédié
  const { data: signInData, error: signInError } =
    await anonClient.auth.signInWithPassword({
      email: coachEmail,
      password: password,
    });

  expect(signInError).toBeNull();
  expect(signInData.session).not.toBeNull();

  coachClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  await admin
    .from("training_attendance")
    .delete()
    .in("id_training", [
      coachTrainingId,
      otherSectionTrainingId,
      otherClubTrainingId,
    ]);

  await admin
    .from("training_sessions")
    .delete()
    .in("id_training", [
      coachTrainingId,
      otherSectionTrainingId,
      otherClubTrainingId,
    ]);

  await admin
    .from("section_members")
    .delete()
    .in("id_section", [coachSectionId, otherSectionId, otherClubSectionId]);

  await admin
    .from("sections")
    .delete()
    .in("id_section", [coachSectionId, otherSectionId, otherClubSectionId]);

  await admin
    .from("club_members")
    .delete()
    .in("id_club", [clubId, otherClubId]);

  await admin.from("clubs").delete().in("id_club", [clubId, otherClubId]);

  await admin
    .from("profiles")
    .delete()
    .in("id_profile", [coachId, playerId, otherCoachId]);

  await admin.auth.admin.deleteUser(coachId);
  await admin.auth.admin.deleteUser(playerId);
  await admin.auth.admin.deleteUser(otherCoachId);
});

describe("Coach : lecture", () => {
  it("peut lire son club", async () => {
    const { data, error } = await coachClient
      .from("clubs")
      .select("*")
      .eq("id_club", clubId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_club).toBe(clubId);
  });

  it("ne peut pas lire un autre club", async () => {
    const { data, error } = await coachClient
      .from("clubs")
      .select("*")
      .eq("id_club", otherClubId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("peut lire sa section", async () => {
    const { data, error } = await coachClient
      .from("sections")
      .select("*")
      .eq("id_section", coachSectionId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id_section).toBe(coachSectionId);
  });

  it("peut lire les membres de sa section", async () => {
    const { data, error } = await coachClient
      .from("section_members")
      .select(
        `
        id_section_member,
        id_club_member,
        team_role,
        status
      `,
      )
      .eq("id_section", coachSectionId);

    const clubMemberIds = data!.map((member) => member.id_club_member);

    expect(clubMemberIds).toContain(coachClubMemberId);
    expect(clubMemberIds).toContain(playerClubMemberId);

    const roles = data!.map((member) => member.team_role);

    expect(roles).toContain("coach");
    expect(roles).toContain("player");

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    // const profileIds = data!.map((member) => member.club_member?.id_profile);

    // expect(profileIds).toContain(coachId);
    // expect(profileIds).toContain(playerId);
  });

  it("ne peut pas lire les membres d’une autre section du même club", async () => {
    const { data, error } = await coachClient
      .from("section_members")
      .select("*")
      .eq("id_section", otherSectionId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

describe("Coach : entraînements", () => {
  it("debug : création entraînement sans select", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 10);
    startsAt.setHours(19, 30, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setHours(21, 0, 0, 0);

    const { data, error } = await coachClient.from("training_sessions").insert({
      id_section: coachSectionId,
      title: "Debug entraînement coach",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    expect(error).toBeNull();
  });

  it("peut créer un entraînement pour sa section", async () => {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 10);
    startsAt.setHours(19, 30, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setHours(21, 0, 0, 0);

    // 1. Insert sans RETURNING.
    const { error: insertError } = await coachClient
      .from("training_sessions")
      .insert({
        id_section: coachSectionId,
        title: "Entraînement créé par le coach",
        description: "Séance technique",
        location: "Gymnase André Égron",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });

    expect(insertError).toBeNull();

    // 2. Le coach relit l'entraînement qu'il vient de créer.
    const { data: created, error: selectError } = await coachClient
      .from("training_sessions")
      .select("id_training, title, id_section")
      .eq("id_section", coachSectionId)
      .eq("title", "Entraînement créé par le coach")
      .maybeSingle();

    expect(selectError).toBeNull();
    expect(created).not.toBeNull();
    expect(created?.id_section).toBe(coachSectionId);

    // 3. Nettoyage.
    await admin
      .from("training_sessions")
      .delete()
      .eq("id_training", created!.id_training);
  });
});

it("ne peut pas créer un entraînement pour une autre section du même club", async () => {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 11);

  const { data, error } = await coachClient
    .from("training_sessions")
    .insert({
      id_section: otherSectionId,
      title: "Tentative coach autre section",
      starts_at: startsAt.toISOString(),
    })
    .select();

  expect(error).not.toBeNull();
  expect(data).toBeNull();
});

it("ne peut pas créer un entraînement pour une section d’un autre club", async () => {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 12);

  const { data, error } = await coachClient
    .from("training_sessions")
    .insert({
      id_section: otherClubSectionId,
      title: "Tentative coach autre club",
      starts_at: startsAt.toISOString(),
    })
    .select();

  expect(error).not.toBeNull();
  expect(data).toBeNull();
});

it("peut modifier un entraînement de sa section", async () => {
  const { error } = await coachClient
    .from("training_sessions")
    .update({
      title: "Entraînement modifié par le coach",
      description: "Séance modifiée",
    })
    .eq("id_training", coachTrainingId);

  expect(error).toBeNull();

  const { data, error: reloadError } = await admin
    .from("training_sessions")
    .select("title, description")
    .eq("id_training", coachTrainingId)
    .single();

  expect(reloadError).toBeNull();
  expect(data?.title).toBe("Entraînement modifié par le coach");
});

it("ne peut pas modifier un entraînement d’une autre section du même club", async () => {
  const { error } = await coachClient
    .from("training_sessions")
    .update({ title: "Tentative interdite" })
    .eq("id_training", otherSectionTrainingId);

  expect(error).toBeNull();

  const { data, error: reloadError } = await admin
    .from("training_sessions")
    .select("title")
    .eq("id_training", otherSectionTrainingId)
    .single();

  expect(reloadError).toBeNull();
  expect(data?.title).toBe("Entraînement autre section même club");
});

it("ne peut pas annuler un entraînement d’une autre section", async () => {
  const { error } = await coachClient
    .from("training_sessions")
    .delete()
    .eq("id_training", otherSectionTrainingId);

  expect(error).toBeNull();

  const { data, error: reloadError } = await admin
    .from("training_sessions")
    .select("id_training")
    .eq("id_training", otherSectionTrainingId)
    .maybeSingle();

  expect(reloadError).toBeNull();
  expect(data).not.toBeNull();
});

it("peut annuler un entraînement de sa section", async () => {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 14);
  startsAt.setHours(19, 30, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setHours(21, 0, 0, 0);

  // 1. Le coach crée l'entraînement et récupère son ID.
  const { error: insertError } = await coachClient
    .from("training_sessions")
    .insert({
      id_section: coachSectionId,
      title: "Entraînement créé par le coach",
      description: "Séance technique",
      location: "Gymnase André Égron",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

  expect(insertError).toBeNull();

  const { data: training, error: selectError } = await coachClient
    .from("training_sessions")
    .select("id_training, title, id_section")
    .eq("id_section", coachSectionId)
    .eq("title", "Entraînement créé par le coach")
    .maybeSingle();

  const trainingId = training!.id_training;

  // 2. Le coach annule l'entraînement.
  const { error: deleteError } = await coachClient
    .from("training_sessions")
    .delete()
    .eq("id_training", trainingId);

  expect(deleteError).toBeNull();

  // 3. Vérification côté admin : l'entraînement n'existe plus.
  const { data: deletedTraining, error: reloadError } = await admin
    .from("training_sessions")
    .select("id_training")
    .eq("id_training", trainingId)
    .maybeSingle();

  expect(reloadError).toBeNull();
  expect(deletedTraining).toBeNull();
});

describe("Coach : présences", () => {
  it("peut créer la présence d’un joueur de sa section", async () => {
    const { error } = await coachClient.from("training_attendance").insert({
      id_training: coachTrainingId,
      id_section_member: playerSectionMemberId,
      status: "present",
      note: "Marqué présent par le coach",
    });
    console.log("INSERT", error);

    expect(error).toBeNull();
    const { data, error: selectError } = await coachClient
      .from("training_attendance")
      .select("id_attendance, status")
      .eq("id_training", coachTrainingId)
      .eq("id_section_member", playerSectionMemberId)
      .maybeSingle();

    console.log({ data, selectError });

    expect(selectError).toBeNull();
    expect(data).not.toBeNull();
  });

  it("peut modifier la présence d’un joueur de sa section", async () => {
    const { data: attendance, error: findError } = await admin
      .from("training_attendance")
      .select("id_attendance")
      .eq("id_training", coachTrainingId)
      .eq("id_section_member", playerSectionMemberId)
      .single();

    expect(findError).toBeNull();
    expect(attendance).not.toBeNull();

    const { error } = await coachClient
      .from("training_attendance")
      .update({
        status: "late",
        note: "Arrivé en retard",
      })
      .eq("id_attendance", attendance!.id_attendance);

    expect(error).toBeNull();

    const { data: reloaded, error: reloadError } = await admin
      .from("training_attendance")
      .select("status, note")
      .eq("id_attendance", attendance!.id_attendance)
      .single();

    expect(reloadError).toBeNull();
    expect(reloaded?.status).toBe("late");
    expect(reloaded?.note).toBe("Arrivé en retard");
  });

  it("ne peut pas modifier une présence d’une autre section", async () => {
    // Création admin d'une présence dans l'autre section.
    const { data: otherAttendance, error: insertError } = await admin
      .from("training_attendance")
      .insert({
        id_training: otherSectionTrainingId,
        id_section_member: otherCoachSectionMemberId,
        status: "pending",
      })
      .select("id_attendance")
      .single();

    expect(insertError).toBeNull();

    const { error } = await coachClient
      .from("training_attendance")
      .update({ status: "absent" })
      .eq("id_attendance", otherAttendance!.id_attendance);

    expect(error).toBeNull();

    const { data: reloaded, error: reloadError } = await admin
      .from("training_attendance")
      .select("status")
      .eq("id_attendance", otherAttendance!.id_attendance)
      .single();

    expect(reloadError).toBeNull();
    expect(reloaded?.status).toBe("pending");
  });
});

describe("Coach : sections", () => {
  it("ne peut pas créer une section s’il n’est pas bureau", async () => {
    const { data, error } = await coachClient
      .from("sections")
      .insert({
        id_club: clubId,
        name: "Section créée par coach",
        category: "Senior",
        season: "2026-2027",
      })
      .select();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("ne peut pas modifier une section s’il n’est pas bureau", async () => {
    const { data, error } = await coachClient
      .from("sections")
      .update({ name: "Nom modifié par coach" })
      .eq("id_section", coachSectionId)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
