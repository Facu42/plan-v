-- Same durable delivery queue, separate channel/purpose permissions. No external send in SQL.
create table public.ops_email_templates(id text primary key,subject text not null,body text not null,path text not null,content_hash text not null check(content_hash~'^[a-f0-9]{64}$'));
create table public.ops_email_broadcasts(id uuid primary key default gen_random_uuid(),nutritionist_id uuid not null references public.nutritionists(id),request_key uuid not null,template text not null references public.ops_email_templates(id),template_hash text not null,patient_ids uuid[] not null,created_at timestamptz not null default now(),unique(nutritionist_id,request_key));
create table public.ops_reminder_templates(nutritionist_id uuid primary key references public.nutritionists(id),template text not null,language text not null check(language='es_AR'),template_hash text not null check(template_hash='0af0af0776d07b80b5dc6036db82eabaffdee2207483a26c6adaaec392659184'),reviewed_by uuid not null references public.profiles(id),reviewed_at timestamptz not null default now());
create table public.ops_email_unsubscribe_tokens(token_hash text primary key check(token_hash~'^[a-f0-9]{64}$'),delivery_id uuid not null references public.ops_deliveries(id),user_id uuid not null references auth.users(id),expires_at timestamptz not null default now()+interval '180 days',used_at timestamptz);
alter table public.ops_deliveries alter column broadcast_id drop not null;
alter table public.ops_deliveries add column channel text not null default 'whatsapp' check(channel in('whatsapp','email')),
 add column kind text not null default 'broadcast' check(kind in('broadcast','reminder')),
 add column nutritionist_id uuid references public.nutritionists(id),add column email_broadcast_id uuid references public.ops_email_broadcasts(id),
 add column appointment_id uuid references public.appointments(id),add column appointment_starts_at timestamptz,
 add column recipient_user_id uuid references auth.users(id),add column destination_email text,add column preference_updated_at timestamptz;
update public.ops_deliveries d set nutritionist_id=b.nutritionist_id from public.ops_broadcasts b where b.id=d.broadcast_id;
-- Existing WA creators still omit clinic_id; derive it, do not trust caller-controlled scope.
create function public.ops_delivery_scope() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.broadcast_id is not null then select nutritionist_id into new.nutritionist_id from public.ops_broadcasts where id=new.broadcast_id;end if;
 return new;
end;$$;
create trigger ops_delivery_scope before insert on public.ops_deliveries for each row execute function public.ops_delivery_scope();
alter table public.ops_deliveries add constraint ops_delivery_purpose check(
 (kind='broadcast' and channel='whatsapp' and broadcast_id is not null and email_broadcast_id is null and appointment_id is null) or
 (kind='broadcast' and channel='email' and email_broadcast_id is not null and broadcast_id is null and appointment_id is null) or
 (kind='reminder' and appointment_id is not null and appointment_starts_at is not null and broadcast_id is null and email_broadcast_id is null));
create unique index ops_reminder_once on public.ops_deliveries(channel,appointment_id,appointment_starts_at) where kind='reminder';
create unique index ops_email_broadcast_once on public.ops_deliveries(email_broadcast_id,patient_id) where channel='email' and kind='broadcast';
alter table public.ops_email_templates enable row level security;alter table public.ops_email_broadcasts enable row level security;
alter table public.ops_reminder_templates enable row level security;alter table public.ops_email_unsubscribe_tokens enable row level security;
revoke all on public.ops_email_templates,public.ops_email_broadcasts,public.ops_reminder_templates,public.ops_email_unsubscribe_tokens from public,anon,authenticated;
grant all on public.ops_email_templates,public.ops_email_broadcasts,public.ops_reminder_templates,public.ops_email_unsubscribe_tokens to service_role;
grant select on public.ops_email_templates,public.ops_email_broadcasts,public.ops_reminder_templates to authenticated;
create policy ops_email_catalog_read on public.ops_email_templates for select to authenticated using(true);
create policy ops_email_broadcast_owner on public.ops_email_broadcasts for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
create policy ops_reminder_owner on public.ops_reminder_templates for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
drop policy ops_deliveries_read on public.ops_deliveries;
create policy ops_deliveries_read on public.ops_deliveries for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));

create function public.ops_care_active(pid uuid,nid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patients p where p.id=pid and p.nutritionist_id=nid and p.user_id is not null and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null)
 and coalesce((select e.decision='granted' and e.text_version=c.text_version and e.text_hash=c.text_hash from public.consent_events e join public.consent_catalog c on c.purpose=e.purpose where e.patient_id=pid and e.purpose='care_relationship' order by e.sequence desc limit 1),false);
$$;
create function public.ops_email_allowed(pid uuid,nid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.ops_care_active(pid,nid) and exists(select 1 from public.patients p join public.notification_preferences f on f.user_id=p.user_id join auth.users u on u.id=p.user_id where p.id=pid and f.email and u.email is not null and u.email_confirmed_at is not null);
$$;
create function public.ops_review_reminder_template(p_nutritionist uuid,p_template text,p_language text,p_hash text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.ops_can_read_clinic(p_nutritionist) then raise exception 'clinic_scope' using errcode='42501';end if;
 if p_template is null or p_template!~'^\w{1,100}$' or p_language is distinct from 'es_AR' or p_hash is distinct from '0af0af0776d07b80b5dc6036db82eabaffdee2207483a26c6adaaec392659184' then raise exception 'template_invalid' using errcode='22023';end if;
 insert into public.ops_reminder_templates(nutritionist_id,template,language,template_hash,reviewed_by)values(p_nutritionist,p_template,p_language,p_hash,auth.uid()) on conflict(nutritionist_id)do update set template=excluded.template,language=excluded.language,template_hash=excluded.template_hash,reviewed_by=auth.uid(),reviewed_at=clock_timestamp();
end;$$;
create function public.ops_create_email_broadcast(p_key uuid,p_template text,p_hash text,p_patients uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare nid uuid;ids uuid[];r public.ops_email_broadcasts;
begin
 select n.id into nid from public.nutritionists n join public.profiles p on p.id=n.user_id where n.user_id=auth.uid() and p.role='nutri';
 if nid is null then raise exception 'professional_only' using errcode='42501';end if;
 if p_key is null or cardinality(p_patients) is null or cardinality(p_patients) not between 1 and 100 or not exists(select 1 from public.ops_email_templates where id=p_template and content_hash=p_hash) then raise exception 'broadcast_invalid' using errcode='22023';end if;
 select array_agg(distinct v order by v) into ids from unnest(p_patients)v;
 if exists(select 1 from unnest(ids)v left join public.patients p on p.id=v where p.id is null or p.nutritionist_id<>nid or p.archived_at is not null or p.deactivated_at is not null or p.anonymized_at is not null) then raise exception 'patient_scope' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text||p_key::text,0));select * into r from public.ops_email_broadcasts where nutritionist_id=nid and request_key=p_key;
 if found then if r.template<>p_template or r.template_hash<>p_hash or r.patient_ids<>ids then raise exception 'idempotency_conflict' using errcode='23505';end if;return r.id;end if;
 insert into public.ops_email_broadcasts(nutritionist_id,request_key,template,template_hash,patient_ids)values(nid,p_key,p_template,p_hash,ids)returning * into r;
 insert into public.ops_deliveries(email_broadcast_id,nutritionist_id,patient_id,channel,kind,state)select r.id,nid,v,'email','broadcast',case when public.ops_email_allowed(v,nid) then 'queued' else 'skipped' end from unnest(ids)v;
 return r.id;
end;$$;
create function public.ops_enqueue_reminders(p_from timestamptz,p_to timestamptz,p_channel text) returns int language plpgsql security definer set search_path='' as $$
declare amount int;
begin
 if p_channel not in('email','whatsapp') or p_from is null or p_to is null or p_from>=p_to or p_to-p_from>interval '1 hour' or p_from<clock_timestamp() or p_to>clock_timestamp()+interval '90 days' then raise exception 'reminder_window' using errcode='22023';end if;
 insert into public.ops_deliveries(nutritionist_id,patient_id,channel,kind,appointment_id,appointment_starts_at)
 select a.nutritionist_id,a.patient_id,p_channel,'reminder',a.id,a.starts_at from public.appointments a
 where a.status='scheduled' and a.starts_at>=p_from and a.starts_at<p_to and public.ops_care_active(a.patient_id,a.nutritionist_id) and
 ((p_channel='email' and public.ops_email_allowed(a.patient_id,a.nutritionist_id)) or(p_channel='whatsapp' and exists(select 1 from public.ops_contact_preferences c join public.ops_reminder_templates t on t.nutritionist_id=a.nutritionist_id where c.patient_id=a.patient_id and c.reminders and c.consent_version='whatsapp.v1')))
 on conflict do nothing;get diagnostics amount=row_count;return amount;
end;$$;
create or replace function public.ops_claim_delivery(p_nutritionist uuid,p_item uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.ops_deliveries;c public.ops_contact_preferences;name text;lang text;hash text;email text;uid uuid;changed timestamptz;t public.ops_email_broadcasts;
begin
 select * into d from public.ops_deliveries where id=p_item for update;if not found then return null;end if;
 if d.nutritionist_id is distinct from p_nutritionist then raise exception 'clinic_scope' using errcode='42501';end if;
 if d.state='sending' and d.lease_until<clock_timestamp() then update public.ops_deliveries set state='uncertain',updated_at=clock_timestamp() where id=p_item;return null;end if;
 if d.state<>'queued' then return null;end if;
 if not public.ops_care_active(d.patient_id,p_nutritionist) or(d.kind='reminder' and not exists(select 1 from public.appointments where id=d.appointment_id and patient_id=d.patient_id and nutritionist_id=p_nutritionist and starts_at=d.appointment_starts_at and status='scheduled')) then update public.ops_deliveries set state='cancelled',updated_at=clock_timestamp() where id=p_item;return null;end if;
 if d.channel='whatsapp' then
  select * into c from public.ops_contact_preferences where patient_id=d.patient_id;
  if not found or c.consent_version<>'whatsapp.v1' or not(case when d.kind='reminder' then c.reminders else c.broadcasts end) then update public.ops_deliveries set state='cancelled',updated_at=clock_timestamp() where id=p_item;return null;end if;
  if d.kind='reminder' then select template,language,template_hash into name,lang,hash from public.ops_reminder_templates where nutritionist_id=p_nutritionist;else select template,language,template_hash into name,lang,hash from public.ops_broadcasts where id=d.broadcast_id;end if;
  if name is null then update public.ops_deliveries set state='cancelled' where id=p_item;return null;end if;
 else
  if not public.ops_email_allowed(d.patient_id,p_nutritionist) then update public.ops_deliveries set state='cancelled',updated_at=clock_timestamp() where id=p_item;return null;end if;
  select u.id,u.email,f.updated_at into uid,email,changed from public.patients p join auth.users u on u.id=p.user_id join public.notification_preferences f on f.user_id=u.id where p.id=d.patient_id;
  if d.kind='broadcast' then select * into t from public.ops_email_broadcasts where id=d.email_broadcast_id;name:=t.template;hash:=t.template_hash;end if;
 end if;
 update public.ops_deliveries set state='sending',token=gen_random_uuid(),preference_revision=c.revision,preference_updated_at=changed,recipient_user_id=uid,destination_email=email,lease_until=clock_timestamp()+interval '120 seconds',updated_at=clock_timestamp() where id=p_item returning * into d;
 return jsonb_build_object('token',d.token,'channel',d.channel,'kind',d.kind,'phone',c.phone,'email',email,'template',name,'language',lang,'template_hash',hash,'appointment_id',d.appointment_id,'starts_at',d.appointment_starts_at);
end;$$;
create or replace function public.ops_check_delivery(p_nutritionist uuid,p_item uuid,p_token uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ops_deliveries d join public.patients p on p.id=d.patient_id
 where d.id=p_item and d.token=p_token and d.state='sending' and d.lease_until>clock_timestamp() and d.nutritionist_id=p_nutritionist and public.ops_care_active(p.id,p_nutritionist)
 and(d.kind<>'reminder' or exists(select 1 from public.appointments where id=d.appointment_id and patient_id=p.id and nutritionist_id=p_nutritionist and starts_at=d.appointment_starts_at and status='scheduled'))
 and((d.channel='whatsapp' and exists(select 1 from public.ops_contact_preferences c where c.patient_id=p.id and c.revision=d.preference_revision and c.consent_version='whatsapp.v1' and(case when d.kind='reminder' then c.reminders else c.broadcasts end)))
 or(d.channel='email' and p.user_id=d.recipient_user_id and public.ops_email_allowed(p.id,p_nutritionist) and exists(select 1 from public.notification_preferences f join auth.users u on u.id=f.user_id where u.id=p.user_id and u.email=d.destination_email and f.updated_at=d.preference_updated_at))));
$$;
create or replace function public.ops_finish_delivery(p_item uuid,p_token uuid,p_state text,p_provider text) returns boolean language plpgsql security definer set search_path='' as $$
declare amount int;
begin
 if p_state not in('accepted','failed','uncertain','cancelled') or(p_provider is not null and length(p_provider)>250) then raise exception 'delivery_invalid' using errcode='22023';end if;
 update public.ops_deliveries set state=p_state,provider_id=p_provider,lease_until=null,updated_at=clock_timestamp(),delivery_status=case when channel='whatsapp' then(select status from public.ops_delivery_events where provider_id=p_provider) else null end where id=p_item and token=p_token and state='sending' and lease_until>clock_timestamp();get diagnostics amount=row_count;return amount=1;
end;$$;
create function public.ops_bind_email_unsubscribe(p_item uuid,p_token uuid,p_hash text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid;
begin
 if p_hash is null or p_hash!~'^[a-f0-9]{64}$' then raise exception 'token_invalid' using errcode='22023';end if;
 select recipient_user_id into uid from public.ops_deliveries where id=p_item and token=p_token and channel='email' and state='sending' and lease_until>clock_timestamp();if uid is null then return false;end if;
 insert into public.ops_email_unsubscribe_tokens(token_hash,delivery_id,user_id)values(p_hash,p_item,uid);return true;
end;$$;
create function public.ops_unsubscribe_email(p_hash text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;
begin
 update public.ops_email_unsubscribe_tokens set used_at=clock_timestamp() where token_hash=p_hash and expires_at>clock_timestamp() and used_at is null returning user_id into uid;if uid is null then return;end if;
 update public.notification_preferences set email=false,updated_at=clock_timestamp() where user_id=uid;
 update public.ops_deliveries d set state='cancelled',updated_at=clock_timestamp() from public.patients p where p.id=d.patient_id and p.user_id=uid and d.channel='email' and d.state='queued';
end;$$;
create function public.ops_cancel_old_reminders() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.ops_deliveries set state='cancelled',updated_at=clock_timestamp() where kind='reminder' and appointment_id=new.id and state='queued' and(appointment_starts_at<>new.starts_at or new.status<>'scheduled');return new;
end;$$;
create trigger ops_cancel_old_reminders after update of starts_at,status on public.appointments for each row execute function public.ops_cancel_old_reminders();
create function public.ops_cancel_email_optout() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.email then update public.ops_deliveries d set state='cancelled',updated_at=clock_timestamp() from public.patients p where p.id=d.patient_id and p.user_id=new.user_id and d.channel='email' and d.state='queued';end if;return new;
end;$$;
create trigger ops_cancel_email_optout after insert or update of email on public.notification_preferences for each row execute function public.ops_cancel_email_optout();
revoke all on function public.ops_delivery_scope(),public.ops_care_active(uuid,uuid),public.ops_email_allowed(uuid,uuid),public.ops_review_reminder_template(uuid,text,text,text),public.ops_create_email_broadcast(uuid,text,text,uuid[]),public.ops_enqueue_reminders(timestamptz,timestamptz,text),public.ops_bind_email_unsubscribe(uuid,uuid,text),public.ops_unsubscribe_email(text),public.ops_cancel_old_reminders(),public.ops_cancel_email_optout() from public,anon,authenticated;
grant execute on function public.ops_review_reminder_template(uuid,text,text,text),public.ops_create_email_broadcast(uuid,text,text,uuid[]) to authenticated;
grant execute on function public.ops_care_active(uuid,uuid),public.ops_email_allowed(uuid,uuid),public.ops_enqueue_reminders(timestamptz,timestamptz,text),public.ops_bind_email_unsubscribe(uuid,uuid,text),public.ops_unsubscribe_email(text) to service_role;
insert into public.ops_email_templates(id,subject,body,path,content_hash)values
('agenda_notice','Aviso sobre la agenda de tu consultorio','Tu consultorio tiene un aviso sobre su agenda. Entrá a Plan V y revisá los turnos o escribile a tu profesional.','/app/agenda','45ba534d6f08b757570448557830730d07e5ed10d8e95655592782a803756f34'),
('contact_notice','Un aviso de tu consultorio en Plan V','Tu consultorio tiene un aviso para vos. Entrá a Plan V y revisá los mensajes de tu profesional.','/app/mensajes','1879456b46c3745ed866ba67f8efca43ae0b3c77708580c24d9633340ecb1cfb');
create or replace function public.ops_set_preferences(p_patient uuid,p_phone text,p_reminders boolean,p_broadcasts boolean,p_version text) returns jsonb
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
 update public.ops_deliveries set state='cancelled',updated_at=now() where patient_id=p_patient and state='queued' and channel='whatsapp' and((kind='broadcast' and not p_broadcasts)or(kind='reminder' and not p_reminders));
 select to_jsonb(c) into result from public.ops_contact_preferences c where c.patient_id=p_patient;
 return result;
end $$;
create or replace function public.ops_whatsapp_event(p_provider text,p_status text,p_optout_phone text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_optout_phone is not null then
  insert into public.ops_contact_events(patient_id,reminders,broadcasts,consent_version,source)
  select patient_id,false,false,consent_version,'whatsapp' from public.ops_contact_preferences where phone=p_optout_phone and (reminders or broadcasts);
  update public.ops_contact_preferences set reminders=false,broadcasts=false,updated_at=now(),revision=revision+1 where phone=p_optout_phone;
  update public.ops_deliveries d set state='cancelled',updated_at=now() from public.ops_contact_preferences c
  where d.patient_id=c.patient_id and c.phone=p_optout_phone and d.state='queued' and d.channel='whatsapp';
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
create function public.ops_expire_delivery_leases() returns int language plpgsql security definer set search_path='' as $$
declare amount int;begin update public.ops_deliveries set state='uncertain',updated_at=clock_timestamp() where state='sending' and lease_until<clock_timestamp();get diagnostics amount=row_count;return amount;end;$$;
revoke all on function public.ops_expire_delivery_leases() from public,anon,authenticated;
grant execute on function public.ops_expire_delivery_leases() to service_role;
-- One clinic-scoped lookup for large portfolios: no addresses or clinical content leave the helper.
create function public.ops_email_eligible_patients(p_nutritionist uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(p.id order by p.id),'[]'::jsonb) from public.patients p where p.nutritionist_id=p_nutritionist and public.ops_email_allowed(p.id,p_nutritionist);
$$;
revoke all on function public.ops_email_eligible_patients(uuid) from public,anon,authenticated;
grant execute on function public.ops_email_eligible_patients(uuid) to service_role;
