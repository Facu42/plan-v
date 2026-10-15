-- Archivos privados PV-15: reserva, cuarentena, manifiesto ampliado.
-- Incremental sobre core/intake/care. No copia los contratos de revisión.

do $$ begin
  create type public.asset_category as enum ('meal_photo', 'clinical_document', 'body_progress');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_status as enum ('reserved', 'quarantine', 'ready', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.patient_assets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* 'bucket'
  loop
    execute format('alter table public.patient_assets drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.patient_assets
  add column if not exists category public.asset_category not null default 'meal_photo',
  add column if not exists status public.asset_status not null default 'ready',
  add column if not exists mime text,
  add column if not exists byte_size integer not null default 0 check (byte_size >= 0),
  add column if not exists checksum text;
alter table public.patient_assets
  add constraint patient_assets_bucket_check
  check (bucket in ('meal-photos', 'care-photos', 'clinical-documents', 'asset-quarantine'));

create table if not exists public.asset_upload_intents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  category public.asset_category not null,
  object_path text not null unique,
  mime_declared text not null,
  byte_limit integer not null check (byte_limit > 0),
  status public.asset_status not null default 'reserved',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (object_path like 'patients/' || patient_id::text || '/%'),
  check (status in ('reserved', 'quarantine', 'ready', 'rejected', 'withdrawn'))
);

alter table public.asset_upload_intents enable row level security;

drop policy if exists asset_intents_patient_insert on public.asset_upload_intents;
create policy asset_intents_patient_insert on public.asset_upload_intents
  for insert to authenticated
  with check (
    patient_id = public.my_patient_id()
    and public.patient_has_full_access(patient_id)
    and public.care_consent(patient_id, category::text)
  );

drop policy if exists asset_intents_select on public.asset_upload_intents;
create policy asset_intents_select on public.asset_upload_intents
  for select to authenticated
  using (patient_id = public.my_patient_id() or public.is_assigned_patient(patient_id));

drop policy if exists asset_intents_patient_update on public.asset_upload_intents;
create policy asset_intents_patient_update on public.asset_upload_intents
  for update to authenticated
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id))
  with check (patient_id = public.my_patient_id());

drop policy if exists patient_assets_patient_select on public.patient_assets;
create policy patient_assets_patient_select on public.patient_assets
  for select to authenticated
  using (
    patient_id = public.my_patient_id()
    and status = 'ready'
    and public.patient_has_full_access(patient_id)
    and public.care_consent(patient_id, category::text)
  );

revoke all on public.asset_upload_intents from public, anon, authenticated;
grant select, insert, update on public.asset_upload_intents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('asset-quarantine', 'asset-quarantine', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('clinical-documents', 'clinical-documents', false, 20971520, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists asset_quarantine_insert on storage.objects;
create policy asset_quarantine_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'asset-quarantine'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = public.my_patient_id()::text
    and public.patient_has_full_access(public.my_patient_id())
    and exists (
      select 1 from public.asset_upload_intents i
      where i.patient_id = public.my_patient_id()
        and i.object_path = name
        and i.status = 'reserved'
        and i.expires_at > now()
        and public.care_consent(i.patient_id, i.category::text)
    )
  );

drop policy if exists clinical_document_read on storage.objects;
create policy clinical_document_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinical-documents'
    and exists (
      select 1 from public.patient_assets a
      where a.object_path = name
        and a.bucket = 'clinical-documents'
        and a.status = 'ready'
        and public.care_can_read(a.patient_id)
        and public.care_consent(a.patient_id, 'clinical_document')
    )
  );

create or replace function public.reserve_asset_intent(
  target uuid,
  category_value public.asset_category,
  intent_id uuid,
  path text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  owner uuid;
  existing public.asset_upload_intents;
  created public.asset_upload_intents;
  declared text;
  limit_bytes integer;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() or not public.patient_has_full_access(target) then
    raise exception using errcode='42501', message='asset_patient_only';
  end if;
  if not public.care_consent(target, category_value::text) then
    raise exception using errcode='42501', message='asset_consent';
  end if;
  if path is distinct from ('patients/' || target::text || '/' || intent_id::text) then
    raise exception using errcode='22023', message='asset_path';
  end if;
  select nutritionist_id into owner from public.patients where id=target;
  if owner is null then raise exception using errcode='42501', message='asset_patient_only'; end if;
  declared := case when category_value='clinical_document' then 'application/pdf' else 'image/jpeg' end;
  limit_bytes := case
    when category_value='clinical_document' then 20971520
    when category_value='body_progress' then 5242880
    else 10485760
  end;
  select * into existing from public.asset_upload_intents where id=intent_id;
  if found then
    if existing.patient_id<>target or existing.category<>category_value or existing.object_path<>path then
      raise exception using errcode='PT409', message='asset_id_conflict';
    end if;
    return to_jsonb(existing);
  end if;
  insert into public.asset_upload_intents(
    id, patient_id, nutritionist_id, category, object_path, mime_declared, byte_limit, status, expires_at
  ) values (
    intent_id, target, owner, category_value, path, declared, limit_bytes, 'reserved', now() + interval '15 minutes'
  ) returning * into created;
  return to_jsonb(created);
end; $$;

create or replace function public.purge_expired_asset_intents() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     and current_user is distinct from 'service_role' then
    raise exception using errcode='42501', message='asset_service_only';
  end if;
  delete from public.asset_upload_intents
    where status in ('reserved', 'quarantine') and expires_at < now();
  get diagnostics n = row_count;
  return n;
end; $$;

revoke all on function public.reserve_asset_intent(uuid, public.asset_category, uuid, text) from public, anon;
grant execute on function public.reserve_asset_intent(uuid, public.asset_category, uuid, text) to authenticated;
revoke all on function public.purge_expired_asset_intents() from public, anon, authenticated;
grant execute on function public.purge_expired_asset_intents() to service_role;
