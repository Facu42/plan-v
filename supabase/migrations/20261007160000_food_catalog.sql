-- Catálogo propio; no importa bases externas. Aplicación en producción requiere autorización.
-- Recuperación: conservar/exportar food_catalog antes de retirar el módulo; el despliegue
-- anterior ignora esta tabla. No elimina ni modifica planes/recetas publicados.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

create function public.valid_food_payload(value jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare k text; n jsonb; p jsonb; labels text[] := '{}'; label text; maximum numeric;
begin
  if jsonb_typeof(value) is distinct from 'object' or
    not (value ?& array['name','brand','category','kind','source','reference','nutrients','portions']) or
    (select count(*) from jsonb_object_keys(value)) <> 8 then return false; end if;
  foreach k in array array['name','brand','category','kind','source','reference'] loop
    if jsonb_typeof(value->k) is distinct from 'string' then return false; end if;
  end loop;
  if length(btrim(value->>'name')) not between 1 and 160 or length(value->>'brand') > 120 or
    length(value->>'category') > 80 or length(btrim(value->>'source')) not between 1 and 240 or
    length(value->>'reference') > 500 or value->>'kind' not in ('food','supplement') then return false; end if;
  if jsonb_typeof(value->'nutrients') is distinct from 'object' or
    (select count(*) from jsonb_object_keys(value->'nutrients')) <> 11 then return false; end if;
  foreach k in array array['kcal','protein','carbs','fat','fiber','sodium','calcium','iron','potassium','magnesium','vitamin_c'] loop
    n := value->'nutrients'->k;
    if n is null then return false; end if;
    if n = 'null'::jsonb then continue; end if;
    maximum := case when k='kcal' then 1000 when k in ('protein','carbs','fat','fiber') then 100 else 100000 end;
    if jsonb_typeof(n) <> 'number' or n::text::numeric < 0 or n::text::numeric > maximum then return false; end if;
  end loop;
  if jsonb_typeof(value->'portions') is distinct from 'array' or jsonb_array_length(value->'portions') > 30 then return false; end if;
  for p in select * from jsonb_array_elements(value->'portions') loop
    if jsonb_typeof(p) is distinct from 'object' or not (p ?& array['name','grams']) or
      (select count(*) from jsonb_object_keys(p)) <> 2 or jsonb_typeof(p->'name') is distinct from 'string' or
      length(btrim(p->>'name')) not between 1 and 80 or jsonb_typeof(p->'grams') is distinct from 'number' then return false; end if;
    if (p->>'grams')::numeric <= 0 or (p->>'grams')::numeric > 100000 then return false; end if;
    label := lower(translate(regexp_replace(btrim(p->>'name'), '\s+', ' ', 'g'), 'áéíóúüñ', 'aeiouun'));
    if label = any(labels) then return false; end if;
    labels := array_append(labels, label);
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_food_payload(jsonb) from public, anon;
grant execute on function public.valid_food_payload(jsonb) to authenticated, service_role;

create table public.food_catalog (
  id uuid primary key,
  owner_id uuid references public.nutritionists(id),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  payload jsonb not null check (public.valid_food_payload(payload)),
  updated_at timestamptz not null default clock_timestamp()
);
create index food_catalog_owner on public.food_catalog(owner_id);
alter table public.food_catalog enable row level security;
revoke all on public.food_catalog from public, anon, authenticated;
grant select, insert on public.food_catalog to authenticated;
grant update(payload, revision, updated_at) on public.food_catalog to authenticated;
grant all on public.food_catalog to service_role;
create policy food_catalog_read on public.food_catalog for select to authenticated
  using (public.my_nutritionist_id() is not null and (owner_id is null or owner_id = public.my_nutritionist_id()));
create policy food_catalog_create on public.food_catalog for insert to authenticated
  with check (owner_id = public.my_nutritionist_id());
create policy food_catalog_edit on public.food_catalog for update to authenticated
  using (owner_id = public.my_nutritionist_id()) with check (owner_id = public.my_nutritionist_id());

create function public.save_food_catalog_item(food_id uuid, expected_revision bigint, food_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare owner uuid := public.my_nutritionist_id(); saved public.food_catalog; old public.food_catalog;
begin
  if owner is null then raise exception using errcode='42501', message='professional_required'; end if;
  if food_id is null or expected_revision is null or expected_revision < 0 or expected_revision >= 9007199254740991 or
    not public.valid_food_payload(food_payload) then raise exception using errcode='22023', message='invalid_food'; end if;
  select * into old from public.food_catalog where id=food_id for update;
  if found then
    if old.owner_id is distinct from owner then raise exception using errcode='42501', message='food_owner'; end if;
    if old.revision <> expected_revision then
      if old.revision=expected_revision+1 and old.payload=food_payload then return to_jsonb(old); end if;
      raise exception using errcode='PT409', message='food_revision';
    end if;
    update public.food_catalog set payload=food_payload, revision=old.revision+1, updated_at=clock_timestamp()
      where id=food_id returning * into saved;
  else
    if expected_revision <> 0 then raise exception using errcode='PT409', message='food_missing'; end if;
    insert into public.food_catalog(id,owner_id,payload) values(food_id,owner,food_payload) returning * into saved;
  end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_food_catalog_item(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_food_catalog_item(uuid,bigint,jsonb) to authenticated;
commit;
