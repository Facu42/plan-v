-- PV-18: catálogo profesional. Ingredientes como líneas JSON. Paciente sólo ve publicadas de su nutricionista.
create table public.recipes (
  id uuid primary key,
  nutritionist_id uuid not null references public.nutritionists(id),
  title text not null,
  ingredients jsonb not null,
  steps jsonb not null,
  explanation text not null,
  servings numeric not null,
  nutrient_source text not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  published_at timestamptz
);
create index recipes_owner_updated on public.recipes(nutritionist_id, updated_at desc);
alter table public.recipes enable row level security;
create function public.recipe_can_read(owner uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (
    owner = public.my_nutritionist_id()
    or (
      public.my_patient_id() is not null
      and public.patient_has_full_access(public.my_patient_id())
      and exists (select 1 from public.patients p where p.id = public.my_patient_id() and p.nutritionist_id = owner)
    )
  );
$$;
create policy recipes_select on public.recipes for select to authenticated using (
  public.recipe_can_read(nutritionist_id) and (published_at is not null or nutritionist_id = public.my_nutritionist_id())
);
revoke all on public.recipes from public, anon, authenticated;
grant select on public.recipes to authenticated;
revoke all on function public.recipe_can_read(uuid) from public, anon;
grant execute on function public.recipe_can_read(uuid) to authenticated;

create function public.recipe_validate(title_value text, ingredients_value jsonb, steps_value jsonb, explanation_value text, servings_value numeric, nutrient_source_value text) returns void
language plpgsql set search_path='' as $$
declare i int; n int;
begin
  if length(btrim(title_value)) not between 2 and 150 or length(btrim(explanation_value)) not between 2 and 800
    or length(btrim(nutrient_source_value)) not between 2 and 200
    or servings_value is null or servings_value < 1 or servings_value > 20 or trunc(servings_value) <> servings_value
    then raise exception using errcode='22023', message='recipe_fields'; end if;
  if jsonb_typeof(ingredients_value) is distinct from 'array' or jsonb_typeof(steps_value) is distinct from 'array' then
    raise exception using errcode='22023', message='recipe_list';
  end if;
  n := jsonb_array_length(ingredients_value);
  if n not between 1 and 20 then raise exception using errcode='22023', message='recipe_ingredients'; end if;
  for i in 0 .. n - 1 loop
    if jsonb_typeof(ingredients_value->i) is distinct from 'string' or length(btrim(ingredients_value->>i)) not between 1 and 150 then
      raise exception using errcode='22023', message='recipe_ingredients';
    end if;
  end loop;
  n := jsonb_array_length(steps_value);
  if n not between 1 and 12 then raise exception using errcode='22023', message='recipe_steps'; end if;
  for i in 0 .. n - 1 loop
    if jsonb_typeof(steps_value->i) is distinct from 'string' or length(btrim(steps_value->>i)) not between 1 and 400 then
      raise exception using errcode='22023', message='recipe_steps';
    end if;
  end loop;
end; $$;

create function public.save_recipe(recipe_id uuid, title_value text, ingredients_value jsonb, steps_value jsonb, explanation_value text, servings_value numeric, nutrient_source_value text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner uuid := public.my_nutritionist_id(); existing public.recipes; result public.recipes;
begin
  if owner is null then raise exception using errcode='42501', message='recipe_pro_only'; end if;
  perform public.recipe_validate(title_value, ingredients_value, steps_value, explanation_value, servings_value, nutrient_source_value);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(recipe_id::text, 0));
  select * into existing from public.recipes where id = recipe_id;
  if found then
    if existing.nutritionist_id <> owner then raise exception using errcode='42501', message='recipe_owner'; end if;
    if existing.published_at is not null then
      if existing.title is distinct from btrim(title_value) or existing.explanation is distinct from btrim(explanation_value)
        or existing.servings is distinct from servings_value or existing.nutrient_source is distinct from btrim(nutrient_source_value)
        or existing.ingredients is distinct from ingredients_value or existing.steps is distinct from steps_value
        then raise exception using errcode='PT409', message='recipe_published'; end if;
      return to_jsonb(existing);
    end if;
    update public.recipes set title = btrim(title_value), ingredients = ingredients_value, steps = steps_value,
      explanation = btrim(explanation_value), servings = servings_value, nutrient_source = btrim(nutrient_source_value),
      updated_at = clock_timestamp()
      where id = recipe_id returning * into result;
    return to_jsonb(result);
  end if;
  insert into public.recipes(id, nutritionist_id, title, ingredients, steps, explanation, servings, nutrient_source)
    values (recipe_id, owner, btrim(title_value), ingredients_value, steps_value, btrim(explanation_value), servings_value, btrim(nutrient_source_value))
    returning * into result;
  return to_jsonb(result);
end; $$;

create function public.publish_recipe(recipe_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner uuid := public.my_nutritionist_id(); result public.recipes;
begin
  if owner is null then raise exception using errcode='42501', message='recipe_pro_only'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(recipe_id::text, 0));
  select * into result from public.recipes where id = recipe_id and nutritionist_id = owner;
  if not found then raise exception using errcode='PT404', message='recipe_missing'; end if;
  if result.published_at is not null then return to_jsonb(result); end if;
  update public.recipes set published_at = clock_timestamp(), updated_at = clock_timestamp() where id = recipe_id returning * into result;
  return to_jsonb(result);
end; $$;

revoke all on function public.recipe_validate(text,jsonb,jsonb,text,numeric,text), public.save_recipe(uuid,text,jsonb,jsonb,text,numeric,text), public.publish_recipe(uuid) from public, anon;
grant execute on function public.save_recipe(uuid,text,jsonb,jsonb,text,numeric,text), public.publish_recipe(uuid) to authenticated;
