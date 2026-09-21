-- PV-21: lista de compras derivada del plan publicado (cantidades/unidades),
-- agregados manuales y checks sincronizados. No suma unidades incompatibles.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

create table if not exists public.shopping_manual_items (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  quantity numeric not null check (quantity > 0 and quantity <= 100000),
  unit text not null check (unit in ('g','ml','u','cdita','cda','taza')),
  client_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (patient_id, client_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.shopping_checks (
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_key text not null check (char_length(btrim(source_key)) between 1 and 180),
  checked boolean not null default true,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (patient_id, source_key)
);

create index if not exists shopping_manual_items_patient_idx
  on public.shopping_manual_items (patient_id, created_at desc);
create index if not exists shopping_checks_patient_idx
  on public.shopping_checks (patient_id);

alter table public.shopping_manual_items enable row level security;
alter table public.shopping_checks enable row level security;

revoke all on public.shopping_manual_items, public.shopping_checks from public, anon, authenticated;
grant select, insert, update, delete on public.shopping_manual_items, public.shopping_checks to authenticated;

drop policy if exists shopping_manual_patient_all on public.shopping_manual_items;
create policy shopping_manual_patient_all on public.shopping_manual_items
  for all to authenticated
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id))
  with check (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

drop policy if exists shopping_manual_nutri_select on public.shopping_manual_items;
create policy shopping_manual_nutri_select on public.shopping_manual_items
  for select to authenticated
  using (public.is_assigned_patient(patient_id));

drop policy if exists shopping_checks_patient_all on public.shopping_checks;
create policy shopping_checks_patient_all on public.shopping_checks
  for all to authenticated
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id))
  with check (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

drop policy if exists shopping_checks_nutri_select on public.shopping_checks;
create policy shopping_checks_nutri_select on public.shopping_checks
  for select to authenticated
  using (public.is_assigned_patient(patient_id));

create or replace function public.shopping_assert_patient(target uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
begin
  if target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then
    raise exception using errcode='42501', message='shopping_patient_only';
  end if;
  return target;
end; $$;

create or replace function public.shopping_list_json(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  vid uuid;
  ver int;
  pstart date;
  pend date;
  items jsonb;
begin
  select v.id, v.version, v.period_start, v.period_end
    into vid, ver, pstart, pend
  from public.meal_plans p
  join public.meal_plan_versions v on v.meal_plan_id = p.id and v.status = 'published'
  where p.patient_id = target_patient
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(line) order by line.name, coalesce(line.unit, '')), '[]'::jsonb)
    into items
  from (
    select
      case when src.kind = 'manual' then split_part(src.source_key, ':', 2) else src.source_key end as id,
      src.kind,
      src.source_key,
      src.name,
      src.quantity,
      src.unit,
      src.occurrences,
      exists (
        select 1 from public.shopping_checks c
        where c.patient_id = target_patient
          and c.source_key = src.source_key
          and c.checked
      ) as checked
    from (
      select
        'derived'::text as kind,
        'derived:' || public.recipe_normalize_name(min(i.name)) || '|' || ri.unit as source_key,
        min(i.name) as name,
        round(sum(round((ri.quantity * coalesce(mpi.portions, 1) / rv.yield_portions)::numeric, 2)), 2) as quantity,
        ri.unit as unit,
        count(*)::int as occurrences
      from public.meal_plan_items mpi
      join public.recipe_versions rv on rv.id = mpi.recipe_version_id
      join public.recipe_ingredients ri on ri.recipe_version_id = rv.id
      join public.ingredients i on i.id = ri.ingredient_id
      where mpi.meal_plan_version_id = vid
        and char_length(btrim(i.name)) > 0
      group by public.recipe_normalize_name(i.name), ri.unit

      union all

      select
        'text'::text,
        'text:' || public.recipe_normalize_name(min(mpi.free_text)),
        min(btrim(mpi.free_text)),
        null::numeric,
        null::text,
        count(*)::int
      from public.meal_plan_items mpi
      where mpi.meal_plan_version_id = vid
        and mpi.recipe_version_id is null
        and char_length(btrim(coalesce(mpi.free_text, ''))) > 0
      group by public.recipe_normalize_name(mpi.free_text)

      union all

      select
        'manual'::text,
        'manual:' || m.id::text,
        m.name,
        m.quantity,
        m.unit,
        1
      from public.shopping_manual_items m
      where m.patient_id = target_patient
    ) src
  ) line;

  return jsonb_build_object(
    'plan_version', ver,
    'period_start', pstart,
    'period_end', pend,
    'items', items
  );
end; $$;

create or replace function public.get_shopping_list(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target_patient);
  return public.shopping_list_json(target_patient);
end; $$;

create or replace function public.add_shopping_manual(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  cid uuid;
  nam text;
  qty numeric;
  unit text;
  existing public.shopping_manual_items;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','name','quantity','unit','client_id')
  ) then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='shopping_invalid';
  end;
  if pid is null or cid is null then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  perform public.shopping_assert_patient(pid);
  nam := btrim(coalesce(payload->>'name', ''));
  if char_length(nam) not between 1 and 80 then
    raise exception using errcode='22023', message='shopping_name';
  end if;
  if jsonb_typeof(payload->'quantity') is distinct from 'number' then
    raise exception using errcode='22023', message='shopping_quantity';
  end if;
  qty := (payload->>'quantity')::numeric;
  if qty <= 0 or qty > 100000 then
    raise exception using errcode='22023', message='shopping_quantity';
  end if;
  unit := payload->>'unit';
  if unit not in ('g','ml','u','cdita','cda','taza') then
    raise exception using errcode='22023', message='shopping_unit';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text || ':shop:' || cid::text, 0));
  select * into existing from public.shopping_manual_items where patient_id = pid and client_id = cid;
  if found then
    if existing.name is distinct from nam or existing.quantity is distinct from qty or existing.unit is distinct from unit then
      raise exception using errcode='23505', message='shopping_duplicate';
    end if;
    return public.shopping_list_json(pid);
  end if;
  insert into public.shopping_manual_items(patient_id, nutritionist_id, name, quantity, unit, client_id)
  select pid, p.nutritionist_id, nam, qty, unit, cid
  from public.patients p where p.id = pid;
  return public.shopping_list_json(pid);
end; $$;

create or replace function public.set_shopping_checked(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  key text;
  flag boolean;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','source_key','checked')
  ) then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='shopping_invalid';
  end;
  if pid is null then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  perform public.shopping_assert_patient(pid);
  key := btrim(coalesce(payload->>'source_key', ''));
  if char_length(key) not between 1 and 180 then
    raise exception using errcode='22023', message='shopping_key';
  end if;
  if jsonb_typeof(payload->'checked') is distinct from 'boolean' then
    raise exception using errcode='22023', message='shopping_checked';
  end if;
  flag := (payload->>'checked')::boolean;
  if not exists (
    select 1 from jsonb_array_elements(public.shopping_list_json(pid)->'items') item
    where item->>'source_key' = key
  ) then
    raise exception using errcode='PT404', message='shopping_missing';
  end if;
  if flag then
    insert into public.shopping_checks(patient_id, source_key, checked)
    values (pid, key, true)
    on conflict (patient_id, source_key) do update
      set checked = true, updated_at = clock_timestamp();
  else
    delete from public.shopping_checks where patient_id = pid and source_key = key;
  end if;
  return public.shopping_list_json(pid);
end; $$;

create or replace function public.delete_shopping_manual(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  iid uuid;
  existing public.shopping_manual_items;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','item_id')
  ) then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    iid := (payload->>'item_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='shopping_invalid';
  end;
  if pid is null or iid is null then
    raise exception using errcode='22023', message='shopping_invalid';
  end if;
  perform public.shopping_assert_patient(pid);
  select * into existing from public.shopping_manual_items where id = iid and patient_id = pid;
  if not found then
    raise exception using errcode='PT404', message='shopping_missing';
  end if;
  delete from public.shopping_checks where patient_id = pid and source_key = 'manual:' || iid::text;
  delete from public.shopping_manual_items where id = iid and patient_id = pid;
  return public.shopping_list_json(pid);
end; $$;

revoke all on function public.shopping_assert_patient(uuid),
  public.shopping_list_json(uuid),
  public.get_shopping_list(uuid),
  public.add_shopping_manual(jsonb),
  public.set_shopping_checked(jsonb),
  public.delete_shopping_manual(jsonb)
from public, anon;

grant execute on function public.get_shopping_list(uuid),
  public.add_shopping_manual(jsonb),
  public.set_shopping_checked(jsonb),
  public.delete_shopping_manual(jsonb)
to authenticated;
