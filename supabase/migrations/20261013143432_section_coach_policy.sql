create policy "Section coaches can create training sessions"
on public.training_sessions
for insert
to authenticated
with check (
  public.is_section_coach(id_section)
);