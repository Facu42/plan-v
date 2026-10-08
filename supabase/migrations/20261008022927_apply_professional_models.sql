-- Aplicación explícita de una copia publicada. Conserva todas las versiones
-- anteriores y mantiene vigente el publicado del paciente. Sólo pruebas locales.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create function public.apply_professional_model(model_id uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); model public.professional_models;
 patient uuid:=(payload->>'patient_id')::uuid; start_date date:=(payload->>'period_start')::date;
 plan public.meal_plans; previous public.meal_plan_versions; new_id uuid:=gen_random_uuid(); item jsonb; recipe_id uuid;
begin
 if jsonb_typeof(payload) is distinct from 'object' or exists(select 1 from jsonb_object_keys(payload) k where k not in ('patient_id','period_start','expected_revision','expected_version','expected_plan_revision','reviewed'))
 or not(payload ?& array['patient_id','period_start','expected_revision','expected_version','expected_plan_revision','reviewed'])
 or payload->'reviewed' is distinct from 'true'::jsonb or start_date is null or start_date>'9999-12-10'::date then raise exception using errcode='22023',message='model_review'; end if;
 perform public.intake_assert_access(patient,true);
 perform pg_advisory_xact_lock(hashtextextended(patient::text,3));
 perform pg_advisory_xact_lock(hashtextextended(patient::text,1));
 select * into model from public.professional_models where id=model_id for update;
 if not found or model.owner_id<>owner then raise exception using errcode='42501',message='model_owner'; end if;
 if model.archived_at is not null or model.revision is distinct from (payload->>'expected_revision')::uuid or model.published is null or model.kind<>'plan'
 or (model.published->>'version')::int is distinct from (payload->>'expected_version')::int then raise exception using errcode='PT409',message='model_changed'; end if;
 if jsonb_array_length(model.published->'plan'->'items') not between 1 and 42 or (model.published->'plan'->>'days')::int not between 1 and 22 then raise exception using errcode='22023',message='model_incomplete'; end if;
 select * into plan from public.meal_plans where nutritionist_id=owner and patient_id=patient for update;
 if plan.id is not null then
  perform pg_advisory_xact_lock(hashtextextended(plan.id::text,1));
  select * into previous from public.meal_plan_versions where meal_plan_id=plan.id order by version desc limit 1 for update;
 end if;
 if previous.revision is distinct from (payload->>'expected_plan_revision')::uuid then raise exception using errcode='PT409',message='plan_changed'; end if;
 if plan.id is null then insert into public.meal_plans(id,patient_id,nutritionist_id) values(gen_random_uuid(),patient,owner) returning * into plan; end if;
 insert into public.meal_plan_versions(id,meal_plan_id,version,status,period_start,period_end,nutrition_target)
 values(new_id,plan.id,coalesce(previous.version,0)+1,'draft',start_date,start_date+(model.published->'plan'->>'days')::int-1,previous.nutrition_target);
 for item in select value from jsonb_array_elements(model.published->'plan'->'items') loop
  recipe_id:=null;
  if item->>'recipe_id' is not null then
   select v.id into recipe_id from public.recipe_versions v join public.recipes r on r.id=v.recipe_id where r.nutritionist_id=owner and r.id=(item->>'recipe_id')::uuid and v.version=(item->>'recipe_version')::int and v.published_at is not null;
   if recipe_id is null then raise exception using errcode='22023',message='model_recipe'; end if;
  end if;
  insert into public.meal_plan_items(meal_plan_version_id,for_date,slot,recipe_version_id,free_text,portions,public_note,recipe_proposal,components)
  values(new_id,start_date+(item->>'day')::int-1,public.meal_plan_slot_key(item->>'slot')::public.meal_slot_kind,recipe_id,
   case when recipe_id is not null then null when item ? 'components' then 'Comida compuesta' else item->>'free_text' end,
   (item->>'portions')::numeric,coalesce(item->>'public_note',''),item->'recipe_proposal',item->'components');
 end loop;
 if previous.status='draft' then update public.meal_plan_versions set status='archived' where id=previous.id; end if;
 return public.meal_plan_professional_json(plan.id);
end $$;

create function public.list_meal_plan_history(target_patient uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb;
begin
 perform public.intake_assert_access(target_patient,true);
 select coalesce(jsonb_agg(public.meal_plan_version_json(v.id) order by v.version desc),'[]'::jsonb) into result
 from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id where p.patient_id=target_patient and p.nutritionist_id=owner;
 return result;
end $$;
revoke all on function public.apply_professional_model(uuid,jsonb),public.list_meal_plan_history(uuid) from public,anon,authenticated;
grant execute on function public.apply_professional_model(uuid,jsonb),public.list_meal_plan_history(uuid) to authenticated;
commit;
