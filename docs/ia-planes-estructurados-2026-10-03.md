# IA para recetas y planes: implementación y verificación

Fecha: 3 de octubre de 2026. Alcance: código de la rama de producto Nutrigo, sin cambios en producción, commits ni llamadas reales al proveedor de IA durante este apartado.

## Comportamiento implementado

Los prompts `recipe_draft.v2` y `menu_draft.v2` reciben alergias, restricciones, tiempo de cocina, preferencias indicadas por la profesional, período, momentos seleccionados, hasta doce recetas publicadas con ingredientes y nutrientes y la meta calórica confirmada. La meta privada en borrador no entra en este contexto. No se envían nombres, identificadores de pacientes, medidas corporales ni notas clínicas. La revisión del ingreso y el evento de consentimiento se usan sólo en el servidor para detectar propuestas vencidas.

La propuesta de menú tiene una entrada por día y momento solicitado. Cada entrada referencia una revisión publicada del catálogo o contiene una receta estructurada nueva: título, ingredientes con cantidades y unidades, rendimiento, pasos y nutrientes por porción cuando estén disponibles. Las recetas nuevas siempre guardan `origin: ai_estimate` y `source: estimacion_ia.v2`; la respuesta del modelo no puede declarar que fueron medidas. Revisar, editar, publicar y asignar no elimina esta procedencia.

El servidor calcula las calorías y macros diarios multiplicando los nutrientes por porción por las porciones servidas. Si todos los datos del día están disponibles y existe una meta confirmada, ajusta proporcionalmente las porciones para acercarse a las calorías objetivo. No modifica los nutrientes declarados por porción ni las cantidades base de la receta. Las porciones se redondean a cuatro decimales y deben quedar entre cero exclusivo y cincuenta inclusive. Si no se puede ajustar dentro de esos límites, informa el límite. Si faltan nutrientes, porciones o comidas del período, no muestra un total completo ni afirma que el día quedó ajustado.

El resumen distingue ajuste calórico, diferencias de proteínas/carbohidratos/grasas y nutrientes estimados. Un ajuste de calorías no equivale a ajustar la distribución de macros. Se considera dentro del objetivo una diferencia de hasta el mayor de 1 kcal y 0,1 % de la meta. Los totales se recalculan al leer el plan; el servidor no conserva como verdad un resumen recibido desde el cliente.

La revisión profesional muestra ingredientes, pasos, cantidades, procedencia y diferencias respecto de la meta. Para aprobar una propuesta estimada, la interfaz exige reconocer su revisión. También permite copiarla al editor privado, modificar ingredientes, cantidades, porciones y nutrientes, guardar y publicar después. La publicación verifica la versión y el contenido exacto revisado, incluyendo nutrientes, ingredientes y meta utilizada. Una modificación concurrente no puede publicarse con una revisión anterior.

Las compras incorporan los ingredientes de las recetas nuevas del menú y los escalan mediante `porciones servidas / rendimiento`. Se conservan las marcas de compra al recargar. Guardar otro borrador del menú no cambia las compras derivadas de la versión publicada.

## Endpoints, roles y resultado después de recargar

| Acción | Endpoint | Quién puede ejecutarla | Comprobación persistente |
|---|---|---|---|
| Generar propuesta | `POST /api/ai/jobs` | Nutricionista con acceso al paciente y consentimiento vigente | `GET /api/ai/jobs/:id` y `GET /api/patients/:id/ai/jobs` conservan estado, advertencias y propuesta. |
| Aplicar al borrador privado | `POST /api/ai/jobs/:id/apply` | Nutricionista propietaria; se revalida contexto | La propuesta queda en el borrador profesional; aplicar no publica para la paciente. La operación conserva su marca de aplicación. |
| Rechazar propuesta | `POST /api/ai/jobs/:id/reject` | Nutricionista propietaria | El job queda cancelado y ya no se puede aplicar. |
| Editar menú privado | `POST /api/patients/:id/plans` | Nutricionista con acceso | `GET /api/patients/:id/plans` profesional devuelve la nueva versión privada; la paciente sigue recibiendo la publicada. |
| Publicar menú revisado | `POST /api/plans/:id/publish` | Nutricionista propietaria | La lectura de la paciente devuelve la revisión aprobada. Una versión, contenido o meta confirmada distintos producen conflicto. |
| Editar receta | `POST /api/recipes` o `POST /api/recipes/:id/versions` | Nutricionista propietaria | `GET /api/recipes` conserva ingredientes, nutrientes y procedencia de IA. |
| Publicar y asignar receta | `POST /api/recipes/:id/publish`, `POST /api/recipes/:id/assign` | Nutricionista propietaria y con acceso al paciente | `GET /api/patients/:id/recipes` devuelve la receta asignada con su procedencia; otro consultorio no puede acceder. |
| Consultar compras | `GET /api/patients/:id/shopping` | Paciente titular o nutricionista autorizada | Cantidades del plan publicado, ingredientes de recetas nuevas y elementos manuales aparecen al recargar. |
| Marcar compra | `POST /api/patients/:id/shopping/check` | Paciente titular | La marca persiste después de una nueva lectura. |

Las rutas conservan los controles existentes de sesiones y pertenencia al consultorio. El parámetro `audience` sólo selecciona vistas en el modo de demostración; producción usa el rol de la sesión.

## Validez y concurrencia

El hash del contexto incluye revisión del ingreso, consentimiento, alergias/restricciones, preferencias, período, catálogo publicado y meta confirmada. Antes de terminar la generación y antes de aplicarla se vuelve a construir ese contexto. Cambiar datos relevantes o retirar y volver a otorgar consentimiento invalida la propuesta previa. Un borrador privado nuevo de la meta no invalida una propuesta basada en la misma meta publicada.

La meta del menú registra calorías/macros, fecha de publicación y `updated_at` de la meta confirmada como revisión. La base de datos comprueba esa referencia al aplicar el job, guardar el menú y publicar. Los guardados y publicaciones comparten el bloqueo por paciente de las metas para evitar sobrescribir una confirmación concurrente. Se mantiene la reserva y el control de consumo/ejecuciones del sistema de jobs existente.

## Migración preparada

Archivo: `supabase/migrations/20261003172907_structured_menu_nutrition.sql`, creado con Supabase CLI 2.119.0 mediante `migration new structured_menu_nutrition`.

Agrega tres columnas JSON opcionales: `recipe_versions.nutrition`, `meal_plan_items.recipe_proposal` y `meal_plan_versions.nutrition_target`. Conserva los registros existentes. Envuelve las funciones existentes para validar los nuevos contratos y los controles de meta/contexto, amplía las respuestas publicadas y deriva compras de recetas estructuradas. Las funciones base y auxiliares quedan sin permisos de ejecución para `public`, `anon` y `authenticated`, evitando eludir los controles mediante RPC. Las rutas públicas autorizadas mantienen sus permisos de ejecución para sesiones autenticadas.

Se ensayó la cadena completa de migraciones en PostgreSQL aislado mediante PGlite, incluyendo las migraciones de metas y fotos manuales de este mismo trabajo. No se aplicó esta migración al proyecto Supabase real. La publicación debe incluirla con las migraciones anteriores en orden, mediante el procedimiento y la aprobación concreta exigidos por las reglas del proyecto.

## Verificación realizada

Última ejecución: **190 pruebas aprobadas, cero fallos y cero pendientes** en IA, jobs, evaluación, planes, recetas, compras y las vistas profesionales de menú/recetario. Resultado local: `.gstack/ai-domain-final.json`.

Además pasaron `npm run check` para cliente y servidor y `npm run check:migrations`. Se sustituyó `.at(-1)` por `.slice(-1)[0]` para mantener compatibilidad con ES2020 del servidor.

Las pruebas nuevas verifican salida estructurada del contrato live con proveedor simulado, referencias inexistentes del catálogo, cobertura incompleta, nutrientes faltantes, límites de porciones, ajuste proporcional, procedencia estimada conservada, ausencia de identificadores enviados al modelo, conflicto de revisión, persistencia tras nuevas lecturas, compras de ingredientes nuevos, aislamiento entre consultorios y cambio/retiro de consentimiento o meta confirmada. El ensayo SQL verifica también que los controles se mantienen cuando se invocan directamente las RPC autorizadas.

## Límites y pendientes de publicación

- **No hubo una generación real contra el proveedor gratuito durante este apartado.** Los tests del contrato live usan una respuesta simulada; no acreditan disponibilidad, calidad ni aceptación del esquema por un modelo real. Se requiere una prueba gratuita con cuentas ficticias para cerrar el criterio del producto.
- El proveedor acepta exclusivamente `openrouter/free` o modelos terminados en `:free` y fuerza un techo de precio cero en la petición. Si falla o se agota, informa indisponibilidad; no sustituye la respuesta por un menú ficticio ni cambia a un modelo pago. En el cierre principal se retiró el antiguo opt-in `AI_COST_MODE=paid` y el proveedor pago de fotos. Ni siquiera una configuración heredada puede activarlos.
- Las estimaciones nutricionales no se convierten en mediciones por haber sido revisadas. La profesional debe corregir valores y porciones cuando corresponda antes de publicar. El ajuste proporcional sólo usa datos disponibles, no infiere nutrientes desconocidos ni garantiza macros objetivo.
- Las propuestas están limitadas a 42 entradas y el catálogo de contexto a doce recetas; un período más largo exige menos momentos diarios o generación por bloques. La pantalla valida estos límites antes de enviar.
- Las fotos generadas por IA continúan pendientes de un proveedor gratuito comprobado. No se activó Higgsfield. La subida manual y su migración están documentadas por separado en `docs/metas-y-fotos-manuales-2026-10-03.md`.
- La prueba real gratuita, la revisión final del producto, la aprobación de migraciones y la comprobación del mismo commit en frontend/API/worker pertenecen al cierre de publicación del trabajo principal y no se dan por realizadas aquí.
