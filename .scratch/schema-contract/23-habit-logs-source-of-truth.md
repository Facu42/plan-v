# Corte 23 — habit_logs como fuente de verdad (016 v2)

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; tests con
cliente falso. La ruta de sueño sigue 501 con Supabase habilitado hasta la
aprobación del contrato.

## Cambios

1. `server/db/supabase-repo.ts`
   - `localDateId(date)`: YYYY-MM-DD del calendario local (nunca UTC).
   - `loadPatientExtras`: carga `habit_logs` (últimos 14 días) y deriva el
     snapshot del día (`hydration`, `energy`, `sleep_minutes`) desde la fila del
     día local. Sin fila de hoy → `0 / null / null`.
   - `mapPatient`: snapshot e `habit_logs` vienen de extras (ya no de columnas
     `patients`).
   - `sbUpdateHabits`: lee la fila del día, fusiona y hace **upsert** en
     `habit_logs` con `onConflict: 'patient_id,date'`. Ya no escribe columnas
     `patients`. Acepta `sleep_minutes` (la ruta lo sigue gateando con 501).
2. Contrato 016 v2 (`supabase/contracts/016_plan_v_contract_draft.sql`)
   - `patients` pierde `hydration` y `energy` (snapshot duplicado): la fuente es
     `habit_logs`. Grant de UPDATE de `patients` actualizado acorde.
3. Tests
   - `supabase-repo.test.ts`: +5 (localDateId, snapshot derivado, defaults sin
     fila, upsert con merge, fila nueva sin datos previos).
   - `contracts-016.test.ts`: +1 (patients sin hydration/energy; habit_logs con
     unique(patient_id,date)).

## Verificación

- RED: 4 fallos por `localDateId` ausente (y comportamiento viejo).
- Verde: `npm test` → 25 archivos / **135 tests**; `npm run check` OK.
- QA HTTP en modo memoria (sin cambios esperados): `PATCH /habits` → 200 con
  `hydration 7 / energy Con energía / sleep 470`, recarga confirma y
  `habit_logs` conserva 7 entradas. Puerto cerrado al terminar.
- Nota: restaurar `sleep_minutes: null` devuelve 400 — el schema no admite null
  para ese campo (comportamiento preexistente, sin cambios).

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Próximo corte sugerido

Consultas: mapear `appointments` del contrato (starts_at timestamptz) con el
modelo actual (weekday + hora local) — requiere decisión de fecha/timezone — o
bien el descarte del brief en repo (`ai_briefs.status='dismissed'`), que ya
tiene contrato y mapping pendiente.
