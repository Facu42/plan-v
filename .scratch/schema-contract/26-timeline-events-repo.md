# Corte 26 — timeline_events en el repo Supabase (016 v2)

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; tests con
cliente falso. No hay ruta nueva que cablear (los eventos se crearán desde las
rutas cuando el contrato se apruebe).

## Cambios (`server/db/supabase-repo.ts`)

1. `sbAddTimelineEvent(patientId, { kind, title, body, visibility? })`: inserta
   en `timeline_events` con `occurred_at` actual y visibilidad `professional`
   por defecto (`patient` explícita para eventos visibles por la paciente).
2. `loadPatientExtras`: 7ª query — últimos 20 `timeline_events` por
   `occurred_at` desc → `patient.timeline` con `atLabel` derivado.
3. **Se eliminó la fabricación** de timeline desde `meal_logs`: si no hay
   eventos persistidos, la timeline queda vacía (honesto, sin placeholders).
4. `timelineAtLabel(isoDate)`: `HOY` / `AYER` / `dd/mm` con calendario local.

## Tests

`supabase-repo.test.ts`: +4 (insert con visibilidad default y explícita, mapping
HOY/AYER/fecha ordenado, vacío sin fabricación aunque haya meal_logs). RED
inicial: 4 fallos.

## Verificación

- `npm test` → 25 archivos / **151 tests** ✓ · `npm run check` ✓
- Sin superficie demo nueva (modo memoria intacto; la timeline demo se verificó
  en cortes anteriores).

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Pendiente documentado

- Las rutas actualmente cableadas (comidas, mensajes, hábitos) **no emiten**
  eventos de timeline en modo Supabase; al aprobarse el contrato se cableará
  `sbAddTimelineEvent` en cada mutación (paridad con el store en memoria).

## Próximo corte sugerido

Recordatorios (`reminders` con `reminder_kind` incl. `appointment`) — último
dominio chico con contrato v2 listo. Después: decisiones operativas
(invitaciones/cobranza) o cableado de rutas tras aprobación.
