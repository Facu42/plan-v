-- PV-31: pedidos ARCO, paquete de exportación, registro de accesos y
-- desactivación lógica. Escrituras sólo por RPC nuevas (no insert directo
-- a privacy_requests). Solo Postgres vacío/descartable.
-- apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

alter table public.processing_jobs drop constraint if exists processing_jobs_kind_check;
alter table public.processing_jobs
  add constraint processing_jobs_kind_check
  check (kind in ('menu_draft', 'recipe_draft', 'purge_asset', 'fail', 'privacy_export', 'privacy_delete'));

create table if not exists public.privacy_export_packages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.privacy_requests(id) on delete cascade,
  patient_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  downloaded_at timestamptz,
  check (jsonb_typeof(payload) = 'object')
);

create table if not exists public.privacy_access_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid,
  actor_role text not null default 'paciente',
  action text not null,
  object_type text not null,
  object_id text,
  category text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object')
);

create index if not exists privacy_requests_patient_idx
  on public.privacy_requests (patient_id, requested_at desc);
create index if not exists privacy_access_patient_idx
  on public.privacy_access_events (patient_id, created_at desc);

alter table public.privacy_export_packages enable row level security;
alter table public.privacy_access_events enable row level security;
revoke all on public.privacy_export_packages, public.privacy_access_events from public, anon, authenticated;

create or replace function public.privacy_assert_patient(target uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare pid uuid;
begin
  pid := public.my_patient_id();
  if pid is null or pid is distinct from target then
    raise exception using errcode='42501', message='privacy_forbidden';
  end if;
  return pid;
end; $$;

create or replace function public.privacy_request_json(rid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', r.id,
    'patient_id', r.patient_id,
    'kind', r.kind,
    'status', r.status,
    'requested_at', r.requested_at,
    'due_at', r.due_at,
    'completed_at', r.completed_at,
    'notes', r.notes,
    'package_expires_at', (
      select p.expires_at from public.privacy_export_packages p where p.request_id = r.id
    )
  )
  from public.privacy_requests r
  where r.id = rid;
$$;

create or replace function public.request_privacy_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  target uuid;
  kind text;
  pid uuid;
  rid uuid;
  existing public.privacy_requests;
  stamp timestamptz := clock_timestamp();
begin
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception using errcode='22023', message='privacy_payload';
  end if;
  begin
    target := (payload->>'patient_id')::uuid;
  exception when others then
    raise exception using errcode='22023', message='privacy_payload';
  end;
  kind := payload->>'kind';
  if kind not in ('export', 'delete', 'correction') then
    raise exception using errcode='22023', message='privacy_kind';
  end if;
  pid := public.privacy_assert_patient(target);

  if kind = 'delete' then
    update public.patients
      set deactivated_at = coalesce(deactivated_at, stamp),
          deletion_requested_at = coalesce(deletion_requested_at, stamp)
    where id = pid;
  end if;

  if kind = 'delete' then
    select * into existing
    from public.privacy_requests
    where patient_id = pid and kind = 'delete'
    order by requested_at desc
    limit 1;
    if found and existing.status in ('requested', 'in_progress', 'completed') then
      return public.privacy_request_json(existing.id);
    end if;
  end if;

  rid := gen_random_uuid();
  insert into public.privacy_requests(id, patient_id, kind, status, requested_at, due_at, notes)
  values (
    rid,
    pid,
    kind,
    case when kind = 'correction' then 'requested' else 'in_progress' end,
    stamp,
    stamp + interval '30 days',
    coalesce(payload->>'notes', '')
  );
  return public.privacy_request_json(rid);
end; $$;

create or replace function public.list_privacy_requests(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform public.privacy_assert_patient(target_patient);
  return coalesce((
    select jsonb_agg(public.privacy_request_json(r.id) order by r.requested_at desc)
    from public.privacy_requests r
    where r.patient_id = target_patient
  ), '[]'::jsonb);
end; $$;

create or replace function public.complete_privacy_export(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  rid uuid;
  pid uuid;
  req public.privacy_requests;
  pkg jsonb;
  expires timestamptz;
begin
  begin
    rid := (payload->>'request_id')::uuid;
  exception when others then
    raise exception using errcode='22023', message='privacy_payload';
  end;
  pkg := payload->'package';
  if pkg is null or jsonb_typeof(pkg) is distinct from 'object' then
    raise exception using errcode='22023', message='privacy_package';
  end if;
  if pkg ? 'clinical_notes' or pkg ? 'adherence_why' or pkg ? 'ai_artifacts' then
    raise exception using errcode='22023', message='privacy_forbidden_fields';
  end if;
  select * into req from public.privacy_requests where id = rid for update;
  if not found then
    raise exception using errcode='PT404', message='privacy_missing';
  end if;
  pid := public.privacy_assert_patient(req.patient_id);
  if req.kind is distinct from 'export' then
    raise exception using errcode='22023', message='privacy_kind';
  end if;
  expires := clock_timestamp() + interval '15 minutes';
  insert into public.privacy_export_packages(request_id, patient_id, payload, expires_at)
  values (rid, pid, pkg, expires)
  on conflict (request_id) do update
    set payload = excluded.payload, expires_at = excluded.expires_at, downloaded_at = null;
  update public.privacy_requests
    set status = 'completed', completed_at = clock_timestamp()
  where id = rid;
  return public.privacy_request_json(rid);
end; $$;

create or replace function public.get_privacy_package(target_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  req public.privacy_requests;
  pkg public.privacy_export_packages;
begin
  select * into req from public.privacy_requests where id = target_request;
  if not found then
    raise exception using errcode='PT404', message='privacy_missing';
  end if;
  perform public.privacy_assert_patient(req.patient_id);
  if req.kind is distinct from 'export' then
    raise exception using errcode='PT404', message='privacy_missing';
  end if;
  select * into pkg from public.privacy_export_packages where request_id = req.id;
  if not found then
    raise exception using errcode='PT404', message='privacy_missing';
  end if;
  if pkg.expires_at <= clock_timestamp() then
    raise exception using errcode='PT404', message='privacy_expired';
  end if;
  update public.privacy_export_packages set downloaded_at = clock_timestamp() where id = pkg.id;
  return jsonb_build_object(
    'request', public.privacy_request_json(req.id),
    'package', pkg.payload,
    'expires_at', pkg.expires_at
  );
end; $$;

create or replace function public.complete_privacy_delete(target_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  req public.privacy_requests;
begin
  select * into req from public.privacy_requests where id = target_request for update;
  if not found then
    raise exception using errcode='PT404', message='privacy_missing';
  end if;
  perform public.privacy_assert_patient(req.patient_id);
  if req.kind is distinct from 'delete' then
    raise exception using errcode='22023', message='privacy_kind';
  end if;
  update public.patients
    set deactivated_at = coalesce(deactivated_at, clock_timestamp()),
        deletion_requested_at = coalesce(deletion_requested_at, clock_timestamp())
  where id = req.patient_id;
  update public.privacy_requests
    set status = 'completed', completed_at = coalesce(completed_at, clock_timestamp())
  where id = req.id;
  return public.privacy_request_json(req.id);
end; $$;

create or replace function public.record_privacy_access(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  target uuid;
  pid uuid;
  eid uuid;
begin
  begin
    target := (payload->>'patient_id')::uuid;
  exception when others then
    raise exception using errcode='22023', message='privacy_payload';
  end;
  pid := public.privacy_assert_patient(target);
  eid := gen_random_uuid();
  insert into public.privacy_access_events(id, patient_id, actor_role, action, object_type, object_id, category, metadata)
  values (
    eid,
    pid,
    'paciente',
    coalesce(nullif(payload->>'action', ''), 'access'),
    coalesce(nullif(payload->>'object_type', ''), 'privacy'),
    nullif(payload->>'object_id', ''),
    nullif(payload->>'category', ''),
    jsonb_build_object('persistent', true)
  );
  return jsonb_build_object('id', eid, 'patient_id', pid, 'created_at', clock_timestamp());
end; $$;

revoke all on function
  public.privacy_assert_patient(uuid),
  public.privacy_request_json(uuid),
  public.request_privacy_action(jsonb),
  public.list_privacy_requests(uuid),
  public.complete_privacy_export(jsonb),
  public.get_privacy_package(uuid),
  public.complete_privacy_delete(uuid),
  public.record_privacy_access(jsonb)
from public, anon;

grant execute on function
  public.request_privacy_action(jsonb),
  public.list_privacy_requests(uuid),
  public.complete_privacy_export(jsonb),
  public.get_privacy_package(uuid),
  public.complete_privacy_delete(uuid),
  public.record_privacy_access(jsonb)
to authenticated;
