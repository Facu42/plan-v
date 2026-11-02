# Cobro de Nutridash a la nutricionista

Nutridash le cobra a la nutricionista con la cuenta de Mercado Pago de Facundo. No es el cobro de la nutricionista a la paciente (ese sigue en `server/subscriptions/` y no se tocó).

La tabla vieja `organization_subscriptions` sigue siendo el permiso de atención en equipo. No se escribe desde este cobro. La fuente de verdad del precio y del estado de Mercado Pago es `platform_subscriptions`. No se usó el nombre `payments` porque esa tabla ya es de la paciente.

## Precios

Arranque 24.900, Pro 49.900, Consultorio 89.900 pesos por mes. El anual es 20% sobre 12 meses (Arranque 239.040, Pro 479.040, Consultorio 863.040). El 862.080 que figuraba en el brief no cierra con 89.900 × 12 × 0,8; manda la cuenta. La fundadora (primeras 30) tiene 40% durante 12 meses. Esos dos descuentos no se suman: si es fundadora, paga el 60% del precio de lista del ciclo que eligió. Al mes 13 el worker pasa el débito al precio de lista (el anual queda con su 20%). El cupo no vuelve si cancela.

Una nutri nueva sin suscripción tiene acceso completo durante 30 días desde el alta (puede cargar pacientes). El día 31, si no pagó, el panel pasa a solo lectura sin borrar datos. Si un cobro se rechaza, hay 7 días de gracia y después solo lectura. La paciente no pierde sus datos ni Mensajes.

Paciente activa: no archivada y, en los últimos 30 días, tuvo una comida, un hábito, un mensaje, un turno, o fue dada de alta.

Fotos con IA por mes: 150 Arranque, 600 Pro, sin tope en Consultorio. Si se pasa el tope, la comida se guarda igual y no se llama a la IA.

## Bandera y variables

`PLATFORM_BILLING_ENABLED` apagada por defecto. Con la bandera apagada no hay límites. Las variables van en Railway, sin valor en el repo:

- `MP_PLATFORM_ACCESS_TOKEN`
- `MP_PLATFORM_WEBHOOK_SECRET`
- `PLATFORM_BILLING_ENABLED`

También hace falta `PUBLIC_SITE_URL` (ya existe) para el regreso a Ajustes.

## Qué tiene que hacer Facundo, en este orden

1. Aplicar `supabase/migrations/20261030120000_platform_billing.sql` con su frase. No se aplicó en producción.
2. Cargar las tres variables en Railway.
3. En Mercado Pago, apuntar el aviso a `https://<sitio>/api/public/billing/mp/webhook` (con y sin barra final) para los temas `subscription_preapproval`, `subscription_authorized_payment` y `payment`. El secreto tiene que ser el mismo que `MP_PLATFORM_WEBHOOK_SECRET`.
4. Prender `PLATFORM_BILLING_ENABLED=1` en Railway.

## Prueba en sandbox

Los pasos para hacerla a mano, sin cobrar plata de verdad, están en [mercadopago-sandbox.md](mercadopago-sandbox.md). La clave tiene que empezar con `TEST-`. Si es de producción, el servidor no llama a Mercado Pago.

## Informe Regression Guard (Paso 10)

- **Flujos críticos verificados:**
  - Cálculo de precios en centavos (mensual, anual -20%, fundadora -40% sin sumar descuentos): ✅ cubierto (`server/billing-platform/pricing.test.ts`).
  - Alta de preapproval con token de plataforma, monto del servidor e idempotencia (`X-Idempotency-Key`): ✅ cubierto (`server/billing-platform/service.test.ts`).
  - Webhook de Mercado Pago (firma HMAC-SHA256, vencimiento de `ts`, idempotencia por evento, consulta remota a MP, fallo 503): ✅ cubierto (`server/billing-platform/routes.test.ts`).
  - Máquina de estados, gracia de 7 días en `past_due`, modo solo lectura sin cortar al paciente y topes de admisión/fotos IA: ✅ cubierto (`server/billing-platform/state.test.ts`).
  - Migración aditiva, cupo atómico de 30 fundadoras (`FOR UPDATE`) y aislamiento RLS entre nutricionistas: ✅ cubierto (`server/billing-platform/migration.postgres.test.ts`, `server/rls-ab.test.ts`).
  - Pantalla de plan en Ajustes v29 en claro y oscuro sin desborde: ✅ cubierto (`e2e/plan-nutridash.spec.ts`, `e2e/equipo-ajustes.spec.ts`).
  - No regresión del cobro nutri→paciente (`server/subscriptions/*`, `src/billing.ts`): ✅ cubierto (`server/subscriptions/*.test.ts`, `src/billing.test.ts`, `server/billing-flow.integration.test.ts`).
- **Regresiones cubiertas:**
  - Cuerpo falso en webhook ignorado a favor de lectura directa a Mercado Pago (`loadRemote`).
  - Notificación vieja que no pisa un cobro aprobado más reciente (`olderThan`).
  - Tope de fotos IA que deja registrar la comida manual aunque no llame a la IA (`reserveAiPhoto`).
- **Contratos revisados:**
  - `GET /api/billing/plan`, `POST /api/billing/checkout`, `POST /api/billing/change-plan`, `POST /api/billing/cancel`, `POST /api/public/billing/mp/webhook` ↔ `src/api/billing.ts` y `src/components/nutrigo/PlanNutridash.tsx`.
  - Reescrituras en `vercel.json` y encabezados CSP.
- **Áreas frágiles:**
  - Webhook y concurrencia: protegidos con firma en tiempo constante, tabla `platform_billing_events` y actualización CAS por `revision`.
  - Separación B2B vs B2C: tablas `platform_*` independientes de `patient_*` y `payments`.
- **Migraciones:**
  - `supabase/migrations/20261030120000_platform_billing.sql` aditiva, con bloque de reversión comentado y registrada en el manifiesto. No aplicada en producción.
- **Fire test:**
  - Cambio temporal del descuento anual en `cycleAmountCents` detectado inmediatamente por `server/billing-platform/pricing.test.ts` y revertido ✅.
- **Automatizaciones nuevas:**
  - Tablas internas y manifiesto de migraciones verificados por `check:migrations`, `check:release-manifest`, `check:secrets` y `server/security/internal-tables.postgres.test.ts`.
- **Veredicto:** **HOLD** (PR en borrador; requiere frase de Facundo para aplicar la migración en producción y cargar las variables en Railway).

## Continuación del pulido · Regression Guard, paso 10 (1/11, Codex)

- **Flujos críticos verificados:** ✅ días 0 y 29 permiten escrituras y altas; al cumplir 30 días pasan a solo lectura; GET y checkout siguen disponibles; pacientes sin perfil profesional pueden escribir; bandera apagada no limita; planes pagos conservan topes. Pruebas de `signup-access.test.ts` y `state.test.ts`.
- **Regresiones cubiertas:** ✅ la gracia del alta no prolonga deudas vencidas ni reactiva planes pausados; respuesta del plan y aviso de días coinciden (`service.test.ts`). Aviso manual sin prometer un bloqueo que no aplica (`service-notice.test.ts`).
- **Contratos revisados:** repositorio → guardia/límites → `GET /api/billing/plan` → tipo frontend y Ajustes; `signup_grace` también existe en respuesta con bandera apagada. Pendiente con enlace permite «Continuar pago».
- **Áreas frágiles:** gracia de alta separada de los siete días por rechazo; servicio manual separado del cobro automático. Revisión independiente de código realizada; sin prueba visual ni pago real en sandbox (pendientes).
- **Migraciones:** N/A en este pulido; no se aplicó ninguna ni se tocó producción o variables.
- **Fire test:** la regresión nueva de deuda vencida falló contra el código heredado (`full` en lugar de `read_only`) y pasó tras corregirlo. No se hizo una mutación adicional.
- **Automatizaciones nuevas:** pruebas locales de guardia, admisión, vencimiento exacto y respuesta del plan; sin pasos nuevos de despliegue. La activación conserva la lista de requisitos de `docs/cobro-plataforma.md`.
- **Validación ejecutada:** 22 pruebas aprobadas en cuatro archivos: `server/billing-platform/state.test.ts`, `server/billing-platform/service.test.ts`, `server/billing-platform/signup-access.test.ts`, `src/components/nutrigo/service-notice.test.ts`. `npx tsc --noEmit` y `git diff --check` aprobados. Por instrucción de Facundo no se ejecutó suite completa, build ni gate completo.
- **Veredicto:** **HOLD para merge/publicación**. Pulido listo en esta rama; pendientes validación visual y sandbox de Mercado Pago antes de activar. Sin merge ni producción.
