# Ingreso persistente y revisión profesional

**Objetivo:** paciente → ingreso guardado → revisión privada en CRM, sobre PostgreSQL/Supabase con permisos verificables.

**Arquitectura:** migraciones nuevas para núcleo e ingreso; RPC transaccionales con JWT del actor; repositorio de intake separado. Demo explícita en memoria. Autoguardado serializado y revisión dentro de la ficha existente.

**Spec:** `docs/superpowers/specs/2026-09-16-plan-v-arquitectura-design.md` y `docs/superpowers/specs/2026-09-16-plan-v-onboarding-ia-design.md`. Tickets PV-08/12/13/14. Ejecución local autorizada; no aplicar SQL a proyectos con pacientes.

## Restricciones

Paciente escribe su declaración/consentimiento; profesional revisa y agrega notas separadas. Ingreso independiente de cobranza. Sin notas privadas en respuesta paciente. Control de revisión con 409 y envío idempotente. Archivos se implementan en PV-15/16: no simular adjuntos. Preservar los borradores históricos y ejecutar nuevas migraciones en base descartable.

## Pasos y verificación

- [x] Corregir `showroom-onboarding.test.ts`: verificar las nueve etapas, `resumeOnboardingStep('draft','allergies') === 'allergies'` y recibo para `submitted`; ejecutar esa suite.
- [x] Crear migraciones núcleo/intake bajo `supabase/migrations/` y fixture local de `auth`/`storage`. Probar dos profesionales/dos pacientes con rol `authenticated`, lecturas/escrituras cruzadas, no promoción de rol, retiro de consentimiento, revisión obsoleta y persistencia tras reconexión. Dos conexiones concurrentes y Auth/Storage reales requieren la instancia descartable.
- [x] Crear `server/intake/repository.ts`: `readIntakeBundle`, `saveIntake`, `sendIntake`, `markIntakeReviewed`, `recordConsent`, `writeClinicalNote`. Usar `getRequestDb()` y RPC con transacción. Conectar rutas de `server/index.ts`, validar permisos antes de acceder y preservar errores 409/501/503. Verificar por tests de API.
- [x] Crear `src/components/nutrigo/intake-save-queue.ts`. Serializar autoguardado/avanzar, detener cola ante conflicto, no escribir antes de recuperar el ingreso. Persistir grant/retiro y cancelar requests de la ficha anterior. Probar latencia y conflictos.
- [x] Crear `ShowroomIntakeReview.tsx`: resumen autodeclarado, faltantes, alergias, consentimiento, fechas, revisión y notas privadas. Montar en `ShowroomPatientRecord.tsx`. Verificar estados/render y recorrido en navegador.
- [x] Ejecutar suite completa, TypeScript, build, guarda SQL y pruebas de base. Revisar móvil/escritorio con `/browse`; actualizar dashboard con evidencia y límites de lo realmente verificado.

## Continuación de 532ff27

- [x] Actualizar revisión dentro de la cola y descartar tareas de generaciones anteriores.
- [x] Reintentar un envío con respuesta perdida usando la misma revisión, sin PATCH posterior al envío.
- [x] Cancelar debounce al navegar/enviar y bloquear doble clic y edición durante transiciones.
- [x] Recuperación explícita ante carga fallida y conflicto; no escribir antes de recuperar el servidor.
- [x] Reintento en CRM, fecha de revisión y pruebas de privacidad HTTP/RPC.
- [x] Suite actual: 494 aprobadas / 2 omitidas; navegador con fallos simulados y datos sintéticos.
- [ ] Ejecutar circuito con Supabase descartable y JWT reales. No acreditado por los checks locales.
