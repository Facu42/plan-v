-- Pasos del día declarados por la paciente, junto al agua y el descanso.
-- Solo agrega una columna opcional: no toca filas existentes ni permisos
-- (habit_logs ya restringe por paciente con sus políticas de fila).
alter table public.habit_logs
  add column if not exists steps int check (steps between 0 and 100000);

comment on column public.habit_logs.steps is
  'Pasos del día declarados por la paciente. Plan V no importa datos de dispositivos.';
