# Supabase setup — Plan V

## Schema: no aplicar el draft de este repo

La migración `supabase/migrations/20260901000000_plan_v_v0.sql` **no se corre**.

Fugas conocidas (por eso no es ley):
- Paciente puede leer `note_for_nutri` vía `meal_logs` (policy select directa a la tabla).
- Paciente ve `adherence_why` en `patients` (self select de fila completa).
- Paciente ve `payments` y columnas `billing_*`.

El backend debe implementarse contra un contrato `016` revisado y aprobado; el archivo actual todavía no es ley de schema. Auth/UI no debe inventar tablas ni policies fuera de ese contrato.

Existe una propuesta revisable en `supabase/contracts/016_plan_v_contract_draft.sql`, documentada en `docs/contract-016-review.md`. También está marcada **DRAFT — REVIEW ONLY — DO NOT APPLY**: sirve para revisión, no para ejecutar ni conectar datos reales. La aprobación y la prueba RLS en staging siguen [`docs/016-approval-and-staging-checklist.md`](016-approval-and-staging-checklist.md).

## Variables de entorno (cuando el 016 sea aprobado y publicado)

Copiá `.env.example` → `.env`:

| Variable | Dónde |
|---|---|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (solo servidor) |

Sin service role, la API sigue en **modo memoria** (demo).

## Contrato de autorización del servidor

- Con service role configurada, toda ruta `/api/*` excepto `/api/health` exige un bearer token válido; no existe fallback a datos demo.
- La API resuelve el rol desde `profiles.role` y la relación paciente–nutricionista antes de leer o modificar una ficha.
- La paciente sólo puede registrar comidas, hábitos y mensajes sobre su propia ficha.
- Revisión de comidas, ficha clínica y copiloto quedan restringidos a la nutricionista asignada.
- Las respuestas para paciente eliminan `note_for_nutri`, `ai_briefs`/`brief`, `adherence_why`, mensajes no enviados y el indicador `suggested_by_ai`.

Estas defensas de aplicación **no reemplazan RLS**. Deben probarse nuevamente contra la migración 016 antes de habilitar datos reales.

## Auth en el cliente

- Login/registro + modo demo ya están en la app.
- Nutricionista / paciente se rutean por `profiles.role`.
- Invite paciente (`patients.user_id`) queda para cuando el 016+ esté aplicado.
