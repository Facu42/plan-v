-- PV-25: turnos con timezone, confirmación, reprogramación con política
-- y bloqueo transaccional de solapamientos. No borra el turno anterior:
-- lo marca cancelled y deja appointment_events append-only.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

alter table public.appointments
  add column if not exists timezone text not null default 'America/Argentina/Buenos_Aires',
  add column if not exists patient_reply text,
  add column if not exists confirmed_at timestamptz;

alter table public.appointments drop constraint if exists appointments_patient_reply_check;
alter table public.appointments
  add constraint appointments_patient_reply_check
  check (patient_reply is null or patient_reply in ('attending', 'needs_change'));

do $$ begin
  create type public.appointment_event_action as enum (
    'scheduled', 'rescheduled', 'patient_rescheduled', 'cancelled', 'elapsed', 'confirmed', 'needs_change'
  );
exception when duplicate_object then null; end $$;

alter type public.appointment_event_action add value if not exists 'scheduled';
alter type public.appointment_event_action add value if not exists 'rescheduled';
alter type public.appointment_event_action add value if not exists 'patient_rescheduled';
alter type public.appointment_event_action add value if not exists 'cancelled';
alter type public.appointment_event_action add value if not exists 'elapsed';
alter type public.appointment_event_action add value if not exists 'confirmed';
alter type public.appointment_event_action add value if not exists 'needs_change';

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  action public.appointment_event_action not null,
  actor_role text not null check (actor_role in ('pro', 'patient', 'system')),
  starts_at timestamptz,
  duration_min int,
  channel public.appointment_channel,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists appointment_events_patient_idx
  on public.appointment_events (patient_id, created_at desc);

alter table public.appointment_events enable row level security;

revoke all on public.appointment_events from public, anon, authenticated;
grant select on public.appointment_events to authenticated;

drop policy if exists appointment_events_thread_select on public.appointment_events;
create policy appointment_events_thread_select on public.appointment_events
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or (
      patient_id is not distinct from public.my_patient_id()
      and public.patient_has_full_access(patient_id)
    )
  );

-- Columnas nuevas al final: CREATE OR REPLACE VIEW no puede reordenar las existentes.
create or replace view public.appointments_patient_view
as
  select
    id,
    patient_id,
    starts_at,
    duration_min,
    channel,
    status,
    meet_url,
    created_at,
    timezone,
    patient_reply,
    confirmed_at
  from public.appointments
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());

grant select on public.appointments_patient_view to authenticated;

create or replace function public.appointment_assert_timezone(tz text)
returns text language plpgsql stable set search_path='' as $$
declare
  zone text;
  probe timestamptz;
begin
  zone := coalesce(nullif(btrim(tz), ''), 'America/Argentina/Buenos_Aires');
  begin
    probe := pg_catalog.timezone(zone, timestamp '2000-01-01 12:00:00');
  exception when others then
    raise exception using errcode='22023', message='appointment_timezone';
  end;
  if probe is null then
    raise exception using errcode='22023', message='appointment_timezone';
  end if;
  return zone;
end; $$;

create or replace function public.appointment_next_starts_at(weekday_name text, wall_time text, tz text)
returns timestamptz language plpgsql stable set search_path='' as $$
declare
  zone text;
  now_local timestamp;
  target_local timestamp;
  wall time;
  now_dow int;
  target_dow int;
  delta int;
begin
  zone := public.appointment_assert_timezone(tz);
  begin
    wall := wall_time::time;
  exception when others then
    raise exception using errcode='22023', message='appointment_time';
  end;
  target_dow := case weekday_name
    when 'Domingo' then 0
    when 'Lunes' then 1
    when 'Martes' then 2
    when 'Miércoles' then 3
    when 'Jueves' then 4
    when 'Viernes' then 5
    when 'Sábado' then 6
    else null
  end;
  if target_dow is null then
    raise exception using errcode='22023', message='appointment_day';
  end if;
  now_local := pg_catalog.timezone(zone, pg_catalog.clock_timestamp());
  now_dow := extract(dow from now_local)::int;
  delta := (target_dow - now_dow + 7) % 7;
  target_local := date_trunc('day', now_local) + (delta * interval '1 day') + wall;
  if delta = 0 and target_local <= now_local then
    target_local := target_local + interval '7 days';
  end if;
  return pg_catalog.timezone(zone, target_local);
end; $$;

create or replace function public.appointment_format_when(starts timestamptz, tz text)
returns text language plpgsql stable set search_path='' as $$
declare
  zone text;
  local_ts timestamp;
  dow int;
  day_name text;
begin
  zone := public.appointment_assert_timezone(tz);
  local_ts := pg_catalog.timezone(zone, starts);
  dow := extract(dow from local_ts)::int;
  day_name := case dow
    when 0 then 'Domingo'
    when 1 then 'Lunes'
    when 2 then 'Martes'
    when 3 then 'Miércoles'
    when 4 then 'Jueves'
    when 5 then 'Viernes'
    when 6 then 'Sábado'
  end;
  return day_name || ' · ' || to_char(local_ts, 'HH24:MI');
end; $$;

create or replace function public.appointment_slot_json(a public.appointments)
returns jsonb language plpgsql stable set search_path='' as $$
begin
  return jsonb_build_object(
    'when', public.appointment_format_when(a.starts_at, a.timezone),
    'duration', a.duration_min,
    'channel', a.channel,
    'meet_url', a.meet_url,
    'starts_at', a.starts_at,
    'timezone', a.timezone,
    'patient_reply', a.patient_reply,
    'confirmed_at', a.confirmed_at
  );
end; $$;

create or replace function public.appointment_event_json(e public.appointment_events, tz text)
returns jsonb language plpgsql stable set search_path='' as $$
declare
  zone text;
  local_ts timestamp;
begin
  zone := public.appointment_assert_timezone(tz);
  local_ts := case when e.starts_at is null then null else pg_catalog.timezone(zone, e.starts_at) end;
  return jsonb_build_object(
    'id', e.id,
    'when', case when e.starts_at is null then '' else public.appointment_format_when(e.starts_at, zone) end,
    'dateId', case when local_ts is null then null else to_char(local_ts, 'YYYY-MM-DD') end,
    'duration', e.duration_min,
    'channel', e.channel,
    'action', e.action,
    'actor', e.actor_role,
    'at', e.created_at
  );
end; $$;

create or replace function public.appointment_current(pid uuid)
returns public.appointments language plpgsql stable set search_path='' as $$
declare
  current public.appointments;
begin
  select * into current
  from public.appointments
  where patient_id = pid
    and status = 'scheduled'
    and starts_at >= pg_catalog.clock_timestamp()
  order by starts_at
  limit 1;
  return current;
end; $$;

create or replace function public.appointment_history_json(pid uuid)
returns jsonb language plpgsql stable set search_path='' as $$
declare
  result jsonb;
begin
  select coalesce(jsonb_agg(public.appointment_event_json(e, coalesce(a.timezone, 'America/Argentina/Buenos_Aires')) order by e.created_at desc), '[]'::jsonb)
    into result
  from public.appointment_events e
  join public.appointments a on a.id = e.appointment_id
  where e.patient_id = pid;
  return result;
end; $$;

create or replace function public.appointment_assert_pro(pid uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare
  nid uuid;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if not public.is_assigned_patient(pid) then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  select nutritionist_id into nid from public.patients where id = pid;
  if nid is null then
    raise exception using errcode='PT404', message='appointment_missing';
  end if;
  return nid;
end; $$;

create or replace function public.appointment_assert_patient(pid uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare
  nid uuid;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if public.my_patient_id() is distinct from pid then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if not public.patient_has_full_access(pid) then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  select nutritionist_id into nid from public.patients where id = pid;
  if nid is null then
    raise exception using errcode='PT404', message='appointment_missing';
  end if;
  return nid;
end; $$;

create or replace function public.appointment_lock_nutritionist(nid uuid)
returns void language plpgsql set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text || ':appt', 0));
end; $$;

create or replace function public.appointment_has_overlap(nid uuid, starts timestamptz, duration int)
returns boolean language plpgsql stable set search_path='' as $$
begin
  return exists (
    select 1
    from public.appointments a
    where a.nutritionist_id = nid
      and a.status = 'scheduled'
      and a.starts_at < starts + pg_catalog.make_interval(mins => duration)
      and starts < a.starts_at + pg_catalog.make_interval(mins => a.duration_min)
  );
end; $$;

create or replace function public.appointment_append_event(
  aid uuid,
  pid uuid,
  nid uuid,
  act public.appointment_event_action,
  actor text,
  starts timestamptz,
  duration int,
  ch public.appointment_channel
) returns void language plpgsql set search_path='' as $$
begin
  insert into public.appointment_events (
    appointment_id, patient_id, nutritionist_id, action, actor_role, starts_at, duration_min, channel
  ) values (aid, pid, nid, act, actor, starts, duration, ch);
end; $$;

create or replace function public.appointment_cancel_current(pid uuid, nid uuid, actor text, act public.appointment_event_action)
returns public.appointments language plpgsql set search_path='' as $$
declare
  current public.appointments;
begin
  select * into current
  from public.appointments
  where patient_id = pid
    and status = 'scheduled'
  order by starts_at
  limit 1
  for update;
  if not found then
    return null;
  end if;
  update public.appointments
    set status = 'cancelled'
    where id = current.id;
  perform public.appointment_append_event(
    current.id, pid, nid, act, actor, current.starts_at, current.duration_min, current.channel
  );
  return current;
end; $$;

create or replace function public.schedule_appointment(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  nid uuid;
  slot jsonb;
  day_name text;
  wall text;
  duration int;
  ch public.appointment_channel;
  meet text;
  zone text;
  starts timestamptz;
  previous public.appointments;
  created public.appointments;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id', 'appointment')
  ) then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='appointment_invalid';
  end;
  if pid is null then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  nid := public.appointment_assert_pro(pid);
  perform public.appointment_lock_nutritionist(nid);
  slot := payload->'appointment';
  if slot is null or jsonb_typeof(slot) = 'null' then
    previous := public.appointment_cancel_current(pid, nid, 'pro', 'cancelled');
    return jsonb_build_object(
      'appointment', null,
      'history', public.appointment_history_json(pid)
    );
  end if;
  if jsonb_typeof(slot) is distinct from 'object' then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(slot) k
    where k not in ('day', 'time', 'duration', 'channel', 'meet_url', 'timezone')
  ) then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  day_name := slot->>'day';
  wall := slot->>'time';
  begin
    duration := (slot->>'duration')::int;
  exception when others then
    raise exception using errcode='22023', message='appointment_duration';
  end;
  if duration is null or duration < 10 or duration > 180 then
    raise exception using errcode='22023', message='appointment_duration';
  end if;
  begin
    ch := (slot->>'channel')::public.appointment_channel;
  exception when others then
    raise exception using errcode='22023', message='appointment_channel';
  end;
  meet := nullif(btrim(coalesce(slot->>'meet_url', '')), '');
  if meet is not null and (char_length(meet) > 500 or meet !~ '^https://') then
    raise exception using errcode='22023', message='appointment_meet';
  end if;
  if ch is distinct from 'video' then
    meet := null;
  end if;
  zone := public.appointment_assert_timezone(slot->>'timezone');
  starts := public.appointment_next_starts_at(day_name, wall, zone);
  previous := public.appointment_cancel_current(pid, nid, 'pro', 'rescheduled');
  if public.appointment_has_overlap(nid, starts, duration) then
    raise exception using errcode='PT409', message='appointment_overlap';
  end if;
  insert into public.appointments (
    nutritionist_id, patient_id, starts_at, duration_min, channel, status, meet_url, timezone
  ) values (
    nid, pid, starts, duration, ch, 'scheduled', meet, zone
  ) returning * into created;
  if previous is null then
    perform public.appointment_append_event(
      created.id, pid, nid, 'scheduled', 'pro', created.starts_at, created.duration_min, created.channel
    );
  end if;
  return jsonb_build_object(
    'appointment', public.appointment_slot_json(created),
    'history', public.appointment_history_json(pid)
  );
end; $$;

create or replace function public.reschedule_appointment(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  nid uuid;
  day_name text;
  wall text;
  previous public.appointments;
  created public.appointments;
  starts timestamptz;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 4000 then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id', 'day', 'time')
  ) then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='appointment_invalid';
  end;
  if pid is null then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  nid := public.appointment_assert_patient(pid);
  perform public.appointment_lock_nutritionist(nid);
  day_name := payload->>'day';
  wall := payload->>'time';
  select * into previous
  from public.appointments
  where patient_id = pid
    and status = 'scheduled'
  order by starts_at
  limit 1
  for update;
  if not found then
    raise exception using errcode='PT409', message='appointment_none';
  end if;
  starts := public.appointment_next_starts_at(day_name, wall, previous.timezone);
  if public.appointment_format_when(previous.starts_at, previous.timezone)
     is not distinct from public.appointment_format_when(starts, previous.timezone) then
    return jsonb_build_object(
      'appointment', public.appointment_slot_json(previous),
      'history', public.appointment_history_json(pid)
    );
  end if;
  update public.appointments set status = 'cancelled' where id = previous.id;
  perform public.appointment_append_event(
    previous.id, pid, nid, 'patient_rescheduled', 'patient',
    previous.starts_at, previous.duration_min, previous.channel
  );
  if public.appointment_has_overlap(nid, starts, previous.duration_min) then
    raise exception using errcode='PT409', message='appointment_overlap';
  end if;
  insert into public.appointments (
    nutritionist_id, patient_id, starts_at, duration_min, channel, status, meet_url, timezone
  ) values (
    nid, pid, starts, previous.duration_min, previous.channel, 'scheduled', previous.meet_url, previous.timezone
  ) returning * into created;
  return jsonb_build_object(
    'appointment', public.appointment_slot_json(created),
    'history', public.appointment_history_json(pid)
  );
end; $$;

create or replace function public.confirm_appointment(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  nid uuid;
  reply text;
  current public.appointments;
  stamp timestamptz;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 2000 then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id', 'reply')
  ) then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='appointment_invalid';
  end;
  if pid is null then
    raise exception using errcode='22023', message='appointment_invalid';
  end if;
  nid := public.appointment_assert_patient(pid);
  reply := payload->>'reply';
  if reply is distinct from 'attending' and reply is distinct from 'needs_change' then
    raise exception using errcode='22023', message='appointment_reply';
  end if;
  select * into current
  from public.appointments
  where patient_id = pid
    and status = 'scheduled'
  order by starts_at
  limit 1
  for update;
  if not found then
    raise exception using errcode='PT409', message='appointment_none';
  end if;
  if current.patient_reply is not distinct from reply then
    return jsonb_build_object(
      'appointment', public.appointment_slot_json(current),
      'history', public.appointment_history_json(pid)
    );
  end if;
  stamp := pg_catalog.clock_timestamp();
  update public.appointments
    set patient_reply = reply,
        confirmed_at = case
          when reply = 'attending' then coalesce(confirmed_at, stamp)
          else confirmed_at
        end
    where id = current.id
    returning * into current;
  perform public.appointment_append_event(
    current.id, pid, nid,
    case when reply = 'attending' then 'confirmed'::public.appointment_event_action else 'needs_change'::public.appointment_event_action end,
    'patient',
    current.starts_at, current.duration_min, current.channel
  );
  return jsonb_build_object(
    'appointment', public.appointment_slot_json(current),
    'history', public.appointment_history_json(pid)
  );
end; $$;

create or replace function public.get_patient_appointment(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  current public.appointments;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='appointment_forbidden';
  end if;
  if public.is_assigned_patient(target_patient) then
    current := public.appointment_current(target_patient);
    return jsonb_build_object(
      'appointment', case when current.id is null then null else public.appointment_slot_json(current) end,
      'history', public.appointment_history_json(target_patient)
    );
  end if;
  if public.my_patient_id() is not distinct from target_patient then
    if not public.patient_has_full_access(target_patient) then
      return jsonb_build_object('appointment', null, 'history', '[]'::jsonb);
    end if;
    current := public.appointment_current(target_patient);
    return jsonb_build_object(
      'appointment', case when current.id is null then null else public.appointment_slot_json(current) end,
      'history', public.appointment_history_json(target_patient)
    );
  end if;
  raise exception using errcode='42501', message='appointment_forbidden';
end; $$;

revoke all on function public.schedule_appointment(jsonb) from public, anon;
revoke all on function public.reschedule_appointment(jsonb) from public, anon;
revoke all on function public.confirm_appointment(jsonb) from public, anon;
revoke all on function public.get_patient_appointment(uuid) from public, anon;
grant execute on function public.schedule_appointment(jsonb) to authenticated;
grant execute on function public.reschedule_appointment(jsonb) to authenticated;
grant execute on function public.confirm_appointment(jsonb) to authenticated;
grant execute on function public.get_patient_appointment(uuid) to authenticated;
