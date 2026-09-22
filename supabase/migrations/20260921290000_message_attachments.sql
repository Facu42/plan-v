-- PV-24: adjuntos de chat sólo via patient_assets autorizados (categoría chat_attachment).
-- Reusa el bucket care-documents. No crea buckets nuevos.
-- RPC nueva send_thread_attachment: no tocar send_thread_message (claves extra → 400 en hospedado).
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.patient_assets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%category%'
  loop
    execute format('alter table public.patient_assets drop constraint %I', r.conname);
  end loop;
  for r in
    select conname from pg_constraint
    where conrelid = 'public.asset_upload_intents'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%category%'
  loop
    execute format('alter table public.asset_upload_intents drop constraint %I', r.conname);
  end loop;
  for r in
    select conname from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%body%'
  loop
    execute format('alter table public.messages drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.patient_assets add constraint patient_assets_category_check
  check (category in ('meal_photo', 'clinical_document', 'body_progress', 'chat_attachment'));

alter table public.asset_upload_intents add constraint asset_upload_intents_category_check
  check (category in ('meal_photo', 'clinical_document', 'body_progress', 'chat_attachment'));

alter table public.messages add constraint messages_body_len_check
  check (char_length(body) between 0 and 2000);

create table if not exists public.message_attachments (
  message_id uuid primary key references public.messages(id) on delete cascade,
  asset_id uuid not null unique references public.patient_assets(id),
  patient_id uuid not null,
  filename text not null check (char_length(btrim(filename)) between 1 and 80),
  created_at timestamptz not null default now(),
  foreign key (patient_id) references public.patients(id) on delete cascade
);

create index if not exists message_attachments_patient_idx
  on public.message_attachments (patient_id, created_at desc);

alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from public, anon, authenticated;
grant select on public.message_attachments to authenticated;

create policy message_attachments_thread_select on public.message_attachments
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or patient_id is not distinct from public.my_patient_id()
  );

create or replace function public.sanitize_chat_filename(raw text, mime text)
returns text language plpgsql immutable set search_path='' as $$
declare
  stem text;
  ext text;
begin
  stem := coalesce(nullif(btrim(raw), ''), 'adjunto');
  stem := regexp_replace(stem, '[\\/]+', '', 'g');
  stem := regexp_replace(stem, '[^A-Za-z0-9._ \-áéíóúñÁÉÍÓÚÑ]', '', 'g');
  stem := btrim(stem);
  stem := regexp_replace(stem, '\.[A-Za-z0-9]+$', '');
  if char_length(stem) < 1 then
    stem := 'adjunto';
  end if;
  stem := left(stem, 70);
  ext := case
    when mime = 'application/pdf' then '.pdf'
    when mime = 'image/png' then '.png'
    when mime = 'image/webp' then '.webp'
    else '.jpg'
  end;
  return stem || ext;
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
  att jsonb;
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
  select jsonb_build_object(
    'asset_id', a.id,
    'filename', ma.filename,
    'mime', a.mime,
    'byte_size', a.byte_size,
    'kind', case when a.mime like 'image/%' then 'image' else 'pdf' end,
    'available', a.status = 'ready' and a.withdrawn_at is null
  )
    into att
  from public.message_attachments ma
  join public.patient_assets a on a.id = ma.asset_id
  where ma.message_id = m.id;
  if att is not null then
    result := result || jsonb_build_object('attachment', att);
  end if;
  return result;
end; $$;

create or replace function public.send_thread_attachment(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pid uuid;
  cid uuid;
  aid uuid;
  body text;
  fname text;
  ai_flag boolean;
  existing public.messages;
  created public.messages;
  asset public.patient_assets;
  attached_id uuid;
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
    where k not in ('patient_id','client_id','text','suggested_by_ai','asset_id','filename')
  ) then
    raise exception using errcode='22023', message='thread_invalid';
  end if;
  begin
    pid := (payload->>'patient_id')::uuid;
    cid := (payload->>'client_id')::uuid;
    aid := (payload->>'asset_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode='22023', message='thread_invalid';
  end;
  if pid is null or cid is null or aid is null then
    raise exception using errcode='22023', message='thread_invalid';
  end if;
  perform public.thread_assert_access(pid);
  body := btrim(coalesce(payload->>'text', ''));
  if char_length(body) > 2000 then
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
  select * into asset from public.patient_assets where id = aid;
  if not found then
    raise exception using errcode='PT404', message='thread_attachment_missing';
  end if;
  if asset.patient_id is distinct from pid then
    raise exception using errcode='42501', message='thread_forbidden';
  end if;
  if asset.category is distinct from 'chat_attachment'
     or asset.status is distinct from 'ready'
     or asset.withdrawn_at is not null then
    raise exception using errcode='22023', message='thread_attachment';
  end if;
  fname := public.sanitize_chat_filename(payload->>'filename', asset.mime);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pid::text || ':msg:' || cid::text, 0));
  select * into existing from public.messages where patient_id = pid and client_id = cid;
  if found then
    select ma.asset_id into attached_id from public.message_attachments ma where ma.message_id = existing.id;
    if attached_id is distinct from aid then
      raise exception using errcode='PT409', message='thread_attachment_conflict';
    end if;
    return jsonb_build_object('message', public.thread_message_json(existing.id, include_ai), 'duplicate', true);
  end if;
  if exists (select 1 from public.message_attachments where asset_id = aid) then
    raise exception using errcode='PT409', message='thread_attachment_conflict';
  end if;
  insert into public.messages (
    nutritionist_id, patient_id, author_id, body, suggested_by_ai, sent_at, client_id
  ) values (
    nutri_id, pid, auth.uid(), body, ai_flag, clock_timestamp(), cid
  ) returning * into created;
  insert into public.message_attachments (message_id, asset_id, patient_id, filename)
  values (created.id, aid, pid, fname);
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

create or replace function public.open_message_attachment(target_patient uuid, target_message uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  att jsonb;
begin
  perform public.thread_assert_access(target_patient);
  select jsonb_build_object(
    'asset_id', a.id,
    'filename', ma.filename,
    'mime', a.mime,
    'byte_size', a.byte_size,
    'kind', case when a.mime like 'image/%' then 'image' else 'pdf' end
  )
    into att
  from public.message_attachments ma
  join public.messages m on m.id = ma.message_id
  join public.patient_assets a on a.id = ma.asset_id
  where ma.message_id = target_message
    and m.patient_id = target_patient
    and a.patient_id = target_patient
    and a.category = 'chat_attachment'
    and a.status = 'ready'
    and a.withdrawn_at is null;
  if att is null then
    raise exception using errcode='PT404', message='thread_attachment_missing';
  end if;
  return att;
end; $$;

revoke all on function public.sanitize_chat_filename(text, text),
  public.send_thread_attachment(jsonb),
  public.open_message_attachment(uuid, uuid)
from public, anon;

grant execute on function public.send_thread_attachment(jsonb),
  public.open_message_attachment(uuid, uuid)
to authenticated;
