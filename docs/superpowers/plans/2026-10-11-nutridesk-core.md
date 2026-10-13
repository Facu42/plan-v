# Plan V: correos, cartera y procesamiento clínico

Objetivo: implementar el plan aprobado sin alterar main ni producción. Stack: React, Hono, Supabase/Postgres y Vitest. Spec: pedido de implementación del 11/10/2026 y docs/nutridesk-implementacion-2026-10-11.md.

## Entregas y contratos
- [x] Correos: destinos y fallos probados en contratos; `requestAccountRecovery(email, redirectTo, send, log)` mantiene respuesta genérica y registra sólo estados enumerados. Acceso siempre Supabase Auth. Configurador Gmail/Brevo preparado, comprobación por defecto y secretos fuera del repo; transportes operativos separados y desactivados. El usuario pospuso SMTP porque Gmail pertenece a su cliente: por ahora builtin Supabase sólo para miembros del equipo (dos mensajes por hora), no para pacientes externos. Remitente central propio y entrega real pendientes.
- [x] Carteras: `collectPatientPages(loadPage)` recorre todos los lotes; `loadCarteraUnread(list)` sigue cursor y deduplica por id. Casos de mil pacientes, página vacía inconsistente y cursores repetidos cubiertos.
- [x] Copiloto: prompt multi-consultorio probado, instrucciones neutrales sin identidad fija.
- [x] Procesamiento implementado: duración WAV validada, ledger global con reserva atómica, identificador por operación, gasto incierto retenido incluso ante claves nuevas, USD 5 por mes argentino. OpenRouter gratuito conservado. La activación de Groq exige comprobar retención cero y cuenta gratuita; aún pendientes.
- [x] Integración local y revisión independiente de contratos, pruebas, tipos, migraciones, build y secretos. [Informe definitivo y Regression Guard](../../nutridesk-integracion-2026-10-13.md).
- [ ] PRs por apartado con dependencias explícitas; autorización y habilitación externa por etapas según [lista obligatoria](../../deployment/nutridesk-habilitacion-2026-10-13.md).

## Flujos críticos
Registro/login/recuperación, invitación/vinculación, cartera/no leídos, planes publicados, fotos privadas, consentimiento y aislamiento. Hay pruebas en identity, auth, care, assets, plans y contracts. SMTP real y proveedores nuevos requieren cuentas/configuración externa: no contarlos como verificados mediante mocks.
