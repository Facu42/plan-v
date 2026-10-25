# Handoff: boceto panel nutri → app funcional

**Fecha:** 24–25 oct 2026 (America/Buenos_Aires)  
**Dueño del hilo:** Plan V (asistente) + Facu  
**Estado:** Fase 0 desbloqueada — Facu eligió **ok-v29-valor** (25 oct 2026). Arranca tools → shell → Seguimiento → Progreso. Código vía Herdr Cursor; Facu mergea.

## Decisiones cerradas (Facu, 25 oct 2026)

1. **Ok escrito** al boceto (v29 + PR #174 / `panel-trabajo.html`).
2. **Fuente de estilos/contrato:** `design/panel-nutri/v29/panel-trabajo.html` (no el build `v3/` hasta nuevo aviso).
3. **Orden:** por valor — shell → Seguimiento → Progreso (no fases 1→13 de `version-final.md` como arranque).

Pendientes (no bloquean Fase 0–1): Progreso drill-down inline vs ficha; canal Centro de ayuda; paquetes A/B/C + PR #145 (frase migraciones).

## Fuentes canónicas

| Qué | Dónde |
|---|---|
| Plan iterable (Page) | https://cursor.com/canvas/store-0f75b483-c592-490c-9d4f-f54cf2aee507/6a995189-0641-4c51-ba7e-6ad9946145ab |
| Plan canónico por fases | `docs/panel-nutri-rediseno/version-final.md` (actualizar una línea: fuente = v29/panel-trabajo.html) |
| Boceto de trabajo | rama `cursor/boceto-seis-pantallas-66c3`, `design/panel-nutri/v29/panel-trabajo.html` |
| PR boceto | https://github.com/Facu42/plan-v/pull/174 |
| Original v29 (NO tocar) | `design/panel-nutri/v29/PlanV-Boceto-v29.html` |
| Este handoff | PR https://github.com/Facu42/plan-v/pull/175 |

## Qué ya está hecho

- Boceto v29 + seis pantallas en `panel-trabajo.html` (PR #174).
- Pantallas diferenciadas; Progreso con drill-down.
- App real (`main`) con rutas/APIs; gap = piel UI del boceto.
- Plan + handoff registrados; **ok Facu ok-v29-valor**.

## Qué NO hacer

- No mergear el HTML del boceto a `main` como frontend.
- No tocar `PlanV-Boceto-v29.html`.
- No WhatsApp.
- No Cloud Agent salvo pedido explícito; código por Cursor/Codex vía Herdr.
- No migraciones a prod sin frase escrita de Facu.
- No inventar APIs/tablas.
- No pisar `panel-boceto.css` antes del marcado nuevo (archivos nuevos para tools).

## Próximo paso (en curso)

1. Actualizar una línea en `version-final.md`: fuente = `v29/panel-trabajo.html`.
2. **Fase 0 tools:** `panel-boceto-css` + `panel:contrato` → fuente v29 (**archivos nuevos**); app se ve igual.
3. **Fase 1 shell:** `PanelBocetoShell` + nav + tema/celular; contrato armazón verde.
4. **Fase 2 Seguimiento:** UI boceto sobre `/api/crm/work-queue` + `MealReviewPanel`.
5. **Fase 3 Progreso:** cartera + drill-down (mapear endpoints; Laura sin curva ≠ incumplimiento).

## Bitácora

| Cuándo | Qué | Quién |
|---|---|---|
| 24–25 oct | Seis pantallas + diferenciación + evolución Progreso en PR #174 | Cursor agent `bc-cf297a92…` |
| 24 oct | Page del plan boceto→app | Plan V |
| 24 oct | Handoff creado (PR #175) | Plan V |
| 25 oct | Facu: ok-v29-valor; arranque Fase 0 tools vía Herdr Cursor | Plan V + Facu |

## Cómo retomar (otro agente)

1. Leer esta nota + la Page del plan.
2. Chequear bitácora: ok-v29-valor ya cerrado.
3. Si tools PR abierto: revisar/continuar; si no: Fase 0 tools en rama `cursor/*` vía Herdr.
4. Actualizar esta bitácora al cerrar cada fase (1 párrafo + commit/PR). Facu mergea.
