-- Demo seed for Plan V (run with service role after migration)
-- Creates demo nutritionist row is linked manually to auth user

-- Example: after Verónica signs up with role=nutri in user_metadata:
-- insert into nutritionists (user_id, display_name, license)
-- select id, 'Verónica Trenti', 'MN 12345' from profiles where role = 'nutri' limit 1;

-- Demo patients (requires nutritionist_id from above)
/*
insert into patients (nutritionist_id, full_name, initials, tone, stage, status, goal, sensitive_hours, plan_b, next_focus, adherence_score, adherence_why, hydration, energy)
values
  ('NUTRI_ID', 'Sofía R.', 'SR', 'peach', 'seguimiento', 'Atención', 'Comer con más regularidad', 'Después de las 20:30', 'Tostada + huevo + palta', 'Organización nocturna', 62, '4 de 7 almuerzos confirmados.', 3, 'Baja'),
  ('NUTRI_ID', 'Marina C.', 'MC', 'lilac', 'plan', 'Plan B', 'Sostener el Plan B', '18:00', 'Yogur + fruta + nueces', 'Merienda pre-armada', 72, '5 de 7 meriendas confirmadas.', 5, 'Tranquila'),
  ('NUTRI_ID', 'Lucía F.', 'LF', 'mint', 'seguimiento', 'En ritmo', 'Regularidad de almuerzos', 'Ninguno', 'Huevos + pan', 'Seguir como viene', 88, '6 de 7 almuerzos confirmados.', 6, 'Con energía');
*/
