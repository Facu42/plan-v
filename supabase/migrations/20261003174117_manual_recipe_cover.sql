-- Subida manual al bucket existente; no crea servicios, tablas ni recursos.
-- Comparación bajo el mismo bloqueo que edición/publicación de recetas.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

create function private.save_manual_recipe_cover(target_recipe uuid, expected_version int,
  expected_cover_url text, cover_url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare nid uuid; vid uuid; version_number int; previous_url text; title text; result jsonb;
begin
  nid := public.recipe_assert_nutri();
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_recipe::text, 0));
  select r.title into title from public.recipes r
    where r.id=target_recipe and r.nutritionist_id=nid and r.status <> 'archived';
  if not found then raise exception using errcode='42501',message='recipe_forbidden'; end if;
  select v.id,v.version into vid,version_number from public.recipe_versions v
    where v.recipe_id=target_recipe and v.published_at is not null
    order by v.version desc limit 1 for update;
  if vid is null or expected_version is null or version_number is distinct from expected_version then
    raise exception using errcode='PT409',message='recipe_cover_version_changed';
  end if;
  select c.url into previous_url from public.recipe_covers c where c.recipe_version_id=vid;
  if previous_url is distinct from expected_cover_url then
    raise exception using errcode='PT409',message='recipe_cover_changed';
  end if;
  result := public.set_recipe_cover(vid,'ready',cover_url,title);
  -- La finalización IA toma FOR UPDATE sobre la misma versión. Un resultado
  -- pendiente no puede sobrescribir la foto elegida por la profesional.
  update public.recipe_cover_requests set token=gen_random_uuid(),finished_at=clock_timestamp()
    where recipe_version_id=vid;
  return result;
end; $$;
revoke all on function private.save_manual_recipe_cover(uuid,int,text,text) from public,anon;
grant execute on function private.save_manual_recipe_cover(uuid,int,text,text) to authenticated;

create function public.save_manual_recipe_cover(target_recipe uuid, expected_version int,
  expected_cover_url text, cover_url text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.save_manual_recipe_cover(target_recipe,expected_version,expected_cover_url,cover_url);
$$;
revoke all on function public.save_manual_recipe_cover(uuid,int,text,text) from public,anon;
grant execute on function public.save_manual_recipe_cover(uuid,int,text,text) to authenticated;
commit;
