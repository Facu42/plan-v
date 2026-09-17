# Corte 11 — Menú → lista de compras exportable

Estado: **implementación y QA del corte completados** (2026-09-05).

## Qué quedó implementado

1. **Generación determinista** (`shopping-list.ts`): deriva ingredientes desde `title` + `detail` opcional de cada comida, sin IA. Normaliza acentos, deduplica y cuenta en cuántas comidas aparece cada ingrediente.
2. **Cobertura conservadora**: reglas explícitas para verdura/fruta, pollo/huevo/pescado, lácteos, panes/cereales y almacén. Si un plato no coincide con ninguna regla no se omite: aparece como `Ingredientes para: <plato>` en Otros.
3. **Lista agrupada**: Verdulería, Proteínas, Lácteos, Panadería y cereales, Almacén y Otros.
4. **Checks locales persistentes**: clave aislada por paciente y semana (`plan-v:<patient>:shopping:<week>`). No se envían datos ni se modifica el plan.
5. **Exportación `.txt`**: incluye semana/rango, categorías, estado `[ ]` / `[x]` y frecuencia de ingredientes repetidos.
6. **Accesibilidad**: botones reales, `aria-pressed`, progreso con `aria-live` y estado visible tras descargar.

## Verificación

- TDD: 4 tests del generador, deduplicación, fallback, clave de persistencia y exportación.
- Navegador real a 390×844:
  - 16 ingredientes en 6 categorías, `scrollWidth = 390`.
  - Marcar Pollo: `1 de 16 listos`; persistió tras recargar (`aria-pressed=true`, localStorage `["pollo"]`).
  - Exportación: `lista-de-compras-current.txt`; Blob inspeccionado con `Pollo` marcado `[x]` y rango correcto.
  - Flujo CRM → paciente: Verónica cambió Lunes/Almuerzo a `Bowl de lentejas y arroz`; Mi plan mostró el plato y la lista agregó `Arroz` y `Lentejas`.
- Gates aislados del corte: 13 archivos / 65 tests, TypeScript frontend tocado + servidor, build 100 módulos, audit 0, 90 firmas, 45 attestations y `git diff --check` OK.

## Interferencia concurrente

El gate global sin exclusiones continúa bloqueado por `src/components/patient/daily-reminders.test.ts`, archivo RED preexistente/concurrente que importa `./daily-reminders`, todavía inexistente. Este corte no modifica ni excluye ese archivo del repositorio; sólo se excluyó del comando aislado para validar compras.

## No incluye

- Cantidades o precios: el modelo actual no almacena porciones/ingredientes estructurados en `meal_slots`.
- Sincronización de checks entre dispositivos (v0 exige check local).
- Supermercados, pedidos o recomendaciones clínicas.
