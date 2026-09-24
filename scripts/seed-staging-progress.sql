-- NV-SEED (staging, PV-43 / issue #9): enriquece la paciente REAL Sofía Demo
-- en el proyecto hospedado plan-v-app (ref wvosvlxpfytokwfbcero) para que
-- Progress, Diario y Plan semanal tengan contenido de verdad en staging.
--
-- A diferencia de scripts/seed-demo.sql (crea usuarios sintéticos y sólo
-- corre contra Postgres local/descartable vía seed-demo-guard.mjs), este
-- script apunta a filas YA EXISTENTES del proyecto hospedado:
--   patient_id      57aa9195-8401-4239-97c2-bc02163ad9b4  (Sofía Demo,
--                   user planv.paciente.staging@gmail.com)
--   nutritionist_id d413314a-ad13-41c0-9b27-2f3a64d8e18b  (Verónica Demo,
--                   user planv.nutri.staging@gmail.com)
-- No crea usuarios ni pacientes nuevos. Idempotente (ids fijos con el mismo
-- prefijo b2000000-... ya usado por el resto del seed de Sofía, ON CONFLICT
-- DO NOTHING). No inventa mediciones clínicas: valores declarados de seed,
-- en el mismo estilo que la data staging ya presente.
--
-- Aplicar con el service role (Supabase SQL editor / MCP execute_sql), NO
-- con apply:disposable (ese script aborta si patients tiene filas, y acá
-- las necesitamos).
--
-- NO incluye meal_plan_items: publicar una versión nueva del plan fechado
-- (para completar los 7 días de esa vista separada) requiere que el intake
-- de Sofía tenga allergies.state / restrictions.state resueltos (hoy están
-- en 'unknown' en public.intake_sessions) — public.assert_health_publishable
-- lo exige antes de cualquier publish_meal_plan y esto es intake/onboarding,
-- fuera del alcance de PV-43. Ya existe un DRAFT (version 2, 21 franjas,
-- 7 días x desayuno/almuerzo/cena) guardado vía save_meal_plan_draft, listo
-- para publicarse en cuanto se resuelva ese intake.

begin;

-- 1) Medida de cadera faltante (Progress mostraba peso/cintura y cadera vacía).
insert into public.measurements (
  id, patient_id, nutritionist_id, kind, value_numeric, unit, source, captured_on
) values (
  'b2000000-0000-4000-8000-000000000201',
  '57aa9195-8401-4239-97c2-bc02163ad9b4',
  'd413314a-ad13-41c0-9b27-2f3a64d8e18b',
  'hip', 99, 'cm', 'patient', date '2026-09-22'
)
on conflict (id) do nothing;

-- 2) Comidas recientes del diario, confirmadas y con macros (las 4 ya
-- existentes quedaban viejas o con análisis fallido; el diario se veía vacío).
insert into public.meal_logs (
  id, patient_id, slot_label, photo_path, description, foods, macros, confidence,
  note_for_nutri, status, logged_at, analysis_status
) values
  (
    'b2000000-0000-4000-8000-000000000301',
    '57aa9195-8401-4239-97c2-bc02163ad9b4',
    'Desayuno', null, 'Avena con huevo',
    '[{"name":"avena con huevo","portion_est":1,"portion_unit":"porción"}]'::jsonb,
    '{"kcal":320,"protein_g":18,"carbs_g":35,"fat_g":10}'::jsonb,
    1, 'Valores declarados del seed sintético. No es una medición clínica.',
    'confirmed', timestamptz '2026-09-23 08:15:00-03', 'succeeded'
  ),
  (
    'b2000000-0000-4000-8000-000000000302',
    '57aa9195-8401-4239-97c2-bc02163ad9b4',
    'Merienda', null, 'Yogur con fruta',
    '[{"name":"yogur natural","portion_est":170,"portion_unit":"g"},{"name":"fruta","portion_est":80,"portion_unit":"g"}]'::jsonb,
    '{"kcal":180,"protein_g":12,"carbs_g":22,"fat_g":4}'::jsonb,
    1, 'Valores declarados del seed sintético. No es una medición clínica.',
    'confirmed', timestamptz '2026-09-23 17:30:00-03', 'succeeded'
  ),
  (
    'b2000000-0000-4000-8000-000000000303',
    '57aa9195-8401-4239-97c2-bc02163ad9b4',
    'Cena', null, 'Bowl de pollo',
    '[{"name":"pechuga de pollo","portion_est":160,"portion_unit":"g"}]'::jsonb,
    '{"kcal":420,"protein_g":32,"carbs_g":28,"fat_g":14}'::jsonb,
    1, 'Valores declarados del seed sintético. No es una medición clínica.',
    'confirmed', timestamptz '2026-09-23 21:00:00-03', 'succeeded'
  )
on conflict (id) do nothing;

-- 3) Plan semanal recurrente (meal_slots, weekday 0=Lunes..6=Domingo): sólo
-- Martes completo y Miércoles-almuerzo existían. Se completa toda la semana
-- reusando los mismos platos ya declarados (sin inventar menús nuevos).
insert into public.meal_slots (id, patient_id, weekday, slot, title) values
  ('b2000000-0000-4000-8000-000000000401', '57aa9195-8401-4239-97c2-bc02163ad9b4', 0, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000402', '57aa9195-8401-4239-97c2-bc02163ad9b4', 0, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('b2000000-0000-4000-8000-000000000403', '57aa9195-8401-4239-97c2-bc02163ad9b4', 0, 'cena', 'Tortilla y ensalada'),
  ('b2000000-0000-4000-8000-000000000404', '57aa9195-8401-4239-97c2-bc02163ad9b4', 2, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000405', '57aa9195-8401-4239-97c2-bc02163ad9b4', 2, 'cena', 'Tortilla y ensalada'),
  ('b2000000-0000-4000-8000-000000000406', '57aa9195-8401-4239-97c2-bc02163ad9b4', 3, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000407', '57aa9195-8401-4239-97c2-bc02163ad9b4', 3, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('b2000000-0000-4000-8000-000000000408', '57aa9195-8401-4239-97c2-bc02163ad9b4', 3, 'cena', 'Tortilla y ensalada'),
  ('b2000000-0000-4000-8000-000000000409', '57aa9195-8401-4239-97c2-bc02163ad9b4', 4, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000410', '57aa9195-8401-4239-97c2-bc02163ad9b4', 4, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('b2000000-0000-4000-8000-000000000411', '57aa9195-8401-4239-97c2-bc02163ad9b4', 4, 'cena', 'Tortilla y ensalada'),
  ('b2000000-0000-4000-8000-000000000412', '57aa9195-8401-4239-97c2-bc02163ad9b4', 5, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000413', '57aa9195-8401-4239-97c2-bc02163ad9b4', 5, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('b2000000-0000-4000-8000-000000000414', '57aa9195-8401-4239-97c2-bc02163ad9b4', 5, 'cena', 'Tortilla y ensalada'),
  ('b2000000-0000-4000-8000-000000000415', '57aa9195-8401-4239-97c2-bc02163ad9b4', 6, 'desayuno', 'Yogur con fruta'),
  ('b2000000-0000-4000-8000-000000000416', '57aa9195-8401-4239-97c2-bc02163ad9b4', 6, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('b2000000-0000-4000-8000-000000000417', '57aa9195-8401-4239-97c2-bc02163ad9b4', 6, 'cena', 'Tortilla y ensalada')
on conflict (patient_id, weekday, slot) do nothing;

commit;
