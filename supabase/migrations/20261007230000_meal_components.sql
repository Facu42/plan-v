-- Filas independientes por comida; las copias se resuelven dentro de la base.
-- No aplicar en producción sin autorización. El cliente anterior sigue leyendo
-- los planes existentes; conservar esta columna al volver al cliente anterior.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';
alter table public.meal_plan_items add column components jsonb;

alter function public.meal_plan_item_json(uuid) rename to meal_plan_item_pre_components;
create function public.meal_plan_item_json(iid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select public.meal_plan_item_pre_components(iid)||case when i.components is null then '{}'::jsonb else jsonb_build_object('components',i.components) end
  from public.meal_plan_items i where i.id=iid;
$$;
revoke all on function public.meal_plan_item_pre_components(uuid),public.meal_plan_item_json(uuid) from public,anon,authenticated;

alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_meal_plan_pre_components;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid; prior uuid; vid uuid; item jsonb; part jsonb; prepared jsonb:='[]'; clean_items jsonb:='[]'; clean jsonb; result jsonb;
  parts jsonb; food jsonb; old_part jsonb; snapshot jsonb; live public.food_catalog; recipe_vid uuid; grams numeric; unit_grams numeric; ids text[]; allowed text[];
begin
  nid:=public.recipe_assert_nutri(); perform public.intake_assert_access(target_patient,true);
  perform pg_advisory_xact_lock(hashtextextended(target_patient::text,3));
  perform pg_advisory_xact_lock(hashtextextended(target_patient::text,1));
  if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 42 then raise exception using errcode='22023',message='meal_plan_items'; end if;
  select v.id into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
    where p.id=(payload->>'id')::uuid and p.patient_id=target_patient and p.nutritionist_id=nid order by v.version desc limit 1;
  for item in select value from jsonb_array_elements(payload->'items') loop
    if not(item ? 'components') then clean_items:=clean_items||jsonb_build_array(item); prepared:=prepared||jsonb_build_array(item); continue; end if;
    if jsonb_typeof(item->'components') is distinct from 'array' or jsonb_array_length(item->'components') not between 1 and 12
      or item ?| array['recipe_id','recipe_version','recipe_proposal','free_text','portions'] then raise exception using errcode='22023',message='meal_components'; end if;
    parts:='[]'; ids:='{}';
    for part in select value from jsonb_array_elements(item->'components') loop
      if jsonb_typeof(part) is distinct from 'object' or not(part ?& array['id','kind']) or jsonb_typeof(part->'id') is distinct from 'string'
        or part->>'id'=any(ids) or length(coalesce(part->>'public_note',''))>200 or (part ? 'public_note' and jsonb_typeof(part->'public_note') is distinct from 'string') then raise exception using errcode='22023',message='meal_component'; end if;
      perform (part->>'id')::uuid; ids:=array_append(ids,part->>'id');
      part:=part||jsonb_build_object('public_note',btrim(coalesce(part->>'public_note','')));
      allowed:=array['id','kind','public_note'];
      if part->>'kind'='food' then
        allowed:=allowed||array['food_id','food_revision','quantity','measure'];
        if not(part ?& array['food_id','food_revision','quantity','measure']) or jsonb_typeof(part->'food_id') is distinct from 'string'
          or jsonb_typeof(part->'food_revision') is distinct from 'number' or (part->>'food_revision')::numeric<>trunc((part->>'food_revision')::numeric)
          or (part->>'food_revision')::numeric not between 1 and 9007199254740991 or jsonb_typeof(part->'quantity') is distinct from 'number'
          or (part->>'quantity')::numeric<=0 or (part->>'quantity')::numeric>100000
          or (part->'measure'<>'null'::jsonb and (jsonb_typeof(part->'measure') is distinct from 'string' or length(part->>'measure') not between 1 and 80)) then raise exception using errcode='22023',message='meal_component_food'; end if;
        food:=null;
        select c->'food_snapshot' into food from public.meal_plan_items i cross join lateral jsonb_array_elements(coalesce(i.components,'[]')) c
          where i.meal_plan_version_id=prior and c->>'kind'='food' and c->>'food_id'=part->>'food_id' and c->>'food_revision'=part->>'food_revision' limit 1;
        if food is null then
          select * into live from public.food_catalog where id=(part->>'food_id')::uuid and (owner_id is null or owner_id=nid) for share;
          if not found then raise exception using errcode='42501',message='meal_component_food_owner'; end if;
          if live.revision<>(part->>'food_revision')::bigint then raise exception using errcode='PT409',message='meal_component_food_changed'; end if;
          food:=live.payload||jsonb_build_object('id',live.id,'revision',live.revision,'owner_id',live.owner_id,'updated_at',live.updated_at);
        end if;
        grams:=(part->>'quantity')::numeric;
        if part->'measure'<>'null'::jsonb then
          select (value->>'grams')::numeric into unit_grams from jsonb_array_elements(food->'portions') where value->>'name'=part->>'measure';
          if unit_grams is null then raise exception using errcode='22023',message='meal_component_measure'; end if;
          grams:=grams*unit_grams;
        end if;
        if grams<=0 or grams>100000 then raise exception using errcode='22023',message='meal_component_grams'; end if;
        snapshot:=jsonb_build_object('food_snapshot',food);
      elsif part->>'kind'='recipe' then
        allowed:=allowed||array['recipe_id','recipe_version','portions'];
        if not(part ?& array['recipe_id','recipe_version','portions']) or jsonb_typeof(part->'recipe_id') is distinct from 'string'
          or jsonb_typeof(part->'recipe_version') is distinct from 'number' or (part->>'recipe_version')::numeric<>trunc((part->>'recipe_version')::numeric)
          or (part->>'recipe_version')::numeric<1 or jsonb_typeof(part->'portions') is distinct from 'number' or (part->>'portions')::numeric<=0 or (part->>'portions')::numeric>50 then raise exception using errcode='22023',message='meal_component_recipe'; end if;
        select v.id into recipe_vid from public.recipe_versions v join public.recipes r on r.id=v.recipe_id
          where r.id=(part->>'recipe_id')::uuid and r.nutritionist_id=nid and v.version=(part->>'recipe_version')::integer and v.published_at is not null;
        if recipe_vid is null then raise exception using errcode='42501',message='meal_component_recipe_owner'; end if;
        snapshot:=jsonb_build_object('recipe_snapshot',public.recipe_version_json(recipe_vid));
      elsif part->>'kind'='text' then
        allowed:=allowed||array['free_text','recipe_proposal','portions'];
        if jsonb_typeof(part->'free_text') is distinct from 'string' or length(btrim(part->>'free_text')) not between 1 and 150
          or (part ? 'portions' and (jsonb_typeof(part->'portions') is distinct from 'number' or (part->>'portions')::numeric<=0 or (part->>'portions')::numeric>50)) then raise exception using errcode='22023',message='meal_component_text'; end if;
        if part ? 'recipe_proposal' then
          perform public.validate_plan_proposal(part->'recipe_proposal');
          if part->'recipe_proposal'->>'title'<>part->>'free_text' or not(part ? 'portions') then raise exception using errcode='22023',message='meal_component_proposal'; end if;
          select c into old_part from public.meal_plan_items i cross join lateral jsonb_array_elements(coalesce(i.components,'[]')) c
            where i.meal_plan_version_id=prior and c->>'id'=part->>'id' and c->>'kind'='text' limit 1;
          if old_part is null then
            select jsonb_build_object('recipe_proposal',i.recipe_proposal) into old_part from public.meal_plan_items i where i.meal_plan_version_id=prior and i.recipe_proposal->>'title'=part->'recipe_proposal'->>'title' limit 1;
          end if;
          part:=jsonb_set(part,'{recipe_proposal}',public.retain_plan_proposal_estimate(part->'recipe_proposal',old_part->'recipe_proposal'));
        end if;
        snapshot:='{}';
      else raise exception using errcode='22023',message='meal_component_kind'; end if;
      if exists(select 1 from jsonb_object_keys(part) k where not(k=any(allowed))) then raise exception using errcode='22023',message='meal_component_keys'; end if;
      parts:=parts||jsonb_build_array(part||snapshot);
    end loop;
    prepared:=prepared||jsonb_build_array(jsonb_set(item,'{components}',parts));
    clean_items:=clean_items||jsonb_build_array((item-'components')||jsonb_build_object('free_text','Comida compuesta'));
  end loop;
  clean:=jsonb_set(payload,'{items}',clean_items);
  result:=public.save_meal_plan_pre_components(target_patient,clean);
  vid:=(result->'current'->>'id')::uuid;
  for item in select value from jsonb_array_elements(prepared) loop
    update public.meal_plan_items set components=item->'components' where meal_plan_version_id=vid and for_date=(item->>'for_date')::date and slot=public.meal_plan_slot_key(item->>'slot');
  end loop;
  return public.meal_plan_professional_json((payload->>'id')::uuid);
end; $$;
revoke all on function public.save_meal_plan_pre_components(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.save_meal_plan_draft(uuid,jsonb) from public,anon;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

alter function public.meal_plan_version_haystack(uuid) rename to meal_plan_haystack_pre_components;
create function public.meal_plan_version_haystack(target_version uuid) returns text language sql stable security definer set search_path='' as $$
  select public.meal_plan_haystack_pre_components(target_version)||' '||coalesce((select string_agg(
    coalesce(c->'food_snapshot'->>'name','')||' '||coalesce(c->'recipe_snapshot'->>'title','')||' '||coalesce((c->'recipe_snapshot'->'ingredients')::text,'')||' '||
    coalesce((c->'recipe_snapshot'->'steps')::text,'')||' '||coalesce(c->>'free_text','')||' '||coalesce((c->'recipe_proposal')::text,'')||' '||coalesce(c->>'public_note',''),' ')
    from public.meal_plan_items i cross join lateral jsonb_array_elements(coalesce(i.components,'[]')) c where i.meal_plan_version_id=target_version),'');
$$;
revoke all on function public.meal_plan_haystack_pre_components(uuid),public.meal_plan_version_haystack(uuid) from public,anon,authenticated;
-- La lista de compras usa las cantidades de la misma copia publicada.
create or replace function public.shopping_list_json(target_patient uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare vid uuid; ver int; pstart date; pend date; result jsonb;
begin
  select v.id,v.version,v.period_start,v.period_end into vid,ver,pstart,pend from public.meal_plans p join public.meal_plan_versions v on v.meal_plan_id=p.id and v.status='published' where p.patient_id=target_patient limit 1;
  with components as (
    select c from public.meal_plan_items i cross join lateral jsonb_array_elements(i.components) c where i.meal_plan_version_id=vid and i.components is not null
    union all
    select jsonb_build_object('kind','text','free_text',i.free_text,'portions',i.portions,'recipe_snapshot',j->'recipe','recipe_proposal',i.recipe_proposal)
    from public.meal_plan_items i cross join lateral (select public.meal_plan_item_json(i.id) j) x where i.meal_plan_version_id=vid and i.components is null
  ), expanded as (
    select c,coalesce(nullif(c->'recipe_snapshot','null'::jsonb),nullif(c->'recipe_proposal','null'::jsonb)) recipe from components
  ), raw as (
    select 'derived'::text kind,c->'food_snapshot'->>'name' name,
      round((c->>'quantity')::numeric*case when c->'measure'='null'::jsonb then 1 else (select (p->>'grams')::numeric from jsonb_array_elements(c->'food_snapshot'->'portions') p where p->>'name'=c->>'measure') end,2) quantity,'g'::text unit
    from expanded where c->>'kind'='food'
    union all
    select 'derived',ingredient->>'name',round((ingredient->>'quantity')::numeric*coalesce((c->>'portions')::numeric,1)/(recipe->>'yield_portions')::numeric,2),ingredient->>'unit'
    from expanded cross join lateral jsonb_array_elements(recipe->'ingredients') ingredient where recipe is not null
    union all
    select 'text',c->>'free_text',null::numeric,null::text from expanded where recipe is null and c->>'kind'<>'food' and length(btrim(c->>'free_text'))>0
  ), grouped as (
    select kind,kind||':'||public.recipe_normalize_name(min(name))||case when kind='derived' then '|'||unit else '' end source_key,min(name) name,
      case when kind='derived' then round(sum(quantity),2) end quantity,unit,count(*)::int occurrences
    from raw group by kind,public.recipe_normalize_name(name),unit
    union all select 'manual','manual:'||m.id::text,m.name,m.quantity,m.unit,1 from public.shopping_manual_items m where m.patient_id=target_patient
  ) select coalesce(jsonb_agg(jsonb_build_object('id',case when kind='manual' then split_part(source_key,':',2) else source_key end,'kind',kind,'source_key',source_key,'name',name,'quantity',quantity,'unit',unit,'occurrences',occurrences,
    'checked',exists(select 1 from public.shopping_checks s where s.patient_id=target_patient and s.source_key=g.source_key and s.checked)) order by name,coalesce(unit,'')),'[]') into result from grouped g;
  return jsonb_build_object('plan_version',ver,'period_start',pstart,'period_end',pend,'items',result);
end; $$;
revoke all on function public.shopping_list_json(uuid) from public,anon,authenticated;

alter function public.enqueue_menu_dish_covers(uuid,boolean) rename to enqueue_menu_covers_pre_components;
create function public.enqueue_menu_dish_covers(target_version uuid,retry_failed boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare nid uuid; part jsonb; recipe jsonb; recipe_vid uuid; context jsonb;
begin
  perform public.enqueue_menu_covers_pre_components(target_version,retry_failed);
  select p.nutritionist_id into nid from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id where v.id=target_version and v.status='published';
  if nid is null then return; end if;
  for part in select c from public.meal_plan_items i cross join lateral jsonb_array_elements(coalesce(i.components,'[]')) c where i.meal_plan_version_id=target_version loop
    recipe_vid:=null; recipe:=null;
    if part->>'kind'='recipe' then
      select v.id into recipe_vid from public.recipe_versions v join public.recipes r on r.id=v.recipe_id where r.nutritionist_id=nid and r.id=(part->>'recipe_id')::uuid and v.version=(part->>'recipe_version')::int and v.published_at is not null;
      recipe:=part->'recipe_snapshot';
    elsif part->>'kind'='text' then recipe:=part->'recipe_proposal'; end if;
    if recipe is null then continue; end if;
    context:=public.menu_dish_context(recipe);
    insert into public.menu_dish_covers(nutritionist_id,dish_key,recipe_version_id,context,status,url,alt)
      values(nid,public.menu_dish_key(recipe_vid,context),recipe_vid,context,'queued',null,recipe->>'title')
      on conflict(nutritionist_id,dish_key) do update set status='queued',attempts=0,run_after=clock_timestamp(),run_token=null,lease_until=null where retry_failed and menu_dish_covers.status='failed';
  end loop;
end; $$;
revoke all on function public.enqueue_menu_covers_pre_components(uuid,boolean),public.enqueue_menu_dish_covers(uuid,boolean) from public,anon,authenticated;
commit;
