begin;
create table public.clinical_method_references(
  id uuid primary key,nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  method text not null check(method in('segmental','kerr','bariatric')),title text not null,source_url text not null,
  notes text not null,approved boolean not null check(approved),approved_at timestamptz not null default now(),active boolean not null default true
);
create table public.clinical_clinic_brands(nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,data jsonb not null);
create table public.clinical_source_documents(
  id uuid primary key,patient_id uuid not null,nutritionist_id uuid not null,filename text not null,
  mime text not null check(mime in('application/pdf','image/jpeg','image/png')),
  source_sha256 text not null check(source_sha256~'^[a-f0-9]{64}$'),asset_id uuid not null references public.patient_assets(id),created_at timestamptz not null default now(),
  unique(patient_id,source_sha256),unique(id,patient_id),
  foreign key(patient_id,nutritionist_id) references public.patients(id,nutritionist_id) on delete cascade deferrable initially immediate
);
create table public.clinical_workspace_records(
  id uuid primary key,patient_id uuid not null,nutritionist_id uuid not null,recorded_on date not null,
  data jsonb not null,note text not null default '',reviewed boolean not null check(reviewed),reference_snapshot jsonb,created_at timestamptz not null default now(),
  foreign key(patient_id,nutritionist_id) references public.patients(id,nutritionist_id) on delete cascade deferrable initially immediate
);
create index clinical_workspace_patient_date on public.clinical_workspace_records(patient_id,recorded_on desc);
comment on column public.clinical_workspace_records.data is 'PHI: reviewed clinical values and source provenance';
comment on column public.clinical_workspace_records.note is 'PHI: private professional note';
comment on column public.clinical_source_documents.filename is 'PHI: source document filename';
alter table public.clinical_method_references enable row level security;alter table public.clinical_clinic_brands enable row level security;
alter table public.clinical_source_documents enable row level security;alter table public.clinical_workspace_records enable row level security;
create policy clinical_references_owner on public.clinical_method_references for select to authenticated using(nutritionist_id=public.my_nutritionist_id());
create policy clinical_brand_owner on public.clinical_clinic_brands for select to authenticated using(nutritionist_id=public.my_nutritionist_id());
create policy clinical_document_owner on public.clinical_source_documents for select to authenticated using(nutritionist_id=public.my_nutritionist_id() and public.care_consent(patient_id,'care_relationship') and public.care_consent(patient_id,'clinical_document'));
create policy clinical_record_owner on public.clinical_workspace_records for select to authenticated using(nutritionist_id=public.my_nutritionist_id() and public.care_consent(patient_id,'care_relationship') and (
  (data->>'kind'='laboratory' and public.care_consent(patient_id,'clinical_document')) or data->>'kind'='study_order' or (data->>'kind' in('segmental','kerr','bariatric') and public.care_consent(patient_id,'measurement'))
) and (data->>'document_id' is null or public.care_consent(patient_id,'clinical_document')));
revoke all on public.clinical_method_references,public.clinical_clinic_brands,public.clinical_source_documents,public.clinical_workspace_records from public,anon,authenticated;
grant select on public.clinical_method_references,public.clinical_clinic_brands,public.clinical_source_documents,public.clinical_workspace_records to authenticated;

create function public.audit_clinical_access(target uuid,access_action text)returns void language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();
begin
  if n is null or not exists(select 1 from public.patients where id=target and nutritionist_id=n and deactivated_at is null and anonymized_at is null)
    or not public.care_consent(target,'care_relationship') then raise exception using errcode='42501',message='clinical_audit_scope';end if;
  if access_action is null or access_action not in('read','export','document') then raise exception using errcode='22023',message='clinical_audit_action';end if;
  if access_action='document' and not public.care_consent(target,'clinical_document') then raise exception using errcode='42501',message='clinical_audit_consent';end if;
  insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)
  values(auth.uid(),'nutri','user','clinical_'||access_action,'clinical_workspace',target::text,target,n);
end;$$;

create function public.approve_clinical_reference(payload jsonb)returns jsonb language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();reference public.clinical_method_references;rid uuid;
begin
  if n is null then raise exception using errcode='42501',message='clinical_professional_only';end if;
  if payload->>'approved' is distinct from 'true' or payload->>'method' is null or payload->>'method' not in('segmental','kerr','bariatric')
    or coalesce(length(btrim(payload->>'title')),0) not between 3 and 200 or coalesce(length(payload->>'source_url'),0) not between 9 and 500 or payload->>'source_url'!~'^https://[^[:space:]]+$'
    or coalesce(length(btrim(payload->>'notes')),0) not between 3 and 1000 then raise exception using errcode='22023',message='clinical_reference_invalid';end if;
  rid:=(payload->>'id')::uuid;if rid is null then raise exception using errcode='22023',message='clinical_reference_id';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text,0));
  select * into reference from public.clinical_method_references where id=rid;
  if found then
    if reference.nutritionist_id<>n then raise exception using errcode='42501',message='clinical_reference_scope';end if;
    if reference.method<>payload->>'method' or reference.title<>btrim(payload->>'title') or reference.source_url<>payload->>'source_url' or reference.notes<>btrim(payload->>'notes')then raise exception using errcode='PT409',message='clinical_reference_revision';end if;
    return to_jsonb(reference);
  end if;
  insert into public.clinical_method_references(id,nutritionist_id,method,title,source_url,notes,approved)values(rid,n,payload->>'method',btrim(payload->>'title'),payload->>'source_url',btrim(payload->>'notes'),true)returning * into reference;return to_jsonb(reference);
end;$$;
create function public.deactivate_clinical_reference(reference_id uuid)returns void language plpgsql security definer set search_path='' as $$
begin
  if public.my_nutritionist_id() is null then raise exception using errcode='42501',message='clinical_professional_only';end if;
  update public.clinical_method_references set active=false where id=reference_id and nutritionist_id=public.my_nutritionist_id();if not found then raise exception using errcode='42501',message='clinical_reference_scope';end if;
end;$$;
create function public.save_clinical_brand(payload jsonb)returns void language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();
begin
  if n is null then raise exception using errcode='42501',message='clinical_professional_only';end if;
  if coalesce(length(btrim(payload->>'name')),0) not between 2 and 160 or length(payload->>'contact')>400 or length(payload->>'license')>120 or length(payload->>'logo')>300000
    or (payload->>'logo' is not null and payload->>'logo'!~'^data:image/(png|jpeg);base64,[a-zA-Z0-9+/=]+$')then raise exception using errcode='22023',message='clinical_brand_invalid';end if;
  insert into public.clinical_clinic_brands(nutritionist_id,data)values(n,jsonb_build_object('name',payload->'name','contact',coalesce(payload->>'contact',''),'license',coalesce(payload->>'license',''),'logo',payload->'logo'))on conflict(nutritionist_id)do update set data=excluded.data;
end;$$;
create function public.save_clinical_source_document(target uuid,payload jsonb)returns jsonb language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();asset public.patient_assets;result public.clinical_source_documents;doc_id uuid;
begin
  if n is null or not exists(select 1 from public.patients where id=target and nutritionist_id=n and deactivated_at is null and anonymized_at is null)then raise exception using errcode='42501',message='clinical_patient_scope';end if;
  insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;perform 1 from public.intake_sessions where patient_id=target for update;
  if not public.care_consent(target,'care_relationship') or not public.care_consent(target,'clinical_document')then raise exception using errcode='42501',message='clinical_document_consent';end if;
  if coalesce(length(payload->>'filename'),0) not between 1 and 120 or payload->>'filename'~'[/\\]' or coalesce(payload->>'source_sha256','')!~'^[a-f0-9]{64}$'then raise exception using errcode='22023',message='clinical_document_invalid';end if;
  doc_id:=(payload->>'id')::uuid;if doc_id is null then raise exception using errcode='22023',message='clinical_document_id';end if;
  select * into asset from public.patient_assets where id=(payload->>'asset_id')::uuid and patient_id=target and nutritionist_id=n and category='clinical_document' and status='ready' and withdrawn_at is null;
  if not found then raise exception using errcode='42501',message='clinical_asset_scope';end if;
  select * into result from public.clinical_source_documents where patient_id=target and (id=doc_id or source_sha256=payload->>'source_sha256');
  if found then if result.source_sha256<>payload->>'source_sha256' then raise exception using errcode='PT409',message='clinical_document_conflict';end if;return to_jsonb(result);end if;
  insert into public.clinical_source_documents(id,patient_id,nutritionist_id,filename,mime,source_sha256,asset_id)values(doc_id,target,n,payload->>'filename',asset.mime,payload->>'source_sha256',asset.id)returning * into result;
  insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)
    values(auth.uid(),'nutri','user','clinical_document_created','clinical_workspace',result.id::text,target,n);
  return to_jsonb(result);
end;$$;

create function public.clinical_workspace_validate(d jsonb)returns void language plpgsql set search_path='' as $$
declare kind text:=d->>'kind';item jsonb;v jsonb;
begin
  if jsonb_typeof(d) is distinct from 'object' or kind is null or kind not in('laboratory','segmental','kerr','bariatric','study_order') or length(d::text)>300000 then raise exception using errcode='22023',message='clinical_data_invalid';end if;
  if kind='laboratory'then
    perform (d->>'document_id')::uuid;
    if jsonb_typeof(d->'values') is distinct from 'array' or jsonb_array_length(d->'values') not between 1 and 200 then raise exception using errcode='22023',message='clinical_lab_values';end if;
    for item in select x from jsonb_array_elements(d->'values')x loop
      if item->>'reviewed' is distinct from 'true' or coalesce(length(btrim(item->>'name')),0) not between 1 and 120 or coalesce(length(item->>'raw_value'),0) not between 1 and 100
        or coalesce(length(item->>'source_line'),0) not between 1 and 500 or length(item->>'unit')>40 or length(item->>'range_text')>200
        or (item->>'page')::integer not between 1 and 40 or item->>'page' is null or item->>'operator' is null or item->>'operator' not in('','<','>','<=','>=')
        or item->>'id' is null or jsonb_typeof(item->'value') is null or (jsonb_typeof(item->'value') not in('number','null'))
        or jsonb_typeof(item->'unit') is distinct from 'string' or jsonb_typeof(item->'range_text') is distinct from 'string'
        then raise exception using errcode='22023',message='clinical_lab_row';end if;
      perform (item->>'id')::uuid;
    end loop;
  elsif kind='segmental'then
    if coalesce(length(btrim(d->>'device')),0) not between 2 and 160 or jsonb_typeof(d->'values') is distinct from 'array' or jsonb_array_length(d->'values') not between 1 and 30 then raise exception using errcode='22023',message='clinical_segment_values';end if;
    for item in select x from jsonb_array_elements(d->'values')x loop
      if item->>'segment' is null or item->>'segment' not in('arm_right','arm_left','trunk','leg_right','leg_left') or item->>'component' is null or item->>'component' not in('muscle','fat','water','impedance')
        or item->>'unit' is null or item->>'unit' not in('kg','%','L','ohm') or jsonb_typeof(item->'value') is distinct from 'number' or (item->>'value')::numeric not between 0 and 100000 or coalesce(length(item->>'original'),0) not between 1 and 250
      then raise exception using errcode='22023',message='clinical_segment_row';end if;
      if (item->>'component'='impedance' and item->>'unit'<>'ohm') or (item->>'component'='water' and item->>'unit' not in('L','%'))
        or (item->>'component' in('muscle','fat') and item->>'unit' not in('kg','%')) or (item->>'unit'='%' and (item->>'value')::numeric>100)
        then raise exception using errcode='22023',message='clinical_segment_unit';end if;
    end loop;
    if exists(select 1 from jsonb_array_elements(d->'values') x group by x->>'segment',x->>'component',x->>'unit' having count(*)>1)
      then raise exception using errcode='22023',message='clinical_segment_duplicate';end if;
  elsif kind='kerr'then
    if d->>'professional_results' is distinct from 'true' or coalesce(length(btrim(d->>'original_measurements')),0) not between 2 and 3000 or jsonb_typeof(d->'weight_kg') is distinct from 'number' or (d->>'weight_kg')::numeric not between 0.01 and 500
      or jsonb_typeof(d->'components_kg') is distinct from 'object' then raise exception using errcode='22023',message='clinical_kerr';end if;
    for item in select jsonb_build_object('value',d->'components_kg'->key)from unnest(array['skin','adipose','muscle','bone','residual'])key loop
      v:=item->'value';if v is null or (jsonb_typeof(v) not in('number','null')) or (jsonb_typeof(v)='number' and (v::text)::numeric not between 0 and 500)then raise exception using errcode='22023',message='clinical_kerr_mass';end if;
    end loop;
  elsif kind='bariatric'then
    if jsonb_typeof(d->'preop_kg') is distinct from 'number' or (d->>'preop_kg')::numeric not between 0.01 and 500 or jsonb_typeof(d->'current_kg') is distinct from 'number' or (d->>'current_kg')::numeric not between 0.01 and 500
      or (d->>'reference_kg' is not null and (d->>'reference_kg')::numeric not between 0.01 and 500) or length(d->>'symptoms')>2000 or length(d->>'supplements')>2000 or length(d->>'surgery_type')>120
      or (d->>'surgery_date')::date>(now()at time zone'America/Argentina/Buenos_Aires')::date then raise exception using errcode='22023',message='clinical_bariatric';end if;
  else
    if jsonb_typeof(d->'studies') is distinct from 'array' or jsonb_array_length(d->'studies') not between 1 and 40 or length(d->>'reason')>1000 or length(d->>'instructions')>2000 then raise exception using errcode='22023',message='clinical_order';end if;
    for item in select x from jsonb_array_elements(d->'studies')x loop if jsonb_typeof(item) is distinct from 'string' or length(btrim(item#>>'{}')) not between 2 and 160 then raise exception using errcode='22023',message='clinical_order_study';end if;end loop;
  end if;
end;$$;
create function public.save_clinical_workspace_record(target uuid,payload jsonb)returns jsonb language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();d jsonb:=payload->'data';kind text:=d->>'kind';rid uuid;date_value date;reference public.clinical_method_references;result public.clinical_workspace_records;doc uuid;
begin
  if n is null or not exists(select 1 from public.patients where id=target and nutritionist_id=n and deactivated_at is null and anonymized_at is null)then raise exception using errcode='42501',message='clinical_patient_scope';end if;
  insert into public.intake_sessions(patient_id)values(target)on conflict(patient_id)do nothing;perform 1 from public.intake_sessions where patient_id=target for update;
  if not public.care_consent(target,'care_relationship')then raise exception using errcode='42501',message='clinical_care_consent';end if;
  perform public.clinical_workspace_validate(d);
  rid:=(payload->>'id')::uuid;date_value:=(payload->>'recorded_on')::date;
  if rid is null or date_value is null or date_value>(now()at time zone'America/Argentina/Buenos_Aires')::date or payload->>'reviewed' is distinct from 'true' or length(payload->>'note')>1000 then raise exception using errcode='22023',message='clinical_record_invalid';end if;
  if kind in('segmental','kerr','bariatric')then
    if not public.care_consent(target,'measurement')then raise exception using errcode='42501',message='clinical_measure_consent';end if;
    select * into reference from public.clinical_method_references where id=(d->>'reference_id')::uuid and nutritionist_id=n and method=kind and active and approved for share;
    if not found then raise exception using errcode='42501',message='clinical_reference_required';end if;
  end if;
  doc:=(d->>'document_id')::uuid;
  if kind='laboratory' or doc is not null then
    if doc is null or not public.care_consent(target,'clinical_document') or not exists(select 1 from public.clinical_source_documents s join public.patient_assets a on a.id=s.asset_id where s.id=doc and s.patient_id=target and s.nutritionist_id=n and a.patient_id=target and a.status='ready' and a.withdrawn_at is null)
    then raise exception using errcode='42501',message='clinical_document_required';end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid::text,0));select * into result from public.clinical_workspace_records where id=rid;
  if found then if result.patient_id<>target or result.data<>d or result.recorded_on<>date_value or result.note<>coalesce(payload->>'note','')then raise exception using errcode='PT409',message='clinical_record_conflict';end if;return to_jsonb(result);end if;
  insert into public.clinical_workspace_records(id,patient_id,nutritionist_id,recorded_on,data,note,reviewed,reference_snapshot)values(rid,target,n,date_value,d,coalesce(payload->>'note',''),true,case when reference.id is not null then to_jsonb(reference)else null end)returning * into result;
  insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)
    values(auth.uid(),'nutri','user','clinical_record_created','clinical_workspace',result.id::text,target,n);
  return to_jsonb(result);
end;$$;
revoke all on function public.audit_clinical_access(uuid,text) from public,anon,authenticated;
grant execute on function public.audit_clinical_access(uuid,text) to authenticated;
revoke all on function public.approve_clinical_reference(jsonb),public.deactivate_clinical_reference(uuid),public.save_clinical_brand(jsonb),public.save_clinical_source_document(uuid,jsonb),public.clinical_workspace_validate(jsonb),public.save_clinical_workspace_record(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.approve_clinical_reference(jsonb),public.deactivate_clinical_reference(uuid),public.save_clinical_brand(jsonb),public.save_clinical_source_document(uuid,jsonb),public.save_clinical_workspace_record(uuid,jsonb) to authenticated;
commit;
