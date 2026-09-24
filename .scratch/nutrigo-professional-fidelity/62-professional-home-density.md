# Corte 62 — Densidad del Inicio profesional

Fecha: 2026-09-15

## Objetivo

Acercar el Inicio del consultorio (rol nutricionista) al ritmo vertical y la composición del frame Nutrigo `12:792`, sin quitar herramientas agregadas ni la selección multipaciente.

## Cambios

- Topbar global profesional fuera del flujo en escritorio: queda fija al pie de la sidebar (`223 px`), igual que la variante paciente; recupera `80 px` verticales y el contenido empieza en `y=0`.
- Marca Plan V compactada también en la sidebar profesional (isotipo `36 px`, tipografía reducida).
- Resumen del consultorio: `76 → 56 px` (cuatro datos en una franja fina con divisores).
- Barra **Mi trabajo**: `148 → 140 px`; selector de paciente a la izquierda y las seis acciones en una grilla 3×2 a la derecha, con la nota demo debajo de las acciones.
- Banner de contexto del paciente: `47 → 43 px`, franja más fina.
- El dashboard del paciente embebido sube de `y=509` a `y=373` y la altura total del Inicio baja de `1612` a `1477 px`.
- En tablet (`≤1250 px`) la grilla de acciones vuelve a ancho completo; en móvil (`≤760 px`) la topbar regresa al flujo normal para conservar el menú.

No se cambiaron datos, acciones, navegación ni permisos. Las seis acciones siguen abriendo Ficha/Comidas/Plan/Consultas/Pacientes/Objetivos con la paciente seleccionada.

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9246`.

Recorridos aprobados:

1. escritorio claro `1440 × 1232`: geometría del shell y de cada bloque, topbar fija fuera del flujo, acción **Revisar comidas** conservando la paciente seleccionada y regreso a Inicio;
2. tablet claro `800 × 1100`: toolbar recompuesta sin overflow ni botones recortados;
3. móvil oscuro `390 × 844`: topbar estática, menú móvil operativo y sin overflow horizontal.

Evidencia:

- `before-light-1440.png`
- `after-light-1440-final.png`
- `light-1440.png`
- `dark-390.png`
- `verify.py`
- `vitest.json`

La revisión visual automatizada con el modelo actual no estuvo disponible en este corte; la verificación se hizo por geometría DOM, recorrido funcional y capturas para revisión humana. No constituye aprobación visual global.

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
