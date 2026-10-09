# Control de vistas públicas · 2026-10-09

El arreglo del PR #83 cerró `meal_logs_patient_view`: una paciente podía insertar o reasignar comidas de otra porque la vista nacía con escritura y con los permisos del dueño, por encima de las reglas de la tabla.

Supabase, al crear una tabla o una vista en `public`, le da por defecto todos los permisos a `anon` y a `authenticated`. Una vista nueva puede reabrir el mismo agujero aunque la migración no escriba `GRANT`.

## Qué revisa el control

Después de aplicar todas las migraciones, mira el catálogo de Postgres (no el texto del SQL). Falla si una vista de `public`:

- concede `INSERT`, `UPDATE` o `DELETE` a `anon` o `authenticated`, también cuando el permiso es solo de una columna;
- no tiene `security_invoker=true`.

La lista que sí puede quedar sin `security_invoker` está en `server/security/public-view-grants.ts`. Cada entrada tiene un comentario y un motivo. Hoy está vacía. La ficha y el acceso leen por funciones privadas y tienen `security_invoker=true`. Una vista nueva sin esa opción vuelve a fallar el control.

La lista no perdona escritura. Si una vista de la lista gana `INSERT`, `UPDATE` o `DELETE`, el control falla igual.

## Dónde corre

- En cada PR, `npm run check:views` (paso del CI general). Arma una base temporal con los mismos permisos por defecto de Supabase, aplica las migraciones y revisa.
- En el ensayo de sesiones firmadas, corre otra vez contra la base temporal real, cuando las migraciones ya están aplicadas.

No se conecta a producción (`wvosvlxpfytokwfbcero`). Si la URL no es local, se niega.

## Permisos por defecto

La migración `20261009183000_revoke_default_public_writes.sql` deja de entregar `INSERT`, `UPDATE`, `DELETE` y `TRUNCATE` a `anon` y `authenticated` en tablas y vistas que se creen después. No toca los permisos de las tablas que ya existen. Un alta de comida de la paciente sigue funcionando. `service_role` conserva la escritura. Una tabla nueva tiene que recibir el permiso en su propia migración, igual que ya pasa con las funciones.

## Cómo ver que el control falla

`npm run check:views -- --rehearse-failure` crea una vista mala en la base temporal y termina con error. Ese ensayo no usa una base externa.
