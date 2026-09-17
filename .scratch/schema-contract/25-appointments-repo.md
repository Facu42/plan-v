# Corte 25 — consultas en el repo Supabase (016 v2)

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; tests con
cliente falso. La ruta `PUT /api/patients/:id/appointment` sigue 501 con Supabase
habilitado hasta la aprobación del contrato.

## Decisión de mapping (weekday + hora local → timestamptz)

El input actual (`{day, time, duration, channel, meet_url?}`) se conserva sin
cambios de UI ni de schema de entrada. El repo convierte a instante real:

- **Timezone único v0**: `America/Argentina/Buenos_Aires` (UTC-3, sin DST),
  constante `PATIENT_TIMEZONE`. Toda la lógica usa `Intl.DateTimeFormat` con
  `timeZone` explícito: no depende del TZ del servidor.
- `nextAppointmentStartsAt(day, time, from)`: próxima ocurrencia del weekday a
  la hora de pared (si hoy aplica y la hora no pasó → hoy; si pasó → semana
  siguiente). Casos testeados con referencias ART fijas.
- `formatAppointmentWhen(starts_at)`: vuelve a `'Jueves · 14:30'`.

## Cambios (`server/db/supabase-repo.ts`)

1. Helpers TZ: `tzParts`, `zonedWallToUtc`, `nextAppointmentStartsAt`,
   `formatAppointmentWhen` (exportados y testeados).
2. `sbSetAppointment(patientId, nutritionistId, appointment|null)`: el dominio
   v0 tiene una sola consulta vigente — borra las `scheduled` del paciente e
   inserta la nueva con `starts_at`, `duration_min`, `channel`, `meet_url`.
   `null` sólo borra (limpieza).
3. `loadPatientExtras`: 6ª query — próxima `scheduled` con `starts_at >= ahora`
   ordenada ascendente, limit 1 → `patient.appointment` con `when` formateado.
4. `mapPatient`: `appointment` desde extras.

## Tests

`supabase-repo.test.ts`: +8 (3 casos de próxima ocurrencia, formato display,
reemplazo con delete+insert, limpieza null, mapping con/sin consulta). RED
inicial: 7 fallos (helpers y función ausentes).

## Verificación

- `npm test` → 25 archivos / **147 tests** ✓ · `npm run check` ✓
- Sin superficie demo nueva (ruta sigue 501; flujo de consultas en memoria
  verificado en cortes 07 y 19).

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Limitación documentada

Timezone fijo v0. Cuando haya pacientes fuera de Argentina, `patients` necesita
una columna `timezone` y el repo debe leerla en vez de la constante.

## Próximo corte sugerido

Recordatorios (`reminders`) o timeline (`timeline_events`) en repo — ambos con
contrato v2 listo. Invitaciones/cobranza quedan para cuando haya decisiones
operativas (proveedor de email, responsables).
