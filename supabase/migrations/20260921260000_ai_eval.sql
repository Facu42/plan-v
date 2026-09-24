-- PV-28: evaluación determinista al publicar/asignar (alergias, faltantes, coherencia).
-- Revalida alergias y restricciones del ingreso; un borrador incompleto o de demo no se publica.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

create or replace function public.normalize_clinical_token(value text)
returns text language sql immutable set search_path='' as $$
  select btrim(regexp_replace(
    lower(translate(coalesce(value, ''),
      'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòù',
      'AEIOUUNaeiouunAEIOUaeiou')),
    '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.clinical_token_aliases(token text)
returns text[] language plpgsql immutable set search_path='' as $$
declare n text := public.normalize_clinical_token(token);
begin
  if n in ('mani','cacahuate','cacahuete','peanut','peanuts') then
    return array['mani','cacahuate','cacahuete','peanut','peanuts'];
  end if;
  if n in ('leche','lacteo','lacteos','lactosa','dairy','yogur','yogurt','queso','manteca','crema') then
    return array['leche','lacteo','lacteos','lactosa','dairy','yogur','yogurt','queso','manteca','crema'];
  end if;
  if n in ('huevo','huevos','egg','eggs','clara') then
    return array['huevo','huevos','egg','eggs','clara'];
  end if;
  if n in ('gluten','trigo','harina','tacc','cebada','centeno') then
    return array['gluten','trigo','harina','tacc','cebada','centeno'];
  end if;
  if n in ('soja','soya','soy') then
    return array['soja','soya','soy'];
  end if;
  if n in ('pescado','merluza','atun','salmon','caballa') then
    return array['pescado','merluza','atun','salmon','caballa'];
  end if;
  if n in ('marisco','mariscos','camaron','langostino','shrimp','gamba') then
    return array['marisco','mariscos','camaron','langostino','shrimp','gamba'];
  end if;
  if n in ('nuez','nueces','walnut','almendra','almendras','castana','avellana','pecan') then
    return array['nuez','nueces','walnut','almendra','almendras','castana','avellana','pecan'];
  end if;
  if n in ('sesamo','ajonjoli','tahini') then
    return array['sesamo','ajonjoli','tahini'];
  end if;
  if n in ('vegetariano') then
    return array['pollo','carne','pescado','cerdo','vaca','vacuno','jamon','salmon','atun','merluza','cordero'];
  end if;
  if n in ('vegano') then
    return array['pollo','carne','pescado','cerdo','huevo','leche','queso','yogur','yogurt','miel','manteca'];
  end if;
  if n = '' then return array[]::text[]; end if;
  return array[n];
end;
$$;

create or replace function public.haystack_contains_allergen(haystack text, allergen text)
returns boolean language plpgsql immutable set search_path='' as $$
declare
  words text[] := string_to_array(btrim(public.normalize_clinical_token(haystack)), ' ');
  pieces text[] := string_to_array(btrim(public.normalize_clinical_token(allergen)), ' ');
  piece text;
  alias text;
begin
  if coalesce(allergen, '') = '' then return false; end if;
  foreach piece in array pieces loop
    if piece is null or char_length(piece) < 3 or piece in ('sin','con','para','una','las','los','del','por','que','the','and','de') then
      continue;
    end if;
    foreach alias in array public.clinical_token_aliases(piece) loop
      if alias is not null and char_length(alias) >= 3 and alias = any(words) then
        return true;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function public.assert_health_publishable(target_patient uuid, haystack text)
returns void language plpgsql security definer set search_path='' as $$
declare
  facts jsonb;
  item text;
  normalized text := public.normalize_clinical_token(haystack);
begin
  select payload into facts from public.intake_sessions where patient_id = target_patient;
  if not found
     or coalesce(facts#>>'{allergies,state}', 'unknown') = 'unknown'
     or coalesce(facts#>>'{restrictions,state}', 'unknown') = 'unknown' then
    raise exception using errcode='PT409', message='meal_plan_allergies_unknown';
  end if;
  if normalized like '%ingrediente a definir%'
     or normalized like '%completar antes de publicar%'
     or normalized like '%indicacion demo%'
     or normalized like '%ejemplo demo%' then
    raise exception using errcode='PT409', message='meal_plan_incomplete';
  end if;
  for item in select jsonb_array_elements_text(coalesce(facts->'allergies'->'items', '[]'::jsonb))
  loop
    if public.haystack_contains_allergen(haystack, item) then
      raise exception using errcode='PT409', message='meal_plan_allergies';
    end if;
  end loop;
  for item in select jsonb_array_elements_text(coalesce(facts->'restrictions'->'items', '[]'::jsonb))
  loop
    if public.haystack_contains_allergen(haystack, item) then
      raise exception using errcode='PT409', message='meal_plan_allergies';
    end if;
  end loop;
end;
$$;

create or replace function public.meal_plan_version_haystack(target_version uuid)
returns text language sql stable set search_path='' as $$
  select coalesce(string_agg(part, ' '), '')
  from (
    select coalesce(i.free_text, '') || ' ' || coalesce(i.public_note, '') as part
    from public.meal_plan_items i
    where i.meal_plan_version_id = target_version
    union all
    select coalesce(r.title, '') || ' ' || coalesce(v.steps::text, '')
    from public.meal_plan_items i
    join public.recipe_versions v on v.id = i.recipe_version_id
    join public.recipes r on r.id = v.recipe_id
    where i.meal_plan_version_id = target_version
    union all
    select coalesce(ing.name, '')
    from public.meal_plan_items i
    join public.recipe_ingredients ri on ri.recipe_version_id = i.recipe_version_id
    join public.ingredients ing on ing.id = ri.ingredient_id
    where i.meal_plan_version_id = target_version
  ) parts;
$$;

create or replace function public.recipe_version_haystack(target_version uuid)
returns text language sql stable set search_path='' as $$
  select coalesce(r.title, '') || ' ' || coalesce(v.steps::text, '') || ' ' || coalesce((
    select string_agg(ing.name, ' ')
    from public.recipe_ingredients ri
    join public.ingredients ing on ing.id = ri.ingredient_id
    where ri.recipe_version_id = v.id
  ), '')
  from public.recipe_versions v
  join public.recipes r on r.id = v.recipe_id
  where v.id = target_version;
$$;

create or replace function public.publish_meal_plan(target_plan uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.meal_plans;
  ver public.meal_plan_versions;
begin
  nid := public.recipe_assert_nutri();
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='meal_plan_version';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  select * into rec from public.meal_plans where id = target_plan;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='meal_plan_forbidden';
  end if;
  perform public.intake_assert_access(rec.patient_id, true);
  select * into ver from public.meal_plan_versions v where v.meal_plan_id = target_plan and v.version = expected_version;
  if not found then
    raise exception using errcode='22023', message='meal_plan_version';
  end if;
  if not exists (select 1 from public.meal_plan_items i where i.meal_plan_version_id = ver.id) then
    raise exception using errcode='22023', message='meal_plan_items';
  end if;
  if ver.status = 'published' then
    return public.meal_plan_professional_json(target_plan);
  end if;
  if ver.status is distinct from 'draft' then
    raise exception using errcode='PT409', message='meal_plan_version_conflict';
  end if;
  perform public.assert_health_publishable(rec.patient_id, public.meal_plan_version_haystack(ver.id));
  update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status = 'published';
  update public.meal_plan_versions
    set status = 'published', published_at = clock_timestamp()
    where id = ver.id;
  return public.meal_plan_professional_json(target_plan);
end;
$$;

create or replace function public.assign_recipe(target_recipe uuid, target_patient uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.recipes;
  ver public.recipe_versions;
begin
  nid := public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient, true);
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  select * into rec from public.recipes where id = target_recipe;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v
    where v.recipe_id = target_recipe and v.version = expected_version;
  if not found or ver.published_at is null then
    raise exception using errcode='22023', message='recipe_not_published';
  end if;
  perform public.assert_health_publishable(target_patient, public.recipe_version_haystack(ver.id));
  insert into public.recipe_assignments(recipe_id, patient_id, nutritionist_id, recipe_version_id)
  values (target_recipe, target_patient, nid, ver.id)
  on conflict (recipe_id, patient_id) do update
    set recipe_version_id = excluded.recipe_version_id, assigned_at = clock_timestamp(), nutritionist_id = excluded.nutritionist_id;
  return jsonb_build_object(
    'id', rec.id,
    'title', rec.title,
    'version', ver.version,
    'yield_portions', ver.yield_portions,
    'steps', ver.steps,
    'nutrient_source', ver.nutrient_source,
    'ingredients', (public.recipe_version_json(ver.id)->'ingredients'),
    'assigned_at', (select a.assigned_at from public.recipe_assignments a where a.recipe_id = rec.id and a.patient_id = target_patient),
    'published_at', ver.published_at
  );
end;
$$;

create or replace function public.publish_recipe(target_recipe uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.recipes;
  ver public.recipe_versions;
  normalized text;
begin
  nid := public.recipe_assert_nutri();
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_recipe::text, 0));
  select * into rec from public.recipes where id = target_recipe;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v where v.recipe_id = target_recipe and v.version = expected_version;
  if not found then
    raise exception using errcode='22023', message='recipe_version';
  end if;
  if not exists (select 1 from public.recipe_ingredients ri where ri.recipe_version_id = ver.id) then
    raise exception using errcode='22023', message='recipe_items';
  end if;
  if jsonb_typeof(ver.steps) is distinct from 'array' or jsonb_array_length(ver.steps) < 1 then
    raise exception using errcode='22023', message='recipe_steps';
  end if;
  normalized := public.normalize_clinical_token(public.recipe_version_haystack(ver.id));
  if normalized like '%ingrediente a definir%'
     or normalized like '%completar antes de publicar%'
     or normalized like '%indicacion demo%'
     or normalized like '%ejemplo demo%' then
    raise exception using errcode='PT409', message='recipe_incomplete';
  end if;
  if ver.published_at is not null then
    return public.recipe_professional_json(target_recipe);
  end if;
  update public.recipe_versions
    set published_at = clock_timestamp(), reviewer_id = auth.uid()
    where id = ver.id;
  update public.recipes set status = 'published' where id = target_recipe;
  return public.recipe_professional_json(target_recipe);
end;
$$;

revoke all on function
  public.normalize_clinical_token(text),
  public.clinical_token_aliases(text),
  public.haystack_contains_allergen(text, text),
  public.assert_health_publishable(uuid, text),
  public.meal_plan_version_haystack(uuid),
  public.recipe_version_haystack(uuid)
from public, anon, authenticated;

grant execute on function
  public.publish_meal_plan(uuid, int),
  public.assign_recipe(uuid, uuid, int),
  public.publish_recipe(uuid, int)
to authenticated;
