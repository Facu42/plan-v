# Producto Plan V desde el código original de Nutrigo

Fecha: 3 de octubre de 2026. Rama `codex/nutrigo-producto-mcp`, creada desde `main` en `d976213`. Estado: implementación y revisión local; producción pendiente de aprobación concreta, despliegue y comprobación persistente. Este documento no declara terminado el producto.

## Referencia y presentación

Se reutilizaron las 24 respuestas completas ya obtenidas del MCP de Figma, correspondientes a doce vistas de escritorio y doce de celular. Su código original está conservado en `design/figma-reference/original/`, con correspondencia y hashes en `design/figma-reference/manifest.json`. Los 278 recursos SVG originales están en `src/features/nutrigo/assets/`, identificados y verificados en `design/figma-reference/source-assets.json`.

`scripts/build-nutrigo-source.mjs` convierte el código original a árboles locales de presentación. Conserva estructura, clases, recursos y valores originales; no depende del checkout anterior ni consulta imágenes. Las pruebas comparan hashes y clases contra cada respuesta original. No se tomaron capturas ni se reconstruyó el diseño mediante ajustes visuales. Las capturas mencionadas por documentación histórica no forman parte de este trabajo.

El nuevo frontend está en `src/features/nutrigo/`. Tailwind compila sus clases dentro de `.mcp-nutrigo`, sin aplicar preflight ni un reinicio global. Poppins se sirve desde los recursos locales existentes, con los pesos indicados por el código original. Las variantes se cargan por pantalla y medida, compartiendo el mismo controlador y sin duplicar peticiones. Se ensayan escritorio de 1440 y celular de 390; tablet sigue fuera del alcance.

Los nodos interactivos reciben semántica de botones, enlaces y formularios. Los valores de ejemplo se sustituyen por datos de la API o ausencia explícita de datos; las curvas de ejemplo no se presentan como evolución clínica. Se conservan estructura y clases originales, con textos en español y marca Plan V. Para estados, formularios y funciones que Figma no dibuja se añaden componentes accesibles usando sus colores y tipografía. El CRM, administración, autenticación y onboarding aprobado conservan las funciones existentes; no se generaron nuevas imágenes.

Los cambios locales del enfoque anterior siguen conservados y separados en `security-deployment`, rama `codex/nutrigo-fidelidad-completa`. No se incorporaron ni se publicaron automáticamente.

## Acciones, permisos y comprobación

Las autorizaciones de producción proceden de la sesión y de la relación con la paciente; `audience` sólo cambia vistas en la demostración. Todas las escrituras deben confirmarse antes de anunciar éxito. La demostración local utiliza datos ficticios en memoria y no acredita persistencia en Supabase.

| Recorrido | API y responsable | Resultado que se comprueba después de una nueva lectura |
|---|---|---|
| Corregir ficha enviada | Paciente propietaria: `POST /api/patients/:id/intake/reopen`, luego `PATCH …/intake` y envío con revisión esperada | Recupera los datos y consentimientos, permite corregir y conserva la versión anterior en historial privado. Una revisión vieja produce conflicto. |
| Inicio | Paciente: datos corporales, meta publicada, recetas asignadas, plan publicado, actividad y seguimiento | Sólo meta confirmada, medidas permitidas y comidas de la fecha real. Nutrientes disponibles muestran porción y procedencia; datos faltantes no se inventan. |
| Menú y receta | Paciente: `GET /api/patients/:id/recipes`; biblioteca y `POST …/favorites` | La receta conserva ingredientes, pasos y versión aprobada; el detalle escala cantidades por porciones. El favorito vuelve a aparecer en la biblioteca. |
| Plan y compras | Paciente: `GET /api/patients/:id/plans`, `GET …/shopping`; altas/marcas/bajas de compras | Fechas, recetas nuevas, porciones y notas públicas son las publicadas. Guardar otro borrador no cambia lo que recibe la paciente ni sus compras. |
| Diario y hábitos | Paciente: registro de comidas existente; `PATCH /api/patients/:id/habits` | Se conservan agua, descanso y registros. Los nutrientes pendientes de revisión no se presentan como confirmados. |
| Progreso y archivos | Paciente: `GET …/progress`, `GET …/care`, altas de medidas/documentos/fotos y apertura autorizada | Sólo registros compartidos y permitidos; errores conservan el formulario. El administrador del servicio no recibe datos de salud. |
| Agenda, mensajes, recursos y ejercicio | APIs existentes, con acciones detalladas en [pantallas secundarias](nutrigo-mcp-pantallas-secundarias.md) | Turnos y plan por fechas reales, confirmaciones, mensajes/adjuntos, favoritos, lecturas y actividad se vuelven a consultar. |
| CRM y cobros manuales | Profesional propietaria: pacientes, ficha, plan, invitación, archivo, pagos y deuda | Selección de paciente conservada. Aviso de pago y confirmación profesional se reflejan en deuda y estados; sin cobro automático. |
| Meta calórica | Profesional: `PUT /api/patients/:id/nutrition-target` con revisión esperada; paciente sólo lectura publicada | Borrador privado separado, publicación confirmada y conflicto ante una revisión anterior. El servidor y SQL recalculan la meta. |
| Propuesta IA y publicación | Profesional con acceso y consentimiento: jobs, aplicación privada, edición y publicación con versión y contenido revisado | Ingredientes y nutrientes se conservan; una estimación sigue identificada. Contexto/meta/consentimiento vencidos impiden aplicar o publicar. |
| Foto manual de receta | Profesional propietaria: `POST /api/recipes/:id/cover/manual` con versión y portada esperadas | Imagen inspeccionada y guardada en el bucket existente; conflicto no reemplaza una portada concurrente. No requiere un proveedor de imágenes. |

Contratos y ensayos detallados: [metas y fotos](metas-y-fotos-manuales-2026-10-03.md), [IA estructurada](ia-planes-estructurados-2026-10-03.md), [ficha, agenda e invitaciones](correcciones-ficha-agenda-invitaciones-2026-10-03.md). La matriz describe la implementación y cómo verificarla, no afirma que cada recorrido haya sido probado ya en producción.

## IA exclusivamente gratuita

El código sólo admite OpenRouter gratuito y fuerza precio máximo cero en cada petición. Una configuración heredada `AI_COST_MODE=paid` no habilita modelos pagos. Errores, falta de cupo y agotamiento permiten reintentar o trabajar manualmente, sin reemplazar la propuesta por datos ficticios.

Las recetas nuevas inline del menú son propuestas estimadas. La profesional puede corregir valores; el servidor conserva su procedencia. Las recetas con nutrientes declarados se incorporan desde el catálogo. Si se eliminan explícitamente los nutrientes, quedan ausentes: no se recuperan cifras antiguas para aparentar un ajuste. Calorías y macros se suman en el servidor; sólo se ajustan porciones cuando existen los datos necesarios y una meta confirmada, dentro de los límites permitidos.

La consulta del catálogo de OpenRouter no encontró una opción compatible gratuita de salida de imágenes. Esto no demuestra que ningún proveedor pueda ofrecerla: no hay uno comprobado e integrado. La generación de fotos sigue deshabilitada y pendiente; la alternativa implementada es subir fotos manualmente. No se activó Higgsfield ni otro servicio pago.

**Falta una generación real gratuita con las cuentas ficticias sobre la versión final.** Los tests con proveedor simulado validan contratos y controles, no disponibilidad o calidad de un modelo real. Railway expone los nombres de variables por MCP, sin una clave utilizable para un ensayo externo. No se solicitaron ni consumieron créditos pagos.

## Migraciones y publicación

Las cuatro migraciones preparadas son:

1. `20261003172112_separate_nutrition_target_drafts.sql`: separar borrador privado de meta publicada, conservar datos existentes sin inventar un historial y exigir revisión al guardar.
2. `20261003172907_structured_menu_nutrition.sql`: nutrientes, propuestas estructuradas, cálculo/lecturas/compras y guardas de procedencia, porciones y meta vigente.
3. `20261003174117_manual_recipe_cover.sql`: reemplazo manual de portada con controles de propiedad y concurrencia; usa el almacenamiento existente.
4. `20261003231922_reopen_patient_intake.sql`: reapertura explícita de la ficha propia con revisión esperada y copia exacta anterior en un historial privado. No reconstruye un historial perdido ni modifica consentimientos.

Supabase se consultó sólo para comprobar su estado: el paquete todavía no está instalado; en el momento de la consulta no había metas guardadas, y el bucket existente `recipe-covers` admite 5 MB. No se creó ni amplió almacenamiento.

Se ensaya la cadena completa en PGlite y se preparan pruebas de sesiones firmadas y concurrencia en el PostgreSQL temporal del CI existente. Docker local no está operativo; no se sustituye ese ensayo por una afirmación de concurrencia real basada en PGlite. No se crean proyectos, ramas remotas de Supabase ni recursos pagos.

El cambio reemplaza la antigua escritura de metas por una operación versionada: un cliente anterior que intente guardar sin revisión recibirá un error y deberá recargar. El despliegue debe coordinar SQL aprobado y frontend/API/worker del mismo commit. No corresponde revertir SQL eliminando datos publicados; ante un problema se detiene la publicación y se prepara una corrección conservando los registros.

La regla 4 de [las reglas del proyecto](agentes/reglas-plan-v.md) exige: «Cualquier cambio en la base de producción, en la configuración de producción o en servicios pagos necesita antes el OK escrito de Facundo». El paquete final se presentará con PR, migraciones exactas y comprobaciones antes de solicitar esa única aprobación. Todavía no se modificó producción.

## Revisiones y criterio de cierre

La [revisión de código](revision-codigo-producto-2026-10-03.md) reprodujo defectos de porciones y procedencia que no cubrían las pruebas anteriores. Las correcciones tienen regresiones por API y por RPC autorizada, incluyendo escritura directa y compras derivadas. La [revisión funcional](reality-check-nutrigo-producto-2026-10-03.md) identificó fallos de edición de ficha, agenda, notas públicas, nutrientes, navegación e invitaciones; se corrigen antes del cierre.

Las comprobaciones locales distinguen: hashes/clases originales, renderizado en ambos tamaños, acciones del navegador sin capturas, pruebas de API/SQL aislado y demostración en memoria. Ninguna acredita por sí sola todos los recorridos persistentes de producción.

## Comprobaciones finales del 4 de octubre

- Suite general: **1295 pruebas aprobadas y dos omitidas por configuración**, en 230 archivos. Se ejecutó `npm test -- --maxWorkers=2`: la ejecución sin límite agotó memoria en tres trabajadores de Windows; no se ignoraron esos errores. Se redujo la concurrencia y se ejecutó toda la suite con resultado correcto.
- TypeScript de frontend y servidor, build, controles de migraciones y secretos: aprobados. Auditoría de dependencias de producción: cero vulnerabilidades. El build conserva una advertencia de tamaño del bloque del consultorio (aproximadamente 629 kB antes de compresión); todavía admite optimización de carga.
- Se verifican las 24 fuentes y los 278 recursos por sus hashes, con atributos de Git que conservan sus bytes al recuperar el proyecto en Windows. Después de separar la validación de adjuntos del cliente HTTP para que el ensayo de servidor compile, volvieron a pasar las 31 pruebas focales de fuentes y reintentos y ambos chequeos de TypeScript.
- Código: revisión independiente cerrada, incluyendo las cuatro migraciones, fechas civiles, porciones, procedencia, reintentos y regreso desde detalles móviles. Revisión funcional: cerrada en el alcance ajeno a la implementación del revisor; las áreas de ese revisor tienen revisión separada de código. Los informes enlazados conservan los defectos iniciales y las comprobaciones de su corrección.
- Navegador, sin capturas: escritorio y celular sin desbordes en las nueve pantallas principales; se comprobaron detalles de receta y recursos y Compras. La flecha de semana muestra las indicaciones de la segunda semana; el detalle conserva la estimación y muestra 25 g para la porción ficticia asignada. El regreso móvil usa la flecha original.
- Ficha: se abrió la versión enviada con su botón real, conservó los datos y volvió a borrador; editar el nombre produjo una revisión nueva confirmada por la API local.
- Mensajes en celular: un PNG ficticio se subió una vez; se perdió intencionalmente la respuesta después de guardar y se reintentó el mismo contenido. Dos peticiones produjeron un solo mensaje y el mismo adjunto. El editor quedó bloqueado durante la operación y recuperó su disponibilidad al confirmar. Un rechazo anterior al envío permite corregir el archivo; su nombre se valida antes de subirlo.
- Compras en celular: respuesta perdida después de guardar, reintento con idéntico producto e identificador, un único producto guardado y marca de compra confirmada por nueva lectura. Los campos no permiten cambiar el contenido mientras el resultado sea incierto.
- Recursos: favorito conservado al volver a consultar, lectura de guía asignada confirmada por la API y lectura de guía pública sin crear una asignación ni producir un error. Todos estos registros son ficticios y viven en memoria local; no acreditan persistencia en Supabase.

El CI del PR debe ejecutar la suite general y, por separado, sesiones Supabase Auth/PostgREST firmadas y escrituras concurrentes sobre PostgreSQL temporal. Sus resultados deben consultarse para el commit del PR, antes de autorizar la publicación. No se reemplaza esta prueba por los ensayos SQL locales.

El [PR #54](https://github.com/Facu42/plan-v/pull/54) conserva el paquete en borrador. Los controles generales y secretos pasaron en `626b175` y `05f2911`. La primera prueba de sesiones aprobó 19 de 20 casos; el guardado simultáneo de metas excedió su límite. El diagnóstico siguiente confirmó un éxito y una petición abortada después de 12 segundos, con PostgreSQL en una transacción abortada esperando al cliente y sin bloqueadores. Esto sitúa la espera después del rechazo SQL; no acredita un deadlock ni reintentos del SDK. Se cambió el conflicto de revisión de `40001` a `PT409`, coherente con los conflictos de ficha, conservando los locks y el control de revisión. La API admite ambos códigos por compatibilidad. La regresión exige un éxito y un HTTP 409, revisión incrementada una sola vez, meta publicada intacta y rechazo secuencial de una revisión antigua tanto por RPC como por la API, sin cambiar datos. El resultado final de esta corrección debe comprobarse en el CI del commit revisado antes de publicar.

El commit `ed256a8` pasó [los controles generales](https://github.com/Facu42/plan-v/actions/runs/37177866143) y [los 20 casos de sesiones firmadas](https://github.com/Facu42/plan-v/actions/runs/37177868107). El conflicto simultáneo respondió en 6 ms con un éxito y un HTTP 409; el estado confirmó un único incremento de revisión y preservó la meta publicada. El intento secuencial por RPC y por API también recibió 409, sin cambiar el estado. Los recursos temporales y las identidades ficticias se eliminaron al terminar.

## Español y marca Plan V — ajuste del 4 de octubre

Facundo pidió que la app estuviera en español y mostrara Plan V con su logo. Las traducciones de la app funcional ya estaban aplicadas, pero la vista técnica local de comparación comenzaba mostrando el original en inglés. El comparador de la PC ahora abre una presentación de Plan V en español, con la referencia original oculta salvo que se elija mostrarla. La presentación no guarda datos; el modo «App funcional» abre la aplicación local de demostración. Al cambiar de pantalla o tamaño en ese modo, la herramienta conserva la aplicación abierta.

La app usa el archivo oficial existente `src/assets/plan-v-logo-256.png` en los 22 espacios de marca de las fuentes: conserva el contenedor de escritorio y celular y reemplaza el símbolo original. Las dos vistas móviles de detalle conservan su navegación de regreso sin agregar una cabecera nueva. El nombre visible es Plan V. El pie profesional y los pies de paciente muestran «© año Plan V», sin la palabra inglesa «Copyright». Las fuentes originales, sus JSON y los 278 recursos del MCP permanecen intactos; el cambio de logo es la adaptación de marca expresamente solicitada.

Pasaron nuevamente 1295 pruebas generales y dos omisiones por configuración, TypeScript y build. Las revisiones independientes de código y funcionamiento cerraron el ajuste. En navegador, sin capturas, se verificaron las 24 vistas de presentación en español, el recurso oficial cargado en los 22 espacios de marca y los dos detalles móviles sin logo. También se comprobó la app funcional navegando con sus botones en nueve pantallas de escritorio y las mismas nueve de celular, más Compras en celular y el consultorio: logo cargado, nombre Plan V, pies en español y sin desbordes en las pantallas principales. Los ensayos son locales con datos ficticios y no acreditan publicación ni persistencia de producción. El comparador y sus informes locales están en `.gstack/nutrigo-comparison`, fuera del producto.

El cierre requiere controles generales, TypeScript, build, migraciones, secretos, revisión final independiente, CI de sesiones firmadas, aprobación concreta, despliegue del mismo commit y recorrido persistente con ambos roles. Deben verificarse alta/invitación/onboarding, meta publicada, generación real gratuita, revisión/publicación/consulta, diario, compras, mensajes, turnos, archivos, favoritos, porciones y cobros manuales. Fotos IA sólo pueden declararse listas después de comprobar un proveedor gratuito; siguen pendientes.
