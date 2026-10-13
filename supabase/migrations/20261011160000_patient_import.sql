-- Local extraction; persistent contact-only review; transactional per-patient application.
begin;
create table public.patient_import_batches (
  id uuid primary key,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  payload jsonb not null check(jsonb_typeof(payload)='object'),
  results jsonb not null default '[]' check(jsonb_typeof(results)='array'),
  status text not null default 'review' check(status in('review','partial','completed')),
  created_at timestamptz not null default now()
);
create index patient_import_batches_scope on public.patient_import_batches(nutritionist_id,created_at desc);
create table public.patient_import_contacts (
  patient_id uuid primary key,
  nutritionist_id uuid not null,
  email text not null default '' check(length(email)<=254),
  phone text not null default '' check(length(phone)<=40),
  foreign key(patient_id,nutritionist_id) references public.patients(id,nutritionist_id) on delete cascade deferrable initially immediate
);
create unique index patient_import_contacts_email on public.patient_import_contacts(nutritionist_id,lower(email)) where email<>'';
create table public.patient_import_applied (
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  source_key text not null,
  patient_id uuid not null,
  primary key(nutritionist_id,source_key),
  foreign key(patient_id,nutritionist_id) references public.patients(id,nutritionist_id) on delete cascade deferrable initially immediate
);
create table public.patient_import_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  category text not null check(category in('history','study','plan')),
  body text not null check(length(body) between 2 and 3000),
  origin jsonb not null check(jsonb_typeof(origin)='object'),
  created_at timestamptz not null default now(),
  foreign key(patient_id,nutritionist_id) references public.patients(id,nutritionist_id) on delete cascade deferrable initially immediate
);
create index patient_import_history_patient on public.patient_import_history(patient_id,created_at desc);
alter table public.patient_import_batches enable row level security;
alter table public.patient_import_contacts enable row level security;
alter table public.patient_import_applied enable row level security;
alter table public.patient_import_history enable row level security;
create policy patient_import_batches_owner on public.patient_import_batches for select to authenticated using(nutritionist_id=public.my_nutritionist_id());
create policy patient_import_contacts_owner on public.patient_import_contacts for select to authenticated using(nutritionist_id=public.my_nutritionist_id());
create policy patient_import_history_owner on public.patient_import_history for select to authenticated using(
  nutritionist_id=public.my_nutritionist_id() and public.care_consent(patient_id,'care_relationship') and (category<>'study' or public.care_consent(patient_id,'clinical_document'))
);
revoke all on public.patient_import_batches,public.patient_import_contacts,public.patient_import_applied,public.patient_import_history from public,anon,authenticated;
grant select on public.patient_import_batches,public.patient_import_contacts,public.patient_import_history to authenticated;

create function public.patient_import_contact_snapshot(payload_value jsonb) returns jsonb
language sql immutable set search_path='' as $$
  select jsonb_build_object('id',payload_value->'id','candidates',coalesce((select jsonb_agg(v||jsonb_build_object('history','[]'::jsonb,'measurements','[]'::jsonb)) from jsonb_array_elements(payload_value->'candidates')v),'[]'::jsonb))
$$;

create function public.list_patient_import_contacts(start_at integer default 0) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();result jsonb;
begin
  if n is null then raise exception using errcode='42501',message='import_professional_only';end if;
  if start_at is null or start_at<0 then raise exception using errcode='22023',message='import_page';end if;
  select coalesce(jsonb_agg(t),'[]'::jsonb) into result from (
    select p.id as patient_id,p.full_name as name,
      coalesce(nullif(c.email,''),(select email from public.patient_invites i where i.patient_id=p.id order by created_at desc limit 1),'') as email,
      coalesce(nullif(p.phone,''),c.phone,'') as phone
    from public.patients p left join public.patient_import_contacts c on c.patient_id=p.id
    where p.nutritionist_id=n and p.anonymized_at is null and p.deactivated_at is null order by p.id offset start_at limit 250
  )t;return result;
end;$$;

create function public.prepare_patient_import(batch_id uuid,payload_value jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();existing public.patient_import_batches;r jsonb;o jsonb;prepared jsonb;keys integer;
begin
  if n is null then raise exception using errcode='42501',message='import_professional_only';end if;
  if batch_id is null or payload_value->>'id' is distinct from batch_id::text or jsonb_typeof(payload_value->'candidates') is distinct from 'array'
    or jsonb_array_length(payload_value->'candidates') not between 1 and 100 or length(payload_value::text)>900000
  then raise exception using errcode='22023',message='import_batch_invalid';end if;
  select count(distinct v->>'key') into keys from jsonb_array_elements(payload_value->'candidates')v;
  if keys<>jsonb_array_length(payload_value->'candidates') then raise exception using errcode='22023',message='import_duplicate_keys';end if;
  for r in select v from jsonb_array_elements(payload_value->'candidates')v loop
    perform (r->>'key')::uuid;
    if exists(select 1 from jsonb_object_keys(r)k where k not in('key','name','email','phone','action','patient_id','origins','history','measurements','reviewed'))then raise exception using errcode='22023',message='import_unknown_field';end if;
    if r->>'reviewed' is distinct from 'true' or r->>'action' is null or r->>'action' not in('create','append','discard')
      or coalesce(length(btrim(r->>'name')),0) not between 2 and 80 or r->>'email' is null or length(r->>'email')>254
      or ((r->>'email')<>'' and (r->>'email')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
      or r->>'phone' is null or length(r->>'phone')>40
      or jsonb_typeof(r->'origins') is distinct from 'array' or jsonb_array_length(r->'origins') not between 1 and 200
      or jsonb_typeof(r->'history') is distinct from 'array' or jsonb_typeof(r->'measurements') is distinct from 'array'
      or jsonb_array_length(r->'history')>40 or jsonb_array_length(r->'measurements')>200
    then raise exception using errcode='22023',message='import_row_invalid';end if;
    for o in select v from jsonb_array_elements(r->'origins')v loop
      if exists(select 1 from jsonb_object_keys(o)k where k not in('file','fingerprint','sheet','page','row'))then raise exception using errcode='22023',message='import_unknown_origin';end if;
      if coalesce(length(o->>'file'),0) not between 1 and 120 or o->>'file'~'[/\\]' or coalesce(o->>'fingerprint','')!~'^[a-f0-9]{64}$'
        or (o?'page' and (o->>'page')::integer not between 1 and 40)
        or (o?'row' and (o->>'row')::integer not between 1 and 100000)
      then raise exception using errcode='22023',message='import_origin_invalid';end if;
    end loop;
    if r->>'action'='append' and not exists(select 1 from public.patients p where p.id=(r->>'patient_id')::uuid and p.nutritionist_id=n and p.deactivated_at is null and p.anonymized_at is null)
    then raise exception using errcode='42501',message='import_patient_scope';end if;
    -- Clinical drafts are deliberately not retained; prepare only stores contacts.
    if jsonb_array_length(r->'history')>0 or jsonb_array_length(r->'measurements')>0 then raise exception using errcode='22023',message='import_contact_review_only';end if;
  end loop;
  if (select count(distinct origin_entry->>'fingerprint') from jsonb_array_elements(payload_value->'candidates')row_entry cross join lateral jsonb_array_elements(row_entry->'origins')origin_entry)>20
  then raise exception using errcode='22023',message='import_file_limit';end if;
  prepared:=public.patient_import_contact_snapshot(payload_value);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(batch_id::text,0));
  select * into existing from public.patient_import_batches where id=batch_id;
  if found then
    if existing.nutritionist_id<>n then raise exception using errcode='42501',message='import_scope';end if;
    if existing.payload<>prepared then raise exception using errcode='PT409',message='import_revision';end if;
    return;
  end if;
  insert into public.patient_import_batches(id,nutritionist_id,payload)values(batch_id,n,prepared);
end;$$;

create function public.apply_patient_import_row(batch_id uuid,row_value jsonb) returns jsonb
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
      source_digest:=pg_catalog.md5(jsonb_build_object('action',row_value->'action','origins',row_value->'origins','history',row_value->'history','measurements',row_value->'measurements')::text);
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(n::text||source_digest,0));
      select patient_id into duplicate from public.patient_import_applied where nutritionist_id=n and source_key=source_digest;
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
create function public.prepare_imported_patient_invite(target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();email_value text;invite public.patient_invites;
begin
  if n is null then raise exception using errcode='42501',message='import_professional_only';end if;
  perform 1 from public.patients where id=target and nutritionist_id=n and user_id is null and archived_at is null and deactivated_at is null and anonymized_at is null for update;
  if not found then raise exception using errcode='42501',message='import_invite_scope';end if;
  select email into email_value from public.patient_import_contacts where patient_id=target and nutritionist_id=n;
  if email_value is null or email_value='' then raise exception using errcode='PT409',message='import_email_required';end if;
  select * into invite from public.patient_invites where patient_id=target and status in('not_sent','pending') order by created_at desc limit 1;
  if found then return to_jsonb(invite);end if;
  insert into public.patient_invites(patient_id,nutritionist_id,email,status)values(target,n,email_value,'not_sent')returning * into invite;
  return to_jsonb(invite);
end;$$;
revoke all on function public.patient_import_contact_snapshot(jsonb),public.prepare_patient_import(uuid,jsonb),public.apply_patient_import_row(uuid,jsonb),public.list_patient_import_contacts(integer),public.prepare_imported_patient_invite(uuid) from public,anon,authenticated;
grant execute on function public.prepare_patient_import(uuid,jsonb),public.apply_patient_import_row(uuid,jsonb),public.list_patient_import_contacts(integer),public.prepare_imported_patient_invite(uuid) to authenticated;
commit;
