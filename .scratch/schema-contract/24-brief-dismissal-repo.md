# Corte 24 — descarte del brief en el repo Supabase (016 v2)

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; tests con
cliente falso. La ruta `POST /api/patients/:id/brief/dismiss` sigue 501 con
Supabase habilitado hasta la aprobación del contrato.

## Cambios (`server/db/supabase-repo.ts`)

1. `sbDismissBrief(patientId, dismissedBy)`: update en `ai_briefs` con
   `status='dismissed'`, `dismissed_at` y `dismissed_by`, filtrado por
   `patient_id` + `status='pending_review'` — idempotente: si ya estaba
   dismissed/done no toca nada (espejo del store en memoria).
2. `loadPatientExtras`: la consulta de `ai_briefs` pasa de "sólo pending" a
   **último por `created_at` (limit 1)** y mapea:
   - `pending_review` → brief visible, `briefDismissed=false`;
   - `dismissed` → brief interno conservado, `briefDismissed=true` (la acción se
     vacía al serializar, como en el corte 20);
   - `done` / ausente → `brief=null`.
3. `mapPatient`: propaga `briefDismissed` desde extras.
4. Regeneración: `sbSetBrief` (delete pending + insert nuevo pending) queda como
   estaba — el nuevo pending pasa a ser el último por `created_at`, lo que
   resetea el descarte de forma natural, igual que `setBrief` en memoria.

## Tests

`supabase-repo.test.ts`: +4 (pending visible, dismissed interno, done/ausente
oculto, update sólo sobre pending con actor y timestamp). RED inicial: 4 fallos
(mapping ausente + función inexistente).

## Verificación

- `npm test` → 25 archivos / **139 tests** ✓ · `npm run check` ✓
- Sin superficie demo nueva: el flujo **Marcar luego** en memoria quedó
  verificado en el corte 20; este corte sólo toca el adaptador Supabase.

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Próximo corte sugerido

Consultas: el modelo actual (weekday + hora local) no alcanza para
`appointments.starts_at` (timestamptz). Decidir: extender el input con fecha
(próxima ocurrencia calculada con timezone del paciente) y cablear
`sbSetAppointment` + lectura de la próxima consulta.
