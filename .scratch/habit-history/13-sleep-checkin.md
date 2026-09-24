# Corte 13 — Registro e historial de descanso

Estado: **completado** (2026-09-05).

## Alcance

1. Se extendió el check-in diario con `sleep_minutes` (0–1440, entero).
2. La paciente registra horas de sueño desde Inicio; el cliente las convierte a minutos y muestra el valor guardado sin evaluarlo.
3. `habit_logs` conserva un único registro por paciente y fecha local, combinando hidratación, energía y descanso sin duplicar el día.
4. El panel diario incorpora `Descanso` a las 22:30:
   - pendiente: acción `Registrar` que cierra el panel y centra el check-in;
   - registrado: muestra horas/minutos y estado `Registrado`.
5. `Comidas y hábitos` muestra el descanso de hoy, días cargados y promedio de los últimos siete días.
6. El descanso no modifica la fórmula de adherencia vigente (75% comidas revisadas + 25% hidratación semanal).
7. En Supabase configurado, cualquier actualización que incluya `sleep_minutes` responde `501` hasta que exista y se apruebe la migración `016`; no hay persistencia silenciosa en memoria.

## Privacidad y lenguaje

- El dato es declarado por la paciente.
- La UI dice explícitamente que es información para seguimiento, no una evaluación.
- No se deriva diagnóstico, recomendación clínica ni score desde el sueño.

## Verificación automática

- Tests RED previos para schema, merge diario y recordatorio.
- Suite final: 14 archivos / 71 tests.
- TypeScript frontend y servidor.
- Build de producción.
- Audit, firmas de dependencias y `git diff --check`.

## QA en Chrome real

Viewport `390 × 844`, modo memoria/demo:

1. Inicio mostró el check-in de descanso pendiente sin overflow horizontal.
2. Panel mostró 7 recordatorios y `Descanso · 22:30 · Horario anterior`.
3. `Registrar` cerró el panel y centró suavemente el formulario.
4. Se guardaron `7,5 h`; la UI confirmó `7 h 30 min`.
5. Al reabrir, el recordatorio cambió a `Registrado` y perdió la acción de carga.
6. El score profesional permaneció en `63`.
7. CRM → `Comidas y hábitos` mostró `7 de 7 días registrados · promedio 7 h 13 min`.
8. `document.documentElement.scrollWidth === 390` en paciente, panel y CRM.
