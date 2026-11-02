-- Anota cuándo la profesional ejecutó la acción de Hoy (mensaje, menú o turno).
-- Sirve para contar las hechas en 7 días. No manda mensajes ni agenda turnos.
-- Reversión: drop index ai_briefs_done_recent y drop column done_at. No borra briefs.
-- Sin aplicar en producción hasta la frase de Facundo.

begin;

alter table public.ai_briefs
  add column if not exists done_at timestamptz;

comment on column public.ai_briefs.done_at is
  'Momento en que la profesional ejecutó la acción. Vacío si sigue pendiente.';

create index if not exists ai_briefs_done_recent
  on public.ai_briefs (nutritionist_id, done_at)
  where status = 'done' and done_at is not null;

notify pgrst, 'reload schema';

commit;
