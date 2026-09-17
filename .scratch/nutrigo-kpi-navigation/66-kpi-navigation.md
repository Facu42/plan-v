# Corte 66 — KPIs navegables del dashboard

Fecha: 2026-09-15

## Entrega

- Los cuatro KPI del dashboard compartido paciente/profesional ahora son botones reales:
  - **Adherencia** → Progreso.
  - **Comidas revisadas** → Diario de comidas.
  - **Descanso** → Progreso.
  - **Hidratación** → Progreso.
- Cada uno expone `aria-label="Ver detalle de <KPI>"` y conserva valor, nota, gráfico e icono.
- `NvMetric` gana la prop opcional `onOpen`: sin ella sigue siendo una tarjeta estática (ShowroomMeals y demás superficies no cambian).
- En el rol profesional la navegación conserva la paciente seleccionada.

Implementación: prop `onOpen` en `primitives.tsx`, destinos en `PatientOverview.tsx` y estilos `.nv-openable` (reset de botón, hover sutil).

## TDD

- RED: el dashboard no exponía botones KPI.
- GREEN: prop + destinos + CSS; suites focales 21/21 y TypeScript aprobados.

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9252`.

Recorridos aprobados:

1. KPI Comidas revisadas → Diario y regreso;
2. KPI Adherencia/Descanso/Hidratación → Progreso y regreso;
3. rol profesional: el KPI conserva la paciente Sofía en el Diario;
4. móvil oscuro `390 px` con navegación KPI y sin overflow.

Evidencia:

- `kpi-light-1440.png`
- `verify.py`
- `vitest.json`

## Gate

```text
61/61 archivos
136/136 suites
325/325 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 4/4 recorridos, 0 errores
```
