-- Seguimiento privado. Escrituras mediante RPC validada e idempotente.
create function public.care_can_read(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.patients p where p.id=target
    and p.deactivated_at is null and p.anonymized_at is null
    and (p.id=public.my_patient_id() or public.is_assigned_patient(p.id)));
$$;
create function public.care_consent(target uuid, purpose_value text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.care_can_read(target) and coalesce((select e.decision='granted' and e.text_version=c.text_version and e.text_hash=c.text_hash
    from public.consent_events e join public.consent_catalog c on c.purpose=e.purpose
    where e.patient_id=target and e.purpose=purpose_value order by e.sequence desc limit 1),false);
$$;

create table public.care_records (
  id uuid primary key,
  patient_id uuid not null references public.patients(id),
  recorded_on date not null,
  data jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz,
  unique(id,patient_id)
);
create index care_records_patient_date on public.care_records(patient_id,created_at desc);
create table public.care_preferences (
  patient_id uuid primary key references public.patients(id),
  settings jsonb not null
);
create table public.care_replacements (
  id uuid primary key,
  patient_id uuid not null references public.patients(id),
  request_id uuid not null unique,
  recipe jsonb not null,
  source text not null check(source in ('ai','demo')),
  created_at timestamptz not null default clock_timestamp(),
  published_at timestamptz,
  foreign key(request_id,patient_id) references public.care_records(id,patient_id),
  check(jsonb_typeof(recipe)='object' and octet_length(recipe::text)<16000)
);
alter table public.care_records enable row level security;
alter table public.care_preferences enable row level security;
alter table public.care_replacements enable row level security;
create policy care_records_read on public.care_records for select to authenticated using (
  public.care_can_read(patient_id) and (data->>'kind'<>'payment' or public.is_assigned_patient(patient_id))
);
create policy care_preferences_read on public.care_preferences for select to authenticated using(public.care_can_read(patient_id));
create policy care_replacements_read on public.care_replacements for select to authenticated using(
  public.care_can_read(patient_id) and (public.is_assigned_patient(patient_id) or published_at is not null)
);
create policy care_replacements_insert on public.care_replacements for insert to authenticated with check(
  public.care_can_read(patient_id) and public.is_assigned_patient(patient_id) and public.care_consent(patient_id,'ai_menu_draft')
  and published_at is null and exists(select 1 from public.care_records r where r.id=request_id and r.patient_id=patient_id and r.data->>'kind'='menu_request')
);
revoke all on public.care_records,public.care_preferences,public.care_replacements from public,anon,authenticated;
grant select on public.care_records,public.care_preferences,public.care_replacements to authenticated;
grant insert on public.care_replacements to authenticated;

create function public.care_validate_data(d jsonb) returns void language plpgsql set search_path='' as $$
declare k text; kind text; allowed text[]; val numeric;
begin
  if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>4000 then raise exception using errcode='22023',message='care_invalid'; end if;
  kind:=d->>'kind';
  allowed:=case kind when 'weight' then array['kind','value','note'] when 'waist' then array['kind','value','note']
    when 'activity' then array['kind','activity','minutes','intensity','kcal','note'] when 'body_photo' then array['kind','path','note']
    when 'payment' then array['kind','amount','currency','method','reference','note'] when 'menu_request' then array['kind','target','reason','replacement'] else null end;
  if allowed is null then raise exception using errcode='22023',message='care_kind'; end if;
  if exists(select 1 from jsonb_object_keys(d) key where not(key=any(allowed))) or not(d ?& allowed) then raise exception using errcode='22023',message='care_fields'; end if;
  foreach k in array allowed loop
    if k not in ('value','minutes','kcal','amount') and (jsonb_typeof(d->k) is distinct from 'string' or length(d->>k)>500) then raise exception using errcode='22023',message='care_text'; end if;
  end loop;
  if kind in ('weight','waist') then
    if jsonb_typeof(d->'value') is distinct from 'number' then raise exception using errcode='22023',message='care_value'; end if;
    val:=(d->>'value')::numeric;
    if (kind='weight' and (val<1 or val>500)) or (kind='waist' and (val<10 or val>300)) then raise exception using errcode='22023',message='care_value'; end if;
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
  end if;
end; $$;

create function public.save_care_record(target uuid,record_id uuid,record_date date,record_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.care_records; kind text; result public.care_records;
begin
  perform public.intake_assert_access(target);
  perform public.care_validate_data(record_data); kind:=record_data->>'kind';
  if record_date is null or record_date>(now() at time zone 'America/Argentina/Buenos_Aires')::date then raise exception using errcode='22023',message='care_date'; end if;
  if kind='payment' then
    if not public.is_assigned_patient(target) then raise exception using errcode='42501',message='care_pro_only'; end if;
  elsif target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then raise exception using errcode='42501',message='care_patient_only'; end if;
  if kind in ('weight','waist') and not public.care_consent(target,'measurement') then raise exception using errcode='42501',message='care_measurement_consent'; end if;
  if kind='body_photo' then
    if not public.care_consent(target,'body_progress') then raise exception using errcode='42501',message='care_photo_consent'; end if;
    if record_data->>'path' is distinct from target::text||'/'||record_id::text then raise exception using errcode='22023',message='care_photo_path'; end if;
    if not exists(select 1 from storage.objects where bucket_id='care-photos' and name=record_data->>'path') then raise exception using errcode='22023',message='care_photo_missing'; end if;
  end if;
  -- Serializa reintentos con el mismo UUID incluso si llegan simultáneamente.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(record_id::text,0));
  select * into existing from public.care_records where id=record_id;
  if found then
    if existing.patient_id<>target or existing.recorded_on<>record_date or existing.data<>record_data then raise exception using errcode='PT409',message='care_id_conflict'; end if;
    return to_jsonb(existing);
  end if;
  insert into public.care_records(id,patient_id,recorded_on,data,reviewed_at) values(record_id,target,record_date,record_data,case when kind='payment' then clock_timestamp() else null end) returning * into result;
  return to_jsonb(result);
end; $$;

create function public.review_care_record(target uuid,record_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target,true);
  update public.care_records set reviewed_at=coalesce(reviewed_at,clock_timestamp()) where id=record_id and patient_id=target;
  if not found then raise exception using errcode='22023',message='care_missing'; end if;
end; $$;
create function public.save_care_preferences(target uuid,settings_value jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare key text;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then raise exception using errcode='42501',message='care_patient_only'; end if;
  if jsonb_typeof(settings_value) is distinct from 'object' or not(settings_value ?& array['weight','waist','activity','water','water_interval','rest','rest_time']) then raise exception using errcode='22023',message='care_preferences'; end if;
  if exists(select 1 from jsonb_object_keys(settings_value) k where k not in ('weight','waist','activity','water','water_interval','rest','rest_time')) then raise exception using errcode='22023',message='care_preferences'; end if;
  foreach key in array array['weight','waist','activity','water','rest'] loop
    if jsonb_typeof(settings_value->key) is distinct from 'boolean' then raise exception using errcode='22023',message='care_preferences'; end if;
  end loop;
  if jsonb_typeof(settings_value->'water_interval') is distinct from 'number' or (settings_value->>'water_interval')::numeric not between 30 and 240
    or trunc((settings_value->>'water_interval')::numeric)<>(settings_value->>'water_interval')::numeric
    or jsonb_typeof(settings_value->'rest_time') is distinct from 'string' or settings_value->>'rest_time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception using errcode='22023',message='care_preferences'; end if;
  insert into public.care_preferences(patient_id,settings) values(target,settings_value) on conflict(patient_id) do update set settings=excluded.settings;
end; $$;
create function public.care_validate_recipe(value jsonb) returns void
language plpgsql set search_path='' as $$
declare key text; item jsonb;
begin
  if jsonb_typeof(value) is distinct from 'object' or not(value ?& array['title','ingredients','steps','explanation'])
    or exists(select 1 from jsonb_object_keys(value) k where k not in ('title','ingredients','steps','explanation')) then raise exception using errcode='22023',message='care_recipe'; end if;
  foreach key in array array['title','explanation'] loop
    if jsonb_typeof(value->key) is distinct from 'string' or length(btrim(value->>key)) not between 2 and (case key when 'title' then 150 else 800 end) then raise exception using errcode='22023',message='care_recipe'; end if;
  end loop;
  foreach key in array array['ingredients','steps'] loop
    if jsonb_typeof(value->key) is distinct from 'array' or jsonb_array_length(value->key) not between 1 and (case key when 'ingredients' then 20 else 12 end) then raise exception using errcode='22023',message='care_recipe'; end if;
    for item in select jsonb_array_elements(value->key) loop
      if jsonb_typeof(item) is distinct from 'string' or length(btrim(item#>>'{}')) not between 1 and (case key when 'ingredients' then 150 else 400 end) then raise exception using errcode='22023',message='care_recipe'; end if;
    end loop;
  end loop;
end; $$;
create function public.care_check_recipe() returns trigger language plpgsql set search_path='' as $$
begin perform public.care_validate_recipe(new.recipe); return new; end; $$;
create trigger care_recipe_validation before insert or update on public.care_replacements for each row execute function public.care_check_recipe();
create function public.publish_care_replacement(target uuid,replacement_id uuid,expected_recipe jsonb,recipe_value jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare entry public.care_replacements;
begin
  perform public.intake_assert_access(target,true);
  perform public.care_validate_recipe(recipe_value);
  select * into entry from public.care_replacements where id=replacement_id and patient_id=target for update;
  if not found then raise exception using errcode='22023',message='care_missing'; end if;
  if entry.published_at is not null then
    if entry.recipe=recipe_value then return; end if;
    raise exception using errcode='PT409',message='care_already_published';
  end if;
  if entry.recipe is distinct from expected_recipe then raise exception using errcode='PT409',message='care_recipe_changed'; end if;
  update public.care_replacements set published_at=clock_timestamp(),recipe=recipe_value where id=replacement_id;
  perform public.review_care_record(target,entry.request_id);
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('care-photos','care-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy care_photo_read on storage.objects for select to authenticated using(
  bucket_id='care-photos' and (
    (split_part(name,'/',1)=public.my_patient_id()::text and public.care_consent(public.my_patient_id(),'body_progress'))
    or exists(select 1 from public.care_records r where r.data->>'path'=name and r.data->>'kind'='body_photo' and public.care_can_read(r.patient_id) and public.care_consent(r.patient_id,'body_progress')))
);
create policy care_photo_delete on storage.objects for delete to authenticated using(
  bucket_id='care-photos' and split_part(name,'/',1)=public.my_patient_id()::text and public.care_can_read(public.my_patient_id())
);
create function public.delete_care_photo(target uuid,record_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() then raise exception using errcode='42501',message='care_patient_only'; end if;
  if exists(select 1 from storage.objects where bucket_id='care-photos' and name=target::text||'/'||record_id::text) then raise exception using errcode='PT409',message='care_photo_delete_blob_first'; end if;
  delete from public.care_records where id=record_id and patient_id=target and data->>'kind'='body_photo';
end; $$;
revoke all on function public.delete_care_photo(uuid,uuid) from public,anon;
grant execute on function public.delete_care_photo(uuid,uuid) to authenticated;
-- Las políticas previas de fotos de comidas quedan además sujetas al permiso vigente.
create function public.care_meal_photo_allowed(path text) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce((select public.care_consent(id,'meal_photo') from public.patients where id::text=split_part(path,'/',2)),false);
$$;
revoke all on function public.care_meal_photo_allowed(text) from public,anon;
grant execute on function public.care_meal_photo_allowed(text) to authenticated;
create policy meal_photo_consent_read on storage.objects as restrictive for select to authenticated using(bucket_id<>'meal-photos' or public.care_meal_photo_allowed(name));
create policy meal_photo_consent_insert on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'meal-photos' or public.care_meal_photo_allowed(name));
create policy care_photo_insert on storage.objects for insert to authenticated with check(
  bucket_id='care-photos' and split_part(name,'/',1)=public.my_patient_id()::text
  and public.care_can_read(public.my_patient_id()) and public.patient_has_full_access(public.my_patient_id()) and public.care_consent(public.my_patient_id(),'body_progress')
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$'
);
revoke all on function public.care_can_read(uuid),public.care_consent(uuid,text),public.care_validate_data(jsonb),public.care_check_recipe(),public.care_validate_recipe(jsonb),public.save_care_record(uuid,uuid,date,jsonb),public.review_care_record(uuid,uuid),public.save_care_preferences(uuid,jsonb),public.publish_care_replacement(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.care_can_read(uuid),public.care_consent(uuid,text),public.care_validate_recipe(jsonb),public.save_care_record(uuid,uuid,date,jsonb),public.review_care_record(uuid,uuid),public.save_care_preferences(uuid,jsonb),public.publish_care_replacement(uuid,uuid,jsonb,jsonb) to authenticated;
