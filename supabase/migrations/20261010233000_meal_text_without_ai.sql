-- D5: el diario de texto se guarda aunque no haya permiso de IA.
-- Suma el estado 'skipped' (no se pidió estimación). No es un fallo del proveedor.
-- No borra ni reescribe comidas ya guardadas.
-- Para volver atrás: no debe quedar ninguna fila con analysis_status o status 'skipped'.
-- Después se puede restaurar el check anterior (pending, succeeded, failed)
-- y la función record_meal_analysis previa a esta migración.

alter table public.meal_logs drop constraint if exists meal_logs_analysis_status_check;
alter table public.meal_logs
  add constraint meal_logs_analysis_status_check
  check (analysis_status in ('pending', 'succeeded', 'failed', 'skipped'));

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'meal_analysis_runs'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.meal_analysis_runs drop constraint %I', cname);
  end loop;
end $$;

alter table public.meal_analysis_runs
  add constraint meal_analysis_runs_status_check
  check (status in ('pending', 'succeeded', 'failed', 'skipped'));

create or replace function public.record_meal_analysis(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  lid uuid;
  existing public.meal_logs;
  accepted boolean;
  note text;
  conf numeric;
begin
  if payload->>'status' = 'skipped' then
    if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 16000 then
      raise exception using errcode = '22023', message = 'diary_invalid';
    end if;
    begin
      lid := (payload->>'meal_id')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'diary_invalid';
    end;
    if lid is null then
      raise exception using errcode = '22023', message = 'diary_invalid';
    end if;
    select * into existing from public.meal_logs where id = lid;
    if not found then
      raise exception using errcode = 'PT404', message = 'meal_missing';
    end if;
    perform public.diary_assert_access(existing.patient_id, false);
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
    select * into existing from public.meal_logs where id = lid;
    if payload->'foods' is distinct from '[]'::jsonb then
      raise exception using errcode = '22023', message = 'diary_foods';
    end if;
    if payload->'macros' is not null and payload->'macros' is distinct from 'null'::jsonb then
      raise exception using errcode = '22023', message = 'diary_macros';
    end if;
    begin
      conf := coalesce((payload->>'confidence')::numeric, 0);
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'diary_confidence';
    end;
    if conf <> 0 then
      raise exception using errcode = '22023', message = 'diary_confidence';
    end if;
    note := coalesce(payload->>'note_for_nutri', '');
    if char_length(note) > 2000 then
      raise exception using errcode = '22023', message = 'diary_note';
    end if;
    insert into public.meal_analysis_runs (meal_log_id, status, foods, macros, confidence, error_code)
    values (lid, 'skipped', '[]'::jsonb, null, 0, nullif(payload->>'error_code', ''));
    if existing.status = 'pending_review' and existing.analysis_status is distinct from 'succeeded' then
      update public.meal_logs
        set foods = '[]'::jsonb,
            macros = null,
            confidence = 0,
            note_for_nutri = note,
            analysis_status = 'skipped'
        where id = lid;
    end if;
    return public.meal_log_json(lid);
  end if;

  begin
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'diary_invalid';
  end;
  if lid is null then
    raise exception using errcode = '22023', message = 'diary_invalid';
  end if;
  select * into existing from public.meal_logs where id = lid;
  if not found then
    raise exception using errcode = 'PT404', message = 'meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  select * into existing from public.meal_logs where id = lid;
  accepted := existing.status = 'pending_review'
    and existing.analysis_status is distinct from 'succeeded'
    and payload->>'status' = 'succeeded';
  result := public.record_meal_analysis_pre_product(payload);
  if accepted then
    update public.meal_logs
      set nutrition_origin = 'ai_estimate'
      where id = lid
        and nutrition_origin is null
        and analysis_status = 'succeeded'
        and macros is not null;
  end if;
  return public.meal_log_json(lid);
end;
$$;

revoke all on function public.record_meal_analysis(jsonb) from public, anon;
grant execute on function public.record_meal_analysis(jsonb) to authenticated;
