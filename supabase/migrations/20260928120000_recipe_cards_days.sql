-- PV-47: ficha visual de la receta (macros declarados, categoría, minutos) y
-- receta asignada a un día/momento con "Registrar esta comida".
-- Hasta acá el servidor respondía 501 en modo persistente para ambas cosas:
-- la ficha vivía sólo en memoria y assign/list/register_recipe_day no tenían SQL.
--
-- Aditiva: dos tablas nuevas y funciones nuevas o reemplazadas. No toca filas
-- existentes. recipe_version_cards va aparte de recipe_versions por el mismo
-- motivo que recipe_covers: recipe_versions es inmutable una vez publicada.

create table if not exists public.recipe_version_cards (
  recipe_version_id uuid primary key references public.recipe_versions(id) on delete cascade,
  card jsonb not null,
  updated_at timestamptz not null default clock_timestamp(),
  check (jsonb_typeof(card) = 'object'),
  check (octet_length(card::text) <= 4000)
);

alter table public.recipe_version_cards enable row level security;
revoke all on public.recipe_version_cards from public, anon, authenticated;

create table if not exists public.recipe_day_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  recipe_version_id uuid not null references public.recipe_versions(id),
  for_date date not null,
  slot text not null check (slot in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')),
  registered_meal_id uuid references public.meal_logs(id) on delete set null,
  client_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  unique (patient_id, for_date, slot),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists recipe_day_assignments_patient_idx
  on public.recipe_day_assignments (patient_id, for_date);

alter table public.recipe_day_assignments enable row level security;
revoke all on public.recipe_day_assignments from public, anon, authenticated;
-- Sin grants ni policies: se lee y escribe sólo por las funciones de abajo.

create or replace function public.recipe_validate_card(value jsonb)
returns void language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(value) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if exists (
    select 1 from jsonb_object_keys(value) key
    where key not in ('category','prep_minutes','macro_status','macros','cover_status','cover_alt','cover_url')
  ) then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if coalesce(value->>'category', '') not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')
    or coalesce(value->>'macro_status', '') not in ('declared','unavailable','failed') then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if value->'prep_minutes' is not null and value->'prep_minutes' <> 'null'::jsonb and (
    jsonb_typeof(value->'prep_minutes') is distinct from 'number'
    or (value->>'prep_minutes')::numeric <= 0
    or (value->>'prep_minutes')::numeric > 240
  ) then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if value->'macros' is null or value->'macros' = 'null'::jsonb then
    if value->>'macro_status' = 'declared' then
      raise exception using errcode = '22023', message = 'recipe_card';
    end if;
    return;
  end if;
  if jsonb_typeof(value->'macros') is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  foreach k in array array['kcal','protein_g','carbs_g','fat_g'] loop
    if value->'macros'->k is not null and value->'macros'->k <> 'null'::jsonb and (
      jsonb_typeof(value->'macros'->k) is distinct from 'number'
      or (value->'macros'->>k)::numeric < 0
      or (value->'macros'->>k)::numeric > 20000
    ) then
      raise exception using errcode = '22023', message = 'recipe_card';
    end if;
  end loop;
end; $$;

-- La profesional dueña guarda la ficha de una revisión todavía en borrador.
create or replace function public.set_recipe_card(target_version uuid, card jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  owner_nid uuid;
  published timestamptz;
  clean jsonb;
begin
  nid := public.recipe_assert_nutri();
  select r.nutritionist_id, v.published_at into owner_nid, published
  from public.recipe_versions v
  join public.recipes r on r.id = v.recipe_id
  where v.id = target_version;
  if owner_nid is null or owner_nid is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  if published is not null then
    raise exception using errcode = '22023', message = 'recipe_published';
  end if;
  perform public.recipe_validate_card(card);
  -- La portada vive en recipe_covers; acá sólo lo declarado por la profesional.
  clean := card - 'cover_status' - 'cover_url' - 'cover_alt';
  insert into public.recipe_version_cards (recipe_version_id, card, updated_at)
  values (target_version, clean, clock_timestamp())
  on conflict (recipe_version_id) do update set card = excluded.card, updated_at = excluded.updated_at;
  return clean;
end; $$;

-- Ficha completa (lo declarado + la portada) o null si nunca se declaró.
create or replace function public.recipe_card_json(vid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select k.card || jsonb_build_object(
    'cover_status', coalesce(c.status, 'none'),
    'cover_url', c.url,
    'cover_alt', coalesce(nullif(c.alt, ''), r.title)
  )
  from public.recipe_version_cards k
  join public.recipe_versions v on v.id = k.recipe_version_id
  join public.recipes r on r.id = v.recipe_id
  left join public.recipe_covers c on c.recipe_version_id = k.recipe_version_id
  where k.recipe_version_id = vid;
$$;

create or replace function public.recipe_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', v.id,
    'version', v.version,
    'yield_portions', v.yield_portions,
    'steps', v.steps,
    'nutrient_source', v.nutrient_source,
    'published_at', v.published_at,
    'cover_status', coalesce(c.status, 'none'),
    'cover_url', c.url,
    'cover_alt', coalesce(c.alt, ''),
    'card', public.recipe_card_json(v.id),
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
  left join public.recipe_covers c on c.recipe_version_id = v.id
  where v.id = vid;
$$;

create or replace function public.list_assigned_recipes(target uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
      'cover_status', coalesce(c.status, 'none'),
      'cover_url', c.url,
      'cover_alt', coalesce(c.alt, ''),
      'card', public.recipe_card_json(v.id),
      'assigned_at', a.assigned_at,
      'published_at', v.published_at
    ) order by a.assigned_at desc)
    from public.recipe_assignments a
    join public.recipes r on r.id = a.recipe_id
    join public.recipe_versions v on v.id = a.recipe_version_id
    left join public.recipe_covers c on c.recipe_version_id = v.id
    where a.patient_id = target and v.published_at is not null
  ), '[]'::jsonb);
end; $$;

create or replace function public.recipe_day_json(aid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', d.id,
    'patient_id', d.patient_id,
    'for_date', to_char(d.for_date, 'YYYY-MM-DD'),
    'slot', d.slot,
    'recipe_id', d.recipe_id,
    'recipe_version', v.version,
    'title', r.title,
    'yield_portions', v.yield_portions,
    'ingredients', public.recipe_version_json(v.id)->'ingredients',
    'card', coalesce(public.recipe_card_json(v.id), jsonb_build_object(
      'category', d.slot,
      'prep_minutes', null,
      'macro_status', 'unavailable',
      'macros', null,
      'cover_status', coalesce(c.status, 'none'),
      'cover_url', c.url,
      'cover_alt', coalesce(nullif(c.alt, ''), r.title)
    )),
    'registered_meal_id', d.registered_meal_id
  )
  from public.recipe_day_assignments d
  join public.recipes r on r.id = d.recipe_id
  join public.recipe_versions v on v.id = d.recipe_version_id
  left join public.recipe_covers c on c.recipe_version_id = v.id
  where d.id = aid;
$$;

create or replace function public.assign_recipe_day(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  rid uuid;
  pid uuid;
  day date;
  expected int;
  slot_label text;
  ver public.recipe_versions;
  rec public.recipes;
  aid uuid;
begin
  nid := public.recipe_assert_nutri();
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  begin
    rid := (payload->>'recipe_id')::uuid;
    pid := (payload->>'patient_id')::uuid;
    day := (payload->>'for_date')::date;
    expected := (payload->>'expected_version')::int;
  exception when others then
    raise exception using errcode = '22023', message = 'recipe_day';
  end;
  slot_label := payload->>'slot';
  if rid is null or pid is null or day is null or expected is null or expected < 1
    or slot_label not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra') then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  perform public.intake_assert_access(pid, true);
  select * into rec from public.recipes where id = rid;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v
    where v.recipe_id = rid and v.version = expected;
  if not found or ver.published_at is null then
    raise exception using errcode = '22023', message = 'recipe_not_published';
  end if;
  insert into public.recipe_day_assignments (patient_id, nutritionist_id, recipe_id, recipe_version_id, for_date, slot)
  values (pid, nid, rid, ver.id, day, slot_label)
  on conflict (patient_id, for_date, slot) do update
    set recipe_id = excluded.recipe_id,
        recipe_version_id = excluded.recipe_version_id,
        nutritionist_id = excluded.nutritionist_id
  returning id into aid;
  -- Que también aparezca en "Mis recetas" de la paciente.
  insert into public.recipe_assignments (recipe_id, patient_id, nutritionist_id, recipe_version_id)
  values (rid, pid, nid, ver.id)
  on conflict (recipe_id, patient_id) do update
    set recipe_version_id = excluded.recipe_version_id, assigned_at = clock_timestamp(), nutritionist_id = excluded.nutritionist_id;
  return public.recipe_day_json(aid);
end; $$;

create or replace function public.list_recipe_days(target uuid, for_date date default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.intake_assert_access(target);
  return coalesce((
    select jsonb_agg(public.recipe_day_json(d.id) order by d.for_date, d.slot)
    from public.recipe_day_assignments d
    where d.patient_id = target
      and (list_recipe_days.for_date is null or d.for_date = list_recipe_days.for_date)
  ), '[]'::jsonb);
end; $$;

create or replace function public.register_recipe_day(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pid uuid;
  aid uuid;
  cid uuid;
  asg public.recipe_day_assignments;
  saved jsonb;
  meal uuid;
  declared jsonb;
  macros jsonb;
  foods jsonb;
begin
  begin
    pid := (payload->>'patient_id')::uuid;
    aid := (payload->>'assignment_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'recipe_day';
  end;
  if pid is null or aid is null or cid is null then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  perform public.diary_assert_access(pid, false);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(aid::text, 0));
  select * into asg from public.recipe_day_assignments where id = aid and patient_id = pid;
  if not found then
    raise exception using errcode = 'PT404', message = 'recipe_day_missing';
  end if;
  if asg.registered_meal_id is not null then
    return jsonb_build_object('assignment', public.recipe_day_json(aid), 'duplicate', true);
  end if;
  saved := public.save_meal_log(jsonb_build_object(
    'patient_id', pid,
    'client_id', cid,
    'slot', asg.slot,
    'description', (select r.title from public.recipes r where r.id = asg.recipe_id)
  ));
  meal := (saved->'log'->>'id')::uuid;
  foods := coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', i.name,
      'portion_est', case when ri.unit in ('g','ml','u') then least(ri.quantity, 10000) else null end,
      'portion_unit', case when ri.unit in ('g','ml','u') then ri.unit else 'u' end,
      'confidence', 1
    ) order by i.name_normalized)
    from (
      select * from public.recipe_ingredients x where x.recipe_version_id = asg.recipe_version_id
      order by x.id limit 8
    ) ri
    join public.ingredients i on i.id = ri.ingredient_id
  ), '[]'::jsonb);
  select k.card into declared from public.recipe_version_cards k where k.recipe_version_id = asg.recipe_version_id;
  if declared->>'macro_status' = 'declared'
    and jsonb_typeof(declared->'macros'->'kcal') = 'number'
    and jsonb_typeof(declared->'macros'->'protein_g') = 'number'
    and jsonb_typeof(declared->'macros'->'carbs_g') = 'number'
    and jsonb_typeof(declared->'macros'->'fat_g') = 'number' then
    macros := jsonb_build_object(
      'kcal', declared->'macros'->'kcal',
      'protein_g', declared->'macros'->'protein_g',
      'carbs_g', declared->'macros'->'carbs_g',
      'fat_g', declared->'macros'->'fat_g'
    );
  end if;
  perform public.record_meal_analysis(jsonb_build_object(
    'meal_id', meal,
    'status', case when macros is null then 'failed' else 'succeeded' end,
    'foods', foods,
    'macros', macros,
    'confidence', case when macros is null then 0 else 1 end,
    'note_for_nutri', case when macros is null
      then 'Registrada desde la receta asignada. Sin macros declarados.'
      else 'Registrada desde la receta asignada. Macros declarados por la nutricionista, no estimados por IA.' end,
    'error_code', case when macros is null then 'macros_unavailable' else null end
  ));
  update public.recipe_day_assignments set registered_meal_id = meal, client_id = cid where id = aid;
  return jsonb_build_object('assignment', public.recipe_day_json(aid), 'duplicate', coalesce((saved->>'duplicate')::boolean, false));
end; $$;

revoke all on function public.recipe_validate_card(jsonb),
  public.set_recipe_card(uuid, jsonb),
  public.recipe_card_json(uuid),
  public.recipe_day_json(uuid),
  public.assign_recipe_day(jsonb),
  public.list_recipe_days(uuid, date),
  public.register_recipe_day(jsonb)
from public, anon;

grant execute on function public.set_recipe_card(uuid, jsonb),
  public.assign_recipe_day(jsonb),
  public.list_recipe_days(uuid, date),
  public.register_recipe_day(jsonb)
to authenticated;
