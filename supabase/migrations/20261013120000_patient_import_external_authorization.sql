-- Evidencia clínica externa limitada a importar historia. No crea consentimientos de app.
begin;
create table public.patient_import_authorizations (
 id uuid primary key default gen_random_uuid(),patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id),actor_id uuid not null references public.profiles(id),
 request_key uuid not null,revision integer not null check(revision>0),decision text not null check(decision in('granted','revoked')),
 evidence jsonb not null,created_at timestamptz not null default clock_timestamp(),
 unique(patient_id,revision),unique(nutritionist_id,request_key)
);
create table public.patient_import_measurements (
 id uuid primary key default gen_random_uuid(),patient_id uuid not null references public.patients(id),nutritionist_id uuid not null references public.nutritionists(id),
 kind text not null check(kind in('weight','waist','hip')),value numeric not null check(value>0 and value<=500),
 unit text not null check(unit in('kg','lb','cm','in')),recorded_on date not null,origin jsonb not null check(jsonb_typeof(origin)='object'),created_at timestamptz not null default clock_timestamp(),
 check((kind='weight' and unit in('kg','lb'))or(kind in('waist','hip')and unit in('cm','in')and value between 10 and 300))
);
alter table public.patient_import_authorizations enable row level security;
alter table public.patient_import_measurements enable row level security;
revoke all on public.patient_import_authorizations,public.patient_import_measurements from public,anon,authenticated;
grant select on public.patient_import_authorizations,public.patient_import_measurements to authenticated;
create policy import_authorization_owner on public.patient_import_authorizations for select to authenticated using(nutritionist_id=public.my_nutritionist_id()and actor_id=auth.uid()and exists(select 1 from public.patients p where p.id=patient_id and p.nutritionist_id=public.my_nutritionist_id()and p.deactivated_at is null and p.anonymized_at is null));

create function public.patient_import_external_allowed(target uuid,purpose_value text)returns boolean
language sql stable security definer set search_path='' as $$
 select purpose_value in('history','study','plan','measurement')and exists(select 1 from public.patients p
 where p.id=target and p.nutritionist_id=public.my_nutritionist_id()and p.user_id is null and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null)
 and coalesce((select a.nutritionist_id=public.my_nutritionist_id()and a.actor_id=auth.uid()and a.decision='granted' and a.evidence->'purposes'?purpose_value from public.patient_import_authorizations a
 where a.patient_id=target order by a.revision desc limit 1),false)
 and not exists(select 1 from public.consent_events e where e.patient_id=target
 and e.purpose in('care_relationship',case when purpose_value='study'then 'clinical_document'when purpose_value='measurement'then 'measurement'else 'care_relationship'end)
 and e.decision='withdrawn'and e.sequence=(select max(x.sequence)from public.consent_events x where x.patient_id=target and x.purpose=e.purpose));
$$;
create function public.patient_import_authorization_state(target uuid)returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare p public.patients;a public.patient_import_authorizations;
begin
 select * into p from public.patients where id=target and nutritionist_id=public.my_nutritionist_id()and deactivated_at is null and anonymized_at is null;
 if not found then raise exception using errcode='42501',message='import_authorization_scope';end if;
 select * into a from public.patient_import_authorizations where patient_id=target order by revision desc limit 1;
 return jsonb_build_object('patient_id',target,'revision',coalesce(a.revision,0),'account_linked',p.user_id is not null,'evidence',case when a.id is not null and a.nutritionist_id=public.my_nutritionist_id()and a.actor_id=auth.uid()then to_jsonb(a)-'actor_id'-'nutritionist_id'else null end,
 'allowed',jsonb_build_object('history',public.patient_import_external_allowed(target,'history')or public.care_consent(target,'care_relationship'),
 'plan',public.patient_import_external_allowed(target,'plan')or public.care_consent(target,'care_relationship'),
 'study',public.patient_import_external_allowed(target,'study')or(public.care_consent(target,'care_relationship')and public.care_consent(target,'clinical_document')),
 'measurement',public.patient_import_external_allowed(target,'measurement')or(public.care_consent(target,'care_relationship')and public.care_consent(target,'measurement'))));
end;$$;
create function public.record_patient_import_authorization(target uuid,key_value uuid,expected_revision integer,payload jsonb)returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.patients;prior public.patient_import_authorizations;current_revision integer;purpose_value text;retirement timestamptz;
begin
 select * into p from public.patients where id=target and nutritionist_id=public.my_nutritionist_id()and archived_at is null and deactivated_at is null and anonymized_at is null for update;
 if not found or p.user_id is not null then raise exception using errcode='42501',message='import_authorization_unlinked_owner_only';end if;
 insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;
 perform 1 from public.intake_sessions where patient_id=target for update;
 if key_value is null or expected_revision is null or jsonb_typeof(payload)is distinct from 'object'
 or exists(select 1 from jsonb_object_keys(payload)k where k not in('obtained_on','source','document','purposes','confirmed'))
 or not(payload?&array['obtained_on','source','document','purposes','confirmed'])or payload->'confirmed'is distinct from 'true'::jsonb
 or jsonb_typeof(payload->'source')is distinct from 'string'or length(btrim(payload->>'source'))not between 3 and 500
 or jsonb_typeof(payload->'obtained_on')is distinct from 'string'or(payload->>'obtained_on')!~'^\d{4}-\d{2}-\d{2}$'
 or(payload->>'obtained_on')::date>(now()at time zone'America/Argentina/Buenos_Aires')::date
 or jsonb_typeof(payload->'document')is distinct from 'object'or not(payload->'document'?&array['file','fingerprint'])
 or exists(select 1 from jsonb_object_keys(payload->'document')k where k not in('file','fingerprint'))
 or jsonb_typeof(payload->'document'->'file')is distinct from 'string'or length(payload->'document'->>'file')not between 1 and 120
 or(payload->'document'->>'file')~'[/\\]'or jsonb_typeof(payload->'document'->'fingerprint')is distinct from 'string'or(payload->'document'->>'fingerprint')!~'^[a-f0-9]{64}$'
 or jsonb_typeof(payload->'purposes')is distinct from 'array'or jsonb_array_length(payload->'purposes')not between 1 and 4
 then raise exception using errcode='22023',message='import_authorization_invalid';end if;
 for purpose_value in select jsonb_array_elements_text(payload->'purposes')loop
  if purpose_value not in('history','study','plan','measurement')or exists(select 1 from public.consent_events e where e.patient_id=target
   and e.purpose in('care_relationship',case when purpose_value='study'then 'clinical_document'when purpose_value='measurement'then 'measurement'else 'care_relationship'end)
   and e.decision='withdrawn'and e.sequence=(select max(x.sequence)from public.consent_events x where x.patient_id=target and x.purpose=e.purpose))
  then raise exception using errcode='42501',message='import_authorization_withdrawn_or_purpose';end if;
 end loop;
 if(select count(distinct v)from jsonb_array_elements_text(payload->'purposes')v)<>jsonb_array_length(payload->'purposes')then raise exception using errcode='22023',message='import_authorization_duplicate_purpose';end if;
 select * into prior from public.patient_import_authorizations where nutritionist_id=p.nutritionist_id and request_key=key_value;
 if found then
  if prior.patient_id<>target or prior.actor_id<>auth.uid()or prior.decision<>'granted'or prior.evidence<>payload then raise exception using errcode='PT409',message='import_authorization_key_conflict';end if;
  return public.patient_import_authorization_state(target);
 end if;
 select max(created_at)into retirement from public.patient_import_authorizations where patient_id=target and decision='revoked';
 if retirement is not null and ((payload->>'obtained_on')::date<=(retirement at time zone'America/Argentina/Buenos_Aires')::date
  or exists(select 1 from public.patient_import_authorizations where patient_id=target and decision='granted'and evidence->'document'->>'fingerprint'=payload->'document'->>'fingerprint'and created_at<retirement))
 then raise exception using errcode='42501',message='import_authorization_old_evidence';end if;
 select coalesce(max(revision),0)into current_revision from public.patient_import_authorizations where patient_id=target;
 if expected_revision<>current_revision then raise exception using errcode='PT409',message='import_authorization_revision';end if;
 insert into public.patient_import_authorizations(patient_id,nutritionist_id,actor_id,request_key,revision,decision,evidence)values(target,p.nutritionist_id,auth.uid(),key_value,current_revision+1,'granted',payload);
 insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)values(auth.uid(),'nutri','user','import_external_authorization_recorded','patient_import_authorization',key_value,target,p.nutritionist_id);
 return public.patient_import_authorization_state(target);
end;$$;
create function public.revoke_patient_import_authorization(target uuid,key_value uuid,expected_revision integer,reason_value text)returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.patients;prior public.patient_import_authorizations;current_revision integer;
begin
 select * into p from public.patients where id=target and nutritionist_id=public.my_nutritionist_id()for update;
 if not found then raise exception using errcode='42501',message='import_authorization_scope';end if;
 insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;perform 1 from public.intake_sessions where patient_id=target for update;
 if key_value is null or expected_revision is null or length(btrim(reason_value))not between 3 and 500 then raise exception using errcode='22023',message='import_authorization_reason';end if;
 select * into prior from public.patient_import_authorizations where nutritionist_id=p.nutritionist_id and request_key=key_value;
 if found then
  if prior.patient_id<>target or prior.actor_id<>auth.uid()or prior.decision<>'revoked'or prior.evidence<>jsonb_build_object('reason',btrim(reason_value))then raise exception using errcode='PT409',message='import_authorization_key_conflict';end if;
  return public.patient_import_authorization_state(target);
 end if;
 select coalesce(max(revision),0)into current_revision from public.patient_import_authorizations where patient_id=target;
 if current_revision=0 or expected_revision<>current_revision then raise exception using errcode='PT409',message='import_authorization_revision';end if;
 insert into public.patient_import_authorizations(patient_id,nutritionist_id,actor_id,request_key,revision,decision,evidence)values(target,p.nutritionist_id,auth.uid(),key_value,current_revision+1,'revoked',jsonb_build_object('reason',btrim(reason_value)));
 insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)values(auth.uid(),'nutri','user','import_external_authorization_revoked','patient_import_authorization',key_value,target,p.nutritionist_id);
 return public.patient_import_authorization_state(target);
end;$$;
drop policy patient_import_history_owner on public.patient_import_history;
create policy patient_import_history_owner on public.patient_import_history for select to authenticated using(nutritionist_id=public.my_nutritionist_id()and(
 public.patient_import_external_allowed(patient_id,category)or(public.care_consent(patient_id,'care_relationship')and(category<>'study'or public.care_consent(patient_id,'clinical_document')))));
create policy import_measurements_owner on public.patient_import_measurements for select to authenticated using(nutritionist_id=public.my_nutritionist_id()and(public.patient_import_external_allowed(patient_id,'measurement')or(public.care_consent(patient_id,'care_relationship')and public.care_consent(patient_id,'measurement'))));

-- Preserve the online withdrawal-safe writer; only its deduplication key gains patient scope.
alter function public.apply_patient_import_row(uuid,jsonb)rename to apply_patient_import_row_online;
revoke all on function public.apply_patient_import_row_online(uuid,jsonb)from public,anon,authenticated,service_role;
-- The canonical key includes the patient and is independent of the authorization mode.
create or replace function public.apply_patient_import_row_online(batch_id uuid,row_value jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();batch public.patient_import_batches;snapshot jsonb;expected jsonb;result jsonb;
  target uuid;duplicate uuid;source_digest text;h jsonb;m jsonb;email_value text;measure_data jsonb;
  clinical_digest text;prior_result jsonb;clinical_pending boolean;
begin
  if n is null then raise exception using errcode='42501',message='import_professional_only';end if;
  select * into batch from public.patient_import_batches where id=batch_id and nutritionist_id=n for update;
  if not found then raise exception using errcode='42501',message='import_scope';end if;
  snapshot:=row_value||jsonb_build_object('history','[]'::jsonb,'measurements','[]'::jsonb);
  select v into expected from jsonb_array_elements(batch.payload->'candidates')v where v->>'key'=row_value->>'key';
  if expected is null or expected<>snapshot then raise exception using errcode='PT409',message='import_revision';end if;
  select v into result from jsonb_array_elements(batch.results)v where v->>'key'=row_value->>'key' and v->>'status'<>'error';
  if result is not null then return result;end if;
  clinical_pending:=jsonb_array_length(coalesce(row_value->'history','[]'))>0 or jsonb_array_length(coalesce(row_value->'measurements','[]'))>0;
  clinical_digest:=pg_catalog.md5(jsonb_build_object('history',row_value->'history','measurements',row_value->'measurements')::text);
  select v into prior_result from jsonb_array_elements(batch.results)v where v->>'key'=row_value->>'key';
  if prior_result->>'clinical_pending'='true' and (not clinical_pending or prior_result->>'clinical_digest' is distinct from clinical_digest)
    then raise exception using errcode='PT409',message='import_clinical_reread_required';end if;
  -- Every row has its own subtransaction: a failed record never leaves half a patient/history.
  begin
    if row_value->>'action'='discard' then
      result:=jsonb_build_object('key',row_value->>'key','status','discarded','patient_id',null,'message','Descartado por la profesional.');
    else
      if jsonb_typeof(row_value->'history') is distinct from 'array' or jsonb_typeof(row_value->'measurements') is distinct from 'array'
        or jsonb_array_length(row_value->'history')>40 or jsonb_array_length(row_value->'measurements')>200 or length(row_value::text)>300000
      then raise exception using errcode='22023',message='import_clinical_limit';end if;
      source_digest:=pg_catalog.md5(jsonb_build_object('patient_id',row_value->'patient_id','action',row_value->'action','origins',row_value->'origins','history',row_value->'history','measurements',row_value->'measurements')::text);
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(n::text||source_digest,0));
      select patient_id into duplicate from public.patient_import_applied where nutritionist_id=n and source_key in(source_digest,pg_catalog.md5(jsonb_build_object('action',row_value->'action','origins',row_value->'origins','history',row_value->'history','measurements',row_value->'measurements')::text))and(row_value->>'action'='create'or patient_id=(row_value->>'patient_id')::uuid);
      if duplicate is not null then
        result:=jsonb_build_object('key',row_value->>'key','status','duplicate','patient_id',duplicate,'message','Este origen ya se importó.');
      else
        email_value:=lower(btrim(row_value->>'email'));
        if email_value<>'' then
          perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(n::text||email_value,0));
          select p.id into duplicate from public.patients p where p.nutritionist_id=n and (
            exists(select 1 from public.patient_import_contacts c where c.patient_id=p.id and lower(c.email)=email_value)
            or exists(select 1 from public.patient_invites i where i.patient_id=p.id and lower(i.email)=email_value)
          )limit 1;
        end if;
        if row_value->>'action'='create' and duplicate is not null then
          result:=jsonb_build_object('key',row_value->>'key','status','duplicate','patient_id',duplicate,'message','El email ya corresponde a una ficha. Incorporá los datos tras revisarla.');
        else
          if row_value->>'action'='create' then
            if jsonb_array_length(row_value->'history')>0 or jsonb_array_length(row_value->'measurements')>0 then raise exception using errcode='42501',message='import_new_contact_only';end if;
            insert into public.patients(nutritionist_id,full_name,initials,status,goal,next_focus,phone)values(n,btrim(row_value->>'name'),upper(left(row_value->>'name',2)),'Ingreso','','Completar evaluación inicial',nullif(btrim(row_value->>'phone'),''))returning id into target;
          else
            target:=(row_value->>'patient_id')::uuid;
            -- Restrict assignment and lock the same intake row used by consent withdrawal.
            perform 1 from public.patients where id=target and nutritionist_id=n and deactivated_at is null and anonymized_at is null for update;
            if not found or (duplicate is not null and duplicate<>target) then raise exception using errcode='42501',message='import_patient_scope';end if;
            insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;
            perform 1 from public.intake_sessions where patient_id=target for update;
            if (jsonb_array_length(row_value->'history')>0 or jsonb_array_length(row_value->'measurements')>0) and not public.care_consent(target,'care_relationship')
            then raise exception using errcode='42501',message='import_care_consent';end if;
          end if;
          insert into public.patient_import_contacts(patient_id,nutritionist_id,email,phone)values(target,n,email_value,btrim(row_value->>'phone'))on conflict(patient_id)do nothing;
          update public.patient_import_contacts set email=email_value where patient_id=target and email='' and email_value<>'';
          update public.patients set phone=nullif(btrim(row_value->>'phone'),'') where id=target and phone is null and btrim(row_value->>'phone')<>'';
          for h in select v from jsonb_array_elements(row_value->'history')v loop
            if h->>'category' is null or h->>'category' not in('history','study','plan') or coalesce(length(btrim(h->>'text')),0) not between 2 and 3000
              or not (row_value->'origins' @> jsonb_build_array(h->'origin'))
            then raise exception using errcode='22023',message='import_history_invalid';end if;
            if h->>'category'='study' and not public.care_consent(target,'clinical_document')then raise exception using errcode='42501',message='import_document_consent';end if;
            insert into public.patient_import_history(patient_id,nutritionist_id,category,body,origin)values(target,n,h->>'category',btrim(h->>'text'),h->'origin');
          end loop;
          for m in select v from jsonb_array_elements(row_value->'measurements')v loop
            if m->>'kind' is null or m->>'kind' not in('weight','waist','hip') or not (row_value->'origins' @> jsonb_build_array(m->'origin'))
            then raise exception using errcode='22023',message='import_measurement_invalid';end if;
            measure_data:=jsonb_build_object('kind',m->>'kind','value',m->'value','unit',m->>'unit','source','professional','note','Importado de '||(m->'origin'->>'file')||' · fila '||coalesce(m->'origin'->>'row','—')||' · página '||coalesce(m->'origin'->>'page','—'));
            perform public.save_care_record(target,gen_random_uuid(),(m->>'date')::date,measure_data);
          end loop;
          insert into public.patient_import_applied(nutritionist_id,source_key,patient_id)values(n,source_digest,target);
          result:=jsonb_build_object('key',row_value->>'key','status',case when row_value->>'action'='create' then 'created' else 'appended' end,'patient_id',target,'message',case when row_value->>'action'='create' then 'Ficha creada sin cuenta ni invitación.' else 'Datos incorporados sin reemplazar los actuales.' end);
        end if;
      end if;
    end if;
  exception when others then
    result:=jsonb_build_object('key',row_value->>'key','status','error','patient_id',null,'message','No se guardó esta fila. Revisá la ficha, los datos y sus permisos.');
    if clinical_pending then result:=result||jsonb_build_object('clinical_pending',true,'clinical_digest',clinical_digest);end if;
  end;
  batch.results:=coalesce((select jsonb_agg(v) from jsonb_array_elements(batch.results)v where v->>'key'<>row_value->>'key'),'[]'::jsonb)||jsonb_build_array(result);
  update public.patient_import_batches set results=batch.results,status=case
    when exists(select 1 from jsonb_array_elements(batch.results)v where v->>'status'='error')then 'partial'
    when jsonb_array_length(batch.results)=jsonb_array_length(batch.payload->'candidates')then 'completed' else 'review' end where id=batch_id;
  return result;
end;$$;
create function public.apply_patient_import_row(batch_id uuid,row_value jsonb)returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();target uuid;batch public.patient_import_batches;expected jsonb;result jsonb;prior jsonb;h jsonb;m jsonb;digest text;clinical_digest text;
begin
 if n is null then raise exception using errcode='42501',message='import_professional_only';end if;
 -- Non-clinical rows and all existing online permissions retain the original behavior.
 if row_value->>'action'<>'append'or(jsonb_array_length(row_value->'history')=0 and jsonb_array_length(row_value->'measurements')=0)then return public.apply_patient_import_row_online(batch_id,row_value);end if;
 target:=(row_value->>'patient_id')::uuid;
 if public.care_consent(target,'care_relationship')and(jsonb_array_length(row_value->'measurements')=0 or public.care_consent(target,'measurement'))and(not exists(select 1 from jsonb_array_elements(row_value->'history')v where v->>'category'='study')or public.care_consent(target,'clinical_document'))then return public.apply_patient_import_row_online(batch_id,row_value);end if;
 select * into batch from public.patient_import_batches where id=batch_id and nutritionist_id=n for update;
 if not found then raise exception using errcode='42501',message='import_scope';end if;
 select v into expected from jsonb_array_elements(batch.payload->'candidates')v where v->>'key'=row_value->>'key';
 if expected is null or expected<>row_value||jsonb_build_object('history','[]'::jsonb,'measurements','[]'::jsonb)then raise exception using errcode='PT409',message='import_revision';end if;
 select v into result from jsonb_array_elements(batch.results)v where v->>'key'=row_value->>'key'and v->>'status'<>'error';if result is not null then return result;end if;
 clinical_digest:=pg_catalog.md5(jsonb_build_object('history',row_value->'history','measurements',row_value->'measurements')::text);
 select v into prior from jsonb_array_elements(batch.results)v where v->>'key'=row_value->>'key';
 if prior->>'clinical_pending'='true'and prior->>'clinical_digest'is distinct from clinical_digest then raise exception using errcode='PT409',message='import_clinical_reread_required';end if;
 begin
  perform 1 from public.patients where id=target and nutritionist_id=n and user_id is null and archived_at is null and deactivated_at is null and anonymized_at is null for update;
  if not found then raise exception using errcode='42501',message='import_patient_scope';end if;
  insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;perform 1 from public.intake_sessions where patient_id=target for update;
  if jsonb_typeof(row_value->'history')is distinct from 'array'or jsonb_typeof(row_value->'measurements')is distinct from 'array'or jsonb_array_length(row_value->'history')>40 or jsonb_array_length(row_value->'measurements')>200 or length(row_value::text)>300000 then raise exception using errcode='22023',message='import_clinical_limit';end if;
  if coalesce(row_value->>'email','')<>''and exists(select 1 from public.patient_import_contacts c where c.nutritionist_id=n and lower(c.email)=lower(row_value->>'email')and c.patient_id<>target)then raise exception using errcode='PT409',message='import_contact_mismatch';end if;
  if exists(select 1 from jsonb_array_elements(row_value->'history')v where not public.patient_import_external_allowed(target,v->>'category'))
   or(jsonb_array_length(row_value->'measurements')>0 and not public.patient_import_external_allowed(target,'measurement'))then raise exception using errcode='42501',message='import_external_authorization_required';end if;
  digest:=pg_catalog.md5(jsonb_build_object('patient_id',row_value->'patient_id','action',row_value->'action','origins',row_value->'origins','history',row_value->'history','measurements',row_value->'measurements')::text);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(n::text||digest,0));
  if exists(select 1 from public.patient_import_applied where nutritionist_id=n and patient_id=target and source_key in(digest,pg_catalog.md5(jsonb_build_object('action',row_value->'action','origins',row_value->'origins','history',row_value->'history','measurements',row_value->'measurements')::text)))then result:=jsonb_build_object('key',row_value->>'key','status','duplicate','patient_id',target,'message','Este origen ya se importó.');
  else
   for h in select v from jsonb_array_elements(row_value->'history')v loop
    if not public.patient_import_external_allowed(target,h->>'category')then raise exception using errcode='42501',message='import_external_authorization_required';end if;
    if h->>'category'not in('history','study','plan')or coalesce(length(btrim(h->>'text')),0)not between 2 and 3000 or not(row_value->'origins'@>jsonb_build_array(h->'origin'))then raise exception using errcode='22023',message='import_history_invalid';end if;
    insert into public.patient_import_history(patient_id,nutritionist_id,category,body,origin)values(target,n,h->>'category',btrim(h->>'text'),h->'origin');
   end loop;
   for m in select v from jsonb_array_elements(row_value->'measurements')v loop
    if not public.patient_import_external_allowed(target,'measurement')then raise exception using errcode='42501',message='import_external_measurement_required';end if;
    if not(row_value->'origins'@>jsonb_build_array(m->'origin'))or(m->>'date')::date>(now()at time zone'America/Argentina/Buenos_Aires')::date then raise exception using errcode='22023',message='import_measurement_invalid';end if;
    insert into public.patient_import_measurements(patient_id,nutritionist_id,kind,value,unit,recorded_on,origin)values(target,n,m->>'kind',(m->>'value')::numeric,m->>'unit',(m->>'date')::date,m->'origin');
   end loop;
   insert into public.patient_import_applied(nutritionist_id,source_key,patient_id)values(n,digest,target);
   insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)values(auth.uid(),'nutri','user','import_external_history_applied','patient_import_batch',batch_id,target,n);
   result:=jsonb_build_object('key',row_value->>'key','status','appended','patient_id',target,'message','Historia incorporada con evidencia externa, sin cuenta ni permisos de app.');
  end if;
 exception when others then result:=jsonb_build_object('key',row_value->>'key','status','error','patient_id',null,'message','No se guardó esta fila. Revisá la ficha y la evidencia de autorización.','clinical_pending',true,'clinical_digest',clinical_digest);
 end;
 batch.results:=coalesce((select jsonb_agg(v)from jsonb_array_elements(batch.results)v where v->>'key'<>row_value->>'key'),'[]'::jsonb)||jsonb_build_array(result);
 update public.patient_import_batches set results=batch.results,status=case when exists(select 1 from jsonb_array_elements(batch.results)v where v->>'status'='error')then 'partial'when jsonb_array_length(batch.results)=jsonb_array_length(batch.payload->'candidates')then 'completed'else 'review'end where id=batch_id;
 return result;
end;$$;
revoke all on function public.patient_import_external_allowed(uuid,text),public.patient_import_authorization_state(uuid),public.record_patient_import_authorization(uuid,uuid,integer,jsonb),public.revoke_patient_import_authorization(uuid,uuid,integer,text),public.apply_patient_import_row(uuid,jsonb)from public,anon,authenticated;
grant execute on function public.patient_import_external_allowed(uuid,text),public.patient_import_authorization_state(uuid),public.record_patient_import_authorization(uuid,uuid,integer,jsonb),public.revoke_patient_import_authorization(uuid,uuid,integer,text),public.apply_patient_import_row(uuid,jsonb)to authenticated;

commit;
