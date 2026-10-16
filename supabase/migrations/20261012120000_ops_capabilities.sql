-- Comunicaciones: opt-in del titular, aislamiento y entregas sin reintento incierto.
-- Aditiva; no cambia datos clínicos. Rollback: deshabilitar WHATSAPP_ENABLED y conservar
-- tablas para auditoría. Retirar funciones/políticas sólo cuando no queden entregas activas.
create table public.ops_contact_preferences (
 patient_id uuid primary key references public.patients(id),
 phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 reminders boolean not null default false,
 broadcasts boolean not null default false,
 consent_version text not null check(consent_version='whatsapp.v1'),
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table public.ops_broadcasts (
 id uuid primary key default gen_random_uuid(),
 nutritionist_id uuid not null references public.nutritionists(id),
 request_key uuid not null,
 template text not null check(template ~ '^\w{1,100}$'),
 language text not null check(language ~ '^\w{2,10}$'),
 template_hash text not null check(template_hash ~ '^[a-f0-9]{64}$'),
 patient_ids uuid[] not null,
 created_at timestamptz not null default now(),
 unique(nutritionist_id,request_key)
);
create table public.ops_deliveries (
 id uuid primary key default gen_random_uuid(),
 broadcast_id uuid not null references public.ops_broadcasts(id),
 patient_id uuid not null references public.patients(id),
 state text not null default 'queued' check(state in ('queued','sending','accepted','failed','uncertain','skipped','cancelled')),
 token uuid, lease_until timestamptz, preference_revision bigint, provider_id text unique,
 delivery_status text check(delivery_status in ('sent','delivered','read','failed')),
 updated_at timestamptz not null default now(),
 unique(broadcast_id,patient_id)
);
create index ops_delivery_queue on public.ops_deliveries(state,updated_at);
create table public.ops_contact_events (
 id uuid primary key default gen_random_uuid(),patient_id uuid not null references public.patients(id),
 reminders boolean not null,broadcasts boolean not null,consent_version text not null,
 source text not null check(source in ('patient','whatsapp')),created_at timestamptz not null default now()
);
alter table public.ops_contact_events enable row level security;
revoke all on public.ops_contact_events from public,anon,authenticated;
grant all on public.ops_contact_events to service_role;
create table public.ops_delivery_events (
 provider_id text primary key check(length(provider_id)<=250),
 status text not null check(status in ('sent','delivered','read','failed')),
 updated_at timestamptz not null default now()
);
alter table public.ops_delivery_events enable row level security;
revoke all on public.ops_delivery_events from public,anon,authenticated;
grant all on public.ops_delivery_events to service_role;
alter table public.ops_contact_preferences enable row level security;
alter table public.ops_broadcasts enable row level security;
alter table public.ops_deliveries enable row level security;
-- Readers see operational metadata only; writes are functions, never professional opt-in.
create function public.ops_can_read_patient(p_patient uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patients p where p.id=p_patient and
 (p.user_id=auth.uid() or exists(select 1 from public.nutritionists n join public.profiles u on u.id=n.user_id
 where n.id=p.nutritionist_id and n.user_id=auth.uid() and u.role='nutri')))
$$;
create policy ops_preferences_read on public.ops_contact_preferences for select to authenticated using(public.ops_can_read_patient(patient_id));
create function public.ops_can_read_clinic(p_clinic uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.nutritionists n join public.profiles u on u.id=n.user_id where n.id=p_clinic and n.user_id=auth.uid() and u.role='nutri')
$$;
create policy ops_broadcasts_read on public.ops_broadcasts for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
create policy ops_deliveries_read on public.ops_deliveries for select to authenticated using(exists(
 select 1 from public.ops_broadcasts b where b.id=broadcast_id));
revoke all on public.ops_contact_preferences,public.ops_broadcasts,public.ops_deliveries from public,anon,authenticated;
grant select on public.ops_contact_preferences,public.ops_broadcasts,public.ops_deliveries to authenticated;
grant all on public.ops_contact_preferences,public.ops_broadcasts,public.ops_deliveries to service_role;
create function public.ops_set_preferences(p_patient uuid,p_phone text,p_reminders boolean,p_broadcasts boolean,p_version text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.patients p where p.id=p_patient and p.user_id=auth.uid()
 and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null)
 then raise exception using errcode='42501',message='patient_only'; end if;
 if p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' or p_version is distinct from 'whatsapp.v1'
 or p_reminders is null or p_broadcasts is null then raise exception using errcode='22023',message='preferences_invalid'; end if;
 insert into public.ops_contact_preferences(patient_id,phone,reminders,broadcasts,consent_version)
 values(p_patient,p_phone,p_reminders,p_broadcasts,p_version)
 on conflict(patient_id) do update set phone=excluded.phone,reminders=excluded.reminders,
 broadcasts=excluded.broadcasts,consent_version=excluded.consent_version,updated_at=now(),revision=public.ops_contact_preferences.revision+1;
 insert into public.ops_contact_events(patient_id,reminders,broadcasts,consent_version,source)
 values(p_patient,p_reminders,p_broadcasts,p_version,'patient');
 if not p_broadcasts then update public.ops_deliveries set state='cancelled',updated_at=now() where patient_id=p_patient and state='queued'; end if;
 select to_jsonb(c) into result from public.ops_contact_preferences c where c.patient_id=p_patient;
 return result;
end $$;
create function public.ops_create_broadcast(p_key uuid,p_template text,p_language text,p_patients uuid[],p_template_hash text default repeat('0',64)) returns uuid
language plpgsql security definer set search_path='' as $$
declare nid uuid; bid uuid; existing public.ops_broadcasts; ids uuid[];
begin
 select n.id into nid from public.nutritionists n join public.profiles u on u.id=n.user_id where n.user_id=auth.uid() and u.role='nutri';
 if nid is null then raise exception using errcode='42501',message='professional_only'; end if;
 if p_key is null or p_template is null or p_template !~ '^\w{1,100}$' or p_language is null or p_language !~ '^\w{2,10}$' or p_template_hash is null or p_template_hash !~ '^[a-f0-9]{64}$'
 or cardinality(p_patients) is null or cardinality(p_patients) not between 1 and 100
 then raise exception using errcode='22023',message='broadcast_invalid'; end if;
 select array_agg(distinct x order by x) into ids from unnest(p_patients) x;
 if exists(select 1 from unnest(ids) x left join public.patients p on p.id=x
 where p.id is null or p.nutritionist_id<>nid or p.archived_at is not null or p.deactivated_at is not null or p.anonymized_at is not null)
 then raise exception using errcode='42501',message='patient_scope'; end if;
 -- Same key/request is idempotent; changed content is a conflict, not a silently altered send.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text||p_key::text,0));
 select * into existing from public.ops_broadcasts where nutritionist_id=nid and request_key=p_key;
 if found then
  if existing.template<>p_template or existing.language<>p_language or existing.patient_ids<>ids or existing.template_hash<>p_template_hash
  then raise exception using errcode='23505',message='idempotency_conflict'; end if;
  return existing.id;
 end if;
 insert into public.ops_broadcasts(nutritionist_id,request_key,template,language,patient_ids,template_hash) values(nid,p_key,p_template,p_language,ids,p_template_hash) returning id into bid;
 insert into public.ops_deliveries(broadcast_id,patient_id,state)
 select bid,x,case when c.broadcasts and c.consent_version='whatsapp.v1' then 'queued' else 'skipped' end
 from unnest(ids) x left join public.ops_contact_preferences c on c.patient_id=x;
 return bid;
end $$;
create function public.ops_claim_delivery(p_nutritionist uuid,p_item uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.ops_deliveries; b public.ops_broadcasts; c public.ops_contact_preferences; result jsonb;
begin
 select * into d from public.ops_deliveries where id=p_item for update;
 if not found then return null; end if;
 select * into b from public.ops_broadcasts where id=d.broadcast_id and nutritionist_id=p_nutritionist;
 if not found then raise exception using errcode='42501',message='clinic_scope'; end if;
 if d.state='sending' and d.lease_until<now() then
  update public.ops_deliveries set state='uncertain',updated_at=now() where id=p_item; return null;
 end if;
 if d.state<>'queued' then return null; end if;
 select * into c from public.ops_contact_preferences where patient_id=d.patient_id;
 if not found or not c.broadcasts or c.consent_version<>'whatsapp.v1' or not exists(select 1 from public.patients p
 where p.id=d.patient_id and p.nutritionist_id=p_nutritionist and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null)
 then update public.ops_deliveries set state='cancelled',updated_at=now() where id=p_item; return null; end if;
 update public.ops_deliveries set state='sending',token=gen_random_uuid(),preference_revision=c.revision,lease_until=now()+interval '60 seconds',updated_at=now() where id=p_item returning * into d;
 return jsonb_build_object('token',d.token,'phone',c.phone,'template',b.template,'language',b.language,'template_hash',b.template_hash);
end $$;
create function public.ops_check_delivery(p_nutritionist uuid,p_item uuid,p_token uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ops_deliveries d join public.ops_broadcasts b on b.id=d.broadcast_id
 join public.patients p on p.id=d.patient_id join public.ops_contact_preferences c on c.patient_id=p.id
 where d.id=p_item and d.token=p_token and d.state='sending' and d.lease_until>=now()
 and b.nutritionist_id=p_nutritionist and p.nutritionist_id=p_nutritionist
 and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null
 and c.broadcasts and c.consent_version='whatsapp.v1' and c.revision=d.preference_revision)
$$;
create function public.ops_finish_delivery(p_item uuid,p_token uuid,p_state text,p_provider text) returns boolean
language plpgsql security definer set search_path='' as $$
declare count_rows integer;
begin
 if p_state not in ('accepted','failed','uncertain','cancelled') or (p_state='accepted' and (p_provider is null or length(p_provider)>250))
 then raise exception using errcode='22023',message='delivery_invalid'; end if;
 update public.ops_deliveries set state=p_state,provider_id=p_provider,lease_until=null,updated_at=now(),
 delivery_status=(select e.status from public.ops_delivery_events e where e.provider_id=p_provider)
 where id=p_item and token=p_token and state='sending' and lease_until>=now();
 get diagnostics count_rows=row_count; return count_rows=1;
end $$;
create function public.ops_whatsapp_event(p_provider text,p_status text,p_optout_phone text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_optout_phone is not null then
  insert into public.ops_contact_events(patient_id,reminders,broadcasts,consent_version,source)
  select patient_id,false,false,consent_version,'whatsapp' from public.ops_contact_preferences where phone=p_optout_phone and (reminders or broadcasts);
  update public.ops_contact_preferences set reminders=false,broadcasts=false,updated_at=now(),revision=revision+1 where phone=p_optout_phone;
  update public.ops_deliveries d set state='cancelled',updated_at=now() from public.ops_contact_preferences c
  where d.patient_id=c.patient_id and c.phone=p_optout_phone and d.state='queued';
 end if;
 if p_provider is not null and p_status in ('sent','delivered','read','failed') then
  insert into public.ops_delivery_events(provider_id,status) values(p_provider,p_status)
  on conflict(provider_id) do update set status=excluded.status,updated_at=now()
  where case excluded.status when 'read' then 5 when 'delivered' then 4 when 'sent' then 2 else 3 end
  > case public.ops_delivery_events.status when 'read' then 5 when 'delivered' then 4 when 'sent' then 2 else 3 end;
  update public.ops_deliveries set delivery_status=p_status,updated_at=now() where provider_id=p_provider
  and case p_status when 'read' then 5 when 'delivered' then 4 when 'sent' then 2 else 3 end
  > case delivery_status when 'read' then 5 when 'delivered' then 4 when 'sent' then 2 when 'failed' then 3 else 0 end;
 end if;
end $$;
revoke all on function public.ops_can_read_patient(uuid),public.ops_can_read_clinic(uuid),public.ops_set_preferences(uuid,text,boolean,boolean,text),
 public.ops_create_broadcast(uuid,text,text,uuid[],text),public.ops_claim_delivery(uuid,uuid),public.ops_check_delivery(uuid,uuid,uuid),
 public.ops_finish_delivery(uuid,uuid,text,text),public.ops_whatsapp_event(text,text,text) from public,anon,authenticated;
grant execute on function public.ops_can_read_patient(uuid),public.ops_can_read_clinic(uuid),public.ops_set_preferences(uuid,text,boolean,boolean,text),public.ops_create_broadcast(uuid,text,text,uuid[],text) to authenticated;
grant execute on function public.ops_claim_delivery(uuid,uuid),public.ops_check_delivery(uuid,uuid,uuid),public.ops_finish_delivery(uuid,uuid,text,text),public.ops_whatsapp_event(text,text,text) to service_role;
create table public.ops_clinic_settings (
 nutritionist_id uuid primary key references public.nutritionists(id),
 default_days integer not null default 30 check(default_days in (7,30,90)),
 updated_at timestamptz not null default now()
);
alter table public.ops_clinic_settings enable row level security;
create policy ops_settings_owner on public.ops_clinic_settings for all to authenticated
 using(public.ops_can_read_clinic(nutritionist_id)) with check(public.ops_can_read_clinic(nutritionist_id));
revoke all on public.ops_clinic_settings from public,anon,authenticated;
grant select,insert,update on public.ops_clinic_settings to authenticated;
grant all on public.ops_clinic_settings to service_role;
