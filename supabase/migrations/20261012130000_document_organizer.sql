-- Aditiva. Organización opcional de texto local: no importa ni cambia valores/pacientes.
-- Rollback operativo: apagar Groq, conservar trabajos/auditoría; no retirar filas con reserva activa.
insert into public.consent_catalog(purpose,text_version,text_hash,body,required) values
('ai_document_import','ai_document_import.v1','85048f59e7b145b60b06c7123a7df5f2ca4cb83591ae2e1c371de6d417f8e9a7','Autorizo a Plan V a enviar a Groq el texto de mis documentos ya extraído localmente para proponer categorías y encabezados de mi ficha. Puede contener datos de salud. El proveedor se configura sin retención de datos. No se inventan ni cambian valores o textos originales. Mi nutricionista revisa cada propuesta antes de incorporarla. Este permiso es opcional y puedo retirarlo; puedo continuar con organización manual.',false);
create table public.document_organizer_jobs (
 id uuid primary key default gen_random_uuid(),patient_id uuid not null references public.patients(id),nutritionist_id uuid not null references public.nutritionists(id),requested_by uuid not null,
 request_key uuid not null,source_hash text not null check(source_hash~'^[a-f0-9]{64}$'),items jsonb not null,
 consent_version text not null default 'ai_document_import.v1' check(consent_version='ai_document_import.v1'),ai_sequence bigint not null,care_sequence bigint not null,
 status text not null default 'queued' check(status in('queued','running','review','reviewed','failed','cancelled','uncertain')),
 stage text not null default 'queued' check(stage in('queued','claimed','request_issued','generated')),
 revision integer not null default 1,run_token uuid,operation_key text,lease_until timestamptz,attempts integer not null default 0,
 proposals jsonb not null default '[]',reviewed jsonb not null default '[]',error text,created_at timestamptz not null default clock_timestamp(),
 unique(patient_id,nutritionist_id,request_key),check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 40 and octet_length(items::text)<=120000)
);
create index document_organizer_queue on public.document_organizer_jobs(status,created_at);
alter table public.document_organizer_jobs enable row level security;
revoke all on public.document_organizer_jobs from public,anon,authenticated;
grant all on public.document_organizer_jobs to service_role;
create function public.document_organizer_consent(target uuid,purpose_value text) returns bigint language sql stable security definer set search_path='' as $$
 select case when e.decision='granted' and e.text_version=c.text_version and e.text_hash=c.text_hash then e.sequence else null end
 from public.consent_events e join public.consent_catalog c on c.purpose=e.purpose where e.patient_id=target and e.purpose=purpose_value
 and (purpose_value<>'ai_document_import' or c.text_version='ai_document_import.v1') order by e.sequence desc limit 1
$$;
create function public.document_organizer_permission(target uuid,nid uuid,actor uuid,ai_seq bigint,care_seq bigint) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.patients p join public.nutritionists n on n.id=p.nutritionist_id join public.profiles u on u.id=n.user_id
 where p.id=target and p.nutritionist_id=nid and n.user_id=actor and u.role='nutri' and p.user_id is not null
 and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null)
 and coalesce(public.document_organizer_consent(target,'ai_document_import')=ai_seq,false)
 and coalesce(public.document_organizer_consent(target,'care_relationship')=care_seq,false)
$$;
create function public.document_organizer_result_valid(result_value jsonb,source_items jsonb,subset boolean) returns boolean language plpgsql immutable set search_path='' as $$
declare r jsonb;idx integer;seen integer[]='{}';
begin
 if jsonb_typeof(result_value) is distinct from 'array' or jsonb_array_length(result_value) not between 1 and 40
 or (not subset and jsonb_array_length(result_value)<>jsonb_array_length(source_items)) then return false;end if;
 for r in select value from jsonb_array_elements(result_value) loop
  if jsonb_typeof(r) is distinct from 'object' or r-array['index','category','heading']<>'{}'::jsonb
  or jsonb_typeof(r->'index') is distinct from 'number' or (r->>'index')!~'^[0-9]{1,2}$'
  or coalesce(r->>'category','') not in('history','study','plan') or jsonb_typeof(r->'heading') is distinct from 'string'
  or length(r->>'heading') not between 2 and 100 or length(btrim(r->>'heading'))<2 then return false;end if;
  idx=(r->>'index')::integer;
  if idx<0 or idx>=jsonb_array_length(source_items) or idx=any(seen) or position((r->>'heading') in (source_items->idx->>'text'))=0 then return false;end if;
  seen=array_append(seen,idx);
 end loop;return true;
end $$;
create function public.document_organizer_enqueue(target uuid,key_value uuid,hash_value text,source_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare nid uuid;ai_seq bigint;care_seq bigint;r jsonb;j public.document_organizer_jobs;total_bytes integer;
begin
 select n.id into nid from public.nutritionists n join public.profiles u on u.id=n.user_id where n.user_id=auth.uid() and u.role='nutri';
 ai_seq=public.document_organizer_consent(target,'ai_document_import');care_seq=public.document_organizer_consent(target,'care_relationship');
 if not public.document_organizer_permission(target,nid,auth.uid(),ai_seq,care_seq) then raise exception using errcode='42501',message='organizer_scope_or_consent';end if;
 if key_value is null or hash_value is null or hash_value!~'^[a-f0-9]{64}$' or jsonb_typeof(source_items) is distinct from 'array'
 or jsonb_array_length(source_items) not between 1 and 40 or octet_length(source_items::text)>120000 then raise exception using errcode='22023',message='organizer_sources';end if;
 total_bytes=0;
 for r in select value from jsonb_array_elements(source_items) loop
  if jsonb_typeof(r) is distinct from 'object' or r-array['text','origin','category']<>'{}'::jsonb or jsonb_typeof(r->'text') is distinct from 'string'
  or length(r->>'text') not between 2 and 3000 or coalesce(r->>'category','') not in('history','study','plan')
  or jsonb_typeof(r->'origin') is distinct from 'object' or coalesce(r->'origin'->>'fingerprint','')!~'^[a-f0-9]{64}$'
  or jsonb_typeof(r->'origin'->'file') is distinct from 'string' or length(r->'origin'->>'file') not between 1 and 120
  or (r->'origin'->>'file')~'[/\\]' then raise exception using errcode='22023',message='organizer_sources';end if;
  total_bytes=total_bytes+octet_length(r->>'text');
 end loop;
 if total_bytes>60000 then raise exception using errcode='22023',message='organizer_size';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text||target::text||key_value::text,0));
 select * into j from public.document_organizer_jobs where patient_id=target and nutritionist_id=nid and request_key=key_value;
 if found then if j.items<>source_items or j.source_hash<>hash_value then raise exception using errcode='23505',message='organizer_key_conflict';end if;return j.id;end if;
 insert into public.document_organizer_jobs(patient_id,nutritionist_id,requested_by,request_key,source_hash,items,ai_sequence,care_sequence)
 values(target,nid,auth.uid(),key_value,hash_value,source_items,ai_seq,care_seq) returning id into j.id;return j.id;
end $$;
create function public.document_organizer_read(job_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 select * into j from public.document_organizer_jobs where id=job_id;
 if not found or not exists(select 1 from public.nutritionists n join public.profiles u on u.id=n.user_id where n.id=j.nutritionist_id and n.user_id=auth.uid() and u.role='nutri')
 then raise exception using errcode='42501',message='organizer_scope';end if;
 if not public.document_organizer_permission(j.patient_id,j.nutritionist_id,j.requested_by,j.ai_sequence,j.care_sequence) then
 return (to_jsonb(j)-'items'-'proposals'-'reviewed')||jsonb_build_object('status','cancelled','items','[]'::jsonb,'proposals','[]'::jsonb,'reviewed','[]'::jsonb,'error','El permiso o la asignación cambió.');end if;
 return to_jsonb(j);
end $$;
create function public.document_organizer_allowed(job_id uuid,token uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select j.status='running' and j.run_token=token and j.lease_until>clock_timestamp()
 and public.document_organizer_permission(j.patient_id,j.nutritionist_id,j.requested_by,j.ai_sequence,j.care_sequence) from public.document_organizer_jobs j where id=job_id),false)
$$;
create function public.document_organizer_list(target uuid,hash_value text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.patients p join public.nutritionists n on n.id=p.nutritionist_id join public.profiles u on u.id=n.user_id where p.id=target and n.user_id=auth.uid() and u.role='nutri')
 then raise exception using errcode='42501',message='organizer_scope';end if;
 return coalesce((select jsonb_agg(public.document_organizer_read(j.id) order by j.created_at desc,j.id)
 from (select * from public.document_organizer_jobs where patient_id=target
 and nutritionist_id=(select id from public.nutritionists where user_id=auth.uid())
 and (hash_value is null or source_hash=hash_value) order by created_at desc,id limit 50) j),'[]'::jsonb);
end $$;
create function public.document_organizer_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 loop
 select * into j from public.document_organizer_jobs where status='queued' or (status='running' and lease_until<clock_timestamp()) order by created_at,id for update skip locked limit 1;
 if not found then return null;end if;
 if not public.document_organizer_permission(j.patient_id,j.nutritionist_id,j.requested_by,j.ai_sequence,j.care_sequence) then
 update public.document_organizer_jobs set status='cancelled',proposals='[]',reviewed='[]',error='El permiso o la asignación cambió.' where id=j.id;continue;end if;
 if j.stage='request_issued' then
  if exists(select 1 from public.clinical_ai_spend where operation_key=j.operation_key and status='reserved') then perform public.settle_clinical_ai_budget(j.operation_key,'uncertain',0);end if;
  update public.document_organizer_jobs set status='uncertain',error='Envío interrumpido: no se repetirá automáticamente.',run_token=null,lease_until=null where id=j.id;continue;
 end if;
 if j.attempts>=3 and j.stage<>'generated' then update public.document_organizer_jobs set status='failed',error='No se pudo reservar el procesamiento.' where id=j.id;continue;end if;
 if j.stage='claimed' and exists(select 1 from public.clinical_ai_spend where operation_key=j.operation_key and status='reserved') then perform public.settle_clinical_ai_budget(j.operation_key,'released',0);end if;
 update public.document_organizer_jobs set status='running',stage=case when stage='generated' then stage else 'claimed' end,run_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '90 seconds',attempts=attempts+1 where id=j.id returning * into j;
 if j.stage<>'generated' then update public.document_organizer_jobs set operation_key='organize:'||id::text||':'||run_token::text where id=j.id returning * into j;end if;
 return to_jsonb(j);
 end loop;
end $$;
create function public.document_organizer_renew(job_id uuid,token uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.document_organizer_allowed(job_id,token) then return false;end if;
 update public.document_organizer_jobs set lease_until=clock_timestamp()+interval '90 seconds' where id=job_id and run_token=token;return found;
end $$;
create function public.document_organizer_issue(job_id uuid,token uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.document_organizer_allowed(job_id,token) then return false;end if;
 update public.document_organizer_jobs set stage='request_issued',revision=revision+1 where id=job_id and run_token=token and stage='claimed';return found;
end $$;
create function public.document_organizer_generated(job_id uuid,token uuid,result_value jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 select * into j from public.document_organizer_jobs where id=job_id for update;
 if not public.document_organizer_allowed(job_id,token) then return false;end if;
 if not public.document_organizer_result_valid(result_value,j.items,false) then raise exception using errcode='22023',message='organizer_result';end if;
 update public.document_organizer_jobs set stage='generated',proposals=result_value,revision=revision+1 where id=job_id and run_token=token and stage='request_issued';return found;
end $$;
create function public.document_organizer_finish(job_id uuid,token uuid,failure text) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 select * into j from public.document_organizer_jobs where id=job_id for update;
 if not found or j.run_token is distinct from token or j.status<>'running' or j.lease_until<=clock_timestamp() then return false;end if;
 if not public.document_organizer_permission(j.patient_id,j.nutritionist_id,j.requested_by,j.ai_sequence,j.care_sequence) then failure='cancelled';end if;
 if failure is null and j.stage<>'generated' then return false;end if;
 if failure is not null and failure not in('config','quota','invalid','cancelled','uncertain') then failure='invalid';end if;
 update public.document_organizer_jobs set status=case when failure is null then 'review' when failure in('cancelled','uncertain') then failure else 'failed' end,
 error=failure,proposals=case when failure is null then proposals else '[]'::jsonb end,run_token=null,lease_until=null,revision=revision+1 where id=job_id;return true;
end $$;
create function public.document_organizer_review(job_id uuid,expected_revision integer,choices jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 perform public.document_organizer_read(job_id);select * into j from public.document_organizer_jobs where id=job_id for update;
 if not public.document_organizer_permission(j.patient_id,j.nutritionist_id,j.requested_by,j.ai_sequence,j.care_sequence) then raise exception using errcode='42501',message='organizer_consent';end if;
 if j.revision<>expected_revision or j.status not in('review','reviewed') then raise exception using errcode='40001',message='organizer_revision';end if;
 if not public.document_organizer_result_valid(choices,j.items,true) then raise exception using errcode='22023',message='organizer_review';end if;
 update public.document_organizer_jobs set status='reviewed',reviewed=choices,revision=revision+1 where id=job_id returning * into j;return to_jsonb(j);
end $$;
create function public.document_organizer_withdrawal() returns trigger language plpgsql security definer set search_path='' as $$
declare j public.document_organizer_jobs;
begin
 for j in select * from public.document_organizer_jobs where patient_id=new.patient_id and status in('queued','running','review') for update loop
  if j.operation_key is not null and exists(select 1 from public.clinical_ai_spend where operation_key=j.operation_key and status='reserved') then
   perform public.settle_clinical_ai_budget(j.operation_key,case when j.stage='claimed' then 'released' else 'uncertain' end,0);
  end if;
  update public.document_organizer_jobs set status='cancelled',proposals='[]',reviewed='[]',run_token=null,lease_until=null,revision=revision+1,error='El permiso fue retirado.' where id=j.id;
 end loop;return new;
end $$;
create trigger document_organizer_withdrawal after insert on public.consent_events for each row
when(new.decision='withdrawn' and new.purpose in('care_relationship','ai_document_import')) execute function public.document_organizer_withdrawal();
revoke all on function public.document_organizer_withdrawal() from public,anon,authenticated;
revoke all on function public.document_organizer_consent(uuid,text),public.document_organizer_permission(uuid,uuid,uuid,bigint,bigint),public.document_organizer_result_valid(jsonb,jsonb,boolean),
public.document_organizer_enqueue(uuid,uuid,text,jsonb),public.document_organizer_read(uuid),public.document_organizer_list(uuid,text),public.document_organizer_allowed(uuid,uuid),public.document_organizer_claim(),public.document_organizer_renew(uuid,uuid),public.document_organizer_issue(uuid,uuid),public.document_organizer_generated(uuid,uuid,jsonb),public.document_organizer_finish(uuid,uuid,text),public.document_organizer_review(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.document_organizer_enqueue(uuid,uuid,text,jsonb),public.document_organizer_read(uuid),public.document_organizer_list(uuid,text),public.document_organizer_review(uuid,integer,jsonb) to authenticated;
grant execute on function public.document_organizer_allowed(uuid,uuid),public.document_organizer_claim(),public.document_organizer_renew(uuid,uuid),public.document_organizer_issue(uuid,uuid),public.document_organizer_generated(uuid,uuid,jsonb),public.document_organizer_finish(uuid,uuid,text) to service_role;
