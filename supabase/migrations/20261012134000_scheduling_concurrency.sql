-- Epoch tombstones survive disconnect. Refresh and OAuth callbacks cannot resurrect credentials.
create table public.scheduling_connection_epochs(
 nutritionist_id uuid not null references public.nutritionists(id),provider text not null check(provider in('google','mercadopago')),
 epoch uuid not null default gen_random_uuid(),refresh_token uuid,refresh_until timestamptz,
 primary key(nutritionist_id,provider)
);
alter table public.scheduling_connection_epochs enable row level security;
revoke all on public.scheduling_connection_epochs from public,anon,authenticated;
grant all on public.scheduling_connection_epochs to service_role;
insert into public.scheduling_connection_epochs(nutritionist_id,provider) select nutritionist_id,provider from public.scheduling_integrations;
alter table public.scheduling_integrations add column connection_epoch uuid;
update public.scheduling_integrations i set connection_epoch=e.epoch from public.scheduling_connection_epochs e where e.nutritionist_id=i.nutritionist_id and e.provider=i.provider;
alter table public.scheduling_integrations alter column connection_epoch set not null;
alter table public.scheduling_integrations alter column connection_epoch set default gen_random_uuid();
alter table public.scheduling_oauth_states add column connection_epoch uuid;
-- Existing pending OAuth states deliberately expire without authorizing a new connection.
create function public.scheduling_connection_epoch(nid uuid,kind text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 insert into public.scheduling_connection_epochs(nutritionist_id,provider) values(nid,kind) on conflict do nothing;
 select epoch into result from public.scheduling_connection_epochs where nutritionist_id=nid and provider=kind;
 return result;
end;$$;
-- Read-only context for a signed, short-lived review. No patient text is returned.
create function public.scheduling_google_review_context(nid uuid,kind text,target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare j jsonb;source jsonb;cfg jsonb;profile_revision int;pid uuid;want_meet boolean;
begin
 select config,revision into cfg,profile_revision from public.scheduling_profiles where nutritionist_id=nid;
 if cfg is null or not coalesce((cfg->>'google_enabled')::boolean,false) then return null;end if;
 if kind='booking' then
  select to_jsonb(b),b.patient_id into source,pid from public.scheduling_bookings b where b.id=target and b.nutritionist_id=nid;
  select to_jsonb(candidate) into j from public.scheduling_sync_jobs candidate where candidate.booking_id=target and candidate.status='uncertain' order by candidate.created_at desc,candidate.id limit 1;
  select coalesce((cfg->>'create_meet')::boolean,false) and exists(select 1 from jsonb_array_elements(cfg->'types') t where t->>'id'=source->>'type_id' and t->>'channel'='video') into want_meet;
 elsif kind='appointment' then
  if exists(select 1 from public.scheduling_bookings where appointment_id=target) then return null;end if;
  select to_jsonb(a),a.patient_id into source,pid from public.appointments a where a.id=target and a.nutritionist_id=nid;
  select to_jsonb(candidate) into j from public.scheduling_appointment_sync_jobs candidate where candidate.appointment_id=target and candidate.status='uncertain';
  want_meet:=coalesce((cfg->>'create_meet')::boolean,false) and source->>'channel'='video';
 else return null;end if;
 if source is null or j is null or (pid is not null and not exists(select 1 from public.patients where id=pid and nutritionist_id=nid and anonymized_at is null and deactivated_at is null)) then return null;end if;
 return jsonb_build_object('job',case when kind='booking' then j->>'id' else target::text end,'kind',kind,'target',target,'nid',nid,'revision',case when kind='booking' then (source->>'revision')::int else (j->>'revision')::int end,'profile_revision',profile_revision,'starts_at',source->>'starts_at','duration_min',(source->>'duration_min')::int,'status',case when kind='appointment' then case when source->>'status'='scheduled' then 'confirmed' else 'cancelled' end else source->>'status' end,'want_meet',want_meet,'write_account',j->>'write_account','write_calendar',j->>'write_calendar','calendar',cfg->>'google_calendar_id');
end;$$;
create function public.scheduling_resolve_google_review(nid uuid,kind text,target uuid,job uuid,expected_revision int,expected_profile_revision int,expected_epoch uuid,mode text,meet text default null,requested_by uuid default null) returns boolean language plpgsql security definer set search_path='' as $$
declare context jsonb;candidate public.scheduling_sync_jobs;manual public.scheduling_appointment_sync_jobs;
begin
 if mode not in('accept_match','requeue') then raise exception 'invalid_review' using errcode='22023';end if;
 if requested_by is not null and not exists(select 1 from public.nutritionists where id=nid and user_id=requested_by) then
  if kind<>'appointment' then return false;end if;
  perform 1 from public.scheduling_staff_members where nutritionist_id=nid and user_id=requested_by and revoked_at is null for update;
  if not found then return false;end if;
 end if;
 perform public.appointment_lock_nutritionist(nid);
 perform 1 from public.scheduling_connection_epochs where nutritionist_id=nid and provider='google' and epoch=expected_epoch for update;
 if not found then return false;end if;
 perform 1 from public.scheduling_profiles where nutritionist_id=nid and revision=expected_profile_revision for update;
 if not found then return false;end if;
 if kind='booking' then
  perform 1 from public.scheduling_bookings where id=target and nutritionist_id=nid and revision=expected_revision for update;if not found then return false;end if;
  perform 1 from public.scheduling_sync_jobs where booking_id=target for update;
  select * into candidate from public.scheduling_sync_jobs where id=job and booking_id=target and status='uncertain';if not found then return false;end if;
  if exists(select 1 from public.scheduling_sync_jobs where booking_id=target and status='running') then return false;end if;
 elsif kind='appointment' then
  perform 1 from public.appointments where id=target and nutritionist_id=nid for update;if not found then return false;end if;
  select * into manual from public.scheduling_appointment_sync_jobs where appointment_id=target and appointment_id=job and status='uncertain' and revision=expected_revision for update;if not found then return false;end if;
 else return false;end if;
 context:=public.scheduling_google_review_context(nid,kind,target);
 if context is null or context->>'write_calendar' is distinct from context->>'calendar' or not exists(select 1 from public.scheduling_integrations where nutritionist_id=nid and provider='google' and connection_epoch=expected_epoch and account_id=context->>'write_account') then return false;end if;
 if kind='booking' then
  update public.scheduling_sync_jobs set status='failed',error='Envío conciliado por revisión explícita.',run_token=null,lease_until=null where booking_id=target and status in('uncertain','queued');
  insert into public.scheduling_sync_jobs(booking_id,revision,status) values(target,expected_revision,case when mode='accept_match' then 'succeeded' else 'queued' end)
  on conflict(booking_id,revision) do update set status=excluded.status,error=null,attempts=0,run_token=null,lease_until=null,write_issued=false,write_epoch=null,write_account=null,write_calendar=null;
  update public.scheduling_bookings set google_sync_status=case when mode='accept_match' then 'synced' else 'queued' end,meet_url=case when mode='accept_match' and meet~'^https://meet\.google\.com/[a-z-]+$' then meet else meet_url end where id=target;
  if mode='accept_match' and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=(select appointment_id from public.scheduling_bookings where id=target);end if;
 else
  update public.scheduling_appointment_sync_jobs set status=case when mode='accept_match' then 'succeeded' else 'queued' end,error=null,attempts=0,run_token=null,lease_until=null,write_issued=false,write_epoch=null,write_account=null,write_calendar=null where appointment_id=target;
  if mode='accept_match' and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=target;end if;
 end if;
 return true;
end;$$;
revoke all on function public.scheduling_google_review_context(uuid,text,uuid),public.scheduling_resolve_google_review(uuid,text,uuid,uuid,int,int,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.scheduling_google_review_context(uuid,text,uuid),public.scheduling_resolve_google_review(uuid,text,uuid,uuid,int,int,uuid,text,text,uuid) to service_role;
create function public.scheduling_write_connection(nid uuid,kind text,expected_epoch uuid,sealed text,account text,refresh_token uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.scheduling_connection_epochs;next_epoch uuid:=gen_random_uuid();
begin
 select * into e from public.scheduling_connection_epochs where nutritionist_id=nid and provider=kind for update;
 if not found or e.epoch<>expected_epoch or (refresh_token is not null and (e.refresh_token is distinct from refresh_token or e.refresh_until<=clock_timestamp() or not exists(select 1 from public.scheduling_integrations where nutritionist_id=nid and provider=kind and connection_epoch=expected_epoch))) then raise exception 'connection_stale' using errcode='PT409';end if;
 if length(sealed) not between 20 and 30000 or length(account) not between 1 and 200 then raise exception 'connection_invalid' using errcode='22023';end if;
 insert into public.scheduling_integrations(nutritionist_id,provider,encrypted_credentials,account_id,connection_epoch) values(nid,kind,sealed,account,next_epoch)
 on conflict(nutritionist_id,provider) do update set encrypted_credentials=excluded.encrypted_credentials,account_id=excluded.account_id,connection_epoch=excluded.connection_epoch,updated_at=clock_timestamp();
 update public.scheduling_connection_epochs set epoch=next_epoch,refresh_token=null,refresh_until=null where nutritionist_id=nid and provider=kind;
 return next_epoch;
end;$$;
create function public.scheduling_claim_connection_refresh(nid uuid,kind text,expected_epoch uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.scheduling_connection_epochs;token uuid:=gen_random_uuid();
begin
 select * into e from public.scheduling_connection_epochs where nutritionist_id=nid and provider=kind for update;
 if not found or e.epoch<>expected_epoch or (e.refresh_token is not null and e.refresh_until>clock_timestamp()) or not exists(select 1 from public.scheduling_integrations where nutritionist_id=nid and provider=kind and connection_epoch=expected_epoch) then raise exception 'connection_stale' using errcode='PT409';end if;
 update public.scheduling_connection_epochs set refresh_token=token,refresh_until=clock_timestamp()+interval '60 seconds' where nutritionist_id=nid and provider=kind;
 return token;
end;$$;
create function public.scheduling_release_connection_refresh(nid uuid,kind text,expected_epoch uuid,token uuid) returns void language sql security definer set search_path='' as $$
 update public.scheduling_connection_epochs set refresh_token=null,refresh_until=null where nutritionist_id=nid and provider=kind and epoch=expected_epoch and refresh_token=token;
$$;
create function public.scheduling_disconnect_connection(nid uuid,kind text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.scheduling_connection_epoch(nid,kind);
 perform 1 from public.scheduling_connection_epochs where nutritionist_id=nid and provider=kind for update;
 update public.scheduling_connection_epochs set epoch=gen_random_uuid(),refresh_token=null,refresh_until=null where nutritionist_id=nid and provider=kind;
 delete from public.scheduling_integrations where nutritionist_id=nid and provider=kind;
end;$$;
revoke all on function public.scheduling_connection_epoch(uuid,text),public.scheduling_write_connection(uuid,text,uuid,text,text,uuid),public.scheduling_claim_connection_refresh(uuid,text,uuid),public.scheduling_release_connection_refresh(uuid,text,uuid,uuid),public.scheduling_disconnect_connection(uuid,text) from public,anon,authenticated;
grant execute on function public.scheduling_connection_epoch(uuid,text),public.scheduling_write_connection(uuid,text,uuid,text,text,uuid),public.scheduling_claim_connection_refresh(uuid,text,uuid),public.scheduling_release_connection_refresh(uuid,text,uuid,uuid),public.scheduling_disconnect_connection(uuid,text) to service_role;

-- Both paths acquire patient first, then assignment. Recheck permission after the lock wait.
create or replace function public.revoke_patient_care(link_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare rec public.patient_care_links;
begin
 select * into rec from public.patient_care_links where id=link_id;
 if not found then raise exception 'care_missing' using errcode='P0002';end if;
 perform 1 from public.patients where id=rec.patient_id for update;
 select * into rec from public.patient_care_links where id=link_id for update;
 if not public.is_assigned_patient(rec.patient_id) and rec.granted_by is distinct from auth.uid() then raise exception 'org_forbidden' using errcode='42501';end if;
 update public.patient_care_links set revoked_at=clock_timestamp() where id=link_id and revoked_at is null;
 return public.list_patient_care_links(rec.patient_id);
end;$$;
create or replace function public.scheduling_add_shared_note(pid uuid,note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.clinical_notes;
begin
 if note is null or length(btrim(note)) not between 2 and 4000 then raise exception 'note_invalid' using errcode='22023';end if;
 perform 1 from public.patients where id=pid for update;
 perform 1 from public.patient_care_links where patient_id=pid and nutritionist_id=public.my_nutritionist_id() and revoked_at is null and link_role='delegate' for update;
 if not found or not public.scheduling_can_read_shared(pid) then raise exception 'shared_forbidden' using errcode='42501';end if;
 insert into public.clinical_notes(patient_id,author_id,version,body) select pid,auth.uid(),coalesce(max(version),0)+1,btrim(note) from public.clinical_notes where patient_id=pid returning * into r;
 return to_jsonb(r);
end;$$;

-- A request that may have reached Google is never automatically reclaimed.
alter table public.scheduling_sync_jobs drop constraint scheduling_sync_jobs_status_check;
alter table public.scheduling_sync_jobs add constraint scheduling_sync_jobs_status_check check(status in('queued','running','succeeded','failed','uncertain'));
alter table public.scheduling_sync_jobs add column write_issued boolean not null default false;
alter table public.scheduling_sync_jobs add column write_epoch uuid;
alter table public.scheduling_sync_jobs add column write_account text;
alter table public.scheduling_sync_jobs add column write_calendar text;
alter table public.scheduling_appointment_sync_jobs drop constraint scheduling_appointment_sync_jobs_status_check;
alter table public.scheduling_appointment_sync_jobs add constraint scheduling_appointment_sync_jobs_status_check check(status in('queued','running','succeeded','failed','uncertain'));
alter table public.scheduling_appointment_sync_jobs add column write_issued boolean not null default false;
alter table public.scheduling_appointment_sync_jobs add column write_epoch uuid;
alter table public.scheduling_appointment_sync_jobs add column write_account text;
alter table public.scheduling_appointment_sync_jobs add column write_calendar text;
create function public.scheduling_guard_google_write(kind text,target uuid,token uuid,expected_revision int,expected_epoch uuid,issue boolean default false,profile_revision int default null) returns boolean language plpgsql security definer set search_path='' as $$
declare nid uuid;pid uuid;valid boolean;
begin
 if kind='booking' then
  perform 1 from public.scheduling_sync_jobs where id=target and status='running' and run_token=token and lease_until>clock_timestamp() and revision=expected_revision for update;
  if not found then return false;end if;
  select b.nutritionist_id,b.patient_id,b.revision=expected_revision into nid,pid,valid from public.scheduling_bookings b join public.scheduling_sync_jobs j on j.booking_id=b.id where j.id=target;
 elsif kind='appointment' then
  perform 1 from public.scheduling_appointment_sync_jobs where appointment_id=target and status='running' and run_token=token and lease_until>clock_timestamp() and revision=expected_revision for update;
  if not found then return false;end if;
  select nutritionist_id,patient_id,true into nid,pid,valid from public.appointments where id=target;
 else return false;end if;
 if not coalesce(valid,false) or not exists(select 1 from public.scheduling_integrations where nutritionist_id=nid and provider='google' and connection_epoch=expected_epoch) or not exists(select 1 from public.scheduling_profiles where nutritionist_id=nid and coalesce((config->>'google_enabled')::boolean,false)) or (profile_revision is not null and not exists(select 1 from public.scheduling_profiles where nutritionist_id=nid and revision=profile_revision)) or (pid is not null and not exists(select 1 from public.patients where id=pid and nutritionist_id=nid and anonymized_at is null and deactivated_at is null)) then return false;end if;
 if kind='booking' then update public.scheduling_sync_jobs set lease_until=clock_timestamp()+interval '120 seconds',write_issued=write_issued or issue,write_epoch=case when issue then expected_epoch else write_epoch end,write_account=case when issue then (select account_id from public.scheduling_integrations where nutritionist_id=nid and provider='google') else write_account end,write_calendar=case when issue then (select config->>'google_calendar_id' from public.scheduling_profiles where nutritionist_id=nid) else write_calendar end where id=target;
 else update public.scheduling_appointment_sync_jobs set lease_until=clock_timestamp()+interval '120 seconds',write_issued=write_issued or issue,write_epoch=case when issue then expected_epoch else write_epoch end,write_account=case when issue then (select account_id from public.scheduling_integrations where nutritionist_id=nid and provider='google') else write_account end,write_calendar=case when issue then (select config->>'google_calendar_id' from public.scheduling_profiles where nutritionist_id=nid) else write_calendar end where appointment_id=target;end if;
 return true;
end;$$;
create function public.scheduling_mark_google_uncertain(kind text,target uuid,token uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if kind='booking' then
  update public.scheduling_sync_jobs set status='uncertain',error='Google pudo recibir el cambio. Revisá el evento antes de volver a sincronizar.',run_token=null,lease_until=null where id=target and status='running' and run_token=token and write_issued;
  if found then update public.scheduling_bookings set google_sync_status='uncertain' where id=(select booking_id from public.scheduling_sync_jobs where id=target);end if;
 elsif kind='appointment' then
  update public.scheduling_appointment_sync_jobs set status='uncertain',error='Google pudo recibir el cambio. Revisá el evento antes de volver a sincronizar.',run_token=null,lease_until=null where appointment_id=target and status='running' and run_token=token and write_issued;
 end if;
end;$$;
create or replace function public.scheduling_claim_sync_job() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.scheduling_sync_jobs;nid uuid;
begin
 update public.scheduling_sync_jobs set status=case when write_issued then 'uncertain' else 'failed' end,error='La sincronización se interrumpió. Revisá el evento en Google.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and (write_issued or attempts>=5);
 update public.scheduling_bookings b set google_sync_status='uncertain' where exists(select 1 from public.scheduling_sync_jobs pending where pending.booking_id=b.id and pending.status='uncertain');
 select c.* into j from public.scheduling_sync_jobs c where (c.status='queued' or(c.status='running' and c.lease_until<clock_timestamp())) and c.attempts<5
 and not exists(select 1 from public.scheduling_sync_jobs active where active.booking_id=c.booking_id and (active.status='uncertain' or(active.status='running' and active.lease_until>clock_timestamp())))
 order by c.created_at,c.id for update of c skip locked limit 1;
 if not found then return null;end if;
 select nutritionist_id into nid from public.scheduling_bookings where id=j.booking_id;perform public.appointment_lock_nutritionist(nid);
 if exists(select 1 from public.scheduling_sync_jobs active where active.booking_id=j.booking_id and (active.status='uncertain' or(active.status='running' and active.lease_until>clock_timestamp()))) then return null;end if;
 update public.scheduling_sync_jobs set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1,write_issued=false where id=j.id returning * into j;return to_jsonb(j);
end;$$;
create or replace function public.scheduling_claim_appointment_sync() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.scheduling_appointment_sync_jobs;
begin
 update public.scheduling_appointment_sync_jobs set status=case when write_issued then 'uncertain' else 'failed' end,error='La sincronización se interrumpió. Revisá el evento en Google.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and (write_issued or attempts>=5);
 select * into j from public.scheduling_appointment_sync_jobs where (status='queued' or(status='running' and lease_until<clock_timestamp())) and attempts<5 order by updated_at,appointment_id for update skip locked limit 1;
 if not found then return null;end if;
 update public.scheduling_appointment_sync_jobs set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1,write_issued=false where appointment_id=j.appointment_id returning * into j;return to_jsonb(j);
end;$$;
-- Changing a manual appointment does not erase an uncertain external write.
create or replace function public.scheduling_queue_manual_appointment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.scheduling_bookings where appointment_id=new.id) or not exists(select 1 from public.scheduling_profiles where nutritionist_id=new.nutritionist_id and coalesce((config->>'google_enabled')::boolean,false)) then return null;end if;
 insert into public.scheduling_appointment_sync_jobs(appointment_id) values(new.id) on conflict(appointment_id) do update set revision=scheduling_appointment_sync_jobs.revision+1,status=case when scheduling_appointment_sync_jobs.status in('running','uncertain') then scheduling_appointment_sync_jobs.status else 'queued' end,attempts=0,error=case when scheduling_appointment_sync_jobs.status='uncertain' then scheduling_appointment_sync_jobs.error else null end,updated_at=clock_timestamp();
 return null;
end;$$;
create or replace function public.scheduling_requeue_appointment_sync(nid uuid,aid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.scheduling_can_manage(nid) or not exists(select 1 from public.appointments where id=aid and nutritionist_id=nid) then raise exception 'appointment_forbidden' using errcode='42501';end if;
 if exists(select 1 from public.scheduling_bookings where appointment_id=aid) or exists(select 1 from public.scheduling_appointment_sync_jobs where appointment_id=aid and status='uncertain') then raise exception 'review_google_before_retry' using errcode='PT409';end if;
 insert into public.scheduling_appointment_sync_jobs(appointment_id) values(aid) on conflict(appointment_id) do update set status='queued',attempts=0,error=null,run_token=null,lease_until=null,write_issued=false where scheduling_appointment_sync_jobs.status<>'running';
 return jsonb_build_object('queued',true);
end;$$;
create or replace function public.scheduling_requeue_sync_job(nid uuid,bid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_bookings;
begin
 if not public.scheduling_owns(nid) then raise exception 'sync_forbidden' using errcode='42501';end if;
 select * into r from public.scheduling_bookings where id=bid and nutritionist_id=nid;
 if not found then raise exception 'sync_forbidden' using errcode='42501';end if;
 if exists(select 1 from public.scheduling_sync_jobs where booking_id=bid and status='uncertain') then raise exception 'review_google_before_retry' using errcode='PT409';end if;
 insert into public.scheduling_sync_jobs(booking_id,revision) values(bid,r.revision)
 on conflict(booking_id,revision) do update set status='queued',attempts=0,error=null,run_token=null,lease_until=null,write_issued=false,write_epoch=null where scheduling_sync_jobs.status='failed';
 return jsonb_build_object('queued',true);
end;$$;
revoke all on function public.scheduling_guard_google_write(text,uuid,uuid,int,uuid,boolean,int),public.scheduling_mark_google_uncertain(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.scheduling_guard_google_write(text,uuid,uuid,int,uuid,boolean,int),public.scheduling_mark_google_uncertain(text,uuid,uuid) to service_role;

-- A late change after HTTP cannot be undone atomically in Google. Preserve uncertainty instead of retrying.
create or replace function public.scheduling_complete_sync_job(job uuid,token uuid,meet text,failure text default null) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.scheduling_sync_jobs;r public.scheduling_bookings;
begin
 select * into j from public.scheduling_sync_jobs where id=job and status='running' and run_token=token and lease_until>clock_timestamp() for update;if not found then return false;end if;
 select * into r from public.scheduling_bookings where id=j.booking_id for update;
 if r.revision<>j.revision or (j.write_issued and (failure is not null or not exists(select 1 from public.scheduling_integrations where nutritionist_id=r.nutritionist_id and provider='google' and connection_epoch=j.write_epoch))) then
  if j.write_issued then perform public.scheduling_mark_google_uncertain('booking',job,token);
  else update public.scheduling_sync_jobs set status='failed',error='La reserva cambió.',run_token=null,lease_until=null where id=job;end if;
  return false;
 end if;
 update public.scheduling_sync_jobs set status=case when failure is null then 'succeeded' else 'failed' end,error=left(failure,300),run_token=null,lease_until=null where id=job;
 update public.scheduling_bookings set google_sync_status=case when failure is null then 'synced' else 'failed' end,meet_url=case when failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then meet else meet_url end where id=r.id;
 if failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=r.appointment_id;end if;return failure is null;
end;$$;
create or replace function public.scheduling_complete_appointment_sync(aid uuid,token uuid,expected_revision int,meet text,failure text) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.scheduling_appointment_sync_jobs;nid uuid;
begin
 select * into j from public.scheduling_appointment_sync_jobs where appointment_id=aid and status='running' and run_token=token and lease_until>clock_timestamp() for update;if not found then return false;end if;
 select nutritionist_id into nid from public.appointments where id=aid;
 if j.revision<>expected_revision or(j.write_issued and(failure is not null or not exists(select 1 from public.scheduling_integrations where nutritionist_id=nid and provider='google' and connection_epoch=j.write_epoch))) then
  if j.write_issued then perform public.scheduling_mark_google_uncertain('appointment',aid,token);
  else update public.scheduling_appointment_sync_jobs set status='queued',run_token=null,lease_until=null where appointment_id=aid;end if;
  return false;
 end if;
 update public.scheduling_appointment_sync_jobs set status=case when failure is null then 'succeeded' else 'failed' end,error=left(failure,300),run_token=null,lease_until=null where appointment_id=aid;
 if failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=aid;end if;return failure is null;
end;$$;
