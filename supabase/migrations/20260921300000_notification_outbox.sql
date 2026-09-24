-- PV-26: outbox de avisos, preferencias, reintentos y deduplicación.
-- Email/push genéricos: nunca status=sent (no hay adaptador ni claves).
-- Paciente desactivado o desvinculado: deliveries skipped.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default false,
  push boolean not null default false,
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'appointment_scheduled',
    'appointment_rescheduled',
    'appointment_cancelled',
    'appointment_confirmed',
    'thread_message',
    'invite_sent',
    'reminder'
  )),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id),
  actor_id uuid,
  client_id uuid not null,
  dedupe_key text not null check (char_length(btrim(dedupe_key)) between 1 and 180),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  unique (patient_id, client_id),
  unique (patient_id, event_type, dedupe_key)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  outbox_event_id uuid not null references public.outbox_events(id) on delete cascade,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  recipient_user_id uuid,
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempt int not null default 0 check (attempt >= 0 and attempt <= 20),
  max_attempts int not null default 5 check (max_attempts between 1 and 20),
  last_error text,
  skip_reason text check (skip_reason is null or skip_reason in (
    'deactivated', 'unlinked', 'pref_off', 'provider_unconfigured'
  )),
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  unique (outbox_event_id, channel),
  check (status <> 'sent' or sent_at is not null),
  check (channel = 'in_app' or status <> 'sent')
);

create index if not exists outbox_events_patient_idx
  on public.outbox_events (patient_id, created_at desc);
create index if not exists notification_deliveries_drain_idx
  on public.notification_deliveries (status, next_attempt_at, created_at);
create index if not exists notification_deliveries_event_idx
  on public.notification_deliveries (outbox_event_id);

alter table public.notification_preferences enable row level security;
alter table public.outbox_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.notification_preferences, public.outbox_events, public.notification_deliveries
  from public, anon, authenticated;

create or replace function public.outbox_assert_access(target uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
begin
  if target is null then
    raise exception using errcode='22023', message='outbox_patient';
  end if;
  if not (
    public.is_assigned_patient(target)
    or public.my_patient_id() is not distinct from target
  ) then
    raise exception using errcode='42501', message='outbox_forbidden';
  end if;
  return target;
end; $$;

create or replace function public.outbox_patient_skip(target uuid)
returns text language plpgsql stable security definer set search_path='' as $$
declare
  row public.patients;
begin
  select * into row from public.patients where id = target;
  if not found then
    raise exception using errcode='PT404', message='outbox_patient';
  end if;
  if row.deactivated_at is not null or row.anonymized_at is not null then
    return 'deactivated';
  end if;
  if row.user_id is null then
    return 'unlinked';
  end if;
  return null;
end; $$;

create or replace function public.outbox_pref_on(uid uuid, channel text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare
  prefs public.notification_preferences;
begin
  if uid is null then
    return false;
  end if;
  select * into prefs from public.notification_preferences where user_id = uid;
  if not found then
    return channel = 'in_app';
  end if;
  if channel = 'in_app' then return prefs.in_app; end if;
  if channel = 'email' then return prefs.email; end if;
  if channel = 'push' then return prefs.push; end if;
  return false;
end; $$;

create or replace function public.outbox_delivery_json(d public.notification_deliveries)
returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'id', d.id,
    'outbox_event_id', d.outbox_event_id,
    'channel', d.channel,
    'recipient_user_id', d.recipient_user_id,
    'status', d.status,
    'attempt', d.attempt,
    'max_attempts', d.max_attempts,
    'last_error', d.last_error,
    'skip_reason', d.skip_reason,
    'next_attempt_at', d.next_attempt_at,
    'sent_at', d.sent_at,
    'created_at', d.created_at
  );
$$;

create or replace function public.outbox_event_json(e public.outbox_events)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  deliveries jsonb;
begin
  select coalesce(jsonb_agg(public.outbox_delivery_json(d) order by d.channel), '[]'::jsonb)
    into deliveries
  from public.notification_deliveries d
  where d.outbox_event_id = e.id;
  return jsonb_build_object(
    'event', jsonb_build_object(
      'id', e.id,
      'event_type', e.event_type,
      'patient_id', e.patient_id,
      'nutritionist_id', e.nutritionist_id,
      'client_id', e.client_id,
      'dedupe_key', e.dedupe_key,
      'payload', e.payload,
      'created_at', e.created_at
    ),
    'deliveries', deliveries
  );
end; $$;

create or replace function public.outbox_mailbox_json(target uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  notices jsonb;
begin
  perform public.outbox_assert_access(target);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'at', e.created_at,
    'channel', 'email',
    'to', 'aviso.demo@plan-v.local',
    'subject', e.payload->>'subject',
    'body', e.payload->>'body',
    'patientId', e.patient_id,
    'kind', e.payload->>'kind'
  ) order by e.created_at desc), '[]'::jsonb)
    into notices
  from public.outbox_events e
  join public.notification_deliveries d on d.outbox_event_id = e.id
  where e.patient_id = target
    and d.channel = 'in_app'
    and d.status = 'sent';
  return jsonb_build_object('notices', notices);
end; $$;

create or replace function public.enqueue_outbox_event(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  cid uuid;
  etype text;
  dkey text;
  subject text;
  body text;
  kind text;
  skip_reason text;
  existing public.outbox_events;
  created public.outbox_events;
  nutri uuid;
  recipient uuid;
  channel text;
  pref_on boolean;
  status text;
  reason text;
  sent timestamptz;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','event_type','client_id','dedupe_key','subject','body','kind')
  ) then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='outbox_invalid';
  end;
  if pid is null or cid is null then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  perform public.outbox_assert_access(pid);
  etype := payload->>'event_type';
  if etype not in (
    'appointment_scheduled','appointment_rescheduled','appointment_cancelled','appointment_confirmed',
    'thread_message','invite_sent','reminder'
  ) then
    raise exception using errcode='22023', message='outbox_type';
  end if;
  dkey := btrim(coalesce(nullif(payload->>'dedupe_key', ''), cid::text));
  if char_length(dkey) not between 1 and 180 then
    raise exception using errcode='22023', message='outbox_dedupe';
  end if;
  subject := btrim(coalesce(payload->>'subject', ''));
  body := btrim(coalesce(payload->>'body', ''));
  kind := payload->>'kind';
  if char_length(subject) not between 1 and 180 or char_length(body) not between 1 and 800 then
    raise exception using errcode='22023', message='outbox_copy';
  end if;
  if kind not in ('appointment','reminder','message','invite') then
    raise exception using errcode='22023', message='outbox_kind';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text || ':outbox:' || cid::text, 0));
  select * into existing from public.outbox_events where patient_id = pid and client_id = cid;
  if found then
    if existing.event_type is distinct from etype
      or existing.dedupe_key is distinct from dkey
      or existing.payload->>'subject' is distinct from subject
      or existing.payload->>'body' is distinct from body
      or existing.payload->>'kind' is distinct from kind then
      raise exception using errcode='PT409', message='outbox_duplicate';
    end if;
    return public.outbox_event_json(existing);
  end if;
  select * into existing from public.outbox_events
    where patient_id = pid and event_type = etype and dedupe_key = dkey;
  if found then
    return public.outbox_event_json(existing);
  end if;
  select nutritionist_id, user_id into nutri, recipient from public.patients where id = pid;
  skip_reason := public.outbox_patient_skip(pid);
  insert into public.outbox_events(
    event_type, patient_id, nutritionist_id, actor_id, client_id, dedupe_key, payload
  ) values (
    etype, pid, nutri, auth.uid(), cid, dkey,
    jsonb_build_object('subject', subject, 'body', body, 'kind', kind)
  ) returning * into created;

  foreach channel in array array['in_app','email','push']
  loop
    pref_on := public.outbox_pref_on(recipient, channel);
    reason := skip_reason;
    sent := null;
    if reason is not null then
      status := 'skipped';
    elsif not pref_on then
      status := 'skipped';
      reason := 'pref_off';
    elsif channel = 'in_app' then
      status := 'sent';
      sent := clock_timestamp();
    else
      status := 'queued';
      reason := null;
    end if;
    insert into public.notification_deliveries(
      outbox_event_id, channel, recipient_user_id, status, skip_reason, sent_at, next_attempt_at
    ) values (
      created.id, channel, recipient, status, reason, sent,
      case when status = 'queued' then clock_timestamp() else null end
    );
  end loop;
  return public.outbox_event_json(created);
end; $$;

create or replace function public.process_outbox_deliveries(input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  processed jsonb := '[]'::jsonb;
  d public.notification_deliveries;
  e public.outbox_events;
  lim int;
  backoff interval;
begin
  if jsonb_typeof(input) is distinct from 'object' or octet_length(input::text) > 4000 then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(input) k
    where k not in ('limit','delivery_id')
  ) then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  lim := coalesce((input->>'limit')::int, 20);
  if lim < 1 or lim > 50 then
    lim := 20;
  end if;
  for d in
    select nd.*
    from public.notification_deliveries nd
    join public.outbox_events ev on ev.id = nd.outbox_event_id
    where nd.status = 'queued'
      and (nd.next_attempt_at is null or nd.next_attempt_at <= clock_timestamp())
      and (
        input->>'delivery_id' is null
        or nd.id = (input->>'delivery_id')::uuid
      )
      and (
        public.is_assigned_patient(ev.patient_id)
        or public.my_patient_id() is not distinct from ev.patient_id
      )
    order by nd.created_at
    limit lim
  loop
    select * into e from public.outbox_events where id = d.outbox_event_id;
    if d.channel in ('email', 'push') then
      -- Fail closed: no hay adaptador. Nunca status=sent. No quema reintentos.
      update public.notification_deliveries
        set last_error = 'provider_unconfigured',
            next_attempt_at = clock_timestamp() + interval '1 hour'
        where id = d.id
        returning * into d;
    elsif d.channel = 'in_app' then
      update public.notification_deliveries
        set status = 'sent',
            sent_at = coalesce(sent_at, clock_timestamp()),
            last_error = null,
            next_attempt_at = null
        where id = d.id
        returning * into d;
    else
      backoff := (least(60, 0.5 * (2 ^ greatest(d.attempt, 0)))::text || ' seconds')::interval;
      if d.attempt + 1 >= d.max_attempts then
        update public.notification_deliveries
          set status = 'failed',
              attempt = attempt + 1,
              last_error = coalesce(last_error, 'max_attempts'),
              next_attempt_at = null
          where id = d.id
          returning * into d;
      else
        update public.notification_deliveries
          set attempt = attempt + 1,
              last_error = coalesce(last_error, 'retry'),
              next_attempt_at = clock_timestamp() + backoff
          where id = d.id
          returning * into d;
      end if;
    end if;
    processed := processed || public.outbox_delivery_json(d);
  end loop;
  return jsonb_build_object('deliveries', processed);
end; $$;

create or replace function public.save_notification_preferences(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid;
  prefs public.notification_preferences;
begin
  uid := auth.uid();
  if uid is null then
    raise exception using errcode='42501', message='outbox_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 1000 then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('in_app','email','push')
  ) then
    raise exception using errcode='22023', message='outbox_invalid';
  end if;
  if jsonb_typeof(payload->'in_app') is distinct from 'boolean'
    or jsonb_typeof(payload->'email') is distinct from 'boolean'
    or jsonb_typeof(payload->'push') is distinct from 'boolean' then
    raise exception using errcode='22023', message='outbox_prefs';
  end if;
  insert into public.notification_preferences(user_id, in_app, email, push)
  values (uid, (payload->>'in_app')::boolean, (payload->>'email')::boolean, (payload->>'push')::boolean)
  on conflict (user_id) do update
    set in_app = excluded.in_app,
        email = excluded.email,
        push = excluded.push,
        updated_at = clock_timestamp()
  returning * into prefs;
  return jsonb_build_object(
    'in_app', prefs.in_app,
    'email', prefs.email,
    'push', prefs.push
  );
end; $$;

create or replace function public.get_notification_preferences()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  uid uuid;
  prefs public.notification_preferences;
begin
  uid := auth.uid();
  if uid is null then
    raise exception using errcode='42501', message='outbox_forbidden';
  end if;
  select * into prefs from public.notification_preferences where user_id = uid;
  if not found then
    return jsonb_build_object('in_app', true, 'email', false, 'push', false);
  end if;
  return jsonb_build_object('in_app', prefs.in_app, 'email', prefs.email, 'push', prefs.push);
end; $$;

create or replace function public.list_outbox_mailbox(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  return public.outbox_mailbox_json(target_patient);
end; $$;

create or replace function public.list_outbox_snapshot(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  rows jsonb;
begin
  perform public.outbox_assert_access(target_patient);
  select coalesce(jsonb_agg(public.outbox_event_json(e) order by e.created_at desc), '[]'::jsonb)
    into rows
  from public.outbox_events e
  where e.patient_id = target_patient;
  return jsonb_build_object('events', rows);
end; $$;

revoke all on function public.outbox_assert_access(uuid) from public, anon;
revoke all on function public.outbox_patient_skip(uuid) from public, anon;
revoke all on function public.outbox_pref_on(uuid, text) from public, anon;
revoke all on function public.outbox_delivery_json(public.notification_deliveries) from public, anon;
revoke all on function public.outbox_event_json(public.outbox_events) from public, anon;
revoke all on function public.outbox_mailbox_json(uuid) from public, anon;
revoke all on function public.enqueue_outbox_event(jsonb) from public, anon;
revoke all on function public.process_outbox_deliveries(jsonb) from public, anon;
revoke all on function public.save_notification_preferences(jsonb) from public, anon;
revoke all on function public.get_notification_preferences() from public, anon;
revoke all on function public.list_outbox_mailbox(uuid) from public, anon;
revoke all on function public.list_outbox_snapshot(uuid) from public, anon;

grant execute on function public.outbox_assert_access(uuid) to authenticated;
grant execute on function public.enqueue_outbox_event(jsonb) to authenticated;
grant execute on function public.process_outbox_deliveries(jsonb) to authenticated;
grant execute on function public.save_notification_preferences(jsonb) to authenticated;
grant execute on function public.get_notification_preferences() to authenticated;
grant execute on function public.list_outbox_mailbox(uuid) to authenticated;
grant execute on function public.list_outbox_snapshot(uuid) to authenticated;
