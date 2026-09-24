# Corte 16 — Estado de cobranza y paywall seguro

Estado: **completado** (2026-09-06).

## Alcance

1. Se incorporó el contrato compartido `BillingStatus`:
   - `waived`: acceso completo sin período.
   - `pending`: acceso bloqueado.
   - `active`: acceso completo sólo cuando `billing_until >= hoy`.
   - `past_due`: acceso bloqueado.
2. `past_due` se deriva determinísticamente cuando un período `active` venció o no tiene fecha.
3. El CRM muestra un chip de cobranza en cada fila de `Mi seguimiento`.
4. La ficha reutiliza su encabezado con un strip compacto para marcar:
   - pendiente;
   - activo con fecha inclusiva;
   - exceptuado.
5. Cada cambio demo registra un evento no clínico `billing` en la línea de tiempo.
6. El paciente `pending` o `past_due` ve un paywall dentro del shell existente.
7. El paywall no presenta un checkout falso: informa que Mercado Pago todavía no está conectado.
8. Mensajes continúa disponible durante el bloqueo.
9. Al pasar a `active` o `waived`, la app completa vuelve a quedar disponible.

## Seguridad y privacidad

- `edit_billing` es una acción exclusivamente profesional y exige relación `nutritionistId`.
- Un paciente bloqueado puede leer su vista mínima y enviar mensajes, pero la autorización central rechaza `analyze_meal` y `update_habits`; el paywall no se puede eludir llamando al API.
- La mutación valida el body con Zod.
- `active` exige una fecha calendario `YYYY-MM-DD` válida.
- El cliente no puede enviar `past_due`; se deriva en servidor por vencimiento.
- En Supabase sin contrato `016`, la ruta autoriza primero y luego devuelve `501`; no cae silenciosamente al store demo.
- El mapper de Supabase resuelve períodos vencidos antes de mostrar el estado en CRM.
- La vista self de un paciente bloqueado vacía objetivo, hábitos, plan, comidas, timeline, turno y adherencia; conserva sólo identidad operativa, estado de cobranza y mensajes enviados.
- No se agregó tarjeta, comprobante, tarjeta guardada, dato bancario ni identificador de Mercado Pago.

## TDD

- `src/billing.test.ts`: acceso por estado y vencimiento inclusivo.
- `server/billing-flow.integration.test.ts`: activación, waiver, vencimiento, timeline, `400` y `404`.
- `server/schemas.test.ts`: contrato de fecha y estados aceptados.
- `server/security/contracts.test.ts`: autorización profesional, serialización bloqueada y rechazo de mutaciones de salud con cobro bloqueado.

## QA en Chrome

Modo memoria/demo, zona `America/Argentina/Buenos_Aires`:

1. Marina inició `pending`: chip `Pendiente` en CRM.
2. Paciente mostró `Tu acceso está pendiente de activación`.
3. No se renderizaron menú, plan ni botón de cámara.
4. Navegación limitada a `Acceso` y `Mensajes`.
5. Un mensaje de Verónica fue visible durante el bloqueo; el objetivo profesional no apareció.
6. Desde el CRM se activó un período y apareció `Estado de cobro actualizado.`.
7. Marina recuperó `Hoy`, `Mi plan`, cámara, `Mi camino` y `Mensajes`.
8. Lucía `past_due` mostró `Renová tu acompañamiento con Verónica` y la fecha del período anterior.
9. Sin overflow horizontal en `320`, `390`, `768`, `1024` y `1440 px`.
10. Chrome aislado fue cerrado y el puerto `9224` quedó libre.

## No incluido

- Mercado Pago Checkout Pro.
- Webhooks y firma de webhook.
- Registro persistente de `payments`.
- Monto ARS, comprobantes, factura AFIP o tarjeta guardada.
- Renovación automática o suscripción.
- Aplicación del SQL draft o creación improvisada del contrato `016`.
