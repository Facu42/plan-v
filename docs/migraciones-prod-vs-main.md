# Migraciones: producción vs main (reconciliado el 31/10/2026)

Producción (plan-v-app, `supabase_migrations.schema_migrations`) tenía 118 registros y `supabase/migrations` 116 archivos.
Las versiones no coinciden 1 a 1 porque las migraciones se aplicaron por MCP con la hora de aplicación como versión;
por eso se comparó por nombre.

## Aplicadas en prod y que no estaban en el repo (6)

Se guardan verbatim en `supabase/prod-history/` como archivo histórico. **No** se suman a la cadena de
`supabase/migrations` porque su efecto ya lo cubren migraciones posteriores del repo y re-ejecutarlas en una base
nueva (CI, entornos efímeros) chocaría con esas migraciones. No se re-aplicó nada en prod.

| Versión prod | Nombre | Cubierta en el repo por |
|---|---|---|
| 20260921133925 | ping_empty_check | (solo `select 1`) |
| 20260921161022 | fix_security_invoker_patient_views | 20261001222659_explicit_patient_view_boundary, 20261009154511_invoker_patient_profile_projections |
| 20260921163821 | patients_self_select_rls | 20261001195127_close_legacy_patient_row_access, 20261001222659_explicit_patient_view_boundary |
| 20260924021448 | recipe_cover_funcs_align | 20260924140000_recipe_cover_storage |
| 20261009152202 | prepare_patient_meal_read_projection | 20261009141501_readonly_patient_meal_views |
| 20261028230411 | ajustes_config_tablas | 20261028220000_ajustes_config (mismo contenido de tablas; nombre distinto) |

## En el repo y sin registro con el mismo nombre en prod (4)

| Archivo | Estado en prod (31/10) |
|---|---|
| 20261028220000_ajustes_config.sql | Aplicada como `ajustes_config_tablas`. |
| 20261027120000_patient_tags.sql | La tabla `public.patient_tags` existe; aplicada sin registro propio. |
| 20261027130000_patient_history_entries.sql | La tabla `public.patient_history_entries` existe; aplicada sin registro propio. |
| 20261017030000_mfa_aal2_gate.sql | **No aplicada** (no existen `private.mfa_enforcement` ni `private.mfa_gate_ok`). Es aditiva y queda apagada (`enabled = false`). |
