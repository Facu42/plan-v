# Corte 64 — Filtros del Centro de seguimiento

Fecha: 2026-09-15

## Entrega

- El Centro de seguimiento profesional incorpora filtros configurables:
  - **Banda de adherencia**: Todas, Necesitan atención (<70%), Seguimiento estable (70–84%) y En buen ritmo (≥85%).
  - **Revisiones pendientes**: Todas, Con pendientes y Sin pendientes.
- Contador visible `X de Y` que refleja el acotamiento real.
- Estado vacío honesto cuando la combinación no tiene resultados.
- La acción **Revisar comidas** sólo aparece en filas con pendientes y conserva la paciente seleccionada al navegar al Diario.
- Los umbrales reutilizan las mismas bandas ya usadas en Paneles (`adherence_score < 70 / 70–84 / ≥85`); no se inventó ningún score nuevo.

Implementación: helper puro exportado `filterFollowUpRows(rows, band, pending)` en `ShowroomWorkCenter.tsx`, estado local de filtros y estilos `.nvw-filters`.

## TDD

- RED: `filterFollowUpRows` inexistente y superficie sin filtros — 2 tests fallaron por el motivo correcto.
- GREEN: helper + UI + CSS; suite focal 12/12 y TypeScript aprobados.

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9249` (la instancia `9248` quedó colgada y fue reemplazada).

Recorridos aprobados:

1. estado inicial con contador `N de N`;
2. filtro Con pendientes con acción Revisar comidas conservando el contexto;
3. filtro Sin pendientes sin acción de revisión;
4. filtro Necesitan atención sin adherencias ≥70;
5. restauración del listado completo;
6. móvil oscuro `390 px` con el mismo resultado de filtro y sin overflow.

Evidencia:

- `followup-light-1440.png`
- `verify.py`
- `vitest.json`

## Gate

```text
61/61 archivos
136/136 suites
321/321 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 6/6 recorridos, 0 errores
```

## Límite vigente

Los filtros operan sobre el estado demo actual en memoria; agrupaciones guardadas y persistencia de preferencias de filtro siguen pendientes junto con el contrato 016.
