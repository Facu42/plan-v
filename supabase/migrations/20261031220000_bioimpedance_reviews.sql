-- Additive; rollback: disable BIOIMPEDANCE_ENABLED and retain reviewed records.
create table public.bioimpedance_readings (
 id uuid primary key, patient_id uuid not null references public.patients(id),
 nutritionist_id uuid not null references public.nutritionists(id), recorded_on date not null,
 "values" jsonb not null, reviewed_by uuid not null references public.profiles(id),
 reviewed_at timestamptz not null default clock_timestamp()
);
create index bioimpedance_patient_date on public.bioimpedance_readings(patient_id,recorded_on);
create index bioimpedance_nutritionist on public.bioimpedance_readings(nutritionist_id);
create index bioimpedance_reviewer on public.bioimpedance_readings(reviewed_by);
alter table public.bioimpedance_readings enable row level security;
revoke all on public.bioimpedance_readings from public,anon,authenticated;
grant select on public.bioimpedance_readings to authenticated;
grant all on public.bioimpedance_readings to service_role;
create policy bioimpedance_owner on public.bioimpedance_readings for select to authenticated using(public.ops_can_read_clinic(nutritionist_id) and public.ops_can_read_patient(patient_id));
create function public.save_bioimpedance_review(target uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid; r public.bioimpedance_readings; k text; v jsonb; amount numeric;
begin
 select nutritionist_id into nid from public.patients where id=target;
 if nid is null or not public.ops_can_read_clinic(nid) or not public.ops_care_active(target,nid)
 or not coalesce((select e.decision='granted' and e.text_version=c.text_version and e.text_hash=c.text_hash from public.consent_events e join public.consent_catalog c on c.purpose=e.purpose where e.patient_id=target and e.purpose='measurement' order by e.sequence desc limit 1),false) then raise exception 'clinic_scope' using errcode='42501';end if;
 if payload->'reviewed' is distinct from 'true'::jsonb or jsonb_typeof(payload->'values') is distinct from 'object' or (payload->>'recorded_on')::date>current_date or (select count(*) from jsonb_object_keys(payload->'values'))<>5 then raise exception 'review_required' using errcode='22023';end if;
 for k,v in select * from jsonb_each(payload->'values') loop
  if k not in('weight_kg','body_fat_pct','muscle_kg','water_pct','visceral_fat') or (jsonb_typeof(v) not in('null','number')) then raise exception 'invalid_values' using errcode='22023';end if;
  if v<>'null'::jsonb then amount:=(v#>>'{}')::numeric;if amount<0 or (k='weight_kg' and amount=0) or amount>(case when k in('weight_kg','muscle_kg') then 500 else 100 end) then raise exception 'invalid_values' using errcode='22023';end if;end if;
 end loop;
 if not exists(select 1 from jsonb_each(payload->'values') where value<>'null'::jsonb) then raise exception 'empty_values' using errcode='22023';end if;
 insert into public.bioimpedance_readings(id,patient_id,nutritionist_id,recorded_on,"values",reviewed_by) values((payload->>'id')::uuid,target,nid,(payload->>'recorded_on')::date,payload->'values',auth.uid()) on conflict(id)do nothing returning * into r;
 if not found then select * into r from public.bioimpedance_readings where id=(payload->>'id')::uuid;if r.patient_id<>target or r.nutritionist_id<>nid or r.recorded_on<>(payload->>'recorded_on')::date or r.values<>payload->'values' then raise exception 'idempotency_conflict' using errcode='23505';end if;end if;
 return to_jsonb(r);
end;$$;
revoke all on function public.save_bioimpedance_review(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_bioimpedance_review(uuid,jsonb) to authenticated;
