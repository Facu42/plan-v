-- Reception is an operational membership, never a clinical role.
create table public.scheduling_staff_members (
 nutritionist_id uuid not null references public.nutritionists(id), user_id uuid not null references auth.users(id),
 granted_by uuid not null references auth.users(id), created_at timestamptz not null default now(), revoked_at timestamptz,
 primary key(nutritionist_id,user_id)
);
create table public.scheduling_staff_invites (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'), nutritionist_id uuid not null references public.nutritionists(id),
 email text not null, granted_by uuid not null references auth.users(id), expires_at timestamptz not null default now()+interval '7 days', consumed_at timestamptz
);
create table public.scheduling_contact_cards (
 patient_id uuid primary key references public.patients(id), nutritionist_id uuid not null references public.nutritionists(id),
 name text not null check(length(name) between 2 and 120), email text not null check(length(email)<=200),
 phone text not null check(length(phone)<=40), revision int not null check(revision>0), updated_at timestamptz not null default now()
);
alter table public.scheduling_staff_members enable row level security;
alter table public.scheduling_staff_invites enable row level security;
alter table public.scheduling_contact_cards enable row level security;
revoke all on public.scheduling_staff_members, public.scheduling_staff_invites,public.scheduling_contact_cards from public,anon,authenticated;
grant all on public.scheduling_staff_members, public.scheduling_staff_invites,public.scheduling_contact_cards to service_role;

create function public.scheduling_can_manage(nid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.scheduling_owns(nid) or exists(select 1 from public.scheduling_staff_members where nutritionist_id=nid and user_id=auth.uid() and revoked_at is null);
$$;
revoke all on function public.scheduling_can_manage(uuid) from public,anon;
grant execute on function public.scheduling_can_manage(uuid) to authenticated,service_role;

create function public.scheduling_invite_staff(nid uuid, contact_email text, hash_value text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.scheduling_owns(nid) then raise exception 'staff_forbidden' using errcode='42501';end if;
 if contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(contact_email)>200 or hash_value !~ '^[a-f0-9]{64}$' then raise exception 'staff_invalid' using errcode='22023';end if;
 update public.scheduling_staff_invites set consumed_at=clock_timestamp() where nutritionist_id=nid and email=lower(btrim(contact_email)) and consumed_at is null;
 insert into public.scheduling_staff_invites(token_hash,nutritionist_id,email,granted_by) values(hash_value,nid,lower(btrim(contact_email)),auth.uid());
 return jsonb_build_object('created',true);
end;$$;
create function public.scheduling_accept_staff(hash_value text) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.scheduling_staff_invites;
begin
 select * into i from public.scheduling_staff_invites where token_hash=hash_value for update;
 if not found or i.consumed_at is not null or i.expires_at<=clock_timestamp() or not exists(select 1 from auth.users where id=auth.uid() and lower(email)=i.email and email_confirmed_at is not null) then raise exception 'staff_invite_forbidden' using errcode='42501';end if;
 insert into public.scheduling_staff_members(nutritionist_id,user_id,granted_by) values(i.nutritionist_id,auth.uid(),i.granted_by) on conflict(nutritionist_id,user_id) do update set revoked_at=null,granted_by=excluded.granted_by,created_at=clock_timestamp();
 update public.scheduling_staff_invites set consumed_at=clock_timestamp() where token_hash=hash_value;
 return jsonb_build_object('nutritionist_id',i.nutritionist_id);
end;$$;
create function public.scheduling_revoke_staff(nid uuid,staff uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.scheduling_owns(nid) then raise exception 'staff_forbidden' using errcode='42501';end if;
 update public.scheduling_staff_members set revoked_at=clock_timestamp() where nutritionist_id=nid and user_id=staff;
 update public.scheduling_staff_invites set consumed_at=clock_timestamp() where nutritionist_id=nid and email=(select lower(email) from auth.users where id=staff) and consumed_at is null;
 return jsonb_build_object('revoked',true);
end;$$;
create function public.scheduling_my_workplaces() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('nutritionist_id',n.id,'name',n.display_name,'owner',n.user_id=auth.uid())),'[]'::jsonb)
 from public.nutritionists n where public.scheduling_can_manage(n.id);
$$;

create function public.scheduling_operational_snapshot(nid uuid,page_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.scheduling_can_manage(nid) then raise exception 'staff_forbidden' using errcode='42501';end if;
 if page_offset<0 or page_offset>1000000 then raise exception 'offset_invalid' using errcode='22023';end if;
 select jsonb_build_object('contacts',coalesce((select jsonb_agg(row_to_json(c)) from (
 select p.id,coalesce(card.name,p.full_name) name,coalesce(card.email,(select email from public.patient_invites where patient_id=p.id order by created_at desc limit 1),'') email,coalesce(card.phone,'') phone,coalesce(card.revision,0) revision
 from public.patients p left join public.scheduling_contact_cards card on card.patient_id=p.id and card.nutritionist_id=nid
 where p.nutritionist_id=nid and p.anonymized_at is null and p.deactivated_at is null order by p.full_name,p.id offset page_offset limit 50
 ) c),'[]'::jsonb),'has_more_contacts',(select count(*)>page_offset+50 from public.patients where nutritionist_id=nid and anonymized_at is null and deactivated_at is null)) into result;
 return result;
end;$$;

create function public.scheduling_save_contact(nid uuid,pid uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_contact_cards;
begin
 if not public.scheduling_can_manage(nid) or not exists(select 1 from public.patients where id=pid and nutritionist_id=nid and anonymized_at is null and deactivated_at is null) then raise exception 'contact_forbidden' using errcode='42501';end if;
 if payload->>'name' is null or length(btrim(payload->>'name')) not between 2 and 120 or payload->>'email' is null or length(payload->>'email')>200 or (payload->>'email'<>'' and payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') or payload->>'phone' is null or length(payload->>'phone')>40 or payload->>'expected_revision' is null or exists(select 1 from jsonb_object_keys(payload) k where k not in('name','email','phone','expected_revision')) then raise exception 'contact_invalid' using errcode='22023';end if;
 perform public.appointment_lock_nutritionist(nid);
 select * into r from public.scheduling_contact_cards where patient_id=pid for update;
 if coalesce(r.revision,0)<>(payload->>'expected_revision')::int then raise exception 'contact_stale' using errcode='PT409';end if;
 insert into public.scheduling_contact_cards(patient_id,nutritionist_id,name,email,phone,revision) values(pid,nid,btrim(payload->>'name'),lower(btrim(payload->>'email')),btrim(payload->>'phone'),1)
 on conflict(patient_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,revision=scheduling_contact_cards.revision+1,updated_at=clock_timestamp() returning * into r;
 return jsonb_build_object('id',r.patient_id,'name',r.name,'email',r.email,'phone',r.phone,'revision',r.revision);
end;$$;
revoke all on function public.scheduling_invite_staff(uuid,text,text),public.scheduling_accept_staff(text),public.scheduling_revoke_staff(uuid,uuid),public.scheduling_my_workplaces(),public.scheduling_operational_snapshot(uuid,int),public.scheduling_save_contact(uuid,uuid,jsonb) from public,anon;
grant execute on function public.scheduling_invite_staff(uuid,text,text),public.scheduling_accept_staff(text),public.scheduling_revoke_staff(uuid,uuid),public.scheduling_my_workplaces(),public.scheduling_operational_snapshot(uuid,int),public.scheduling_save_contact(uuid,uuid,jsonb) to authenticated;

-- Only booking and transfer operations are delegated. Settings and credentials remain owner-only.
create policy scheduling_booking_reception on public.scheduling_bookings for select to authenticated using(public.scheduling_can_manage(nutritionist_id));
create policy scheduling_profile_reception on public.scheduling_profiles for select to authenticated using(public.scheduling_can_manage(nutritionist_id));
create policy scheduling_transfer_reception on public.scheduling_transfer_reports for select to authenticated using(exists(select 1 from public.scheduling_bookings b where b.id=booking_id and public.scheduling_can_manage(b.nutritionist_id)));
create or replace function public.scheduling_change_booking(nid uuid,bid uuid,payload jsonb,guest_hash text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_bookings;cfg jsonb;typ jsonb;aid uuid;pid uuid;at timestamptz;op text:=payload->>'action';pro boolean:=public.scheduling_can_manage(nid);
begin
 perform public.appointment_lock_nutritionist(nid);
 select * into r from public.scheduling_bookings where id=bid and nutritionist_id=nid for update;
 if not found or (not pro and (current_setting('role',true) is distinct from 'service_role' or guest_hash is null or r.token_hash<>guest_hash)) then raise exception 'booking_forbidden' using errcode='42501';end if;
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
 return to_jsonb(r)-'token_hash'-'client_id'-'hold_until';
end; $$;
create or replace function public.scheduling_review_transfer(nid uuid,report uuid,decision text) returns jsonb language plpgsql security definer set search_path='' as $$ declare t public.scheduling_transfer_reports;begin
 if not public.scheduling_can_manage(nid) then raise exception 'transfer_forbidden' using errcode='42501';end if;
 select t1.* into t from public.scheduling_transfer_reports t1 join public.scheduling_bookings b on b.id=t1.booking_id where t1.id=report and b.nutritionist_id=nid for update of t1;
 if not found or t.status<>'reported' or decision not in('confirm','reject') then raise exception 'transfer_stale' using errcode='PT409';end if;
 update public.scheduling_transfer_reports set status=case when decision='confirm' then 'confirmed' else 'rejected' end,reviewed_at=clock_timestamp() where id=report;
 if decision='confirm' then update public.scheduling_bookings set paid_minor=paid_minor+t.amount_minor where id=t.booking_id;end if;
 return jsonb_build_object('reviewed',true);
end; $$;
-- Explicit patient assignment is separate from reception and never widens base RLS.
create function public.scheduling_can_read_shared(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patient_care_links l join public.patients p on p.id=l.patient_id
 where l.patient_id=pid and l.nutritionist_id=public.my_nutritionist_id() and l.revoked_at is null
 and l.link_role in('delegate','observer') and public.is_org_member(l.organization_id) and public.org_subscription_allows_care(l.organization_id)
 and p.anonymized_at is null and p.deactivated_at is null);
$$;
create function public.scheduling_shared_patients(page_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if public.my_nutritionist_id() is null then raise exception 'shared_forbidden' using errcode='42501';end if;
 if page_offset<0 or page_offset>1000000 then raise exception 'offset_invalid' using errcode='22023';end if;
 return coalesce((select jsonb_agg(row_to_json(x)) from(select p.id,p.full_name name from public.patients p where public.scheduling_can_read_shared(p.id) order by p.full_name,p.id offset page_offset limit 50)x),'[]'::jsonb);
end;$$;
create function public.scheduling_shared_clinical_snapshot(pid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.scheduling_can_read_shared(pid) then raise exception 'shared_forbidden' using errcode='42501';end if;
 return jsonb_build_object('patient',(select jsonb_build_object('id',id,'name',full_name,'goal',goal,'status',status) from public.patients where id=pid),
 'intake',(select payload from public.intake_sessions where patient_id=pid),
 'notes',coalesce((select jsonb_agg(row_to_json(n)) from(select id,body,created_at from public.clinical_notes where patient_id=pid order by version desc limit 50)n),'[]'::jsonb),
 'can_add_note',exists(select 1 from public.patient_care_links where patient_id=pid and nutritionist_id=public.my_nutritionist_id() and revoked_at is null and link_role='delegate'));
end;$$;
create function public.scheduling_add_shared_note(pid uuid,note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.clinical_notes;
begin
 if not public.scheduling_can_read_shared(pid) or not exists(select 1 from public.patient_care_links where patient_id=pid and nutritionist_id=public.my_nutritionist_id() and revoked_at is null and link_role='delegate') then raise exception 'shared_forbidden' using errcode='42501';end if;
 if length(btrim(note)) not between 2 and 4000 or note is null then raise exception 'note_invalid' using errcode='22023';end if;
 perform 1 from public.patients where id=pid for update;
 insert into public.clinical_notes(patient_id,author_id,version,body) select pid,auth.uid(),coalesce(max(version),0)+1,btrim(note) from public.clinical_notes where patient_id=pid returning * into r;
 return to_jsonb(r);
end;$$;
create function public.scheduling_staff_roster(nid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.scheduling_owns(nid) then raise exception 'staff_forbidden' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'email',u.email,'revoked',m.revoked_at is not null)) from public.scheduling_staff_members m join auth.users u on u.id=m.user_id where m.nutritionist_id=nid),'[]'::jsonb);
end;$$;
revoke all on function public.scheduling_can_read_shared(uuid),public.scheduling_shared_patients(int),public.scheduling_shared_clinical_snapshot(uuid),public.scheduling_add_shared_note(uuid,text),public.scheduling_staff_roster(uuid) from public,anon;
grant execute on function public.scheduling_can_read_shared(uuid),public.scheduling_shared_patients(int),public.scheduling_shared_clinical_snapshot(uuid),public.scheduling_add_shared_note(uuid,text),public.scheduling_staff_roster(uuid) to authenticated;
-- A booking has at most one live sync lease across revisions.
create or replace function public.scheduling_claim_sync_job() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.scheduling_sync_jobs; nid uuid;
begin
 update public.scheduling_sync_jobs set status='failed',error='La sincronización se interrumpió. Reintentá desde la agenda.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and attempts>=5;
 select candidate.* into j from public.scheduling_sync_jobs candidate where (candidate.status='queued' or(candidate.status='running' and candidate.lease_until<clock_timestamp())) and candidate.attempts<5
 and not exists(select 1 from public.scheduling_sync_jobs active where active.booking_id=candidate.booking_id and active.status='running' and active.lease_until>clock_timestamp())
 order by candidate.created_at,candidate.id for update of candidate skip locked limit 1;
 if not found then return null;end if;
 select nutritionist_id into nid from public.scheduling_bookings where id=j.booking_id;
 perform public.appointment_lock_nutritionist(nid);
 if exists(select 1 from public.scheduling_sync_jobs active where active.booking_id=j.booking_id and active.status='running' and active.lease_until>clock_timestamp()) then return null;end if;
 update public.scheduling_sync_jobs set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1 where id=j.id returning * into j;
 return to_jsonb(j);
end;$$;
create function public.scheduling_requeue_sync_job(nid uuid,bid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_bookings;
begin
 if not public.scheduling_owns(nid) then raise exception 'sync_forbidden' using errcode='42501';end if;
 select * into r from public.scheduling_bookings where id=bid and nutritionist_id=nid;
 if not found then raise exception 'sync_forbidden' using errcode='42501';end if;
 insert into public.scheduling_sync_jobs(booking_id,revision) values(bid,r.revision)
 on conflict(booking_id,revision) do update set status='queued',attempts=0,error=null,run_token=null,lease_until=null where scheduling_sync_jobs.status='failed';
 return jsonb_build_object('queued',true);
end;$$;
revoke all on function public.scheduling_requeue_sync_job(uuid,uuid) from public,anon;
grant execute on function public.scheduling_requeue_sync_job(uuid,uuid) to authenticated;
-- Delegate only the existing operational assertions; clinical helpers and RLS are unchanged.
create or replace function public.billing_assert_owner(target uuid) returns uuid language plpgsql stable security definer set search_path='' as $$
declare nid uuid;
begin
 select nutritionist_id into nid from public.patients where id=target and anonymized_at is null and deactivated_at is null;
 if auth.uid() is null or nid is null or not public.scheduling_can_manage(nid) then raise exception 'billing_forbidden' using errcode='42501';end if;
 return nid;
end;$$;
create or replace function public.appointment_assert_pro(pid uuid) returns uuid language plpgsql stable security definer set search_path='' as $$
declare nid uuid;
begin
 select nutritionist_id into nid from public.patients where id=pid and anonymized_at is null and deactivated_at is null;
 if auth.uid() is null or nid is null or not public.scheduling_can_manage(nid) then raise exception 'appointment_forbidden' using errcode='42501';end if;
 return nid;
end;$$;
create function public.scheduling_existing_operations(nid uuid,page_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.scheduling_can_manage(nid) then raise exception 'staff_forbidden' using errcode='42501';end if;
 if page_offset<0 or page_offset>1000000 then raise exception 'offset_invalid' using errcode='22023';end if;
 return jsonb_build_object('appointments',coalesce((select jsonb_agg(row_to_json(x)) from(select a.id,a.patient_id,p.full_name name,a.starts_at,a.duration_min,a.channel,a.status,a.meet_url,coalesce(j.status,'not_connected') google_sync_status,(select id from public.scheduling_bookings where appointment_id=a.id limit 1) booking_id from public.appointments a join public.patients p on p.id=a.patient_id left join public.scheduling_appointment_sync_jobs j on j.appointment_id=a.id where a.nutritionist_id=nid and p.deactivated_at is null and p.anonymized_at is null order by a.starts_at desc,a.id offset page_offset limit 50)x),'[]'::jsonb),
 'has_more_appointments',(select count(*)>page_offset+50 from public.appointments a join public.patients p on p.id=a.patient_id where a.nutritionist_id=nid and p.deactivated_at is null and p.anonymized_at is null));
end;$$;
revoke all on function public.scheduling_existing_operations(uuid,int) from public,anon;
grant execute on function public.scheduling_existing_operations(uuid,int) to authenticated;
create or replace function public.get_patient_ledger(target uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  if target is distinct from public.my_patient_id() then
    perform public.billing_assert_owner(target);
  end if;
  perform public.billing_sync_charges(target);
  select p.nutritionist_id into nid from public.patients p where p.id = target;
  return public.billing_ledger_json(target) || jsonb_build_object(
    'payment_info', (
      select jsonb_build_object(
        'nutritionist_name', n.display_name,
        'alias', coalesce(s.alias, ''),
        'payment_link', coalesce(s.payment_link, ''),
        'instructions', coalesce(s.instructions, '')
      )
      from public.nutritionists n
      left join public.nutritionist_payment_settings s on s.nutritionist_id = n.id
      where n.id = nid
    )
  );
end; $$;
-- The historical agenda and public reservations use the same professional lock.
create function public.scheduling_assert_appointment_holds() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
 select * into a from public.appointments where id=new.id;
 if a.id is null or a.status<>'scheduled' then return null;end if;
 perform public.appointment_lock_nutritionist(a.nutritionist_id);
 if exists(select 1 from public.scheduling_bookings b where b.nutritionist_id=a.nutritionist_id and b.appointment_id is distinct from a.id and (b.status='confirmed' or(b.status='requested' and b.hold_until>clock_timestamp())) and b.starts_at<a.starts_at+make_interval(mins=>a.duration_min) and a.starts_at<b.starts_at+make_interval(mins=>b.duration_min)) then raise exception 'booking_overlap' using errcode='PT409';end if;
 return null;
end;$$;
create constraint trigger scheduling_appointment_holds after insert or update on public.appointments deferrable initially deferred for each row execute function public.scheduling_assert_appointment_holds();
create function public.scheduling_mirror_appointment_cancel() returns trigger language plpgsql security definer set search_path='' as $$
declare b public.scheduling_bookings;
begin
 if new.status='cancelled' and old.status='scheduled' then
  for b in update public.scheduling_bookings set status='cancelled',revision=revision+1 where appointment_id=new.id and status='confirmed' returning * loop
   if exists(select 1 from public.scheduling_profiles where nutritionist_id=b.nutritionist_id and coalesce((config->>'google_enabled')::boolean,false)) then
    insert into public.scheduling_sync_jobs(booking_id,revision) values(b.id,b.revision) on conflict do nothing;
    update public.scheduling_bookings set google_sync_status='queued' where id=b.id;
   end if;
  end loop;
 end if;
 return new;
end;$$;
create trigger scheduling_mirror_appointment_cancel after update of status on public.appointments for each row execute function public.scheduling_mirror_appointment_cancel();
revoke all on function public.scheduling_assert_appointment_holds(),public.scheduling_mirror_appointment_cancel() from public,anon,authenticated;
create function public.scheduling_contact_belongs(nid uuid,pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.scheduling_can_manage(nid) and exists(select 1 from public.patients where id=pid and nutritionist_id=nid and deactivated_at is null and anonymized_at is null);
$$;
create function public.scheduling_review_existing_payment(nid uuid,payment uuid,decision text) returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 select patient_id into pid from public.patient_payments where id=payment and nutritionist_id=nid for update;
 if not public.scheduling_contact_belongs(nid,pid) then raise exception 'payment_forbidden' using errcode='42501';end if;
 return public.review_patient_payment(payment,decision);
end;$$;
create function public.scheduling_add_existing_charge(nid uuid,pid uuid,client_id uuid,amount int,due_on date,concept text) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_object('amount',amount,'due_on',due_on,'concept',concept);result jsonb;
begin
 if not public.scheduling_contact_belongs(nid,pid) then raise exception 'charge_forbidden' using errcode='42501';end if;
 if private.product_write_seen(pid,client_id,'scheduling_add_existing_charge',payload) then return public.get_patient_ledger(pid);end if;
 result:=public.add_patient_charge(pid,amount,due_on,concept);
 insert into private.product_write_receipts(actor_id,client_id,patient_id,operation,payload) values(auth.uid(),client_id,pid,'scheduling_add_existing_charge',payload);
 return result;
end;$$;
revoke all on function public.scheduling_contact_belongs(uuid,uuid),public.scheduling_review_existing_payment(uuid,uuid,text),public.scheduling_add_existing_charge(uuid,uuid,uuid,int,date,text) from public,anon;
grant execute on function public.scheduling_contact_belongs(uuid,uuid),public.scheduling_review_existing_payment(uuid,uuid,text),public.scheduling_add_existing_charge(uuid,uuid,uuid,int,date,text) to authenticated;
-- Calendar queue for historical/manual appointments. Booking-linked events keep their existing queue.
create table public.scheduling_appointment_sync_jobs(appointment_id uuid primary key references public.appointments(id),revision int not null default 1,status text not null default 'queued' check(status in('queued','running','succeeded','failed')),run_token uuid,lease_until timestamptz,attempts int not null default 0,error text,updated_at timestamptz not null default now());
alter table public.scheduling_appointment_sync_jobs enable row level security;
revoke all on public.scheduling_appointment_sync_jobs from public,anon,authenticated;
grant all on public.scheduling_appointment_sync_jobs to service_role;
create function public.scheduling_queue_manual_appointment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.scheduling_bookings where appointment_id=new.id) or not exists(select 1 from public.scheduling_profiles where nutritionist_id=new.nutritionist_id and coalesce((config->>'google_enabled')::boolean,false)) then return null;end if;
 insert into public.scheduling_appointment_sync_jobs(appointment_id) values(new.id) on conflict(appointment_id) do update set revision=scheduling_appointment_sync_jobs.revision+1,status=case when scheduling_appointment_sync_jobs.status='running' then 'running' else 'queued' end,attempts=0,error=null,updated_at=clock_timestamp();
 return null;
end;$$;
create constraint trigger scheduling_queue_manual_appointment after insert or update of starts_at,duration_min,status on public.appointments deferrable initially deferred for each row execute function public.scheduling_queue_manual_appointment();
create function public.scheduling_claim_appointment_sync() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.scheduling_appointment_sync_jobs;
begin
 update public.scheduling_appointment_sync_jobs set status='failed',error='La sincronización se interrumpió. Reintentá desde el equipo.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and attempts>=5;
 select * into j from public.scheduling_appointment_sync_jobs where (status='queued' or(status='running' and lease_until<clock_timestamp())) and attempts<5 order by updated_at,appointment_id for update skip locked limit 1;
 if not found then return null;end if;
 update public.scheduling_appointment_sync_jobs set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1 where appointment_id=j.appointment_id returning * into j;return to_jsonb(j);
end;$$;
create function public.scheduling_complete_appointment_sync(aid uuid,token uuid,expected_revision int,meet text,failure text) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.scheduling_appointment_sync_jobs;
begin
 select * into j from public.scheduling_appointment_sync_jobs where appointment_id=aid and status='running' and run_token=token and lease_until>clock_timestamp() for update;
 if not found then return false;end if;
 if j.revision<>expected_revision then update public.scheduling_appointment_sync_jobs set status='queued',run_token=null,lease_until=null where appointment_id=aid;return false;end if;
 update public.scheduling_appointment_sync_jobs set status=case when failure is null then 'succeeded' else 'failed' end,error=left(failure,300),run_token=null,lease_until=null where appointment_id=aid;
 if failure is null and meet~'^https://meet\.google\.com/[a-z-]+$' then update public.appointments set meet_url=meet where id=aid;end if;
 return failure is null;
end;$$;
create function public.scheduling_requeue_appointment_sync(nid uuid,aid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.scheduling_can_manage(nid) or not exists(select 1 from public.appointments where id=aid and nutritionist_id=nid) then raise exception 'appointment_forbidden' using errcode='42501';end if;
 if exists(select 1 from public.scheduling_bookings where appointment_id=aid) then raise exception 'use_booking_sync' using errcode='PT409';end if;
 insert into public.scheduling_appointment_sync_jobs(appointment_id) values(aid) on conflict(appointment_id) do update set status='queued',attempts=0,error=null,run_token=null,lease_until=null where scheduling_appointment_sync_jobs.status<>'running';
 return jsonb_build_object('queued',true);
end;$$;
revoke all on function public.scheduling_queue_manual_appointment(),public.scheduling_claim_appointment_sync(),public.scheduling_complete_appointment_sync(uuid,uuid,int,text,text),public.scheduling_requeue_appointment_sync(uuid,uuid) from public,anon,authenticated;
grant execute on function public.scheduling_claim_appointment_sync(),public.scheduling_complete_appointment_sync(uuid,uuid,int,text,text) to service_role;
grant execute on function public.scheduling_requeue_appointment_sync(uuid,uuid) to authenticated;
-- A public token hash is not a professional-facing column. Guest RPCs are service-only paths.
revoke select on public.scheduling_bookings from authenticated;
grant select(id,nutritionist_id,type_id,calendar_id,starts_at,duration_min,status,revision,total_minor,deposit_minor,paid_minor,currency,appointment_id,patient_id,contact_name,contact_email,contact_phone,google_sync_status,meet_url,created_at) on public.scheduling_bookings to authenticated;
