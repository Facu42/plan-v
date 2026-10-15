-- Equivalencias: listas de alimentos intercambiables y grupos de alimentos.
-- Las filas con owner_id nulo son de «Sistema»: las leen todos los consultorios y sólo el servicio las
-- escribe. Las demás pertenecen a un consultorio. No importa ni carga contenido nutricional.
-- Aplicación en producción requiere autorización escrita. Recuperación: exportar exchange_catalog antes
-- de retirar el módulo; el despliegue anterior ignora la tabla y no toca planes ni recetas publicados.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

create function public.valid_exchange_item(value jsonb, with_quantity boolean) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if with_quantity then
    if not (value ?& array['food_id','name','measure','grams']) or (select count(*) from jsonb_object_keys(value)) <> 4 then return false; end if;
  else
    if not (value ?& array['food_id','name']) or (select count(*) from jsonb_object_keys(value)) <> 2 then return false; end if;
  end if;
  if jsonb_typeof(value->'food_id') not in ('null','string') then return false; end if;
  if jsonb_typeof(value->'food_id') = 'string' and
    (value->>'food_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  if jsonb_typeof(value->'name') is distinct from 'string' or length(btrim(value->>'name')) not between 1 and 160 then return false; end if;
  if with_quantity then
    if jsonb_typeof(value->'measure') is distinct from 'string' or length(btrim(value->>'measure')) not between 1 and 80 then return false; end if;
    if jsonb_typeof(value->'grams') is distinct from 'number' or (value->>'grams')::numeric <= 0 or (value->>'grams')::numeric > 100000 then return false; end if;
  end if;
  return true;
exception when others then return false;
end;
$$;

create function public.valid_exchange_payload(entry_kind text, value jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare k text; i jsonb; portion jsonb;
begin
  if jsonb_typeof(value) is distinct from 'object' then return false; end if;
  if entry_kind = 'list' then
    if not (value ?& array['name','description','justification','base','items']) or (select count(*) from jsonb_object_keys(value)) <> 5 then return false; end if;
  elsif entry_kind = 'group' then
    if not (value ?& array['name','description','portion','foods']) or (select count(*) from jsonb_object_keys(value)) <> 4 then return false; end if;
  else return false; end if;
  foreach k in array array['name','description'] loop
    if jsonb_typeof(value->k) is distinct from 'string' then return false; end if;
  end loop;
  if length(btrim(value->>'name')) not between 1 and 160 or length(value->>'description') > 400 then return false; end if;
  if entry_kind = 'list' then
    if jsonb_typeof(value->'justification') is distinct from 'string' or length(value->>'justification') > 500 then return false; end if;
    if not public.valid_exchange_item(value->'base', true) then return false; end if;
    if jsonb_typeof(value->'items') is distinct from 'array' or jsonb_array_length(value->'items') not between 1 and 50 then return false; end if;
    for i in select * from jsonb_array_elements(value->'items') loop
      if not public.valid_exchange_item(i, true) then return false; end if;
    end loop;
  else
    if jsonb_typeof(value->'foods') is distinct from 'array' or jsonb_array_length(value->'foods') not between 1 and 100 then return false; end if;
    for i in select * from jsonb_array_elements(value->'foods') loop
      if not public.valid_exchange_item(i, false) then return false; end if;
    end loop;
    portion := value->'portion';
    if jsonb_typeof(portion) is distinct from 'null' then
      if jsonb_typeof(portion) is distinct from 'object' or not (portion ?& array['measure','grams']) or
        (select count(*) from jsonb_object_keys(portion)) <> 2 or
        jsonb_typeof(portion->'measure') is distinct from 'string' or length(btrim(portion->>'measure')) not between 1 and 80 or
        jsonb_typeof(portion->'grams') is distinct from 'number' or (portion->>'grams')::numeric <= 0 or (portion->>'grams')::numeric > 100000
      then return false; end if;
    end if;
  end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_exchange_item(jsonb, boolean) from public, anon;
revoke all on function public.valid_exchange_payload(text, jsonb) from public, anon;
grant execute on function public.valid_exchange_item(jsonb, boolean) to authenticated, service_role;
grant execute on function public.valid_exchange_payload(text, jsonb) to authenticated, service_role;

create table public.exchange_catalog (
  id uuid primary key,
  owner_id uuid references public.nutritionists(id),
  kind text not null check (kind in ('list', 'group')),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  payload jsonb not null,
  archived_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  constraint exchange_catalog_payload check (public.valid_exchange_payload(kind, payload))
);
create index exchange_catalog_owner on public.exchange_catalog(owner_id);
alter table public.exchange_catalog enable row level security;
revoke all on public.exchange_catalog from public, anon, authenticated;
grant select, insert on public.exchange_catalog to authenticated;
grant update(payload, revision, archived_at, updated_at) on public.exchange_catalog to authenticated;
grant all on public.exchange_catalog to service_role;
create policy exchange_catalog_read on public.exchange_catalog for select to authenticated
  using (public.my_nutritionist_id() is not null and (owner_id is null or owner_id = public.my_nutritionist_id()));
create policy exchange_catalog_create on public.exchange_catalog for insert to authenticated
  with check (owner_id = public.my_nutritionist_id());
create policy exchange_catalog_edit on public.exchange_catalog for update to authenticated
  using (owner_id = public.my_nutritionist_id()) with check (owner_id = public.my_nutritionist_id());

create function public.save_exchange_entry(entry_id uuid, entry_kind text, expected_revision bigint, entry_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare owner uuid := public.my_nutritionist_id(); saved public.exchange_catalog; old public.exchange_catalog; foods jsonb;
begin
  if owner is null then raise exception using errcode='42501', message='professional_required'; end if;
  if entry_id is null or expected_revision is null or expected_revision < 0 or expected_revision >= 9007199254740991
    or entry_kind is null or not public.valid_exchange_payload(entry_kind, entry_payload)
  then raise exception using errcode='22023', message='invalid_exchange'; end if;
  -- Los alimentos vinculados deben ser visibles para este consultorio (propios o de la plataforma).
  foods := case entry_kind when 'list' then (entry_payload->'items') || jsonb_build_array(entry_payload->'base') else entry_payload->'foods' end;
  if exists (
    select 1 from jsonb_array_elements(foods) f
    where f->>'food_id' is not null
      and not exists (select 1 from public.food_catalog c where c.id = (f->>'food_id')::uuid)
  ) then raise exception using errcode='22023', message='unknown_food'; end if;
  select * into old from public.exchange_catalog where id = entry_id for update;
  if found then
    if old.owner_id is distinct from owner then raise exception using errcode='42501', message='exchange_owner'; end if;
    if old.kind <> entry_kind then raise exception using errcode='22023', message='exchange_kind'; end if;
    if old.archived_at is not null then raise exception using errcode='PT409', message='exchange_archived'; end if;
    if old.revision <> expected_revision then
      if old.revision = expected_revision + 1 and old.payload = entry_payload then return to_jsonb(old); end if;
      raise exception using errcode='PT409', message='exchange_revision';
    end if;
    update public.exchange_catalog set payload = entry_payload, revision = old.revision + 1, updated_at = clock_timestamp()
      where id = entry_id returning * into saved;
  else
    if expected_revision <> 0 then raise exception using errcode='PT409', message='exchange_missing'; end if;
    insert into public.exchange_catalog(id, owner_id, kind, payload) values (entry_id, owner, entry_kind, entry_payload) returning * into saved;
  end if;
  return to_jsonb(saved);
end;
$$;

create function public.archive_exchange_entry(entry_id uuid, expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare owner uuid := public.my_nutritionist_id(); saved public.exchange_catalog;
begin
  if owner is null then raise exception using errcode='42501', message='professional_required'; end if;
  update public.exchange_catalog set archived_at = clock_timestamp(), revision = revision + 1, updated_at = clock_timestamp()
    where id = entry_id and owner_id = owner and revision = expected_revision and archived_at is null
    returning * into saved;
  if not found then
    if exists (select 1 from public.exchange_catalog where id = entry_id and owner_id = owner)
    then raise exception using errcode='PT409', message='exchange_revision';
    else raise exception using errcode='42501', message='exchange_owner'; end if;
  end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_exchange_entry(uuid, text, bigint, jsonb) from public, anon;
revoke all on function public.archive_exchange_entry(uuid, bigint) from public, anon;
grant execute on function public.save_exchange_entry(uuid, text, bigint, jsonb) to authenticated;
grant execute on function public.archive_exchange_entry(uuid, bigint) to authenticated;
commit;
