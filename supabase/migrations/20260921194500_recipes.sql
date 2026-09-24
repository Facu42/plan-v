-- PV-18: catálogo profesional de recetas/ingredientes, porciones, pasos y fuente nutricional.
-- Paciente no lee tablas crudas; sólo revisiones publicadas y asignadas vía RPC.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes. No crea meal_plans (PV-19).

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  name_normalized text not null,
  base_unit text not null check (base_unit in ('g','ml','u','cdita','cda','taza')),
  created_at timestamptz not null default clock_timestamp(),
  unique (nutritionist_id, name_normalized)
);

create table if not exists public.recipes (
  id uuid primary key,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 150),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  version int not null check (version >= 1),
  yield_portions numeric not null check (yield_portions > 0 and yield_portions <= 50),
  steps jsonb not null default '[]'::jsonb,
  nutrient_source text not null default '',
  reviewer_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (recipe_id, version),
  check (jsonb_typeof(steps) = 'array'),
  check (char_length(nutrient_source) <= 200),
  check (published_at is null or reviewer_id is not null)
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_version_id uuid not null references public.recipe_versions(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity numeric not null check (quantity > 0 and quantity <= 100000),
  unit text not null check (unit in ('g','ml','u','cdita','cda','taza')),
  unique (recipe_version_id, ingredient_id)
);

create table if not exists public.recipe_assignments (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  recipe_version_id uuid not null references public.recipe_versions(id),
  assigned_at timestamptz not null default clock_timestamp(),
  primary key (recipe_id, patient_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists recipes_nutritionist_idx on public.recipes (nutritionist_id, created_at desc);
create index if not exists recipe_assignments_patient_idx on public.recipe_assignments (patient_id, assigned_at desc);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_assignments enable row level security;

revoke all on public.ingredients, public.recipes, public.recipe_versions, public.recipe_ingredients, public.recipe_assignments
  from public, anon, authenticated;

grant select, insert, update, delete on public.ingredients, public.recipes, public.recipe_versions, public.recipe_ingredients to authenticated;
grant select, insert, update on public.recipe_assignments to authenticated;

-- Catálogo: sólo la profesional dueña. Paciente sin policy = no lee tablas crudas.
create policy ingredients_nutri_all on public.ingredients for all to authenticated
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

create policy recipes_nutri_all on public.recipes for all to authenticated
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

create policy recipe_versions_nutri_all on public.recipe_versions for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.nutritionist_id = public.my_nutritionist_id()))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.nutritionist_id = public.my_nutritionist_id()));

create policy recipe_ingredients_nutri_all on public.recipe_ingredients for all to authenticated
  using (
    exists (
      select 1 from public.recipe_versions v
      join public.recipes r on r.id = v.recipe_id
      where v.id = recipe_version_id and r.nutritionist_id = public.my_nutritionist_id()
    )
  )
  with check (
    exists (
      select 1 from public.recipe_versions v
      join public.recipes r on r.id = v.recipe_id
      where v.id = recipe_version_id and r.nutritionist_id = public.my_nutritionist_id()
    )
  );

create policy recipe_assignments_nutri_all on public.recipe_assignments for all to authenticated
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id() and public.is_assigned_patient(patient_id));

create policy recipe_assignments_patient_select on public.recipe_assignments for select to authenticated
  using (patient_id = public.my_patient_id());

create or replace function public.recipe_normalize_name(value text)
returns text language sql immutable set search_path='' as $$
  select lower(btrim(regexp_replace(coalesce(value,''), '\s+', ' ', 'g')));
$$;

create or replace function public.recipe_version_immutable()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.published_at is not null then
    raise exception using errcode='PT409', message='recipe_published_immutable';
  end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;

create or replace function public.recipe_ingredient_immutable()
returns trigger language plpgsql set search_path='' as $$
declare published timestamptz;
begin
  select v.published_at into published
  from public.recipe_versions v
  where v.id = coalesce(new.recipe_version_id, old.recipe_version_id);
  if published is not null then
    raise exception using errcode='PT409', message='recipe_published_immutable';
  end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;

drop trigger if exists recipe_versions_immutable on public.recipe_versions;
create trigger recipe_versions_immutable
  before update or delete on public.recipe_versions
  for each row execute function public.recipe_version_immutable();

drop trigger if exists recipe_ingredients_immutable on public.recipe_ingredients;
create trigger recipe_ingredients_immutable
  before insert or update or delete on public.recipe_ingredients
  for each row execute function public.recipe_ingredient_immutable();

create or replace function public.recipe_assert_nutri()
returns uuid language plpgsql stable security definer set search_path='' as $$
declare nid uuid;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode='42501', message='recipe_pro_only';
  end if;
  return nid;
end; $$;

create or replace function public.recipe_validate_draft(payload jsonb)
returns void language plpgsql set search_path='' as $$
declare item jsonb; step jsonb; n int;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 16000 then
    raise exception using errcode='22023', message='recipe_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('id','title','yield_portions','steps','nutrient_source','items')
  ) or not (payload ?& array['id','title','yield_portions','steps','items']) then
    raise exception using errcode='22023', message='recipe_fields';
  end if;
  if jsonb_typeof(payload->'id') is distinct from 'string' then
    raise exception using errcode='22023', message='recipe_id';
  end if;
  begin
    perform (payload->>'id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='recipe_id';
  end;
  if jsonb_typeof(payload->'title') is distinct from 'string'
    or char_length(btrim(payload->>'title')) not between 2 and 150 then
    raise exception using errcode='22023', message='recipe_title';
  end if;
  if jsonb_typeof(payload->'yield_portions') is distinct from 'number'
    or (payload->>'yield_portions')::numeric <= 0
    or (payload->>'yield_portions')::numeric > 50 then
    raise exception using errcode='22023', message='recipe_yield';
  end if;
  if payload ? 'nutrient_source' and (
    jsonb_typeof(payload->'nutrient_source') is distinct from 'string'
    or char_length(payload->>'nutrient_source') > 200
  ) then
    raise exception using errcode='22023', message='recipe_source';
  end if;
  if jsonb_typeof(payload->'steps') is distinct from 'array'
    or jsonb_array_length(payload->'steps') not between 1 and 12 then
    raise exception using errcode='22023', message='recipe_steps';
  end if;
  n := 0;
  for step in select value from jsonb_array_elements(payload->'steps') loop
    n := n + 1;
    if jsonb_typeof(step) is distinct from 'string'
      or char_length(btrim(step#>>'{}')) not between 1 and 400 then
      raise exception using errcode='22023', message='recipe_steps';
    end if;
  end loop;
  if jsonb_typeof(payload->'items') is distinct from 'array'
    or jsonb_array_length(payload->'items') not between 1 and 20 then
    raise exception using errcode='22023', message='recipe_items';
  end if;
  n := 0;
  for item in select value from jsonb_array_elements(payload->'items') loop
    n := n + 1;
    if jsonb_typeof(item) is distinct from 'object'
      or exists (select 1 from jsonb_object_keys(item) k where k not in ('name','quantity','unit'))
      or jsonb_typeof(item->'name') is distinct from 'string'
      or char_length(btrim(item->>'name')) not between 1 and 80
      or jsonb_typeof(item->'quantity') is distinct from 'number'
      or (item->>'quantity')::numeric <= 0
      or (item->>'quantity')::numeric > 100000
      or item->>'unit' not in ('g','ml','u','cdita','cda','taza') then
      raise exception using errcode='22023', message='recipe_items';
    end if;
  end loop;
end; $$;

create or replace function public.recipe_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', v.id,
    'version', v.version,
    'yield_portions', v.yield_portions,
    'steps', v.steps,
    'nutrient_source', v.nutrient_source,
    'published_at', v.published_at,
    'ingredients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'name', i.name,
        'quantity', ri.quantity,
        'unit', ri.unit
      ) order by i.name_normalized)
      from public.recipe_ingredients ri
      join public.ingredients i on i.id = ri.ingredient_id
      where ri.recipe_version_id = v.id
    ), '[]'::jsonb)
  )
  from public.recipe_versions v
  where v.id = vid;
$$;

create or replace function public.recipe_professional_json(rid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'status', r.status,
    'created_at', r.created_at,
    'current', public.recipe_version_json((
      select v.id from public.recipe_versions v where v.recipe_id = r.id order by v.version desc limit 1
    )),
    'published', (
      select public.recipe_version_json(v.id)
      from public.recipe_versions v
      where v.recipe_id = r.id and v.published_at is not null
      order by v.version desc
      limit 1
    )
  )
  from public.recipes r
  where r.id = rid;
$$;

create or replace function public.save_recipe_draft(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rid uuid;
  existing public.recipes;
  current_version public.recipe_versions;
  target_version public.recipe_versions;
  item jsonb;
  iname text;
  inorm text;
  iid uuid;
  iunit text;
begin
  nid := public.recipe_assert_nutri();
  perform public.recipe_validate_draft(payload);
  rid := (payload->>'id')::uuid;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text, 0));
  select * into existing from public.recipes where id = rid;
  if found and existing.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='recipe_forbidden';
  end if;
  if not found then
    insert into public.recipes(id, nutritionist_id, title, status)
    values (rid, nid, btrim(payload->>'title'), 'draft');
  else
    update public.recipes set title = btrim(payload->>'title') where id = rid;
  end if;
  select * into current_version from public.recipe_versions where recipe_id = rid order by version desc limit 1;
  if current_version.id is null or current_version.published_at is not null then
    insert into public.recipe_versions(recipe_id, version, yield_portions, steps, nutrient_source)
    values (
      rid,
      coalesce(current_version.version, 0) + 1,
      (payload->>'yield_portions')::numeric,
      (select jsonb_agg(btrim(elem#>>'{}') order by ordinality) from jsonb_array_elements(payload->'steps') with ordinality as t(elem, ordinality)),
      coalesce(payload->>'nutrient_source','')
    )
    returning * into target_version;
  else
    update public.recipe_versions
      set yield_portions = (payload->>'yield_portions')::numeric,
          steps = (select jsonb_agg(btrim(elem#>>'{}') order by ordinality) from jsonb_array_elements(payload->'steps') with ordinality as t(elem, ordinality)),
          nutrient_source = coalesce(payload->>'nutrient_source','')
      where id = current_version.id
      returning * into target_version;
    delete from public.recipe_ingredients where recipe_version_id = target_version.id;
  end if;
  for item in select value from jsonb_array_elements(payload->'items') loop
    iname := btrim(item->>'name');
    inorm := public.recipe_normalize_name(iname);
    iunit := item->>'unit';
    insert into public.ingredients(nutritionist_id, name, name_normalized, base_unit)
    values (nid, iname, inorm, iunit)
    on conflict (nutritionist_id, name_normalized) do update set name = excluded.name
    returning id into iid;
    if iid is null then
      select id into iid from public.ingredients where nutritionist_id = nid and name_normalized = inorm;
    end if;
    insert into public.recipe_ingredients(recipe_version_id, ingredient_id, quantity, unit)
    values (target_version.id, iid, (item->>'quantity')::numeric, iunit)
    on conflict (recipe_version_id, ingredient_id) do update
      set quantity = excluded.quantity, unit = excluded.unit;
  end loop;
  return public.recipe_professional_json(rid);
end; $$;

create or replace function public.publish_recipe(target_recipe uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.recipes;
  ver public.recipe_versions;
begin
  nid := public.recipe_assert_nutri();
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_recipe::text, 0));
  select * into rec from public.recipes where id = target_recipe;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v where v.recipe_id = target_recipe and v.version = expected_version;
  if not found then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  if not exists (select 1 from public.recipe_ingredients ri where ri.recipe_version_id = ver.id) then
    raise exception using errcode='22023', message='recipe_items';
  end if;
  if jsonb_typeof(ver.steps) is distinct from 'array' or jsonb_array_length(ver.steps) < 1 then
    raise exception using errcode='22023', message='recipe_steps';
  end if;
  if ver.published_at is not null then
    return public.recipe_professional_json(target_recipe);
  end if;
  update public.recipe_versions
    set published_at = clock_timestamp(), reviewer_id = auth.uid()
    where id = ver.id;
  update public.recipes set status = 'published' where id = target_recipe;
  return public.recipe_professional_json(target_recipe);
end; $$;

create or replace function public.assign_recipe(target_recipe uuid, target_patient uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.recipes;
  ver public.recipe_versions;
begin
  nid := public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient, true);
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  select * into rec from public.recipes where id = target_recipe;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v
    where v.recipe_id = target_recipe and v.version = expected_version;
  if not found or ver.published_at is null then
    raise exception using errcode='22023', message='recipe_not_published';
  end if;
  insert into public.recipe_assignments(recipe_id, patient_id, nutritionist_id, recipe_version_id)
  values (target_recipe, target_patient, nid, ver.id)
  on conflict (recipe_id, patient_id) do update
    set recipe_version_id = excluded.recipe_version_id, assigned_at = clock_timestamp(), nutritionist_id = excluded.nutritionist_id;
  return jsonb_build_object(
    'id', rec.id,
    'title', rec.title,
    'version', ver.version,
    'yield_portions', ver.yield_portions,
    'steps', ver.steps,
    'nutrient_source', ver.nutrient_source,
    'ingredients', (public.recipe_version_json(ver.id)->'ingredients'),
    'assigned_at', (select a.assigned_at from public.recipe_assignments a where a.recipe_id = rec.id and a.patient_id = target_patient),
    'published_at', ver.published_at
  );
end; $$;

create or replace function public.list_professional_recipes()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare nid uuid;
begin
  nid := public.recipe_assert_nutri();
  return coalesce((
    select jsonb_agg(public.recipe_professional_json(r.id) order by r.created_at desc)
    from public.recipes r
    where r.nutritionist_id = nid
  ), '[]'::jsonb);
end; $$;

create or replace function public.list_assigned_recipes(target uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id,
      'title', r.title,
      'version', v.version,
      'yield_portions', v.yield_portions,
      'steps', v.steps,
      'nutrient_source', v.nutrient_source,
      'ingredients', public.recipe_version_json(v.id)->'ingredients',
      'assigned_at', a.assigned_at,
      'published_at', v.published_at
    ) order by a.assigned_at desc)
    from public.recipe_assignments a
    join public.recipes r on r.id = a.recipe_id
    join public.recipe_versions v on v.id = a.recipe_version_id
    where a.patient_id = target and v.published_at is not null
  ), '[]'::jsonb);
end; $$;

revoke all on function public.recipe_normalize_name(text),
  public.recipe_version_immutable(),
  public.recipe_ingredient_immutable(),
  public.recipe_assert_nutri(),
  public.recipe_validate_draft(jsonb),
  public.recipe_version_json(uuid),
  public.recipe_professional_json(uuid),
  public.save_recipe_draft(jsonb),
  public.publish_recipe(uuid,int),
  public.assign_recipe(uuid,uuid,int),
  public.list_professional_recipes(),
  public.list_assigned_recipes(uuid)
from public, anon;

grant execute on function public.save_recipe_draft(jsonb),
  public.publish_recipe(uuid,int),
  public.assign_recipe(uuid,uuid,int),
  public.list_professional_recipes(),
  public.list_assigned_recipes(uuid)
to authenticated;
