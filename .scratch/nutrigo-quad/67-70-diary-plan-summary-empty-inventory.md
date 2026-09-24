# Cortes 67–70 — vínculo registro↔plan, resumen navegable, matriz de vacíos e inventario del contrato

Fecha: 2026-09-15

## Corte 67 — Diario: vínculo registro ↔ plan (paso 9.2)

- Cada registro del Diario paciente muestra **Del plan** o **Fuera del plan** comparando el slot del registro con el mismo día de semana del plan semanal publicado.
- Sin plan publicado, fecha inválida o día fuera de la plantilla: no se muestra etiqueta (`unknown`), nunca se inventa la relación.
- El pie explica que la etiqueta es una comparación editorial, no una evaluación clínica; sólo aparece cuando hay plan.
- Helper puro exportado `mealLogPlanRelation(log, weekPlan)`.

## Corte 68 — Resumen agregado navegable (pasos 3.1/3.2)

- Los cuatro datos del resumen del consultorio ahora abren su flujo real: **Pacientes activos** → directorio, **Comidas por revisar** → Diario de la paciente seleccionada, **Adherencia media** → Centro de seguimiento, **Consultas programadas** → Agenda.
- Se enrutaron los módulos `seguimiento` y `agenda` en `openOperation` (antes caían al puente del CRM anterior); toda la navegación conserva la paciente seleccionada.
- Sin selección activa, «Comidas por revisar» queda deshabilitado en lugar de cambiar de paciente silenciosamente.

## Corte 69 — Matriz de estados vacíos (paso 13, QA ampliado)

- Nueva suite `showroom-empty-states.test.tsx` (8 pruebas): los cinco módulos del centro de trabajo, Paneles con indicadores en cero sin división por cero, Objetivos sin datos y directorio de pacientes vacío.
- Todas las superficies ya exponían estados vacíos explícitos; la matriz queda como guardia contra regresiones (`NaN`/`undefined` incluidos en las aserciones).

## Corte 70 — Inventario y matriz de permisos del contrato ampliado (pasos 2.1/2.2)

- Nuevo documento `docs/contract-expansion-inventory.md` (borrador, sin SQL):
  - Inventario de entidades demo/derivadas/futuras con lo que cada una exige antes de persistir.
  - Matriz de permisos nutricionista/paciente/servicio por entidad, mapeada a las `PatientAction` vigentes.
  - Observaciones de revisión (`plan_b`, `read_resource`, 501 hasta contrato, autorización centralizada).

## QA de navegador

Chrome DevTools aislado `9253`, tres recorridos sin errores: etiquetas Del plan/Fuera del plan en el Diario, las cuatro navegaciones del resumen profesional con contexto conservado, y móvil oscuro 390 px sin overflow.

## Gate

```text
62/62 archivos
138/138 suites
336/336 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 3/3 recorridos, 0 errores
```
