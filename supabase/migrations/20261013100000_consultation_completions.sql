-- Clinical completion is an explicit professional attestation, independent of
-- attendance replies, elapsed appointment time, audio processing and scheduling.
create table public.consultation_completions (
 appointment_id uuid primary key references public.appointments(id),
 patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id),
 appointment_starts_at timestamptz not null,
 completed boolean not null,
 revision integer not null check (revision > 0),
 marked_by uuid not null,
 marked_at timestamptz not null default clock_timestamp()
);
create index consultation_completions_patient on public.consultation_completions(patient_id,completed);
create table public.consultation_completion_events (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null references public.consultation_completions(appointment_id),
 patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id),
 appointment_starts_at timestamptz not null,
 revision integer not null check (revision > 0),
 completed boolean not null,
 actor_id uuid not null,
 recorded_at timestamptz not null default clock_timestamp(),
 unique(appointment_id,revision)
);
create index consultation_completion_events_patient on public.consultation_completion_events(patient_id,recorded_at);
alter table public.consultation_completions enable row level security;
alter table public.consultation_completion_events enable row level security;
revoke all on public.consultation_completions,public.consultation_completion_events from public,anon,authenticated;
grant select on public.consultation_completions,public.consultation_completion_events to authenticated;
grant all on public.consultation_completions,public.consultation_completion_events to service_role;
create policy consultation_completions_pro on public.consultation_completions for select to authenticated
 using(nutritionist_id=public.my_nutritionist_id() and public.is_assigned_patient(patient_id) and public.consultation_can_read(patient_id));
create policy consultation_completion_events_pro on public.consultation_completion_events for select to authenticated
 using(nutritionist_id=public.my_nutritionist_id() and public.is_assigned_patient(patient_id) and public.consultation_can_read(patient_id));

create function public.consultation_completion_list(target uuid,page_offset integer default 0,page_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare n uuid; result jsonb; more boolean;
begin
 if page_offset is null or page_offset<0 or page_limit is null or page_limit<1 or page_limit>100 then raise exception 'invalid_page' using errcode='22023'; end if;
 if not public.can_care_for_patient(target) or not exists(select 1 from public.nutritionists where user_id=auth.uid()) then raise exception 'completion_forbidden' using errcode='42501'; end if;
 select nutritionist_id into n from public.patients where id=target and deactivated_at is null and anonymized_at is null;
 if n is null or n is distinct from public.my_nutritionist_id() or not public.consultation_consent_active(target,'care_relationship') then raise exception 'completion_forbidden' using errcode='42501'; end if;
 select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) into result from (
  select a.id appointment_id,a.starts_at,a.duration_min,a.channel,a.status,
   coalesce(c.completed,false) completed,coalesce(c.revision,0) revision,c.marked_at,c.marked_by,c.appointment_starts_at
  from public.appointments a left join public.consultation_completions c on c.appointment_id=a.id and c.patient_id=target and c.nutritionist_id=n
  where a.patient_id=target and a.nutritionist_id=n order by a.starts_at desc,a.id offset page_offset limit page_limit
 ) x;
 select exists(select 1 from public.appointments where patient_id=target and nutritionist_id=n offset page_offset+page_limit) into more;
 return jsonb_build_object('appointments',result,'has_more',more,'total_completed',(select count(*) from public.consultation_completions where patient_id=target and nutritionist_id=n and completed));
end; $$;

create function public.consultation_completion_command(target uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid; a public.appointments; previous public.consultation_completions; result public.consultation_completions;
 aid uuid; expected integer; desired boolean;
begin
 if jsonb_typeof(payload)<>'object' or (payload - array['appointment_id','expected_revision','completed','confirmed'])<>'{}'::jsonb
  or jsonb_typeof(payload->'appointment_id') is distinct from 'string' or jsonb_typeof(payload->'expected_revision') is distinct from 'number'
  or jsonb_typeof(payload->'completed') is distinct from 'boolean' or payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'invalid_completion' using errcode='22023'; end if;
 aid=(payload->>'appointment_id')::uuid; expected=(payload->>'expected_revision')::integer; desired=(payload->>'completed')::boolean;
 if expected<0 then raise exception 'invalid_revision' using errcode='22023'; end if;
 if not public.can_care_for_patient(target) or not exists(select 1 from public.nutritionists where user_id=auth.uid()) then raise exception 'completion_forbidden' using errcode='42501'; end if;
 select nutritionist_id into n from public.patients where id=target and deactivated_at is null and anonymized_at is null for update;
 if n is null or n is distinct from public.my_nutritionist_id() or not public.consultation_consent_active(target,'care_relationship') then raise exception 'completion_forbidden' using errcode='42501'; end if;
 select * into a from public.appointments where id=aid and patient_id=target and nutritionist_id=n for update;
 if not found then raise exception 'appointment_forbidden' using errcode='42501'; end if;
 select * into previous from public.consultation_completions where appointment_id=aid for update;
 if coalesce(previous.revision,0)<>expected or (previous.appointment_id is not null and (previous.patient_id<>target or previous.nutritionist_id<>n or previous.completed=desired)) or (previous.appointment_id is null and not desired) then raise exception 'completion_changed' using errcode='PT409'; end if;
 if desired and (a.status::text not in('scheduled','done') or a.starts_at>=clock_timestamp()) then raise exception 'appointment_not_performed' using errcode='PT409'; end if;
 insert into public.consultation_completions(appointment_id,patient_id,nutritionist_id,appointment_starts_at,completed,revision,marked_by,marked_at)
 values(aid,target,n,a.starts_at,desired,expected+1,auth.uid(),clock_timestamp())
 on conflict(appointment_id) do update set completed=excluded.completed,revision=excluded.revision,marked_by=excluded.marked_by,marked_at=excluded.marked_at,appointment_starts_at=excluded.appointment_starts_at returning * into result;
 insert into public.consultation_completion_events(appointment_id,patient_id,nutritionist_id,appointment_starts_at,revision,completed,actor_id)
 values(aid,target,n,a.starts_at,result.revision,desired,auth.uid());
 return to_jsonb(result);
end; $$;
revoke all on function public.consultation_completion_list(uuid,integer,integer),public.consultation_completion_command(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.consultation_completion_list(uuid,integer,integer),public.consultation_completion_command(uuid,jsonb) to authenticated;
