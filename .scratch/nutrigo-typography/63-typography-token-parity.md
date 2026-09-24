# Corte 63 — Escala tipográfica y paridad de tokens

Fecha: 2026-09-15

## Objetivo

Afinar tipografía, tamaños y espaciado de tarjetas, gráficos e iconos comparando paciente y consultorio en claro/oscuro, eliminando derivas medibles entre ambos roles.

## Hallazgos medidos (1440 px)

- La superficie paciente sobreescribía los tokens base con valores propios (`#f8f6f3`, `#29332e`, `#e4efd1`, `#ffe2a2`, `#f9d9bc`), distintos de los del sistema Nutrigo compartido (`#f7f6f2`, `#173d32`, `#e1efd5`, `#ffe6ad`, `#fce0d3`). Paciente y consultorio mostraban fondos, tintas y acentos levemente diferentes.
- Métricas con `min-height` 142 px en paciente y 138 px en profesional.
- Botones de navegación de 42 px en paciente y 41 px, radio 8 vs 9, en profesional.

## Cambios

- Eliminada la sobreescritura de tokens de `.nv-patient`: paciente y consultorio comparten exactamente los mismos tokens de superficie en claro y oscuro.
- `.nv-pro .nv-metric` unificada a `min-height:142px`.
- Navegación profesional unificada: `min-height:42px`, radio `8px`, `font-size:12px`, igual que la paciente.

No se modificaron datos, navegación, permisos ni la escala tipográfica ya verificada (h1 25/700, cards 14/600, métricas 23/600, gauge 30/600, badges 9/600, Poppins local).

## QA de navegador

Ejecutado sobre los servicios principales con Chrome DevTools aislado `9247`.

Recorridos aprobados:

1. paridad de tokens paciente/profesional en claro (color, fondo, nav, métricas y acentos idénticos);
2. paridad de tokens paciente/profesional en oscuro;
3. escala tipográfica y familia Poppins en el dashboard paciente;
4. tablet claro `800 px` sin overflow;
5. móvil oscuro `390 px` sin overflow ni métricas recortadas.

Evidencia:

- `patient-light.png`, `patient-dark.png`, `pro-light.png`, `pro-dark.png` (antes)
- `patient-light-final.png`, `patient-dark-390-final.png` (después)
- `measure.py`, `verify.py`, `vitest.json`

Verificación por geometría/estilos computados y capturas para revisión humana; el endpoint de visión no estuvo disponible. No constituye aprobación visual global.

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
browser QA: 5/5 recorridos, 0 errores
```
