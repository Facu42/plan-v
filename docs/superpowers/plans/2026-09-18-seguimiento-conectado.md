# Seguimiento del paciente y consultorio

**Objetivo:** completar el pedido de seguimiento, interfaz de escritorio, avisos, compras y alternativas revisadas por la nutricionista.
**Arquitectura:** React y API Hono existentes; módulo de seguimiento compartido, registros con identificador idempotente, repositorio demo explícito y persistencia Supabase con RLS. No almacenar información clínica en localStorage. Las fotos corporales nunca se envían a IA ni se muestran en notificaciones. Los pagos son asientos manuales, no cobros.
**Tecnología:** TypeScript, Zod, React, Hono, Supabase/PostgreSQL, Vitest/PGlite.
**Base autorizada:** pedido del usuario del 18/09; especificaciones de arquitectura/onboarding de 16/09 y consentimiento ya implementado. Desarrollo en línea, preservando los cambios existentes.

- [x] Adaptar `NutrigoShowroom` y `app-shell.css`: navegación lateral para ambos roles desde escritorio, barra inferior sólo móvil; ficha con identidad fija y resumen inmediato.
- [x] Incorporar contrato y API de seguimiento: peso semanal, cintura mensual, actividad con gasto declarado, fotos privadas y preferencias de avisos. Validación, consentimiento, aislamiento, reintentos idempotentes y errores explícitos.
- [x] Incorporar migración incremental, políticas RLS y pruebas de aislamiento, consentimiento y privacidad.
- [x] Conectar progreso/ejercicio con seguimiento y ficha/avisos con nuevas cargas. Los avisos se calculan desde los registros, sin diagnosticar ni inferir cambios necesarios de menú a partir del peso.
- [x] Incorporar registro manual de pagos y solicitudes de revisión del menú. La nutricionista genera, revisa y publica alternativas; el paciente sólo recibe la versión publicada.
- [x] Conectar el plan con la lista automática de compras y explicar límites cuando el menú sólo guarda títulos.
- [x] Verificar check, pruebas relevantes, build, navegador en móvil/escritorio, y actualizar dashboard con evidencia y límites reales del entorno.

## Decisiones

Se amplía el sistema existente, evitando un segundo historial sólo en el navegador. Peso/medidas/fotos son optativos y requieren el permiso vigente del paciente. Las calorías de actividad son un dato opcional declarado por el usuario (por ejemplo de su reloj); no se inventa una estimación. Agua y descanso usan avisos mientras la app está abierta: no se presenta como push en segundo plano. Los reemplazos con IA respetan alergias/restricciones declaradas y requieren publicación profesional; no cambian silenciosamente el menú.

## Verificación exigida

Probar que paciente A no accede a B, paciente no crea pagos ni revisa registros, fotos requieren consentimiento, borrar/retirar acceso no expone URLs públicas, un reintento no duplica registros, las propuestas privadas no aparecen en respuestas del paciente, y el cambio de paciente no conserva datos del anterior. Probar notificaciones y medidas semanales/mensuales con fechas controladas. Verificar escritorio sin barra inferior y móvil sin desbordamiento.

## Verificación 2026-09-18

- `npm test`: 509 aprobadas, 2 omitidas (Supabase live).
- `npm run check`, `npm run build`, `npm run check:migrations` y `npm run dashboard:test` aprobados.
- API demo en `3001`: `GET /api/patients/pat-sofia/care` → 200 (`source: memory`); `GET /api/care/alerts` lista comidas pendientes; Vite en `5173` responde 200.
- Recorrido click-by-click en el navegador de Cursor no se pudo ejecutar (herramienta bloqueada). La UI de escritorio/móvil queda cubierta por CSS (`app-shell.css` ≥1024 px) y markup estático de las pantallas, no por un pase visual en este corte.


- La migración `20260918010000_care.sql` es para esquema vacío/descartable. No aplicarla a un proyecto con pacientes.
- Fotos de comida y corporales: Storage privado + URL firmada de 60 s. Falta el circuito completo de reserva/cuarentena/EXIF (PV-15) y estudios PDF (PV-16).
- Compras: títulos del plan + ingredientes de alternativas ya publicadas. Sin cantidades, unidades ni checklist sincronizado entre dispositivos (PV-21).
- Avisos de agua/descanso/peso: campana mientras la app está abierta. No hay push ni email real (PV-26).
- Alternativas de menú: borrador demo/IA con revisión profesional. No hay catálogo de recetas ni plan versionado (PV-18/19/27).
