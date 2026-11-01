-- Archivo histórico: migración 20260921163821_patients_self_select_rls aplicada en producción (plan-v-app) vía MCP y nunca commiteada.
-- NO es parte de la cadena de supabase/migrations: su efecto ya está cubierto por migraciones posteriores del repo.
-- No re-aplicar. Ver docs/migraciones-prod-vs-main.md.

-- Paciente autenticado puede leer (solo) su propia ficha.
-- Necesario para /api/me/patient y la app paciente; antes solo existía patients_nutri_all.
CREATE POLICY patients_self_select
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
