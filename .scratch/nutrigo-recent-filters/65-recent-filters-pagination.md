# Corte 65 — Filtros y paginación de Actividad reciente

Fecha: 2026-09-15

## Entrega

- **Actividad reciente** incorpora filtros configurables:
  - **Paciente**: Todas las pacientes más una opción por cada paciente con movimientos.
  - **Recencia**: Todas, Hoy, Ayer y Anteriores, derivada de `TimelineEvent.atLabel` sin reconstruir cronología clínica global.
- Paginación incremental **Ver más movimientos** (`8` por página), sin duplicar ni omitir movimientos.
- Contador de movimientos que refleja el filtro activo y estado vacío honesto.
- Cambiar cualquier filtro reinicia la paginación.
- Abrir un movimiento sigue llevando a la ficha de la paciente correspondiente.

Implementación: helpers puros exportados `filterRecentActivity` y `paginateRecentActivity` en `ShowroomWorkCenter.tsx`, estado local y estilos `.nvw-more`.

## TDD

- RED: 3 tests fallaron (helpers inexistentes y superficie sin filtros).
- GREEN: helpers + UI; la primera redacción del test de paginación asumía página como ventana y se corrigió al contrato incremental real (acumulación sin duplicados).
- Suite focal 15/15 y TypeScript aprobados.

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9250`.

Recorridos aprobados:

1. estado inicial con todos los movimientos;
2. filtro por paciente sin mezclar pacientes + filtro Ayer;
3. filtro Anteriores con estado vacío honesto cuando no hay datos;
4. navegación de un movimiento a la ficha de su paciente;
5. móvil oscuro `390 px` con filtro Hoy y sin overflow.

La captura de escritorio se omitió porque la instancia de Chrome empezó a colgar las capturas tras varios minutos (mismo síntoma ya registrado); las comprobaciones funcionales y de layout terminaron limpias.

Evidencia:

- `verify.py`
- `vitest.json`

## Gate

```text
61/61 archivos
136/136 suites
324/324 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 5/5 recorridos, 0 errores
```

## Límite vigente

La recencia sigue derivándose de `atLabel` (HOY/AYER/otro); un timestamp global persistido y paginación de servidor requieren el modelo longitudinal y el contrato 016.
