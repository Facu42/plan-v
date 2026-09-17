# Corte 61 — Fidelidad del Dashboard paciente

Fecha: 2026-09-15

## Objetivo

Recalibrar la pantalla Inicio del paciente contra la geometría verificable del frame local Nutrigo `12:792`, sin cambiar datos, navegación, permisos ni incorporar información clínica inexistente.

## Cambios

- Shell de escritorio conservado en `223 / 892 / 325 px` para sidebar, contenido central y rail.
- Marca Plan V compactada: isotipo `44 → 36 px`, tipografía y tracking reducidos para recuperar la escala de navegación de la referencia.
- Fila de métricas: `156.89 → 142 px`.
- Bloque objetivo/registro nutricional: `311.39 → 306 px`.
- Seguimiento: `125 → 138 px`.
- Inicio del contenido principal conservado en `y=106` y ancho interior en `836 px`.
- Miniaturas principales del plan: `128 → 176 px`, manteniendo su rótulo explícito de imágenes ilustrativas.
- Reglas de altura exacta limitadas al escritorio; tablet y móvil recuperan alturas naturales para no recortar contenido.

No se añadieron imágenes, métricas, objetivos, calorías ni datos clínicos.

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9245`.

Recorridos aprobados:

1. escritorio claro `1440 × 1232`: geometría exacta, navegación Seguimiento → Progreso → Inicio y tarjetas sin recorte;
2. tablet claro `800 × 1100`: reorganización responsive, controles contenidos y sin overflow horizontal;
3. móvil oscuro `390 × 844`: dos columnas de métricas, menú móvil operativo y sin overflow horizontal.

Evidencia:

- `before-light-1440.png`
- `after-light-1440-final.png`
- `light-1440.png`
- `dark-390.png`
- `verify.py`
- `vitest.json`

La inspección visual no detectó clipping u overflow bloqueante. El resultado se aproxima más al ritmo vertical y a las proporciones del frame, pero **no constituye aprobación visual global**.

## Gate

```text
61/61 archivos
136/136 suites
319/319 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 3/3 recorridos, 0 errores
```
