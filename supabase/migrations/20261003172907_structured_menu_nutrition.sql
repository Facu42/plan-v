-- Propuestas estructuradas y procedencia nutricional. Aditiva: no modifica
-- recetas, planes ni metas existentes. Las propuestas permanecen privadas
-- hasta publicar la copia revisada con las guardas actuales.
begin;

alter table public.recipe_versions add column nutrition jsonb;
alter table public.meal_plan_items add column recipe_proposal jsonb;
alter table public.meal_plan_versions add column nutrition_target jsonb;

-- Reservation, consent and budget checks remain in the existing function.
-- Version 2 changes the presentation contract, not those checks.
alter function public.enqueue_ai_job(jsonb) rename to enqueue_ai_job_base;
create function public.enqueue_ai_job(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare version text:=payload->>'prompt_version'; kind text:=payload->>'job_type'; result jsonb;
begin
  perform public.recipe_assert_nutri();
  if kind not in ('recipe_draft','menu_draft') or version is null or version not in (kind||'.v1',kind||'.v2') then
    raise exception using errcode='22023',message='ai_job_version';
  end if;
  result := public.enqueue_ai_job_base(jsonb_set(payload,'{prompt_version}',to_jsonb(kind||'.v1')));
  update public.ai_jobs set prompt_version=version where id=(result->>'id')::uuid;
  return public.ai_job_json((result->>'id')::uuid);
end; $$;
revoke all on function public.enqueue_ai_job_base(jsonb) from public,anon,authenticated;
revoke all on function public.enqueue_ai_job(jsonb) from public,anon;
grant execute on function public.enqueue_ai_job(jsonb) to authenticated;

create function public.validate_recipe_nutrition(value jsonb)
returns void language plpgsql immutable set search_path='' as $$
declare key text; amount numeric;
begin
  if jsonb_typeof(value) is distinct from 'object' or not(value ?& array['origin','source','per_portion'])
    or exists(select 1 from jsonb_object_keys(value) k where k not in ('origin','source','per_portion'))
    or coalesce(value->>'origin','') not in ('ai_estimate','declared')
    or jsonb_typeof(value->'source') is distinct from 'string' or char_length(btrim(value->>'source')) not between 1 and 200
    or jsonb_typeof(value->'per_portion') is distinct from 'object'
    or not(value->'per_portion' ?& array['kcal','protein_g','carbs_g','fat_g'])
    or exists(select 1 from jsonb_object_keys(value->'per_portion') k where k not in ('kcal','protein_g','carbs_g','fat_g')) then
    raise exception using errcode='22023',message='recipe_nutrition';
  end if;
  foreach key in array array['kcal','protein_g','carbs_g','fat_g'] loop
    if jsonb_typeof(value->'per_portion'->key) is distinct from 'number' then raise exception using errcode='22023',message='recipe_nutrition'; end if;
    amount := (value->'per_portion'->>key)::numeric;
    if amount < 0 or (key='kcal' and amount=0) or amount > (case when key='kcal' then 20000 else 2000 end) then
      raise exception using errcode='22023',message='recipe_nutrition';
    end if;
  end loop;
end; $$;
revoke all on function public.validate_recipe_nutrition(jsonb) from public,anon,authenticated;

alter function public.recipe_validate_draft(jsonb) rename to recipe_validate_draft_base;
create function public.recipe_validate_draft(payload jsonb)
returns void language plpgsql set search_path='' as $$
begin
  perform public.recipe_validate_draft_base(payload-'nutrition');
  if payload ? 'nutrition' then perform public.validate_recipe_nutrition(payload->'nutrition'); end if;
end; $$;
revoke all on function public.recipe_validate_draft_base(jsonb),public.recipe_validate_draft(jsonb) from public,anon,authenticated;

create function public.validate_plan_proposal(value jsonb)
returns void language plpgsql set search_path='' as $$
begin
  if jsonb_typeof(value) is distinct from 'object'
    or not(value ?& array['title','yield_portions','steps','ingredients','nutrition'])
    or exists(select 1 from jsonb_object_keys(value) k where k not in ('title','yield_portions','steps','ingredients','nutrition')) then
    raise exception using errcode='22023',message='meal_plan_proposal';
  end if;
  perform public.recipe_validate_draft_base(jsonb_build_object('id','00000000-0000-4000-a000-000000000001',
    'title',value->'title','yield_portions',value->'yield_portions','steps',value->'steps','items',value->'ingredients'));
  if value->'nutrition' <> 'null'::jsonb then perform public.validate_recipe_nutrition(value->'nutrition'); end if;
end; $$;
revoke all on function public.validate_plan_proposal(jsonb) from public,anon,authenticated;

-- Inline recipes are proposals with estimated nutrients. Declared recipes use
-- recipe_versions. Preserve the prior source even when the client relabels it.
create function public.retain_plan_proposal_estimate(value jsonb,prior jsonb default null)
returns jsonb language plpgsql immutable set search_path='' as $$
declare nutrition jsonb; old_nutrition jsonb; source jsonb;
begin
  if prior->'nutrition'->>'origin'='ai_estimate' then old_nutrition:=prior->'nutrition'; end if;
  nutrition:=nullif(value->'nutrition','null'::jsonb);
  if nutrition is null then return value; end if;
  source:=coalesce(old_nutrition->'source',case when nutrition->>'origin'='ai_estimate' then nutrition->'source' else '"estimacion_ia.v2"'::jsonb end);
  return jsonb_set(value,'{nutrition}',jsonb_set(jsonb_set(nutrition,'{origin}','"ai_estimate"'),'{source}',source));
end; $$;
revoke all on function public.retain_plan_proposal_estimate(jsonb,jsonb) from public,anon,authenticated;

create function public.validate_menu_target(value jsonb)
returns void language plpgsql set search_path='' as $$
begin
  if jsonb_typeof(value) is distinct from 'object' or not(value ?& array['kcal','protein_g','carbs_g','fat_g','revision','published_at'])
    or exists(select 1 from jsonb_object_keys(value) k where k not in ('kcal','protein_g','carbs_g','fat_g','revision','published_at'))
    or jsonb_typeof(value->'published_at') is distinct from 'string' or char_length(value->>'published_at') not between 1 and 64
    or jsonb_typeof(value->'revision') not in ('number','string') then
    raise exception using errcode='22023',message='meal_plan_target';
  end if;
  perform public.validate_recipe_nutrition(jsonb_build_object('origin','declared','source','meta publicada','per_portion',value-'revision'-'published_at'));
end; $$;
revoke all on function public.validate_menu_target(jsonb) from public,anon,authenticated;

alter function public.meal_plan_validate_draft(jsonb) rename to meal_plan_validate_draft_base;
create function public.meal_plan_validate_draft(payload jsonb)
returns void language plpgsql set search_path='' as $$
declare clean jsonb; item jsonb;
begin
  if octet_length(payload::text)>262144 then raise exception using errcode='22023',message='meal_plan_invalid'; end if;
  clean := payload-'nutrition_target'-'nutrition';
  if jsonb_typeof(payload->'items') is distinct from 'array' then raise exception using errcode='22023',message='meal_plan_items'; end if;
  clean := jsonb_set(clean,'{items}',(select coalesce(jsonb_agg(value-'recipe_proposal'),'[]'::jsonb) from jsonb_array_elements(payload->'items')));
  perform public.meal_plan_validate_draft_base(clean);
  if payload ? 'nutrition_target' then perform public.validate_menu_target(payload->'nutrition_target'); end if;
  for item in select value from jsonb_array_elements(payload->'items') loop
    if item ? 'recipe_proposal' then
      if coalesce(item->>'recipe_id','')<>'' or item->'recipe_proposal'->>'title' is distinct from item->>'free_text' then
        raise exception using errcode='22023',message='meal_plan_proposal';
      end if;
      perform public.validate_plan_proposal(item->'recipe_proposal');
      if jsonb_typeof(item->'portions') is distinct from 'number' or not ((item->>'portions')::numeric > 0 and (item->>'portions')::numeric <= 50) then
        raise exception using errcode='22023',message='meal_plan_portions';
      end if;
    end if;
  end loop;
end; $$;
revoke all on function public.meal_plan_validate_draft_base(jsonb),public.meal_plan_validate_draft(jsonb) from public,anon,authenticated;

-- Keep validation and provenance even for an owner's direct table write.
create function public.structured_nutrition_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='recipe_versions' then
    if tg_op='UPDATE' and old.nutrition->>'origin'='ai_estimate' then
      if new.nutrition is null then new.nutrition := old.nutrition; end if;
      new.nutrition := jsonb_set(jsonb_set(new.nutrition,'{origin}','"ai_estimate"'),'{source}',old.nutrition->'source');
      new.nutrient_source := old.nutrition->>'source';
    end if;
    if new.nutrition is not null then perform public.validate_recipe_nutrition(new.nutrition); end if;
  elsif tg_table_name='meal_plan_items' then
    if new.recipe_proposal is not null then
      perform public.validate_plan_proposal(new.recipe_proposal);
      new.recipe_proposal:=public.retain_plan_proposal_estimate(new.recipe_proposal,case when tg_op='UPDATE' then old.recipe_proposal else null end);
      if new.portions is null or new.portions <= 0 or new.portions > 50 then
        raise exception using errcode='22023',message='meal_plan_portions';
      end if;
      if new.recipe_version_id is not null or new.free_text is distinct from new.recipe_proposal->>'title' then
        raise exception using errcode='22023',message='meal_plan_proposal';
      end if;
    end if;
  elsif tg_table_name='meal_plan_versions' then
    if new.nutrition_target is not null then perform public.validate_menu_target(new.nutrition_target); end if;
    if tg_op='UPDATE' and old.status in ('published','archived') and new.nutrition_target is distinct from old.nutrition_target then
      raise exception using errcode='PT409',message='meal_plan_published_immutable';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.structured_nutrition_guard() from public,anon,authenticated;
create trigger recipe_nutrition_guard before insert or update on public.recipe_versions for each row execute function public.structured_nutrition_guard();
create trigger plan_proposal_guard before insert or update on public.meal_plan_items for each row execute function public.structured_nutrition_guard();
create trigger plan_target_guard before insert or update on public.meal_plan_versions for each row execute function public.structured_nutrition_guard();

alter function public.recipe_version_json(uuid) rename to recipe_version_json_base;
create function public.recipe_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.recipe_version_json_base(vid) || case when v.nutrition is null then '{}'::jsonb else jsonb_build_object('nutrition',v.nutrition) end
  from public.recipe_versions v where v.id=vid;
$$;
revoke all on function public.recipe_version_json_base(uuid),public.recipe_version_json(uuid) from public,anon,authenticated;

alter function public.save_recipe_draft(jsonb) rename to save_recipe_draft_base;
create function public.save_recipe_draft(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); result jsonb; old_nutrition jsonb; chosen_nutrition jsonb; vid uuid; clean jsonb;
begin
  perform public.recipe_validate_draft(payload);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(payload->>'id',4));
  select v.nutrition into old_nutrition from public.recipe_versions v join public.recipes r on r.id=v.recipe_id
    where r.id=(payload->>'id')::uuid and r.nutritionist_id=nid order by v.version desc limit 1;
  chosen_nutrition := coalesce(payload->'nutrition',old_nutrition);
  if old_nutrition->>'origin'='ai_estimate' and chosen_nutrition is not null then
    chosen_nutrition := jsonb_set(jsonb_set(chosen_nutrition,'{origin}','"ai_estimate"'),'{source}',old_nutrition->'source');
  end if;
  clean := payload-'nutrition';
  if chosen_nutrition->>'origin'='ai_estimate' then clean := jsonb_set(clean,'{nutrient_source}',chosen_nutrition->'source'); end if;
  result := public.save_recipe_draft_base(clean);
  vid := (result->'current'->>'id')::uuid;
  update public.recipe_versions set nutrition=chosen_nutrition where id=vid;
  if chosen_nutrition is not null then
    perform public.set_recipe_card(vid,jsonb_build_object('category','Almuerzo','prep_minutes',null,'macro_status','declared','macros',chosen_nutrition->'per_portion'));
  end if;
  return public.recipe_professional_json((payload->>'id')::uuid);
end; $$;
revoke all on function public.save_recipe_draft_base(jsonb) from public,anon,authenticated;
revoke all on function public.save_recipe_draft(jsonb) from public,anon;
grant execute on function public.save_recipe_draft(jsonb) to authenticated;

alter function public.meal_plan_item_json(uuid) rename to meal_plan_item_json_base;
create function public.meal_plan_item_json(iid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.meal_plan_item_json_base(iid) || case when i.recipe_proposal is null then '{}'::jsonb else jsonb_build_object('recipe_proposal',i.recipe_proposal) end
  from public.meal_plan_items i where i.id=iid;
$$;
revoke all on function public.meal_plan_item_json_base(uuid),public.meal_plan_item_json(uuid) from public,anon,authenticated;

alter function public.meal_plan_version_json(uuid) rename to meal_plan_version_json_base;
create function public.meal_plan_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.meal_plan_version_json_base(vid) || case when v.nutrition_target is null then '{}'::jsonb else jsonb_build_object('nutrition_target',v.nutrition_target) end
  from public.meal_plan_versions v where v.id=vid;
$$;
revoke all on function public.meal_plan_version_json_base(uuid),public.meal_plan_version_json(uuid) from public,anon,authenticated;

alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_meal_plan_draft_base;
create function public.assert_current_menu_target(target_patient uuid,proposal jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare current_target jsonb;
begin
  if proposal is null then return; end if;
  select jsonb_build_object('kcal',t.result->'kcal','protein_g',t.result->'protein_g','carbs_g',t.result->'carbs_g','fat_g',t.result->'fat_g',
    'revision',t.updated_at::text,'published_at',t.published_at::text) into current_target
    from public.nutrition_targets t where t.patient_id=target_patient and t.published_at is not null;
  if current_target is null or proposal-'revision'-'published_at' is distinct from current_target-'revision'-'published_at'
    or (proposal->>'revision')::timestamptz is distinct from (current_target->>'revision')::timestamptz
    or (proposal->>'published_at')::timestamptz is distinct from (current_target->>'published_at')::timestamptz then
    raise exception using errcode='PT409',message='ai_job_context_changed';
  end if;
end; $$;
revoke all on function public.assert_current_menu_target(uuid,jsonb) from public,anon,authenticated;

create function public.save_meal_plan_draft(target_patient uuid,payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; clean jsonb; item jsonb; vid uuid; previous uuid; prior jsonb; prepared jsonb:='[]'::jsonb;
begin
  perform public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient,true);
  perform public.meal_plan_validate_draft(payload);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_patient::text,3));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_patient::text,1));
  perform public.assert_current_menu_target(target_patient,payload->'nutrition_target');
  select v.id into previous from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
    where p.id=(payload->>'id')::uuid and p.patient_id=target_patient and p.nutritionist_id=public.recipe_assert_nutri()
    order by v.version desc limit 1;
  for item in select value from jsonb_array_elements(payload->'items') loop
    if item ? 'recipe_proposal' then
      select i.recipe_proposal into prior from public.meal_plan_items i where i.meal_plan_version_id=previous and i.recipe_proposal is not null
        and ((i.for_date=(item->>'for_date')::date and i.slot=public.meal_plan_slot_key(item->>'slot')) or i.recipe_proposal->>'title'=item->'recipe_proposal'->>'title')
        order by (i.for_date=(item->>'for_date')::date and i.slot=public.meal_plan_slot_key(item->>'slot')) desc,i.id limit 1;
      item:=jsonb_set(item,'{recipe_proposal}',public.retain_plan_proposal_estimate(item->'recipe_proposal',prior));
    end if;
    prepared:=prepared||jsonb_build_array(item);
  end loop;
  payload:=jsonb_set(payload,'{items}',prepared);
  clean := payload-'nutrition_target'-'nutrition';
  clean := jsonb_set(clean,'{items}',(select jsonb_agg(value-'recipe_proposal') from jsonb_array_elements(payload->'items')));
  result := public.save_meal_plan_draft_base(target_patient,clean);
  vid := (result->'current'->>'id')::uuid;
  update public.meal_plan_versions set nutrition_target=payload->'nutrition_target' where id=vid;
  for item in select value from jsonb_array_elements(payload->'items') loop
    update public.meal_plan_items set recipe_proposal=item->'recipe_proposal'
      where meal_plan_version_id=vid and for_date=(item->>'for_date')::date and slot=public.meal_plan_slot_key(item->>'slot');
  end loop;
  return public.meal_plan_professional_json((payload->>'id')::uuid);
end; $$;
revoke all on function public.save_meal_plan_draft_base(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.save_meal_plan_draft(uuid,jsonb) from public,anon;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

alter function public.publish_meal_plan(uuid,int) rename to publish_meal_plan_base;
create function public.publish_meal_plan(target_plan uuid,expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); patient uuid; proposal jsonb; state text;
begin
  select p.patient_id into patient from public.meal_plans p where p.id=target_plan and p.nutritionist_id=nid;
  if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(patient::text,3));
  select v.nutrition_target,v.status into proposal,state from public.meal_plan_versions v where v.meal_plan_id=target_plan and v.version=expected_version;
  if state='draft' then perform public.assert_current_menu_target(patient,proposal); end if;
  return public.publish_meal_plan_base(target_plan,expected_version);
end; $$;
revoke all on function public.publish_meal_plan_base(uuid,int) from public,anon,authenticated;
revoke all on function public.publish_meal_plan(uuid,int) from public,anon;
grant execute on function public.publish_meal_plan(uuid,int) to authenticated;

alter function public.publish_reviewed_meal_plan(uuid,int,jsonb) rename to publish_reviewed_meal_plan_base;
create function public.publish_reviewed_meal_plan(target_plan uuid,expected_version int,expected_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); patient uuid;
begin
  select p.patient_id into patient from public.meal_plans p where p.id=target_plan and p.nutritionist_id=nid;
  if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
  -- Same order as saves: target lock before plan/snapshot locks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(patient::text,3));
  return public.publish_reviewed_meal_plan_base(target_plan,expected_version,expected_snapshot);
end; $$;
revoke all on function public.publish_reviewed_meal_plan_base(uuid,int,jsonb) from public,anon,authenticated;
revoke all on function public.publish_reviewed_meal_plan(uuid,int,jsonb) from public,anon;
grant execute on function public.publish_reviewed_meal_plan(uuid,int,jsonb) to authenticated;

-- Include the complete inline recipe in existing allergy/incomplete checks.
alter function public.meal_plan_version_haystack(uuid) rename to meal_plan_version_haystack_base;
create function public.meal_plan_version_haystack(target_version uuid)
returns text language sql stable set search_path='' as $$
  select public.meal_plan_version_haystack_base(target_version)||' '||coalesce((
    select string_agg(coalesce(recipe_proposal->>'title','')||' '||coalesce((recipe_proposal->'ingredients')::text,'')||' '||coalesce((recipe_proposal->'steps')::text,''),' ')
    from public.meal_plan_items where meal_plan_version_id=target_version),'');
$$;
revoke all on function public.meal_plan_version_haystack_base(uuid),public.meal_plan_version_haystack(uuid) from public,anon,authenticated;

-- Target revisions and edits use the same lock. A private edit does not change
-- the confirmed target. Checking here also closes direct-RPC stale application.
alter function public.apply_ai_job(uuid) rename to apply_ai_job_base;
create function public.apply_ai_job(target_job uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); job public.ai_jobs; proposal jsonb; current_target jsonb;
begin
  select * into job from public.ai_jobs where id=target_job for update;
  if not found then raise exception using errcode='PT404',message='ai_job_missing'; end if;
  if job.nutritionist_id is distinct from nid then raise exception using errcode='42501',message='ai_job_forbidden'; end if;
  if job.job_type='menu_draft' and job.applied_at is null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(job.patient_id::text,3));
    select payload->'nutrition_target' into proposal from public.ai_artifacts where ai_job_id=job.id;
    select jsonb_build_object('kcal',t.result->'kcal','protein_g',t.result->'protein_g','carbs_g',t.result->'carbs_g','fat_g',t.result->'fat_g',
      'revision',t.updated_at::text,'published_at',t.published_at::text) into current_target
      from public.nutrition_targets t where t.patient_id=job.patient_id and t.published_at is not null;
    -- JSON timestamp strings vary in formatting between PostgREST and SQL.
    if (proposal is null) is distinct from (current_target is null) or (proposal is not null and (
      proposal-'revision'-'published_at' is distinct from current_target-'revision'-'published_at'
      or (proposal->>'revision')::timestamptz is distinct from (current_target->>'revision')::timestamptz
      or (proposal->>'published_at')::timestamptz is distinct from (current_target->>'published_at')::timestamptz)) then
      raise exception using errcode='PT409',message='ai_job_context_changed';
    end if;
  end if;
  return public.apply_ai_job_base(target_job);
end; $$;
revoke all on function public.apply_ai_job_base(uuid) from public,anon,authenticated;
revoke all on function public.apply_ai_job(uuid) from public,anon;
grant execute on function public.apply_ai_job(uuid) to authenticated;

alter function public.list_published_meal_plan(uuid) rename to list_published_meal_plan_base;
create function public.list_published_meal_plan(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; target jsonb;
begin
  result := public.list_published_meal_plan_base(target_patient);
  if result is null then return null; end if;
  select v.nutrition_target into target from public.meal_plan_versions v where v.meal_plan_id=(result->>'id')::uuid and v.version=(result->>'version')::integer;
  return result || case when target is null then '{}'::jsonb else jsonb_build_object('nutrition_target',target) end;
end; $$;
revoke all on function public.list_published_meal_plan_base(uuid) from public,anon,authenticated;
revoke all on function public.list_published_meal_plan(uuid) from public,anon;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

alter function public.list_assigned_recipes(uuid) rename to list_assigned_recipes_base;
create function public.list_assigned_recipes(target uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  result := public.list_assigned_recipes_base(target);
  return coalesce((select jsonb_agg(item || case when v.nutrition is null then '{}'::jsonb else jsonb_build_object('nutrition',v.nutrition) end order by ord)
    from jsonb_array_elements(result) with ordinality as entries(item,ord)
    join public.recipe_versions v on v.recipe_id=(item->>'id')::uuid and v.version=(item->>'version')::integer),'[]'::jsonb);
end; $$;
revoke all on function public.list_assigned_recipes_base(uuid) from public,anon,authenticated;
revoke all on function public.list_assigned_recipes(uuid) from public,anon;
grant execute on function public.list_assigned_recipes(uuid) to authenticated;

alter function public.assign_recipe(uuid,uuid,int) rename to assign_recipe_base;
create function public.assign_recipe(target_recipe uuid,target_patient uuid,expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; nutrition jsonb;
begin
  result := public.assign_recipe_base(target_recipe,target_patient,expected_version);
  select v.nutrition into nutrition from public.recipe_versions v where v.recipe_id=target_recipe and v.version=expected_version;
  return result || case when nutrition is null then '{}'::jsonb else jsonb_build_object('nutrition',nutrition) end;
end; $$;
revoke all on function public.assign_recipe_base(uuid,uuid,int) from public,anon,authenticated;
revoke all on function public.assign_recipe(uuid,uuid,int) from public,anon;
grant execute on function public.assign_recipe(uuid,uuid,int) to authenticated;

-- New inline recipes contribute their actual quantities to the existing list.
-- Source keys stay stable, so checks and manual additions survive reloading.
create or replace function public.shopping_list_json(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare vid uuid; ver int; pstart date; pend date; result_items jsonb;
begin
  select v.id,v.version,v.period_start,v.period_end into vid,ver,pstart,pend
    from public.meal_plans p join public.meal_plan_versions v on v.meal_plan_id=p.id and v.status='published'
    where p.patient_id=target_patient limit 1;
  with ingredients as (
    select i.name,ri.unit,round((ri.quantity*coalesce(mpi.portions,1)/rv.yield_portions)::numeric,2) as quantity
      from public.meal_plan_items mpi join public.recipe_versions rv on rv.id=mpi.recipe_version_id
      join public.recipe_ingredients ri on ri.recipe_version_id=rv.id join public.ingredients i on i.id=ri.ingredient_id
      where mpi.meal_plan_version_id=vid
    union all
    select ingredient->>'name',ingredient->>'unit',round(((ingredient->>'quantity')::numeric*coalesce(mpi.portions,1)/(mpi.recipe_proposal->>'yield_portions')::numeric),2)
      from public.meal_plan_items mpi cross join lateral jsonb_array_elements(mpi.recipe_proposal->'ingredients') as ingredient
      where mpi.meal_plan_version_id=vid and mpi.recipe_proposal is not null
  ), sources as (
    select 'derived'::text as kind,'derived:'||public.recipe_normalize_name(min(name))||'|'||unit as source_key,
      min(name) as name,round(sum(quantity),2) as quantity,unit,count(*)::int as occurrences
      from ingredients where char_length(btrim(name))>0 group by public.recipe_normalize_name(name),unit
    union all
    select 'text','text:'||public.recipe_normalize_name(min(mpi.free_text)),min(btrim(mpi.free_text)),null::numeric,null::text,count(*)::int
      from public.meal_plan_items mpi where mpi.meal_plan_version_id=vid and mpi.recipe_version_id is null
      and mpi.recipe_proposal is null and char_length(btrim(coalesce(mpi.free_text,'')))>0 group by public.recipe_normalize_name(mpi.free_text)
    union all
    select 'manual','manual:'||m.id::text,m.name,m.quantity,m.unit,1 from public.shopping_manual_items m where m.patient_id=target_patient
  ) select coalesce(jsonb_agg(jsonb_build_object('id',case when s.kind='manual' then split_part(s.source_key,':',2) else s.source_key end,
      'kind',s.kind,'source_key',s.source_key,'name',s.name,'quantity',s.quantity,'unit',s.unit,'occurrences',s.occurrences,
      'checked',exists(select 1 from public.shopping_checks c where c.patient_id=target_patient and c.source_key=s.source_key and c.checked))
      order by s.name,coalesce(s.unit,'')),'[]'::jsonb) into result_items from sources s;
  return jsonb_build_object('plan_version',ver,'period_start',pstart,'period_end',pend,'items',result_items);
end; $$;
revoke all on function public.shopping_list_json(uuid) from public,anon,authenticated;

commit;
