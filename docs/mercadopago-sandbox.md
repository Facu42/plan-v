# Probar el cobro de Nutridash en Mercado Pago, sin plata de verdad

Esto es el cobro de Nutridash a la nutricionista. No es el cobro de la paciente. No uses la clave de producción y no confirmes un pago con una tarjeta real.

La cuenta queda activa solo cuando Mercado Pago avisa un pago aprobado por el monto del plan. Si ella no paga, a los 30 días del alta el panel pasa a solo lectura: ve todo y no puede cargar. No se borra nada y la paciente sigue entrando.

## Antes de empezar

En Railway, en el servicio de la API, y solo cuando Facundo lo pida por escrito:

1. `MP_PLATFORM_ACCESS_TOKEN`: la clave de **prueba** de Mercado Pago. Empieza con `TEST-`. Si empieza con otra cosa, Nutridash no llama a Mercado Pago.
2. `MP_PLATFORM_WEBHOOK_SECRET`: el mismo secreto que vas a poner en el aviso de Mercado Pago.
3. `PUBLIC_SITE_URL`: la dirección pública del sitio, con `https://`.
4. `PLATFORM_BILLING_ENABLED=1` recién al final, cuando las tres anteriores ya están.

La migración `supabase/migrations/20261030120000_platform_billing.sql` tiene que estar aplicada. No se aplica desde este documento.

En Mercado Pago, con la aplicación de **prueba**:

- Avisos a `https://<sitio>/api/public/billing/mp/webhook` (también la misma dirección con barra al final).
- Temas: `subscription_preapproval`, `subscription_authorized_payment` y `payment`.
- El secreto del aviso es `MP_PLATFORM_WEBHOOK_SECRET`.

Creá una usuaria de prueba compradora en Mercado Pago (no uses tu usuario real). Anotá el mail y la clave de esa usuaria. No los pegues en el repositorio.

## Pasos

1. Entrá con una nutricionista de prueba que tenga menos de 30 días de alta.
2. En Ajustes, elegí Arranque mensual. El enlace tiene que abrir Mercado Pago. Si es de las primeras 30, el monto es $14.940. Si no, $24.900. El servidor calcula el monto: la pantalla no lo puede cambiar.
3. Pagá con la usuaria de prueba y una tarjeta de prueba de Mercado Pago (estado aprobado). No uses una tarjeta propia.
4. Al volver a Ajustes, el plan tiene que decir que está al día. La nutricionista puede cargar.
5. Repetí el mismo aviso a mano, o esperá el reintento de Mercado Pago: el pago no se anota dos veces.
6. Un aviso con la firma cambiada responde 401 y no cambia el plan.

## Si no paga

- Del día 0 al 29 puede usar el panel completo.
- Al cumplirse 30 días desde el alta, sin un pago aprobado, el panel queda en solo lectura.
- Un pago aprobado de otro monto no activa la cuenta.
- Si más adelante un cobro se rechaza, hay 7 días para reintentar y después también queda en solo lectura. La paciente no pierde Mensajes ni sus datos.

## Qué no hacer

- No pegar la clave en el chat, en el repo ni en un archivo.
- No prender esto en la API de producción hasta tener la clave de prueba y la frase de Facundo.
- No mezclar esta cuenta de Mercado Pago con la que usa la nutricionista para cobrarle a sus pacientes.
