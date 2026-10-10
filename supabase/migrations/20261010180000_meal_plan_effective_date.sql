-- D7: un plan nuevo no archiva el vigente si todavía no empezó.
-- La paciente sigue con el anterior hasta period_start (día de Argentina),
-- ve el resumen de cambios y puede marcar el aviso como visto.
-- Queda en el repositorio hasta que Facundo escriba la frase para aplicarla.

begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

do $status$
declare constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.meal_plan_versions'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.meal_plan_versions drop constraint %I', constraint_name);
  end loop;
end
$status$;

alter table public.meal_plan_versions
  add constraint meal_plan_versions_status_check check (status in ('draft', 'published', 'scheduled', 'archived')),
  add constraint meal_plan_versions_published_stamp check (status not in ('published', 'scheduled') or published_at is not null);

create unique index if not exists meal_plan_versions_one_scheduled
  on public.meal_plan_versions (meal_plan_id)
  where status = 'scheduled';

create table public.meal_plan_handovers (
  meal_plan_version_id uuid primary key references public.meal_plan_versions(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  previous_version_id uuid references public.meal_plan_versions(id) on delete set null,
  starts_on date not null,
  changes jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  seen_at timestamptz,
  check (jsonb_typeof(changes) = 'object')
);
create index meal_plan_handovers_plan_idx on public.meal_plan_handovers (meal_plan_id, created_at desc);
alter table public.meal_plan_handovers enable row level security;
revoke all on table public.meal_plan_handovers from public, anon, authenticated;

create or replace function public.meal_plan_version_immutable()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status in ('published', 'scheduled', 'archived') then
    if tg_op = 'DELETE' then
      raise exception using errcode='PT409', message='meal_plan_published_immutable';
    end if;
    if old.status = 'archived'
      or new.period_start is distinct from old.period_start
      or new.period_end is distinct from old.period_end
      or new.version is distinct from old.version
      or new.published_at is distinct from old.published_at
      or new.meal_plan_id is distinct from old.meal_plan_id
      or (old.status = 'published' and new.status not in ('published', 'archived'))
      or (old.status = 'scheduled' and new.status not in ('scheduled', 'published', 'archived'))
    then
      raise exception using errcode='PT409', message='meal_plan_published_immutable';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.meal_plan_version_immutable() from public, anon, authenticated;

create or replace function public.meal_plan_item_immutable()
returns trigger language plpgsql set search_path='' as $$
declare ver_status text;
begin
  select v.status into ver_status
  from public.meal_plan_versions v
  where v.id = coalesce(new.meal_plan_version_id, old.meal_plan_version_id);
  if ver_status in ('published', 'scheduled', 'archived') then
    raise exception using errcode='PT409', message='meal_plan_published_immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end; $$;
revoke all on function public.meal_plan_item_immutable() from public, anon, authenticated;

create or replace function public.guard_plan_guidance() returns trigger language plpgsql set search_path='' as $$
declare category text; line jsonb;
begin
  if tg_op = 'UPDATE' and old.status in ('published', 'scheduled', 'archived') and new.guidance is distinct from old.guidance then
    raise exception using errcode='22023', message='guidance_immutable';
  end if;
  if new.guidance is null then return new; end if;
  if jsonb_typeof(new.guidance) is distinct from 'object' or not (new.guidance ?& array['recommendations', 'avoid']) or exists(select 1 from jsonb_object_keys(new.guidance) k where k not in ('recommendations', 'avoid')) then
    raise exception using errcode='22023', message='guidance_shape';
  end if;
  foreach category in array array['recommendations', 'avoid'] loop
    if jsonb_typeof(new.guidance -> category) is distinct from 'array' or jsonb_array_length(new.guidance -> category) > 100 then
      raise exception using errcode='22023', message='guidance_limit';
    end if;
    for line in select value from jsonb_array_elements(new.guidance -> category) loop
      if jsonb_typeof(line) is distinct from 'string' or length(btrim(line #>> '{}')) not between 1 and 500 then
        raise exception using errcode='22023', message='guidance_line';
      end if;
    end loop;
  end loop;
  return new;
end $$;
revoke all on function public.guard_plan_guidance() from public, anon, authenticated;

create function public.guard_scheduled_meal_plan() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op = 'UPDATE' and old.status = 'scheduled' and new.nutrition_target is distinct from old.nutrition_target then
    raise exception using errcode='PT409', message='meal_plan_published_immutable';
  end if;
  return new;
end $$;
revoke all on function public.guard_scheduled_meal_plan() from public, anon, authenticated;
create trigger scheduled_plan_target_guard before update on public.meal_plan_versions
  for each row execute function public.guard_scheduled_meal_plan();

create function public.promote_due_meal_plan(target_plan uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  today date := (pg_catalog.timezone('America/Argentina/Buenos_Aires', pg_catalog.clock_timestamp()))::date;
  due uuid;
begin
  if target_plan is null then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_plan::text, 1));
  select v.id into due
  from public.meal_plan_versions v
  where v.meal_plan_id = target_plan and v.status = 'scheduled' and v.period_start <= today
  for update;
  if due is null then return; end if;
  update public.meal_plan_versions set status = 'archived'
  where meal_plan_id = target_plan and status = 'published';
  update public.meal_plan_versions set status = 'published' where id = due;
end $$;
revoke all on function public.promote_due_meal_plan(uuid) from public, anon, authenticated;

create function public.meal_plan_change_summary(previous_version uuid, next_version uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  with items as (
    select i.meal_plan_version_id, i.for_date, public.meal_plan_slot_label(i.slot) as slot, i.slot as slot_key,
      coalesce(i.public_note, '') as public_note, i.portions,
      coalesce(nullif(btrim(i.free_text), ''), r.title, case when i.components is not null then 'Comida armada' else 'Comida' end) as label
    from public.meal_plan_items i
    left join public.recipe_versions rv on rv.id = i.recipe_version_id
    left join public.recipes r on r.id = rv.recipe_id
    where i.meal_plan_version_id = previous_version or i.meal_plan_version_id = next_version
  ), old_items as (
    select * from items where meal_plan_version_id = previous_version
  ), new_items as (
    select * from items where meal_plan_version_id = next_version
  ), lines as (
    select 'changed'::text as kind, n.for_date, n.slot, n.slot_key, o.label as before_label, n.label as after_label
    from new_items n
    join old_items o on o.for_date = n.for_date and o.slot_key = n.slot_key
    where o.label is distinct from n.label or o.public_note is distinct from n.public_note or o.portions is distinct from n.portions
    union all
    select 'added', n.for_date, n.slot, n.slot_key, null, n.label
    from new_items n
    where not exists (select 1 from old_items o where o.for_date = n.for_date and o.slot_key = n.slot_key)
    union all
    select 'removed', o.for_date, o.slot, o.slot_key, o.label, null
    from old_items o
    where not exists (select 1 from new_items n where n.for_date = o.for_date and n.slot_key = o.slot_key)
  )
  select jsonb_build_object(
    'added', (select count(*) from lines where kind = 'added'),
    'removed', (select count(*) from lines where kind = 'removed'),
    'changed', (select count(*) from lines where kind = 'changed'),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', kind, 'for_date', for_date, 'slot', slot, 'before', before_label, 'after', after_label
      ) order by for_date, slot_key)
      from (select * from lines order by for_date, slot_key limit 12) capped
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.meal_plan_change_summary(uuid, uuid) from public, anon, authenticated;

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
  if live_id is not null and ver.period_start > today then
    update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status = 'scheduled';
    update public.meal_plan_versions set status = 'scheduled', published_at = pg_catalog.clock_timestamp() where id = ver.id;
  else
    update public.meal_plan_versions set status = 'archived' where meal_plan_id = target_plan and status in ('published', 'scheduled');
    update public.meal_plan_versions set status = 'published', published_at = pg_catalog.clock_timestamp() where id = ver.id;
  end if;
  insert into public.meal_plan_handovers (meal_plan_version_id, meal_plan_id, previous_version_id, starts_on, changes)
  values (ver.id, target_plan, live_id, ver.period_start, public.meal_plan_change_summary(live_id, ver.id));
  return public.meal_plan_professional_json(target_plan);
end $$;
revoke all on function public.publish_meal_plan_base(uuid, int) from public, anon, authenticated;

alter function public.meal_plan_professional_json(uuid) rename to meal_plan_professional_json_before_vigencia;
revoke all on function public.meal_plan_professional_json_before_vigencia(uuid) from public, anon, authenticated;
create function public.meal_plan_professional_json(pid uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb;
begin
  perform public.promote_due_meal_plan(pid);
  base := public.meal_plan_professional_json_before_vigencia(pid);
  if base is null then return null; end if;
  return base || jsonb_build_object('scheduled', (
    select public.meal_plan_version_json(v.id)
    from public.meal_plan_versions v
    where v.meal_plan_id = pid and v.status = 'scheduled'
    limit 1
  ));
end $$;
revoke all on function public.meal_plan_professional_json(uuid) from public, anon, authenticated;

alter function public.list_published_meal_plan(uuid) rename to list_published_meal_plan_before_vigencia;
revoke all on function public.list_published_meal_plan_before_vigencia(uuid) from public, anon, authenticated;
create function public.list_published_meal_plan(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid; result jsonb; hand jsonb;
begin
  perform public.intake_assert_access(target_patient);
  select p.id into pid from public.meal_plans p where p.patient_id = target_patient limit 1;
  if pid is not null then
    perform public.promote_due_meal_plan(pid);
  end if;
  result := public.list_published_meal_plan_before_vigencia(target_patient);
  if result is null then return null; end if;
  select jsonb_build_object(
    'version', v.version,
    'previous_version', prev.version,
    'starts_on', h.starts_on,
    'waiting', (v.status = 'scheduled'),
    'seen', h.seen_at is not null,
    'changes', h.changes
  ) into hand
  from public.meal_plan_handovers h
  join public.meal_plan_versions v on v.id = h.meal_plan_version_id
  left join public.meal_plan_versions prev on prev.id = h.previous_version_id
  where h.meal_plan_id = pid and v.status in ('scheduled', 'published')
  order by case when v.status = 'scheduled' then 0 else 1 end, h.created_at desc
  limit 1;
  return result || case when hand is null then '{}'::jsonb else jsonb_build_object('handover', hand) end;
end $$;
revoke all on function public.list_published_meal_plan(uuid) from public, anon;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

alter function public.shopping_list_json(uuid) rename to shopping_list_json_before_vigencia;
revoke all on function public.shopping_list_json_before_vigencia(uuid) from public, anon, authenticated;
create function public.shopping_list_json(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
  select p.id into pid from public.meal_plans p where p.patient_id = target_patient limit 1;
  if pid is not null then
    perform public.promote_due_meal_plan(pid);
  end if;
  return public.shopping_list_json_before_vigencia(target_patient);
end $$;
revoke all on function public.shopping_list_json(uuid) from public, anon, authenticated;

create or replace function public.get_shopping_list(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform public.intake_assert_access(target_patient);
  return public.shopping_list_json(target_patient);
end $$;

create function public.mark_meal_plan_handover_seen(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.patients p
    where p.id = target_patient and p.user_id = auth.uid()
      and p.deactivated_at is null and p.anonymized_at is null
  ) then
    raise exception using errcode='42501', message='meal_plan_forbidden';
  end if;
  select id into pid from public.meal_plans where patient_id = target_patient limit 1;
  if pid is not null then
    perform public.promote_due_meal_plan(pid);
    update public.meal_plan_handovers h
      set seen_at = pg_catalog.clock_timestamp()
    from public.meal_plan_versions v
    where h.meal_plan_version_id = v.id
      and h.meal_plan_id = pid
      and v.status in ('scheduled', 'published')
      and h.seen_at is null;
  end if;
  return public.list_published_meal_plan(target_patient);
end $$;
revoke all on function public.mark_meal_plan_handover_seen(uuid) from public, anon;
grant execute on function public.mark_meal_plan_handover_seen(uuid) to authenticated;

commit;
