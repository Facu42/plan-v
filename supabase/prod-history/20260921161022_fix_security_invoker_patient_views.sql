-- Archivo histórico: migración 20260921161022_fix_security_invoker_patient_views aplicada en producción (plan-v-app) vía MCP y nunca commiteada.
-- NO es parte de la cadena de supabase/migrations: su efecto ya está cubierto por migraciones posteriores del repo.
-- No re-aplicar. Ver docs/migraciones-prod-vs-main.md.

-- P0 Cifra: patient-facing views must use invoker rights so RLS of the caller applies.
-- Supabase lint 0010_security_definer_view.
ALTER VIEW public.patient_access_view SET (security_invoker = true);
ALTER VIEW public.patients_patient_view SET (security_invoker = true);
ALTER VIEW public.intake_patient_view SET (security_invoker = true);
ALTER VIEW public.messages_patient_view SET (security_invoker = true);
ALTER VIEW public.meal_logs_patient_view SET (security_invoker = true);
ALTER VIEW public.appointments_patient_view SET (security_invoker = true);

-- Tighten assert helpers that should not be callable by anon.
REVOKE ALL ON FUNCTION public.appointment_assert_patient(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.appointment_assert_pro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appointment_assert_patient(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.appointment_assert_pro(uuid) TO authenticated, service_role;

-- Harden mutable search_path on storage helper if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'storage_object_patient_id'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.storage_object_patient_id SET search_path = public, pg_temp';
  END IF;
END $$;
