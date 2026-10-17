-- Alternativas del plan que elige la paciente (de los grupos de intercambio que aprobó su nutri).
-- Guarda solo la elección; el plan aprobado no se toca. Se lee y se escribe por dos funciones:
-- la paciente (o su nutri, para leer) y nada más. Aditiva y repetible: sin DROP ni DELETE de datos.
-- No se aplica sola: espera la frase escrita de Facundo en la base en línea.
-- Retroceso, si hiciera falta: sacar las dos funciones y la tabla (solo guarda elecciones de la paciente).

create table if not exists public.patient_plan_choices (
  patient_id uuid not null references public.patients(id) on delete cascade,
  item_id uuid not null references public.meal_plan_items(id) on delete cascade,
  component_id uuid not null,
  group_id uuid not null references public.nutrition_exchanges(id),
  group_revision bigint not null check (group_revision > 0),
  base_food_id uuid not null,
  food_id uuid not null,
  food_revision bigint not null check (food_revision > 0),
  food_name text not null check (length(btrim(food_name)) between 1 and 200),
  quantity numeric not null check (quantity > 0 and quantity <= 100000),
  unit text not null check (unit in ('g', 'ml')),
  chosen_at timestamptz not null default now(),
  primary key (patient_id, item_id, component_id)
);

create index if not exists patient_plan_choices_group_idx on public.patient_plan_choices(group_id);
create index if not exists patient_plan_choices_item_idx on public.patient_plan_choices(item_id);

alter table public.patient_plan_choices enable row level security;
revoke all on public.patient_plan_choices from public, anon, authenticated;

comment on table public.patient_plan_choices is
  'Alternativa que la paciente eligió para un alimento del plan, entre las de un grupo de intercambios de su nutri. No cambia el plan aprobado.';

-- Grupos de la nutri de la paciente y elecciones vigentes. Pueden leer la paciente y su nutri.
create or replace function public.list_patient_plan_alternatives(target_patient uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select p.nutritionist_id into owner
  from public.patients p
  where p.id = target_patient
    and p.deactivated_at is null
    and p.anonymized_at is null
    and (p.user_id = auth.uid() or p.nutritionist_id = public.my_nutritionist_id());
  if owner is null then
    raise exception using errcode = '42501', message = 'plan_choices_access';
  end if;
  return jsonb_build_object(
    'groups', coalesce((
      select jsonb_agg(e.payload || jsonb_build_object('id', e.id, 'owner_id', e.owner_id, 'revision', e.revision, 'updated_at', e.updated_at) order by e.id)
      from public.nutrition_exchanges e where e.owner_id = owner
    ), '[]'::jsonb),
    'choices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', c.item_id, 'component_id', c.component_id, 'group_id', c.group_id,
        'group_revision', c.group_revision, 'base_food_id', c.base_food_id, 'food_id', c.food_id,
        'food_revision', c.food_revision, 'food_name', c.food_name, 'quantity', c.quantity,
        'unit', c.unit, 'chosen_at', c.chosen_at))
      from public.patient_plan_choices c where c.patient_id = target_patient
    ), '[]'::jsonb)
  );
end;
$$;

-- Guarda (o quita, si food_id viene vacío) la elección de la paciente. Solo la paciente y solo
-- sobre un alimento de su plan publicado; el alimento y su original tienen que ser del mismo grupo.
create or replace function public.save_patient_plan_choice(target_patient uuid, request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  item uuid;
  component uuid;
  grp public.nutrition_exchanges;
  base_food uuid;
  alt_food uuid;
  alt jsonb;
  qty numeric;
begin
  if jsonb_typeof(request) is distinct from 'object' or not (request ? 'item_id' and request ? 'component_id') then
    raise exception using errcode = '22023', message = 'plan_choice_data';
  end if;
  select p.nutritionist_id into owner
  from public.patients p
  where p.id = target_patient and p.user_id = auth.uid()
    and p.deactivated_at is null and p.anonymized_at is null;
  if owner is null then
    raise exception using errcode = '42501', message = 'plan_choices_access';
  end if;
  item := (request->>'item_id')::uuid;
  component := (request->>'component_id')::uuid;
  if not exists (
    select 1
    from public.meal_plan_items i
    join public.meal_plan_versions v on v.id = i.meal_plan_version_id and v.status = 'published'
    join public.meal_plans m on m.id = v.meal_plan_id
    where i.id = item and m.patient_id = target_patient
  ) then
    raise exception using errcode = '42501', message = 'plan_choice_item';
  end if;
  if request->'food_id' is null or jsonb_typeof(request->'food_id') = 'null' then
    delete from public.patient_plan_choices where patient_id = target_patient and item_id = item and component_id = component;
    return jsonb_build_object('removed', true);
  end if;
  if not (request ?& array['group_id', 'base_food_id', 'food_id', 'quantity', 'unit']) or request->>'unit' not in ('g', 'ml') then
    raise exception using errcode = '22023', message = 'plan_choice_data';
  end if;
  select * into grp from public.nutrition_exchanges e where e.id = (request->>'group_id')::uuid and e.owner_id = owner;
  if not found then
    raise exception using errcode = '42501', message = 'plan_choice_group';
  end if;
  base_food := (request->>'base_food_id')::uuid;
  alt_food := (request->>'food_id')::uuid;
  qty := (request->>'quantity')::numeric;
  select i into alt from jsonb_array_elements(grp.payload->'items') i where i->'food'->>'id' = alt_food::text;
  if alt is null or not exists (select 1 from jsonb_array_elements(grp.payload->'items') i where i->'food'->>'id' = base_food::text) then
    raise exception using errcode = '42501', message = 'plan_choice_group';
  end if;
  insert into public.patient_plan_choices(patient_id, item_id, component_id, group_id, group_revision, base_food_id, food_id, food_revision, food_name, quantity, unit)
  values (target_patient, item, component, grp.id, grp.revision, base_food, alt_food,
          (alt->'food'->>'revision')::bigint, left(alt->'food'->>'name', 200), qty, request->>'unit')
  on conflict (patient_id, item_id, component_id) do update
    set group_id = excluded.group_id, group_revision = excluded.group_revision, base_food_id = excluded.base_food_id,
        food_id = excluded.food_id, food_revision = excluded.food_revision, food_name = excluded.food_name,
        quantity = excluded.quantity, unit = excluded.unit, chosen_at = now();
  return jsonb_build_object('removed', false);
end;
$$;

revoke all on function public.list_patient_plan_alternatives(uuid), public.save_patient_plan_choice(uuid, jsonb) from public, anon;
grant execute on function public.list_patient_plan_alternatives(uuid), public.save_patient_plan_choice(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
