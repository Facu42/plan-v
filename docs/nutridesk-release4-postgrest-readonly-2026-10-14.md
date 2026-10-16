# Lectura del plan publicado: corrección detectada por sesiones reales

La comprobación de Auth/PostgREST local del [PR 108](https://github.com/Facu42/plan-v/pull/108), sobre `accb97f`, detectó una regresión: después de publicar un plan manual y guardar otro borrador, la paciente recibía 503 al releer su copia publicada. Los otros 29 casos de sesiones aprobaron; la suite local ordinaria y los checks de compilación y secretos no habían detectado esta diferencia de transacción.

## Causa y corrección

La migración `20261011000000_plan_reads_can_promote.sql` había declarado `list_published_meal_plan` como `VOLATILE`: esa lectura toma un bloqueo de versión y puede promover un plan cuando comienza su vigencia. La migración nutricional `20261011180000` añadió nombres de momentos y recreó el wrapper como `STABLE`. PostgREST usa una transacción de sólo lectura para esas funciones; el `SELECT FOR UPDATE` interno falla incluso cuando no hay una versión programada que promover.

El cambio mínimo conserva `VOLATILE` en el wrapper nuevo. Mantiene sus permisos, acceso por paciente, selección de la versión publicada, nombres de momentos y separación del borrador privado. No cambia la respuesta pública de errores ni concede acceso adicional.

## Prueba primero y evidencia

Se agregó un caso permanente a `server/nutrition-capabilities/database.test.ts`. Lee la volatilidad real de `pg_proc`, reproduce la decisión de transacción de PostgREST y relee el plan publicado con el rol y la identidad de la paciente después de editar el siguiente borrador.

Antes del cambio: **cinco aprobadas y una fallida**, con el error exacto `cannot execute SELECT FOR UPDATE in a read-only transaction`. Después: **trece aprobadas, cero fallos, dos archivos**, ejecutados tanto en esta entrega como en CORE; incluye las seis pruebas nutricionales de persistencia y siete de permisos de funciones. Reportes locales `planv-release4-postgrest-readonly-red-20261014.json` y `planv-{nutridesk-release-nutricion,nutridesk-core}-postgrest-green-20261014.json`.

La suite completa posterior terminó el **14/10/2026 a las 10:46 de Argentina**: **2.679 aprobadas, cero fallos, dos omitidas, 407 archivos**. El JSON completo tiene `success:true` e incluye la nueva regresión aprobada. El SQL y la prueba se modificaron antes de iniciar esa ejecución, sin cambios de aplicación posteriores. Evidencia: `planv-release4-full-readonly-fix-20261014.json` y su log final; no se repitió la suite al retomar. El resultado previo de 2.678 casos pertenece a `accb97f`.

La revisión independiente del fix no encontró P1/P2 y ejecutó **trece casos aprobados**: seis de persistencia nutricional y siete de permisos. Evidencia separada: `planv-release4-postgrest-independent-20261014.json` y `planv-release4-postgrest-grants-independent-20261014.json`. Tipos, comprobación de migraciones y límite de secretos también habían aprobado tras el cambio. La comprobación real de sesiones del PR debe repetirse sobre el nuevo commit; todavía no se declara aprobada.

## Regression Guard, paso 10

- Flujos críticos: publicación manual, nuevo borrador y lectura de paciente; promoción por vigencia; aislamiento de versiones y permisos. Regresión permanente y catálogo de permisos aprobados localmente; sesiones reales pendientes del nuevo CI.
- Contratos: el RPC conserva una transacción que permite sus bloqueos/escrituras. El API sigue devolviendo sólo la versión publicada a la paciente. No se elimina la promoción ni se cambia el snapshot para hacer pasar la prueba.
- Acoplamiento y área frágil: la volatilidad SQL determina el modo de transacción de PostgREST. La prueba anterior invocaba el RPC dentro de una transacción de escritura y omitía esa decisión del consumidor; el caso nuevo la reproduce.
- Migración: se modifica el archivo nuevo aún no aplicado en producción. No borra datos ni añade permisos. El manifiesto final debe actualizar su huella antes de publicar el paquete; no se aplica SQL remoto desde este trabajo.
- Fire/RED: la cabeza defectuosa produjo el fallo real de transacción; la corrección mínima dejó el mismo caso verde. El fire previo de selección de fórmula permanece documentado en el informe de entrega 4.
- Automatización: la regresión de política de transacción queda en la suite ordinaria; se conserva además la comprobación de Auth/PostgREST con sesiones reales.
- Veredicto: **SHIP para incorporar la corrección al PR en borrador**: suite posterior y revisión independiente aprobadas. **HOLD para publicación** hasta verificar el CI de sesiones y las autorizaciones correspondientes. No se publicó ni aplicó en producción.
