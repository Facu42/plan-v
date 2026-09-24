-- PV-22: diario de comidas persistente (foto/texto). Guardar, analizar, revisar.
-- El registro vive aunque la IA falle. Duplicados por client_id no crean otra comida.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes. No crea buckets.

alter table public.meal_logs
  add column if not exists client_id uuid,
  add column if not exists analysis_status text not null default 'pending';

alter table public.meal_logs drop constraint if exists meal_logs_analysis_status_check;
alter table public.meal_logs
  add constraint meal_logs_analysis_status_check
  check (analysis_status in ('pending', 'succeeded', 'failed'));

create unique index if not exists meal_logs_patient_client_uidx
  on public.meal_logs (patient_id, client_id)
  where client_id is not null;

create table if not exists public.meal_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  foods jsonb,
  macros jsonb,
  confidence numeric,
  error_code text,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.meal_reviews (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  status public.meal_log_status not null,
  foods jsonb,
  macros jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists meal_analysis_runs_log_idx on public.meal_analysis_runs (meal_log_id, created_at desc);
create index if not exists meal_reviews_log_idx on public.meal_reviews (meal_log_id, created_at desc);

alter table public.meal_analysis_runs enable row level security;
alter table public.meal_reviews enable row level security;

revoke all on public.meal_analysis_runs, public.meal_reviews from public, anon, authenticated;
grant select, insert on public.meal_analysis_runs, public.meal_reviews to authenticated;

-- Nutri asignada lee/append. Paciente sin policy = no ve corridas ni revisiones crudas.
create policy meal_analysis_runs_nutri_select on public.meal_analysis_runs
  for select to authenticated
  using (exists (
    select 1 from public.meal_logs l
    where l.id = meal_log_id and public.is_assigned_patient(l.patient_id)
  ));

create policy meal_analysis_runs_nutri_insert on public.meal_analysis_runs
  for insert to authenticated
  with check (exists (
    select 1 from public.meal_logs l
    where l.id = meal_log_id and public.is_assigned_patient(l.patient_id)
  ));

create policy meal_reviews_nutri_select on public.meal_reviews
  for select to authenticated
  using (exists (
    select 1 from public.meal_logs l
    where l.id = meal_log_id and public.is_assigned_patient(l.patient_id)
  ));

create policy meal_reviews_nutri_insert on public.meal_reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.meal_logs l
      where l.id = meal_log_id and public.is_assigned_patient(l.patient_id)
    )
  );

drop policy if exists meal_logs_patient_insert on public.meal_logs;
create policy meal_logs_patient_insert on public.meal_logs
  for insert
  with check (
    patient_id = public.my_patient_id()
    and public.patient_has_full_access(patient_id)
    and status = 'pending_review'
    and note_for_nutri = ''
    and analysis_status = 'pending'
    and (photo_path is null or photo_path like 'patients/' || patient_id::text || '/%')
  );

create or replace view public.meal_logs_patient_view
as
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
    logged_at,
    analysis_status
  from public.meal_logs
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());

grant select on public.meal_logs_patient_view to authenticated;

create or replace function public.diary_assert_access(target uuid, professional boolean default false)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target, professional);
  if not professional and public.my_patient_id() = target and not public.patient_has_full_access(target) then
    raise exception using errcode='42501', message='diary_forbidden';
  end if;
end; $$;

create or replace function public.meal_log_json(lid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', l.id,
    'patient_id', l.patient_id,
    'slot', l.slot_label,
    'photo_url', l.photo_path,
    'description', l.description,
    'foods', l.foods,
    'macros', l.macros,
    'confidence', l.confidence,
    'note_for_nutri', l.note_for_nutri,
    'status', l.status,
    'analysis_status', l.analysis_status,
    'logged_at', l.logged_at
  )
  from public.meal_logs l
  where l.id = lid;
$$;

create or replace function public.diary_validate_foods(value jsonb)
returns void language plpgsql set search_path='' as $$
declare item jsonb;
begin
  if jsonb_typeof(value) is distinct from 'array' or jsonb_array_length(value) > 8 then
    raise exception using errcode='22023', message='diary_foods';
  end if;
  for item in select v from jsonb_array_elements(value) as t(v) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'name') is distinct from 'string'
      or char_length(btrim(item->>'name')) not between 1 and 120
      or item->>'portion_unit' not in ('g','ml','u')
      or jsonb_typeof(item->'confidence') is distinct from 'number'
      or (item->>'confidence')::numeric < 0
      or (item->>'confidence')::numeric > 1
      or (
        item->'portion_est' is distinct from 'null'::jsonb
        and (
          jsonb_typeof(item->'portion_est') is distinct from 'number'
          or (item->>'portion_est')::numeric < 0
          or (item->>'portion_est')::numeric > 10000
        )
      )
    then
      raise exception using errcode='22023', message='diary_foods';
    end if;
  end loop;
end; $$;

create or replace function public.save_meal_log(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  cid uuid;
  slot text;
  photo text;
  descr text;
  existing public.meal_logs;
  created public.meal_logs;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 16000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','client_id','slot','description','photo_path')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if pid is null or cid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  perform public.diary_assert_access(pid, false);
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
    descr := btrim(payload->>'description');
    if char_length(descr) = 0 then descr := null; end if;
    if descr is not null and char_length(descr) > 1000 then
      raise exception using errcode='22023', message='diary_description';
    end if;
  end if;
  if payload->'photo_path' is null or payload->'photo_path' = 'null'::jsonb then
    photo := null;
  else
    if jsonb_typeof(payload->'photo_path') is distinct from 'string' then
      raise exception using errcode='22023', message='diary_photo';
    end if;
    photo := payload->>'photo_path';
    if photo is not null and photo not like 'patients/' || pid::text || '/%' then
      raise exception using errcode='22023', message='diary_photo';
    end if;
  end if;
  if descr is null and photo is null then
    raise exception using errcode='22023', message='diary_input';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text || ':' || cid::text, 0));
  select * into existing from public.meal_logs where patient_id = pid and client_id = cid;
  if found then
    return jsonb_build_object('log', public.meal_log_json(existing.id), 'duplicate', true);
  end if;
  insert into public.meal_logs (
    patient_id, client_id, slot_label, photo_path, description,
    foods, macros, confidence, note_for_nutri, status, analysis_status
  ) values (
    pid, cid, slot, photo, descr,
    '[]'::jsonb, null, 0, '', 'pending_review', 'pending'
  ) returning * into created;
  return jsonb_build_object('log', public.meal_log_json(created.id), 'duplicate', false);
end; $$;

create or replace function public.record_meal_analysis(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  lid uuid;
  run_status text;
  run_foods jsonb;
  run_macros jsonb;
  conf numeric;
  note text;
  err text;
  existing public.meal_logs;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 16000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('meal_id','status','foods','macros','confidence','note_for_nutri','error_code')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if lid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  run_status := payload->>'status';
  if run_status not in ('succeeded','failed') then
    raise exception using errcode='22023', message='diary_status';
  end if;
  select * into existing from public.meal_logs where id = lid;
  if not found then
    raise exception using errcode='PT404', message='meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, false);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  select * into existing from public.meal_logs where id = lid;
  run_foods := coalesce(payload->'foods', '[]'::jsonb);
  perform public.diary_validate_foods(run_foods);
  if payload->'macros' is null or payload->'macros' = 'null'::jsonb then
    run_macros := null;
  else
    if jsonb_typeof(payload->'macros') is distinct from 'object'
      or jsonb_typeof(payload->'macros'->'kcal') is distinct from 'number'
      or jsonb_typeof(payload->'macros'->'protein_g') is distinct from 'number'
      or jsonb_typeof(payload->'macros'->'carbs_g') is distinct from 'number'
      or jsonb_typeof(payload->'macros'->'fat_g') is distinct from 'number' then
      raise exception using errcode='22023', message='diary_macros';
    end if;
    run_macros := payload->'macros';
  end if;
  begin
    conf := coalesce((payload->>'confidence')::numeric, 0);
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_confidence';
  end;
  if conf < 0 or conf > 1 then
    raise exception using errcode='22023', message='diary_confidence';
  end if;
  note := coalesce(payload->>'note_for_nutri','');
  if char_length(note) > 2000 then
    raise exception using errcode='22023', message='diary_note';
  end if;
  err := nullif(payload->>'error_code','');
  insert into public.meal_analysis_runs (meal_log_id, status, foods, macros, confidence, error_code)
  values (lid, run_status, run_foods, run_macros, conf, err);
  if existing.status = 'pending_review' and existing.analysis_status is distinct from 'succeeded' then
    update public.meal_logs
      set foods = run_foods,
          macros = run_macros,
          confidence = conf,
          note_for_nutri = note,
          analysis_status = run_status
      where id = lid;
  end if;
  return public.meal_log_json(lid);
end; $$;

create or replace function public.review_meal_log(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  lid uuid;
  next_status public.meal_log_status;
  next_foods jsonb;
  next_macros jsonb;
  existing public.meal_logs;
  reviewer uuid;
begin
  reviewer := auth.uid();
  if reviewer is null then
    raise exception using errcode='42501', message='diary_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 16000 then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('meal_id','status','foods','macros')
  ) then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  begin
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='diary_invalid';
  end;
  if lid is null then
    raise exception using errcode='22023', message='diary_invalid';
  end if;
  if payload->>'status' not in ('confirmed','adjusted') then
    raise exception using errcode='22023', message='diary_status';
  end if;
  next_status := (payload->>'status')::public.meal_log_status;
  select * into existing from public.meal_logs where id = lid;
  if not found then
    raise exception using errcode='PT404', message='meal_missing';
  end if;
  perform public.diary_assert_access(existing.patient_id, true);
  if payload->'foods' is null or payload->'foods' = 'null'::jsonb then
    next_foods := existing.foods;
  else
    perform public.diary_validate_foods(payload->'foods');
    next_foods := payload->'foods';
  end if;
  if payload->'macros' is null or payload->'macros' = 'null'::jsonb then
    next_macros := existing.macros;
  else
    if jsonb_typeof(payload->'macros') is distinct from 'object' then
      raise exception using errcode='22023', message='diary_macros';
    end if;
    next_macros := payload->'macros';
  end if;
  if next_status = 'adjusted' and payload->'foods' is null and payload->'macros' is null then
    raise exception using errcode='22023', message='diary_adjust';
  end if;
  insert into public.meal_reviews (meal_log_id, reviewer_id, status, foods, macros)
  values (lid, reviewer, next_status, next_foods, next_macros);
  update public.meal_logs
    set status = next_status, foods = next_foods, macros = next_macros
    where id = lid;
  return public.meal_log_json(lid);
end; $$;

revoke all on function public.diary_assert_access(uuid,boolean),
  public.meal_log_json(uuid),
  public.diary_validate_foods(jsonb),
  public.save_meal_log(jsonb),
  public.record_meal_analysis(jsonb),
  public.review_meal_log(jsonb)
from public, anon;

grant execute on function public.save_meal_log(jsonb),
  public.record_meal_analysis(jsonb),
  public.review_meal_log(jsonb)
to authenticated;
