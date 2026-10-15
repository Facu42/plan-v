-- Pasos declarados por el paciente. NULL significa que no hubo registro.
alter table public.habit_logs
  add column if not exists steps integer;

alter table public.habit_logs
  drop constraint if exists habit_logs_steps_range;

alter table public.habit_logs
  add constraint habit_logs_steps_range check (steps is null or steps between 0 and 100000);
