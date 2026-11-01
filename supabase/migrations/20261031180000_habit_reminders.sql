-- Recordatorios de la paciente: comer, tomar agua y dormir.
-- Aditiva: una tabla nueva. No toca filas ni tablas existentes.
-- No aplicar en la base hospedada hasta la frase escrita de Facundo.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';

create table if not exists public.habit_reminders (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  meals_on boolean not null default false,
  meal_times text[] not null default array['08:30','13:00','20:30'],
  water_on boolean not null default false,
  water_every_hours smallint not null default 2,
  water_from text not null default '09:00',
  water_until text not null default '21:00',
  sleep_on boolean not null default false,
  sleep_time text not null default '23:00',
  updated_at timestamptz not null default clock_timestamp(),
  constraint habit_reminders_meal_times check (cardinality(meal_times) between 1 and 4),
  constraint habit_reminders_water_hours check (water_every_hours between 1 and 4),
  constraint habit_reminders_water_window check (water_from < water_until)
);

alter table public.habit_reminders enable row level security;
create policy habit_reminders_own on public.habit_reminders
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
revoke all on public.habit_reminders from public, anon;
grant select, insert, update, delete on public.habit_reminders to authenticated;

commit;
