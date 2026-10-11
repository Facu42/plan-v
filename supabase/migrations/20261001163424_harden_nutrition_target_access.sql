-- Correcciones posteriores al PR #40: cierre tras retiro, validación de datos
-- corporales y cálculo de metas dentro de la base. No cambia la ecuación de la app.

-- La política no depende del SELECT sobre patients: la paciente lee una vista
-- limitada y no necesariamente tiene una política sobre la tabla cruda.
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;
create or replace function private.nutrition_patient_is_active(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.patients p where p.id=target
      and p.deactivated_at is null and p.anonymized_at is null
      and (p.id=public.my_patient_id() or public.is_assigned_patient(p.id))
  );
$$;
revoke all on function private.nutrition_patient_is_active(uuid) from public,anon;
grant execute on function private.nutrition_patient_is_active(uuid) to authenticated,service_role;

-- Ayudante puro, privado: la función pública puede llamarlo con permisos de dueño.
create or replace function public.calculate_nutrition_target(target_inputs jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  key text;
  age_value double precision;
  weight_value double precision;
  height_value double precision;
  adjust_value double precision;
  protein_value double precision;
  fat_value double precision;
  factor double precision;
  bmr double precision;
  tdee double precision;
  kcal double precision;
  minimum double precision;
  protein_g double precision;
  fat_g double precision;
  carbs_g double precision;
  warnings jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(target_inputs) is distinct from 'object' then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  if (select count(*) from jsonb_object_keys(target_inputs)) <> 9
    or coalesce(target_inputs->>'sex', '') not in ('femenino','masculino')
    or coalesce(target_inputs->>'activity', '') not in ('sedentaria','ligera','moderada','intensa','muy_intensa')
    or coalesce(target_inputs->>'goal', '') not in ('bajar','mantener','subir') then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  foreach key in array array['age','weight_kg','height_cm','adjust_pct','protein_g_per_kg','fat_pct'] loop
    if jsonb_typeof(target_inputs->key) is distinct from 'number' then
      raise exception using errcode='22023', message='nutrition_target_data';
    end if;
  end loop;
  begin
    age_value := (target_inputs->>'age')::double precision;
    weight_value := (target_inputs->>'weight_kg')::double precision;
    height_value := (target_inputs->>'height_cm')::double precision;
    adjust_value := (target_inputs->>'adjust_pct')::double precision;
    protein_value := (target_inputs->>'protein_g_per_kg')::double precision;
    fat_value := (target_inputs->>'fat_pct')::double precision;
  exception when numeric_value_out_of_range or invalid_text_representation then
    raise exception using errcode='22023', message='nutrition_target_data';
  end;
  if age_value not between 15 and 100 or age_value <> trunc(age_value)
    or weight_value not between 30 and 300 or height_value not between 120 and 230
    or adjust_value not between -30 and 25 or protein_value not between 0.8 and 3
    or fat_value not between 15 and 45 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  factor := case target_inputs->>'activity'
    when 'sedentaria' then 1.2 when 'ligera' then 1.375 when 'moderada' then 1.55
    when 'intensa' then 1.725 else 1.9 end;
  bmr := 10 * weight_value + 6.25 * height_value - 5 * age_value
    + case when target_inputs->>'sex' = 'masculino' then 5 else -161 end;
  tdee := bmr * factor;
  kcal := tdee * (1 + adjust_value / 100);
  minimum := case when target_inputs->>'sex' = 'masculino' then 1500 else 1200 end;
  if kcal < minimum then
    warnings := warnings || jsonb_build_array('La meta calculada quedaba por debajo de ' || minimum::int || ' kcal; se subió a ese mínimo. Revisala con criterio clínico.');
    kcal := minimum;
  end if;
  if age_value < 18 then
    warnings := warnings || jsonb_build_array('Es menor de 18 años: esta ecuación es para adultos, usá otra referencia para crecimiento.');
  end if;
  -- floor(x + 0.5) reproduce Math.round de la app, incluso en valores a medio camino.
  protein_g := floor(protein_value * weight_value + 0.5);
  fat_g := floor((kcal * fat_value / 100) / 9 + 0.5);
  carbs_g := greatest(0, floor((kcal - protein_g * 4 - fat_g * 9) / 4 + 0.5));
  if carbs_g = 0 then
    warnings := warnings || jsonb_build_array('Proteínas y grasas ya cubren toda la meta: los hidratos quedaron en cero. Bajá la proteína por kilo o el porcentaje de grasa.');
  end if;
  if floor(kcal + 0.5) not between 500 and 8000 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  return jsonb_build_object(
    'bmr', floor(bmr + 0.5), 'tdee', floor(tdee + 0.5), 'kcal', floor(kcal + 0.5),
    'protein_g', protein_g, 'fat_g', fat_g, 'carbs_g', carbs_g,
    'protein_pct', floor(protein_g * 4 / kcal * 100 + 0.5),
    'fat_pct', floor(fat_g * 9 / kcal * 100 + 0.5),
    'carbs_pct', floor(carbs_g * 4 / kcal * 100 + 0.5), 'warnings', warnings
  );
end; $$;
revoke all on function public.calculate_nutrition_target(jsonb) from public, anon, authenticated;
grant execute on function public.calculate_nutrition_target(jsonb) to service_role;

create or replace function public.save_nutrition_target(target uuid, target_inputs jsonb, target_result jsonb, publish boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  row public.nutrition_targets;
  key text;
  calculated jsonb;
begin
  if auth.uid() is null or public.my_nutritionist_id() is null or not public.is_assigned_patient(target) then
    raise exception using errcode='42501', message='nutrition_target_pro_only';
  end if;
  -- Comparte la cerradura con el retiro: éste no puede intercalarse con el guardado.
  perform 1 from public.patients p where p.id=target
    and p.nutritionist_id=public.my_nutritionist_id()
    and p.deactivated_at is null and p.anonymized_at is null for update;
  if not found then
    raise exception using errcode='42501', message='nutrition_target_pro_only';
  end if;
  if publish is null or jsonb_typeof(target_result) is distinct from 'object'
    or jsonb_typeof(target_result->'warnings') is distinct from 'array' then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  foreach key in array array['bmr','tdee','kcal','protein_g','fat_g','carbs_g','protein_pct','fat_pct','carbs_pct'] loop
    if jsonb_typeof(target_result->key) is distinct from 'number' then
      raise exception using errcode='22023', message='nutrition_target_data';
    end if;
  end loop;
  if (target_result->>'kcal')::numeric not between 500 and 8000 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  calculated := public.calculate_nutrition_target(target_inputs);
  insert into public.nutrition_targets(patient_id,inputs,result,published_at,updated_at)
    values(target,target_inputs,calculated,case when publish then clock_timestamp() end,clock_timestamp())
  on conflict(patient_id) do update
    set inputs=excluded.inputs,result=excluded.result,published_at=excluded.published_at,updated_at=excluded.updated_at
  returning * into row;
  return to_jsonb(row);
end; $$;

create or replace function public.save_my_body_data(body jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_patient_id();
  row public.patient_body_data;
  born date;
  age_value int;
  height_value numeric;
  weight_value numeric;
begin
  if auth.uid() is null or pid is null then
    raise exception using errcode='42501', message='body_data_patient_only';
  end if;
  perform 1 from public.patients p where p.id=pid
    and p.user_id=auth.uid()
    and p.deactivated_at is null and p.anonymized_at is null for update;
  if not found then
    raise exception using errcode='42501', message='body_data_patient_only';
  end if;
  if jsonb_typeof(body) is distinct from 'object' then
    raise exception using errcode='22023', message='body_data_invalid';
  end if;
  if (select count(*) from jsonb_object_keys(body)) <> 4
    or coalesce(body->>'sex','') not in ('femenino','masculino')
    or jsonb_typeof(body->'birth_date') is distinct from 'string'
    or (body->>'birth_date') !~ '^\d{4}-\d{2}-\d{2}$'
    or jsonb_typeof(body->'height_cm') is distinct from 'number'
    or jsonb_typeof(body->'weight_kg') is distinct from 'number' then
    raise exception using errcode='22023', message='body_data_invalid';
  end if;
  begin
    born := (body->>'birth_date')::date;
    height_value := (body->>'height_cm')::numeric;
    weight_value := (body->>'weight_kg')::numeric;
  exception when datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range or invalid_text_representation then
    raise exception using errcode='22023', message='body_data_invalid';
  end;
  age_value := extract(year from age((clock_timestamp() at time zone 'UTC')::date,born));
  if age_value not between 15 and 100 or height_value not between 120 and 230 or weight_value not between 30 and 300 then
    raise exception using errcode='22023', message='body_data_invalid';
  end if;
  insert into public.patient_body_data(patient_id,sex,birth_date,height_cm,weight_kg,updated_at)
    values(pid,body->>'sex',born,height_value,weight_value,clock_timestamp())
  on conflict(patient_id) do update set sex=excluded.sex,birth_date=excluded.birth_date,
    height_cm=excluded.height_cm,weight_kg=excluded.weight_kg,updated_at=excluded.updated_at
  returning * into row;
  delete from public.patient_body_data_requests where patient_id=pid;
  return to_jsonb(row);
end; $$;

create or replace function public.request_body_data(target uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.my_nutritionist_id() is null or not public.is_assigned_patient(target) then
    raise exception using errcode='42501', message='body_data_pro_only';
  end if;
  perform 1 from public.patients p where p.id=target
    and p.nutritionist_id=public.my_nutritionist_id()
    and p.deactivated_at is null and p.anonymized_at is null for update;
  if not found then
    raise exception using errcode='42501', message='body_data_pro_only';
  end if;
  insert into public.patient_body_data_requests(patient_id) values(target)
    on conflict(patient_id) do update set requested_at=clock_timestamp();
  return jsonb_build_object('patient_id',target,'requested',true);
end; $$;

alter policy nutrition_targets_read_pro on public.nutrition_targets using (
  public.is_assigned_patient(patient_id) and private.nutrition_patient_is_active(patient_id)
);
alter policy nutrition_targets_read_patient on public.nutrition_targets using (
  published_at is not null and patient_id=public.my_patient_id() and private.nutrition_patient_is_active(patient_id)
);
alter policy body_data_read_pro on public.patient_body_data using (
  public.is_assigned_patient(patient_id) and private.nutrition_patient_is_active(patient_id)
);
alter policy body_data_read_self on public.patient_body_data using (
  patient_id=public.my_patient_id() and private.nutrition_patient_is_active(patient_id)
);
alter policy body_requests_read_pro on public.patient_body_data_requests using (
  public.is_assigned_patient(patient_id) and private.nutrition_patient_is_active(patient_id)
);
alter policy body_requests_read_self on public.patient_body_data_requests using (
  patient_id=public.my_patient_id() and private.nutrition_patient_is_active(patient_id)
);

revoke all on public.nutrition_targets,public.patient_body_data,public.patient_body_data_requests from public,anon;
revoke insert,update,delete,truncate,references,trigger on public.nutrition_targets,public.patient_body_data,public.patient_body_data_requests from authenticated;
grant select on public.nutrition_targets,public.patient_body_data,public.patient_body_data_requests to authenticated;
revoke all on function public.save_nutrition_target(uuid,jsonb,jsonb,boolean),public.save_my_body_data(jsonb),public.request_body_data(uuid) from public,anon;
grant execute on function public.save_nutrition_target(uuid,jsonb,jsonb,boolean),public.save_my_body_data(jsonb),public.request_body_data(uuid) to authenticated;

-- Actualiza los vencimientos ya calculados con la función corregida por la migración
-- service_months_anchor previa. No crea ni modifica pagos, montos o precios.
do $$
declare target uuid;
begin
  for target in
    select s.nutritionist_id from public.nutritionist_subscriptions s
    where s.paid_until is not null or exists (
      select 1 from public.service_payments p where p.nutritionist_id=s.nutritionist_id and p.status='confirmed'
    )
  loop
    perform public.service_recompute(target);
  end loop;
end; $$;
