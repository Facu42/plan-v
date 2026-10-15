# 06 · Plan de implementación — Plan V

> Fuentes: estado 10/10 (`/workspace/plan-v-estado-2026-10-10.md`), asesoría 9/10 (`/workspace/plan-v-asesoria/00-resumen.md`), fases §12 del plan v2. Cada paso = **un PR chico** a una rama (nunca directo a `main`), con CI verde e informe `regression-guard`. Toda migración en prod requiere la frase escrita de Facu.

## Ya hecho (no rehacer)
Base Supabase (core, intake, care, planes, diario, mensajes, turnos, IA, privacidad), cobros manuales, metas nutricionales con consentimiento IA, modelos profesionales, catálogo de alimentos, recetas con composición, editor semanal en vivo, impresión, frente de paciente Nutrigo, Planificación (IMC), seguridad de vistas parcial, campana de avisos, decisiones D1–D7, diario de texto sin IA (#101).

## Etapa 0 — Seguridad y orden (antes de sumar funciones)
1. Migración: `revoke all` + `grant select` en `appointments_patient_view`, `intake_patient_view`, `messages_patient_view`, `meal_logs_patient_view`; test RLS por vista. **(necesita aprobación)**
2. IA con privacidad: `data_collection: "deny"` en las llamadas a OpenRouter, lista fija de modelos, sin PII en prompts, actualizar `privacidad.html`.
3. Verificar en prod qué migraciones del repo faltan aplicar (`list_migrations`) y armar el lote con aprobación.
4. Triage de PRs: revisar/mergear de a uno #89 (mediciones), #90 (calorías al instante), #91 (avisos nutri), #92 (cobros), #93 (progreso global); decidir #27 (índices) y #67 (animaciones); cerrar #2, #4, #17, #25, #60–#65 si Facu confirma.

## Etapa 1 — Operación mínima del piloto (H5)
5. Respaldo diario de Storage + simulacro de restauración.
6. Monitoreo externo de `/api/health` con aviso; Sentry con datos redactados.
7. Staging de base + 5 recorridos E2E de dos roles (invitar → ingreso → plan → diario → revisión).
8. Acta go/no-go del piloto con Vero.

## Etapa 2 — Fase 1 Nutriboost: núcleo clínico
9. Planificación: metabolismo basal, nivel de actividad, fórmulas alternativas, objetivo de peso.
10. Configuración del consultorio (logo y datos) → PDF del plan con marca.
11. Recetas, Progreso y Ejercicio al menú lateral (§15).
12. Carga de bases de alimentos (según licencia decidida).

## Etapa 3 — Pendientes de decisiones D1–D7
13. D1 objetivo con estado/avance en app de paciente · D3 correo de avisos (+ recurso asignado y plan nuevo en campana) · D4 corregir/borrar propio no revisado · D7 vigencia del plan por fecha — verificar cuáles ya están en `main` y solo falta aplicar.

## Etapa 4 en adelante — según orden que elija Facu
- **Fase 2 Mediciones**: métricas completas, importación de balanza, estudios desde la app.
- **Fase 3 IA y seguimiento**: ánimo/síntomas → motor de señales → Inicio con indicadores → **Asistente IA** (resumen de cada mañana + chat + acciones con confirmación) → insights → adherencia.
- **Fase 4 Negocio**: Mercado Pago → página pública con paquetes → agenda con reserva → recordatorios → Meta Pixel → límites por plan.
- **Fase 5 Productividad**: menú de 17 ítems, Equivalencias, recomendaciones, entregables, buscador, alternativas por comida, pausar acceso.
- **Fase 6 Terminación**: chat en tiempo real con denunciar/bloquear, push sin contenido clínico, Android (Capacitor), compras configurables, rachas, Centro de ayuda, multi-nutricionista.

## Externo (no código)
Entidad legal (SAS), AAIP, contrato de encargo, D-U-N-S; dominio y correo propios, INPI; cuenta demo e importador CSV; programa "Fundadoras".

## Cómo trabajar cada paso (para agentes)
1. Leer `AGENTS.md`, `docs/traspaso-estado-proyecto.md`, `docs/agentes/reglas-plan-v.md` y estos 6 docs.
2. Tests primero (vitest; RLS con `test:disposable`).
3. `npm run check && npm test && npm run check:migrations && npm run check:views`.
4. PR con descripción en español simple y captura con datos ficticios.

## Decisiones abiertas para Facu
1. **Orden de fases**: 1→3→4→2→5→6 (vender rápido el diferencial IA) o 1→2→3→4 (clínico primero).
2. ¿Etapa 0 y 1 bloquean todo lo demás o corren en paralelo con la fase 1?
3. ¿Qué PRs viejos se cierran?
4. ¿Quién ejecuta qué? (el plan v2 propone Cursor para interfaz y Codex para datos/migraciones vía Herdr).
