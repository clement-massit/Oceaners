create policy "Bureau can read all club sections"
on public.sections
for select
to authenticated
using (
  public.is_club_bureau(id_club)
  or exists (
    select 1
    from public.section_members sm
    join public.club_members cm on cm.id_club_member = sm.id_club_member
    where sm.id_section = sections.id_section
      and sm.status = 'active'
      and cm.id_profile = (select auth.uid())
      and cm.status = 'active'
  )
);

create policy "Bureau can read club members"
on public.club_members
for select
to authenticated
using (
  id_profile = (select auth.uid())
  or public.is_club_bureau(id_club)
);