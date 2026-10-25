# Handoff: boceto panel nutri → app funcional

**Fecha:** 24–25 oct 2026 (America/Buenos_Aires)  
**Dueño del hilo:** Plan V (asistente) + Facu  
**Estado:** Fase 0 en curso — registro para que otro agente continue. **No arrancar shell/UI en la app hasta ok escrito de Facu** (ver Decisiones).

## Fuentes canónicas

| Qué | Dónde |
|---|---|
| Plan iterable (Page) | https://cursor.com/canvas/store-0f75b483-c592-490c-9d4f-f54cf2aee507/6a995189-0641-4c51-ba7e-6ad9946145ab |
| Plan canónico por fases | `docs/panel-nutri-rediseno/version-final.md` |
| Boceto de trabajo (seis pantallas + evolución) | rama `cursor/boceto-seis-pantallas-66c3`, archivo `design/panel-nutri/v29/panel-trabajo.html` |
| PR boceto | https://github.com/Facu42/plan-v/pull/174 (último commit relevante `2b8c7f7`) |
| Original v29 (NO tocar) | `design/panel-nutri/v29/PlanV-Boceto-v29.html` |
| Continuación Cursor | `docs/panel-nutri-rediseno/continuar-v29-cursor.md` (en la rama del PR) |

## Qué ya está hecho

- Boceto v29 base + seis pantallas (Asistente IA, Seguimiento, Progreso con drill-down, Alimentos, Biblioteca, Centro de ayuda) en `panel-trabajo.html`.
- Pantallas diferenciadas por función (no clones); en Progreso tocar paciente abre evolución.
- Tests del boceto en verde (`design/panel-nutri/v3/tests/`, incl. `seist.mjs` con modo Celular real).
- App real (`main`) ya tiene rutas/APIs para casi todo; el gap principal es **piel/UI del boceto** sobre backends vivos (ver tabla en la Page).
- Plan de arranque escrito: Fase 0 → 1 Shell → 2 Seguimiento → 3 Progreso (+ luego Asistente, Alimentos, Biblioteca, Ayuda, núcleo consultorio).

## Qué NO hacer

- No mergear el HTML del boceto a `main` como frontend.
- No tocar `PlanV-Boceto-v29.html` (original).
- No WhatsApp en UI ni flujos.
- No Cloud Agent salvo pedido explícito de Facu; código por Cursor/Codex vía Herdr.
- No migraciones a prod sin frase escrita de Facu.
- No inventar APIs/tablas: si no está en el repo, marcar «a confirmar».

## Decisiones pendientes de Facu (bloquean o desbloquean)

1. **Ok escrito** al boceto entero (v29 + PR #174) y link publicado (Claude publica `panel-trabajo.html`).
2. **Fuente de estilos/contrato:** `v29/panel-trabajo.html` (decisión de boceto vigente) vs build `v3/` (lo que dice hoy `version-final.md`).
3. **Orden:** arranque por valor (este plan: shell → Seguimiento → Progreso) vs fases 1→13 de `version-final.md`.
4. Progreso: ¿evolución inline en `/crm/progreso-global` o reusa pestañas de ficha?
5. Centro de ayuda: ¿canal real de «pedir ayuda a Plan V»?
6. Paquetes A/B/C + PR #145: cuándo dar frase de migraciones/base.

## Próximo paso (cuando Facu desbloquee 1–3)

1. Actualizar una línea en `version-final.md` + este handoff con la fuente elegida.
2. Tools: `panel-boceto-css` + `panel:contrato` → fuente elegida (**archivos nuevos**; no pisar `panel-boceto.css` antes del marcado).
3. Shell v29 en React (`PanelBocetoShell` + nav + tema/celular); pantallas viejas siguen adentro; contrato armazón verde.
4. Seguimiento: UI boceto sobre `/api/crm/work-queue` + `MealReviewPanel`.
5. Progreso: cartera + drill-down evolución (mapear endpoints de mediciones; Laura sin curva ≠ incumplimiento).

## Bitácora

| Cuándo | Qué | Quién |
|---|---|---|
| 24–25 oct | Seis pantallas + diferenciación + evolución Progreso en PR #174 | Cursor agent `bc-cf297a92…` |
| 24 oct | Page del plan boceto→app | Plan V |
| 24 oct | Este handoff creado para continuidad entre agentes | Plan V |

## Cómo retomar (otro agente)

1. Leer esta nota + la Page del plan.
2. Chequear PR #174 y si Facu ya dejó ok / decisiones arriba.
3. Si Fase 0 cerrada: arrancar ticket de tools/shell en rama `cursor/*` vía Herdr; PRs chicos; Facu mergea.
4. Actualizar esta bitácora al cerrar cada fase (1 párrafo + commit/PR).
