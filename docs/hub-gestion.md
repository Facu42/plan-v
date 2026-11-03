# Centro de gestión en /admin

3/11/2026. `/admin` deja de ser solo el tablero de cuentas y pasa a ser el centro comercial de Nutridash. El tema es oscuro en todas las pantallas. Los botones principales usan el degradé del logo.

## Qué se ve

- Inicio: ingreso recurrente, cobrado del mes, pruebas activas y las que vencen en 7 días, bajas del mes, altas nuevas y alertas (pagos fallidos, salud y segundo paso).
- Nutris: plan, estado (prueba, activa, morosa o baja), último ingreso, pacientes y un puntaje de uso, cartera y pago al día. La ficha tiene línea de tiempo, notas y tareas.
- Pipeline: Lead, Demo, Prueba, Paga y Baja. El origen puede ser Instagram, WhatsApp, la web, un referido o el mail. El próximo paso se escribe a mano. Se mueve de etapa con la lista, no arrastrando.
- Facturación: suscripciones y pagos de Mercado Pago, avisos procesados o fallidos, rechazos y reembolsos. Los cobros anotados a mano quedan aparte para no sumarlos dos veces.
- Bandeja: un solo lugar para WhatsApp, Instagram y el mail. Hoy el mensaje se anota a mano y desde ahí se puede crear el lead.
- Conexiones: los tres canales figuran como Próximamente.
- Planes y precios, Salud y Seguridad siguen. El plan Prueba y quién lo ve no se tocó.

Si un número no se puede leer, la pantalla lo dice. No se rellena con un cero inventado.

## Qué falta (placeholders)

- AFIP: no hay facturación electrónica.
- WhatsApp Business, Instagram y el mail no están conectados. La bandeja no recibe mensajes sola.
- Notas, tareas, leads y mensajes en la base real responden «todavía no está aplicada» hasta que se corra la migración. En local, sin la base, se guardan en memoria para poder probar.
- El ingreso recurrente usa Mercado Pago cuando esas tablas responden. Si no, usa el precio del servicio por las cuentas activas y lo aclara.

## Migración

`supabase/migrations/20261103180000_platform_hub.sql` está escrita y no se aplicó. Crea leads, notas, tareas, hilos y mensajes. Cada tabla tiene seguridad por fila. Solo quien administra la plataforma puede verlas, y la app las lee con la clave de servicio. Para volver atrás hay que borrar esas cinco tablas, en el orden del comentario del archivo. No se borra nada que ya existía.

`/admin` sigue pidiendo el código de la app, aunque el interruptor general esté apagado.

## Paso 10

- Flujos críticos verificados: ingreso a `/admin` con código de la app (✅, prueba ya existente), Inicio con números reales o aviso si Mercado Pago no responde (✅), Nutris y ficha (✅), crear y mover un lead (✅ en memoria; en base real el alta responde 503 hasta aplicar la migración), Facturación sin inventar un cero (✅), anotar un mensaje y crear el lead (✅ en memoria), Conexiones en Próximamente (✅), Planes, Salud y Seguridad siguen (✅). Recorrido con una sesión real de administración ⚠️: las capturas son de las pantallas armadas en local, no de producción.
- Regresiones cubiertas: el centro viejo (resumen, cobros, salud) sigue con sus pruebas. Un admin sin el segundo paso sigue afuera.
- Contratos revisados: el navegador y el servidor usan los mismos nombres para Inicio, Nutris, leads, facturación, bandeja y conexiones. Los textos de error llegan a la pantalla.
- Áreas frágiles: Mercado Pago y el ingreso. Si la lectura de suscripciones falla, Inicio lo dice y no muestra un cero. Si la migración no está, guardar un lead o una nota responde que falta aplicarla.
- Migraciones: aditiva, sin borrar tablas viejas. Reversión comentada en el archivo. Sin aplicar.
- Fire test: se sumó 1 al puntaje de salud. La prueba «el puntaje suma uso, pacientes y pago, con tope 100» falló (esperaba 100 y vio 101). Se revirtió. ✅
- Automatizaciones nuevas: el manifiesto de migraciones incluye este archivo. `npm run check:migrations` y `npm run check:release-manifest` lo revisan. No hay un paso manual nuevo, salvo la frase de Facundo para aplicar la migración.
- Veredicto: HOLD. Sin merge, sin aplicar la migración y sin publicar. La suite completa quedó en 4013 pruebas en verde y 5 omitidas. El manifiesto ahora cuenta 43 pendientes y 8 ya aplicadas. Tipos, migraciones y manifiesto en verde.
