# Centro de gestión en /admin

3/11/2026. `/admin` es el centro comercial de Nutridash. El tema es oscuro. Los botones principales usan el degradé del logo. Las tarjetas entran con el mismo movimiento que el resto del centro.

## Qué se ve

- Inicio: ingreso recurrente, cobrado del mes, pruebas, bajas, altas y alertas. Abajo, el resumen del día y las cuentas con riesgo de baja.
- Nutris: plan, estado, último ingreso, pacientes y puntaje. La ficha tiene línea de tiempo, notas y tareas.
- Pipeline: Lead, Demo, Prueba, Paga y Baja. La tarjeta se arrastra o se elige la etapa en la lista. Al pasar a demo, prueba o paga queda un seguimiento: «Escribirle en 3 días».
- Facturación: suscripciones y pagos de Mercado Pago, avisos, rechazos y reembolsos. AFIP sigue como placeholder.
- Cobranza: el mismo ingreso, las bajas del mes y el valor de vida realizado (lo cobrado y aprobado, repartido entre quienes pagaron). En un pago rechazado se puede avisar por mail o volver a leer el estado en Mercado Pago. Ninguna de las dos cosas crea otro débito.
- Riesgo de baja: sin entrar hace 14 días (se puede cambiar con `HUB_RIESGO_DIAS`, de 1 a 90), una paciente o ninguna, o un pago rechazado. Se puede filtrar.
- Activación: por cada nutri, perfil, primer paciente, primer plan, cobro y página pública. Si lleva 7 días o más y falta un paso, se marca trabada. En el inicio de la nutri aparece la misma lista y se puede ocultar.
- Bandeja: WhatsApp y mail entran y salen si las credenciales están. Si faltan, el canal queda apagado y el mensaje se puede anotar a mano. «Sugerir respuesta» deja un borrador. Enviar lo aprieta el admin.
- Conexiones: WhatsApp y mail dicen Listo o Apagado según las credenciales. Instagram dice Preparado y todavía no envía.
- Planes y precios, Salud y Seguridad siguen.

Si un número no se puede leer, la pantalla lo dice. No se rellena con un cero inventado. Si la IA está apagada, el resumen y el borrador lo dicen y salen de una plantilla.

## Credenciales

Nada de esto se prende solo. Hacen falta estas variables, y si faltan el canal queda apagado:

- WhatsApp listo: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_BUSINESS_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` y `WHATSAPP_ENABLED=true`. Opcional: `WHATSAPP_GRAPH_VERSION`.
- Mail de salida: `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` (opcional `BREVO_SENDER_NAME`), o el mail operativo que ya existe (`MAIL_ENABLED=true` y el proveedor configurado).
- Mail de entrada: `HUB_INBOX_EMAIL_SECRET`. El aviso llega a `POST /webhooks/hub/email` con el encabezado `x-hub-inbox-secret`.
- Volver a leer un pago: la clave de Mercado Pago de la plataforma que ya usa el cobro (`MP_PLATFORM_ACCESS_TOKEN`). Con `MP_PLATFORM_LIVE=1` y una clave `APP_USR-` es la real; si no, la de prueba.
- Resumen y borrador con IA: el modo de IA en vivo que ya existe (clave del proveedor y un modelo gratis). Sin eso, el texto dice que sale de los números o de una plantilla.
- Instagram: no se lee ninguna variable. El conector queda preparado.

## Qué falta

- AFIP: Facundo lo hace. Acá sigue el cartel de más adelante.
- Instagram no lee ni envía mensajes.
- En la base real, guardar un lead, un seguimiento, un aviso o un borrador responde que la migración no está aplicada, hasta que Facundo lo pida. En local, sin la base, queda en memoria.
- El resumen con IA no se llama si el modo no está en vivo. No se inventa que «lo dijo el modelo».

## Migraciones

Ninguna se aplicó.

- `supabase/migrations/20261103180000_platform_hub.sql`: leads, notas, tareas, hilos y mensajes.
- `supabase/migrations/20261103233000_platform_hub_ops.sql`: seguimientos, avisos de cobranza, borradores, el día que la nutri oculta el checklist y el resumen del día. Cada tabla tiene seguridad por fila. La app las usa con la clave de servicio. La nutri solo puede ver y ocultar su propio checklist. Para volver atrás, borrar esas tablas en el orden del comentario de cada archivo. No se borra nada que ya existía.

`/admin` sigue pidiendo el código de la app, aunque el interruptor general esté apagado.

## Paso 10

- Flujos críticos verificados: ingreso a `/admin` con código de la app (✅, prueba ya existente). Inicio con resumen de números y riesgo (✅). Mover un lead a demo deja un solo seguimiento a 3 días (✅ en memoria). Cobranza sin pagos leídos deja el valor de vida vacío y un aviso a un pago inexistente responde 404 (✅). El webhook de mail responde 503 sin secreto y 403 con el secreto mal (✅). Sugerir respuesta deja plantilla si la IA está apagada, e Instagram no envía (✅). Activación sin base marca plan, cobro y página como sin dato (✅). WhatsApp y mail apagados sin credenciales, Instagram preparado (✅). Planes, Salud y Seguridad siguen (✅). Recorrido con una sesión real de administración ⚠️: las capturas son pantallas armadas en local, no de producción.
- Regresiones cubiertas: el centro viejo sigue con sus pruebas. Un admin sin el segundo paso sigue afuera. El puntaje de salud no se tocó.
- Contratos revisados: el navegador y el servidor usan los mismos nombres para riesgo, cobranza, activación, bandeja y seguimientos. Los textos de error llegan a la pantalla.
- Áreas frágiles: Mercado Pago. Avisar o releer no crea otro cobro; si la clave no corresponde al modo, el botón queda apagado. Si la migración nueva no está, el seguimiento no frena el cambio de etapa y la pantalla lo dice.
- Migraciones: aditivas, sin borrar tablas viejas. Reversión comentada. Sin aplicar.
- Fire test: se sumó 1 al valor de vida realizado. La prueba que espera 200 pesos vio 201 y falló. Se revirtió. ✅
- Automatizaciones nuevas: el manifiesto incluye las dos migraciones. `npm run check:migrations` y `npm run check:release-manifest` las revisan. Aplicarlas sigue pidiendo la frase de Facundo. Las credenciales de arriba tienen que estar en el servidor; si faltan, la pantalla queda apagada y no hay un paso manual escondido.
- Veredicto: HOLD. Sin merge, sin aplicar migraciones y sin publicar. La suite quedó en 4020 pruebas en verde y 5 omitidas. El manifiesto cuenta 44 pendientes y 8 ya aplicadas. Tipos, migraciones y manifiesto en verde.
