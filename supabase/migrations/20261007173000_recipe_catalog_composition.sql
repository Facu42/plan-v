-- Composición congelada por versión. Sin importar bases ni tocar versiones publicadas.
-- Producción requiere autorización. Recuperación: conservar columnas y volver al
-- cliente anterior; las recetas sin referencias siguen usando el contrato previo.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';
alter table public.recipe_versions add column catalog_recipe jsonb;
alter table public.recipe_versions add column final_weight_g numeric check (final_weight_g > 0 and final_weight_g <= 100000);
alter table public.recipe_versions add column cooking_minutes integer check (cooking_minutes between 0 and 1440);

-- La procedencia de IA sobrevive también a un análisis incompleto. No conservar
-- cifras anteriores si falta composición de los ingredientes nuevos.
create function public.recipe_catalog_nutrition_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare ai_source text;
begin
  if tg_op='UPDATE' then
    ai_source:=coalesce(old.catalog_recipe->>'estimate_source',case when old.nutrition->>'origin'='ai_estimate' then old.nutrition->>'source' end,
      case when old.nutrient_source ~ '^(estimacion_ia|propuesta_ia)\.' then old.nutrient_source end);
    if ai_source is not null then
      if new.nutrition is null and new.catalog_recipe is null then new.nutrition:=old.nutrition; end if;
      if new.nutrition is not null then new.nutrition:=jsonb_set(jsonb_set(new.nutrition,'{origin}','"ai_estimate"'),'{source}',to_jsonb(ai_source)); end if;
      if new.catalog_recipe is not null then new.catalog_recipe:=new.catalog_recipe||jsonb_build_object('estimate_origin',true,'estimate_source',ai_source); end if;
      new.nutrient_source:=ai_source;
    end if;
  end if;
  if new.nutrition is not null then perform public.validate_recipe_nutrition(new.nutrition); end if;
  return new;
end; $$;
revoke all on function public.recipe_catalog_nutrition_guard() from public,anon,authenticated;
drop trigger recipe_nutrition_guard on public.recipe_versions;
create trigger recipe_nutrition_guard before insert or update on public.recipe_versions for each row execute function public.recipe_catalog_nutrition_guard();

alter function public.recipe_version_json(uuid) rename to recipe_version_json_pre_catalog;
create function public.recipe_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select public.recipe_version_json_pre_catalog(vid) || jsonb_build_object(
    'catalog_recipe',v.catalog_recipe,'final_weight_g',v.final_weight_g,'cooking_minutes',v.cooking_minutes)
  from public.recipe_versions v where v.id=vid;
$$;
revoke all on function public.recipe_version_json_pre_catalog(uuid),public.recipe_version_json(uuid) from public,anon,authenticated;

alter function public.save_recipe_draft(jsonb) rename to save_recipe_draft_pre_catalog;
create function public.save_recipe_draft(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid; rid uuid; prior public.recipe_versions; live public.food_catalog;
  clean jsonb; item jsonb; ref jsonb; food jsonb; measure jsonb; entry jsonb;
  frozen_lines jsonb := '[]'; clean_items jsonb := '[]'; totals jsonb := '{}'; per_portion jsonb := '{}'; per100 jsonb := '{}';
  snapshot jsonb; result jsonb; card jsonb; macros jsonb; derived_nutrition jsonb; old_snapshot jsonb;
  grams numeric; weight numeric := 0; total numeric; portions numeric; final_weight numeric; cooking integer;
  key text; label text; labels text[] := '{}'; has_catalog boolean := false; unknown_weight boolean := false;
  ai_source text; source text; vid uuid;
begin
  nid:=public.recipe_assert_nutri(); rid:=(payload->>'id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended(rid::text,4));
  perform pg_advisory_xact_lock(hashtextextended(rid::text,0));
  if exists(select 1 from public.recipes r where r.id=rid and r.nutritionist_id<>nid) then raise exception using errcode='42501',message='recipe_owner'; end if;
  select * into prior from public.recipe_versions where recipe_id=rid order by version desc limit 1;
  old_snapshot:=prior.catalog_recipe;
  has_catalog:=old_snapshot is not null;
  if payload ? 'final_weight_g' and payload->'final_weight_g'<>'null'::jsonb then
    if jsonb_typeof(payload->'final_weight_g')<>'number' then raise exception using errcode='22023',message='recipe_weight'; end if;
    final_weight:=(payload->>'final_weight_g')::numeric;
    if final_weight<=0 or final_weight>100000 then raise exception using errcode='22023',message='recipe_weight'; end if;
  end if;
  if payload ? 'cooking_minutes' and payload->'cooking_minutes'<>'null'::jsonb then
    if jsonb_typeof(payload->'cooking_minutes')<>'number' or (payload->>'cooking_minutes')::numeric<>trunc((payload->>'cooking_minutes')::numeric) then raise exception using errcode='22023',message='recipe_cooking'; end if;
    cooking:=(payload->>'cooking_minutes')::integer;
    if cooking<0 or cooking>1440 then raise exception using errcode='22023',message='recipe_cooking'; end if;
  end if;
  clean:=payload-'final_weight_g'-'cooking_minutes';
  if jsonb_typeof(payload->'items') is distinct from 'array' then raise exception using errcode='22023',message='recipe_items'; end if;
  perform public.recipe_validate_draft(jsonb_set(clean-'expected_revision'-'card','{items}',
    coalesce((select jsonb_agg(value-'catalog_ref') from jsonb_array_elements(payload->'items')),'[]'::jsonb)));
  for item in select value from jsonb_array_elements(payload->'items') loop
    label:=public.recipe_normalize_name(item->>'name');
    if label=any(labels) then raise exception using errcode='22023',message='recipe_duplicate'; end if;
    labels:=array_append(labels,label); food:=null; grams:=null;
    if item ? 'catalog_ref' then
      has_catalog:=true; ref:=item->'catalog_ref';
      if jsonb_typeof(ref) is distinct from 'object' or not(ref ?& array['id','revision','measure']) or
        (select count(*) from jsonb_object_keys(ref))<>3 or jsonb_typeof(ref->'id') is distinct from 'string' or
        jsonb_typeof(ref->'revision') is distinct from 'number' or (ref->>'revision')::numeric<>trunc((ref->>'revision')::numeric) or
        (ref->>'revision')::numeric not between 1 and 9007199254740991 or
        (ref->'measure'<>'null'::jsonb and (jsonb_typeof(ref->'measure')<>'string' or length(ref->>'measure') not between 1 and 80)) then
        raise exception using errcode='22023',message='recipe_food_ref';
      end if;
      select value->'food' into food from jsonb_array_elements(coalesce(old_snapshot->'lines','[]'::jsonb))
        where value->'food'->>'id'=ref->>'id' and value->'food'->>'revision'=ref->>'revision' limit 1;
      if food is null then
        select * into live from public.food_catalog where id=(ref->>'id')::uuid and (owner_id is null or owner_id=nid) for share;
        if not found then raise exception using errcode='42501',message='recipe_food_owner'; end if;
        if live.revision<>(ref->>'revision')::bigint then raise exception using errcode='PT409',message='recipe_food_changed'; end if;
        food:=live.payload||jsonb_build_object('id',live.id,'revision',live.revision,'owner_id',live.owner_id,'updated_at',live.updated_at);
      end if;
      grams:=(item->>'quantity')::numeric;
      if ref->'measure'<>'null'::jsonb then
        select value into measure from jsonb_array_elements(food->'portions') where value->>'name'=ref->>'measure';
        if measure is null then raise exception using errcode='22023',message='recipe_measure'; end if;
        grams:=grams*(measure->>'grams')::numeric;
      end if;
      if grams<=0 or grams>100000 then raise exception using errcode='22023',message='recipe_grams'; end if;
      clean_items:=clean_items||jsonb_build_array((item-'catalog_ref')||jsonb_build_object('quantity',grams,'unit','g'));
    else
      if item->>'unit'='g' then grams:=(item->>'quantity')::numeric; end if;
      clean_items:=clean_items||jsonb_build_array(item);
    end if;
    if grams is null then unknown_weight:=true; else weight:=weight+grams; end if;
    frozen_lines:=frozen_lines||jsonb_build_array(item||jsonb_build_object('grams',grams,'food',food));
  end loop;
  clean:=jsonb_set(clean,'{items}',clean_items);
  -- Validates every remaining field, including arbitrary extra item keys.
  perform public.recipe_validate_draft(clean-'expected_revision'-'card');
  if payload ? 'card' then perform public.recipe_validate_card(payload->'card'); end if;
  if has_catalog then
    portions:=(payload->>'yield_portions')::numeric;
    ai_source:=coalesce(old_snapshot->>'estimate_source',case when prior.nutrition->>'origin'='ai_estimate' then prior.nutrition->>'source' end,
      case when payload->'nutrition'->>'origin'='ai_estimate' then payload->'nutrition'->>'source' end,
      case when prior.nutrient_source ~ '^(estimacion_ia|propuesta_ia)\.' then prior.nutrient_source end,
      case when payload->>'nutrient_source' ~ '^(estimacion_ia|propuesta_ia)\.' then payload->>'nutrient_source' end);
    source:=coalesce(ai_source,'catalogo_alimentos.v1');
    foreach key in array array['kcal','protein','carbs','fat','fiber','sodium','calcium','iron','potassium','magnesium','vitamin_c'] loop
      total:=0;
      for entry in select value from jsonb_array_elements(frozen_lines) loop
        if entry->'food'->'nutrients'->>key is null or entry->>'grams' is null then total:=null; exit; end if;
        total:=total+(entry->'food'->'nutrients'->>key)::numeric*(entry->>'grams')::numeric/100;
      end loop;
      totals:=totals||jsonb_build_object(key,round(total,4));
      per_portion:=per_portion||jsonb_build_object(key,round(total/portions,4));
      per100:=per100||jsonb_build_object(key,round(total*100/final_weight,4));
    end loop;
    macros:=jsonb_build_object('kcal',per_portion->'kcal','protein_g',per_portion->'protein','carbs_g',per_portion->'carbs','fat_g',per_portion->'fat');
    if coalesce((macros->>'kcal')::numeric,0)>20000 or coalesce((macros->>'protein_g')::numeric,0)>2000 or coalesce((macros->>'carbs_g')::numeric,0)>2000 or coalesce((macros->>'fat_g')::numeric,0)>2000 then raise exception using errcode='22023',message='recipe_nutrition'; end if;
    if (macros->>'kcal')::numeric>0 and macros->>'protein_g' is not null and macros->>'carbs_g' is not null and macros->>'fat_g' is not null then
      derived_nutrition:=jsonb_build_object('origin',case when ai_source is null then 'declared' else 'ai_estimate' end,'source',source,'per_portion',macros);
    end if;
    card:=coalesce(payload->'card',jsonb_build_object('category','Almuerzo','prep_minutes',null,'cover_status','none','cover_alt',payload->>'title','cover_url',null));
    if exists(select 1 from jsonb_each(macros) where value<>'null'::jsonb) then
      card:=card||jsonb_build_object('macro_status','declared','macros',macros);
    else card:=card||jsonb_build_object('macro_status','unavailable','macros',null); end if;
    clean:=(clean-'nutrition')||jsonb_build_object('nutrient_source',source,'card',card);
    if derived_nutrition is not null then clean:=clean||jsonb_build_object('nutrition',derived_nutrition); end if;
    snapshot:=jsonb_build_object('lines',frozen_lines,'totals',totals,'per_portion',per_portion,'per_100g',case when final_weight is null then null else per100 end,
      'ingredient_weight_g',case when unknown_weight then null else round(weight,4) end,'estimate_origin',ai_source is not null,'estimate_source',ai_source);
  end if;
  result:=public.save_recipe_draft_pre_catalog(clean); vid:=(result->'current'->>'id')::uuid;
  update public.recipe_versions set catalog_recipe=snapshot,final_weight_g=final_weight,cooking_minutes=cooking,
    nutrition=case when has_catalog then derived_nutrition when old_snapshot is not null and not(payload ? 'nutrition') then null else recipe_versions.nutrition end,
    nutrient_source=case when has_catalog then source else recipe_versions.nutrient_source end where id=vid;
  return public.recipe_professional_json(rid);
end; $$;
revoke all on function public.save_recipe_draft_pre_catalog(jsonb) from public,anon,authenticated;
revoke all on function public.save_recipe_draft(jsonb) from public,anon;
grant execute on function public.save_recipe_draft(jsonb) to authenticated;
commit;
