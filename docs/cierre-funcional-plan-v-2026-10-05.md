# Cierre funcional de Plan V — 5 de octubre de 2026

Continuación del PR #54 (rama codex/nutrigo-producto-mcp). Conserva las 24 fuentes originales del MCP, los recursos, el español y el logo oficial. El comparador estático no demuestra persistencia del producto.

## Correcciones comprobadas localmente

- Recetas y planes usan una revisión de contenido distinta del número de versión. Dos editores sobre el mismo borrador no pueden sobrescribirse silenciosamente. La publicación exige el contenido revisado; el editor conserva datos ante un conflicto y ofrece recuperar lo guardado.
- El título y los ingredientes de una receta publicada se conservan al editar otra revisión. Se verifican receta asignada, favoritos, búsqueda, plan, registro de comida y texto alternativo de la foto.
- La IA captura en el servidor la revisión sobre la que propone. Ni los identificadores ni la revisión que devuelve el modelo pueden reemplazar esa base. Una edición posterior impide aplicar la propuesta antigua.
- Pagos y avisos manuales y actividad aceptan un identificador de operación. Repetir un pedido devuelve lo guardado; reutilizarlo con otros datos informa conflicto. La interfaz conserva el pedido incierto para reintentar y libera las correcciones cuando el servidor rechazó definitivamente los datos.
- Se cerraron escrituras directas que permitían eludir las comprobaciones de recetas/planes. La ficha visual y los ingredientes se guardan dentro de la misma transacción del borrador; la publicación antigua sin copia revisada ya no se ofrece a clientes.
- El botón principal del CRM abre el editor fechado que consume la paciente. Mantiene la paciente elegida. Mi ficha funciona como destino propio; el peso respeta su unidad y progreso se actualiza al registrar medidas. Hidratación usa el mismo máximo que el servidor.
- Recuperación de contraseña cuenta con pantalla para el enlace real de Auth, validación, guardado, salida y nuevo ingreso. Se corrigió una carrera al cargar la sesión inicial.

## Evidencia y límites actuales

Suite general: **1329 aprobadas, dos omitidas por configuración**, 235 archivos. TypeScript, build, controles de migraciones y secretos aprobados. Hay regresiones SQL sobre toda la cadena de migraciones y reapertura de una base temporal; esto no equivale a concurrencia en PostgreSQL con conexiones independientes.

El CI existente se amplía con un recorrido en gstack, sin capturas y con Auth/PostgREST/Supabase temporales, escritorio 1440 y celular 390. El guion todavía debe ejecutarse con éxito antes de atribuirle evidencia. Docker de esta PC no dispone de un daemon operativo; se usa el runner temporal existente, sin crear proyectos hospedados ni ampliar Supabase.

Las revisiones independientes code-reviewer y reality-checker reprodujeron los defectos anteriores. Sus verificaciones finales están en curso. No se declara terminado el producto sólo porque compila.

**Todavía pendientes de cierre:** resultado del recorrido de navegador en la base temporal, prueba real gratuita de texto, aprobación concreta de producción y recorrido final con las cuentas ficticias publicadas. La clave del proveedor existente sólo se devuelve como nombre por el conector; no se copian secretos ni se activa un proveedor pago. Las fotos IA continúan pendientes; las fotos manuales permanecen disponibles.

## Paquete de base: cinco migraciones, no cuatro

1. 20261003172112_separate_nutrition_target_drafts.sql — separa borrador privado y meta confirmada.
2. 20261003172907_structured_menu_nutrition.sql — recetas propuestas, procedencia estimada, totales y contexto/versiones revisadas.
3. 20261003174117_manual_recipe_cover.sql — fotos manuales en el bucket existente.
4. 20261003231922_reopen_patient_intake.sql — corregir ficha enviada conservando permisos e historial privado disponible.
5. 20261005002314_harden_product_writes.sql — revisión de recetas/planes, título publicado, escrituras atómicas y reintentos sin duplicados.

La quinta responde a defectos reproducidos durante el cierre. El título anterior de cada versión se inicializa con el disponible: no se inventa historia perdida. Las cinco se ensayan juntas y se presentan con el commit final antes de producción.

La regla 4 de [las reglas del proyecto](agentes/reglas-plan-v.md) exige: «Cualquier cambio en la base de producción, en la configuración de producción o en servicios pagos necesita antes el OK escrito de Facundo». Este registro no concede ese permiso. No se aplicó este paquete ni se fusionó el PR a main.
