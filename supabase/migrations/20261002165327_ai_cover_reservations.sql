-- One provider attempt per published version, with fenced completion and explicit retry.
create table public.recipe_cover_requests (
  recipe_version_id uuid primary key references public.recipe_versions(id) on delete cascade,
  token uuid not null,
  claimed_at timestamptz not null,
  finished_at timestamptz
);
alter table public.recipe_cover_requests enable row level security;
revoke all on public.recipe_cover_requests from public, anon, authenticated;

create function public.claim_recipe_cover(target_version uuid, retry boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  nid uuid := public.recipe_assert_nutri();
  owner_nid uuid;
  request public.recipe_cover_requests;
  next_token uuid := gen_random_uuid();
begin
  select r.nutritionist_id into owner_nid
  from public.recipe_versions v join public.recipes r on r.id = v.recipe_id
  where v.id = target_version and v.published_at is not null for update of v;
  if owner_nid is null or owner_nid is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  if exists (select 1 from public.recipe_covers where recipe_version_id = target_version and status = 'ready') then
    return null;
  end if;
  select * into request from public.recipe_cover_requests where recipe_version_id = target_version;
  if found then
    if not coalesce(retry, false) then return null; end if;
    if request.finished_at is null and request.claimed_at > clock_timestamp() - interval '3 minutes' then return null; end if;
    if request.finished_at > clock_timestamp() - interval '1 minute' then return null; end if;
  elsif not coalesce(retry, false) and exists (
    select 1 from public.recipe_covers where recipe_version_id = target_version and status = 'failed'
  ) then return null;
  end if;
  insert into public.recipe_cover_requests(recipe_version_id, token, claimed_at, finished_at)
  values (target_version, next_token, clock_timestamp(), null)
  on conflict (recipe_version_id) do update set token = excluded.token, claimed_at = excluded.claimed_at, finished_at = null;
  return next_token;
end; $$;

create function public.finish_recipe_cover(target_version uuid, claim_token uuid, cover_status text, cover_url text, cover_alt text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid := public.recipe_assert_nutri();
  owner_nid uuid;
  request public.recipe_cover_requests;
  result jsonb;
begin
  select r.nutritionist_id into owner_nid
  from public.recipe_versions v join public.recipes r on r.id = v.recipe_id
  where v.id = target_version and v.published_at is not null for update of v;
  if owner_nid is null or owner_nid is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  select * into request from public.recipe_cover_requests where recipe_version_id = target_version;
  if not found or request.token is distinct from claim_token or request.finished_at is not null
    or request.claimed_at <= clock_timestamp() - interval '3 minutes' then
    raise exception using errcode = 'PT409', message = 'recipe_cover_stale';
  end if;
  if cover_status not in ('ready', 'failed') or cover_status is null then
    raise exception using errcode = '22023', message = 'recipe_cover_status';
  end if;
  result := public.set_recipe_cover(target_version, cover_status, cover_url, cover_alt);
  update public.recipe_cover_requests set finished_at = clock_timestamp() where recipe_version_id = target_version;
  return result;
end; $$;

revoke all on function public.claim_recipe_cover(uuid, boolean), public.finish_recipe_cover(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.claim_recipe_cover(uuid, boolean), public.finish_recipe_cover(uuid, uuid, text, text, text) to authenticated;

-- Compare the reviewed content under the same advisory lock used by edits.
create function public.publish_reviewed_meal_plan(target_plan uuid, expected_version int, expected_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid := public.recipe_assert_nutri();
  version_id uuid;
  patient_id uuid;
  snapshot jsonb;
begin
  select p.patient_id into patient_id from public.meal_plans p where p.id = target_plan and p.nutritionist_id = nid;
  if not found then raise exception using errcode = '42501', message = 'meal_plan_forbidden'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(patient_id::text, 1));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  select v.id into version_id from public.meal_plans p join public.meal_plan_versions v on v.meal_plan_id = p.id
  where p.id = target_plan and p.nutritionist_id = nid and v.version = expected_version;
  if not found then raise exception using errcode = '42501', message = 'meal_plan_forbidden'; end if;
  snapshot := public.meal_plan_version_json(version_id) - 'status' - 'published_at';
  snapshot := jsonb_set(snapshot, '{items}', (
    select coalesce(jsonb_agg(item - 'recipe' - 'recipe_title' order by ord), '[]'::jsonb)
    from jsonb_array_elements(snapshot->'items') with ordinality as entries(item, ord)
  ));
  if snapshot is distinct from expected_snapshot then
    raise exception using errcode = 'PT409', message = 'meal_plan_review_changed';
  end if;
  return public.publish_meal_plan(target_plan, expected_version);
end; $$;
revoke all on function public.publish_reviewed_meal_plan(uuid, int, jsonb) from public, anon;
grant execute on function public.publish_reviewed_meal_plan(uuid, int, jsonb) to authenticated;
