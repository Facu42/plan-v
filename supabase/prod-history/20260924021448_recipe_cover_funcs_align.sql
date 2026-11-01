-- Archivo histórico: migración 20260924021448_recipe_cover_funcs_align aplicada en producción (plan-v-app) vía MCP y nunca commiteada.
-- NO es parte de la cadena de supabase/migrations: su efecto ya está cubierto por migraciones posteriores del repo.
-- No re-aplicar. Ver docs/migraciones-prod-vs-main.md.

create or replace function public.set_recipe_cover(target_version uuid, cover_status text, cover_url text, cover_alt text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  owner_nid uuid;
  clean_url text;
begin
  nid := public.recipe_assert_nutri();
  select r.nutritionist_id into owner_nid
  from public.recipe_versions v
  join public.recipes r on r.id = v.recipe_id
  where v.id = target_version;
  if owner_nid is null or owner_nid is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  if cover_status not in ('none', 'failed', 'ready') then
    raise exception using errcode = '22023', message = 'recipe_cover_status';
  end if;
  clean_url := nullif(btrim(coalesce(cover_url, '')), '');
  if cover_status = 'ready' and clean_url is null then
    raise exception using errcode = '22023', message = 'recipe_cover_url';
  end if;
  if cover_status <> 'ready' and clean_url is not null then
    raise exception using errcode = '22023', message = 'recipe_cover_url';
  end if;
  insert into public.recipe_covers (recipe_version_id, status, url, alt, updated_at)
  values (target_version, cover_status, clean_url, coalesce(cover_alt, ''), clock_timestamp())
  on conflict (recipe_version_id) do update
    set status = excluded.status, url = excluded.url, alt = excluded.alt, updated_at = excluded.updated_at;
  return jsonb_build_object(
    'recipe_version_id', target_version,
    'cover_status', cover_status,
    'cover_url', clean_url,
    'cover_alt', coalesce(cover_alt, '')
  );
end;
$$;

revoke all on function public.set_recipe_cover(uuid, text, text, text) from public, anon;
grant execute on function public.set_recipe_cover(uuid, text, text, text) to authenticated;

create or replace function public.recipe_version_json(vid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', v.id,
    'version', v.version,
    'yield_portions', v.yield_portions,
    'steps', v.steps,
    'nutrient_source', v.nutrient_source,
    'published_at', v.published_at,
    'cover_status', coalesce(c.status, 'none'),
    'cover_url', c.url,
    'cover_alt', coalesce(c.alt, ''),
    'ingredients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'name', i.name,
        'quantity', ri.quantity,
        'unit', ri.unit
      ) order by i.name_normalized)
      from public.recipe_ingredients ri
      join public.ingredients i on i.id = ri.ingredient_id
      where ri.recipe_version_id = v.id
    ), '[]'::jsonb)
  )
  from public.recipe_versions v
  left join public.recipe_covers c on c.recipe_version_id = v.id
  where v.id = vid;
$$;

create or replace function public.list_assigned_recipes(target uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.intake_assert_access(target);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id,
      'title', r.title,
      'version', v.version,
      'yield_portions', v.yield_portions,
      'steps', v.steps,
      'nutrient_source', v.nutrient_source,
      'ingredients', public.recipe_version_json(v.id)->'ingredients',
      'cover_status', coalesce(c.status, 'none'),
      'cover_url', c.url,
      'cover_alt', coalesce(c.alt, ''),
      'assigned_at', a.assigned_at,
      'published_at', v.published_at
    ) order by a.assigned_at desc)
    from public.recipe_assignments a
    join public.recipes r on r.id = a.recipe_id
    join public.recipe_versions v on v.id = a.recipe_version_id
    left join public.recipe_covers c on c.recipe_version_id = v.id
    where a.patient_id = target and v.published_at is not null
  ), '[]'::jsonb);
end; $$;
