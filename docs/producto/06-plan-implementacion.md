# 06 · Plan de implementación — Plan V

> Fuentes: estado 10/10 (`/workspace/plan-v-estado-2026-10-10.md`), asesoría 9/10 (`/workspace/plan-v-asesoria/00-resumen.md`), fases §12 del plan v2. Cada paso = **un PR chico** a una rama (nunca directo a `main`), con CI verde e informe `regression-guard`. Toda migración en prod requiere la frase escrita de Facu.

> **Corregido el 14/10/2026 (Claude):** estados comprobados contra `main` (ae3dc30), los PR abiertos, las ramas de Codex y las migraciones aplicadas en Supabase. 🔶 = hecho por Codex en código, **sin juntar a main ni aplicar** (PR o rama indicada): no rehacer. Reparto de trabajo entre agentes: [`../coordinacion-agentes.md`](../coordinacion-agentes.md).

## Ya hecho (no rehacer)
Base Supabase (core, intake, care, planes, diario, mensajes, turnos, IA, privacidad), cobros manuales, metas nutricionales con consentimiento IA, modelos profesionales, catálogo de alimentos, recetas con composición, editor semanal en vivo, impresión, frente de paciente Nutrigo, Planificación (IMC), seguridad de vistas parcial, campana de avisos, decisiones D1–D7 (#98, #100, #103 y avisos), mediciones (#89), calorías al instante (#90), avisos de la nutri (#91), cobros con programas (#92), progreso global (#93), diario de texto sin IA (#101). Todas sus migraciones están aplicadas (comprobado 14/10).

## Hecho por Codex, sin juntar (no rehacer)
Pila de PR en borrador, en este orden: **#105** acceso, cartera completa, teléfono → **#106** consultas grabadas → **#107** importación con OCR → **#108** fórmulas, equivalencias, micronutrientes y PDF con marca. El resto (agenda pública con reserva, varias agendas, Google, Mercado Pago, equipo y recepción, laboratorio, bariátrico, difusiones por WhatsApp, asistente de cartera, ayuda) está en la rama `respaldo/codex-nutridesk-core`, sin PR. 17 migraciones sin aplicar. Detalle: `docs/nutridesk-integracion-2026-10-13.md` en esa rama.

## Etapa 0 — Seguridad y orden (antes de sumar funciones)
1. Migración: `revoke all` + `grant select` en `appointments_patient_view`, `intake_patient_view`, `messages_patient_view`, `meal_logs_patient_view`; test RLS por vista. **(necesita aprobación)** — Claude, PR propio.
2. IA con privacidad: `data_collection: "deny"` en las llamadas a OpenRouter, lista fija de modelos, sin PII en prompts, actualizar `privacidad.html`.
3. ~~Verificar en prod qué migraciones del repo faltan aplicar~~ Hecho 14/10: todas las de `main` están aplicadas.
4. Triage de PRs: #89–#93 ya están en `main`; #67 se cerró. Quedan: juntar la pila de Codex #105→#108 en orden (después de comparar #105 con Figma y de la prueba con Verónica); decidir #27 (índices); cerrar #2, #3, #4, #17, #25, #60–#65 (ramas viejas de Cursor y Codex, reemplazadas por la pila nueva) si Facu confirma.

## Etapa 1 — Operación mínima del piloto (H5)
5. Respaldo diario de Storage + simulacro de restauración.
6. Monitoreo externo de `/api/health` con aviso; Sentry con datos redactados.
7. Staging de base + 5 recorridos E2E de dos roles (invitar → ingreso → plan → diario → revisión).
8. Acta go/no-go del piloto con Vero.

## Etapa 2 — Fase 1 Nutriboost: núcleo clínico
9. Planificación: metabolismo basal, nivel de actividad, fórmulas alternativas, objetivo de peso. 🔶 fórmulas en #108.
10. Configuración del consultorio (logo y datos) → PDF del plan con marca. 🔶 #108.
11. Recetas, Progreso y Ejercicio al menú lateral (§15).
12. Carga de bases de alimentos (según licencia decidida). 🔶 USDA opcional en #108.

## Etapa 3 — Pendientes de decisiones D1–D7
13. D1, D4 y D7 ✅ en producción. Queda D3 (correo de avisos), en espera por la decisión del 11/10; recurso asignado y plan nuevo en la campana: Claude.

## Etapa 4 en adelante — según orden que elija Facu
- **Fase 2 Mediciones**: métricas completas ✅, segmental/bariátrico/laboratorio 🔶, importación de balanza ❌, estudios desde la app.
- **Fase 3 IA y seguimiento**: ánimo/síntomas → motor de señales → Inicio con indicadores → **Asistente IA** (resumen de cada mañana + chat + acciones con confirmación) → insights → adherencia.
- **Fase 4 Negocio**: Mercado Pago 🔶 → página pública con paquetes → agenda con reserva 🔶 → recordatorios 🔶 → Meta Pixel → límites por plan.
- **Fase 5 Productividad**: menú de 17 ítems, Equivalencias 🔶 #108, recomendaciones, entregables, buscador, alternativas por comida (después de #108), pausar acceso.
- **Fase 6 Terminación**: chat en tiempo real con denunciar/bloquear, push sin contenido clínico, Android, compras configurables, rachas, Centro de ayuda 🔶, multi-nutricionista 🔶 (equipo y recepción).

## Externo (no código)
Entidad legal (SAS), AAIP, contrato de encargo, D-U-N-S; dominio y correo propios, INPI; cuenta demo e importador CSV; programa "Fundadoras".

## Cómo trabajar cada paso (para agentes)
1. Leer `AGENTS.md`, `docs/coordinacion-agentes.md` (quién tiene qué), `docs/traspaso-estado-proyecto.md`, `docs/agentes/reglas-plan-v.md` y estos documentos.
2. Tests primero (vitest; RLS con `test:disposable`).
3. `npm run check && npm test && npm run check:migrations && npm run check:views`.
4. PR con descripción en español simple y captura con datos ficticios.

## Decisiones abiertas para Facu
1. **Orden de fases**: 1→3→4→2→5→6 (vender rápido el diferencial IA) o 1→2→3→4 (clínico primero).
2. ¿Etapa 0 y 1 bloquean todo lo demás o corren en paralelo con la fase 1?
3. ¿Qué PRs viejos se cierran?
4. ~~¿Quién ejecuta qué?~~ Resuelto 14/10 en `docs/coordinacion-agentes.md` (carriles de Claude y Codex).
