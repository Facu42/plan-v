# Corte 22 — repositorio Supabase alineado al contrato 016 v2

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales: los tests
usan un cliente falso que captura llamadas. Las rutas siguen fail-closed donde
el contrato no está aprobado.

## Cambios

1. `server/db/supabase-repo.ts`
   - `sbAddMessage` persiste `sent_at` (antes los mensajes enviados quedaban
     invisibles para la vista de paciente del contrato).
   - `mapMealLog`/`sbAddMealLog`: columna `photo_path` (016 v2), nunca
     `photo_url`; rechazo explícito de data URLs inline.
   - Menú semanal real: `loadPatientExtras` lee `meal_slots(weekday, slot, title)`
     → `weekPlan` agrupado por día + `todayPlan` derivado del weekday local
     (sin inventar horarios: `time: ''`).
   - Nuevas: `sbUpsertMenuSlot` (upsert `onConflict patient_id,weekday,slot`) y
     `sbDeleteMenuSlot`. Mapeo etiquetas UI ↔ enums (`Colación`↔`colacion`).
   - `menuWeekdayIndex(date)`: 0=Lunes…6=Domingo con fecha local.
2. `server/index.ts`
   - Ruta de análisis con Supabase habilitado: `photoPreview` presente → **501**
     `Fotos de comidas pendientes del contrato Storage 016` (las fotos deben
     subirse por el contrato Storage antes de insertar el log).
3. Contrato 016 v2: comentario de semántica `weekday: 0 = Lunes … 6 = Domingo`.
4. Tests: `server/db/supabase-repo.test.ts` reescrito con cliente Supabase falso
   (9 tests); `contracts-016.test.ts` +1 aserción.

## Qué sigue en 501 (hasta aprobación del contrato)

- `PATCH/DELETE /api/patients/:id/menu` con Supabase (repo listo, ruta no cableada).
- Turnos, cobranza, alta de pacientes, descanso persistente, descarte de brief.

## Verificación

- RED inicial: 7 fallos esperados (`sent_at` ausente, `photo_url`, sin funciones
  de menú, sin `menuWeekdayIndex`).
- Verde: `npm test` → 25 archivos / **129 tests**; `npm run check` OK.
- QA demo (Chrome headless aislado): login demo → Nutricionista → Marina → Plan
  → edición de slot persistida en API (`Wrap integral de pollo QA` → restaurado
  a `Wrap de pollo`). El modo demo (memoria) no fue afectado.
- Procesos y puertos 3001/5173/9224 cerrados.

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Próximo corte sugerido

Hábitos: `habit_logs` upsert + snapshot del día (hydration/energy/sleep) en el
repo, reemplazando la escritura directa a columnas `patients`; la ruta de sueño
sigue 501 hasta aprobación.
