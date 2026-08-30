# Plan V — Brief de producto

Empresa facturable B2B2C. Primera nutricionista: Lic. Verónica Trenti (@planv.nutricion). Después, SaaS para consultorios.

## Qué es
Dos superficies, un cerebro:

1. **Panel del nutricionista** (web escritorio). Layout CRM estricto según `design/referencia-panel-nutri.png`: sidebar + lista Mi trabajo + ficha del paciente. La IA no es un chat al costado: resume cada dato y sugiere la próxima acción (mensaje, ajuste de menú, turno). Comentarios, videollamadas, seguimiento.
2. **App del paciente**. Menú, lista de compras, carga de datos y evoluciones, recordatorios (comer, agua, dormir). Registro de comidas por foto → macros estimados → resumen al nutri.

## Diferencial
El copiloto clínico. Nutrium y similares son expediente + plan. Plan V es: cada foto, check-in y hábito entra, se analiza, y el nutri abre el día con “qué hacer con quién”.

## Fuera de alcance (v0)
Diagnóstico automático, receta médica, red social, marketplace de suplementos.

## Stack hoy
Prototipo Vite + React 19 + TypeScript en la raíz (`src/`, `plan-v-pulse`). Ya hay shell paciente, panel pro y un CRM de referencia en `src/plan-v.css` + `PlanVExperience`. Destino: auth real, datos persistentes, deploy Vercel.

## Marca
Ver `marca/` y `docs/design-system.md`. Neumorfismo + pasteles. No otra estética.
