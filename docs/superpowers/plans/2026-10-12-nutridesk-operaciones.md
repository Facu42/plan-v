# Operaciones del consultorio Implementation Plan

**Goal:** Completar asistente de cartera, ayuda, reportes y comunicaciones con fuentes y permisos.

**Architecture:** Servicios separados de extracción de indicadores y generación de propuestas. Preguntas se interpretan localmente; únicamente indicadores permitidos llegan al proveedor existente. Ninguna respuesta ejecuta acciones. Comunicaciones requieren preferencias y consentimiento y una cola persistente con resultado individual.

**Tech Stack:** Hono, React, Zod, Supabase y proveedor OpenRouter gratuito existente.

**Spec:** Plan aprobado por Facundo en el chat, entregas 5 y contratos.

## Global Constraints

- No publicar ni aplicar migraciones en producción.
- Sin nombres, notas clínicas ni mensajes en contexto externo del copiloto.
- Carteras completas paginadas; consentimiento `ai_followup` vigente antes y después de generación.
- Propuestas y fuentes revisables; ninguna acción automática del asistente.
- WhatsApp exclusivamente API oficial y activación explícita con costo independiente.

### Task 1: Asistente e indicadores

- [ ] RED: `server/portfolio/summary.test.ts`: 1.000 pacientes, días inclusivos, pacientes sin registros, no nombres/correos/contexto libre, fuentes permitidas.
- [ ] GREEN: `server/portfolio/summary.ts`: indicadores verificables; clasificador local; export CSV seguro contra fórmulas.
- [ ] `server/portfolio/routes.ts`: cartera propia paginada, consentimiento por paciente; validación estricta del resultado y revalidación antes de devolver.
- [ ] `src/components/nutrigo/PortfolioAssistant.tsx`: chat, preguntas sugeridas, fuentes navegables, estados de error/carga; sin herramientas ni envío automático.
- [ ] `HelpCenter.tsx`: guías de cada función con pasos y recuperación de errores.

### Task 2: Comunicaciones

- [ ] RED: contactos sin consentimiento, baja, dos consultorios y envío incierto no repetido.
- [ ] GREEN: preferencias verificadas y cola CAS con expiración/token; reserva/deduplicación persistente; envío oficial Meta sólo con integración activada.
- [ ] Registrar webhooks firmados y baja; interfaz de revisión de lote con resultados individuales.

### Verification

- [ ] Tipos, pruebas relevantes, suite completa, compilación, secretos y migraciones.
- [ ] Fire test, navegador 1440/390 y revisión independiente.
- [ ] Informe de regresiones y límites de activación externa.
