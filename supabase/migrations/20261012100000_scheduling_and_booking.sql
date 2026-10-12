-- Additive scheduling, pending public requests and per-professional integrations.
create table public.scheduling_profiles(nutritionist_id uuid primary key references public.nutritionists(id),slug text not null unique,config jsonb not null,revision int not null default 1 check(revision>0));
create table public.scheduling_integrations(nutritionist_id uuid not null references public.nutritionists(id),provider text not null check(provider in('google','mercadopago')),encrypted_credentials text not null,account_id text not null,updated_at timestamptz not null default now(),primary key(nutritionist_id,provider));
create table public.scheduling_oauth_states(state_hash text primary key,nutritionist_id uuid not null references public.nutritionists(id),requested_by uuid not null references auth.users(id),provider text not null,encrypted_verifier text not null,cookie_hash text not null,expires_at timestamptz not null,used_at timestamptz);
create table public.scheduling_bookings(
 id uuid primary key, nutritionist_id uuid not null references public.nutritionists(id),client_id uuid not null,token_hash text not null,
 type_id uuid not null,calendar_id uuid not null,starts_at timestamptz not null,duration_min int not null check(duration_min between 10 and 180),
 contact_name text not null check(length(contact_name) between 2 and 120),contact_email text not null check(length(contact_email)<=200),contact_phone text not null check(length(contact_phone) between 5 and 40),
 status text not null default 'requested' check(status in('requested','confirmed','cancelled')),revision int not null default 1,hold_until timestamptz not null default clock_timestamp()+interval '20 minutes',
 total_minor bigint not null check(total_minor between 0 and 100000000),deposit_minor bigint not null check(deposit_minor between 0 and total_minor),paid_minor bigint not null default 0 check(paid_minor>=0),currency text not null default 'ARS' check(currency='ARS'),
 patient_id uuid references public.patients(id),appointment_id uuid references public.appointments(id),google_sync_status text not null default 'not_connected',meet_url text,
 created_at timestamptz not null default now(),unique(nutritionist_id,client_id)
);
create index scheduling_bookings_owner on public.scheduling_bookings(nutritionist_id,starts_at,id);
create table public.scheduling_checkout_intents(id uuid primary key,booking_id uuid not null references public.scheduling_bookings(id),nutritionist_id uuid not null references public.nutritionists(id),mode text not null check(mode in('deposit','full')),amount_minor bigint not null check(amount_minor>0),currency text not null default 'ARS',account_id text not null,status text not null default 'creating' check(status in('creating','ready','paid','uncertain','rejected','refunded')),checkout_url text,provider_preference_id text,created_at timestamptz not null default now());
create unique index scheduling_active_checkout on public.scheduling_checkout_intents(booking_id) where status in('creating','ready','uncertain');
create table public.scheduling_payment_events(provider_payment_id text not null,provider_status text not null,intent_id uuid not null references public.scheduling_checkout_intents(id),amount_minor bigint not null,created_at timestamptz not null default now(),primary key(provider_payment_id,provider_status));
create table public.scheduling_payment_balances(provider_payment_id text primary key,intent_id uuid not null references public.scheduling_checkout_intents(id),credited_minor bigint not null default 0,refunded_minor bigint not null default 0,status text not null default 'pending');
alter table public.scheduling_payment_balances enable row level security;
revoke all on public.scheduling_payment_balances from public,anon,authenticated;
grant all on public.scheduling_payment_balances to service_role;
create table public.scheduling_transfer_reports(id uuid primary key,booking_id uuid not null references public.scheduling_bookings(id),amount_minor bigint not null check(amount_minor>0),reference text not null check(length(reference) between 1 and 150),status text not null default 'reported' check(status in('reported','confirmed','rejected')),created_at timestamptz not null default now(),reviewed_at timestamptz);
create table public.scheduling_sync_jobs(id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.scheduling_bookings(id),revision int not null,status text not null default 'queued' check(status in('queued','running','succeeded','failed')),run_token uuid,lease_until timestamptz,attempts int not null default 0,error text,created_at timestamptz not null default now(),unique(booking_id,revision));

create function public.scheduling_owns(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.nutritionists n where n.id=target and n.user_id=auth.uid()) $$;
revoke all on function public.scheduling_owns(uuid) from public,anon;
grant execute on function public.scheduling_owns(uuid) to authenticated;
alter table public.scheduling_profiles enable row level security;
alter table public.scheduling_integrations enable row level security;
alter table public.scheduling_oauth_states enable row level security;
alter table public.scheduling_bookings enable row level security;
alter table public.scheduling_checkout_intents enable row level security;
alter table public.scheduling_payment_events enable row level security;
alter table public.scheduling_transfer_reports enable row level security;
alter table public.scheduling_sync_jobs enable row level security;
revoke all on public.scheduling_profiles,public.scheduling_integrations,public.scheduling_oauth_states,public.scheduling_bookings,public.scheduling_checkout_intents,public.scheduling_payment_events,public.scheduling_transfer_reports,public.scheduling_sync_jobs from anon,authenticated;
grant select on public.scheduling_profiles,public.scheduling_bookings,public.scheduling_transfer_reports to authenticated;
grant all on public.scheduling_profiles,public.scheduling_integrations,public.scheduling_oauth_states,public.scheduling_bookings,public.scheduling_checkout_intents,public.scheduling_payment_events,public.scheduling_transfer_reports,public.scheduling_sync_jobs to service_role;
create policy scheduling_profile_pro on public.scheduling_profiles for select to authenticated using(public.scheduling_owns(nutritionist_id));
create policy scheduling_bookings_pro on public.scheduling_bookings for select to authenticated using(public.scheduling_owns(nutritionist_id));
create policy scheduling_transfers_pro on public.scheduling_transfer_reports for select to authenticated using(exists(select 1 from public.scheduling_bookings b where b.id=booking_id and public.scheduling_owns(b.nutritionist_id)));

create function public.scheduling_save_config(target uuid,expected_revision int,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_profiles; entry jsonb; cid text;
begin
 if not public.scheduling_owns(target) then raise exception 'scheduling_forbidden' using errcode='42501'; end if;
 if jsonb_typeof(payload)<>'object' or not (payload ?& array['timezone','calendars','types','weekly','blocks','page','google_calendar_id','google_enabled','create_meet','transfer_alias']) or octet_length(payload::text)>100000 or payload->>'timezone'<>'America/Argentina/Buenos_Aires' or jsonb_typeof(payload->'page')<>'object' or payload#>>'{page,slug}' !~ '^[a-z0-9][a-z0-9-]{2,59}$' or length(payload#>>'{page,bio}')>1200 then raise exception 'scheduling_config' using errcode='22023'; end if;
 if jsonb_typeof(payload->'calendars')<>'array' or jsonb_array_length(payload->'calendars') not between 1 and 10 or jsonb_typeof(payload->'types')<>'array' or jsonb_typeof(payload->'weekly')<>'array' or jsonb_typeof(payload->'blocks')<>'array' or jsonb_array_length(payload->'types')>30 or jsonb_array_length(payload->'weekly')>100 or jsonb_array_length(payload->'blocks')>300 then raise exception 'scheduling_config' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(payload) k where k not in('timezone','calendars','types','weekly','blocks','page','google_calendar_id','google_enabled','create_meet','transfer_alias')) or exists(select 1 from jsonb_object_keys(payload->'page') k where k not in('slug','enabled','title','bio','location','contact','logo_url')) then raise exception 'scheduling_config' using errcode='22023';end if;
 for entry in select * from jsonb_array_elements(payload->'types') loop
  cid:=(entry->>'calendar_id')::uuid::text;
  if (entry->>'duration_min')::int not between 10 and 180 or (entry->>'price_minor')::bigint not between 0 and 100000000 or (entry->>'deposit_minor')::bigint not between 0 and (entry->>'price_minor')::bigint or entry->>'channel' not in('video','presencial') or not exists(select 1 from jsonb_array_elements(payload->'calendars') c where c->>'id'=cid) then raise exception 'scheduling_type' using errcode='22023'; end if;
 end loop;
 for entry in select * from jsonb_array_elements(payload->'weekly') loop
  if (entry->>'weekday')::int not between 0 and 6 or entry->>'start' !~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' or entry->>'end' !~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' or entry->>'start'>=entry->>'end' then raise exception 'scheduling_hours' using errcode='22023'; end if;
 end loop;
 if coalesce((payload->>'google_enabled')::boolean,false) and not exists(select 1 from public.scheduling_integrations where nutritionist_id=target and provider='google') then raise exception 'google_not_connected' using errcode='PT409'; end if;
 perform public.appointment_lock_nutritionist(target);
 select * into r from public.scheduling_profiles where nutritionist_id=target for update;
 if found then if r.revision<>expected_revision then raise exception 'scheduling_stale' using errcode='PT409'; end if;update public.scheduling_profiles set config=payload,slug=payload#>>'{page,slug}',revision=revision+1 where nutritionist_id=target returning * into r;
 else if expected_revision<>0 then raise exception 'scheduling_stale' using errcode='PT409'; end if;insert into public.scheduling_profiles(nutritionist_id,slug,config) values(target,payload#>>'{page,slug}',payload) returning * into r;end if;
 return to_jsonb(r);
end; $$;
revoke all on function public.scheduling_save_config(uuid,int,jsonb) from public,anon;
grant execute on function public.scheduling_save_config(uuid,int,jsonb) to authenticated;

create function public.scheduling_slot_allowed(nid uuid,tid uuid,starts timestamptz,ignore_booking uuid default null) returns boolean language plpgsql stable security definer set search_path='' as $$
declare cfg jsonb; typ jsonb; wall timestamp; dur int; finish timestamp;
begin
 select config into cfg from public.scheduling_profiles where nutritionist_id=nid;
 select t into typ from jsonb_array_elements(cfg->'types') t where t->>'id'=tid::text;
 if typ is null or starts<clock_timestamp()+interval '1 hour' or starts>clock_timestamp()+interval '90 days' then return false;end if;
 dur:=(typ->>'duration_min')::int;wall:=timezone('America/Argentina/Buenos_Aires',starts);finish:=wall+make_interval(mins=>dur);
 if date_trunc('day',wall)<>date_trunc('day',finish) or not exists(select 1 from jsonb_array_elements(cfg->'weekly') w where w->>'calendar_id'=typ->>'calendar_id' and (w->>'weekday')::int=extract(dow from wall)::int and wall::time>=(w->>'start')::time and finish::time<=(w->>'end')::time and mod((extract(epoch from (wall::time-(w->>'start')::time))/60)::int,dur)=0) then return false;end if;
 if exists(select 1 from jsonb_array_elements(cfg->'blocks') b where b->>'calendar_id'=typ->>'calendar_id' and (b->>'start')::timestamptz<starts+make_interval(mins=>dur) and starts<(b->>'end')::timestamptz) then return false;end if;
 if exists(select 1 from public.appointments a where a.nutritionist_id=nid and a.status='scheduled' and a.id is distinct from (select appointment_id from public.scheduling_bookings where id=ignore_booking) and a.starts_at<starts+make_interval(mins=>dur) and starts<a.starts_at+make_interval(mins=>a.duration_min)) then return false;end if;
 if exists(select 1 from public.scheduling_bookings b where b.nutritionist_id=nid and b.id is distinct from ignore_booking and (b.status='confirmed' or (b.status='requested' and b.hold_until>clock_timestamp())) and b.starts_at<starts+make_interval(mins=>dur) and starts<b.starts_at+make_interval(mins=>b.duration_min)) then return false;end if;
 return true;
end; $$;
revoke all on function public.scheduling_slot_allowed(uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.scheduling_slot_allowed(uuid,uuid,timestamptz,uuid) to service_role;

create function public.scheduling_request_booking(nid uuid,payload jsonb,hash_value text) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg jsonb;typ jsonb;r public.scheduling_bookings;cid uuid:=(payload->>'client_id')::uuid;tid uuid:=(payload->>'type_id')::uuid;at timestamptz:=(payload->>'starts_at')::timestamptz;
begin
 perform public.appointment_lock_nutritionist(nid);
 select * into r from public.scheduling_bookings where nutritionist_id=nid and client_id=cid;
 if found then if r.type_id<>tid or r.starts_at<>at or r.contact_email<>lower(btrim(payload->>'email')) or r.contact_name<>btrim(payload->>'name') or r.contact_phone<>btrim(payload->>'phone') then raise exception 'booking_replay_changed' using errcode='PT409';end if;return to_jsonb(r);end if;
 select config into cfg from public.scheduling_profiles where nutritionist_id=nid and coalesce((config#>>'{page,enabled}')::boolean,false);
 if cfg is null or not public.scheduling_slot_allowed(nid,tid,at) then raise exception 'slot_unavailable' using errcode='PT409';end if;
 if payload->>'accepted_contact' is distinct from 'true' or hash_value !~ '^[a-f0-9]{64}$' or length(payload->>'name') not between 2 and 120 or length(payload->>'email')>200 or payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(payload->>'phone') not between 5 and 40 then raise exception 'booking_contact' using errcode='22023';end if;
 if (select count(*) from public.scheduling_bookings where nutritionist_id=nid and contact_email=lower(btrim(payload->>'email')) and status='requested' and created_at>clock_timestamp()-interval '1 day')>=3 then raise exception 'booking_rate' using errcode='PT429';end if;
 select t into typ from jsonb_array_elements(cfg->'types') t where t->>'id'=tid::text;
 insert into public.scheduling_bookings(id,nutritionist_id,client_id,token_hash,type_id,calendar_id,starts_at,duration_min,contact_name,contact_email,contact_phone,total_minor,deposit_minor)
 values(gen_random_uuid(),nid,cid,hash_value,tid,(typ->>'calendar_id')::uuid,at,(typ->>'duration_min')::int,btrim(payload->>'name'),lower(btrim(payload->>'email')),btrim(payload->>'phone'),(typ->>'price_minor')::bigint,(typ->>'deposit_minor')::bigint) returning * into r;
 return to_jsonb(r);
end; $$;
revoke all on function public.scheduling_request_booking(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.scheduling_request_booking(uuid,jsonb,text) to service_role;

create function public.scheduling_change_booking(nid uuid,bid uuid,payload jsonb,guest_hash text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_bookings;cfg jsonb;typ jsonb;aid uuid;pid uuid;at timestamptz;op text:=payload->>'action';pro boolean:=public.scheduling_owns(nid);
begin
 perform public.appointment_lock_nutritionist(nid);
 select * into r from public.scheduling_bookings where id=bid and nutritionist_id=nid for update;
 if not found or (not pro and (guest_hash is null or r.token_hash<>guest_hash)) then raise exception 'booking_forbidden' using errcode='42501';end if;
 if r.revision<>(payload->>'expected_revision')::int then raise exception 'booking_stale' using errcode='PT409';end if;
 if r.status='cancelled' or op not in('confirm','cancel','reschedule') or (op='confirm' and not pro) or (not pro and r.starts_at<clock_timestamp()+interval '24 hours') then raise exception 'booking_policy' using errcode='PT409';end if;
 select config into cfg from public.scheduling_profiles where nutritionist_id=nid;select t into typ from jsonb_array_elements(cfg->'types') t where t->>'id'=r.type_id::text;
 if op='cancel' then
  update public.scheduling_bookings set status='cancelled',revision=revision+1 where id=bid returning * into r;
  if r.appointment_id is not null then update public.appointments set status='cancelled' where id=r.appointment_id;perform public.appointment_append_event(r.appointment_id,r.patient_id,nid,'cancelled',case when pro then 'pro' else 'patient' end,r.starts_at,r.duration_min,(typ->>'channel')::public.appointment_channel);end if;
 else
  at:=case when op='reschedule' then (payload->>'starts_at')::timestamptz else r.starts_at end;
  if not public.scheduling_slot_allowed(nid,r.type_id,at,bid) then raise exception 'slot_unavailable' using errcode='PT409';end if;
  if op='confirm' then
   if r.status<>'requested' then raise exception 'booking_already_confirmed' using errcode='PT409';end if;
   pid:=(payload->>'patient_id')::uuid;
   if pid is not null then if not exists(select 1 from public.patients where id=pid and nutritionist_id=nid and deactivated_at is null and anonymized_at is null) then raise exception 'patient_forbidden' using errcode='42501';end if;
   else
    if exists(select 1 from public.patient_invites where nutritionist_id=nid and email=r.contact_email and status in('not_sent','pending','accepted')) then raise exception 'select_existing_patient' using errcode='PT409';end if;
    insert into public.patients(nutritionist_id,full_name,initials) values(nid,r.contact_name,left(r.contact_name,2)) returning id into pid;
    insert into public.patient_invites(patient_id,nutritionist_id,email) values(pid,nid,r.contact_email);
   end if;
   insert into public.appointments(nutritionist_id,patient_id,starts_at,duration_min,channel,timezone,status) values(nid,pid,at,r.duration_min,(typ->>'channel')::public.appointment_channel,'America/Argentina/Buenos_Aires','scheduled') returning id into aid;
   perform public.appointment_append_event(aid,pid,nid,'scheduled','pro',at,r.duration_min,(typ->>'channel')::public.appointment_channel);
   update public.scheduling_bookings set status='confirmed',patient_id=pid,appointment_id=aid,revision=revision+1 where id=bid returning * into r;
  else
   update public.scheduling_bookings set starts_at=at,hold_until=clock_timestamp()+interval '20 minutes',revision=revision+1 where id=bid returning * into r;
   if r.appointment_id is not null then update public.appointments set starts_at=at,patient_reply=null,confirmed_at=null where id=r.appointment_id;perform public.appointment_append_event(r.appointment_id,r.patient_id,nid,case when pro then 'rescheduled'::public.appointment_event_action else 'patient_rescheduled'::public.appointment_event_action end,case when pro then 'pro' else 'patient' end,at,r.duration_min,(typ->>'channel')::public.appointment_channel);end if;
  end if;
 end if;
 if r.appointment_id is not null and coalesce((cfg->>'google_enabled')::boolean,false) then insert into public.scheduling_sync_jobs(booking_id,revision) values(bid,r.revision) on conflict do nothing;update public.scheduling_bookings set google_sync_status='queued' where id=bid returning * into r;end if;
 return to_jsonb(r);
end; $$;
revoke all on function public.scheduling_change_booking(uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.scheduling_change_booking(uuid,uuid,jsonb,text) to authenticated,service_role;

create function public.scheduling_apply_payment(intent uuid,provider_id text,provider_status text,amount bigint,currency_value text,collector text,refunded bigint default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.scheduling_checkout_intents;r public.scheduling_bookings;bal public.scheduling_payment_balances;credit bigint;rows_added int;
begin
 select * into i from public.scheduling_checkout_intents where id=intent for update;
 if not found or i.amount_minor<>amount or i.currency<>currency_value or i.account_id<>collector or refunded not between 0 and amount then raise exception 'payment_mismatch' using errcode='42501';end if;
 if provider_status not in('approved','refunded','charged_back') then return jsonb_build_object('applied',false);end if;
 insert into public.scheduling_payment_balances(provider_payment_id,intent_id) values(provider_id,intent) on conflict do nothing;
 select * into bal from public.scheduling_payment_balances where provider_payment_id=provider_id for update;
 if bal.intent_id<>intent then raise exception 'payment_mismatch' using errcode='42501';end if;
 if refunded<bal.refunded_minor or (bal.status in('refunded','charged_back') and provider_status='approved') then return jsonb_build_object('applied',false,'stale',true);end if;
 insert into public.scheduling_payment_events(provider_payment_id,provider_status,intent_id,amount_minor) values(provider_id,provider_status||':'||refunded::text,intent,amount) on conflict do nothing;
 get diagnostics rows_added=row_count;if rows_added=0 then return jsonb_build_object('applied',false,'duplicate',true);end if;
 credit:=case when provider_status='approved' then amount-refunded else 0 end;
 update public.scheduling_bookings set paid_minor=greatest(0,paid_minor+credit-bal.credited_minor) where id=i.booking_id returning * into r;
 update public.scheduling_payment_balances set credited_minor=credit,refunded_minor=refunded,status=provider_status where provider_payment_id=provider_id;
 update public.scheduling_checkout_intents set status=case when credit>0 then 'paid' else 'refunded' end where id=intent;
 return jsonb_build_object('applied',true,'booking_id',i.booking_id);
end; $$;
revoke all on function public.scheduling_apply_payment(uuid,text,text,bigint,text,text,bigint) from public,anon,authenticated;
grant execute on function public.scheduling_apply_payment(uuid,text,text,bigint,text,text,bigint) to service_role;

create function public.scheduling_review_transfer(nid uuid,report uuid,decision text) returns jsonb language plpgsql security definer set search_path='' as $$ declare t public.scheduling_transfer_reports;begin
 if not public.scheduling_owns(nid) then raise exception 'transfer_forbidden' using errcode='42501';end if;
 select t1.* into t from public.scheduling_transfer_reports t1 join public.scheduling_bookings b on b.id=t1.booking_id where t1.id=report and b.nutritionist_id=nid for update of t1;
 if not found or t.status<>'reported' or decision not in('confirm','reject') then raise exception 'transfer_stale' using errcode='PT409';end if;
 update public.scheduling_transfer_reports set status=case when decision='confirm' then 'confirmed' else 'rejected' end,reviewed_at=clock_timestamp() where id=report;
 if decision='confirm' then update public.scheduling_bookings set paid_minor=paid_minor+t.amount_minor where id=t.booking_id;end if;
 return jsonb_build_object('reviewed',true);
end; $$;
revoke all on function public.scheduling_review_transfer(uuid,uuid,text) from public,anon;
grant execute on function public.scheduling_review_transfer(uuid,uuid,text) to authenticated;

create function public.scheduling_claim_sync_job() returns jsonb language plpgsql security definer set search_path='' as $$ declare j public.scheduling_sync_jobs;begin
 update public.scheduling_sync_jobs set status='failed',error='La sincronización se interrumpió. Reintentá desde la agenda.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and attempts>=5;
 select * into j from public.scheduling_sync_jobs where (status='queued' or (status='running' and lease_until<clock_timestamp())) and attempts<5 order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 update public.scheduling_sync_jobs set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1 where id=j.id returning * into j;return to_jsonb(j);
end; $$;
create function public.scheduling_complete_sync_job(job uuid,token uuid,meet text,failure text default null) returns boolean language plpgsql security definer set search_path='' as $$ declare j public.scheduling_sync_jobs;r public.scheduling_bookings;begin
 select * into j from public.scheduling_sync_jobs where id=job and status='running' and run_token=token and lease_until>clock_timestamp() for update;if not found then return false;end if;
 select * into r from public.scheduling_bookings where id=j.booking_id for update;if r.revision<>j.revision then update public.scheduling_sync_jobs set status='failed',error='La reserva cambió.' where id=job;return false;end if;
 update public.scheduling_sync_jobs set status=case when failure is null then 'succeeded' else 'failed' end,error=left(failure,300),run_token=null,lease_until=null where id=job;
 update public.scheduling_bookings set google_sync_status=case when failure is null then 'synced' else 'failed' end,meet_url=case when failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then meet else meet_url end where id=r.id;
 if failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=r.appointment_id;end if;return failure is null;
end; $$;
revoke all on function public.scheduling_claim_sync_job(),public.scheduling_complete_sync_job(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.scheduling_claim_sync_job(),public.scheduling_complete_sync_job(uuid,uuid,text,text) to service_role;
