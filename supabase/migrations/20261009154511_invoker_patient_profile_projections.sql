-- Preserve the column-limited API contract without granting patient SELECT on
-- raw patients. Privileged projections live outside the exposed public schema,
-- take no caller-supplied identity, and validate the real session internally.
create index if not exists patients_active_nutritionist_access_idx
  on public.patients(nutritionist_id,id)
  where deactivated_at is null and anonymized_at is null;

create or replace function private.patient_profile_projection()
returns table(id uuid,user_id uuid,full_name text,initials text,tone text,
  billing_status public.billing_status,billing_until date,status text,
  stage public.patient_stage,goal text,adherence_score integer,created_at timestamptz)
language plpgsql stable security definer set search_path='' rows 1 as $$
begin
  if auth.uid() is null then return; end if;
  return query select p.id,p.user_id,p.full_name,p.initials,p.tone,
    p.billing_status,p.billing_until,p.status,p.stage,p.goal,p.adherence_score,p.created_at
    from public.patients p where p.user_id=auth.uid();
end $$;

create or replace function private.patient_access_projection()
returns table(id uuid,nutritionist_id uuid,billing_status public.billing_status,billing_until date)
language plpgsql stable security definer set search_path='' as $$
declare current_patient uuid; current_nutritionist uuid;
begin
  if auth.uid() is null then return; end if;
  current_patient:=public.my_patient_id();
  current_nutritionist:=public.my_nutritionist_id();
  return query select p.id,p.nutritionist_id,p.billing_status,p.billing_until
    from public.patients p
    where p.deactivated_at is null and p.anonymized_at is null
      and (p.id=current_patient or p.nutritionist_id=current_nutritionist);
end $$;

revoke all on function private.patient_profile_projection(),private.patient_access_projection()
  from public,anon,authenticated;
grant execute on function private.patient_profile_projection(),private.patient_access_projection()
  to authenticated;

create or replace view public.patients_patient_view
with (security_barrier=true,security_invoker=true) as
select id,user_id,full_name,initials,tone,billing_status,billing_until,status,stage,goal,
  adherence_score,created_at from private.patient_profile_projection();
create or replace view public.patient_access_view
with (security_barrier=true,security_invoker=true) as
select id,nutritionist_id,billing_status,billing_until from private.patient_access_projection();

-- Replacing a view preserves legacy table/column ACL; remove both explicitly.
revoke all on public.patients_patient_view,public.patient_access_view from public,anon,authenticated;
do $$
declare relation regclass; columns text;
begin
  foreach relation in array array['public.patients_patient_view'::regclass,'public.patient_access_view'::regclass] loop
    select string_agg(format('%I',attname),', ' order by attnum) into columns
      from pg_attribute where attrelid=relation and attnum>0 and not attisdropped;
    execute format('revoke all privileges (%s) on table %s from public,anon,authenticated',columns,relation);
  end loop;
end $$;
grant select on public.patients_patient_view,public.patient_access_view to authenticated;
notify pgrst,'reload schema';
