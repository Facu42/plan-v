# Supabase setup — Plan V

## Schema: no aplicar el draft de este repo

La migración `supabase/migrations/_DRAFT_DO_NOT_APPLY_plan_v_v0.sql` **no se corre**.

Fugas conocidas (por eso no es ley):
- Paciente puede leer `note_for_nutri` vía `meal_logs` (policy select directa a la tabla).
- Paciente ve `adherence_why` en `patients` (self select de fila completa).
- Paciente ve `payments` y columnas `billing_*`.

**Núcleo** reescribe el schema contra el **016 ya lockeado**. Auth/UI de este repo espera esa migración; no inventar tablas ni policies acá.

## Variables de entorno (cuando Núcleo publique el 016+)

Copiá `.env.example` → `.env`:

| Variable | Dónde |
|---|---|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (solo servidor) |

Sin service role, la API sigue en **modo memoria** (demo).

## Auth en el cliente

- Login/registro + modo demo ya están en la app.
- Nutricionista / paciente se rutean por `profiles.role`.
- Invite paciente (`patients.user_id`) queda para cuando el 016+ esté aplicado.
