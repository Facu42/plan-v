-- Ingreso autodeclarado, consentimiento versionado y revisión privada.
-- Todas las escrituras pasan por RPCs que validan identidad y revisión en una transacción.

create table public.consent_catalog (
  purpose text primary key,
  text_version text not null,
  text_hash text not null check (length(text_hash) = 64),
  body text not null,
  required boolean not null default false
);

create table public.intake_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients(id),
  schema_version text not null default 'intake.v1' check (schema_version = 'intake.v1'),
  status text not null default 'draft' check (status in ('draft','submitted','reviewed')),
  step text not null default 'start' check (step in ('start','privacy','profile','intent','allergies','habits','review')),
  revision integer not null default 1 check (revision > 0),
  payload jsonb not null default '{"preferred_name":"","timezone":"America/Argentina/Buenos_Aires","patient_intent":"","allergies":{"state":"unknown","items":[]},"restrictions":{"state":"unknown","items":[]},"prefers_to_discuss":false,"conditions_note":""}',
  submitted_revision integer,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (status = 'draft' or submitted_at is not null),
  check (status <> 'reviewed' or (reviewed_at is not null and reviewed_by is not null))
);

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  patient_id uuid not null references public.patients(id),
  purpose text not null references public.consent_catalog(purpose),
  text_version text not null,
  text_hash text not null,
  decision text not null check (decision in ('granted','withdrawn')),
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default clock_timestamp()
);
create index consent_events_patient_purpose_order on public.consent_events(patient_id,purpose,sequence desc);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  author_id uuid not null references public.profiles(id),
  version integer not null,
  body text not null check (length(btrim(body)) between 2 and 4000),
  created_at timestamptz not null default clock_timestamp(),
  unique(patient_id,version)
);

alter table public.consent_catalog enable row level security;
alter table public.intake_sessions enable row level security;
alter table public.consent_events enable row level security;
alter table public.clinical_notes enable row level security;
create policy consent_catalog_read on public.consent_catalog for select to authenticated using (true);
create policy intake_nutri_read on public.intake_sessions for select to authenticated using (public.is_assigned_patient(patient_id));
create policy consents_scoped_read on public.consent_events for select to authenticated
  using (patient_id = public.my_patient_id() or public.is_assigned_patient(patient_id));
create policy clinical_notes_nutri_read on public.clinical_notes for select to authenticated using (public.is_assigned_patient(patient_id));
revoke all on public.consent_catalog, public.intake_sessions, public.consent_events, public.clinical_notes from public, anon, authenticated;
grant select on public.consent_catalog, public.intake_sessions, public.consent_events, public.clinical_notes to authenticated;
-- Paciente sólo ve columnas públicas de su ingreso; nunca reviewer/notes mediante acceso directo.
create view public.intake_patient_view with (security_barrier = true) as
select id,patient_id,schema_version,status,step,revision,payload,submitted_at,updated_at
from public.intake_sessions where patient_id = public.my_patient_id();
grant select on public.intake_patient_view to authenticated;

create function public.intake_assert_access(target uuid, professional boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.patients p where p.id = target and p.deactivated_at is null and p.anonymized_at is null
      and (public.is_assigned_patient(p.id) or (not professional and p.id = public.my_patient_id()))
  ) then raise exception using errcode = '42501', message = 'intake_forbidden'; end if;
end; $$;

create function public.intake_validate_payload(value jsonb) returns void
language plpgsql set search_path = '' as $$
declare k text; fact jsonb; item jsonb; n numeric;
begin
  if jsonb_typeof(value) is distinct from 'object' or octet_length(value::text) > 16000 then
    raise exception using errcode='22023', message='intake_invalid_payload';
  end if;
  for k in select jsonb_object_keys(value) loop
    if k not in ('preferred_name','phone','timezone','patient_intent','allergies','restrictions','prefers_to_discuss','conditions_note','cooking_time_minutes','hydration_glasses','sleep_hours','energy') then
      raise exception using errcode='22023', message='intake_unknown_field';
    end if;
  end loop;
  foreach k in array array['preferred_name','patient_intent','conditions_note','timezone'] loop
    if jsonb_typeof(value->k) is distinct from 'string' or length(value->>k) > (case k when 'preferred_name' then 40 when 'patient_intent' then 500 when 'timezone' then 64 else 1000 end) then
      raise exception using errcode='22023', message='intake_invalid_text';
    end if;
  end loop;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name = value->>'timezone') then
    raise exception using errcode='22023', message='intake_invalid_timezone';
  end if;
  if value ? 'phone' and value->'phone' <> 'null'::jsonb and (jsonb_typeof(value->'phone') <> 'string' or length(value->>'phone') > 30) then
    raise exception using errcode='22023', message='intake_invalid_phone';
  end if;
  if jsonb_typeof(value->'prefers_to_discuss') is distinct from 'boolean' then raise exception using errcode='22023', message='intake_invalid_choice'; end if;
  foreach k in array array['allergies','restrictions'] loop
    fact := value->k;
    if jsonb_typeof(fact) is distinct from 'object' or not (fact->>'state' = any(array['unknown','none','reported'])) or fact->>'state' is null or jsonb_typeof(fact->'items') is distinct from 'array' then
      raise exception using errcode='22023', message='intake_invalid_health_fact';
    end if;
    if exists(select 1 from jsonb_object_keys(fact) key where key not in ('state','items')) or jsonb_array_length(fact->'items') > 30
      or (fact->>'state' = 'reported' and jsonb_array_length(fact->'items') = 0)
      or (fact->>'state' <> 'reported' and jsonb_array_length(fact->'items') <> 0) then
      raise exception using errcode='22023', message='intake_invalid_health_fact';
    end if;
    for item in select jsonb_array_elements(fact->'items') loop
      if jsonb_typeof(item) <> 'string' or length(btrim(item#>>'{}')) not between 1 and 80 then
        raise exception using errcode='22023', message='intake_invalid_health_item';
      end if;
    end loop;
  end loop;
  foreach k in array array['cooking_time_minutes','hydration_glasses','sleep_hours'] loop
    if value ? k and value->k <> 'null'::jsonb then
      if jsonb_typeof(value->k) <> 'number' then raise exception using errcode='22023', message='intake_invalid_number'; end if;
      n := (value->>k)::numeric;
      if n < 0 or n > (case k when 'cooking_time_minutes' then 300 when 'hydration_glasses' then 20 else 16 end) or (k <> 'sleep_hours' and trunc(n) <> n) then
        raise exception using errcode='22023', message='intake_invalid_number';
      end if;
    end if;
  end loop;
  if value ? 'energy' and value->'energy' <> 'null'::jsonb and not (value->>'energy' = any(array['Baja','Media','Alta'])) then raise exception using errcode='22023', message='intake_invalid_energy'; end if;
end; $$;

create function public.intake_bundle(target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; record public.intake_sessions; events jsonb; professional boolean;
begin
  perform public.intake_assert_access(target);
  select * into record from public.intake_sessions where patient_id = target;
  professional := public.is_assigned_patient(target);
  select coalesce(jsonb_agg(to_jsonb(e) - 'sequence' order by e.sequence), '[]'::jsonb) into events from (
    select distinct on (purpose) * from public.consent_events where patient_id=target order by purpose,sequence desc
  ) e;
  result := jsonb_build_object('intake',to_jsonb(record) - 'submitted_revision','consents',events);
  if professional then
    result := result || jsonb_build_object('clinical_notes', coalesce((select jsonb_agg(n order by version desc) from public.clinical_notes n where patient_id=target), '[]'::jsonb));
  else
    result := jsonb_set(result,'{intake}',(result->'intake') - 'reviewed_by' - 'reviewed_at');
  end if;
  return result;
end; $$;

create function public.get_patient_intake(target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.intake_assert_access(target);
  insert into public.intake_sessions(patient_id) values(target) on conflict(patient_id) do nothing;
  return public.intake_bundle(target);
end; $$;

create function public.save_patient_intake(target uuid, expected_revision integer, next_step text, patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_record public.intake_sessions; merged jsonb;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() then raise exception using errcode='42501',message='intake_patient_only'; end if;
  insert into public.intake_sessions(patient_id) values(target) on conflict(patient_id) do nothing;
  select * into current_record from public.intake_sessions where patient_id=target for update;
  if current_record.status <> 'draft' or current_record.revision is distinct from expected_revision then raise exception using errcode='PT409',message='intake_revision_conflict'; end if;
  if patch is not null and jsonb_typeof(patch) <> 'object' then raise exception using errcode='22023',message='intake_invalid_payload'; end if;
  merged := current_record.payload || coalesce(patch,'{}'::jsonb);
  perform public.intake_validate_payload(merged);
  if next_step is not null and next_step not in ('start','privacy','profile','intent','allergies','habits','review') then raise exception using errcode='22023',message='intake_invalid_step'; end if;
  update public.intake_sessions set payload=merged, step=coalesce(next_step,step), revision=revision+1, updated_at=clock_timestamp() where patient_id=target;
  return public.intake_bundle(target);
end; $$;

create function public.record_patient_consent(target uuid, purpose_value text, version_value text, hash_value text, decision_value text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare entry public.consent_events; current_text public.consent_catalog;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() then raise exception using errcode='42501',message='intake_patient_only'; end if;
  insert into public.intake_sessions(patient_id) values(target) on conflict(patient_id) do nothing;
  -- El consentimiento y el envío comparten la misma cerradura: no hay ventana TOCTOU.
  perform 1 from public.intake_sessions where patient_id=target for update;
  select * into current_text from public.consent_catalog where purpose=purpose_value;
  if not found or current_text.text_version is distinct from version_value or current_text.text_hash is distinct from hash_value then raise exception using errcode='PT409',message='consent_version_changed'; end if;
  if decision_value is null or decision_value not in ('granted','withdrawn') then raise exception using errcode='22023',message='consent_invalid_decision'; end if;
  select * into entry from public.consent_events where patient_id=target and purpose=purpose_value order by sequence desc limit 1;
  if found and entry.text_hash=hash_value and entry.decision=decision_value then return to_jsonb(entry)-'sequence'; end if;
  insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision,actor_id)
    values(target,purpose_value,version_value,hash_value,decision_value,auth.uid()) returning * into entry;
  return to_jsonb(entry)-'sequence';
end; $$;

create function public.submit_patient_intake(target uuid, expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_record public.intake_sessions; consent public.consent_events;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() then raise exception using errcode='42501',message='intake_patient_only'; end if;
  select * into current_record from public.intake_sessions where patient_id=target for update;
  if not found then raise exception using errcode='PT409',message='intake_not_started'; end if;
  if current_record.status <> 'draft' then
    if expected_revision in (current_record.submitted_revision,current_record.submitted_revision+1,current_record.revision) then return public.intake_bundle(target); end if;
    raise exception using errcode='PT409',message='intake_revision_conflict';
  end if;
  if current_record.revision is distinct from expected_revision then raise exception using errcode='PT409',message='intake_revision_conflict'; end if;
  perform public.intake_validate_payload(current_record.payload);
  if length(btrim(current_record.payload->>'preferred_name')) < 2 then raise exception using errcode='PT409',message='intake_name_required'; end if;
  select * into consent from public.consent_events where patient_id=target and purpose='care_relationship' order by sequence desc limit 1;
  if not found or consent.decision <> 'granted' or not exists(select 1 from public.consent_catalog c where c.purpose=consent.purpose and c.text_hash=consent.text_hash) then
    raise exception using errcode='PT409',message='intake_consent_required';
  end if;
  update public.intake_sessions set status='submitted',step='review',submitted_revision=revision,revision=revision+1,submitted_at=clock_timestamp(),updated_at=clock_timestamp() where patient_id=target;
  return public.intake_bundle(target);
end; $$;

create function public.review_patient_intake(target uuid, expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_record public.intake_sessions;
begin
  perform public.intake_assert_access(target,true);
  select * into current_record from public.intake_sessions where patient_id=target for update;
  if not found or current_record.status='draft' then raise exception using errcode='PT409',message='intake_not_submitted'; end if;
  if current_record.status='reviewed' and expected_revision in (current_record.revision,current_record.revision-1) then return public.intake_bundle(target); end if;
  if current_record.revision is distinct from expected_revision then raise exception using errcode='PT409',message='intake_revision_conflict'; end if;
  update public.intake_sessions set status='reviewed',reviewed_by=auth.uid(),reviewed_at=clock_timestamp(),revision=revision+1,updated_at=clock_timestamp() where patient_id=target;
  return public.intake_bundle(target);
end; $$;

create function public.add_patient_clinical_note(target uuid, note_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare note public.clinical_notes;
begin
  perform public.intake_assert_access(target,true);
  perform 1 from public.patients where id=target for update;
  if note_body is null or length(btrim(note_body)) not between 2 and 4000 then raise exception using errcode='22023',message='clinical_note_invalid'; end if;
  insert into public.clinical_notes(patient_id,author_id,version,body)
  select target,auth.uid(),coalesce(max(version),0)+1,btrim(note_body) from public.clinical_notes where patient_id=target returning * into note;
  return to_jsonb(note);
end; $$;

revoke all on function public.intake_assert_access(uuid,boolean),public.intake_validate_payload(jsonb),public.intake_bundle(uuid) from public,anon,authenticated;
revoke all on function public.get_patient_intake(uuid),public.save_patient_intake(uuid,integer,text,jsonb),public.record_patient_consent(uuid,text,text,text,text),public.submit_patient_intake(uuid,integer),public.review_patient_intake(uuid,integer),public.add_patient_clinical_note(uuid,text) from public,anon;
grant execute on function public.get_patient_intake(uuid),public.save_patient_intake(uuid,integer,text,jsonb),public.record_patient_consent(uuid,text,text,text,text),public.submit_patient_intake(uuid,integer),public.review_patient_intake(uuid,integer),public.add_patient_clinical_note(uuid,text) to authenticated;

-- Versiones aprobadas por la aplicación; verificar hash al actualizar textos.
insert into public.consent_catalog(purpose,text_version,text_hash,body,required) values
('care_relationship','care_relationship.v1','19b28d2ba3ceff84f95d217bb373bbe424df0cd7bcdd025b1a7bbf4736105d0b','Autorizo a mi nutricionista de Plan V a ver los datos que yo registre para el acompañamiento nutricional. Puedo pedir exportación o retiro más adelante.',true),
('meal_photo','meal_photo.v1','734ce767ba271c1b26b0d966d07eaa45f8d5567575b032c3b2ff30af5b857d6d','Puedo subir fotos de mis comidas para que mi nutricionista las revise. Son opcionales y las puedo dejar de usar.',false),
('clinical_document','clinical_document.v1','8506579b84f77edaf1af318777c48cd39dab6c9fccade91de2663ad6b7f451a9','Puedo compartir estudios en PDF o imagen. No se interpretan de forma automática.',false),
('body_progress','body_progress.v1','e551445b220fb79193e5ceabca2ab1174aae1e9f9e2774b93f933f833a7539b6','Las fotos corporales son opcionales, no se analizan con IA y no aparecen en listados ni avisos.',false),
('measurement','measurement.v1','313f1e09c6a1aa4558f762e549070eebf0ad240e57f5ada6b4bca37ca92b7f26','Puedo cargar peso o medidas con fecha y unidad. Son autodeclarados y opcionales.',false),
('ai_meal_analysis','ai_meal_analysis.v1','57292c738e43e642d013ad53621266a0e5f6fa1b553e87fd3c1ec330b1a37654','Si subo una foto de comida, Plan V puede pedir una estimación a un proveedor de IA. El resultado queda pendiente de revisión profesional.',false),
('ai_menu_draft','ai_menu_draft.v1','274e03a9265722d7404ecaa7c25f485fe446b55a9d1a296d7b9c8441640813a0','Mi nutricionista puede usar IA para proponer menús o recetas. Nada se publica ni se me envía sin su revisión.',false);
