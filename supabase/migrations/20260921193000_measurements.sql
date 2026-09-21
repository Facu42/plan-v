-- PV-17: medidas opcionales (fecha, unidad, origen, historial). Dual-write con care_records.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes. Fotos/estudios nunca generan filas acá.

create table if not exists public.measurements (
  id uuid primary key,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  kind text not null check (kind in ('weight', 'waist', 'hip', 'other')),
  value_numeric numeric not null,
  unit text not null,
  source text not null check (source in ('patient', 'professional')),
  captured_on date not null,
  created_at timestamptz not null default clock_timestamp(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (
    (kind = 'weight' and unit in ('kg', 'lb') and value_numeric between 1 and 500)
    or (kind in ('waist', 'hip') and unit in ('cm', 'in') and value_numeric between 10 and 300)
    or (kind = 'other' and char_length(unit) between 1 and 16)
  )
);
create index if not exists measurements_patient_captured on public.measurements (patient_id, captured_on desc, created_at desc);

alter table public.measurements enable row level security;
revoke all on public.measurements from public, anon, authenticated;
grant select on public.measurements to authenticated;

create policy measurements_read on public.measurements for select to authenticated using (
  public.care_can_read(patient_id) and public.care_consent(patient_id, 'measurement')
);

create or replace function public.care_validate_data(d jsonb) returns void language plpgsql set search_path='' as $$
declare k text; kind text; required text[]; allowed text[]; val numeric; unit text; src text;
begin
  if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>4000 then raise exception using errcode='22023',message='care_invalid'; end if;
  kind:=d->>'kind';
  required:=case kind
    when 'weight' then array['kind','value','note']
    when 'waist' then array['kind','value','note']
    when 'hip' then array['kind','value','note']
    when 'activity' then array['kind','activity','minutes','intensity','kcal','note']
    when 'body_photo' then array['kind','path','note']
    when 'clinical_document' then array['kind','path','mime','filename','document_kind','note']
    when 'payment' then array['kind','amount','currency','method','reference','note']
    when 'menu_request' then array['kind','target','reason','replacement']
    else null end;
  allowed:=case kind
    when 'weight' then array['kind','value','note','unit','source']
    when 'waist' then array['kind','value','note','unit','source']
    when 'hip' then array['kind','value','note','unit','source']
    else required end;
  if required is null then raise exception using errcode='22023',message='care_kind'; end if;
  if exists(select 1 from jsonb_object_keys(d) key where not(key=any(allowed))) or not(d ?& required) then raise exception using errcode='22023',message='care_fields'; end if;
  foreach k in array allowed loop
    if not (d ? k) then continue; end if;
    if k not in ('value','minutes','kcal','amount') and (jsonb_typeof(d->k) is distinct from 'string' or length(d->>k)>500) then raise exception using errcode='22023',message='care_text'; end if;
  end loop;
  if kind in ('weight','waist','hip') then
    if jsonb_typeof(d->'value') is distinct from 'number' then raise exception using errcode='22023',message='care_value'; end if;
    val:=(d->>'value')::numeric;
    if (kind='weight' and (val<1 or val>500)) or (kind in ('waist','hip') and (val<10 or val>300)) then raise exception using errcode='22023',message='care_value'; end if;
    unit:=coalesce(nullif(d->>'unit',''), case when kind='weight' then 'kg' else 'cm' end);
    if kind='weight' and unit not in ('kg','lb') then raise exception using errcode='22023',message='care_unit'; end if;
    if kind in ('waist','hip') and unit not in ('cm','in') then raise exception using errcode='22023',message='care_unit'; end if;
    src:=coalesce(nullif(d->>'source',''),'');
    if src not in ('','patient','professional') then raise exception using errcode='22023',message='care_source'; end if;
  elsif kind='activity' then
    if length(btrim(d->>'activity')) not between 2 and 80 or jsonb_typeof(d->'minutes') is distinct from 'number'
      or (d->>'minutes')::numeric not between 1 and 600 or trunc((d->>'minutes')::numeric)<>(d->>'minutes')::numeric
      or d->>'intensity' not in ('suave','moderada','intensa') then raise exception using errcode='22023',message='care_activity'; end if;
    if d->'kcal'<>'null'::jsonb and (jsonb_typeof(d->'kcal') is distinct from 'number' or (d->>'kcal')::numeric not between 0 and 10000 or trunc((d->>'kcal')::numeric)<>(d->>'kcal')::numeric) then raise exception using errcode='22023',message='care_kcal'; end if;
  elsif kind='payment' then
    if jsonb_typeof(d->'amount') is distinct from 'number' or (d->>'amount')::numeric<=0 or (d->>'amount')::numeric>100000000
      or d->>'currency' not in ('ARS','USD') or d->>'method' not in ('transferencia','efectivo','tarjeta','otro') or length(d->>'reference')>120 then raise exception using errcode='22023',message='care_payment'; end if;
  elsif kind='menu_request' then
    if length(btrim(d->>'target')) not between 2 and 200 or length(btrim(d->>'reason')) not between 2 and 500 or d->>'replacement' not in ('recipe','ingredient') then raise exception using errcode='22023',message='care_request'; end if;
  elsif kind='clinical_document' then
    if d->>'mime' not in ('application/pdf','image/jpeg','image/png')
      or length(btrim(d->>'filename')) not between 1 and 120 or d->>'filename' ~ E'[/\\\\]'
      or length(d->>'document_kind')>80 then raise exception using errcode='22023',message='care_document'; end if;
  end if;
end; $$;

create or replace function public.save_care_record(target uuid,record_id uuid,record_date date,record_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.care_records; kind text; result public.care_records; unit text; src text;
begin
  perform public.intake_assert_access(target);
  perform public.care_validate_data(record_data); kind:=record_data->>'kind';
  if record_date is null or record_date>(now() at time zone 'America/Argentina/Buenos_Aires')::date then raise exception using errcode='22023',message='care_date'; end if;
  if kind='payment' then
    if not public.is_assigned_patient(target) then raise exception using errcode='42501',message='care_pro_only'; end if;
  elsif kind in ('weight','waist','hip') then
    if not (
      (target is not distinct from public.my_patient_id() and public.patient_has_full_access(target))
      or public.is_assigned_patient(target)
    ) then raise exception using errcode='42501',message='care_measure_actor'; end if;
  elsif target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then
    raise exception using errcode='42501',message='care_patient_only';
  end if;
  if kind in ('weight','waist','hip') then
    if not public.care_consent(target,'measurement') then raise exception using errcode='42501',message='care_measurement_consent'; end if;
    unit:=coalesce(nullif(record_data->>'unit',''), case when kind='weight' then 'kg' else 'cm' end);
    src:=coalesce(nullif(record_data->>'source',''), case
      when target is not distinct from public.my_patient_id() then 'patient'
      else 'professional' end);
    if target is not distinct from public.my_patient_id() and src is distinct from 'patient' then
      raise exception using errcode='42501',message='care_source_mismatch';
    end if;
    if public.is_assigned_patient(target) and target is distinct from public.my_patient_id() and src is distinct from 'professional' then
      raise exception using errcode='42501',message='care_source_mismatch';
    end if;
  end if;
  if kind='body_photo' then
    if not public.care_consent(target,'body_progress') then raise exception using errcode='42501',message='care_photo_consent'; end if;
    if record_data->>'path' is distinct from target::text||'/'||record_id::text then raise exception using errcode='22023',message='care_photo_path'; end if;
    if not exists(select 1 from storage.objects where bucket_id='care-photos' and name=record_data->>'path') then raise exception using errcode='22023',message='care_photo_missing'; end if;
  end if;
  if kind='clinical_document' then
    if not public.care_consent(target,'clinical_document') then raise exception using errcode='42501',message='care_document_consent'; end if;
    if record_data->>'path' is distinct from target::text||'/'||record_id::text then raise exception using errcode='22023',message='care_document_path'; end if;
    if not exists(select 1 from storage.objects where bucket_id='care-documents' and name=record_data->>'path') then raise exception using errcode='22023',message='care_document_missing'; end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(record_id::text,0));
  select * into existing from public.care_records where id=record_id;
  if found then
    if existing.patient_id<>target or existing.recorded_on<>record_date or existing.data<>record_data then raise exception using errcode='PT409',message='care_id_conflict'; end if;
    return to_jsonb(existing);
  end if;
  insert into public.care_records(id,patient_id,recorded_on,data,reviewed_at) values(record_id,target,record_date,record_data,case when kind='payment' then clock_timestamp() else null end) returning * into result;
  if kind in ('weight','waist','hip') then
    insert into public.measurements(id,patient_id,nutritionist_id,kind,value_numeric,unit,source,captured_on)
    select record_id, target, p.nutritionist_id, kind, (record_data->>'value')::numeric, unit, src, record_date
    from public.patients p where p.id=target;
  end if;
  return to_jsonb(result);
end; $$;

revoke all on function public.care_validate_data(jsonb), public.save_care_record(uuid,uuid,date,jsonb) from public, anon;
grant execute on function public.save_care_record(uuid,uuid,date,jsonb) to authenticated;
