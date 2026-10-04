-- Conserva la meta confirmada al guardar un borrador y compara la revisión leída.
-- SQL ensayado localmente; su aplicación en producción requiere autorización.
-- Rollback: volver al backend anterior sólo después de exportar borradores y
-- restaurar la definición previa del RPC. No combinar ambos en una sola fila:
-- eso vuelve a ocultar la meta publicada. No se amplían recursos ni servicios.
-- Cutover: pausar guardados de metas anteriores durante esta transacción. El
-- bloqueo acotado impide que el copiado y el retiro lean revisiones diferentes;
-- si no se obtiene en 2s, aborta todo para reintentar en una ventana sin escrituras.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

create table public.nutrition_target_drafts (
  patient_id uuid primary key references public.patients(id),
  inputs jsonb,
  result jsonb,
  revision bigint not null check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default clock_timestamp(),
  constraint nutrition_target_draft_pair check (
    (inputs is null and result is null) or
    (jsonb_typeof(inputs) is not distinct from 'object' and jsonb_typeof(result) is not distinct from 'object')
  )
);
alter table public.nutrition_target_drafts enable row level security;
revoke all on public.nutrition_target_drafts from public, anon, authenticated;
grant select on public.nutrition_target_drafts to authenticated;
grant all on public.nutrition_target_drafts to service_role;
create policy nutrition_target_drafts_read_pro on public.nutrition_target_drafts
  for select to authenticated using (
    public.is_assigned_patient(patient_id) and private.nutrition_patient_is_active(patient_id)
  );

-- Cada fila antigua queda representada antes de retirar sólo las no publicadas.
-- No se puede recuperar una meta anterior que la implementación vieja sobrescribió.
lock table public.nutrition_targets in share row exclusive mode;
insert into public.nutrition_target_drafts(patient_id, inputs, result, revision, updated_at)
select patient_id, case when published_at is null then inputs end,
  case when published_at is null then result end, 1, updated_at
from public.nutrition_targets;
delete from public.nutrition_targets where published_at is null;
alter table public.nutrition_targets add constraint nutrition_targets_confirmed_only
  check (published_at is not null) not valid;
alter table public.nutrition_targets validate constraint nutrition_targets_confirmed_only;

-- Una lectura única mantiene consistentes borrador, confirmada y revisión.
-- Invoker conserva RLS; no accede a la ficha ni devuelve identidad personal.
create function public.get_nutrition_target_workspace(target uuid)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare workspace jsonb;
begin
  if auth.uid() is null or public.my_nutritionist_id() is null
    or not public.is_assigned_patient(target) or not private.nutrition_patient_is_active(target) then
    raise exception using errcode='42501', message='nutrition_target_pro_only';
  end if;
  select jsonb_build_object(
    'target', coalesce(state.draft, state.published),
    'draft', state.draft, 'published', state.published,
    'revision', coalesce(state.revision, 0)
  ) into workspace from (
    select (select jsonb_build_object('patient_id', d.patient_id, 'inputs', d.inputs,
      'result', d.result, 'published_at', null, 'updated_at', d.updated_at)
      from public.nutrition_target_drafts d where d.patient_id=target and d.inputs is not null) as draft,
      (select to_jsonb(t) from public.nutrition_targets t where t.patient_id=target and t.published_at is not null) as published,
      (select d.revision from public.nutrition_target_drafts d where d.patient_id=target) as revision
  ) state;
  return workspace;
end; $$;
revoke all on function public.get_nutrition_target_workspace(uuid) from public, anon;
grant execute on function public.get_nutrition_target_workspace(uuid) to authenticated;

-- Definer necesario: las tablas sólo permiten lectura directa. Verifica identidad
-- y pertenencia y serializa con el mismo bloqueo que retiro/anonimización.
create function private.save_nutrition_target_versioned(target uuid, target_inputs jsonb,
  target_result jsonb, publish boolean, expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_revision bigint; calculated jsonb; key text; saved_at timestamptz;
begin
  if auth.uid() is null or public.my_nutritionist_id() is null or not public.is_assigned_patient(target) then
    raise exception using errcode='42501', message='nutrition_target_pro_only';
  end if;
  -- Comparte orden de bloqueo con la aplicación de un menú IA: la meta no puede
  -- cambiar entre comparar el contexto aprobado y guardar ese menú.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text, 3));
  perform 1 from public.patients p where p.id=target
    and p.nutritionist_id=public.my_nutritionist_id()
    and p.deactivated_at is null and p.anonymized_at is null for update;
  if not found then
    raise exception using errcode='42501', message='nutrition_target_pro_only';
  end if;
  select d.revision into current_revision from public.nutrition_target_drafts d where d.patient_id=target;
  current_revision := coalesce(current_revision, 0);
  if expected_revision is null or expected_revision < 0 or expected_revision > 9007199254740991 then
    raise exception using errcode='22023', message='nutrition_target_revision_required';
  end if;
  if current_revision <> expected_revision then
    -- Una revisión vencida es un conflicto del producto, no un fallo de serialización.
    raise exception using errcode='PT409', message='nutrition_target_conflict';
  end if;
  if publish is null or jsonb_typeof(target_result) is distinct from 'object'
    or jsonb_typeof(target_result->'warnings') is distinct from 'array' then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  foreach key in array array['bmr','tdee','kcal','protein_g','fat_g','carbs_g','protein_pct','fat_pct','carbs_pct'] loop
    if jsonb_typeof(target_result->key) is distinct from 'number' then
      raise exception using errcode='22023', message='nutrition_target_data';
    end if;
  end loop;
  if (target_result->>'kcal')::numeric not between 500 and 8000 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  calculated := public.calculate_nutrition_target(target_inputs);
  saved_at := clock_timestamp();
  if publish then
    insert into public.nutrition_targets(patient_id, inputs, result, published_at, updated_at)
      values(target, target_inputs, calculated, saved_at, saved_at)
    on conflict(patient_id) do update set inputs=excluded.inputs, result=excluded.result,
      published_at=excluded.published_at, updated_at=excluded.updated_at;
  end if;
  insert into public.nutrition_target_drafts(patient_id, inputs, result, revision, updated_at)
    values(target, case when not publish then target_inputs end,
      case when not publish then calculated end, current_revision+1, saved_at)
  on conflict(patient_id) do update set inputs=excluded.inputs, result=excluded.result,
    revision=excluded.revision, updated_at=excluded.updated_at;
  return public.get_nutrition_target_workspace(target);
end; $$;
revoke all on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) from public, anon;
grant execute on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) to authenticated;

create function public.save_nutrition_target_versioned(target uuid, target_inputs jsonb,
  target_result jsonb, publish boolean, expected_revision bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.save_nutrition_target_versioned(target,target_inputs,target_result,publish,expected_revision);
$$;
revoke all on function public.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) from public, anon;
grant execute on function public.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) to authenticated;

-- Cierra el RPC anterior: sin revisión nunca puede garantizar que no sobrescribe.
-- La ruta HTTP se conserva, y pide recargar a clientes antiguos antes de guardar.
create or replace function public.save_nutrition_target(target uuid, target_inputs jsonb, target_result jsonb, publish boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode='22023', message='nutrition_target_revision_required';
end; $$;
revoke all on function public.save_nutrition_target(uuid,jsonb,jsonb,boolean) from public, anon, authenticated;

commit;
