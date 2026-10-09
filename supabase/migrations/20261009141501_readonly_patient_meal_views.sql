-- Close Supabase default/inherited write ACL on the affected view.
revoke insert, update, delete on public.meal_logs_patient_view from public, anon, authenticated;
alter view public.meal_logs_patient_view set (security_invoker = true);
revoke select on public.meal_logs_patient_view from public, anon;
grant select on public.meal_logs_patient_view to authenticated;

-- Other owner-permission public views with effective write grants have the same
-- bypass, including PUBLIC/column ACL. Already read-only, explicit identity
-- boundaries on patients_patient_view/patient_access_view are left intact.
do $$
declare v record; cols text;
begin
  for v in
    select c.oid, c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='v'
      and (c.relname='meal_logs_patient_view' or
        (not coalesce(c.reloptions @> array['security_invoker=true'],false)
         and (has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE')
           or has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE')
           or has_any_column_privilege('anon',c.oid,'INSERT,UPDATE')
           or has_any_column_privilege('authenticated',c.oid,'INSERT,UPDATE'))))
  loop
    execute format('revoke insert, update, delete on public.%I from public, anon, authenticated',v.relname);
    select string_agg(format('%I',attname),', ' order by attnum) into cols
      from pg_attribute where attrelid=v.oid and attnum>0 and not attisdropped;
    execute format('revoke insert (%s), update (%s) on public.%I from public, anon, authenticated',cols,cols,v.relname);
    execute format('alter view public.%I set (security_invoker = true)',v.relname);
  end loop;
end $$;

-- Invoker view correctly inherits the base table's closed patient SELECT policy.
-- Preserve the product's own-log read through an explicit, bounded projection;
-- do not reopen raw meal_logs SELECT or expose professional notes/client ids.
create or replace function public.get_patient_meal_logs(target_patient uuid)
returns table(id uuid,patient_id uuid,meal_slot_id uuid,slot_label text,photo_path text,
  description text,foods jsonb,macros jsonb,confidence numeric,status text,
  logged_at timestamptz,analysis_status text,nutrition_origin text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or target_patient is null
     or target_patient is distinct from public.my_patient_id() then
    raise exception using errcode='42501',message='patient_meals_forbidden';
  end if;
  if not public.patient_has_full_access(target_patient) then return; end if;
  return query select m.id,m.patient_id,m.meal_slot_id,m.slot_label,m.photo_path,
    m.description,m.foods,m.macros,m.confidence::numeric,m.status::text,
    m.logged_at,m.analysis_status::text,m.nutrition_origin
    from public.meal_logs m where m.patient_id=target_patient
    order by m.logged_at desc,m.id desc limit 20;
end $$;
revoke all on function public.get_patient_meal_logs(uuid) from public, anon, authenticated;
grant execute on function public.get_patient_meal_logs(uuid) to authenticated;
notify pgrst, 'reload schema';
