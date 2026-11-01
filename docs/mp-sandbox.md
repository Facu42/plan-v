# Sandbox de Mercado Pago · cobro Nutridash a la nutricionista

Esto es el cobro de Nutridash a la profesional, no el débito de la paciente.
Solo sandbox: token `TEST-`, usuarios de prueba, sin cobro real.

## Estado de credenciales (1/11/2026)

No hay `MP_PLATFORM_ACCESS_TOKEN` con prefijo `TEST-` en este entorno.
Tampoco está `MP_PLATFORM_WEBHOOK_SECRET` de la plataforma.

Aparecen otros nombres de variables (`MP_TEST_ACCESS_TOKEN`, `MP_TESTSELLER_ACCESS_TOKEN`) cuyo valor **no** empieza con `TEST-`. Este trabajo no los usa ni los imprime. Un token `APP_USR-` cobra en serio: el código lo rechaza fuera de producción y siempre que `PLATFORM_BILLING_SANDBOX=1`.

Sin el token `TEST-` no se puede abrir el checkout real de Mercado Pago ni confirmar un pago de prueba de punta a punta. Lo que sí está cubierto:

- Tests automáticos del webhook (firma, cuerpo mentiroso, rechazo, repetición) y de la gracia de 30 días.
- Script/guía `npm run mp:sandbox` (nombres solamente; nunca imprime secretos).
- El servidor no llama a Mercado Pago si el token no es `TEST-` en este modo.

Para la prueba manual hace falta que Facundo cree una aplicación de prueba en el panel de desarrolladores de Mercado Pago, copie el token `TEST-` y el secreto de firma a `MP_PLATFORM_ACCESS_TOKEN` y `MP_PLATFORM_WEBHOOK_SECRET`, y arme un vendedor y un comprador de prueba. No se inventan esas claves.

## Cómo probar

### Automático (siempre)

```bash
npm test -- server/billing-platform/sandbox-flow.test.ts \
  server/billing-platform/state.test.ts \
  server/billing-platform/routes.test.ts \
  server/billing-platform/pricing.test.ts \
  server/billing-platform/service.test.ts
npm run mp:sandbox -- --check
```

El `--check` sale 0 si hay token `TEST-`; 2 si falta; 3 si detecta un `APP_USR-` (y no lo usa).

### Manual, cuando existan las claves TEST-

1. API local, bandera prendida, `PLATFORM_BILLING_SANDBOX=1`. Nunca la web ni la API de producción.
2. Nutricionista de prueba elige Arranque mensual en Ajustes.
3. Paga con el comprador de prueba y una tarjeta de prueba aprobada.
4. El aviso llega a `/api/public/billing/mp/webhook` (con y sin barra). Firma inválida = 401.
5. El plan queda al día (`authorized`).
6. Un rechazo deja `past_due` con 30 días de gracia (se puede seguir escribiendo).
7. Al día 31 de esa deuda el panel pasa a solo lectura. La paciente no pierde datos ni Mensajes.

Aviso firmado solo contra localhost:

```bash
npm run mp:sandbox -- --simulate-webhook --url http://127.0.0.1:3001
```

## Informe Regression Guard (Paso 10) · sandbox MP

- **Flujos críticos verificados:**
  - Elegir plan → checkout con monto del servidor: ✅ cubierto (`service.test.ts`). Checkout real de Mercado Pago: ⚠️ gap (faltan credenciales `TEST-`).
  - Webhook con firma HMAC, tema normalizado, cuerpo mentiroso ignorado, repetición y 503: ✅ cubierto (`sandbox-flow.test.ts`, `routes.test.ts`).
  - Pago aprobado → cuenta activa (`authorized`, acceso completo): ✅ cubierto (`sandbox-flow.test.ts`).
  - Pago rechazado → gracia 30 días → solo lectura, sin cortar a la paciente: ✅ cubierto (`sandbox-flow.test.ts`, `state.test.ts`).
  - Login / sesión real de nutricionista en sandbox de MP: ⚠️ gap (hace falta token `TEST-` y usuario de prueba).
- **Regresiones cubiertas:**
  - Token `APP_USR-` rechazado con `PLATFORM_BILLING_SANDBOX=1` (no se llama a Mercado Pago).
  - Aviso `payment.updated` o query `topic`/`id` (formato viejo) se entiende igual.
  - `init_point` sigue visible en deuda para retomar el medio de pago.
- **Contratos revisados:** `POST /api/public/billing/mp/webhook` ↔ `parseBillingNotice` / `verifyMpSignature` / `loadRemote`; `GET /api/billing/plan` (`grace_until`, `read_only`, `init_point` en `past_due`) ↔ Ajustes.
- **Áreas frágiles:** firma y token de Mercado Pago. Extra: guarda `TEST-`, el script no habla con hosts de producción.
- **Migraciones:** N/A. No se escribió SQL nuevo. `20261030120000_platform_billing.sql` sigue sin aplicar en producción.
- **Fire test:** bajar `GRACE_DAYS` a 7 hizo fallar `pricing.test.ts` y `state.test.ts`; se restauró 30 y volvieron a verde.
- **Automatizaciones nuevas:** `npm run mp:sandbox` y tests de flujo simulado. La prueba manual real sigue pidiendo las claves `TEST-` de Facundo.
- **Veredicto:** **HOLD**. Listo para revisar. Falta el pago real en sandbox (sin `TEST-`) y la frase de Facundo para migración, variables y merge. Sin producción.

## Qué no se tocó

PRs #244 y #245, base de producción, Vercel, Railway, migraciones aplicadas, tokens `APP_USR-`.
