-- Ignore all-silence recordings without changing stored audio, notes or permissions.
create or replace function public.consultation_auto_summary(sid uuid) returns void
language plpgsql security definer set search_path='' as $$ declare s public.consultation_sessions; begin
 select * into s from public.consultation_sessions where id=sid for update;
 if s.status<>'finished' or s.source='manual' or s.manual_transcript or s.draft<>'' or s.transcript !~ '[^[:space:]]' or not public.consultation_consent_active(s.patient_id,'care_relationship') or not public.consultation_consent_active(s.patient_id,'ai_consultation') or exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and status<>'succeeded') then return; end if;
 if exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk' and error is not null)
  or not exists(select 1 from public.consultation_tasks where session_id=sid and kind='chunk')
  or (select count(*)<>max(index)+1 or min(index)<>0 from public.consultation_tasks where session_id=sid and kind='chunk')
  or (s.expected_chunks is not null and s.expected_chunks<>(select count(*)from public.consultation_tasks where session_id=sid and kind='chunk')) then return;end if;
 insert into public.consultation_tasks(id,session_id,patient_id,nutritionist_id,requested_by,kind,revision,status,consent_version)
 values(gen_random_uuid(),sid,s.patient_id,s.nutritionist_id,s.requested_by,'summary',s.revision,'queued','ai_consultation.v1') on conflict(session_id,kind,index,revision) do nothing;
end; $$;
revoke all on function public.consultation_auto_summary(uuid) from public,anon,authenticated;
grant execute on function public.consultation_auto_summary(uuid) to service_role;

