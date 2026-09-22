-- PV-23: hilos 1:1, client_id idempotente, recibos de entrega/lectura por persona.
-- Mensajes siguen inmutables. Recibos mutables sólo vía RPC (primera marca queda).
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

alter table public.messages
  add column if not exists client_id uuid;

create unique index if not exists messages_patient_client_uidx
  on public.messages (patient_id, client_id)
  where client_id is not null;

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id)
);

create index if not exists message_receipts_user_idx
  on public.message_receipts (user_id, read_at);

alter table public.message_receipts enable row level security;

revoke all on public.message_receipts from public, anon, authenticated;
grant select on public.message_receipts to authenticated;

create policy message_receipts_thread_select on public.message_receipts
  for select to authenticated
  using (exists (
    select 1
    from public.messages m
    where m.id = message_id
      and (
        public.is_assigned_patient(m.patient_id)
        or m.patient_id is not distinct from public.my_patient_id()
      )
  ));

create or replace function public.thread_assert_access(target uuid)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='thread_forbidden';
  end if;
  if public.is_assigned_patient(target) then
    return;
  end if;
  if public.my_patient_id() is not distinct from target then
    return;
  end if;
  raise exception using errcode='42501', message='thread_forbidden';
end; $$;

create or replace function public.thread_message_json(mid uuid, include_ai boolean)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  m public.messages;
  patient_user uuid;
  nutri_user uuid;
  counterpart uuid;
  delivered timestamptz;
  read_ts timestamptz;
  from_role text;
  result jsonb;
begin
  select * into m from public.messages where id = mid;
  if not found then
    return null;
  end if;
  select p.user_id, n.user_id
    into patient_user, nutri_user
  from public.patients p
  join public.nutritionists n on n.id = p.nutritionist_id
  where p.id = m.patient_id
    and p.nutritionist_id = m.nutritionist_id;
  if m.author_id is not distinct from patient_user then
    from_role := 'patient';
    counterpart := nutri_user;
  else
    from_role := 'vero';
    counterpart := patient_user;
  end if;
  if counterpart is not null then
    select r.delivered_at, r.read_at
      into delivered, read_ts
    from public.message_receipts r
    where r.message_id = m.id
      and r.user_id = counterpart;
  end if;
  result := jsonb_build_object(
    'id', m.id,
    'patient_id', m.patient_id,
    'from', from_role,
    'text', m.body,
    'sent_at', m.sent_at,
    'delivered_at', delivered,
    'read_at', read_ts
  );
  if include_ai then
    result := result || jsonb_build_object('suggested_by_ai', m.suggested_by_ai);
  end if;
  return result;
end; $$;

create or replace function public.send_thread_message(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  cid uuid;
  body text;
  ai_flag boolean;
  existing public.messages;
  created public.messages;
  patient_user uuid;
  nutri_user uuid;
  nutri_id uuid;
  counterpart uuid;
  include_ai boolean;
begin
  if auth.uid() is null then
    raise exception using errcode='42501', message='thread_forbidden';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 8000 then
    raise exception using errcode='22023', message='thread_invalid';
  end if;
  if exists (
    select 1 from jsonb_object_keys(payload) k
    where k not in ('patient_id','client_id','text','suggested_by_ai')
  ) then
    raise exception using errcode='22023', message='thread_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='thread_invalid';
  end;
  if pid is null or cid is null then
    raise exception using errcode='22023', message='thread_invalid';
  end if;
  perform public.thread_assert_access(pid);
  if jsonb_typeof(payload->'text') is distinct from 'string' then
    raise exception using errcode='22023', message='thread_text';
  end if;
  body := btrim(payload->>'text');
  if char_length(body) not between 1 and 2000 then
    raise exception using errcode='22023', message='thread_text';
  end if;
  include_ai := public.is_assigned_patient(pid);
  ai_flag := include_ai and coalesce((payload->>'suggested_by_ai')::boolean, false);
  select p.user_id, n.user_id, p.nutritionist_id
    into patient_user, nutri_user, nutri_id
  from public.patients p
  join public.nutritionists n on n.id = p.nutritionist_id
  where p.id = pid;
  if nutri_id is null then
    raise exception using errcode='PT404', message='thread_missing';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text || ':msg:' || cid::text, 0));
  select * into existing from public.messages where patient_id = pid and client_id = cid;
  if found then
    return jsonb_build_object('message', public.thread_message_json(existing.id, include_ai), 'duplicate', true);
  end if;
  insert into public.messages (
    nutritionist_id, patient_id, author_id, body, suggested_by_ai, sent_at, client_id
  ) values (
    nutri_id, pid, auth.uid(), body, ai_flag, clock_timestamp(), cid
  ) returning * into created;
  if created.author_id is not distinct from patient_user then
    counterpart := nutri_user;
  else
    counterpart := patient_user;
  end if;
  if counterpart is not null then
    insert into public.message_receipts (message_id, user_id, delivered_at, read_at)
    values (created.id, counterpart, null, null)
    on conflict (message_id, user_id) do nothing;
  end if;
  return jsonb_build_object('message', public.thread_message_json(created.id, include_ai), 'duplicate', false);
end; $$;

create or replace function public.list_thread_messages(target_patient uuid, ack_delivery boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  include_ai boolean;
begin
  perform public.thread_assert_access(target_patient);
  include_ai := public.is_assigned_patient(target_patient);
  if coalesce(ack_delivery, false) then
    insert into public.message_receipts (message_id, user_id, delivered_at, read_at)
    select m.id, auth.uid(), clock_timestamp(), null
    from public.messages m
    where m.patient_id = target_patient
      and m.sent_at is not null
      and m.author_id is distinct from auth.uid()
    on conflict (message_id, user_id) do update
      set delivered_at = coalesce(public.message_receipts.delivered_at, excluded.delivered_at);
  end if;
  return coalesce((
    select jsonb_agg(public.thread_message_json(x.id, include_ai) order by x.sent_at desc)
    from (
      select id, sent_at
      from public.messages
      where patient_id = target_patient
        and sent_at is not null
      order by sent_at desc
      limit 50
    ) x
  ), '[]'::jsonb);
end; $$;

create or replace function public.ack_thread_delivery(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  return public.list_thread_messages(target_patient, true);
end; $$;

create or replace function public.mark_thread_read(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  include_ai boolean;
begin
  perform public.thread_assert_access(target_patient);
  include_ai := public.is_assigned_patient(target_patient);
  insert into public.message_receipts (message_id, user_id, delivered_at, read_at)
  select m.id, auth.uid(), clock_timestamp(), clock_timestamp()
  from public.messages m
  where m.patient_id = target_patient
    and m.sent_at is not null
    and m.author_id is distinct from auth.uid()
  on conflict (message_id, user_id) do update
    set delivered_at = coalesce(public.message_receipts.delivered_at, excluded.delivered_at),
        read_at = coalesce(public.message_receipts.read_at, excluded.read_at);
  return coalesce((
    select jsonb_agg(public.thread_message_json(x.id, include_ai) order by x.sent_at desc)
    from (
      select id, sent_at
      from public.messages
      where patient_id = target_patient
        and sent_at is not null
      order by sent_at desc
      limit 50
    ) x
  ), '[]'::jsonb);
end; $$;

revoke all on function public.thread_assert_access(uuid),
  public.thread_message_json(uuid, boolean),
  public.send_thread_message(jsonb),
  public.list_thread_messages(uuid, boolean),
  public.ack_thread_delivery(uuid),
  public.mark_thread_read(uuid)
from public, anon;

grant execute on function public.send_thread_message(jsonb),
  public.list_thread_messages(uuid, boolean),
  public.ack_thread_delivery(uuid),
  public.mark_thread_read(uuid)
to authenticated;
