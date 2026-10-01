-- Meta de calorías y macronutrientes por paciente (Mifflin-St Jeor).
-- La nutricionista calcula y guarda un borrador; la paciente sólo ve la meta
-- cuando la nutricionista la confirma (published_at). Una fila por paciente.

create table if not exists public.nutrition_targets (
  patient_id uuid primary key references public.patients(id),
  inputs jsonb not null,
  result jsonb not null,
  published_at timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.nutrition_targets enable row level security;

create policy nutrition_targets_read_pro on public.nutrition_targets for select to authenticated
  using (public.is_assigned_patient(patient_id));
create policy nutrition_targets_read_patient on public.nutrition_targets for select to authenticated
  using (published_at is not null and patient_id = public.my_patient_id());

create or replace function public.save_nutrition_target(target uuid, target_inputs jsonb, target_result jsonb, publish boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  row public.nutrition_targets;
begin
  if auth.uid() is null or public.my_nutritionist_id() is null or not public.is_assigned_patient(target) then
    raise exception using errcode = '42501', message = 'nutrition_target_pro_only';
  end if;
  if jsonb_typeof(target_inputs) is distinct from 'object' or jsonb_typeof(target_result) is distinct from 'object'
     or publish is null or (target_result->>'kcal')::numeric not between 500 and 8000 then
    raise exception using errcode = '22023', message = 'nutrition_target_data';
  end if;
  insert into public.nutrition_targets(patient_id, inputs, result, published_at, updated_at)
    values (target, target_inputs, target_result, case when publish then clock_timestamp() end, clock_timestamp())
  on conflict (patient_id) do update
    set inputs = excluded.inputs, result = excluded.result,
        published_at = case when publish then clock_timestamp() else null end,
        updated_at = clock_timestamp()
  returning * into row;
  return to_jsonb(row);
end; $$;

revoke all on function public.save_nutrition_target(uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_nutrition_target(uuid, jsonb, jsonb, boolean) to authenticated;

-- Datos corporales que carga la paciente (onboarding y después desde la app).
-- La nutricionista puede pedir una actualización (tabla de pedidos); al guardar se limpia.
create table if not exists public.patient_body_data (
  patient_id uuid primary key references public.patients(id),
  sex text not null check (sex in ('femenino', 'masculino')),
  birth_date date not null,
  height_cm numeric not null check (height_cm between 120 and 230),
  weight_kg numeric not null check (weight_kg between 30 and 300),
  updated_at timestamptz not null default clock_timestamp()
);
-- El pedido de la nutricionista vive aparte: puede existir antes de que haya datos.
create table if not exists public.patient_body_data_requests (
  patient_id uuid primary key references public.patients(id),
  requested_at timestamptz not null default clock_timestamp()
);

alter table public.patient_body_data enable row level security;
alter table public.patient_body_data_requests enable row level security;
create policy body_data_read_pro on public.patient_body_data for select to authenticated using (public.is_assigned_patient(patient_id));
create policy body_data_read_self on public.patient_body_data for select to authenticated using (patient_id = public.my_patient_id());
create policy body_requests_read_pro on public.patient_body_data_requests for select to authenticated using (public.is_assigned_patient(patient_id));
create policy body_requests_read_self on public.patient_body_data_requests for select to authenticated using (patient_id = public.my_patient_id());

create or replace function public.save_my_body_data(body jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_patient_id();
  row public.patient_body_data;
begin
  if auth.uid() is null or pid is null then
    raise exception using errcode = '42501', message = 'body_data_patient_only';
  end if;
  insert into public.patient_body_data(patient_id, sex, birth_date, height_cm, weight_kg, updated_at)
    values (pid, body->>'sex', (body->>'birth_date')::date, (body->>'height_cm')::numeric, (body->>'weight_kg')::numeric, clock_timestamp())
  on conflict (patient_id) do update
    set sex = excluded.sex, birth_date = excluded.birth_date, height_cm = excluded.height_cm,
        weight_kg = excluded.weight_kg, updated_at = clock_timestamp()
  returning * into row;
  delete from public.patient_body_data_requests where patient_id = pid;
  return to_jsonb(row);
end; $$;

create or replace function public.request_body_data(target uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.my_nutritionist_id() is null or not public.is_assigned_patient(target) then
    raise exception using errcode = '42501', message = 'body_data_pro_only';
  end if;
  insert into public.patient_body_data_requests(patient_id) values (target)
    on conflict (patient_id) do update set requested_at = clock_timestamp();
  return jsonb_build_object('patient_id', target, 'requested', true);
end; $$;

revoke all on function public.save_my_body_data(jsonb), public.request_body_data(uuid) from public, anon;
grant execute on function public.save_my_body_data(jsonb), public.request_body_data(uuid) to authenticated;
