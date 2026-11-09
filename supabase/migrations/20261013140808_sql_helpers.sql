-- l'utilisateur est le coach de telle section
create or replace function public.is_section_coach(
  p_section_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.section_members sm
    join public.club_members cm
      on cm.id_club_member = sm.id_club_member
    where sm.id_section = p_section_id
      and sm.team_role = 'coach'
      and sm.status = 'active'
      and cm.id_profile = auth.uid()
      and cm.status = 'active'
  );
$$;

-- l'utilisateur appartient bien à cette section
create or replace function public.is_section_member(
  p_section_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.section_members sm
    join public.club_members cm
      on cm.id_club_member = sm.id_club_member
    where sm.id_section = p_section_id
      and sm.status = 'active'
      and cm.id_profile = auth.uid()
      and cm.status = 'active'
  );
$$;

-- gestion des sections, membres, roles, etc.
create or replace function public.is_club_bureau(
  p_club_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.club_members cm
    where cm.id_club = p_club_id
      and cm.role = 'bureau'
      and cm.status = 'active'
      and cm.id_profile = auth.uid()
  );
$$;

-- un coach peut intervenir sur plusieurs sections du club 
create or replace function public.is_club_coach(
  p_club_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.club_members cm
    where cm.id_club = p_club_id
      and cm.role = 'coach'
      and cm.status = 'active'
      and cm.id_profile = auth.uid()
  );
$$;

-- accès aux évènements, tâches et tout destinés aux bénévoles
create or replace function public.is_club_volunteer(
  p_club_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.club_members cm
    where cm.id_club = p_club_id
      and cm.role = 'volunteer'
      and cm.status = 'active'
      and cm.id_profile = auth.uid()
  );
$$;

-- lecture des informations générales du club
create or replace function public.is_club_member(
  p_club_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.club_members cm
    where cm.id_club = p_club_id
      and cm.status = 'active'
      and cm.id_profile = auth.uid()
  );
$$;

----- TRAININGS ----
-- autoriser le coach à modifier ou annuler un entrainement
create or replace function public.is_training_coach(
  p_training_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.training_sessions t
    where t.id_training = p_training_id
      and public.is_section_coach(t.id_section)
  );
$$;

-- lecture des entrainements et gestion de sa présence
create or replace function public.is_training_member(
  p_training_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.training_sessions t
    where t.id_training = p_training_id
      and public.is_section_member(t.id_section)
  );
$$;

-- permet à un membre de modifier uniquement sa propre présence
create or replace function public.is_own_attendance(
  p_attendance_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.training_attendance a
    join public.section_members sm
      on sm.id_section_member = a.id_section_member
    join public.club_members cm
      on cm.id_club_member = sm.id_club_member
    where a.id_attendance = p_attendance_id
      and cm.id_profile = auth.uid()
      and cm.status = 'active'
      and sm.status = 'active'
  );
$$;

----- CRUD -----
-- Peut créer une section
create or replace function public.can_create_section(
  p_club_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_club_bureau(p_club_id);
$$;

create policy "Bureau can create sections"
on public.sections
for insert
to authenticated
with check (
  public.can_create_section(id_club)
);

-- Peut créer un entrainement
create or replace function public.can_create_training(
  p_section_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_section_coach(p_section_id)
  or public.is_club_bureau(
    (
      select s.id_club
      from public.sections s
      where s.id_section = p_section_id
    )
  );
$$;

create policy "Coaches or bureau can create training sessions"
on public.training_sessions
for insert
to authenticated
with check (
  public.can_create_training(id_section)
);

-- Peut modifier un entrainement 
create or replace function public.can_update_training(
  p_training_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_training_coach(p_training_id)
  or exists (
    select 1
    from public.training_sessions t
    where t.id_training = p_training_id
      and public.is_club_bureau(t.id_section)
  );
$$;