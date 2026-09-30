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
