# Plan V: correos, cartera y procesamiento clínico

Objetivo: implementar el plan aprobado sin alterar main ni producción. Stack: React, Hono, Supabase/Postgres y Vitest. Spec: pedido de implementación del 11/10/2026 y docs/nutridesk-implementacion-2026-10-11.md.

## Entregas y contratos
- [ ] Correos: probar destinos y fallos; `requestAccountRecovery(email, redirectTo, send, log)` mantiene reconocimiento genérico y registra sólo estados enumerados. Invitaciones de acceso siempre salen de Supabase Auth; recordatorios conservan Brevo. Configurador SMTP con comprobación por defecto y secretos fuera del repo.
- [ ] Carteras: `collectPatientPages(loadPage)` recorre todos los lotes; `loadCarteraUnread(list)` sigue cursor y deduplica por id. Probar mil pacientes, página vacía inconsistente y cursores repetidos antes de implementar.
- [ ] Copiloto: prueba de prompt para servicio multi-consultorio; instrucciones neutrales, sin identidades fijas.
- [ ] Procesamiento: proveedor Groq autorizado, duración WAV validada, retención cero confirmada y ledger global con reserva atómica, identificador por operación, gasto incierto retenido y máximo USD 5 por mes argentino. Mantener OpenRouter gratuito existente.
- [ ] Integrar las entregas de ficha, consultas e importación en ramas apiladas; revisar contratos, pruebas focalizadas, suite completa, tipos, migraciones, build y secretos. Registrar informe del guard.

## Flujos críticos
Registro/login/recuperación, invitación/vinculación, cartera/no leídos, planes publicados, fotos privadas, consentimiento y aislamiento. Hay pruebas en identity, auth, care, assets, plans y contracts. SMTP real y proveedores nuevos requieren cuentas/configuración externa: no contarlos como verificados mediante mocks.
