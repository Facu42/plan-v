begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter table public.meal_plan_versions add column guidance jsonb;
create function public.guard_plan_guidance() returns trigger language plpgsql set search_path='' as $$
declare category text; line jsonb;
begin
 if tg_op='UPDATE' and old.status in ('published','archived') and new.guidance is distinct from old.guidance then raise exception using errcode='22023',message='guidance_immutable'; end if;
 if new.guidance is null then return new; end if;
 if jsonb_typeof(new.guidance) is distinct from 'object' or not(new.guidance ?& array['recommendations','avoid']) or exists(select 1 from jsonb_object_keys(new.guidance) k where k not in ('recommendations','avoid')) then raise exception using errcode='22023',message='guidance_shape'; end if;
 foreach category in array array['recommendations','avoid'] loop
  if jsonb_typeof(new.guidance->category) is distinct from 'array' or jsonb_array_length(new.guidance->category)>100 then raise exception using errcode='22023',message='guidance_limit'; end if;
  for line in select value from jsonb_array_elements(new.guidance->category) loop
   if jsonb_typeof(line) is distinct from 'string' or length(btrim(line#>>'{}')) not between 1 and 500 then raise exception using errcode='22023',message='guidance_line'; end if;
  end loop;
 end loop;
 return new;
end $$;
revoke all on function public.guard_plan_guidance() from public,anon,authenticated;
create trigger plan_guidance_guard before insert or update on public.meal_plan_versions for each row execute function public.guard_plan_guidance();

alter function public.meal_plan_version_json(uuid) rename to meal_plan_version_pre_guidance;
create function public.meal_plan_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select public.meal_plan_version_pre_guidance(vid)||case when v.guidance is null then '{}'::jsonb else jsonb_build_object('guidance',v.guidance) end from public.meal_plan_versions v where v.id=vid;
$$;
revoke all on function public.meal_plan_version_pre_guidance(uuid),public.meal_plan_version_json(uuid) from public,anon,authenticated;

alter function public.list_published_meal_plan(uuid) rename to published_plan_pre_guidance;
create function public.list_published_meal_plan(target_patient uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; data jsonb;
begin
 result:=public.published_plan_pre_guidance(target_patient); if result is null then return null; end if;
 select v.guidance into data from public.meal_plan_versions v where v.meal_plan_id=(result->>'id')::uuid and v.version=(result->>'version')::int;
 return result||case when data is null then '{}'::jsonb else jsonb_build_object('guidance',data) end;
end $$;
revoke all on function public.published_plan_pre_guidance(uuid),public.list_published_meal_plan(uuid) from public,anon,authenticated;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_plan_pre_guidance;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; prior jsonb;
begin
 perform public.recipe_assert_nutri(); perform public.intake_assert_access(target_patient,true);
 perform pg_advisory_xact_lock(hashtextextended(target_patient::text,3)); perform pg_advisory_xact_lock(hashtextextended(target_patient::text,1));
 select v.guidance into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id where p.patient_id=target_patient order by v.version desc limit 1;
 result:=public.save_plan_pre_guidance(target_patient,payload-'guidance');
 update public.meal_plan_versions set guidance=case when payload ? 'guidance' then payload->'guidance' else prior end where id=(result->'current'->>'id')::uuid;
 return public.meal_plan_professional_json((result->>'id')::uuid);
end $$;
revoke all on function public.save_plan_pre_guidance(uuid,jsonb),public.save_meal_plan_draft(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

alter function public.apply_professional_model(uuid,jsonb) rename to apply_plan_model_pre_guidance;
create function public.apply_professional_model(model_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); patient uuid:=(payload->>'patient_id')::uuid;
 model public.professional_models; plan public.meal_plans; prior public.meal_plan_versions;
 data jsonb; merged jsonb; lines jsonb; line jsonb; category text; result jsonb; new_id uuid:=gen_random_uuid();
begin
 if jsonb_typeof(payload) is distinct from 'object' or not(payload ?& array['patient_id','period_start','expected_revision','expected_version','expected_plan_revision','reviewed']) or payload->'reviewed' is distinct from 'true'::jsonb or exists(select 1 from jsonb_object_keys(payload) k where k not in ('patient_id','period_start','expected_revision','expected_version','expected_plan_revision','reviewed')) then raise exception using errcode='22023',message='model_review'; end if;
 perform public.intake_assert_access(patient,true);
 perform pg_advisory_xact_lock(hashtextextended(patient::text,3)); perform pg_advisory_xact_lock(hashtextextended(patient::text,1));
 select * into model from public.professional_models where id=model_id for update;
 if not found or model.owner_id<>owner then raise exception using errcode='42501',message='model_owner'; end if;
 if model.archived_at is not null or model.revision is distinct from (payload->>'expected_revision')::uuid or model.published is null or (model.published->>'version')::int is distinct from (payload->>'expected_version')::int then raise exception using errcode='PT409',message='model_changed'; end if;
 select * into plan from public.meal_plans where nutritionist_id=owner and patient_id=patient for update;
 if plan.id is not null then
  perform pg_advisory_xact_lock(hashtextextended(plan.id::text,1));
  select * into prior from public.meal_plan_versions where meal_plan_id=plan.id order by version desc limit 1 for update;
 end if;
 if prior.revision is distinct from (payload->>'expected_plan_revision')::uuid then raise exception using errcode='PT409',message='plan_changed'; end if;
 if model.kind='plan' then
  result:=public.apply_plan_model_pre_guidance(model_id,payload);
  update public.meal_plan_versions set guidance=prior.guidance where id=(result->'current'->>'id')::uuid;
  return public.meal_plan_professional_json((result->>'id')::uuid);
 end if;
 if prior.id is null then raise exception using errcode='PT409',message='plan_required'; end if;
 if jsonb_array_length(model.published->'lines') not between 1 and 50 then raise exception using errcode='22023',message='model_lines'; end if;
 category:=model.kind; data:=coalesce(prior.guidance,'{"recommendations":[],"avoid":[]}'::jsonb); lines:=data->category;
 for line in select value from jsonb_array_elements(model.published->'lines') loop
  if not exists(select 1 from jsonb_array_elements(lines) old where lower(regexp_replace(btrim(old#>>'{}'),'\s+',' ','g'))=lower(regexp_replace(btrim(line#>>'{}'),'\s+',' ','g'))) then lines:=lines||jsonb_build_array(line); end if;
 end loop;
 merged:=jsonb_set(data,array[category],lines);
 insert into public.meal_plan_versions(id,meal_plan_id,version,status,period_start,period_end,nutrition_target,guidance) values(new_id,plan.id,prior.version+1,'draft',prior.period_start,prior.period_end,prior.nutrition_target,merged);
 insert into public.meal_plan_items(meal_plan_version_id,for_date,slot,recipe_version_id,free_text,portions,public_note,recipe_proposal,components)
 select new_id,for_date,slot,recipe_version_id,free_text,portions,public_note,recipe_proposal,components from public.meal_plan_items where meal_plan_version_id=prior.id;
 if prior.status='draft' then update public.meal_plan_versions set status='archived' where id=prior.id; end if;
 return public.meal_plan_professional_json(plan.id);
end $$;
revoke all on function public.apply_plan_model_pre_guidance(uuid,jsonb),public.apply_professional_model(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_professional_model(uuid,jsonb) to authenticated;
commit;
