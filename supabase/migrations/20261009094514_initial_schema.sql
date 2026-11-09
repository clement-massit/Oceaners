create table public.clubs (
    id_club uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    city text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Profils applicatifs : une ligne par utilisateur Supabase Auth.
create table public.profiles (
    id_profile uuid primary key references auth.users (id) on delete cascade,
    first_name text,
    last_name text,
    phone text,
    mail text,
    role text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Appartenance d'un utilisateur à un club et rôle dans ce club.
create table public.club_members (
    id_club_member uuid primary key default gen_random_uuid(),
    id_club uuid not null references public.clubs (id_club) on delete cascade,
    id_profile uuid not null references public.profiles (id_profile) on delete cascade,
    role text not null default 'player'
        check (role in ('player', 'coach', 'volunteer', 'bureau')),
    status text not null default 'active'
        check (status in ('invited', 'active', 'inactive')),
    created_at timestamptz not null default now(),
    unique (id_club, id_profile)
);

-- Équipes appartenant à un club.
create table public.sections (
  id_section uuid primary key default gen_random_uuid(),
  id_club uuid not null references public.clubs (id_club) on delete cascade,
  name text not null,
  category text,
  season text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id_club, name, season)
);

-- Appartenance d'un membre à une équipe.
create table public.section_members (
    id_section_member uuid primary key default gen_random_uuid(),
    id_section uuid not null references public.sections (id_section) on delete cascade,
    id_club_member uuid not null references public.club_members (id_club_member) on delete cascade,
    team_role text not null default 'player'
        check (team_role in ('player', 'coach', 'captain')),
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    unique (id_section, id_club_member)
);

-- Entraînements.
create table public.training_sessions (
    id_training uuid primary key default gen_random_uuid(),
    id_section uuid not null references public.sections (id_section) on delete cascade,
    title text not null default 'Entraînement',
    description text,
    location text,
    starts_at timestamptz not null,
    ends_at timestamptz,
    created_by uuid references public.profiles (id_profile) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint training_valid_time
        check (ends_at is null or ends_at > starts_at)
);

-- Réponse d'un membre à un entraînement.
create table public.training_attendance (
    id_attendance uuid primary key default gen_random_uuid(),
    id_training uuid not null
        references public.training_sessions (id_training) on delete cascade,
    id_section_member uuid not null
        references public.section_members (id_section_member) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'present', 'absent', 'late')),
    note text,
    responded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id_training, id_section_member)
);

-- Index utiles pour les lectures courantes.
create index club_members_user_id_idx
  on public.club_members (id_profile);

create index section_members_section_id_idx
  on public.section_members (id_section);

create index training_sessions_team_starts_idx
  on public.training_sessions (id_section, starts_at);

create index training_attendance_session_idx
  on public.training_attendance (id_training);

create index training_attendance_member_idx
  on public.training_attendance (id_section_member);


-- Active RLS sur toutes les tables exposées à l'application.
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.sections enable row level security;
alter table public.section_members enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_attendance enable row level security;


--------------- POLICIES ---------------
-- Profil : un utilisateur peut lire et modifier son propre profil.
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id_profile = (select auth.uid()));

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id_profile = (select auth.uid()))
with check (id_profile = (select auth.uid()));

-- Club : un membre actif peut lire son club.
create policy "Club members can read their clubs"
on public.clubs
for select
to authenticated
using (
  exists (
    select 1
    from public.club_members cm
    where cm.id_club = clubs.id_club
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
  )
);

-- Adhésion : un utilisateur peut lire sa propre adhésion.
create policy "Users can read own club memberships"
on public.club_members
for select
to authenticated
using (id_profile = (select auth.uid()));

-- Équipe : un membre actif de l'équipe peut la lire.
create policy "Team members can read their teams"
on public.sections
for select
to authenticated
using (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    where sm.id_section = sections.id_section
      and sm.status = 'active'
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
  )
);

-- Membres d'équipe : un membre actif peut voir les membres de son équipe.
create policy "Team members can read their teammates"
on public.section_members
for select
to authenticated
using (
  exists (
    select 1
    from public.section_members my_sm
    join public.club_members my_cm on my_cm.id_club_member = my_sm.id_club_member
    where my_sm.id_section = section_members.id_section
      and my_cm.id_profile = (select auth.uid())
      and my_cm.status = 'active'
      and my_sm.status = 'active'
  )
);

-- Entraînement : les membres actifs de l'équipe peuvent le lire.
create policy "Team members can read training sessions"
on public.training_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    where sm.id_section = training_sessions.id_section
      and sm.status = 'active'
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
  )
);

-- Présence : un membre peut lire et modifier uniquement sa réponse.
create policy "Members can read own attendance"
on public.training_attendance
for select
to authenticated
using (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    where sm.id_section_member = training_attendance.id_section_member
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
      and sm.status = 'active'
  )
);

create policy "Members can insert own attendance"
on public.training_attendance
for insert
to authenticated
with check (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    join public.training_sessions ts on ts.id_training = training_attendance.id_training
    where sm.id_section_member = training_attendance.id_section_member
      and sm.id_section = ts.id_section
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
      and sm.status = 'active'
  )
);


create policy "Members can update own attendance"
on public.training_attendance
for update
to authenticated
using (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    where sm.id_section_member = training_attendance.id_section_member
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
      and sm.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    join public.training_sessions ts on ts.id_training = training_attendance.id_training
    where sm.id_section_member = training_attendance.id_section_member
      and sm.id_section = ts.id_section
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
      and sm.status = 'active'
  )
);

