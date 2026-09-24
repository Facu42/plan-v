# Corte 27 — recordatorios en el repo Supabase (016 v2)

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; tests con
cliente falso. No hay ruta de recordatorios: la tabla guarda la **configuración**
de horarios por paciente; las ocurrencias diarias se siguen derivando
(`daily-reminders.ts`).

## Decisión de dominio

El panel de recordatorios deriva sus ítems del plan/hábitos/consulta (corte 12);
el `Patient` de dominio no lleva campo `reminders`. La tabla `reminders` del
contrato persiste la config (`kind`, `time_local`, `enabled`) — el repo expone
CRUD tipado sin tocar el modelo `Patient` ni la UI.

## Cambios (`server/db/supabase-repo.ts`)

1. Mapeo bidireccional `comida|agua|consulta|sueno` ↔ `meal|water|appointment|sleep`.
2. `sbUpsertReminder(patientId, kind, timeLocal, enabled)` — upsert con
   `onConflict: 'patient_id,kind,time_local'`; kind desconocido → error sin
   tocar la base.
3. `sbDeleteReminder(patientId, kind, timeLocal)`.
4. `sbGetReminderConfig(patientId)` → `{ kind, time: 'HH:MM', enabled }[]`
   ordenado por hora (recorta `HH:MM:SS` a `HH:MM`).

## Tests

`supabase-repo.test.ts`: +5 (upsert, los 4 kinds, delete, kind inválido sin
llamadas, carga con etiquetas de dominio). RED inicial: 5 fallos.

## Verificación

- `npm test` → 25 archivos / **156 tests** ✓ · `npm run check` ✓
- Sin superficie demo nueva.

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Estado del adapter 016 v2

Todos los dominios funcionales tienen repo alineado: mensajes, comidas, menú,
hábitos, brief (descarte), consultas, timeline y recordatorios. Quedan
invitaciones, cobranza/pagos y Storage — bloqueados por decisiones operativas
(proveedor de email, credenciales MP, runbooks), no por código.

## Próximo corte sugerido

Pausa de decisiones (aprobación 016 + responsables) o, si se prefiere seguir en
código: emisión de timeline desde las mutaciones en **modo memoria** ya existe;
se podría preparar el wiring de `sbAddTimelineEvent` detrás del mismo gate 501
para que la activación sea un flip trivial.
