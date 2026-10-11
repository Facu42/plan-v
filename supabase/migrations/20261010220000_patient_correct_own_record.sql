-- D4: la paciente corrige o borra una comida o medida propia mientras no está revisada.
-- Si ya fue revisada, sólo puede pedir la corrección: el registro no cambia.
-- La frase escrita de Facundo aplica esta migración en la base en línea. Hasta entonces queda en el repositorio.

create or replace function public.correct_own_meal(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  lid uuid;
  slot text;
  descr text;
  existing public.meal_logs;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','meal_id','slot','description')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if pid is null or lid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  select * into existing from public.meal_logs where id = lid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if existing.status is distinct from 'pending_review' then
    raise exception using errcode='PT409', message='meal_reviewed';
  end if;
  slot := btrim(coalesce(payload->>'slot',''));
  if slot not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra') then
    raise exception using errcode='22023', message='diary_slot';
  end if;
  if payload->'description' is null or payload->'description' = 'null'::jsonb then
    descr := null;
  else
    if jsonb_typeof(payload->'description') is distinct from 'string' then
      raise exception using errcode='22023', message='diary_description';
    end if;
    descr := nullif(btrim(payload->>'description'), '');
    if descr is not null and char_length(descr) > 1000 then
      raise exception using errcode='22023', message='diary_description';
    end if;
  end if;
  if descr is null and existing.photo_path is null then
    raise exception using errcode='22023', message='diary_input';
  end if;
  update public.meal_logs
    set slot_label = slot,
        description = descr
    where id = lid
      and patient_id = pid
      and status = 'pending_review';
  if not found then
    raise exception using errcode='PT409', message='meal_reviewed';
  end if;
  return public.meal_log_json(lid);
end; $$;

create or replace function public.delete_own_meal(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  lid uuid;
  existing public.meal_logs;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 2000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','meal_id')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if pid is null or lid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  select * into existing from public.meal_logs where id = lid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if existing.status is distinct from 'pending_review' then
    raise exception using errcode='PT409', message='meal_reviewed';
  end if;
  delete from public.meal_logs
    where id = lid and patient_id = pid and status = 'pending_review';
  if not found then
    raise exception using errcode='PT409', message='meal_reviewed';
  end if;
  return jsonb_build_object('deleted', true);
end; $$;

create or replace function public.request_meal_correction(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  lid uuid;
  cid uuid;
  note text;
  body text;
  existing public.meal_logs;
  sent jsonb;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','meal_id','note','client_id')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    lid := (payload->>'meal_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if pid is null or lid is null or cid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if jsonb_typeof(payload->'note') is distinct from 'string' then
    raise exception using errcode='22023', message='diary_note';
  end if;
  note := btrim(payload->>'note');
  if char_length(note) not between 1 and 500 then
    raise exception using errcode='22023', message='diary_note';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  select * into existing from public.meal_logs where id = lid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if existing.status = 'pending_review' then
    raise exception using errcode='PT409', message='meal_open';
  end if;
  body := 'Quiero corregir una comida ya revisada ('
    || existing.slot_label || ', '
    || to_char(existing.logged_at at time zone 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY')
    || '): ' || note;
  sent := public.send_thread_message(jsonb_build_object(
    'patient_id', existing.patient_id,
    'client_id', cid,
    'text', body,
    'suggested_by_ai', false
  ));
  return jsonb_build_object(
    'requested', true,
    'duplicate', coalesce((sent->>'duplicate')::boolean, false)
  );
end; $$;

create or replace function public.correct_own_measurement(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  rid uuid;
  val numeric;
  kind text;
  src text;
  existing public.care_records;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 2000 then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','record_id','value')
  ) then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    rid := (payload->>'record_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='care_invalid';
  end;
  if pid is null or rid is null or jsonb_typeof(payload->'value') is distinct from 'number' then
    raise exception using errcode='22023', message='care_value';
  end if;
  begin
    val := (payload->>'value')::numeric;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='care_value';
  end;
  if val::text in ('NaN','Infinity','-Infinity') then
    raise exception using errcode='22023', message='care_value';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text, 0));
  select * into existing from public.care_records where id = rid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='measure_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if not public.care_consent(existing.patient_id, 'measurement') then
    raise exception using errcode='42501', message='care_measurement_consent';
  end if;
  kind := existing.data->>'kind';
  if kind not in ('weight','waist','hip') then
    raise exception using errcode='22023', message='care_kind';
  end if;
  src := coalesce(nullif(existing.data->>'source', ''), (
    select m.source from public.measurements m where m.id = rid and m.patient_id = pid
  ));
  if src is distinct from 'patient' then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if (kind = 'weight' and (val < 1 or val > 500)) or (kind in ('waist','hip') and (val < 10 or val > 300)) then
    raise exception using errcode='22023', message='care_value';
  end if;
  if existing.reviewed_at is not null then
    raise exception using errcode='PT409', message='measure_reviewed';
  end if;
  update public.care_records
    set data = jsonb_set(data, '{value}', to_jsonb(val), false)
    where id = rid and patient_id = pid and reviewed_at is null and data->>'kind' = kind;
  if not found then
    raise exception using errcode='PT409', message='measure_reviewed';
  end if;
  update public.measurements
    set value_numeric = val
    where id = rid and patient_id = pid and source = 'patient';
  return jsonb_build_object('corrected', true, 'value', val);
end; $$;

create or replace function public.delete_own_measurement(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  rid uuid;
  kind text;
  src text;
  existing public.care_records;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 2000 then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','record_id')
  ) then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    rid := (payload->>'record_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='care_invalid';
  end;
  if pid is null or rid is null then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text, 0));
  select * into existing from public.care_records where id = rid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='measure_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if not public.care_consent(existing.patient_id, 'measurement') then
    raise exception using errcode='42501', message='care_measurement_consent';
  end if;
  kind := existing.data->>'kind';
  if kind not in ('weight','waist','hip') then
    raise exception using errcode='22023', message='care_kind';
  end if;
  src := coalesce(nullif(existing.data->>'source', ''), (
    select m.source from public.measurements m where m.id = rid and m.patient_id = pid
  ));
  if src is distinct from 'patient' then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if existing.reviewed_at is not null then
    raise exception using errcode='PT409', message='measure_reviewed';
  end if;
  delete from public.measurements where id = rid and patient_id = pid and source = 'patient';
  delete from public.care_records
    where id = rid and patient_id = pid and reviewed_at is null and data->>'kind' = kind;
  if not found then
    raise exception using errcode='PT409', message='measure_reviewed';
  end if;
  return jsonb_build_object('deleted', true);
end; $$;

create or replace function public.request_measurement_correction(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  rid uuid;
  cid uuid;
  note text;
  kind text;
  src text;
  label text;
  body text;
  existing public.care_records;
  sent jsonb;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','record_id','note','client_id')
  ) then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    rid := (payload->>'record_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='care_invalid';
  end;
  if pid is null or rid is null or cid is null then
    raise exception using errcode='22023', message='care_invalid';
  end if;
  if jsonb_typeof(payload->'note') is distinct from 'string' then
    raise exception using errcode='22023', message='care_text';
  end if;
  note := btrim(payload->>'note');
  if char_length(note) not between 1 and 500 then
    raise exception using errcode='22023', message='care_text';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text, 0));
  select * into existing from public.care_records where id = rid;
  if not found or existing.patient_id is distinct from pid then
    raise exception using errcode='PT404', message='measure_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  if public.my_patient_id() is distinct from existing.patient_id then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if not public.care_consent(existing.patient_id, 'measurement') then
    raise exception using errcode='42501', message='care_measurement_consent';
  end if;
  kind := existing.data->>'kind';
  if kind not in ('weight','waist','hip') then
    raise exception using errcode='22023', message='care_kind';
  end if;
  src := coalesce(nullif(existing.data->>'source', ''), (
    select m.source from public.measurements m where m.id = rid and m.patient_id = pid
  ));
  if src is distinct from 'patient' then
    raise exception using errcode='42501', message='measure_forbidden';
  end if;
  if existing.reviewed_at is null then
    raise exception using errcode='PT409', message='measure_open';
  end if;
  label := case kind when 'weight' then 'Peso' when 'waist' then 'Cintura' else 'Cadera' end;
  body := 'Quiero corregir una medida ya revisada ('
    || label || ', '
    || to_char(existing.recorded_on, 'DD/MM/YYYY')
    || '): ' || note;
  sent := public.send_thread_message(jsonb_build_object(
    'patient_id', existing.patient_id,
    'client_id', cid,
    'text', body,
    'suggested_by_ai', false
  ));
  return jsonb_build_object(
    'requested', true,
    'duplicate', coalesce((sent->>'duplicate')::boolean, false)
  );
end; $$;

revoke all on function public.correct_own_meal(jsonb),
  public.delete_own_meal(jsonb),
  public.request_meal_correction(jsonb),
  public.correct_own_measurement(jsonb),
  public.delete_own_measurement(jsonb),
  public.request_measurement_correction(jsonb)
from public, anon, authenticated;

grant execute on function public.correct_own_meal(jsonb),
  public.delete_own_meal(jsonb),
  public.request_meal_correction(jsonb),
  public.correct_own_measurement(jsonb),
  public.delete_own_measurement(jsonb),
  public.request_measurement_correction(jsonb)
to authenticated;
