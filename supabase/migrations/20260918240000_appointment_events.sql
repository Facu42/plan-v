-- PV-25: timezone, confirmacion, historial y solape de consultas.
alter table public.appointments
  add column if not exists timezone text not null default 'America/Argentina/Buenos_Aires';
alter table public.appointments
  add column if not exists confirmation text;
alter table public.appointments
  add column if not exists confirmed_at timestamptz;

alter table public.appointments drop constraint if exists appointments_timezone_known;
alter table public.appointments
  add constraint appointments_timezone_known
  check (timezone = 'America/Argentina/Buenos_Aires');

alter table public.appointments drop constraint if exists appointments_confirmation_known;
alter table public.appointments
  add constraint appointments_confirmation_known
  check (confirmation is null or confirmation in ('attending', 'needs_change'));

alter table public.appointments drop constraint if exists appointments_confirmation_stamp;
alter table public.appointments
  add constraint appointments_confirmation_stamp
  check ((confirmation is null) = (confirmed_at is null));

create unique index if not exists appointments_one_scheduled_per_patient
  on public.appointments (patient_id)
  where status = 'scheduled';

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  action text not null check (action in ('scheduled', 'rescheduled', 'patient_rescheduled', 'cancelled', 'confirmed')),
  actor_role text not null check (actor_role in ('pro', 'patient', 'system')),
  starts_at timestamptz,
  duration_min int,
  channel text,
  timezone text,
  at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create function public.appointment_can_read(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    public.is_assigned_patient(target)
    or (
      public.my_patient_id() is not distinct from target
      and public.patient_has_full_access(target)
    )
  );
$$;

alter table public.appointment_events enable row level security;
drop policy if exists appointment_events_select on public.appointment_events;
create policy appointment_events_select on public.appointment_events
  for select
  to authenticated
  using (public.appointment_can_read(patient_id));

revoke all on public.appointment_events from public, anon, authenticated;
grant select on public.appointment_events to authenticated;

drop view if exists public.appointments_patient_view;
create view public.appointments_patient_view as
  select
    id,
    patient_id,
    starts_at,
    duration_min,
    channel,
    status,
    meet_url,
    timezone,
    confirmation,
    confirmed_at,
    created_at
  from public.appointments
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());
grant select on public.appointments_patient_view to authenticated;

create function public.appointment_overlaps(owner uuid, target uuid, starts_at_value timestamptz, duration_value int)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.appointments a
    where a.nutritionist_id = owner
      and a.status = 'scheduled'
      and a.patient_id is distinct from target
      and a.starts_at < starts_at_value + (duration_value * interval '1 minute')
      and starts_at_value < a.starts_at + (a.duration_min * interval '1 minute')
  );
$$;

create function public.save_appointment(
  target uuid,
  starts_at_value timestamptz,
  duration_value int,
  channel_value text,
  meet_url_value text,
  timezone_value text default 'America/Argentina/Buenos_Aires'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nutri_id uuid;
  existing public.appointments;
  result public.appointments;
  action_name text;
begin
  if not public.is_assigned_patient(target) then
    raise exception using errcode = '42501', message = 'appointment_forbidden';
  end if;
  if duration_value < 10 or duration_value > 180 then
    raise exception using errcode = '22023', message = 'appointment_duration';
  end if;
  if channel_value not in ('video', 'presencial') then
    raise exception using errcode = '22023', message = 'appointment_channel';
  end if;
  if timezone_value is distinct from 'America/Argentina/Buenos_Aires' then
    raise exception using errcode = '22023', message = 'appointment_timezone';
  end if;
  if meet_url_value is not null and (length(meet_url_value) > 500 or meet_url_value !~ '^https://') then
    raise exception using errcode = '22023', message = 'appointment_meet_url';
  end if;
  select p.nutritionist_id into nutri_id from public.patients p where p.id = target;
  if nutri_id is null then
    raise exception using errcode = 'PT404', message = 'appointment_patient';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(nutri_id::text), 17);
  if public.appointment_overlaps(nutri_id, target, starts_at_value, duration_value) then
    raise exception using errcode = 'PT409', message = 'appointment_overlap';
  end if;
  select * into existing from public.appointments where patient_id = target and status = 'scheduled' for update;
  action_name := case when found then 'rescheduled' else 'scheduled' end;
  if found then
    update public.appointments
      set status = 'cancelled'
      where id = existing.id;
  end if;
  insert into public.appointments (
    nutritionist_id, patient_id, starts_at, duration_min, channel, status, meet_url, timezone, confirmation, confirmed_at
  ) values (
    nutri_id, target, starts_at_value, duration_value, channel_value::public.appointment_channel, 'scheduled', meet_url_value, timezone_value, null, null
  ) returning * into result;
  insert into public.appointment_events (
    appointment_id, patient_id, nutritionist_id, action, actor_role, starts_at, duration_min, channel, timezone
  ) values (
    result.id, target, nutri_id, action_name, 'pro', result.starts_at, result.duration_min, result.channel::text, result.timezone
  );
  return to_jsonb(result);
end;
$$;

create function public.cancel_appointment(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.appointments;
begin
  if not public.is_assigned_patient(target) then
    raise exception using errcode = '42501', message = 'appointment_forbidden';
  end if;
  select * into existing from public.appointments where patient_id = target and status = 'scheduled' for update;
  if not found then
    return;
  end if;
  update public.appointments set status = 'cancelled' where id = existing.id;
  insert into public.appointment_events (
    appointment_id, patient_id, nutritionist_id, action, actor_role, starts_at, duration_min, channel, timezone
  ) values (
    existing.id, existing.patient_id, existing.nutritionist_id, 'cancelled', 'pro', existing.starts_at, existing.duration_min, existing.channel::text, existing.timezone
  );
end;
$$;

create function public.reschedule_appointment(target uuid, starts_at_value timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.appointments;
  result public.appointments;
  patient_user uuid;
  actor_name text;
  action_name text;
begin
  if not public.appointment_can_read(target) then
    raise exception using errcode = '42501', message = 'appointment_forbidden';
  end if;
  select * into existing from public.appointments where patient_id = target and status = 'scheduled' for update;
  if not found then
    raise exception using errcode = 'PT409', message = 'appointment_missing';
  end if;
  select p.user_id into patient_user from public.patients p where p.id = target;
  if auth.uid() is not distinct from patient_user then
    if existing.starts_at - clock_timestamp() < interval '12 hours' then
      raise exception using errcode = 'PT409', message = 'appointment_notice';
    end if;
    actor_name := 'patient';
    action_name := 'patient_rescheduled';
  else
    if not public.is_assigned_patient(target) then
      raise exception using errcode = '42501', message = 'appointment_forbidden';
    end if;
    actor_name := 'pro';
    action_name := 'rescheduled';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(existing.nutritionist_id::text), 17);
  if public.appointment_overlaps(existing.nutritionist_id, target, starts_at_value, existing.duration_min) then
    raise exception using errcode = 'PT409', message = 'appointment_overlap';
  end if;
  update public.appointments
    set starts_at = starts_at_value, confirmation = null, confirmed_at = null
    where id = existing.id
    returning * into result;
  insert into public.appointment_events (
    appointment_id, patient_id, nutritionist_id, action, actor_role, starts_at, duration_min, channel, timezone
  ) values (
    result.id, result.patient_id, result.nutritionist_id, action_name, actor_name, result.starts_at, result.duration_min, result.channel::text, result.timezone
  );
  return to_jsonb(result);
end;
$$;

create function public.confirm_appointment(target uuid, confirmation_value text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.appointments;
  result public.appointments;
begin
  if not public.appointment_can_read(target) then
    raise exception using errcode = '42501', message = 'appointment_forbidden';
  end if;
  if confirmation_value not in ('attending', 'needs_change') then
    raise exception using errcode = '22023', message = 'appointment_confirmation';
  end if;
  select * into existing from public.appointments where patient_id = target and status = 'scheduled' for update;
  if not found then
    raise exception using errcode = 'PT409', message = 'appointment_missing';
  end if;
  if existing.confirmation is not distinct from confirmation_value then
    return to_jsonb(existing);
  end if;
  update public.appointments
    set confirmation = confirmation_value, confirmed_at = clock_timestamp()
    where id = existing.id
    returning * into result;
  insert into public.appointment_events (
    appointment_id, patient_id, nutritionist_id, action, actor_role, starts_at, duration_min, channel, timezone
  ) values (
    result.id, result.patient_id, result.nutritionist_id, 'confirmed',
    case when public.is_assigned_patient(target) then 'pro' else 'patient' end,
    result.starts_at, result.duration_min, result.channel::text, result.timezone
  );
  return to_jsonb(result);
end;
$$;

revoke all on function public.appointment_can_read(uuid),
  public.appointment_overlaps(uuid, uuid, timestamptz, int),
  public.save_appointment(uuid, timestamptz, int, text, text, text),
  public.cancel_appointment(uuid),
  public.reschedule_appointment(uuid, timestamptz),
  public.confirm_appointment(uuid, text)
  from public, anon;
grant execute on function public.appointment_can_read(uuid),
  public.appointment_overlaps(uuid, uuid, timestamptz, int),
  public.save_appointment(uuid, timestamptz, int, text, text, text),
  public.cancel_appointment(uuid),
  public.reschedule_appointment(uuid, timestamptz),
  public.confirm_appointment(uuid, text)
  to authenticated;
