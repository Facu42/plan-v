-- Archivo histórico: migración 20261009152202_prepare_patient_meal_read_projection aplicada en producción (plan-v-app) vía MCP y nunca commiteada.
-- NO es parte de la cadena de supabase/migrations: su efecto ya está cubierto por migraciones posteriores del repo.
-- No re-aplicar. Ver docs/migraciones-prod-vs-main.md.

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
  perform public.intake_assert_access(target_patient, false);
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
