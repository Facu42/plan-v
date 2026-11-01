-- Corrección de rendimiento de la política, sin cambios de permisos ni datos.
-- Sólo local: pendiente de autorización escrita para producción.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter policy habit_reminders_own on public.habit_reminders
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
commit;
