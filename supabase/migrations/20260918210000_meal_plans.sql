-- PV-19: planes fechados y versionados. Copia inédita distinta de la publicada.
create table public.meal_plan_versions (
  id uuid primary key,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  version int not null check (version >= 1),
  period_start date not null,
  slots jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  published_at timestamptz,
  unique (patient_id, version),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);
create unique index meal_plan_one_open on public.meal_plan_versions (patient_id) where published_at is null;
create index meal_plan_published_lookup on public.meal_plan_versions (patient_id, published_at desc) where published_at is not null;
alter table public.meal_plan_versions enable row level security;

create function public.plan_can_read(owner uuid, target uuid, published timestamptz) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (
    owner = public.my_nutritionist_id()
    or (
      published is not null
      and public.my_patient_id() is not distinct from target
      and public.patient_has_full_access(target)
    )
  );
$$;
create policy meal_plan_select on public.meal_plan_versions for select to authenticated using (
  public.plan_can_read(nutritionist_id, patient_id, published_at)
);
revoke all on public.meal_plan_versions from public, anon, authenticated;
grant select on public.meal_plan_versions to authenticated;
revoke all on function public.plan_can_read(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.plan_can_read(uuid, uuid, timestamptz) to authenticated;

create function public.plan_stamp_slots(owner uuid, slots_value jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare
  stamped jsonb := '[]'::jsonb;
  item jsonb;
  n int;
  i int;
  day_name text;
  slot_name text;
  title_value text;
  recipe_id uuid;
  recipe_row public.recipes;
  key text;
  seen text[] := '{}';
begin
  if jsonb_typeof(slots_value) is distinct from 'array' then
    raise exception using errcode='22023', message='plan_slots';
  end if;
  n := jsonb_array_length(slots_value);
  if n > 42 then raise exception using errcode='22023', message='plan_slots'; end if;
  for i in 0 .. n - 1 loop
    item := slots_value->i;
    if jsonb_typeof(item) is distinct from 'object' then
      raise exception using errcode='22023', message='plan_slots';
    end if;
    day_name := item->>'day';
    slot_name := item->>'slot';
    title_value := btrim(coalesce(item->>'title', ''));
    if day_name not in ('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')
      or slot_name not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')
      or length(title_value) not between 2 and 150
    then raise exception using errcode='22023', message='plan_slots'; end if;
    key := day_name || '|' || slot_name;
    if key = any(seen) then raise exception using errcode='22023', message='plan_duplicate'; end if;
    seen := seen || key;
    recipe_id := null;
    if coalesce(item->>'recipe_id', '') <> '' then
      begin recipe_id := (item->>'recipe_id')::uuid; exception when invalid_text_representation then
        raise exception using errcode='22023', message='plan_recipe';
      end;
      select * into recipe_row from public.recipes
        where id = recipe_id and nutritionist_id = owner and published_at is not null;
      if not found then raise exception using errcode='22023', message='plan_recipe'; end if;
      title_value := recipe_row.title;
      stamped := stamped || jsonb_build_array(jsonb_build_object(
        'day', day_name, 'slot', slot_name, 'title', title_value,
        'recipe_id', recipe_row.id, 'servings', recipe_row.servings::int
      ));
    else
      stamped := stamped || jsonb_build_array(jsonb_build_object(
        'day', day_name, 'slot', slot_name, 'title', title_value,
        'recipe_id', null, 'servings', null
      ));
    end if;
  end loop;
  return stamped;
end; $$;

create function public.save_plan_version(plan_id uuid, patient_id uuid, period_start_value date, slots_value jsonb, expected_version int)
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  owner uuid := public.my_nutritionist_id();
  existing public.meal_plan_versions;
  open_row public.meal_plan_versions;
  result public.meal_plan_versions;
  max_version int;
  stamped jsonb;
begin
  if owner is null then raise exception using errcode='42501', message='plan_pro_only'; end if;
  if expected_version is null or expected_version < 0 then raise exception using errcode='22023', message='plan_version'; end if;
  if extract(isodow from period_start_value) <> 1 then raise exception using errcode='22023', message='plan_monday'; end if;
  if not exists (select 1 from public.patients p where p.id = save_plan_version.patient_id and p.nutritionist_id = owner) then
    raise exception using errcode='42501', message='plan_patient';
  end if;
  stamped := public.plan_stamp_slots(owner, slots_value);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(save_plan_version.patient_id::text, 0));
  select * into existing from public.meal_plan_versions where id = plan_id;
  if not found then
    select * into open_row from public.meal_plan_versions
      where meal_plan_versions.patient_id = save_plan_version.patient_id and published_at is null;
    if found then raise exception using errcode='PT409', message='plan_open'; end if;
    select coalesce(max(version), 0) into max_version from public.meal_plan_versions
      where meal_plan_versions.patient_id = save_plan_version.patient_id;
    if expected_version <> max_version then raise exception using errcode='PT409', message='plan_version'; end if;
    insert into public.meal_plan_versions(id, patient_id, nutritionist_id, version, period_start, slots)
      values (plan_id, save_plan_version.patient_id, owner, max_version + 1, period_start_value, stamped)
      returning * into result;
    return to_jsonb(result);
  end if;
  if existing.nutritionist_id <> owner or existing.patient_id <> save_plan_version.patient_id then
    raise exception using errcode='42501', message='plan_owner';
  end if;
  if existing.published_at is not null then raise exception using errcode='PT409', message='plan_published'; end if;
  if existing.version <> expected_version then raise exception using errcode='PT409', message='plan_version'; end if;
  update public.meal_plan_versions
    set period_start = period_start_value, slots = stamped, updated_at = clock_timestamp()
    where id = plan_id returning * into result;
  return to_jsonb(result);
end; $$;

create function public.publish_plan_version(plan_id uuid, expected_version int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  owner uuid := public.my_nutritionist_id();
  result public.meal_plan_versions;
begin
  if owner is null then raise exception using errcode='42501', message='plan_pro_only'; end if;
  if expected_version is null or expected_version < 1 then raise exception using errcode='22023', message='plan_version'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(plan_id::text, 0));
  select * into result from public.meal_plan_versions where id = plan_id and nutritionist_id = owner;
  if not found then raise exception using errcode='PT404', message='plan_missing'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(result.patient_id::text, 0));
  if result.version <> expected_version then raise exception using errcode='PT409', message='plan_version'; end if;
  if result.published_at is not null then return to_jsonb(result); end if;
  update public.meal_plan_versions
    set published_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = plan_id returning * into result;
  return to_jsonb(result);
end; $$;

revoke all on function public.plan_stamp_slots(uuid, jsonb), public.save_plan_version(uuid, uuid, date, jsonb, int), public.publish_plan_version(uuid, int) from public, anon;
grant execute on function public.save_plan_version(uuid, uuid, date, jsonb, int), public.publish_plan_version(uuid, int) to authenticated;
