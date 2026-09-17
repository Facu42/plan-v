# Corte 51 — Progreso paciente Nutrigo

## Alcance

- Se auditó el resumen genérico del showroom, `PatientCamino` y `buildJourneySummary` antes de desarrollar una segunda lógica de progreso.
- `ShowroomProgress` reemplaza la tarjeta genérica de **Progreso** en el modo paciente.
- Reutiliza la ventana local de siete días ya calculada por `buildShowroomPatient`; no accede al `Patient` profesional completo.
- Presenta adherencia actual, objetivo y avance publicados, promedio de agua, descanso registrado, energía declarada, comidas revisadas/pendientes y detalle diario.
- Los registros de comidas se limitan a los identificadores incluidos en esa misma ventana de siete días.
- La página usa composición basada en Nutrigo Progress `105:2790`, con variantes 1440/800/390 y tema oscuro propio de Plan V.
- Progreso usa ancho operativo completo y ya no conserva el rail diario genérico.

## Privacidad y límites

- La entrada recibe sólo `ShowroomPatient`, que excluye `adherence_why`, `goal_history`, `note_for_nutri`, briefs y otros campos profesionales.
- Browser QA comprobó la exclusión de 14 valores privados reales del paciente demo seleccionado.
- No se muestran ni infieren peso, IMC, medidas, fotografías corporales, fases de sueño o calorías ausentes.
- Los días sin hábitos quedan explícitamente sin registro; no se interpolan tendencias.
- No se añadieron modelo, API, Supabase ni cambios al contrato 016.

## Evidencia

- Test RED inicial: importación falló porque `ShowroomProgress` todavía no existía.
- Tests focalizados posteriores: 16/16 entre Progreso, resumen de siete días y modelo seguro del showroom.
- Browser QA: `{"checks":3,"views":6,"patient":"pat-sofia","private":14,"errors":[]}`.
- Matriz responsive: 1440, 800 y 390 px, claro y oscuro; sin overflow del documento, rail, legacy ni errores JS.
- Se corrigió un overflow móvil real añadiendo contención `min-width:0` a las tarjetas operativas.
- Se corrigió la grilla móvil para que la cuarta métrica ocupe el ancho completo, eliminando un hueco visual.
- Capturas inspeccionadas:
  - `progress-light-1440.png`.
  - `progress-dark-390.png`.
- Gate global: 53 archivos, 120 suites y 282/282 pruebas; TypeScript frontend/servidor, build de 121 módulos, `npm audit`, firmas y `git diff --check` aprobados.

## Estado

La superficie paciente de Progreso queda funcional dentro de Nutrigo. La comparación profesional por períodos y el modelo sensible de peso/medidas continúan pendientes. La fidelidad visual general permanece **NO APROBADA** hasta revisión del usuario. No se hizo commit ni push.
