# Cierre funcional de Plan V — 5 de octubre de 2026

Continuación del PR #54 (rama codex/nutrigo-producto-mcp). Conserva las 24 fuentes originales del MCP, los recursos, el español y el logo oficial. El comparador estático no demuestra persistencia del producto.

**Estado posterior a la aprobación:** PR #54, #56 y #57 integrados; cinco migraciones aplicadas y web/API/worker comprobados en `df8e5d0`. Portada manual y generación gratuita real de cuatro recetas nuevas verificadas. Se editó y publicó v2, y la paciente recibe exactamente lo revisado conservando las estimaciones. [Evidencia y guía del producto publicado](cierre-producto-publicado-2026-10-05.md), [historial de publicación](publicacion-producto-plan-v-2026-10-05.md). La evidencia de abajo corresponde al ensayo anterior a publicar.

## Correcciones comprobadas localmente

- Recetas y planes usan una revisión de contenido distinta del número de versión. Dos editores sobre el mismo borrador no pueden sobrescribirse silenciosamente. La publicación exige el contenido revisado; el editor conserva datos ante un conflicto y ofrece recuperar lo guardado.
- El título y los ingredientes de una receta publicada se conservan al editar otra revisión. Se verifican receta asignada, favoritos, búsqueda, plan, registro de comida y texto alternativo de la foto.
- La IA captura en el servidor la revisión sobre la que propone. Ni los identificadores ni la revisión que devuelve el modelo pueden reemplazar esa base. Una edición posterior impide aplicar la propuesta antigua.
- Pagos y avisos manuales y actividad aceptan un identificador de operación. Repetir un pedido devuelve lo guardado; reutilizarlo con otros datos informa conflicto. La interfaz conserva el pedido incierto para reintentar y libera las correcciones cuando el servidor rechazó definitivamente los datos.
- Se cerraron escrituras directas que permitían eludir las comprobaciones de recetas/planes. La ficha visual y los ingredientes se guardan dentro de la misma transacción del borrador; la publicación antigua sin copia revisada ya no se ofrece a clientes.
- El botón principal del CRM abre el editor fechado que consume la paciente. Mantiene la paciente elegida. Mi ficha funciona como destino propio; el peso respeta su unidad y progreso se actualiza al registrar medidas. Hidratación usa el mismo máximo que el servidor.
- Recuperación de contraseña cuenta con pantalla para el enlace real de Auth, validación, guardado, salida y nuevo ingreso. Se corrigió una carrera al cargar la sesión inicial.
- Editar el título o los pasos de una receta manual conserva sus calorías declaradas. La ficha profesional incorpora el cálculo y la confirmación de la meta; el diario permite registrar las recetas asignadas por fecha.
- La procedencia de nutrientes estimados se conserva en las nuevas lecturas de ambos roles y al revisar una comida. No se inventa el origen de registros históricos ni se permite cambiarlo mediante escritura directa. Los RPC del diario y los reintentos tampoco devuelven notas profesionales a la paciente.
- Compras y mensajes liberan las correcciones después de un rechazo definitivo; ante una respuesta incierta reutilizan la misma operación y el adjunto ya subido.
- El alta guarda ficha e invitación en una sola transacción. Reintentar recupera sus identificadores, incluso si el enlace ya fue aceptado; datos diferentes informan conflicto. Preparar o revocar un enlace no puede sobrescribir una aceptación concurrente.
- La copia revisada del plan usa la misma forma en SQL y en la respuesta de la API. Los campos opcionales ausentes no provocan un conflicto falso al publicar un plan manual.
- La subida manual de fotos está conectada al catálogo profesional activo. Al asignar recursos, el consultorio recibe fichas recién leídas y actualiza sus estados sin esperar otra recarga.
- Los favoritos de recursos aceptan identificadores persistentes. La migración conserva el recurso elegido con el contrato anterior, incluso si su nombre interno coincide con otro UUID; evita duplicados y conserva la fecha del favorito más antiguo.
- El final del onboarding consulta el plan publicado actual después del consentimiento. Informa carga/error y permite reintentar; no deduce la existencia del plan fechado desde el menú antiguo de la ficha.
- Se incorporó la landing de pacientes ya publicada mediante PR #55. Se conserva su exportación estática y el destino público, junto con las rutas privadas de la app.

## Evidencia y límites actuales

El [CI del código funcional final `66c4fbf`](https://github.com/Facu42/plan-v/actions/runs/37318102587) aprobó **1358 pruebas, dos omitidas por configuración**, 237 archivos; TypeScript, build, auditoría de dependencias sin vulnerabilidades, migraciones y controles de secretos. Hay regresiones SQL sobre toda la cadena de migraciones, reapertura de una base temporal y conversión de favoritos desde el contrato anterior. Las pruebas separadas de sesiones reales usan conexiones independientes para comprobar conflictos de metas, publicación y análisis/revisión de comidas. Los cambios de documentación posteriores conservan los mismos archivos funcionales y SQL; antes de publicar se comprueban también los controles del commit final del PR.

El CI existente ejecuta un recorrido en gstack, sin capturas y con Auth/PostgREST/Storage/Supabase temporales, escritorio 1440 y celular 390. Docker de esta PC no dispone de un daemon operativo; se usa el runner temporal existente, sin crear proyectos hospedados ni ampliar Supabase.

Las revisiones independientes code-reviewer y reality-checker reprodujeron defectos de producto y del ensayo. El revisor de contratos revalidó por separado permisos, persistencia, invitaciones y publicación mediante el adaptador real de la API. En [CI de sesiones y recorrido completo de `66c4fbf`](https://github.com/Facu42/plan-v/actions/runs/37318109128) pasaron **24 pruebas con sesiones firmadas y 36 comprobaciones de navegador**: alta/invitación, consentimiento, ficha y meta; receta/plan publicados y borradores privados; comidas/hábitos, compras/favoritos, recursos y lectura; mensajes de ambos roles y descargas reales de adjuntos, fotos y estudios con denegación ajena; medidas/actividad, revisión profesional, turnos y pagos manuales; edición y archivo/restauración; nuevo ingreso, recuperación real de contraseña y corrección de ficha recibida por la profesional con regreso al plan publicado. Se usó el almacenamiento temporal real, no el adaptador de memoria. Los contenedores y datos ficticios se eliminaron al terminar.

**Límites del ensayo temporal:** la IA estuvo deshabilitada: sus 36 comprobaciones no prueban generación. La portada manual tenía pruebas SQL/HTTP y no se debilitó la condición HTTPS para hacer pasar ese ensayo. La aprobación, publicación, apertura HTTPS y recorrido real de IA gratuita se acreditaron después en el registro de producción enlazado arriba. Las fotos IA continúan pendientes; no se copian secretos ni se activa un proveedor pago.

Los endpoints, permisos y lecturas de comprobación de cada acción están en [recorridos y contratos](recorridos-y-contratos-plan-v-2026-10-05.md), junto con una guía breve para ambas cuentas ficticias.

## Paquete de cinco migraciones

1. 20261003172112_separate_nutrition_target_drafts.sql — separa borrador privado y meta confirmada.
2. 20261003172907_structured_menu_nutrition.sql — recetas propuestas, procedencia estimada, totales y contexto/versiones revisadas.
3. 20261003174117_manual_recipe_cover.sql — fotos manuales en el bucket existente.
4. 20261003231922_reopen_patient_intake.sql — corregir ficha enviada conservando permisos e historial privado disponible.
5. 20261005002314_harden_product_writes.sql — revisión de recetas/planes, título publicado, escrituras atómicas, reintentos sin duplicados y conversión de favoritos existentes.

La quinta responde a defectos reproducidos durante el cierre. El título anterior de cada versión se inicializa con el disponible: no se inventa historia perdida. Las cinco se ensayaron juntas. El [paquete de producción](paquete-produccion-pr54-2026-10-05.md) identifica sus SHA-256, configuración gratuita y comprobaciones posteriores. La lectura de migraciones mediante MCP del 5 de octubre confirmó que ninguna de estas cinco estaba aplicada; la última instalada era `20261002200418_harden_ai_job_execution`.

La regla 4 de [las reglas del proyecto](agentes/reglas-plan-v.md) exige: «Cualquier cambio en la base de producción, en la configuración de producción o en servicios pagos necesita antes el OK escrito de Facundo». Facundo aprobó el paquete concreto y se aplicó sin modificarlo; la aprobación y la publicación están registradas en el archivo de producción.
