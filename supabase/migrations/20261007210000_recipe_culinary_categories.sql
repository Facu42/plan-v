-- Categorías culinarias opcionales por versión; no reclasifica recetas existentes.
-- Producción requiere aprobación escrita. Recuperación: conservar los JSON de categorías.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create or replace function public.recipe_validate_card(value jsonb)
returns void language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(value) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if exists (
    select 1 from jsonb_object_keys(value) key
    where key not in ('category','prep_minutes','macro_status','macros','cover_status','cover_alt','cover_url','culinary_categories')
  ) then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if value ? 'culinary_categories' then
    if jsonb_typeof(value->'culinary_categories') is distinct from 'array' then
      raise exception using errcode='22023',message='recipe_categories';
    end if;
    if jsonb_array_length(value->'culinary_categories')>6 or exists(
      select 1 from jsonb_array_elements(value->'culinary_categories') entry
      where jsonb_typeof(entry) is distinct from 'string' or length(btrim(entry#>>'{}')) not between 1 and 50
    ) then raise exception using errcode='22023',message='recipe_categories'; end if;
    if (select count(*) from jsonb_array_elements(value->'culinary_categories'))<>(
      select count(distinct translate(lower(regexp_replace(btrim(entry#>>'{}'),'\s+',' ','g')),'áéíóúüñ','aeiouun'))
      from jsonb_array_elements(value->'culinary_categories') entry
    ) then raise exception using errcode='22023',message='recipe_categories'; end if;
  end if;
  if coalesce(value->>'category', '') not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')
    or coalesce(value->>'macro_status', '') not in ('declared','unavailable','failed') then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if value->'prep_minutes' is not null and value->'prep_minutes' <> 'null'::jsonb and (
    jsonb_typeof(value->'prep_minutes') is distinct from 'number'
    or (value->>'prep_minutes')::numeric <= 0
    or (value->>'prep_minutes')::numeric > 240
  ) then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  if value->'macros' is null or value->'macros' = 'null'::jsonb then
    if value->>'macro_status' = 'declared' then
      raise exception using errcode = '22023', message = 'recipe_card';
    end if;
    return;
  end if;
  if jsonb_typeof(value->'macros') is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_card';
  end if;
  foreach k in array array['kcal','protein_g','carbs_g','fat_g'] loop
    if value->'macros'->k is not null and value->'macros'->k <> 'null'::jsonb and (
      jsonb_typeof(value->'macros'->k) is distinct from 'number'
      or (value->'macros'->>k)::numeric < 0
      or (value->'macros'->>k)::numeric > 20000
    ) then
      raise exception using errcode = '22023', message = 'recipe_card';
    end if;
  end loop;
end; $$;
revoke all on function public.recipe_validate_card(jsonb) from public,anon,authenticated;
commit;
