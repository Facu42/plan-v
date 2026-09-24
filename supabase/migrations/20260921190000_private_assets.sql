-- PV-15: manifiesto de archivos privados, intención/cuarentena y bucket de cuarentena.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No crear estos buckets en un proyecto hospedado con pacientes.

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.patient_assets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%bucket%'
  loop
    execute format('alter table public.patient_assets drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.patient_assets
  add column if not exists category text not null default 'meal_photo',
  add column if not exists mime text not null default 'image/jpeg',
  add column if not exists byte_size int not null default 0,
  add column if not exists checksum_sha256 text,
  add column if not exists status text not null default 'ready',
  add column if not exists captured_on date,
  add column if not exists withdrawn_at timestamptz;

alter table public.patient_assets drop constraint if exists patient_assets_category_check;
alter table public.patient_assets add constraint patient_assets_category_check
  check (category in ('meal_photo', 'clinical_document', 'body_progress'));

alter table public.patient_assets drop constraint if exists patient_assets_bucket_check;
alter table public.patient_assets add constraint patient_assets_bucket_check
  check (bucket in ('meal-photos', 'care-photos', 'care-documents', 'care-quarantine'));

alter table public.patient_assets drop constraint if exists patient_assets_status_check;
alter table public.patient_assets add constraint patient_assets_status_check
  check (status in ('reserved', 'quarantine', 'ready', 'rejected', 'withdrawn'));

alter table public.patient_assets drop constraint if exists patient_assets_byte_size_check;
alter table public.patient_assets add constraint patient_assets_byte_size_check
  check (byte_size >= 0 and byte_size <= 20971520);

create table if not exists public.asset_upload_intents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  category text not null check (category in ('meal_photo', 'clinical_document', 'body_progress')),
  object_path text not null unique,
  mime_declared text not null,
  byte_limit int not null check (byte_limit > 0 and byte_limit <= 20971520),
  status text not null default 'reserved'
    check (status in ('reserved', 'quarantine', 'ready', 'rejected', 'withdrawn')),
  asset_id uuid references public.patient_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (object_path like 'patients/' || patient_id::text || '/q/' || id::text)
);

create index if not exists asset_upload_intents_patient_status_idx
  on public.asset_upload_intents (patient_id, status, expires_at);

alter table public.asset_upload_intents enable row level security;
revoke all on public.asset_upload_intents from public, anon, authenticated;
grant select on public.asset_upload_intents to authenticated;

create policy asset_upload_intents_nutri_select on public.asset_upload_intents
  for select
  using (nutritionist_id = public.my_nutritionist_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'care-quarantine',
  'care-quarantine',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_object_patient_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when object_name ~ '^[0-9a-f-]{36}/' then nullif(split_part(object_name, '/', 1), '')::uuid
    when object_name ~ '^patients/[0-9a-f-]{36}/' then nullif(split_part(object_name, '/', 2), '')::uuid
    else null
  end;
$$;

create policy care_quarantine_patient_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'care-quarantine'
    and public.storage_object_patient_id(name) = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id())
    and name ~ '^patients/[0-9a-f-]{36}/q/[0-9a-f-]{36}$'
  );

create policy care_quarantine_patient_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'care-quarantine'
    and public.storage_object_patient_id(name) = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id())
  );

create policy care_quarantine_patient_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'care-quarantine'
    and public.storage_object_patient_id(name) = public.my_patient_id()
  );

drop policy if exists care_photo_insert on storage.objects;
create policy care_photo_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'care-photos'
  and public.care_can_read(public.my_patient_id())
  and public.patient_has_full_access(public.my_patient_id())
  and public.care_consent(public.my_patient_id(), 'body_progress')
  and (
    (name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$' and split_part(name, '/', 1) = public.my_patient_id()::text)
    or (name ~ '^patients/[0-9a-f-]{36}/[0-9a-f-]{36}$' and split_part(name, '/', 2) = public.my_patient_id()::text)
  )
);

drop policy if exists care_document_insert on storage.objects;
create policy care_document_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'care-documents'
  and public.care_can_read(public.my_patient_id())
  and public.patient_has_full_access(public.my_patient_id())
  and public.care_consent(public.my_patient_id(), 'clinical_document')
  and (
    (name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$' and split_part(name, '/', 1) = public.my_patient_id()::text)
    or (name ~ '^patients/[0-9a-f-]{36}/[0-9a-f-]{36}$' and split_part(name, '/', 2) = public.my_patient_id()::text)
  )
);

drop policy if exists care_photo_read on storage.objects;
create policy care_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'care-photos' and (
    (
      public.storage_object_patient_id(name) = public.my_patient_id()
      and public.care_consent(public.my_patient_id(), 'body_progress')
    )
    or exists (
      select 1 from public.care_records r
      where r.data->>'path' = name
        and r.data->>'kind' = 'body_photo'
        and public.care_can_read(r.patient_id)
        and public.care_consent(r.patient_id, 'body_progress')
    )
    or (
      public.is_assigned_patient(public.storage_object_patient_id(name))
      and public.care_consent(public.storage_object_patient_id(name), 'body_progress')
    )
  )
);

drop policy if exists care_document_read on storage.objects;
create policy care_document_read on storage.objects for select to authenticated using (
  bucket_id = 'care-documents' and (
    (
      public.storage_object_patient_id(name) = public.my_patient_id()
      and public.care_consent(public.my_patient_id(), 'clinical_document')
    )
    or exists (
      select 1 from public.care_records r
      where r.data->>'path' = name
        and r.data->>'kind' = 'clinical_document'
        and public.care_can_read(r.patient_id)
        and public.care_consent(r.patient_id, 'clinical_document')
    )
    or (
      public.is_assigned_patient(public.storage_object_patient_id(name))
      and public.care_consent(public.storage_object_patient_id(name), 'clinical_document')
    )
  )
);

revoke all on function public.storage_object_patient_id(text) from public, anon;
grant execute on function public.storage_object_patient_id(text) to authenticated, service_role;
