# Revisión de código del producto Nutrigo — 3 de octubre de 2026

## Continuación de la revisión — 5 de octubre

El revisor independiente de contratos revalidó las escrituras atómicas, aceptación concurrente de invitaciones, forma de la copia revisada del plan, asignaciones de recursos y favoritos. Detectó dos defectos en favoritos: un enlace ambiguo podía duplicar la fila; después de resolverlo, el cambio podía reinterpretar un nombre interno histórico como el UUID de otro recurso. Ambos se reprodujeron antes del arreglo y tienen regresiones de la cadena anterior → quinta migración.

La conversión final respeta el contrato anterior antes de activar la resolución por ID, evita choques de la clave única y conserva el registro más antiguo si encuentra duplicados existentes. El revisor aprobó **33 pruebas locales** y comprobó aparte colisiones cruzadas, título/fecha conservados, recetas intactas, eliminación de la tabla temporal y permisos sin ampliación. No ensayó solicitudes activas durante la aplicación de producción.

El cambio de onboarding en `66c4fbf` consulta el plan fechado publicado al terminar el ingreso y conserva carga, error y reintento. Su revisión funcional y de código es independiente de la implementación. El revisor de código comprobó permisos, efectos/cancelación y 16 pruebas locales; el revisor funcional confirmó después el recorrido real completo del CI. Los resultados finales y el paquete SQL están en [cierre funcional](cierre-funcional-plan-v-2026-10-05.md) y [paquete de producción](paquete-produccion-pr54-2026-10-05.md). La evidencia temporal no acredita generación real gratuita ni publicación; ambas siguen sujetas al cierre posterior a la aprobación.

## Revisión inicial y hallazgos históricos

Revisión independiente de sólo lectura del código en la rama `codex/nutrigo-producto-mcp`, comparado con `d976213` y con los archivos nuevos aún sin commit. Se leyeron `.claude/agents/code-reviewer.md`, las reglas del proyecto y sus registros. Se revisaron las cuatro migraciones nuevas, el manejo de metas, propuestas, nutrientes, fotos manuales, compras, reapertura de ficha y la integración de las pantallas construidas desde el archivo original.

**Revisión de código cerrada también al 4 de octubre, sin defectos reproducibles pendientes.** Los dos defectos iniciales, sus dos regresiones, el caso de nutrientes manuales en Inicio y el desplazamiento de fechas civiles en Progreso quedaron corregidos y verificados. Los reintentos de respuesta perdida de Mensajes/Compras y la regresión del nombre largo del adjunto también quedaron corregidos y verificados. No hubo cambios en producción, capturas, navegación ni llamadas a proveedores externos. Este informe es el único archivo escrito por esta revisión.

## Revalidación adicional — 4 de octubre de 2026

### Cierre acotado de marca Plan V e idioma

Se revisaron `branding.tsx`, su integración en `FramePair.tsx`, `translation.ts` y los pies de `FigmaPatientFront.tsx` y `NutrigoShowroom.tsx`. El enlace de marca usa el PNG oficial ya existente, conserva los contenedores originales `Logo` y `symbol` y sustituye el contenido del símbolo; el nombre se traduce a Plan V. El inventario de las 24 vistas contiene 22 espacios `Logo`, todos con un único `symbol`, compatibles con ese enlace. Los pies muestran `©` y Plan V, sin el texto inglés `Copyright`. El CSS generado añade únicamente la utilidad de ajuste de imagen dentro del ámbito de Nutrigo.

Pasaron **70 pruebas independientes en cuatro archivos**: contrato de fuentes, pantallas principales, pantallas secundarias y fidelidad de componentes. El contrato conserva los 278 recursos y sus hashes; el diff no modifica los archivos MCP originales ni los árboles JSON. No se encontraron defectos reproducibles en este ajuste. La comprobación visual y de navegación de las 24 vistas corresponde al hilo principal.

También se inspeccionó el comparador local ignorado por Git: su modo inicial muestra Plan V traducido con el logo, y la referencia original queda oculta hasta activar su control. Ese comparador no forma parte del producto. No se hicieron capturas ni cambios de producción.

### Cierre acotado del conflicto de revisión de metas

Se revisaron los cuatro archivos finales de metas: la migración `20261003172112_separate_nutrition_target_drafts.sql`, `server/targets/repository.ts`, `server/targets/postgres.integration.test.ts` y `server/security/signed-auth.local.test.ts`. La migración preparada usa `PT409` para la revisión vencida; el cambio conserva bloqueos, comparación de revisión, permisos y escrituras. El repositorio traduce `PT409` y el código anterior `40001` a HTTP 409. Pasaron **23 pruebas independientes en dos archivos** de metas PostgreSQL y flujo. No se encontraron nuevos defectos reproducibles en este cambio acotado.

El ensayo firmado usa dos clientes independientes con el JWT previamente emitido y validado por Auth, sin reintentos, para ejecutar las dos transacciones de PostgREST. Exige una escritura exitosa y un conflicto `PT409`/HTTP 409, incremento de revisión de uno, borrador ganador y meta confirmada intacta. Añade una solicitud obsoleta secuencial y la petición real **PUT de la API** con esa misma revisión vencida: exige HTTP 409 y el mensaje `La meta cambió en otra sesión. Recargala antes de guardar.` antes de comparar el estado completo sin cambios. Se comprobó en código que ese PUT atraviesa autenticación, autorización, contrato, cálculo en servidor y adaptador de base reales; no usa un mock del mapa de errores.

**CI real de Auth/PostgREST del cambio final: pendiente.** Las 23 pruebas locales y la inspección no sustituyen su ejecución. El fallo previo sigue registrado: la prueba original venció a los cinco segundos; el diagnóstico posterior informado por el coordinador obtuvo la lectura inicial en 8 ms, una escritura exitosa y el conflicto sin respuesta al vencer 12 s. PostgreSQL mostraba una transacción abortada esperando al cliente, sin bloqueadores. Esto sitúa esa espera después del error SQL, pero no demuestra por sí solo la causa interna de PostgREST. El cambio a un código de conflicto del producto debe confirmarse en el CI real, conservando sus aserciones y fallando si vuelve a vencer el plazo. No se modificó producción.

**Último ajuste móvil verificado:** las flechas originales de los detalles de Recursos y Recetas (`Button Nav` con `Icon/ArrowLeft`) ejecutan el regreso específico antes del enlace común de navegación. Recursos vuelve a su lista; la receta ejecuta `onBack` y conserva el texto accesible del contexto (menú o plan). El enlace sólo añade acción y etiqueta; conserva clases e icono originales. El título de Recursos muestra `Detalle del recurso`. Pasaron **35 pruebas independientes** de pantallas principales y secundarias con dos trabajadores; no aparecieron defectos nuevos. La revisión de código permanece cerrada.

Se revisaron `pending-write.ts`, `message-write.ts`, sus consumidores en Mensajes y Compras, la validación de adjuntos y los enlaces nuevos de Inicio/Diario. En el estado final pasaron **40 pruebas independientes en tres archivos**: `server/frontend-write-retry.integration.test.ts`, `primary-screens.test.tsx` y `secondary-screens.test.tsx`. Incluyen cinco regresiones de escrituras y preparación de adjuntos.

Las pruebas usan la API real en memoria y un archivo ficticio válido. Después de perder una respuesta de mensaje ya guardado, el reintento conserva el texto, identificador y adjunto preparados, sin otra subida ni otro mensaje. Compras conserva el producto y su identificador y confirma el reintento sin duplicarlo. Dos llamadas simultáneas comparten la misma operación. Los campos quedan bloqueados durante el envío y mientras hay un resultado incierto, y sólo se limpian al confirmar. Cerrar/reabrir el diálogo de Compras conserva su contenido dentro de esa pantalla. El ajuste final libera la operación de Mensajes cuando falla preparar el archivo antes de intentar escribir el mensaje; una reproducción independiente de archivo rechazado confirmó esa recuperación.

El botón de consulta de la comida publicada en Inicio navega a Mensajes y tiene cobertura con datos. El botón de chat del Diario móvil pertenece al encabezado de la tabla y está enlazado a Mensajes, conservando el original.

### Regresión del nombre largo del adjunto, corregida

**Corrección final verificada:** `assertChatFile` rechaza nombres vacíos o de más de 80 caracteres antes de reservar/subir el archivo. `createMessageWrite` vuelve a verificar el nombre devuelto por el adaptador antes de marcar iniciada la escritura del mensaje. El ensayo del nombre de 85 caracteres acredita que no se llama al envío, `pending` queda falso y el siguiente intento puede enviar el texto sin adjunto. Los rechazos previos al envío permiten corregir; una respuesta perdida después de escribir continúa conservando el mismo identificador, texto y archivo. Se conserva abajo la reproducción anterior al ajuste final.

Ubicaciones: `src/features/nutrigo/screens/message-write.ts:13`, `src/features/nutrigo/screens/Messages.tsx:44` y `Messages.tsx:63`. El estado pendiente se conserva después de cualquier intento de mensaje. `assertChatFile` admite un nombre largo y la subida lo devuelve intacto, pero `server/schemas.ts:124` limita `filename` a 80 caracteres. Un PNG válido con nombre de 85 caracteres se sube correctamente y luego recibe 400 del envío. La UI bloquea editar/quitar el adjunto y cada reintento conserva el mismo nombre rechazado.

**Reproducción independiente con API real en memoria:** reserva 201, contenido 200, finalización 200, dos intentos de mensaje 400; una sola subida, `pending: true`, cero mensajes guardados. El segundo intento sin archivo conservó el nombre original de 85 caracteres y volvió a fallar. Es un rechazo confirmado; no se perdió ninguna respuesta en este ensayo.

**Corrección sugerida:** validar o normalizar el nombre antes de iniciar la escritura, conforme al límite de 80 de la API. Añadir ese caso al ensayo de reintentos para confirmar que el mensaje se puede enviar o corregir sin quedar bloqueado.

## Ronda final de funcionalidad, permisos y persistencia

Se revisaron la ruta de reapertura de ficha, el adaptador HTTP/RPC, la memoria y el historial privado; la cuarta migración; el manejo de recuperación en onboarding; los estados de invitaciones; el modelo de turnos; Agenda y Diario; las correcciones finales de Inicio; los controles de Mensajes, calorías del menú, categorías y lectura de Recursos y la eliminación de paginación ficticia de Ejercicio.

Pasaron **103 pruebas independientes en 13 archivos**: `server/intake/reopen.postgres.test.ts`, `server/intake/reopen.integration.test.ts`, `server/intake/intake.test.ts`, `server/intake/postgres.integration.test.ts`, `server/intake-supabase.integration.test.ts`, `src/components/nutrigo/showroom-onboarding.test.tsx`, `src/components/nutrigo/showroom-onboarding.test.ts`, `src/components/nutrigo/intake-session.test.ts`, `src/components/nutrigo/patient-invite-actions.test.tsx`, `src/features/nutrigo/screens/agenda-data.test.ts`, `src/features/nutrigo/screens/secondary-screens.test.tsx`, `src/features/nutrigo/screens/primary-screens.test.tsx` y `server/security/definer-grants.postgres.test.ts`.

La reapertura exige paciente propia y revisión vigente, bloquea la fila antes de conservar la versión enviada/revisada y produce un borrador que requiere nuevo envío/revisión. Las llamadas públicas y directas al helper privado deniegan paciente ajena, profesional, administrador y anónimo. El historial no se devuelve por HTTP ni se puede leer con esos roles; el ensayo de persistencia conserva historial y datos al reabrir la base. Consentimiento retirado no se vuelve a conceder al reabrir. Las solicitudes obsoletas no modifican la versión nueva.

Agenda usa las fechas del plan publicado y el instante `starts_at` del turno, sin mover una consulta vencida a otra semana; el ensayo conserva día/hora de Argentina bajo UTC, Tokio y Los Ángeles. El Diario informa la cantidad real cargada. El alta conserva la ficha si falla activar la invitación, y sólo ofrece compartir un enlace confirmado y vigente. Recursos marca lectura únicamente en asignaciones presentes; las guías del catálogo pueden leerse y guardarse sin anunciar una asignación nueva.

### Desplazamiento de fechas civiles en Progreso, corregido

**Corrección final verificada:** `date-label.ts` distingue fechas civiles de timestamps, conserva las fechas civiles usando UTC y devuelve el texto original cuando la fecha es inválida. `shared.tsx` lo reexporta para los consumidores existentes de Progreso. Plan pasa sus fechas civiles directamente, sin añadir un instante artificial. Pasaron **44 pruebas independientes en tres archivos** (`date-label.test.ts`, `source-contract.test.ts` y `primary-screens.test.tsx`), incluidos procesos separados bajo Argentina, Los Ángeles y Tokio. La fecha `2026-10-03` conserva el 3 de octubre en esas zonas y los timestamps siguen reflejando el instante en la zona local.

También se revisó el regreso desde una receta abierta en Plan: el botón muestra **Volver al plan** y mantiene el estado de la semana al cerrar el detalle. La verificación de recursos originales conserva las mismas comprobaciones de tamaño/hash, procesadas en lotes de 16 con un plazo mayor para la lectura local; no se eliminó ninguna comprobación. Se conserva abajo la reproducción anterior a la corrección.

Ubicación: `src/features/nutrigo/screens/shared.tsx:16`, utilizada para las fechas civiles en `Progress.tsx:27`, `Progress.tsx:33`, `Progress.tsx:34` y `Progress.tsx:40`. `dateLabel` convierte `YYYY-MM-DD` en medianoche UTC mediante `new Date(value)` y después la formatea en la zona del dispositivo. En Argentina eso presenta el día anterior al guardado en `captured_on`, `recorded_on` y `journey.days.date`. Afecta gráfico/tabla de medidas, fotos y hábitos.

**Comprobación independiente:** se extrajo y ejecutó el helper exacto del archivo. Para una fecha civil guardada `2026-10-03` devolvió `2/10/2026` bajo `America/Argentina/Buenos_Aires` y `America/Los_Angeles`, y `3/10/2026` bajo UTC. Las pruebas actuales usan datos ausentes para las medidas y no afirman las fechas visibles de los hábitos, por lo que aprobaron sin detectar el desplazamiento.

**Corrección sugerida:** distinguir fecha civil de instante. Formatear `YYYY-MM-DD` conservando sus componentes (o con zona UTC) y mantener el formato de timestamps por separado. Añadir un caso con medidas, fotos y hábitos fechados bajo Argentina y otra zona del dispositivo.

## Revisión acotada de Inicio, Plan y navegación

Se revisaron exclusivamente los cambios estables de `Home.tsx`, `Plan.tsx` y `FramePair.tsx`. Pasaron **12 pruebas** de `primary-screens.test.tsx`. Las notas públicas aparecen en una sección visible; las flechas originales del plan están enlazadas al estado semanal y deshabilitadas en los extremos; el logo conserva su estructura y sólo traduce el nombre.

**Caso de Inicio corregido y verificado:** el enlace usa `recipe.nutrition?.per_portion ?? recipe.card?.macros`, acepta cifras parciales y la procedencia reconoce nutrientes declarados disponibles. Las pruebas finales cubren este caso. Se conserva abajo la descripción anterior a la corrección: `Home.tsx` entregaba únicamente `recipe.nutrition` a `nutrientBinding` para recomendaciones. Las recetas manuales y anteriores a este cambio contienen nutrientes declarados en `recipe.card.macros` y carecen de `recipe.nutrition` (la lectura de recetas asignadas conserva esa forma). En consecuencia, Inicio mostraba guiones y podía etiquetarlas como nutrientes no disponibles, aunque el catálogo y el detalle sí mostraban sus valores.

**Comprobación:** se ejecutó la función exacta de enlace del archivo con una receta publicada cuyo `card.macros.kcal` es 777 y cuyo `nutrition` no existe; el valor generado para `Info Cal` fue `—`. El caso nuevo de las pruebas sólo usa una receta de IA con `nutrition` presente. La corrección debe resolver el mismo fallback que utiliza el menú (`nutrition.per_portion` y luego `card.macros`), respetar valores parciales y mostrar procedencia declarada cuando corresponda.

## Revalidación del estado final solicitado

Se revisaron los contratos de porciones, `retainProposalEstimate`, el repositorio de planes, las guardas y el guardado SQL final, además de `provider.ts`, `cost-policy.ts` y `recipe-cover.ts`.

Se ejecutaron **75 pruebas aprobadas en seis archivos**: `server/ai/structured-menu.postgres.test.ts`, `server/plans/flow.integration.test.ts`, `server/ai-eval/evaluate.test.ts`, `server/plans/plans.test.ts`, `server/ai/provider.test.ts` y `server/ai/recipe-cover.test.ts`. Las pruebas verifican que no se acepten propuestas sin porciones, que edición/nueva versión/escritura directa no conviertan una estimación en declarada y que las cifras corregidas se conserven.

El proveedor final admite exclusivamente `openrouter/free` o nombres `:free`, fuerza precios máximos cero en la salida HTTP y no tiene alternativa de OpenAI directo ni opt-in pago por configuración. Las fotos de IA permanecen deshabilitadas. No se encontraron otros defectos reproducibles en esos cambios. Esta comprobación de código y proveedor simulado no acredita la disponibilidad de un modelo gratuito real.

### Regresión 1, corregida: incompatibilidad del acceso al último elemento

**Corrección confirmada:** el repositorio usa `previousVersions[previousVersions.length - 1]`, sin `.at`, y comprueba la longitud antes del acceso. Se conserva abajo el error anterior como evidencia. El control TypeScript global se repetirá en el hilo principal al terminar los demás cambios funcionales.

Ubicación: `server/plans/repository.ts:289`. La corrección usa `planVersions(existing.id).at(-1)`, pero el proyecto no incluye `Array.prototype.at` en su biblioteca de TypeScript.

**Comprobación:** `npm run check` finalizó con código 1 y `TS2550: Property 'at' does not exist on type 'MemVersion[]'`. Usar un acceso compatible, como el empleado antes en este mismo trabajo, permite conservar el comportamiento sin cambiar las bibliotecas objetivo.

### Regresión 2, corregida: recuperación de cifras ante ausencia explícita de nutrientes

**Corrección verificada:** TypeScript y SQL conservan `nutrition: null`, sin recuperar cifras anteriores. Pasaron **10 pruebas en dos archivos** (`server/ai/structured-menu.postgres.test.ts` y `server/plans/flow.integration.test.ts`), incluido el caso SQL de 400 g con nutrientes no disponibles. Una reproducción independiente del helper y el resumen devolvió `saved_nutrition: null`, `status: missing_nutrients` y `totals: null`. Se conserva abajo la reproducción anterior a esta última corrección.

Ubicaciones: `src/types/ai-nutrition.ts:35` y `supabase/migrations/20261003172907_structured_menu_nutrition.sql:83`.

La nueva conservación de procedencia usa la nutrición antigua cuando la propuesta editada contiene `nutrition: null`. Eso restaura también sus números, aunque se haya cambiado la composición de la receta. `null` es un valor admitido que expresa que los nutrientes no están disponibles; el guardado lo convierte silenciosamente en cifras disponibles.

**Comprobación independiente:** una receta inline con 100 g de arroz y estimación de 500 kcal fue editada a 400 g de arroz con `nutrition: null`. Tanto `retainProposalEstimate` como el RPC autorizado `save_meal_plan_draft`, ensayado con todas las migraciones en PGlite, devolvieron los 500 kcal antiguos. El resumen contra una meta de 500 kcal marcó `adjusted`, cuando debía mostrar `missing_nutrients` y ningún total completo.

**Corrección sugerida:** mantener `nutrition: null` cuando se envíe expresamente, sin recuperar números. Cuando existan nutrientes, conservar la normalización de toda propuesta inline a `ai_estimate` y la fuente anterior aplicable. Añadir casos de edición a `null` en memoria, RPC y escritura directa, verificando que el resumen permanece incompleto. La procedencia puede conservarse por separado si hace falta conservar historia sin cifras disponibles.

## 1. Una receta nueva dentro del menú puede publicarse sin porciones

**Hallazgo inicial corregido y verificado.** Se conserva abajo la reproducción anterior a la corrección. El contrato, la evaluación, la escritura en memoria, la validación SQL y la escritura directa ahora requieren porciones positivas para propuestas inline.

Ubicaciones: `src/types/plans.ts:46`, `server/ai-eval/evaluate.ts:179`, `supabase/migrations/20261003172907_structured_menu_nutrition.sql:99` y `src/features/nutrigo/screens/Menu.tsx:16`.

El contrato nuevo admite `recipe_proposal` pero conserva `portions` opcional. La evaluación de publicación considera receta sólo cuando hay `recipe_id` o `recipe`, por lo que omite la propuesta inline al exigir porciones. La nueva validación SQL tampoco añade esa exigencia. Desde el editor se puede vaciar el campo de porciones, guardar y publicar una propuesta.

El resultado es contradictorio: el detalle de la paciente toma el rinde completo como porciones cuando no hay una cantidad asignada, mientras las compras suponen una porción. Con una receta de 100 g de arroz que rinde dos porciones, el detalle muestra los 100 g y las compras guardan 50 g. El resumen nutricional queda incompleto, pero no impide la publicación.

**Comprobación:** el contrato TypeScript aceptó la propuesta sin `portions` y la evaluación devolvió cero impedimentos. En PGlite se ejecutó la cadena completa de migraciones, con profesional y paciente ficticias bajo el rol `authenticated`; `save_meal_plan_draft` y `publish_meal_plan` finalizaron correctamente. La lectura de la paciente devolvió `portions: null`, `yield_portions: 2` y las compras `quantity: 50` para los 100 g originales.

**Corrección sugerida:** exigir porciones positivas para propuestas inline en el contrato, la evaluación y SQL, igual que para las recetas del catálogo. Añadir un caso que intente guardar/publicar después de vaciar ese campo y verificar que detalle y compras usan la misma cantidad asignada.

## 2. Editar un menú permite convertir una estimación de IA en nutrientes declarados

**Hallazgo inicial corregido y verificado.** Se conserva abajo la reproducción anterior a la corrección. Las propuestas inline con nutrientes se normalizan a estimaciones, incluso si cambia el título o el momento, y se conserva su fuente al editar; los nutrientes declarados se incorporan mediante el catálogo.

Ubicación: `supabase/migrations/20261003172907_structured_menu_nutrition.sql:121` y el guardado de propuestas de esa migración en la línea 223. El equivalente en memoria es `server/plans/repository.ts:313`.

La guarda nueva conserva `origin: ai_estimate` y su fuente al editar `recipe_versions`, pero para `meal_plan_items` sólo valida la forma de la propuesta. El guardado del menú recibe una receta inline ya existente con `origin: declared` y otra fuente, elimina/recrea sus elementos y conserva la nueva etiqueta enviada. Así se pierde la procedencia que el producto afirma conservar durante la edición y publicación.

**Comprobación:** después de publicar un menú con `origin: ai_estimate` y `source: estimacion_ia.v2`, una llamada autorizada a `save_meal_plan_draft` con la misma receta, fecha y momento, pero `origin: declared` y `source: Revisado`, creó el siguiente borrador con `origin: declared` y `source: Revisado`. Se ejecutó contra todas las migraciones en PGlite bajo una sesión ficticia de la profesional. No requiere privilegios de administrador ni escribir tablas directamente. El contrato HTTP permite esos mismos valores.

**Corrección sugerida:** conservar en el servidor la procedencia de la propuesta existente antes de reemplazar sus elementos, bajo el bloqueo del plan; no confiar exclusivamente en la etiqueta enviada por el cliente. La profesional debe poder corregir cantidades y nutrientes sin transformar una estimación en medición. Probar la edición del borrador y la creación de una nueva revisión a partir de un menú publicado, tanto por API como por RPC autorizado.

## Alcance de la comprobación

La separación de borrador/meta confirmada, la comparación de revisiones, los bloqueos de metas y menús, las funciones base sin ejecución pública, la inspección de fotos y su comparación de versión/portada tienen controles explícitos. Los casos anteriores no estaban cubiertos por las pruebas generales reportadas por el hilo principal.

Las reproducciones fueron locales y aisladas. PGlite acredita los resultados SQL indicados; no acredita contención real entre sesiones de PostgreSQL ni una subida real a Storage. La verificación real del proveedor gratuito, el navegador sin capturas y los servicios publicados pertenece al hilo principal. La política final de IA gratuita fue revisada en código y con el proveedor simulado como se detalla arriba.
