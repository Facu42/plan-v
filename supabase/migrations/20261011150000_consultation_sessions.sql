-- Additive consultation module. No existing consent opts patients into recording or AI.
insert into public.consent_catalog(purpose,text_version,text_hash,body,required) values
('consultation_recording','consultation_recording.v1','1f82c858b2e8cb86b33821b7e6d27dff1bd18d95b74fc26104e3810921934e1d','Autorizo a mi nutricionista a grabar el audio de mis consultas en Plan V. No se guarda video. El audio es privado y se elimina a los siete días. La transcripción y las notas quedan en mi ficha. Puedo retirar este permiso y elegir notas manuales.',false),
('ai_consultation','ai_consultation.v1','e508b16fe84e902852e92159e6e61346766d568e995369e1e0f58044a7195959','Autorizo a Plan V a enviar el audio o la transcripción de mi consulta a Groq para transcribir y preparar un resumen. Puede contener datos de salud. El proveedor se configura sin retención de datos. Mi nutricionista revisa el borrador y decide qué compartir conmigo. Este permiso es opcional y puedo retirarlo.',false);

create table public.consultation_sessions (
 id uuid primary key, patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id), requested_by uuid not null references auth.users(id),
 appointment_id uuid references public.appointments(id), source text not null check(source in('manual','capture','upload')),
 status text not null check(status in('recording','finished')), revision int not null default 1 check(revision>0),
 started_at timestamptz not null default clock_timestamp(), finished_at timestamptz,
 duration_seconds double precision not null default 0 check(duration_seconds>=0),
 microphone boolean not null default false, remote_audio boolean not null default false, incomplete boolean not null default false,
 transcript text not null default '' check(octet_length(transcript)<=1048576), draft text not null default '' check(length(draft)<=50000),
 manual_transcript boolean not null default false, expected_chunks integer check(expected_chunks between 0 and 1000)
);
create index consultation_sessions_patient on public.consultation_sessions(patient_id,started_at desc,id);
create table public.consultation_shared_summaries (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.consultation_sessions(id),
 patient_id uuid not null references public.patients(id), version int not null check(version>0),
 summary text not null check(length(btrim(summary)) between 1 and 30000), published_at timestamptz not null default clock_timestamp(),
 consultation_date timestamptz not null, unique(session_id,version)
);
create table public.consultation_tasks (
 id uuid primary key, session_id uuid not null references public.consultation_sessions(id), patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id), requested_by uuid not null references auth.users(id),
 kind text not null check(kind in('chunk','summary')), revision int not null, index int not null default 0 check(index between 0 and 999),
 status text not null check(status in('uploading','queued','running','succeeded','failed','cancelled')),
 audio_path text, audio_sha256 text, expires_at timestamptz, audio_deleted_at timestamptz,
 duration_seconds double precision not null default 0 check(duration_seconds between 0 and 90),
 run_token uuid, lease_until timestamptz, attempts int not null default 0,
 request_key uuid not null default gen_random_uuid(), request_history jsonb not null default '[]' check(jsonb_typeof(request_history)='array'),
 text text not null default '' check(length(text)<=50000), error text, consent_version text not null check(consent_version='ai_consultation.v1'),
 segments jsonb not null default '[]' check(jsonb_typeof(segments)='array' and jsonb_array_length(segments)<=1000),
 source_sha256 text check(source_sha256~'^[a-f0-9]{64}$'), summary_steps jsonb not null default '[]' check(jsonb_typeof(summary_steps)='array' and octet_length(summary_steps::text)<=1048576),
 created_at timestamptz not null default clock_timestamp(), unique(session_id,kind,index,revision)
);
create index consultation_tasks_queue on public.consultation_tasks(status,created_at);
comment on column public.consultation_tasks.summary_steps is 'PHI: private summary parts bound to transcript hash and revision; never published automatically';
create index consultation_tasks_audio_expiry on public.consultation_tasks(expires_at) where audio_deleted_at is null and audio_path is not null;

alter table public.consultation_sessions enable row level security;
alter table public.consultation_shared_summaries enable row level security;
alter table public.consultation_tasks enable row level security;
revoke all on public.consultation_sessions, public.consultation_tasks, public.consultation_shared_summaries from anon,authenticated;
grant select on public.consultation_sessions,public.consultation_shared_summaries to authenticated;
grant all on public.consultation_sessions,public.consultation_tasks,public.consultation_shared_summaries to service_role;
create function public.consultation_can_read(target uuid) returns boolean
language sql stable security definer set search_path='' as $$ select exists(select 1 from public.patients p where p.id=target and p.deactivated_at is null and p.anonymized_at is null and (public.can_care_for_patient(target) or public.is_own_patient(target))) $$;
revoke all on function public.consultation_can_read(uuid) from public,anon;
grant execute on function public.consultation_can_read(uuid) to authenticated;
create policy consultation_sessions_pro on public.consultation_sessions for select to authenticated using(public.can_care_for_patient(patient_id) and public.consultation_can_read(patient_id));
create policy consultation_shared_read on public.consultation_shared_summaries for select to authenticated using(public.consultation_can_read(patient_id));

create function public.consultation_consent_active(target uuid,purpose_value text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patients p where p.id=target and p.deactivated_at is null and p.anonymized_at is null)
 and coalesce((select e.decision='granted' and e.text_version=c.text_version and e.text_hash=c.text_hash
 from public.consent_events e join public.consent_catalog c on c.purpose=e.purpose
 where e.patient_id=target and e.purpose=purpose_value order by e.sequence desc limit 1),false);
$$;
-- Keep the low-level consent check private: public callers go through authorized commands.
revoke all on function public.consultation_consent_active(uuid,text) from public,anon,authenticated;
grant execute on function public.consultation_consent_active(uuid,text) to service_role;

create function public.consultation_auto_summary(sid uuid) returns void
language plpgsql security definer set search_path='' as $$ declare s public.consultation_sessions; begin
 select * into s from public.consultation_sessions where id=sid for update;
 if s.status<>'finished' or s.source='manual' or s.manual_transcript or s.draft<>'' or btrim(s.transcript)='' or not public.consultation_consent_active(s.patient_id,'care_relationship') or not public.consultation_consent_active(s.patient_id,'ai_consultation') or exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status<>'succeeded') then return; end if;
 if exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and error is not null)
  or not exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk')
  or (select count(*)<>max(index)+1 or min(index)<>0 from public.consultation_tasks where session_id=sid and kind='chunk')
  or (s.expected_chunks is not null and s.expected_chunks<>(select count(*)from public.consultation_tasks where session_id=sid and kind='chunk')) then return;end if;
 insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,status,consent_version)
 values(gen_random_uuid(),sid,s.patient_id,s.nutritionist_id,s.requested_by,'summary',s.revision,'queued','ai_consultation.v1') on conflict(session_id,kind,index,revision) do nothing;
end; $$;
revoke all on function public.consultation_auto_summary(uuid) from public,anon,authenticated;
grant execute on function public.consultation_auto_summary(uuid) to service_role;

create function public.consultation_command(target uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.consultation_sessions; op text := payload->>'action'; sid uuid := (payload->>'id')::uuid; n uuid; latest int;
begin
 if not public.can_care_for_patient(target) then raise exception 'consultation_forbidden' using errcode='42501'; end if;
 select nutritionist_id into n from public.patients where id=target and deactivated_at is null and anonymized_at is null;
 if n is null or not public.consultation_consent_active(target,'care_relationship') then raise exception 'consultation_forbidden' using errcode='42501'; end if;
 if op='start' then
  if payload->>'source' not in('manual','capture','upload') then raise exception 'invalid_source' using errcode='22023'; end if;
  if payload->>'source'<>'manual' and (payload->>'recording_version' is distinct from 'consultation_recording.v1' or not public.consultation_consent_active(target,'consultation_recording')) then raise exception 'recording_consent_required' using errcode='42501'; end if;
  if payload->>'appointment_id' is not null and not exists(select 1 from public.appointments where id=(payload->>'appointment_id')::uuid and patient_id=target) then raise exception 'appointment_forbidden' using errcode='42501'; end if;
  insert into public.consultation_sessions(id,patient_id,nutritionist_id,requested_by,appointment_id,source,status,microphone,remote_audio,incomplete)
  values(sid,target,n,auth.uid(),(payload->>'appointment_id')::uuid,payload->>'source',case when payload->>'source'<>'manual' then 'recording' else 'finished' end,coalesce((payload->>'microphone')::boolean,false),coalesce((payload->>'remote_audio')::boolean,false),payload->>'source'='capture' and (not coalesce((payload->>'microphone')::boolean,false) or not coalesce((payload->>'remote_audio')::boolean,false))) on conflict(id) do nothing;
 end if;
 select * into s from public.consultation_sessions where id=sid and patient_id=target for update;
 if not found then raise exception 'consultation_missing' using errcode='PT404'; end if;
 if op='start' then return to_jsonb(s); end if;
 if s.revision is distinct from (payload->>'expected_revision')::int then raise exception 'consultation_stale' using errcode='PT409'; end if;
 if op='finish' then
  update public.consultation_sessions set status='finished',finished_at=clock_timestamp(),incomplete=incomplete or coalesce((payload->>'interrupted')::boolean,false),expected_chunks=coalesce((payload->>'expected_chunks')::int,expected_chunks),revision=revision+1 where id=sid returning * into s;
  perform public.consultation_auto_summary(sid);
 elsif op='draft' then
  if length(payload->>'draft')>50000 or octet_length(payload->>'transcript')>1048576 then raise exception 'consultation_too_long' using errcode='22023'; end if;
  if payload?'transcript' and exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status in('queued','running','uploading')) then raise exception 'transcription_pending' using errcode='PT409'; end if;
  update public.consultation_sessions set draft=coalesce(payload->>'draft',''),transcript=case when payload?'transcript' then payload->>'transcript' else transcript end,manual_transcript=manual_transcript or payload?'transcript',revision=revision+1 where id=sid returning * into s;
 elsif op='summarize' then
  if payload->>'consent_version' is distinct from 'ai_consultation.v1' or not public.consultation_consent_active(target,'ai_consultation') then raise exception 'ai_consent_required' using errcode='42501'; end if;
  if s.status<>'finished' or btrim(s.transcript)='' or exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status in('queued','running','uploading')) then raise exception 'transcription_pending' using errcode='PT409'; end if;
  insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,status,consent_version)
  values(gen_random_uuid(),sid,target,n,auth.uid(),'summary',s.revision,'queued','ai_consultation.v1')
  on conflict(session_id,kind,index,revision) do update set status='queued',attempts=0,error=null,run_token=null,lease_until=null,request_history=consultation_tasks.request_history||jsonb_build_array(consultation_tasks.request_key),request_key=gen_random_uuid(),requested_by=auth.uid()
  where consultation_tasks.status='cancelled';
 elsif op='retry' then
  if not public.consultation_consent_active(target,'ai_consultation') or (exists(select 1 from public.consultation_tasks where id=(payload->>'task_id')::uuid and session_id=sid and kind='chunk') and not public.consultation_consent_active(target,'consultation_recording')) then raise exception 'consultation_forbidden' using errcode='42501'; end if;
  update public.consultation_tasks set status='queued',attempts=0,error=null,run_token=null,lease_until=null,request_history=request_history||jsonb_build_array(request_key),request_key=gen_random_uuid() where id=(payload->>'task_id')::uuid and session_id=sid and status='failed' and (kind='summary' or expires_at>clock_timestamp());
  if not found then raise exception 'task_not_retryable' using errcode='PT409'; end if;
 elsif op='publish' then
  if length(btrim(coalesce(payload->>'summary',''))) not between 1 and 30000 then raise exception 'summary_required' using errcode='22023'; end if;
  select coalesce(max(version),0)+1 into latest from public.consultation_shared_summaries where session_id=sid;
  insert into public.consultation_shared_summaries(session_id,patient_id,version,summary,consultation_date) values(sid,target,latest,payload->>'summary',s.started_at);
 else raise exception 'unknown_command' using errcode='22023';
 end if;
 return to_jsonb(s);
end; $$;
revoke all on function public.consultation_command(uuid,jsonb) from public,anon;
grant execute on function public.consultation_command(uuid,jsonb) to authenticated;

create function public.consultation_enqueue_chunk(target uuid,sid uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.consultation_sessions; t public.consultation_tasks; tid uuid := (payload->>'client_id')::uuid; idx int := (payload->>'index')::int;
begin
 if not public.can_care_for_patient(target) or not public.consultation_consent_active(target,'consultation_recording') or not public.consultation_consent_active(target,'ai_consultation') then raise exception 'consultation_forbidden' using errcode='42501'; end if;
 select * into s from public.consultation_sessions where id=sid and patient_id=target for update;
 if not found then raise exception 'consultation_missing' using errcode='PT404'; end if;
 if s.source='manual' or s.manual_transcript or payload->>'consent_version' is distinct from 'ai_consultation.v1' then raise exception 'invalid_audio_session' using errcode='22023'; end if;
 if s.expected_chunks is not null and idx>=s.expected_chunks then raise exception 'unexpected_chunk' using errcode='PT409';end if;
 if (payload->>'duration_seconds')::double precision not between 0.1 and 90 or idx not between 0 and 999 or payload->>'audio_sha256' !~ '^[a-f0-9]{64}$' then raise exception 'invalid_audio' using errcode='22023'; end if;
 insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,index,status,audio_path,audio_sha256,expires_at,duration_seconds,consent_version)
 values(tid,sid,target,s.nutritionist_id,auth.uid(),'chunk',1,idx,'uploading',target::text||'/'||sid::text||'/'||tid::text||'.wav',payload->>'audio_sha256',clock_timestamp()+interval '7 days',(payload->>'duration_seconds')::double precision,'ai_consultation.v1') on conflict do nothing;
 select * into t from public.consultation_tasks where session_id=sid and kind='chunk' and index=idx and revision=1;
 if t.id is distinct from tid or t.audio_sha256 is distinct from payload->>'audio_sha256' then raise exception 'chunk_conflict' using errcode='PT409'; end if;
 return to_jsonb(t);
end; $$;
revoke all on function public.consultation_enqueue_chunk(uuid,uuid,jsonb) from public,anon;
grant execute on function public.consultation_enqueue_chunk(uuid,uuid,jsonb) to authenticated;

create function public.consultation_list_tasks(target uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if not public.can_care_for_patient(target) then raise exception 'consultation_forbidden' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'session_id',session_id,'kind',kind,'index',index,'status',status,'error',error,'completed_steps',jsonb_array_length(summary_steps)) order by created_at) from public.consultation_tasks where patient_id=target),'[]');
end; $$;
revoke all on function public.consultation_list_tasks(uuid) from public,anon;
grant execute on function public.consultation_list_tasks(uuid) to authenticated;

create function public.consultation_worker_allowed(task_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.consultation_tasks t join public.patients p on p.id=t.patient_id join public.nutritionists n on n.id=t.nutritionist_id
 where t.id=task_id and p.nutritionist_id=t.nutritionist_id and n.user_id=t.requested_by and p.deactivated_at is null and p.anonymized_at is null
 and p.archived_at is null and public.consultation_consent_active(p.id,'care_relationship') and public.consultation_consent_active(p.id,'ai_consultation') and (t.kind='summary' or (public.consultation_consent_active(p.id,'consultation_recording') and t.expires_at>clock_timestamp())));
$$;
create function public.consultation_claim_task() returns jsonb
language plpgsql security definer set search_path='' as $$ declare t public.consultation_tasks; begin
 update public.consultation_tasks set status='failed',error='Se interrumpió el procesamiento. Reintentá desde la ficha.',run_token=null,lease_until=null where status='running' and lease_until<clock_timestamp() and attempts>=5;
 select * into t from public.consultation_tasks where (status='queued' or (status='running' and lease_until<clock_timestamp())) and attempts<5 order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 update public.consultation_tasks set status='running',run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '120 seconds',attempts=attempts+1 where id=t.id returning * into t;
 return to_jsonb(t);
end; $$;
create function public.consultation_renew_task(task_id uuid,token uuid) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 update public.consultation_tasks set lease_until=clock_timestamp()+interval '120 seconds' where id=task_id and run_token=token and status='running' and lease_until>clock_timestamp(); return found;
end; $$;
create function public.consultation_complete_task(task_id uuid,token uuid,result_text text,failure text default null,result_segments jsonb default '[]') returns boolean
language plpgsql security definer set search_path='' as $$ declare t public.consultation_tasks; s public.consultation_sessions; full_transcript text; begin
 select * into t from public.consultation_tasks where id=task_id and run_token=token and status='running' and lease_until>clock_timestamp() for update;
 if not found then return false; end if;
 select * into s from public.consultation_sessions where id=t.session_id for update;
 if not public.consultation_worker_allowed(task_id) or (t.kind='summary' and s.revision<>t.revision) then
  update public.consultation_tasks set status='cancelled',text='',error='El permiso o la consulta cambió.',run_token=null,lease_until=null where id=task_id; return false;
 end if;
 if failure is not null then update public.consultation_tasks set status='failed',error=left(failure,300),run_token=null,lease_until=null where id=task_id; if t.kind='chunk' then update public.consultation_sessions set incomplete=true where id=s.id; end if; return false; end if;
 if length(result_text)>50000 then raise exception 'result_too_long' using errcode='22023'; end if;
 update public.consultation_tasks set status='succeeded',text=result_text,segments=result_segments,error=null,run_token=null,lease_until=null where id=task_id;
 if t.kind='summary' then update public.consultation_sessions set draft=result_text,revision=revision+1 where id=s.id;
 else
  select coalesce(string_agg(text,E'\n' order by index),'') into full_transcript from public.consultation_tasks where session_id=s.id and kind='chunk' and status='succeeded';
  if octet_length(full_transcript)>1048576 then update public.consultation_sessions set incomplete=true where id=s.id; update public.consultation_tasks set error='La transcripción supera 1 MB. Los segmentos se conservan para revisión.' where id=t.id; else
  update public.consultation_sessions set transcript=full_transcript,duration_seconds=coalesce((select sum(duration_seconds) from public.consultation_tasks where session_id=s.id and kind='chunk' and status='succeeded'),0) where id=s.id and not manual_transcript; end if;
  perform public.consultation_auto_summary(s.id);
 end if;
 return true;
end; $$;
revoke all on function public.consultation_worker_allowed(uuid),public.consultation_claim_task(),public.consultation_renew_task(uuid,uuid),public.consultation_complete_task(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.consultation_worker_allowed(uuid),public.consultation_claim_task(),public.consultation_renew_task(uuid,uuid),public.consultation_complete_task(uuid,uuid,text,text,jsonb) to service_role;

create function public.consultation_begin_summary(task_id uuid,token uuid,source_hash text)returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.consultation_tasks;s public.consultation_sessions;
begin
 select * into t from public.consultation_tasks where id=task_id and run_token=token and status='running' and lease_until>clock_timestamp() for update;
 if not found or t.kind<>'summary' or not public.consultation_worker_allowed(task_id) then return null;end if;
 select * into s from public.consultation_sessions where id=t.session_id for update;
 if s.revision<>t.revision or source_hash!~'^[a-f0-9]{64}$' or (t.source_sha256 is not null and t.source_sha256<>source_hash) then return null;end if;
 update public.consultation_tasks set source_sha256=source_hash where id=t.id;return t.summary_steps;
end;$$;
create function public.consultation_save_summary_step(task_id uuid,token uuid,source_hash text,step_value jsonb)returns boolean language plpgsql security definer set search_path='' as $$
declare t public.consultation_tasks;old jsonb;
begin
 select * into t from public.consultation_tasks where id=task_id and run_token=token and status='running' and lease_until>clock_timestamp() for update;
 if not found or t.kind<>'summary' or t.source_sha256 is distinct from source_hash or not public.consultation_worker_allowed(task_id)
  or not exists(select 1 from public.consultation_sessions where id=t.session_id and revision=t.revision) then return false;end if;
 if (step_value->>'level')::integer not between 0 and 7 or (step_value->>'index')::integer not between 0 and 999
  or coalesce(step_value->>'digest','')!~'^[a-f0-9]{64}$' or octet_length(btrim(coalesce(step_value->>'text',''))) not between 1 and 8000 then raise exception 'invalid_summary_step' using errcode='22023';end if;
 select v into old from jsonb_array_elements(t.summary_steps)v where v->>'level'=step_value->>'level' and v->>'index'=step_value->>'index';
 if old is not null then if old<>step_value then raise exception 'summary_step_conflict' using errcode='PT409';end if;return true;end if;
 update public.consultation_tasks set summary_steps=summary_steps||jsonb_build_array(step_value) where id=t.id;return true;
end;$$;
-- Atomic charge + private response checkpoint. Lost leases still account for cost, but cannot persist PHI.
create function public.cache_clinical_provider_result(operation_key text,cost_micros bigint,task_id uuid,token uuid,task_revision integer,response_value jsonb)returns boolean language plpgsql security definer set search_path='' as $$
declare t public.consultation_tasks;
begin
 perform public.settle_clinical_ai_budget(operation_key,'charged',cost_micros);
 select * into t from public.consultation_tasks where id=task_id and run_token=token and status='running' and lease_until>clock_timestamp() for update;
 if not found or not public.consultation_worker_allowed(task_id) or (t.kind='summary' and (t.revision<>task_revision or not exists(select 1 from public.consultation_sessions where id=t.session_id and revision=t.revision))) then return false;end if;
 if operation_key not like (case when t.kind='chunk' then 'transcribe:' else 'summary:' end)||t.request_key::text||'%'
  or coalesce(response_value->>'fingerprint','')!~'^[a-f0-9]{64}$' or octet_length(response_value::text)>1100000 then raise exception 'invalid_provider_checkpoint' using errcode='22023';end if;
 update public.clinical_ai_spend set response_cache=response_value||jsonb_build_object('patient_id',t.patient_id,'task_id',t.id) where clinical_ai_spend.operation_key=cache_clinical_provider_result.operation_key;return true;
end;$$;
revoke all on function public.consultation_begin_summary(uuid,uuid,text),public.consultation_save_summary_step(uuid,uuid,text,jsonb),public.cache_clinical_provider_result(text,bigint,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.consultation_begin_summary(uuid,uuid,text),public.consultation_save_summary_step(uuid,uuid,text,jsonb),public.cache_clinical_provider_result(text,bigint,uuid,uuid,integer,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('consultation-audio-private','consultation-audio-private',false,8388608,array['audio/wav']) on conflict(id) do nothing;
-- No authenticated storage policy: only the server/worker can access the audio bucket.

create function public.consultation_withdrawal() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if to_regclass('public.clinical_ai_spend') is not null then update public.clinical_ai_spend set response_cache=null where response_cache->>'patient_id'=new.patient_id::text;end if;
 update public.consultation_tasks set status='cancelled',run_token=null,lease_until=null,error='El permiso cambió.',expires_at=case when new.purpose in('care_relationship','consultation_recording') then clock_timestamp() else expires_at end
 where patient_id=new.patient_id and (new.purpose in('care_relationship','ai_consultation') or kind='chunk') and status in('uploading','queued','running','failed');
 if new.purpose in('care_relationship','consultation_recording') then update public.consultation_tasks set expires_at=clock_timestamp() where patient_id=new.patient_id and kind='chunk' and audio_deleted_at is null; end if;
 return new;
end; $$;
revoke all on function public.consultation_withdrawal() from public,anon,authenticated;
create trigger consultation_withdrawal after insert on public.consent_events for each row when(new.decision='withdrawn' and new.purpose in('care_relationship','consultation_recording','ai_consultation')) execute function public.consultation_withdrawal();
