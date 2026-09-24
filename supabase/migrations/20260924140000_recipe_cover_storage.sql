-- PV-44: published recipe covers live in a controlled public Storage bucket.
-- Covers contain only the approved dish title and ingredients, never patient data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-covers', 'recipe-covers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy recipe_covers_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'recipe-covers'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp)$'
  and exists (
    select 1 from public.recipe_versions v
    join public.recipes r on r.id = v.recipe_id
    where v.id::text = split_part(name, '/', 2)
      and r.nutritionist_id = public.my_nutritionist_id()
      and r.nutritionist_id::text = split_part(name, '/', 1)
      and v.published_at is not null
  )
);

create policy recipe_covers_storage_owner_select on storage.objects for select to authenticated
using (
  bucket_id = 'recipe-covers'
  and exists (
    select 1 from public.recipe_versions v
    join public.recipes r on r.id = v.recipe_id
    where v.id::text = split_part(name, '/', 2)
      and r.nutritionist_id = public.my_nutritionist_id()
      and r.nutritionist_id::text = split_part(name, '/', 1)
  )
);

create or replace function public.set_recipe_cover(target_version uuid, cover_status text, cover_url text, cover_alt text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  owner_nid uuid;
  clean_url text;
  object_path text;
begin
  nid := public.recipe_assert_nutri();
  select r.nutritionist_id into owner_nid
  from public.recipe_versions v
  join public.recipes r on r.id = v.recipe_id
  where v.id = target_version and v.published_at is not null;
  if owner_nid is null or owner_nid is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  if cover_status not in ('none', 'failed', 'ready') then
    raise exception using errcode = '22023', message = 'recipe_cover_status';
  end if;
  clean_url := nullif(btrim(coalesce(cover_url, '')), '');
  if (cover_status = 'ready') is distinct from (clean_url is not null) then
    raise exception using errcode = '22023', message = 'recipe_cover_url';
  end if;
  if clean_url is not null then
    if clean_url !~ ('^https://[A-Za-z0-9.-]+/storage/v1/object/public/recipe-covers/' || nid::text || '/' || target_version::text || '/[0-9a-f-]{36}[.](png|jpg|webp)$') then
      raise exception using errcode = '22023', message = 'recipe_cover_url';
    end if;
    object_path := split_part(clean_url, '/storage/v1/object/public/recipe-covers/', 2);
    if not exists (select 1 from storage.objects where bucket_id = 'recipe-covers' and name = object_path) then
      raise exception using errcode = '22023', message = 'recipe_cover_object_missing';
    end if;
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
