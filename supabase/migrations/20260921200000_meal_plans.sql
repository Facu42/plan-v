-- PV-19: planes fechados/versionados, slots y recetas; publicación transaccional.
-- El borrador nunca muta la copia publicada. Paciente sólo lee la versión published.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

create table if not exists public.meal_plans (
  id uuid primary key,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default clock_timestamp(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  unique (patient_id, nutritionist_id)
);

create table if not exists public.meal_plan_versions (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  version int not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  period_start date not null,
  period_end date not null,
  published_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (meal_plan_id, version),
  check (period_end >= period_start),
  check (period_end <= period_start + 21),
  check (status <> 'published' or published_at is not null)
);

create unique index if not exists meal_plan_versions_one_published
  on public.meal_plan_versions (meal_plan_id)
  where status = 'published';

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_version_id uuid not null references public.meal_plan_versions(id) on delete cascade,
  for_date date not null,
  slot public.meal_slot_kind not null,
  recipe_version_id uuid references public.recipe_versions(id),
  free_text text,
  portions numeric check (portions is null or (portions > 0 and portions <= 50)),
  public_note text not null default '',
  unique (meal_plan_version_id, for_date, slot),
  check (
    (recipe_version_id is not null and (free_text is null or btrim(free_text) = ''))
    or (recipe_version_id is null and free_text is not null and char_length(btrim(free_text)) between 1 and 150)
  ),
  check (char_length(public_note) <= 200)
);

create index if not exists meal_plans_patient_idx on public.meal_plans (patient_id);
create index if not exists meal_plan_items_version_date_idx on public.meal_plan_items (meal_plan_version_id, for_date, slot);

alter table public.meal_plans enable row level security;
alter table public.meal_plan_versions enable row level security;
alter table public.meal_plan_items enable row level security;

revoke all on public.meal_plans, public.meal_plan_versions, public.meal_plan_items from public, anon, authenticated;
grant select, insert, update, delete on public.meal_plans, public.meal_plan_versions, public.meal_plan_items to authenticated;

create policy meal_plans_nutri_all on public.meal_plans for all to authenticated
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id() and public.is_assigned_patient(patient_id));

create policy meal_plan_versions_nutri_all on public.meal_plan_versions for all to authenticated
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.nutritionist_id = public.my_nutritionist_id()))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.nutritionist_id = public.my_nutritionist_id()));

create policy meal_plan_items_nutri_all on public.meal_plan_items for all to authenticated
  using (
    exists (
      select 1 from public.meal_plan_versions v
      join public.meal_plans p on p.id = v.meal_plan_id
      where v.id = meal_plan_version_id and p.nutritionist_id = public.my_nutritionist_id()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plan_versions v
      join public.meal_plans p on p.id = v.meal_plan_id
      where v.id = meal_plan_version_id and p.nutritionist_id = public.my_nutritionist_id()
    )
  );

-- Paciente: no lee tablas crudas. Lectura sólo vía RPC de la versión publicada.

create or replace function public.meal_plan_version_immutable()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status in ('published','archived') then
    if tg_op = 'DELETE' then
      raise exception using errcode='PT409', message='meal_plan_published_immutable';
    end if;
    if old.status = 'archived'
      or new.period_start is distinct from old.period_start
      or new.period_end is distinct from old.period_end
      or new.version is distinct from old.version
      or new.published_at is distinct from old.published_at
      or new.meal_plan_id is distinct from old.meal_plan_id
      or new.status not in ('published','archived')
    then
      raise exception using errcode='PT409', message='meal_plan_published_immutable';
    end if;
  end if;
  return new;
end; $$;

create or replace function public.meal_plan_item_immutable()
returns trigger language plpgsql set search_path='' as $$
declare ver_status text;
begin
  select v.status into ver_status
  from public.meal_plan_versions v
  where v.id = coalesce(new.meal_plan_version_id, old.meal_plan_version_id);
  if ver_status in ('published','archived') then
    raise exception using errcode='PT409', message='meal_plan_published_immutable';
  end if;
  return case when tg_op='DELETE' then old else new end;
end; $$;

drop trigger if exists meal_plan_versions_immutable on public.meal_plan_versions;
create trigger meal_plan_versions_immutable
  before update or delete on public.meal_plan_versions
  for each row execute function public.meal_plan_version_immutable();

drop trigger if exists meal_plan_items_immutable on public.meal_plan_items;
create trigger meal_plan_items_immutable
  before insert or update or delete on public.meal_plan_items
  for each row execute function public.meal_plan_item_immutable();

create or replace function public.meal_plan_slot_key(value text)
returns public.meal_slot_kind language plpgsql immutable set search_path='' as $$
begin
  case btrim(value)
    when 'Desayuno' then return 'desayuno';
    when 'desayuno' then return 'desayuno';
    when 'Colación' then return 'colacion';
    when 'Colacion' then return 'colacion';
    when 'colacion' then return 'colacion';
    when 'Almuerzo' then return 'almuerzo';
    when 'almuerzo' then return 'almuerzo';
    when 'Merienda' then return 'merienda';
    when 'merienda' then return 'merienda';
    when 'Cena' then return 'cena';
    when 'cena' then return 'cena';
    when 'Extra' then return 'extra';
    when 'extra' then return 'extra';
    else raise exception using errcode='22023', message='meal_plan_slot';
  end case;
end; $$;

create or replace function public.meal_plan_slot_label(value public.meal_slot_kind)
returns text language sql immutable set search_path='' as $$
  select case value
    when 'desayuno' then 'Desayuno'
    when 'colacion' then 'Colación'
    when 'almuerzo' then 'Almuerzo'
    when 'merienda' then 'Merienda'
    when 'cena' then 'Cena'
    else 'Extra'
  end;
$$;

create or replace function public.meal_plan_item_json(iid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', i.id,
    'for_date', i.for_date,
    'slot', public.meal_plan_slot_label(i.slot),
    'recipe_id', rec.id,
    'recipe_version', v.version,
    'recipe_title', rec.title,
    'free_text', i.free_text,
    'portions', i.portions,
    'public_note', i.public_note
  )
  from public.meal_plan_items i
  left join public.recipe_versions v on v.id = i.recipe_version_id
  left join public.recipes rec on rec.id = v.recipe_id
  where i.id = iid;
$$;

create or replace function public.meal_plan_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', v.id,
    'version', v.version,
    'status', v.status,
    'period_start', v.period_start,
    'period_end', v.period_end,
    'published_at', v.published_at,
    'items', coalesce((
      select jsonb_agg(public.meal_plan_item_json(i.id) order by i.for_date, i.slot)
      from public.meal_plan_items i
      where i.meal_plan_version_id = v.id
    ), '[]'::jsonb)
  )
  from public.meal_plan_versions v
  where v.id = vid;
$$;

create or replace function public.meal_plan_professional_json(pid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', p.id,
    'patient_id', p.patient_id,
    'timezone', p.timezone,
    'created_at', p.created_at,
    'current', public.meal_plan_version_json((
      select v.id from public.meal_plan_versions v where v.meal_plan_id = p.id order by v.version desc limit 1
    )),
    'published', (
      select public.meal_plan_version_json(v.id)
      from public.meal_plan_versions v
      where v.meal_plan_id = p.id and v.status = 'published'
      limit 1
    )
  )
  from public.meal_plans p
  where p.id = pid;
$$;

create or replace function public.meal_plan_validate_draft(payload jsonb)
returns void language plpgsql set search_path='' as $$
declare item jsonb; start_date date; end_date date; seen text; keys text[] := '{}';
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 24000 then
    raise exception using errcode='22023', message='meal_plan_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('id','period_start','period_end','timezone','items')
  ) or not (payload ?& array['id','period_start','period_end','items']) then
    raise exception using errcode='22023', message='meal_plan_fields';
  end if;
  begin
    perform (payload->>'id')::uuid;
    start_date := (payload->>'period_start')::date;
    end_date := (payload->>'period_end')::date;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode='22023', message='meal_plan_period';
  end;
  if end_date < start_date or end_date > start_date + 21 then
    raise exception using errcode='22023', message='meal_plan_period';
  end if;
  if payload ? 'timezone' and (
    jsonb_typeof(payload->'timezone') is distinct from 'string'
    or payload->>'timezone' is distinct from 'America/Argentina/Buenos_Aires'
  ) then
    raise exception using errcode='22023', message='meal_plan_timezone';
  end if;
  if jsonb_typeof(payload->'items') is distinct from 'array'
    or jsonb_array_length(payload->'items') not between 1 and 42 then
    raise exception using errcode='22023', message='meal_plan_items';
  end if;
  for item in select value from jsonb_array_elements(payload->'items') loop
    if jsonb_typeof(item) is distinct from 'object'
      or exists (select 1 from jsonb_object_keys(item) k where k not in ('for_date','slot','recipe_id','recipe_version','free_text','portions','public_note'))
      or not (item ?& array['for_date','slot']) then
      raise exception using errcode='22023', message='meal_plan_items';
    end if;
    begin
      if (item->>'for_date')::date < start_date or (item->>'for_date')::date > end_date then
        raise exception using errcode='22023', message='meal_plan_date';
      end if;
      perform public.meal_plan_slot_key(item->>'slot');
    exception when invalid_text_representation or datetime_field_overflow then
      raise exception using errcode='22023', message='meal_plan_date';
    end;
    seen := (item->>'for_date') || '|' || public.meal_plan_slot_key(item->>'slot')::text;
    if seen = any(keys) then
      raise exception using errcode='22023', message='meal_plan_duplicate';
    end if;
    keys := keys || seen;
    if (coalesce(nullif(item->>'recipe_id',''),'') <> '' and char_length(btrim(coalesce(item->>'free_text',''))) > 0)
      or (coalesce(nullif(item->>'recipe_id',''),'') = '' and char_length(btrim(coalesce(item->>'free_text',''))) < 1)
      or char_length(btrim(coalesce(item->>'free_text',''))) > 150 then
      raise exception using errcode='22023', message='meal_plan_items';
    end if;
    if item ? 'public_note' and (jsonb_typeof(item->'public_note') is distinct from 'string' or char_length(item->>'public_note') > 200) then
      raise exception using errcode='22023', message='meal_plan_note';
    end if;
    if item ? 'portions' and item->'portions' is not null and (
      jsonb_typeof(item->'portions') is distinct from 'number'
      or (item->>'portions')::numeric <= 0
      or (item->>'portions')::numeric > 50
    ) then
      raise exception using errcode='22023', message='meal_plan_portions';
    end if;
  end loop;
end; $$;

create or replace function public.save_meal_plan_draft(target_patient uuid, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  pid uuid;
  existing public.meal_plans;
  current_version public.meal_plan_versions;
  target_version public.meal_plan_versions;
  item jsonb;
  recipe_uuid uuid;
  ver_no int;
  resolved uuid;
  slot_key public.meal_slot_kind;
begin
  nid := public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient, true);
  perform public.meal_plan_validate_draft(payload);
  pid := (payload->>'id')::uuid;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_patient::text, 1));
  select * into existing from public.meal_plans where patient_id = target_patient and nutritionist_id = nid;
  if found then
    if existing.id is distinct from pid then
      raise exception using errcode='PT409', message='meal_plan_id_conflict';
    end if;
    update public.meal_plans set timezone = coalesce(nullif(payload->>'timezone',''), timezone) where id = existing.id;
  else
    insert into public.meal_plans(id, patient_id, nutritionist_id, timezone)
    values (pid, target_patient, nid, coalesce(nullif(payload->>'timezone',''),'America/Argentina/Buenos_Aires'));
  end if;
  select * into current_version from public.meal_plan_versions where meal_plan_id = pid order by version desc limit 1;
  if current_version.id is null or current_version.status is distinct from 'draft' then
    insert into public.meal_plan_versions(meal_plan_id, version, status, period_start, period_end)
    values (
      pid,
      coalesce(current_version.version, 0) + 1,
      'draft',
      (payload->>'period_start')::date,
      (payload->>'period_end')::date
    )
    returning * into target_version;
  else
    update public.meal_plan_versions
      set period_start = (payload->>'period_start')::date,
          period_end = (payload->>'period_end')::date
      where id = current_version.id
      returning * into target_version;
    delete from public.meal_plan_items where meal_plan_version_id = target_version.id;
  end if;
  for item in select value from jsonb_array_elements(payload->'items') loop
    slot_key := public.meal_plan_slot_key(item->>'slot');
    resolved := null;
    recipe_uuid := null;
    if coalesce(nullif(item->>'recipe_id',''),'') <> '' then
      begin
        recipe_uuid := (item->>'recipe_id')::uuid;
      exception when invalid_text_representation then
        raise exception using errcode='22023', message='meal_plan_recipe';
      end;
      ver_no := nullif(item->>'recipe_version','')::int;
      select v.id into resolved
      from public.recipe_versions v
      join public.recipes r on r.id = v.recipe_id
      where r.id = recipe_uuid
        and r.nutritionist_id = nid
        and v.published_at is not null
        and (ver_no is null or v.version = ver_no)
      order by v.version desc
      limit 1;
      if resolved is null then
        raise exception using errcode='22023', message='meal_plan_recipe';
      end if;
    end if;
    insert into public.meal_plan_items(meal_plan_version_id, for_date, slot, recipe_version_id, free_text, portions, public_note)
    values (
      target_version.id,
      (item->>'for_date')::date,
      slot_key,
      resolved,
      case when resolved is null then nullif(btrim(coalesce(item->>'free_text','')),'') else null end,
      case when item ? 'portions' and item->'portions' is not null then (item->>'portions')::numeric else null end,
      coalesce(item->>'public_note','')
    );
  end loop;
  return public.meal_plan_professional_json(pid);
end; $$;

create or replace function public.publish_meal_plan(target_plan uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.meal_plans;
  ver public.meal_plan_versions;
begin
  nid := public.recipe_assert_nutri();
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='meal_plan_version';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  select * into rec from public.meal_plans where id = target_plan;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='meal_plan_forbidden';
  end if;
  perform public.intake_assert_access(rec.patient_id, true);
  select * into ver from public.meal_plan_versions v where v.meal_plan_id = target_plan and v.version = expected_version;
  if not found then
    raise exception using errcode='22023', message='meal_plan_version';
  end if;
  if not exists (select 1 from public.meal_plan_items i where i.meal_plan_version_id = ver.id) then
    raise exception using errcode='22023', message='meal_plan_items';
  end if;
  if ver.status = 'published' then
    return public.meal_plan_professional_json(target_plan);
  end if;
  if ver.status is distinct from 'draft' then
    raise exception using errcode='PT409', message='meal_plan_version_conflict';
  end if;
  update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status = 'published';
  update public.meal_plan_versions
    set status = 'published', published_at = clock_timestamp()
    where id = ver.id;
  return public.meal_plan_professional_json(target_plan);
end; $$;

create or replace function public.list_professional_meal_plan(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare nid uuid; pid uuid;
begin
  nid := public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient, true);
  select id into pid from public.meal_plans where patient_id = target_patient and nutritionist_id = nid;
  if pid is null then return null; end if;
  return public.meal_plan_professional_json(pid);
end; $$;

create or replace function public.list_published_meal_plan(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid uuid; vid uuid;
begin
  perform public.intake_assert_access(target_patient);
  select p.id, v.id into pid, vid
  from public.meal_plans p
  join public.meal_plan_versions v on v.meal_plan_id = p.id and v.status = 'published'
  where p.patient_id = target_patient
  limit 1;
  if vid is null then return null; end if;
  return jsonb_build_object(
    'id', pid,
    'timezone', (select timezone from public.meal_plans where id = pid),
    'version', (select version from public.meal_plan_versions where id = vid),
    'period_start', (select period_start from public.meal_plan_versions where id = vid),
    'period_end', (select period_end from public.meal_plan_versions where id = vid),
    'published_at', (select published_at from public.meal_plan_versions where id = vid),
    'items', public.meal_plan_version_json(vid)->'items'
  );
end; $$;

revoke all on function public.meal_plan_version_immutable(),
  public.meal_plan_item_immutable(),
  public.meal_plan_slot_key(text),
  public.meal_plan_slot_label(public.meal_slot_kind),
  public.meal_plan_item_json(uuid),
  public.meal_plan_version_json(uuid),
  public.meal_plan_professional_json(uuid),
  public.meal_plan_validate_draft(jsonb),
  public.save_meal_plan_draft(uuid,jsonb),
  public.publish_meal_plan(uuid,int),
  public.list_professional_meal_plan(uuid),
  public.list_published_meal_plan(uuid)
from public, anon;

grant execute on function public.save_meal_plan_draft(uuid,jsonb),
  public.publish_meal_plan(uuid,int),
  public.list_professional_meal_plan(uuid),
  public.list_published_meal_plan(uuid)
to authenticated;
