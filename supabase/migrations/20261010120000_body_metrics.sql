-- Mediciones de la ficha: composición corporal y perímetros cargados por la nutricionista.
-- Amplía public.measurements con métricas nuevas y agrega una función para cargar varias con una misma fecha.
-- Peso, cintura y cadera conservan su camino anterior (save_care_record). Los valores desconocidos no se guardan:
-- sólo hay filas para lo que la profesional completó. Sin recursos nuevos de Supabase.

do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid = 'public.measurements'::regclass and contype = 'c' loop
    execute format('alter table public.measurements drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.measurements
  add constraint measurements_kind_check check (kind in (
    'weight', 'waist', 'hip', 'other',
    'height',
    'body_fat_pct', 'fat_mass', 'muscle_pct', 'muscle_mass', 'body_water_pct', 'protein_mass', 'visceral_fat', 'bmr', 'metabolic_age',
    'abdomen', 'shoulders', 'chest', 'arm', 'thigh'
  )),
  add constraint measurements_value_check check (
    (kind = 'weight' and unit in ('kg', 'lb') and value_numeric between 1 and 500)
    or (kind in ('waist', 'hip') and unit in ('cm', 'in') and value_numeric between 10 and 300)
    or (kind = 'other' and char_length(unit) between 1 and 16)
    or (kind = 'height' and unit = 'cm' and value_numeric between 50 and 260)
    or (kind in ('abdomen', 'shoulders', 'chest', 'arm', 'thigh') and unit = 'cm' and value_numeric between 10 and 300)
    or (kind = 'body_fat_pct' and unit = '%' and value_numeric between 1 and 80)
    or (kind = 'fat_mass' and unit = 'kg' and value_numeric between 0.5 and 300)
    or (kind = 'muscle_pct' and unit = '%' and value_numeric between 5 and 80)
    or (kind = 'muscle_mass' and unit = 'kg' and value_numeric between 1 and 200)
    or (kind = 'body_water_pct' and unit = '%' and value_numeric between 20 and 80)
    or (kind = 'protein_mass' and unit = 'kg' and value_numeric between 1 and 60)
    or (kind = 'visceral_fat' and unit = 'nivel' and value_numeric between 1 and 60 and value_numeric = trunc(value_numeric))
    or (kind = 'bmr' and unit = 'kcal' and value_numeric between 300 and 6000 and value_numeric = trunc(value_numeric))
    or (kind = 'metabolic_age' and unit = 'años' and value_numeric between 5 and 120 and value_numeric = trunc(value_numeric))
  );

-- Carga de la profesional asignada: varias métricas nuevas con la misma fecha, todo o nada, reintento seguro por id.
create or replace function public.save_body_metrics(target uuid, captured date, items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb; item_id uuid; item_kind text; item_value numeric; item_unit text; existing public.measurements;
  total integer; result jsonb := '[]'::jsonb; row_saved public.measurements; lock_key text; kinds text[] := '{}'; ids uuid[] := '{}';
begin
  perform public.intake_assert_access(target, true);
  if not public.is_assigned_patient(target) then raise exception using errcode = '42501', message = 'care_pro_only'; end if;
  if not public.care_consent(target, 'measurement') then raise exception using errcode = '42501', message = 'care_measurement_consent'; end if;
  if captured is null or captured > (now() at time zone 'America/Argentina/Buenos_Aires')::date then raise exception using errcode = '22023', message = 'care_date'; end if;
  if jsonb_typeof(items) is distinct from 'array' then raise exception using errcode = '22023', message = 'care_fields'; end if;
  total := jsonb_array_length(items);
  if total < 1 or total > 15 then raise exception using errcode = '22023', message = 'care_fields'; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'object' or exists (select 1 from jsonb_object_keys(item) k where k not in ('id', 'kind', 'value'))
      or not (item ?& array['id', 'kind', 'value']) or jsonb_typeof(item->'value') is distinct from 'number'
      or jsonb_typeof(item->'id') is distinct from 'string' or jsonb_typeof(item->'kind') is distinct from 'string' then
      raise exception using errcode = '22023', message = 'care_fields';
    end if;
    begin item_id := (item->>'id')::uuid; exception when others then raise exception using errcode = '22023', message = 'care_fields'; end;
    item_kind := item->>'kind'; item_value := (item->>'value')::numeric;
    item_unit := case item_kind
      when 'height' then 'cm' when 'abdomen' then 'cm' when 'shoulders' then 'cm' when 'chest' then 'cm' when 'arm' then 'cm' when 'thigh' then 'cm'
      when 'body_fat_pct' then '%' when 'muscle_pct' then '%' when 'body_water_pct' then '%'
      when 'fat_mass' then 'kg' when 'muscle_mass' then 'kg' when 'protein_mass' then 'kg'
      when 'visceral_fat' then 'nivel' when 'bmr' then 'kcal' when 'metabolic_age' then 'años'
      else null end;
    if item_unit is null or item_kind = any(kinds) or item_id = any(ids) then raise exception using errcode = '22023', message = 'care_kind'; end if;
    kinds := kinds || item_kind; ids := ids || item_id;
  end loop;
  for item in select value from jsonb_array_elements(items) loop
    item_id := (item->>'id')::uuid; item_kind := item->>'kind'; item_value := (item->>'value')::numeric;
    item_unit := case item_kind
      when 'height' then 'cm' when 'abdomen' then 'cm' when 'shoulders' then 'cm' when 'chest' then 'cm' when 'arm' then 'cm' when 'thigh' then 'cm'
      when 'body_fat_pct' then '%' when 'muscle_pct' then '%' when 'body_water_pct' then '%'
      when 'fat_mass' then 'kg' when 'muscle_mass' then 'kg' when 'protein_mass' then 'kg'
      when 'visceral_fat' then 'nivel' when 'bmr' then 'kcal' else 'años' end;
    lock_key := item_id::text;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lock_key, 0));
    select * into existing from public.measurements where id = item_id;
    if found then
      if existing.patient_id <> target or existing.kind <> item_kind or existing.value_numeric <> item_value
        or existing.unit <> item_unit or existing.captured_on <> captured or existing.source <> 'professional' then
        raise exception using errcode = 'PT409', message = 'care_id_conflict';
      end if;
      row_saved := existing;
    else
      insert into public.measurements(id, patient_id, nutritionist_id, kind, value_numeric, unit, source, captured_on)
      select item_id, target, p.nutritionist_id, item_kind, item_value, item_unit, 'professional', captured
      from public.patients p where p.id = target
      returning * into row_saved;
    end if;
    result := result || jsonb_build_array(jsonb_build_object(
      'id', row_saved.id, 'patient_id', row_saved.patient_id, 'kind', row_saved.kind, 'value_numeric', row_saved.value_numeric,
      'unit', row_saved.unit, 'source', row_saved.source, 'captured_on', row_saved.captured_on, 'created_at', row_saved.created_at));
  end loop;
  return result;
end; $$;

revoke all on function public.save_body_metrics(uuid, date, jsonb) from public, anon;
grant execute on function public.save_body_metrics(uuid, date, jsonb) to authenticated;
