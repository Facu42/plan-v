-- Planes 3f: programación por hora y reserva durable de mail. Sin cron.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create table public.meal_plan_delivery_schedules (
 version_id uuid primary key references public.meal_plan_versions(id) on delete cascade,
 scheduled_at timestamptz not null,
 created_at timestamptz not null default clock_timestamp()
);
alter table public.meal_plan_delivery_schedules enable row level security;
revoke all on public.meal_plan_delivery_schedules from public,anon,authenticated;
create or replace function public.promote_due_meal_plan(target_plan uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  today date := (pg_catalog.timezone('America/Argentina/Buenos_Aires', pg_catalog.clock_timestamp()))::date;
  due uuid;
begin
  if target_plan is null then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  select v.id into due
  from public.meal_plan_versions v
  where v.meal_plan_id = target_plan and v.status = 'scheduled' and coalesce((select s.scheduled_at <= pg_catalog.clock_timestamp() from public.meal_plan_delivery_schedules s where s.version_id=v.id), v.period_start <= today)
  for update;
  if due is null then return; end if;
  update public.meal_plan_versions set status = 'archived'
  where meal_plan_id = target_plan and status = 'published';
  update public.meal_plan_versions set status = 'published' where id = due;
end $$;
revoke all on function public.promote_due_meal_plan(uuid) from public, anon, authenticated;

create or replace function public.publish_meal_plan_base(target_plan uuid, expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  rec public.meal_plans;
  ver public.meal_plan_versions;
  today date;
  live_id uuid;
begin
  nid := public.recipe_assert_nutri();
  if expected_version is null or expected_version < 1 then
    raise exception using errcode='22023', message='meal_plan_version';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  perform public.promote_due_meal_plan(target_plan);
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
  if ver.status in ('published', 'scheduled') then
    return public.meal_plan_professional_json(target_plan);
  end if;
  if ver.status is distinct from 'draft' then
    raise exception using errcode='PT409', message='meal_plan_version_conflict';
  end if;
  perform public.assert_health_publishable(rec.patient_id, public.meal_plan_version_haystack(ver.id));
  today := (pg_catalog.timezone('America/Argentina/Buenos_Aires', pg_catalog.clock_timestamp()))::date;
  select v.id into live_id from public.meal_plan_versions v where v.meal_plan_id = target_plan and v.status = 'published';
  if exists (select 1 from public.meal_plan_delivery_schedules s where s.version_id=ver.id) or (live_id is not null and ver.period_start > today) then
    update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status = 'scheduled';
    update public.meal_plan_versions set status = 'scheduled', published_at = pg_catalog.clock_timestamp() where id = ver.id;
  else
    update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status in ('published', 'scheduled');
    update public.meal_plan_versions set status = 'published', published_at = pg_catalog.clock_timestamp() where id = ver.id;
  end if;
  insert into public.meal_plan_handovers (meal_plan_version_id, meal_plan_id, previous_version_id, starts_on, changes)
  values (ver.id, target_plan, live_id, coalesce((select (s.scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date from public.meal_plan_delivery_schedules s where s.version_id=ver.id), ver.period_start), public.meal_plan_change_summary(live_id, ver.id));
  return public.meal_plan_professional_json(target_plan);
end $$;
revoke all on function public.publish_meal_plan_base(uuid, int) from public, anon, authenticated;


create function public.schedule_reviewed_meal_plan(target_plan uuid, expected_version int, expected_snapshot jsonb, scheduled_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); patient uuid; ver public.meal_plan_versions; existing timestamptz;
begin
 select p.patient_id into patient from public.meal_plans p where p.id=target_plan and p.nutritionist_id=nid;
 if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
 perform public.intake_assert_access(patient,true);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(patient::text,3));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(patient::text,1));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text,1));
 select * into ver from public.meal_plan_versions v where v.meal_plan_id=target_plan and v.version=expected_version for update;
 if not found then raise exception using errcode='PT409',message='meal_plan_version_conflict'; end if;
 select s.scheduled_at into existing from public.meal_plan_delivery_schedules s where s.version_id=ver.id;
 if existing is not null then
   if existing is distinct from scheduled_at then raise exception using errcode='PT409',message='meal_plan_version_conflict'; end if;
   -- Replay still verifies the reviewed snapshot through the existing publication gate.
   return public.publish_reviewed_meal_plan(target_plan,expected_version,expected_snapshot);
 end if;
 if ver.status <> 'draft' then raise exception using errcode='PT409',message='meal_plan_version_conflict'; end if;
 if scheduled_at is null or not isfinite(scheduled_at) or scheduled_at <= clock_timestamp()
    or (scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date not between ver.period_start and ver.period_end then
   raise exception using errcode='22023',message='meal_plan_schedule_date';
 end if;
 insert into public.meal_plan_delivery_schedules values(ver.id,scheduled_at,clock_timestamp());
 -- Same snapshot, target and health gates as immediate publication; all in this transaction.
 return public.publish_reviewed_meal_plan(target_plan,expected_version,expected_snapshot);
end $$;
revoke all on function public.schedule_reviewed_meal_plan(uuid,int,jsonb,timestamptz) from public,anon;
grant execute on function public.schedule_reviewed_meal_plan(uuid,int,jsonb,timestamptz) to authenticated;

alter function public.meal_plan_professional_json(uuid) rename to meal_plan_professional_json_before_delivery;
revoke all on function public.meal_plan_professional_json_before_delivery(uuid) from public,anon,authenticated;
create function public.meal_plan_professional_json(pid uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result:=public.meal_plan_professional_json_before_delivery(pid);
 if result is null then return null; end if;
 return result || jsonb_build_object('delivery_schedule',(
  select jsonb_build_object('version',v.version,'scheduled_at',s.scheduled_at) from public.meal_plan_delivery_schedules s
  join public.meal_plan_versions v on v.id=s.version_id where v.meal_plan_id=pid and v.status='scheduled'
 ));
end $$;
revoke all on function public.meal_plan_professional_json(uuid) from public,anon,authenticated;

-- Preserve all existing patient projections (times, labels, targets, components).
alter function public.list_published_meal_plan(uuid) rename to list_published_meal_plan_before_delivery;
revoke all on function public.list_published_meal_plan_before_delivery(uuid) from public,anon,authenticated;
create function public.list_published_meal_plan(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; at timestamptz;
begin
 result:=public.list_published_meal_plan_before_delivery(target_patient);
 if result is null or result->'handover' is null then return result; end if;
 select s.scheduled_at into at from public.meal_plan_delivery_schedules s
 join public.meal_plan_versions v on v.id=s.version_id
 where v.meal_plan_id=(result->>'id')::uuid and v.version=(result->'handover'->>'version')::int;
 if at is null then return result; end if;
 return jsonb_set(result,'{handover}',result->'handover'||jsonb_build_object('scheduled_at',at));
end $$;
revoke all on function public.list_published_meal_plan(uuid) from public,anon;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

-- One reservation per published version, including pending/uncertain results after a process crash.
create table public.meal_plan_email_deliveries (
 version_id uuid primary key references public.meal_plan_versions(id) on delete cascade,
 token uuid not null default gen_random_uuid(),
 state text not null default 'pending' check(state in ('pending','accepted','uncertain')),
 created_at timestamptz not null default clock_timestamp()
);
alter table public.meal_plan_email_deliveries enable row level security;
revoke all on public.meal_plan_email_deliveries from public,anon,authenticated;
create function public.claim_meal_plan_email(target_plan uuid,expected_version int)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri(); rec public.meal_plans; vid uuid; reservation uuid;
begin
 select * into rec from public.meal_plans where id=target_plan and nutritionist_id=nid;
 if not found then raise exception using errcode='42501',message='meal_plan_forbidden'; end if;
 perform public.intake_assert_access(rec.patient_id,true);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text,1));
 perform public.promote_due_meal_plan(target_plan);
 select id into vid from public.meal_plan_versions where meal_plan_id=target_plan and version=expected_version and status='published';
 if not found then raise exception using errcode='PT409',message='meal_plan_version_conflict'; end if;
 insert into public.meal_plan_email_deliveries(version_id) values(vid) on conflict do nothing returning token into reservation;
 return jsonb_build_object('token',reservation,'state',(select state from public.meal_plan_email_deliveries where version_id=vid));
end $$;
revoke all on function public.claim_meal_plan_email(uuid,int) from public,anon;
grant execute on function public.claim_meal_plan_email(uuid,int) to authenticated;
create function public.finish_meal_plan_email(p_token uuid,p_state text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_state not in ('accepted','uncertain') then raise exception using errcode='22023',message='mail_state'; end if;
 update public.meal_plan_email_deliveries set state=p_state where token=p_token and state='pending';
end $$;
revoke all on function public.finish_meal_plan_email(uuid,text) from public,anon,authenticated;
grant execute on function public.finish_meal_plan_email(uuid,text) to service_role;
commit;
