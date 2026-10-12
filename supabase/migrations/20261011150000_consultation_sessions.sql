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
 transcript text not null default '' check(length(transcript)<=100000), draft text not null default '' check(length(draft)<=50000),
 manual_transcript boolean not null default false
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
 request_key uuid not null default gen_random_uuid(),
 text text not null default '' check(length(text)<=50000), error text, consent_version text not null check(consent_version='ai_consultation.v1'),
 segments jsonb not null default '[]' check(jsonb_typeof(segments)='array' and jsonb_array_length(segments)<=1000),
 created_at timestamptz not null default clock_timestamp(), unique(session_id,kind,index,revision)
);
create index consultation_tasks_queue on public.consultation_tasks(status,created_at);
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
 if s.status<>'finished' or s.source='manual' or s.manual_transcript or s.draft<>'' or btrim(s.transcript)='' or not public.consultation_consent_active(s.patient_id,'ai_consultation') or exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status<>'succeeded') then return; end if;
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
 if n is null then raise exception 'consultation_forbidden' using errcode='42501'; end if;
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
  update public.consultation_sessions set status='finished',finished_at=clock_timestamp(),incomplete=incomplete or coalesce((payload->>'interrupted')::boolean,false),revision=revision+1 where id=sid returning * into s;
  perform public.consultation_auto_summary(sid);
 elsif op='draft' then
  if length(payload->>'draft')>50000 or length(payload->>'transcript')>100000 then raise exception 'consultation_too_long' using errcode='22023'; end if;
  if payload?'transcript' and exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status in('queued','running','uploading')) then raise exception 'transcription_pending' using errcode='PT409'; end if;
  update public.consultation_sessions set draft=coalesce(payload->>'draft',''),transcript=case when payload?'transcript' then payload->>'transcript' else transcript end,manual_transcript=manual_transcript or payload?'transcript',revision=revision+1 where id=sid returning * into s;
 elsif op='summarize' then
  if payload->>'consent_version' is distinct from 'ai_consultation.v1' or not public.consultation_consent_active(target,'ai_consultation') then raise exception 'ai_consent_required' using errcode='42501'; end if;
  if s.status<>'finished' or btrim(s.transcript)='' or exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status in('queued','running','uploading')) then raise exception 'transcription_pending' using errcode='PT409'; end if;
  insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,status,consent_version)
  values(gen_random_uuid(),sid,target,n,auth.uid(),'summary',s.revision,'queued','ai_consultation.v1')
  on conflict(session_id,kind,index,revision) do nothing;
 elsif op='retry' then
  if not public.consultation_consent_active(target,'ai_consultation') or (exists(select 1 from public.consultation_tasks where id=(payload->>'task_id')::uuid and session_id=sid and kind='chunk') and not public.consultation_consent_active(target,'consultation_recording')) then raise exception 'consultation_forbidden' using errcode='42501'; end if;
  update public.consultation_tasks set status='queued',attempts=0,error=null,run_token=null,lease_until=null,request_key=gen_random_uuid() where id=(payload->>'task_id')::uuid and session_id=sid and status='failed' and (kind='summary' or expires_at>clock_timestamp());
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
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'session_id',session_id,'kind',kind,'index',index,'status',status,'error',error) order by created_at) from public.consultation_tasks where patient_id=target),'[]');
end; $$;
revoke all on function public.consultation_list_tasks(uuid) from public,anon;
grant execute on function public.consultation_list_tasks(uuid) to authenticated;

create function public.consultation_worker_allowed(task_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.consultation_tasks t join public.patients p on p.id=t.patient_id join public.nutritionists n on n.id=t.nutritionist_id
 where t.id=task_id and p.nutritionist_id=t.nutritionist_id and n.user_id=t.requested_by and p.deactivated_at is null and p.anonymized_at is null
 and public.consultation_consent_active(p.id,'ai_consultation') and (t.kind='summary' or (public.consultation_consent_active(p.id,'consultation_recording') and t.expires_at>clock_timestamp())));
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
language plpgsql security definer set search_path='' as $$ declare t public.consultation_tasks; s public.consultation_sessions; begin
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
  update public.consultation_sessions set transcript=left(coalesce((select string_agg(text,E'\n' order by index) from public.consultation_tasks where session_id=s.id and kind='chunk' and status='succeeded'),''),100000),duration_seconds=coalesce((select sum(duration_seconds) from public.consultation_tasks where session_id=s.id and kind='chunk' and status='succeeded'),0) where id=s.id and not manual_transcript;
  perform public.consultation_auto_summary(s.id);
 end if;
 return true;
end; $$;
revoke all on function public.consultation_worker_allowed(uuid),public.consultation_claim_task(),public.consultation_renew_task(uuid,uuid),public.consultation_complete_task(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.consultation_worker_allowed(uuid),public.consultation_claim_task(),public.consultation_renew_task(uuid,uuid),public.consultation_complete_task(uuid,uuid,text,text,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('consultation-audio-private','consultation-audio-private',false,8388608,array['audio/wav']) on conflict(id) do nothing;
-- No authenticated storage policy: only the server/worker can access the audio bucket.

create function public.consultation_withdrawal() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 update public.consultation_tasks set status='cancelled',run_token=null,lease_until=null,error='El permiso cambió.',expires_at=case when new.purpose='consultation_recording' then clock_timestamp() else expires_at end
 where patient_id=new.patient_id and (new.purpose='ai_consultation' or kind='chunk') and status in('uploading','queued','running','failed');
 if new.purpose='consultation_recording' then update public.consultation_tasks set expires_at=clock_timestamp() where patient_id=new.patient_id and kind='chunk' and audio_deleted_at is null; end if;
 return new;
end; $$;
revoke all on function public.consultation_withdrawal() from public,anon,authenticated;
create trigger consultation_withdrawal after insert on public.consent_events for each row when(new.decision='withdrawn' and new.purpose in('consultation_recording','ai_consultation')) execute function public.consultation_withdrawal();
