-- Confirmación y objetivo del borrador en una transacción. Copias publicadas intactas.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) rename to save_nutrition_target_before_plan_sync;
revoke all on function private.save_nutrition_target_before_plan_sync(uuid,jsonb,jsonb,boolean,bigint) from public,anon,authenticated;
create function private.save_nutrition_target_versioned(target uuid,target_inputs jsonb,target_result jsonb,publish boolean,expected_revision bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare workspace jsonb; plan public.meal_plans; prior public.meal_plan_versions; next_id uuid; goal jsonb; owner uuid;
begin
 workspace:=private.save_nutrition_target_before_plan_sync(target,target_inputs,target_result,publish,expected_revision);
 if not publish then return workspace; end if;
 owner:=public.my_nutritionist_id();
 -- El guardado anterior ya tomó paciente/3 y validó identidad, pertenencia y revisión.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target::text,1));
 select * into plan from public.meal_plans where patient_id=target and nutritionist_id=owner for update;
 if plan.id is null then return workspace; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(plan.id::text,1));
 select * into prior from public.meal_plan_versions where meal_plan_id=plan.id order by version desc limit 1 for update;
 if prior.id is null then return workspace; end if;
 goal:=jsonb_build_object('kcal',workspace->'published'->'result'->'kcal','protein_g',workspace->'published'->'result'->'protein_g',
  'carbs_g',workspace->'published'->'result'->'carbs_g','fat_g',workspace->'published'->'result'->'fat_g',
  'revision',workspace->'published'->'updated_at','published_at',workspace->'published'->'published_at');
 if prior.status='draft' then
  update public.meal_plan_versions set nutrition_target=goal,revision=gen_random_uuid() where id=prior.id;
 else
  next_id:=gen_random_uuid();
  insert into public.meal_plan_versions(id,meal_plan_id,version,status,period_start,period_end,nutrition_target,guidance)
   values(next_id,plan.id,prior.version+1,'draft',prior.period_start,prior.period_end,goal,prior.guidance);
  insert into public.meal_plan_items(meal_plan_version_id,for_date,slot,recipe_version_id,free_text,portions,public_note,recipe_proposal,components)
   select next_id,for_date,slot,recipe_version_id,free_text,portions,public_note,recipe_proposal,components
   from public.meal_plan_items where meal_plan_version_id=prior.id;
 end if;
 return workspace;
end $$;
revoke all on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) from public,anon,authenticated;
grant execute on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) to authenticated;
-- El wrapper existente podría tener un enlace resuelto al OID anterior: reemplazar su cuerpo.
create or replace function public.save_nutrition_target_versioned(target uuid,target_inputs jsonb,target_result jsonb,publish boolean,expected_revision bigint)
returns jsonb language sql security invoker set search_path='' as $$
 select private.save_nutrition_target_versioned(target,target_inputs,target_result,publish,expected_revision);
$$;
revoke all on function public.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) from public,anon;
grant execute on function public.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) to authenticated;

-- Un plan nuevo o un cliente sin el campo toma la meta confirmada vigente.
alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_plan_before_target_sync;
revoke all on function public.save_plan_before_target_sync(uuid,jsonb) from public,anon,authenticated;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare confirmed public.nutrition_targets; goal jsonb;
begin
 perform public.intake_assert_access(target_patient,true);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_patient::text,3));
 if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='plan_data'; end if;
 if not(payload ? 'nutrition_target') then
  select * into confirmed from public.nutrition_targets where patient_id=target_patient and published_at is not null;
  if confirmed.patient_id is not null then
   goal:=jsonb_build_object('kcal',confirmed.result->'kcal','protein_g',confirmed.result->'protein_g',
    'carbs_g',confirmed.result->'carbs_g','fat_g',confirmed.result->'fat_g','revision',to_jsonb(confirmed.updated_at),'published_at',to_jsonb(confirmed.published_at));
   payload:=payload||jsonb_build_object('nutrition_target',goal);
  end if;
 end if;
 return public.save_plan_before_target_sync(target_patient,payload);
end $$;
revoke all on function public.save_meal_plan_draft(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;
commit;
