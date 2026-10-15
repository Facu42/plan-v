-- Síntomas del día marcados por la paciente, junto al agua, el descanso y la energía (ánimo).
-- Solo agrega una columna opcional con lista cerrada: no toca filas existentes ni permisos
-- (habit_logs ya restringe por paciente con sus políticas de fila).
-- La lista coincide con src/types/symptoms.ts.
alter table public.habit_logs
  add column if not exists symptoms text[] not null default '{}'
  constraint habit_logs_symptoms_known check (
    symptoms <@ array['hinchazon','acidez','estrenimiento','diarrea','nauseas','dolor_cabeza','cansancio','ansiedad_comer']::text[]
  );

comment on column public.habit_logs.symptoms is
  'Síntomas del día marcados por la paciente (lista cerrada). Los ve su nutricionista.';
