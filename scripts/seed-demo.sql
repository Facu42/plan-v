-- NV-SEED: Verónica Demo + four synthetic patients.
-- Idempotent inserts (fixed ids, ON CONFLICT DO NOTHING) inside one transaction.
-- scripts/seed-demo.mjs refuses to run this file unless public.patients is empty
-- and the URL is local. Do not point it at plan-v-app or any hosted Supabase.
-- No real PHI. No kit images. No remote photo URLs.
-- PV-40 day assignment has no SQL table: recipes are published and assigned.
-- Visual cards stay unavailable until a declared RecipeCard exists in memory.

begin;

insert into auth.users (id, email, email_confirmed_at) values
  ('a1000000-0000-4000-8000-000000000001', 'veronica.demo@planv.test', now()),
  ('a1000000-0000-4000-8000-000000000021', 'sofia.demo@planv.test', now()),
  ('a1000000-0000-4000-8000-000000000022', 'marina.demo@planv.test', now()),
  ('a1000000-0000-4000-8000-000000000023', 'luca.demo@planv.test', now()),
  ('a1000000-0000-4000-8000-000000000024', 'elena.demo@planv.test', now())
on conflict (id) do nothing;

insert into public.profiles (id, role, full_name) values
  ('a1000000-0000-4000-8000-000000000001', 'nutri', 'Verónica Demo'),
  ('a1000000-0000-4000-8000-000000000021', 'paciente', 'Sofía Demo'),
  ('a1000000-0000-4000-8000-000000000022', 'paciente', 'Marina Demo'),
  ('a1000000-0000-4000-8000-000000000023', 'paciente', 'Luca Demo'),
  ('a1000000-0000-4000-8000-000000000024', 'paciente', 'Elena Demo')
on conflict (id) do nothing;

insert into public.nutritionists (id, user_id, display_name, license) values
  ('a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Verónica Demo', 'DEMO-NO-LICENSE')
on conflict (id) do nothing;

insert into public.patients (
  id, nutritionist_id, user_id, full_name, initials, tone, stage, status,
  goal, sensitive_hours, plan_b, next_focus, adherence_score, adherence_why, billing_status
) values
  ('a1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000021', 'Sofía Demo', 'SD', 'peach', 'seguimiento', 'En ritmo', 'Comer con horarios más parejos', '', 'Tostada + huevo', 'Almuerzo entre semana', 60, 'Seed sintético. No es una medición clínica.', 'waived'),
  ('a1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000022', 'Marina Demo', 'MD', 'mint', 'seguimiento', 'En ritmo', 'Sumar una comida al mediodía', '', 'Yogur + fruta', 'Registro del almuerzo', 70, 'Seed sintético. No es una medición clínica.', 'waived'),
  ('a1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000023', 'Luca Demo', 'LD', 'lilac', 'plan', 'En ritmo', 'Armar cenas simples', '', 'Tortilla + ensalada', 'Cena de entre semana', 40, 'Seed sintético. No es una medición clínica.', 'waived'),
  ('a1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000024', 'Elena Demo', 'ED', 'mint', 'ingreso', 'En ritmo', 'Completar el ingreso', '', '', 'Primera consulta', 0, 'Seed sintético. No es una medición clínica.', 'waived')
on conflict (id) do nothing;

insert into public.ingredients (id, nutritionist_id, name, name_normalized, base_unit) values
  ('a1000000-0000-4000-8000-000000000041', 'a1000000-0000-4000-8000-000000000002', 'Pechuga de pollo', 'pechuga de pollo', 'g'),
  ('a1000000-0000-4000-8000-000000000042', 'a1000000-0000-4000-8000-000000000002', 'Yogur natural', 'yogur natural', 'g'),
  ('a1000000-0000-4000-8000-000000000043', 'a1000000-0000-4000-8000-000000000002', 'Fruta', 'fruta', 'g')
on conflict (id) do nothing;

insert into public.recipes (id, nutritionist_id, title, status) values
  ('a1000000-0000-4000-8000-000000000031', 'a1000000-0000-4000-8000-000000000002', 'Bowl de pollo y vegetales', 'published'),
  ('a1000000-0000-4000-8000-000000000033', 'a1000000-0000-4000-8000-000000000002', 'Yogur con fruta', 'published')
on conflict (id) do nothing;

insert into public.recipe_versions (
  id, recipe_id, version, yield_portions, steps, nutrient_source, reviewer_id, published_at
) values
  (
    'a1000000-0000-4000-8000-000000000032',
    'a1000000-0000-4000-8000-000000000031',
    1, 2,
    '["Cociná la pechuga.","Sumá vegetales al plato."]'::jsonb,
    'declarado por porción: 420 kcal, 32 g proteína, 28 g carbohidratos, 14 g grasas',
    'a1000000-0000-4000-8000-000000000001',
    timestamptz '2026-09-21 12:00:00-03'
  ),
  (
    'a1000000-0000-4000-8000-000000000034',
    'a1000000-0000-4000-8000-000000000033',
    1, 1,
    '["Serví el yogur.","Sumá la fruta."]'::jsonb,
    'declarado por porción: 180 kcal, 12 g proteína, 22 g carbohidratos, 4 g grasas',
    'a1000000-0000-4000-8000-000000000001',
    timestamptz '2026-09-21 12:00:00-03'
  )
on conflict (id) do nothing;

insert into public.recipe_ingredients (id, recipe_version_id, ingredient_id, quantity, unit) values
  ('a1000000-0000-4000-8000-000000000045', 'a1000000-0000-4000-8000-000000000032', 'a1000000-0000-4000-8000-000000000041', 160, 'g'),
  ('a1000000-0000-4000-8000-000000000046', 'a1000000-0000-4000-8000-000000000034', 'a1000000-0000-4000-8000-000000000042', 170, 'g'),
  ('a1000000-0000-4000-8000-000000000047', 'a1000000-0000-4000-8000-000000000034', 'a1000000-0000-4000-8000-000000000043', 80, 'g')
on conflict (id) do nothing;

insert into public.recipe_assignments (recipe_id, patient_id, nutritionist_id, recipe_version_id) values
  ('a1000000-0000-4000-8000-000000000031', 'a1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000032'),
  ('a1000000-0000-4000-8000-000000000033', 'a1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000034')
on conflict (recipe_id, patient_id) do nothing;

insert into public.meal_plans (id, patient_id, nutritionist_id) values
  ('a1000000-0000-4000-8000-000000000051', 'a1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002'),
  ('a1000000-0000-4000-8000-000000000053', 'a1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.meal_plan_versions (id, meal_plan_id, version, status, period_start, period_end, published_at) values
  ('a1000000-0000-4000-8000-000000000052', 'a1000000-0000-4000-8000-000000000051', 1, 'published', date '2026-09-21', date '2026-09-27', timestamptz '2026-09-21 12:05:00-03'),
  ('a1000000-0000-4000-8000-000000000054', 'a1000000-0000-4000-8000-000000000053', 1, 'published', date '2026-09-21', date '2026-09-27', timestamptz '2026-09-21 12:05:00-03')
on conflict (id) do nothing;

insert into public.meal_plan_items (id, meal_plan_version_id, for_date, slot, recipe_version_id, free_text, portions, public_note) values
  ('a1000000-0000-4000-8000-000000000055', 'a1000000-0000-4000-8000-000000000052', date '2026-09-21', 'almuerzo', 'a1000000-0000-4000-8000-000000000032', null, 1, 'Porción declarada del seed.'),
  ('a1000000-0000-4000-8000-000000000056', 'a1000000-0000-4000-8000-000000000054', date '2026-09-22', 'desayuno', null, 'Yogur con fruta', 1, 'Texto libre. Sin cantidad inventada.')
on conflict (id) do nothing;

insert into public.meal_slots (id, patient_id, weekday, slot, title) values
  ('a1000000-0000-4000-8000-000000000057', 'a1000000-0000-4000-8000-000000000011', 0, 'almuerzo', 'Bowl de pollo y vegetales'),
  ('a1000000-0000-4000-8000-000000000058', 'a1000000-0000-4000-8000-000000000013', 2, 'cena', 'Tortilla y ensalada')
on conflict (id) do nothing;

insert into public.meal_logs (
  id, patient_id, slot_label, photo_path, description, foods, macros, confidence,
  note_for_nutri, status, logged_at, analysis_status
) values (
  'a1000000-0000-4000-8000-000000000081',
  'a1000000-0000-4000-8000-000000000011',
  'Almuerzo',
  null,
  'Bowl de pollo',
  '[{"name":"pechuga de pollo","portion_est":160,"portion_unit":"g"}]'::jsonb,
  '{"kcal":420,"protein_g":32,"carbs_g":28,"fat_g":14}'::jsonb,
  1,
  'Valores declarados del seed sintético. No es una medición clínica.',
  'confirmed',
  timestamptz '2026-09-21 13:30:00-03',
  'succeeded'
)
on conflict (id) do nothing;

insert into public.messages (
  id, nutritionist_id, patient_id, author_id, body, suggested_by_ai, sent_at
) values
  (
    'a1000000-0000-4000-8000-000000000061',
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000001',
    'Hola Sofía, dejé el bowl publicado para el lunes. Es un mensaje de demostración.',
    false,
    timestamptz '2026-09-21 15:00:00-03'
  ),
  (
    'a1000000-0000-4000-8000-000000000062',
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000012',
    'a1000000-0000-4000-8000-000000000022',
    'Vi el desayuno del martes. Gracias, es un mensaje de demostración.',
    false,
    timestamptz '2026-09-21 16:00:00-03'
  )
on conflict (id) do nothing;

insert into public.appointments (
  id, nutritionist_id, patient_id, starts_at, duration_min, channel, status, timezone, prep_note
) values
  (
    'a1000000-0000-4000-8000-000000000071',
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000011',
    timestamptz '2026-09-24 14:30:00-03',
    45, 'video', 'scheduled', 'America/Argentina/Buenos_Aires',
    'Turno sintético. Sin enlace de video.'
  ),
  (
    'a1000000-0000-4000-8000-000000000072',
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000013',
    timestamptz '2026-09-25 10:00:00-03',
    45, 'presencial', 'scheduled', 'America/Argentina/Buenos_Aires',
    'Turno sintético de ingreso de plan.'
  )
on conflict (id) do nothing;

commit;
