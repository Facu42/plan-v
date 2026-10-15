-- PV-22: la captura se guarda antes del análisis. El fallo de IA no borra la comida.
alter table public.meal_logs
  add column if not exists analysis_status text not null default 'succeeded'
  check (analysis_status in ('pending', 'succeeded', 'failed'));

drop view if exists public.meal_logs_patient_view;
create view public.meal_logs_patient_view as
  select
    id,
    patient_id,
    meal_slot_id,
    slot_label,
    photo_path,
    description,
    foods,
    macros,
    confidence,
    status,
    analysis_status,
    logged_at
  from public.meal_logs
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());
grant select on public.meal_logs_patient_view to authenticated;

create function public.save_meal_capture(
  log_id uuid,
  target uuid,
  slot_value text,
  photo_path_value text,
  description_value text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  existing public.meal_logs;
  result public.meal_logs;
begin
  if target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then
    raise exception using errcode='42501', message='meal_patient_only';
  end if;
  if slot_value not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra') then
    raise exception using errcode='22023', message='meal_slot';
  end if;
  if photo_path_value is not null and photo_path_value not like 'patients/' || target::text || '/%' then
    raise exception using errcode='22023', message='meal_photo_path';
  end if;
  if photo_path_value is not null and not public.care_consent(target, 'meal_photo') then
    raise exception using errcode='42501', message='meal_photo_consent';
  end if;
  if (description_value is null or btrim(description_value) = '') and photo_path_value is null then
    raise exception using errcode='22023', message='meal_capture';
  end if;
  if description_value is not null and length(description_value) > 1000 then
    raise exception using errcode='22023', message='meal_description';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(log_id::text, 0));
  select * into existing from public.meal_logs where id = log_id;
  if found then
    if existing.patient_id <> target
      or existing.slot_label is distinct from slot_value
      or existing.description is distinct from description_value
    then
      raise exception using errcode='PT409', message='meal_id_conflict';
    end if;
    return to_jsonb(existing);
  end if;
  insert into public.meal_logs (
    id, patient_id, slot_label, photo_path, description, foods, macros, confidence, note_for_nutri, status, analysis_status
  ) values (
    log_id, target, slot_value, photo_path_value, description_value, '[]'::jsonb, null, 0, '', 'pending_review', 'pending'
  ) returning * into result;
  return to_jsonb(result);
end; $$;

create function public.apply_meal_analysis(
  log_id uuid,
  target uuid,
  foods_value jsonb,
  macros_value jsonb,
  confidence_value numeric,
  note_value text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  existing public.meal_logs;
  result public.meal_logs;
begin
  if not (
    (target = public.my_patient_id() and public.patient_has_full_access(target))
    or public.is_assigned_patient(target)
  ) then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  if jsonb_typeof(foods_value) is distinct from 'array' or jsonb_array_length(foods_value) > 8 then
    raise exception using errcode='22023', message='meal_foods';
  end if;
  if macros_value is not null and jsonb_typeof(macros_value) is distinct from 'object' then
    raise exception using errcode='22023', message='meal_macros';
  end if;
  if confidence_value is null or confidence_value < 0 or confidence_value > 1 then
    raise exception using errcode='22023', message='meal_confidence';
  end if;
  if note_value is null or length(note_value) > 2000 then
    raise exception using errcode='22023', message='meal_note';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(log_id::text, 0));
  select * into existing from public.meal_logs where id = log_id and patient_id = target;
  if not found then raise exception using errcode='PT404', message='meal_missing'; end if;
  if existing.analysis_status = 'succeeded' then return to_jsonb(existing); end if;
  update public.meal_logs
    set foods = foods_value,
        macros = macros_value,
        confidence = confidence_value,
        note_for_nutri = note_value,
        analysis_status = 'succeeded'
    where id = log_id
    returning * into result;
  return to_jsonb(result);
end; $$;

create function public.fail_meal_analysis(log_id uuid, target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  existing public.meal_logs;
  result public.meal_logs;
begin
  if not (
    (target = public.my_patient_id() and public.patient_has_full_access(target))
    or public.is_assigned_patient(target)
  ) then
    raise exception using errcode='42501', message='meal_forbidden';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(log_id::text, 0));
  select * into existing from public.meal_logs where id = log_id and patient_id = target;
  if not found then raise exception using errcode='PT404', message='meal_missing'; end if;
  if existing.analysis_status = 'succeeded' then return to_jsonb(existing); end if;
  update public.meal_logs set analysis_status = 'failed' where id = log_id returning * into result;
  return to_jsonb(result);
end; $$;

revoke all on function public.save_meal_capture(uuid, uuid, text, text, text),
  public.apply_meal_analysis(uuid, uuid, jsonb, jsonb, numeric, text),
  public.fail_meal_analysis(uuid, uuid)
  from public, anon;
grant execute on function public.save_meal_capture(uuid, uuid, text, text, text),
  public.apply_meal_analysis(uuid, uuid, jsonb, jsonb, numeric, text),
  public.fail_meal_analysis(uuid, uuid)
  to authenticated;
