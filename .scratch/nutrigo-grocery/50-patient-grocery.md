# Corte 50 — Lista de compras paciente Nutrigo

## Alcance

- Se auditó la lista de compras que ya existía en `PatientPlan` y `shopping-list.ts` antes de desarrollar una capacidad nueva.
- `ShowroomGrocery` migra esa función a la ruta paciente **Lista de compras** del diseño Nutrigo.
- La lista se deriva sólo de `weekPlan`, es decir, del plan semanal vigente publicado para ese paciente. No usa las semanas futuras sintéticas de la vista anterior.
- Agrupa por categoría, deduplica elementos y muestra cuántas comidas los mencionan.
- El checklist se persiste en `localStorage` con la clave existente `plan-v:<patientId>:shopping:current`, aislada por paciente.
- Incluye búsqueda, filtros Todos/Pendientes/Listos, reinicio y exportación `.txt`.
- La ruta dejó de mostrar **Pronto**, no abre `reference-frame` y oculta el rail genérico.

## Límites explícitos

- Los títulos actuales no contienen ingredientes estructurados, cantidades ni unidades. La interfaz no los inventa y lo advierte.
- La derivación conserva las reglas preexistentes; si no reconoce una preparación, la mantiene completa en **Otros** para revisión.
- No existe agregado manual persistente ni sincronización del checklist entre dispositivos.
- Presupuesto y gastos siguen fuera del alcance hasta una decisión de producto.
- No se modificaron API, contrato 016 ni Supabase.

## Evidencia

- Tests focalizados: 8/8 para `showroom-grocery` y `shopping-list`.
- Browser QA: `{"checks":4,"views":6,"items":7,"errors":[]}`.
- Matriz responsive: 1440, 800 y 390 px en claro y oscuro, sin overflow horizontal, rail duplicado, legacy ni errores JS.
- Flujos de navegador verificados: entrada paciente, ausencia de **Pronto**, check persistente, reinicio, búsqueda, filtros y exportación.
- Capturas inspeccionadas:
  - `grocery-light-1440.png`.
  - `grocery-dark-390.png`.
- Gate global: 52 archivos, 118 suites y 279/279 pruebas; TypeScript frontend/servidor, build de 121 módulos, `npm audit`, firmas y `git diff --check` aprobados.

## Estado

El corte funcional queda completo. La fidelidad visual general de Plan V continúa **NO APROBADA** hasta la revisión del usuario. No se hizo commit ni push.
