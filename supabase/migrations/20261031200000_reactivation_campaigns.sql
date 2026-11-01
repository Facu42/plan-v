-- Additive. Disabled in each clinic; no sends in SQL. Rollback: turn flags off, retain audit.
create table public.ops_campaign_settings(nutritionist_id uuid primary key references public.nutritionists(id),enabled boolean not null default false,daily_limit int not null default 20 check(daily_limit between 1 and 100));
create table public.ops_campaign_optouts(patient_id uuid primary key references public.patients(id),opted_out boolean not null default true,revision bigint not null default 1,updated_at timestamptz not null default clock_timestamp());
create table public.ops_campaigns(id uuid primary key default gen_random_uuid(),nutritionist_id uuid not null references public.nutritionists(id),request_key uuid not null,segment text not null check(segment in('no_consultation','no_app_record')),days int not null check(days between 1 and 3650),channel text not null check(channel in('push','email','whatsapp')),template text not null,template_hash text not null,patient_ids uuid[] not null,created_at timestamptz not null default clock_timestamp(),unique(nutritionist_id,request_key));
create table public.ops_campaign_usage(nutritionist_id uuid not null references public.nutritionists(id),day date not null,used int not null default 0,primary key(nutritionist_id,day));
alter table public.ops_deliveries add column campaign_id uuid references public.ops_campaigns(id),add column campaign_optout_revision bigint,add column campaign_reserved_at timestamptz;
alter table public.ops_deliveries drop constraint ops_deliveries_channel_check;
alter table public.ops_deliveries add constraint ops_deliveries_channel_check check(channel in('email','whatsapp','push'));
alter table public.ops_deliveries drop constraint ops_delivery_purpose;
alter table public.ops_deliveries add constraint ops_delivery_purpose check(
 (kind='broadcast' and channel='whatsapp' and broadcast_id is not null and email_broadcast_id is null and appointment_id is null) or
 (kind='broadcast' and channel='email' and email_broadcast_id is not null and broadcast_id is null and appointment_id is null) or
 (kind='broadcast' and channel='push' and campaign_id is not null and broadcast_id is null and email_broadcast_id is null and appointment_id is null) or
 (kind='reminder' and channel in('email','whatsapp') and appointment_id is not null and appointment_starts_at is not null and broadcast_id is null and email_broadcast_id is null));
create unique index ops_campaign_patient_once on public.ops_deliveries(campaign_id,patient_id);
alter table public.ops_campaign_settings enable row level security;alter table public.ops_campaign_optouts enable row level security;alter table public.ops_campaigns enable row level security;alter table public.ops_campaign_usage enable row level security;
revoke all on public.ops_campaign_settings,public.ops_campaign_optouts,public.ops_campaigns,public.ops_campaign_usage from public,anon,authenticated;
grant all on public.ops_campaign_settings,public.ops_campaign_optouts,public.ops_campaigns,public.ops_campaign_usage to service_role;
grant select on public.ops_campaign_settings,public.ops_campaign_optouts,public.ops_campaigns,public.ops_campaign_usage to authenticated;
create policy campaign_settings_owner on public.ops_campaign_settings for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
create policy campaign_optout_patient on public.ops_campaign_optouts for select to authenticated using(public.ops_can_read_patient(patient_id));
create policy campaigns_owner on public.ops_campaigns for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
create policy campaign_usage_owner on public.ops_campaign_usage for select to authenticated using(public.ops_can_read_clinic(nutritionist_id));
create function public.ops_campaign_enabled(nid uuid) returns boolean language sql stable security definer set search_path='' as $$select coalesce((select enabled from public.ops_campaign_settings where nutritionist_id=nid),false)$$;
create function public.ops_configure_campaigns(nid uuid,p_enabled boolean,p_daily_limit int) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.ops_can_read_clinic(nid) then raise exception 'clinic_scope' using errcode='42501';end if;
 if p_enabled is null or p_daily_limit is null or p_daily_limit not between 1 and 100 then raise exception 'invalid_limit' using errcode='22023';end if;
 insert into public.ops_campaign_settings values(nid,p_enabled,p_daily_limit) on conflict(nutritionist_id)do update set enabled=excluded.enabled,daily_limit=excluded.daily_limit;
end;$$;
create function public.ops_set_campaign_optout(pid uuid,p_opted_out boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if p_opted_out is null or not exists(select 1 from public.patients where id=pid and user_id=auth.uid()) then raise exception 'patient_only' using errcode='42501';end if;
 insert into public.ops_campaign_optouts(patient_id,opted_out)values(pid,p_opted_out) on conflict(patient_id)do update set opted_out=excluded.opted_out,revision=public.ops_campaign_optouts.revision+1,updated_at=clock_timestamp();
 if p_opted_out then update public.ops_deliveries set state='cancelled',updated_at=clock_timestamp() where patient_id=pid and campaign_id is not null and state='queued';end if;
end;$$;
create function public.ops_campaign_segment(nid uuid,p_segment text,p_days int) returns table(patient_id uuid) language plpgsql stable security definer set search_path='' as $$begin
 if not public.ops_can_read_clinic(nid) then return;end if;
 if p_segment not in('no_consultation','no_app_record') or p_segment is null or p_days is null or p_days not between 1 and 3650 then raise exception 'invalid_segment' using errcode='22023';end if;
 return query select p.id from public.patients p where p.nutritionist_id=nid and public.ops_care_active(p.id,nid) and p.created_at<=clock_timestamp()-p_days*interval '1 day'
 and case when p_segment='no_consultation' then not exists(select 1 from public.consultation_completions c where c.patient_id=p.id and c.nutritionist_id=nid and c.completed and c.appointment_starts_at>clock_timestamp()-p_days*interval '1 day')
 else not exists(select 1 from public.meal_logs m where m.patient_id=p.id and m.logged_at>clock_timestamp()-p_days*interval '1 day') and not exists(select 1 from public.habit_logs h where h.patient_id=p.id and h.logged_at>clock_timestamp()-p_days*interval '1 day') end order by p.id;
end;$$;
create function public.ops_create_campaign(nid uuid,p_key uuid,p_segment text,p_days int,p_channel text,p_template text,p_hash text,p_patients uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare ids uuid[];r public.ops_campaigns;bid uuid;
begin
 if not public.ops_can_read_clinic(nid) or not public.ops_campaign_enabled(nid) then raise exception 'clinic_disabled' using errcode='42501';end if;
 if p_key is null or p_channel is null or p_channel not in('email','push','whatsapp') or cardinality(p_patients) is null or cardinality(p_patients) not between 1 and 100 then raise exception 'invalid_campaign' using errcode='22023';end if;
 select array_agg(distinct v order by v) into ids from unnest(p_patients)v;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text||p_key::text,1));
 select * into r from public.ops_campaigns where nutritionist_id=nid and request_key=p_key;
 if found then if r.segment is distinct from p_segment or r.days is distinct from p_days or r.channel is distinct from p_channel or r.template is distinct from p_template or r.template_hash is distinct from p_hash or r.patient_ids<>ids then raise exception 'idempotency_conflict' using errcode='23505';end if;return r.id;end if;
 if exists(select 1 from unnest(ids)v where v is null or not exists(select 1 from public.ops_campaign_segment(nid,p_segment,p_days)s where s.patient_id=v)) then raise exception 'segment_changed' using errcode='22023';end if;
 if p_channel in('email','push') and not exists(select 1 from public.ops_email_templates where id=p_template and content_hash=p_hash) then raise exception 'template_changed' using errcode='22023';end if;
 insert into public.ops_campaigns(nutritionist_id,request_key,segment,days,channel,template,template_hash,patient_ids)values(nid,p_key,p_segment,p_days,p_channel,p_template,p_hash,ids)returning * into r;
 if p_channel='email' then bid:=public.ops_create_email_broadcast(p_key,p_template,p_hash,ids);update public.ops_deliveries set campaign_id=r.id where email_broadcast_id=bid;
 elsif p_channel='whatsapp' then bid:=public.ops_create_broadcast(p_key,p_template,'es_AR',ids,p_hash);update public.ops_deliveries set campaign_id=r.id where broadcast_id=bid;
 else insert into public.ops_deliveries(nutritionist_id,patient_id,channel,kind,campaign_id) select nid,v,'push','broadcast',r.id from unnest(ids)v;end if;
 update public.ops_deliveries set state='skipped' where campaign_id=r.id and exists(select 1 from public.ops_campaign_optouts o where o.patient_id=ops_deliveries.patient_id and o.opted_out);
 return r.id;
end;$$;
-- Keep existing transport-specific consent, appointment and recipient checks intact.
alter function public.ops_claim_delivery(uuid,uuid) rename to ops_claim_delivery_transport;
alter function public.ops_check_delivery(uuid,uuid,uuid) rename to ops_check_delivery_transport;
revoke all on function public.ops_claim_delivery_transport(uuid,uuid),public.ops_check_delivery_transport(uuid,uuid,uuid) from public,anon,authenticated,service_role;
create function public.ops_claim_delivery(p_nutritionist uuid,p_item uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.ops_deliveries; cap int;amount int;day_ar date:=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date;result jsonb;
begin
 -- Lock order is clinic then delivery for all claims to serialize the daily quota.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_nutritionist::text,2));
 select * into d from public.ops_deliveries where id=p_item for update;
 if not found then return null;end if;
 if d.nutritionist_id is distinct from p_nutritionist then raise exception 'clinic_scope' using errcode='42501';end if;
 if d.campaign_id is null then return public.ops_claim_delivery_transport(p_nutritionist,p_item);end if;
 if d.state='sending' and d.lease_until<clock_timestamp() then update public.ops_deliveries set state='uncertain',updated_at=clock_timestamp() where id=p_item;return null;end if;
 if d.state<>'queued' then return null;end if;
 if not public.ops_campaign_enabled(p_nutritionist) then update public.ops_deliveries set updated_at=clock_timestamp() where id=p_item;return null;end if;
 if not public.ops_care_active(d.patient_id,p_nutritionist) or exists(select 1 from public.ops_campaign_optouts where patient_id=d.patient_id and opted_out) then update public.ops_deliveries set state='cancelled' where id=p_item;return null;end if;
 select daily_limit into cap from public.ops_campaign_settings where nutritionist_id=p_nutritionist;
 insert into public.ops_campaign_usage(nutritionist_id,day)values(p_nutritionist,day_ar)on conflict do nothing;
 select used into amount from public.ops_campaign_usage where nutritionist_id=p_nutritionist and day=day_ar for update;if amount>=cap then update public.ops_deliveries set updated_at=clock_timestamp() where id=p_item;return null;end if;
 if d.channel='push' then
  if not exists(select 1 from public.patients p join public.push_subscriptions s on s.user_id=p.user_id where p.id=d.patient_id) then update public.ops_deliveries set state='skipped' where id=p_item;return null;end if;
  update public.ops_deliveries set state='sending',token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',recipient_user_id=(select user_id from public.patients where id=d.patient_id),updated_at=clock_timestamp() where id=p_item returning * into d;
  select jsonb_build_object('token',d.token,'channel','push','kind','broadcast','patient_id',d.patient_id,'template',c.template,'template_hash',c.template_hash) into result from public.ops_campaigns c where c.id=d.campaign_id;
 else result:=public.ops_claim_delivery_transport(p_nutritionist,p_item);end if;
 if result is not null then
  update public.ops_campaign_usage set used=used+1 where nutritionist_id=p_nutritionist and day=day_ar;
  update public.ops_deliveries set campaign_optout_revision=coalesce((select revision from public.ops_campaign_optouts where patient_id=d.patient_id),0),campaign_reserved_at=clock_timestamp() where id=p_item;
 end if;return result||jsonb_build_object('campaign_id',d.campaign_id);
end;$$;
create function public.ops_check_delivery(p_nutritionist uuid,p_item uuid,p_token uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ops_deliveries d join public.patients p on p.id=d.patient_id where d.id=p_item and d.token=p_token and d.nutritionist_id=p_nutritionist
 and (d.campaign_id is null or (public.ops_campaign_enabled(p_nutritionist) and not exists(select 1 from public.ops_campaign_optouts o where o.patient_id=d.patient_id and o.opted_out) and d.campaign_optout_revision=coalesce((select revision from public.ops_campaign_optouts where patient_id=d.patient_id),0)))
 and case when d.channel='push' then d.state='sending' and d.lease_until>clock_timestamp() and p.user_id=d.recipient_user_id and public.ops_care_active(d.patient_id,p_nutritionist) else public.ops_check_delivery_transport(p_nutritionist,p_item,p_token) end);
$$;
revoke all on function public.ops_campaign_enabled(uuid),public.ops_configure_campaigns(uuid,boolean,int),public.ops_set_campaign_optout(uuid,boolean),public.ops_campaign_segment(uuid,text,int),public.ops_create_campaign(uuid,uuid,text,int,text,text,text,uuid[]),public.ops_claim_delivery(uuid,uuid),public.ops_check_delivery(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ops_campaign_enabled(uuid),public.ops_configure_campaigns(uuid,boolean,int),public.ops_set_campaign_optout(uuid,boolean),public.ops_campaign_segment(uuid,text,int),public.ops_create_campaign(uuid,uuid,text,int,text,text,text,uuid[]) to authenticated;
grant execute on function public.ops_claim_delivery(uuid,uuid),public.ops_check_delivery(uuid,uuid,uuid) to service_role;
