# Handoff: boceto panel nutri → app funcional

**Fecha:** 24–25 oct 2026 (America/Buenos_Aires)  
**Dueño del hilo:** Plan V (asistente) + Facu  
**Estado:** Fase 0 tools ya está en main ([PR #176](https://github.com/Facu42/plan-v/pull/176)). Fase 1 (armazón) está en [PR #177](https://github.com/Facu42/plan-v/pull/177), sin juntar. Siguiente: Seguimiento. Facu eligió **ok-v29-valor** (25 oct 2026). Orden: tools → shell → Seguimiento → Progreso.

## Decisiones cerradas (Facu, 25 oct 2026)

1. **Ok escrito** al boceto (v29 + PR #174 / `panel-trabajo.html`).
2. **Fuente de estilos/contrato:** `design/panel-nutri/v29/panel-trabajo.html` (no el build `v3/` hasta nuevo aviso).
3. **Orden:** por valor — shell → Seguimiento → Progreso (no fases 1→13 de `version-final.md` como arranque).
4. **La interfaz no sale del boceto.** Si un botón o una sección todavía no está hecha, se muestra vacío o «Próximamente». No se inventa otra pantalla.

Pendientes (no bloquean Fase 0–1): Progreso drill-down inline vs ficha; canal Centro de ayuda; paquetes A/B/C + PR #145 (frase migraciones).

## Fuentes canónicas

| Qué | Dónde |
|---|---|
| Plan iterable (Page) | https://cursor.com/canvas/store-0f75b483-c592-490c-9d4f-f54cf2aee507/6a995189-0641-4c51-ba7e-6ad9946145ab |
| Plan canónico por fases | `docs/panel-nutri-rediseno/version-final.md` (fuente = v29/panel-trabajo.html) |
| Boceto de trabajo | `design/panel-nutri/v29/panel-trabajo.html` (PR #174, ya en main) |
| Fase 0 tools | https://github.com/Facu42/plan-v/pull/176 (ya en main) |
| Fase 1 shell | https://github.com/Facu42/plan-v/pull/177 |
| Original v29 (NO tocar) | `design/panel-nutri/v29/PlanV-Boceto-v29.html` |
| Este handoff | PR https://github.com/Facu42/plan-v/pull/175 (ya en main) |

## Qué ya está hecho

- Boceto v29 + seis pantallas en `panel-trabajo.html` (PR #174, ya en main).
- Pantallas diferenciadas; Progreso con drill-down.
- App real (`main`) con rutas/APIs; gap = piel UI del boceto.
- Plan + handoff registrados; **ok Facu ok-v29-valor**.
- Fase 0 tools (PR #176, ya en main): `npm run panel:v29` y `npm run panel:contrato:v29` leen `panel-trabajo.html` y escriben `panel-v29.css` / `panel-v29-icons.ts`. No pisan `panel-boceto.css`.
- Fase 1 shell ([PR #177](https://github.com/Facu42/plan-v/pull/177)): el armazón de la nutri usa las clases del boceto (`.app`, `.side`, `.nv`) y la hoja `panel-v29.css`. La raíz es `#pv-panel-v29`. Las pantallas que todavía no se pasaron siguen adentro, con `panel-boceto.css`. El contrato del armazón quedó en verde, en claro y en oscuro.

## Qué NO hacer

- No mergear el HTML del boceto a `main` como frontend.
- No tocar `PlanV-Boceto-v29.html`.
- No WhatsApp.
- No Cloud Agent salvo pedido explícito; código por Cursor/Codex vía Herdr.
- No migraciones a prod sin frase escrita de Facu.
- No inventar APIs/tablas.
- No pisar `panel-boceto.css` antes del marcado nuevo (archivos nuevos para tools).
- No inventar una interfaz que el boceto no dibuja.

## Próximo paso (en curso)

1. ~~Actualizar una línea en `version-final.md`: fuente = `v29/panel-trabajo.html`.~~ Hecho en el PR #176.
2. ~~**Fase 0 tools:** archivos nuevos desde la fuente v29; la app se ve igual.~~ Hecho en el PR #176, ya en main.
3. ~~**Fase 1 shell:** `PanelBocetoShell` + nav + tema/celular; contrato del armazón contra la app. Se importa `panel-v29.css`. La raíz es `#pv-panel-v29` (tema, `.mob` y `.mreal`).~~ En el [PR #177](https://github.com/Facu42/plan-v/pull/177). Falta el ok de Facu para juntarlo.
4. **Fase 2 Seguimiento:** UI boceto sobre `/api/crm/work-queue` + `MealReviewPanel`.
5. **Fase 3 Progreso:** cartera + drill-down (mapear endpoints; Laura sin curva ≠ incumplimiento).

## Bitácora

| Cuándo | Qué | Quién |
|---|---|---|
| 25 oct | El recorrido de sesiones firmadas no encontraba «Cerrar sesión»: está en el menú de la cuenta. El recorrido ahora abre ese menú. Misma rama del [PR #177](https://github.com/Facu42/plan-v/pull/177). | Cursor |
| 25 oct | Fase 1 shell en [PR #177](https://github.com/Facu42/plan-v/pull/177): el armazón (menú, marca, buscador, cuenta, título, campana y el botón de Inicio) usa el boceto v29. Lo que el boceto dibuja y la app todavía no tiene queda vacío. Las pantallas de adentro no se redibujaron. Contrato en verde, claro y oscuro. | Cursor |
| 25 oct | Fase 0 tools en PR #176 (ya en main): css e íconos nuevos desde `panel-trabajo.html`. La letra y el celular quedan en la raíz nueva. | Cursor |
| 25 oct | Facu: ok-v29-valor; arranque Fase 0 tools vía Herdr Cursor | Plan V + Facu |
| 24–25 oct | Seis pantallas + diferenciación + evolución Progreso en PR #174 (ya en main) | Cursor agent `bc-cf297a92…` |
| 24 oct | Page del plan boceto→app | Plan V |
| 24 oct | Handoff creado (PR #175, ya en main) | Plan V |

## Cómo retomar (otro agente)

1. Leer esta nota + la Page del plan.
2. Chequear bitácora: ok-v29-valor ya cerrado. Fase 0 está en main. Fase 1 (armazón) está en el [PR #177](https://github.com/Facu42/plan-v/pull/177).
3. Si Facu juntó el #177: seguir con Seguimiento. Si no: no redibujar Seguimiento ni Progreso encima de un armazón que todavía no está en main.
4. Actualizar esta bitácora al cerrar cada fase (1 párrafo + commit/PR). Facu mergea.
