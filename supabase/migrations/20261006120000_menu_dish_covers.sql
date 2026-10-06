-- Preparar y probar en descartable. La aplicación en producción requiere OK escrito.
-- Cola durable de fotos: sólo platos de planes publicados; sin datos del paciente.
create table public.menu_dish_covers (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  dish_key text not null,
  recipe_version_id uuid references public.recipe_versions(id) on delete cascade,
  context jsonb not null,
  status text not null default 'queued' check (status in ('queued','leased','ready','failed')),
  attempts int not null default 0 check (attempts >= 0),
  run_token uuid,
  lease_until timestamptz,
  run_after timestamptz not null default clock_timestamp(),
  url text,
  alt text not null default '',
  created_at timestamptz not null default clock_timestamp(),
  unique(nutritionist_id,dish_key),
  check ((status='ready') = (url is not null))
);
alter table public.menu_dish_covers enable row level security;
revoke all on public.menu_dish_covers from public,anon,authenticated;
create index menu_dish_covers_pending on public.menu_dish_covers(run_after) where status in ('queued','leased');

create function public.menu_dish_context(recipe jsonb) returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object('title',recipe->>'title','steps',recipe->'steps','ingredients',(
    select jsonb_agg(jsonb_build_object('name',value->>'name','quantity',value->'quantity','unit',value->>'unit') order by ord)
    from jsonb_array_elements(recipe->'ingredients') with ordinality as entries(value,ord)
  ));
$$;
create function public.menu_dish_key(vid uuid,context jsonb) returns text language sql immutable set search_path='' as $$
  select case when vid is null then 'proposal:'||md5(context::text) else 'recipe:'||vid::text end;
$$;
revoke all on function public.menu_dish_context(jsonb),public.menu_dish_key(uuid,jsonb) from public,anon,authenticated;

create function public.enqueue_menu_dish_covers(target_version uuid,retry_failed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare nid uuid; item record; recipe jsonb; context jsonb;
begin
  select p.nutritionist_id into nid from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
    where v.id=target_version and v.status='published';
  if nid is null then return; end if;
  for item in select * from public.meal_plan_items where meal_plan_version_id=target_version loop
    if item.recipe_version_id is not null then
      select public.recipe_version_json(v.id) into recipe from public.recipe_versions v join public.recipes r on r.id=v.recipe_id
        where v.id=item.recipe_version_id and v.published_at is not null and r.nutritionist_id=nid;
    else recipe:=item.recipe_proposal; end if;
    if recipe is null or jsonb_array_length(recipe->'ingredients')=0 then continue; end if;
    context:=public.menu_dish_context(recipe);
    insert into public.menu_dish_covers(nutritionist_id,dish_key,recipe_version_id,context,status,url,alt)
    values(nid,public.menu_dish_key(item.recipe_version_id,context),item.recipe_version_id,context,
      case when recipe->>'cover_status'='ready' then 'ready' else 'queued' end,
      case when recipe->>'cover_status'='ready' then recipe->>'cover_url' else null end,coalesce(recipe->>'cover_alt',''))
    on conflict(nutritionist_id,dish_key) do update set status='queued',attempts=0,run_after=clock_timestamp(),run_token=null,lease_until=null
      where retry_failed and menu_dish_covers.status='failed';
  end loop;
end; $$;
revoke all on function public.enqueue_menu_dish_covers(uuid,boolean) from public,anon,authenticated;
create function public.queue_published_menu_covers() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='published' and old.status is distinct from new.status then perform public.enqueue_menu_dish_covers(new.id); end if;
  return new;
end; $$;
revoke all on function public.queue_published_menu_covers() from public,anon,authenticated;
create trigger queue_published_menu_covers after update of status on public.meal_plan_versions
  for each row execute function public.queue_published_menu_covers();

create function public.retry_menu_dish_covers(target_plan uuid,expected_version int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); vid uuid;
begin
  if not exists(select 1 from public.meal_plans where id=target_plan and nutritionist_id=nid) then
    raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
  select id into vid from public.meal_plan_versions where meal_plan_id=target_plan and version=expected_version and status='published';
  if vid is null then raise exception using errcode='PT409',message='meal_plan_changed'; end if;
  perform public.enqueue_menu_dish_covers(vid,true);
  return public.meal_plan_professional_json(target_plan);
end; $$;
revoke all on function public.retry_menu_dish_covers(uuid,int) from public,anon;
grant execute on function public.retry_menu_dish_covers(uuid,int) to authenticated;

create function public.lease_menu_dish_cover() returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.menu_dish_covers; existing public.recipe_covers; token uuid:=gen_random_uuid();
begin
  update public.menu_dish_covers set status='failed',run_token=null,lease_until=null
    where status='leased' and lease_until<=clock_timestamp() and attempts>=3;
  select * into job from public.menu_dish_covers
    where attempts<3 and run_after<=clock_timestamp() and (status='queued' or (status='leased' and lease_until<=clock_timestamp()))
    order by created_at,id limit 1 for update skip locked;
  if not found then return null; end if;
  if job.recipe_version_id is not null then
    perform 1 from public.recipe_versions where id=job.recipe_version_id for update;
    select * into existing from public.recipe_covers where recipe_version_id=job.recipe_version_id and status='ready';
    if found then
      update public.menu_dish_covers set status='ready',url=existing.url,alt=existing.alt where id=job.id;
      return null;
    end if;
    if exists(select 1 from public.recipe_cover_requests where recipe_version_id=job.recipe_version_id
      and finished_at is null and claimed_at>clock_timestamp()-interval '3 minutes') then return null; end if;
    insert into public.recipe_cover_requests(recipe_version_id,token,claimed_at,finished_at)
      values(job.recipe_version_id,token,clock_timestamp(),null)
      on conflict(recipe_version_id) do update set token=excluded.token,claimed_at=excluded.claimed_at,finished_at=null;
  end if;
  update public.menu_dish_covers set status='leased',attempts=attempts+1,run_token=token,lease_until=clock_timestamp()+interval '3 minutes'
    where id=job.id returning * into job;
  return jsonb_build_object('id',job.id,'nutritionist_id',job.nutritionist_id,'recipe_version_id',job.recipe_version_id,'context',job.context,'run_token',token);
end; $$;

create function public.finish_menu_dish_cover(target_job uuid,expected_token uuid,result_url text,result_alt text,retry_delay_seconds int default 60)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.menu_dish_covers; existing public.recipe_covers; path text; final_status text;
begin
  select * into job from public.menu_dish_covers where id=target_job for update;
  if not found or job.status<>'leased' or job.run_token is distinct from expected_token or job.lease_until<=clock_timestamp() then
    raise exception using errcode='PT409',message='cover_stale'; end if;
  if job.recipe_version_id is not null then
    perform 1 from public.recipe_versions where id=job.recipe_version_id for update;
    select * into existing from public.recipe_covers where recipe_version_id=job.recipe_version_id and status='ready';
    if found then
      update public.menu_dish_covers set status='ready',url=existing.url,alt=existing.alt,run_token=null,lease_until=null where id=job.id;
      return jsonb_build_object('cover_url',existing.url);
    end if;
    if not exists(select 1 from public.recipe_cover_requests where recipe_version_id=job.recipe_version_id and token=expected_token and finished_at is null) then
      raise exception using errcode='PT409',message='cover_stale'; end if;
  end if;
  if result_url is not null then
    if result_url !~ ('^https://[A-Za-z0-9.-]+/storage/v1/object/public/recipe-covers/'||job.nutritionist_id::text||'/'||coalesce(job.recipe_version_id,job.id)::text||'/[0-9a-f-]{36}[.](png|jpg|webp)$') then
      raise exception using errcode='22023',message='cover_url'; end if;
    path:=split_part(result_url,'/storage/v1/object/public/recipe-covers/',2);
    if not exists(select 1 from storage.objects where bucket_id='recipe-covers' and name=path) then
      raise exception using errcode='22023',message='cover_object_missing'; end if;
  end if;
  final_status:=case when result_url is not null then 'ready' when job.attempts>=3 then 'failed' else 'queued' end;
  update public.menu_dish_covers set status=final_status,url=result_url,alt=left(coalesce(result_alt,''),300),run_token=null,lease_until=null,
    run_after=clock_timestamp()+make_interval(secs=>greatest(60,least(86460,coalesce(retry_delay_seconds,60)))) where id=job.id;
  if job.recipe_version_id is not null then
    insert into public.recipe_covers(recipe_version_id,status,url,alt,updated_at)
    values(job.recipe_version_id,case when result_url is null then 'failed' else 'ready' end,result_url,left(coalesce(result_alt,''),300),clock_timestamp())
    on conflict(recipe_version_id) do update set status=excluded.status,url=excluded.url,alt=excluded.alt,updated_at=excluded.updated_at;
    update public.recipe_cover_requests set finished_at=clock_timestamp() where recipe_version_id=job.recipe_version_id and token=expected_token;
  end if;
  return jsonb_build_object('cover_url',result_url,'cover_generation',final_status);
end; $$;
revoke all on function public.lease_menu_dish_cover(),public.finish_menu_dish_cover(uuid,uuid,text,text,int) from public,anon,authenticated;
grant execute on function public.lease_menu_dish_cover(),public.finish_menu_dish_cover(uuid,uuid,text,text,int) to service_role;

-- Photos are mutable presentation, excluded from the reviewed clinical snapshot.
alter function public.meal_plan_item_json(uuid) rename to meal_plan_item_before_covers;
create function public.meal_plan_item_json(iid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select public.meal_plan_item_before_covers(iid)||case when c.id is null then '{}'::jsonb else jsonb_build_object('dish_card',jsonb_build_object(
    'category',public.meal_plan_slot_label(i.slot),'prep_minutes',null,'macro_status','unavailable','macros',null,
    'cover_status',case when c.status='ready' then 'ready' when c.status='failed' then 'failed' else 'none' end,
    'cover_url',c.url,'cover_alt',c.alt,'cover_generation',c.status)) end
  from public.meal_plan_items i join public.meal_plan_versions v on v.id=i.meal_plan_version_id join public.meal_plans p on p.id=v.meal_plan_id
  left join public.menu_dish_covers c on c.nutritionist_id=p.nutritionist_id and c.dish_key=public.menu_dish_key(i.recipe_version_id,public.menu_dish_context(i.recipe_proposal))
  where i.id=iid;
$$;
revoke all on function public.meal_plan_item_before_covers(uuid),public.meal_plan_item_json(uuid) from public,anon,authenticated;

create or replace function public.recipe_card_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select k.card||jsonb_build_object('cover_status',coalesce(c.status,'none'),'cover_url',c.url,'cover_alt',coalesce(nullif(c.alt,''),v.title))
    ||case when q.id is null then '{}'::jsonb else jsonb_build_object('cover_generation',case when c.status='ready' then 'ready' else q.status end) end
  from public.recipe_version_cards k join public.recipe_versions v on v.id=k.recipe_version_id join public.recipes r on r.id=v.recipe_id
  left join public.recipe_covers c on c.recipe_version_id=v.id
  left join public.menu_dish_covers q on q.nutritionist_id=r.nutritionist_id and q.recipe_version_id=v.id where v.id=vid;
$$;
revoke all on function public.recipe_card_json(uuid) from public,anon,authenticated;

create or replace function public.publish_reviewed_meal_plan_base(target_plan uuid,expected_version int,expected_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); vid uuid; pid uuid; snapshot jsonb;
begin
  select p.patient_id into pid from public.meal_plans p where p.id=target_plan and p.nutritionist_id=nid;
  if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text,1));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text,1));
  select v.id into vid from public.meal_plan_versions v where v.meal_plan_id=target_plan and v.version=expected_version;
  if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
  snapshot:=public.meal_plan_version_json(vid)-'status'-'published_at';
  snapshot:=jsonb_set(snapshot,'{items}',(select coalesce(jsonb_agg(item-'recipe'-'recipe_title'-'dish_card' order by ord),'[]'::jsonb)
    from jsonb_array_elements(snapshot->'items') with ordinality as entries(item,ord)));
  if snapshot is distinct from expected_snapshot then raise exception using errcode='PT409',message='meal_plan_review_changed'; end if;
  return public.publish_meal_plan(target_plan,expected_version);
end; $$;
revoke all on function public.publish_reviewed_meal_plan_base(uuid,int,jsonb) from public,anon,authenticated;
