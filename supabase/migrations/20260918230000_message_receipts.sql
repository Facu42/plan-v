-- PV-23: recibos de entrega y lectura. Los mensajes siguen inmutables.
create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id),
  check (read_at is null or delivered_at is not null)
);

create function public.thread_can_read(target uuid)
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

create function public.receipt_can_read(target_message uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.thread_can_read(m.patient_id)
  from public.messages m
  where m.id = target_message
$$;

alter table public.message_receipts enable row level security;

drop policy if exists message_receipts_select on public.message_receipts;
create policy message_receipts_select on public.message_receipts
  for select
  to authenticated
  using (public.receipt_can_read(public.message_receipts.message_id));

revoke all on public.message_receipts from public, anon, authenticated;
grant select on public.message_receipts to authenticated;

create function public.send_thread_message(
  thread_message_id uuid,
  target uuid,
  body_value text,
  suggested_flag boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.messages;
  result public.messages;
  nutri_id uuid;
  patient_user uuid;
  nutri_user uuid;
  recipient uuid;
  clean_body text;
  suggested boolean;
begin
  if not public.thread_can_read(target) then
    raise exception using errcode = '42501', message = 'thread_forbidden';
  end if;
  clean_body := btrim(body_value);
  if clean_body is null or clean_body = '' or char_length(clean_body) > 2000 then
    raise exception using errcode = '22023', message = 'thread_body';
  end if;
  select p.nutritionist_id, p.user_id, n.user_id
    into nutri_id, patient_user, nutri_user
  from public.patients p
  join public.nutritionists n on n.id = p.nutritionist_id
  where p.id = target;
  if nutri_id is null then
    raise exception using errcode = 'PT404', message = 'thread_patient';
  end if;
  suggested := coalesce(suggested_flag, false) and auth.uid() is not distinct from nutri_user;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(thread_message_id::text, 0));
  select * into existing from public.messages where id = thread_message_id;
  if found then
    if existing.patient_id <> target
      or existing.author_id is distinct from auth.uid()
      or existing.body is distinct from clean_body
      or existing.suggested_by_ai is distinct from suggested
    then
      raise exception using errcode = 'PT409', message = 'thread_id_conflict';
    end if;
    return to_jsonb(existing);
  end if;
  insert into public.messages (
    id, nutritionist_id, patient_id, author_id, body, suggested_by_ai, sent_at
  ) values (
    thread_message_id, nutri_id, target, auth.uid(), clean_body, suggested, clock_timestamp()
  ) returning * into result;
  recipient := case
    when auth.uid() is not distinct from patient_user then nutri_user
    else patient_user
  end;
  if recipient is not null then
    insert into public.message_receipts (message_id, user_id, delivered_at)
    values (result.id, recipient, clock_timestamp())
    on conflict (message_id, user_id) do nothing;
  end if;
  return to_jsonb(result);
end;
$$;

create function public.mark_thread_read(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.thread_can_read(target) then
    raise exception using errcode = '42501', message = 'thread_forbidden';
  end if;
  insert into public.message_receipts (message_id, user_id, delivered_at, read_at)
  select m.id, auth.uid(), clock_timestamp(), clock_timestamp()
  from public.messages m
  where m.patient_id = target
    and m.sent_at is not null
    and m.author_id is distinct from auth.uid()
  on conflict (message_id, user_id) do update
    set delivered_at = coalesce(public.message_receipts.delivered_at, excluded.delivered_at),
        read_at = coalesce(public.message_receipts.read_at, excluded.read_at);
end;
$$;

revoke all on function public.thread_can_read(uuid),
  public.receipt_can_read(uuid),
  public.send_thread_message(uuid, uuid, text, boolean),
  public.mark_thread_read(uuid)
  from public, anon;
grant execute on function public.thread_can_read(uuid),
  public.receipt_can_read(uuid),
  public.send_thread_message(uuid, uuid, text, boolean),
  public.mark_thread_read(uuid)
  to authenticated;
