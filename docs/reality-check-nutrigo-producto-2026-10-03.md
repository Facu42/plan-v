# Revisión funcional independiente de Nutrigo — 2026-10-03

## Cierre del ensayo temporal — 5 de octubre

El revisor funcional confirmó independientemente [CI 37318109128](https://github.com/Facu42/plan-v/actions/runs/37318109128), commit `66c4fbf`: **24/24 pruebas de sesiones aprobadas y recorrido de navegador completo**. La evidencia acredita persistencia entre ambos roles con Auth, PostgREST y Storage reales temporales, incluida descarga de los bytes guardados y denegación de acceso ajeno. También aprobó sus 12 pruebas focales de onboarding, ficha y contraseña.

Durante el recorrido detectó un P2: el final del onboarding infería la existencia del plan fechado desde el menú antiguo de la ficha. El código final consulta exclusivamente el plan publicado al llegar a la etapa lista, mantiene carga/error/reintento y cancela respuestas anteriores. El navegador comprobó nuevo ingreso y recuperación real de contraseña, ficha corregida recibida por la profesional y regreso al plan publicado. El revisor no encontró otro bloqueo concreto en ese arreglo. La revisión de código separada aprobó 16 pruebas focales y el control de efectos/permisos.

**Ensayo temporal completo; producción y generación gratuita real pendientes.** La IA estuvo deshabilitada durante esta ejecución. No se aplicó SQL de producción, no se publicaron servicios ni se tomaron capturas. La foto manual pública HTTPS también se comprueba después de la aprobación. El [registro de cierre](cierre-funcional-plan-v-2026-10-05.md) contiene las 36 comprobaciones de navegador y las 1358 pruebas generales; el [paquete concreto](paquete-produccion-pr54-2026-10-05.md) presenta las cinco migraciones y configuración para aprobación.

## Estado inicial y hallazgos históricos

Estado al 3 de octubre: **requiere correcciones y validación real antes de publicar**. El frontend original del MCP estaba integrado, pero los recorridos acordados todavía no permitían afirmar que el producto estaba terminado. Un PR en borrador representa trabajo para revisar; no certifica funcionamiento en producción.

Revisión del rol `reality-checker` en la rama `codex/nutrigo-producto-mcp`. Se leyeron las reglas del proyecto y el código de las superficies de paciente, CRM, ingreso, invitaciones, planes, IA, mensajes, compras, seguimiento y cobranzas. Se revisaron fuente y resultados de pruebas. La instrucción del usuario de no tomar capturas prevalece sobre la plantilla genérica del agente: se usaron el código original, comprobaciones del DOM y pruebas. No se abrió otro navegador ni se modificó código del producto. Las metas y fotos manuales, implementadas por este mismo agente, quedan fuera de su revisión independiente; su evidencia y límites están en `docs/metas-y-fotos-manuales-2026-10-03.md`.

## Evidencia comprobada

- Se volvieron a ejecutar las tres suites del nuevo frontend: **53 pruebas aprobadas**. Ver `.gstack/reality-existing-frontend-results.json`. Verifican 24 fuentes originales, 278 recursos locales, sus hashes y clases, y contenido representativo en ambas versiones.
- Se leyó `.gstack/product-tests.log`: la ejecución general del hilo principal registra **1256 pruebas aprobadas, 2 omitidas, 224 archivos aprobados**. Es una ejecución del hilo principal, no una segunda ejecución general de este revisor.
- Se leyó `.gstack/product-build.log`: build aprobado. Conserva el aviso de algunos paquetes mayores de 500 kB; eso no demuestra por sí mismo un problema de carga real.
- Se leyó `.gstack/product-browser-evidence.json`: nueve pantallas principales visitadas por el hilo principal en escritorio y celular, con desbordamiento y botones anidados igual a cero. No incluye las visitas a Compras ni a ambos detalles. Las pruebas de servidor de React sí incluyen contenido de esas vistas, pero no prueban sus clics reales.
- El hilo principal informó que guardar cinco vasos en la API demo y cambiar de pantalla mantuvo el dato. Eso comprueba el recorrido local; no prueba persistencia en Supabase después de reiniciar, ni el mismo recorrido en producción.
- Se preparó una prueba diagnóstica aislada, fuera de las suites del producto: `.gstack/reality-functional.audit.tsx`, ejecutada con `.gstack/reality-functional.config.ts`. **Diez comprobaciones fallan sobre once** porque reproducen los defectos descritos abajo; una confirma la reanudación de una ficha enviada en la pantalla final. Resultado: `.gstack/reality-functional-results.json`. No se incluyó este diagnóstico en `npm test` ni se cambió la suite aprobada.

Los hashes originales y el DOM comprueban la procedencia del frontend y su estructura en las medidas ensayadas. No prueban que cada dato o acción esté correctamente conectado. Las reproducciones siguientes usan exclusivamente datos ficticios.

## Fallos concretos

### RC-01 — P1: «Editar mi ficha inicial» no permite corregir una ficha enviada

`src/features/nutrigo/PatientApp.tsx:49` abre el onboarding actual. Al recuperar una ficha enviada o revisada, `src/components/nutrigo/showroom-onboarding.ts:145` devuelve la pantalla `ready`; `ShowroomPatientOnboarding.tsx:129` aplica ese resultado. En esa pantalla no hay campos de edición y su pie excluye el botón Atrás (`ShowroomPatientOnboarding.tsx:382`). Sólo permite cerrar o entrar a la app.

Consecuencia: después del primer envío, el nuevo botón de edición no permite corregir nombre, alergias, restricciones ni preferencias. La promesa del botón y del plan aprobado queda incumplida. Hace falta un recorrido explícito de edición de la ficha existente, con su revisión y guardado, sin crear un ingreso ficticio ni perder los datos anteriores. La comprobación diagnóstica confirma la reanudación en `ready`; la ausencia de salida hacia edición está comprobada por código.

### RC-02 — P2: Agenda no consulta el plan publicado por fecha

`src/features/nutrigo/screens/Agenda.tsx:26` genera las comidas desde `patient.weekPlan` y les asigna fechas de la semana actual. Ese campo proviene de la antigua plantilla recurrente de `meal_slots` (`server/db/supabase-repo.ts:265`, agrupación en la línea 287). Inicio y Plan ya consultan el plan fechado publicado; Agenda no lo hace.

Reproducción: un plan publicado con una comida para el 03/10/2026 y una plantilla antigua vacía aparece en Plan, pero la comida no aparece en Agenda. Si existe una plantilla antigua, puede mostrar indicaciones distintas de la versión aprobada. El diagnóstico falla en escritorio y celular. Agenda necesita el mismo plan publicado, con sus fechas reales; cualquier soporte de la plantilla antigua debe ser explícito y no sustituir silenciosamente el plan fechado.

### RC-03 — P2: el turno pierde su fecha absoluta y puede cambiar de día según el dispositivo

`src/components/nutrigo/showroom-model.ts:29` descarta `appointment.starts_at` al convertir la respuesta para la nueva UI. `Agenda.tsx:12` y la línea 27 reconstruyen la próxima semana a partir del texto «día · hora», usando la zona horaria del dispositivo, aunque el backend devuelve fecha absoluta y zona horaria.

Reproducción: consulta del lunes 05/10 a las 00:30 de Argentina. En un dispositivo con UTC, el cálculo se convierte al domingo 04/10 al obtener el día de Argentina. Dos comprobaciones diagnósticas fallan: el adaptador pierde la fecha absoluta, y el calendario obtiene el día anterior. Debe conservarse `starts_at`, usarlo como fuente y aplicar una zona coherente al calendario y las etiquetas. El turno guardado no debe volver a calcularse en el navegador.

### RC-04 — P2: Plan omite las notas públicas de la versión aprobada

`src/features/nutrigo/screens/Plan.tsx:28` construye la tabla con título y fecha; las celdas y el bloque de Colación/Extra no muestran `public_note`. El detalle de receta tampoco recibe esa nota. La profesional sí la conserva en el modelo, en la propuesta y en la publicación.

Reproducción: una indicación publicada contiene título y una nota pública identificable. El título aparece y la nota desaparece en escritorio y celular. Dos comprobaciones diagnósticas fallan. Hace falta mostrar la indicación completa que la profesional aprobó, incluyendo notas y porciones, en la celda o su detalle accesible.

### RC-05 — P2: Inicio omite nutrientes disponibles en las recetas recomendadas

`src/features/nutrigo/screens/Home.tsx:55` cambia título, foto y navegación de las recomendaciones, pero no conecta sus valores nutricionales ni su procedencia. El traductor oculta las cifras del ejemplo como «—», incluso cuando la respuesta de la receta contiene nutrientes válidos. El bloque de comidas del día en la línea 67 tampoco conecta nutrientes/porciones.

Reproducción: receta asignada con 777 kcal por porción. Su nombre aparece en la recomendación y el valor no aparece; falla en ambas medidas. Esto es ausencia de un dato conocido, no exposición de una cifra inventada: el traductor neutraliza los valores originales. Hace falta conectar los valores disponibles con su porción y procedencia, y mantener «sin datos» únicamente cuando no haya evidencia.

### RC-06 — P2: sobreviven controles de período y paginación sin su acción

Las flechas originales del plan son `Button Picker` de los nodos `89:3846` y `89:3878`. `Plan.tsx` no las conecta; `FramePair.tsx:43` sólo resuelve los iconos llamados `Button Icon` o `Button More`. Esas flechas permanecen como contenedores decorativos, aunque se agregaron otros botones para avanzar semana. El diagnóstico de controles activables falla.

Diario conserva el bloque original `Pagination` (`105:2649`, nodo `141:3603`) con sus páginas y botones de ejemplo. `Diary.tsx` no lo reemplaza ni lo oculta; las páginas se traducen a «—» y las flechas genéricas abren navegación mediante `FramePair`, en vez de cambiar página. La comprobación de paginación decorativa también falla. Hay que conectar los controles originales al período/listado real o reemplazar ese bloque completo por un estado coherente con la cantidad cargada. No basta con añadir un segundo control separado.

### RC-07 — P2: una falla al preparar la invitación se presenta como invitación lista

En `src/components/nutrigo/ShowroomPatients.tsx:83`, un alta crea primero la ficha y después activa la ventana de invitación. Si falla la segunda operación, el `catch` descarta el error y en la línea 87 continúa al mismo resultado. `InviteShare` muestra incondicionalmente «Invitación lista» y «Vence en 7 días» (línea 54).

La base crea inicialmente una invitación `not_sent` (`server/db/supabase-repo.ts:887`); la activación cambia a `pending` y establece el vencimiento (línea 928). Por lo tanto, una ficha puede estar correctamente creada pero el enlace mostrado todavía no estar habilitado. Esto está comprobado por el recorrido del código, no por una falla real del servicio. Se debe mantener la ficha creada, informar que falta preparar su acceso y permitir reintentar; mostrar enlace listo sólo cuando se confirme estado y vencimiento.

## Alcance revisado y límites

| Área | Conexión encontrada | Evidencia y pendiente |
|---|---|---|
| Autenticación e invitación | Sesión Supabase, roles, aceptación legal, invitación vinculada al email; demo excluida de builds de producción | Código y pruebas existentes. Falta el recorrido real de registro/recuperación/invitación con la versión nueva. RC-01 y RC-07 son fallos del flujo visible. |
| CRM | Accesos a Pacientes, Ficha y Plan; selección conservada; creación, edición y archivo llaman la API | Se conserva el CRM existente con sus controles. No se detectó una nueva exposición entre consultorios en lo revisado; eso no sustituye la prueba real con cuentas aisladas. |
| Planes e IA | Propuesta privada, edición, revisión, publicación con versión y contenido esperado; cálculo de totales en servidor, origen estimado conservado | Pruebas del dominio y SQL preparadas. RC-02 y RC-04 rompen la consulta coherente desde paciente. Falta una generación gratuita real y publicar exactamente esa revisión en el entorno final. |
| Diario y hábitos | Registro de comidas, agua y descanso contra API; cargas pendientes no se presentan como nutrientes revisados | SSR y prueba demo informada. Falta recarga completa y persistencia real; RC-06 afecta controles de listado. |
| Compras, favoritos y recursos | API de compras; favoritos persistidos; biblioteca publicada; secciones del recurso reemplazan el ejemplo | SSR aprobado. Faltan clics, guardado y recarga reales de Compras y detalles en ambas medidas. |
| Mensajes y agenda | Hilo del paciente, adjuntos con permiso, confirmación/cambio de turno y enlace de videollamada | SSR y suites del backend. Faltan dos sesiones reales, comprobantes y adjuntos después de recargar. RC-02/03 afectan fechas y comidas de Agenda. |
| Medidas y archivos | API de seguimiento, medidas compartidas y apertura de fotos privadas con autorización | La UI no inventa fases de sueño ni calorías de actividad. Falta probar acceso real, retiro de permiso y apertura de archivos desde celular. |
| Cobranzas y servicio | Aviso de pago manual, confirmación profesional, cuotas/deuda y panel administrativo existente | Las acciones llaman endpoints reales y el administrador usa una superficie separada. Falta el recorrido real de aviso → confirmación → deuda recalculada y prueba de aislamiento de datos de salud. |

No se cuentan como fallos los datos de muestra que el traductor oculta ni las curvas de ejemplo que Inicio neutraliza. Tampoco se exige tablet ni generación de nuevas imágenes: ambas quedan fuera del alcance acordado.

## Condiciones pendientes para producción

1. Corregir los siete hallazgos y volver a ejecutar las reproducciones relevantes como pruebas de regresión del producto.
2. Preparar la aprobación concreta y aplicar las tres migraciones de esta rama: `20261003172112_separate_nutrition_target_drafts.sql`, `20261003172907_structured_menu_nutrition.sql`, `20261003174117_manual_recipe_cover.sql`. Esta revisión no aplicó SQL de producción. Comprobar también el consentimiento requerido para el recorrido real.
3. Ensayar concurrencia, bloqueo y sesiones firmadas sobre PostgreSQL real temporal/local o CI. PGlite comprueba las funciones y permisos ensayados; no prueba contención entre conexiones reales. No hay un PostgreSQL/Docker operativo disponible en esta PC para ese ensayo, según el cierre focal previo.
4. Hacer una generación real gratuita con cuentas y datos ficticios y comprobar revisión, edición y publicación. La política del código impone modelos gratuitos y un techo de precio cero, sin alternativa paga; el catálogo consultado no demuestra que una solicitud completa de salida estructurada llegue a completarse. El acceso MCP a Railway mostró nombres de variables, no una clave utilizable por este revisor. No se usaron créditos pagos.
5. Ejecutar el recorrido completo con ambos roles sobre datos persistentes, recarga completa, archivos y permisos, pagos y fallos de proveedor. Completar la verificación DOM de Compras y detalles. Las pruebas locales y la demo no reemplazan este punto.
6. Completar la revisión de código, PR y autorización de producción, y verificar el mismo commit en Vercel, API y worker.

Las fotos generadas por IA siguen **pendientes**: no hay un proveedor gratuito comprobado. La subida manual es el comportamiento implementado sin un proveedor pago y debe ensayarse con el almacenamiento existente después de la migración. Este informe no la certifica de forma independiente.

## Estado de implementación posterior a la revisión inicial

Se conserva íntegramente el informe inicial como evidencia del diagnóstico. Este apartado registra cambios de implementación del mismo agente; **no constituye una revisión independiente final**.

- RC-01: se agregó reapertura explícita por la paciente con revisión esperada, recuperación del contenido y consentimiento existente, y conservación exacta de la versión enviada/revisada en historial privado. La nueva migración `20261003231922_reopen_patient_intake.sql` se creó mediante Supabase CLI y se ensayó con toda la cadena. No fue aplicada a producción. El paquete pendiente de aprobación ahora contiene cuatro migraciones.
- RC-02/03: Agenda consulta el plan publicado fechado; conserva `starts_at` y `timezone` en la vista de paciente; utiliza el instante almacenado y fechas de Argentina sin depender del huso del dispositivo. Sólo los turnos legacy/demo sin instante conservan el cálculo semanal de compatibilidad. Las notas del plan aparecen en su evento.
- RC-06 Diario: se reemplazó el pie de páginas ficticias por la cantidad de registros cargados en el período y se ocultó `Pagination`. El listado muestra los registros disponibles; no se anuncia acceso ilimitado a registros que la respuesta no cargó.
- RC-07: ante falla de activación se conserva la paciente creada y se muestra acceso sin preparar con reintento. El enlace, el vencimiento real y las acciones de compartir aparecen únicamente para una invitación pendiente vigente. El alta y el reintento bloquean doble envío mientras están en curso.
- RC-04/05 y RC-06 Plan: el coordinador informó su implementación y 12 pruebas verdes del módulo principal. Su verificación independiente posterior corresponde al revisor final.

Resultado focal: **92 pruebas aprobadas en 12 archivos**, incluido PostgreSQL embebido con todas las migraciones, CAS, roles, historial privado, reenvío, recuperación al reabrir la base, adaptación de turnos, SSR Agenda/Diario escritorio/celular y falla de invitación. TypeScript del frontend y servidor, controles de migraciones, secretos y espacios del diff aprobados. Reporte de ejecución local: `.gstack/reality-fixes-final-tests.json` (archivo de trabajo ignorado, no artefacto de producción).

Se agregó un recorrido de reapertura/CAS/historial al ensayo existente `server/security/signed-auth.local.test.ts`; **no se ejecutó**, pues requiere el entorno temporal Supabase Auth/PostgREST que continúa pendiente. PGlite no comprueba bloqueo entre conexiones externas reales. Falta también comprobar el clic real de reapertura en el navegador con la versión nueva. Siguen vigentes las condiciones de producción del informe inicial, con la cuarta migración incorporada y revisión independiente de estas correcciones todavía pendiente.

## Ronda independiente de cierre sobre las otras áreas

Se revisaron de forma independiente las áreas implementadas por otros agentes: fuente original y conversión, Inicio/Menú/Receta/Plan/Compras, Mensajes/Recursos/Ejercicio/Progreso y política gratuita. **Esta ronda excluye certificar mi implementación de ficha, Agenda, Diario, invitaciones, metas y fotos manuales.** El revisor de código separado documentó 103 pruebas en 13 archivos sobre esas correcciones y el resto de sus cambios; su informe es la evidencia independiente correspondiente.

Se reejecutaron **102 pruebas aprobadas en siete archivos**: fuente original (26), pantallas principales (14), pantallas secundarias (21), fechas (4), proveedor (25), fotos IA deshabilitadas (4) y envío de mensajes (8). El archivo completo de secundarias incluye también Agenda/Diario: ejecutar esas pruebas aquí no convierte mis cambios en una revisión independiente. Registro local ignorado: `.gstack/reality-final-other-areas.json`.

La comprobación de fuente confirma los hashes de las 24 respuestas conservadas del MCP, clases originales y bytes de los 278 recursos SVG locales. El conversor evalúa la presentación original una vez en la preparación, genera árboles locales y sustituye las URLs de recursos temporales por archivos verificados. El renderizador reutiliza el árbol al enlazar datos; Tailwind se compila dentro de `.mcp-nutrigo` sin preflight global. Esto acredita el origen de la presentación y evita reconstrucción por capturas; no es una certificación visual de toda la interacción final.

Las regresiones principales comprueban nutrientes disponibles de recetas de IA y manuales parciales, etiquetas de procedencia, notas públicas, porciones del detalle, fechas publicadas y controles originales del Plan en ambas medidas. Compras utiliza cantidades reales y confirmación de escrituras; Recursos conserva contenido editorial real, favoritos y marca lectura únicamente de una asignación presente; Ejercicio muestra rutinas/actividades y oculta paginación ficticia; Progreso distingue fechas civiles de instantes. La corrección del último defecto de fecha informado por el revisor de código pasó independientemente en procesos con zonas Argentina, Los Ángeles y Tokio: `2026-10-03` permanece `3/10/2026`.

La política gratuita usa `getAiModel` en todos los generadores de texto revisados. El adaptador sólo admite `openrouter/free` o nombres `:free`, restringe la ruta de completions y fuerza precios máximos cero, incluso ante preferencias o configuración heredada. No ofrece OpenAI directo ni proveedor alternativo pago; las fotos de IA siguen deshabilitadas. Los 29 tests de proveedor/fotos son solicitudes simuladas: no acreditan una generación externa completada.

### RC-08 — P2: el reintento de mensaje con adjunto cambia la escritura y el compositor puede perder texto nuevo

Ubicación al detectar el caso: `src/features/nutrigo/screens/Messages.tsx:26`, `:42` y `:60`. Cada llamada a `send()` vuelve a ejecutar `uploadChatAttachment`, mientras conserva `clientId` si el envío falla. Si el mensaje quedó guardado pero se perdió la respuesta HTTP, el reintento genera otro `asset_id` y repite el mismo identificador de mensaje. El backend lo rechaza por adjunto diferente (`server/messages/repository.ts:219`). No se pierde el mensaje anterior, pero la interfaz no puede confirmar el reintento y deja una nueva subida sin usar.

**Reproducción local con la API real en memoria:** primera subida/escritura, 200; segunda subida del mismo PNG ficticio con nueva identidad y mismo `client_id`, 409, «Ese identificador ya se usó con otro adjunto». Se conservó un único mensaje con el primer archivo. Diagnóstico ignorado `.gstack/reality-message-retry.audit.ts`, resultado `.gstack/reality-message-retry-results.json`.

También el compositor sigue editable mientras `busy` es verdadero y al recibir éxito se ejecuta `setText('')`. Texto agregado durante la espera puede borrarse sin enviarse. Se requiere una propuesta pendiente inmutable (texto, identificador y adjunto preparado), reutilizar su subida al reintentar y bloquear o conservar por separado ediciones nuevas hasta confirmar esa escritura. El coordinador confirmó el defecto y está preparando su corrección; esta ronda todavía no la certifica.

### RC-09 — P2: Compras permite cambiar el agregado pendiente y después borra la edición

Ubicación al detectar el caso: `src/features/nutrigo/screens/Shopping.tsx:18` y `:45`. Los campos del formulario continúan editables durante el guardado; el éxito posterior vacía el nombre y cierra el diálogo aunque se haya escrito otro producto durante la espera. Una respuesta perdida conserva `clientId`, pero la UI permite cambiar nombre/cantidad/unidad y cerrar/reabrir el formulario sin recuperar la operación original.

**Reproducción local de ese contrato:** agregar «Tomate» con un identificador, 201; después intentar «Cebolla» con el mismo identificador, 409; reintentar exactamente «Tomate» permite confirmar, 201. El backend protege correctamente la identidad; falta que la UI conserve el contenido pendiente y permita confirmar ese resultado sin descartar una edición nueva. Se requiere bloquear o conservar los campos del agregado enviado y reutilizar su contenido al reintentar. El mismo diagnóstico ignorado registra el caso.

### Veredicto de esta ronda

**Necesita correcciones locales RC-08/09 y verificación de su arreglo.** Las 102 pruebas generales de este alcance aprobaron porque no cubrían la pérdida de respuesta con reupload ni edición durante el envío; los dos diagnósticos adicionales reprodujeron esos casos. No hay otros defectos nuevos reproducidos en esta ronda. El resultado no se declara «100 % funcional» ni listo para producción.

Además siguen pendientes la aprobación concreta e instalación de las cuatro migraciones, sesiones firmadas y concurrencia externa en Supabase Auth/PostgREST temporal o CI, generación gratuita real, recorrido persistente completo de ambos roles, subida/apertura real de archivos y comprobación del mismo commit en frontend/API/worker. El archivo de evidencia DOM inspeccionado contiene 18 visitas en nueve pantallas sin desbordamiento; es una comprobación local previa, no el recorrido persistente final. No se navegó ni se tomaron capturas en esta ronda, no se cambiaron funciones ni producción y no se consumieron servicios pagos.

## Revisión de los arreglos de reintentos — 4 de octubre de 2026

Se revisaron `pending-write.ts`, `message-write.ts`, su conexión en Mensajes/Compras y las nuevas regresiones HTTP con datos ficticios. Pasaron **46 pruebas en cuatro archivos** (`server/frontend-write-retry.integration.test.ts`, principales, secundarias y envío de mensajes), guardadas localmente en `.gstack/reality-final-retries.json`.

El arreglo de RC-08 después de una escritura guardada con respuesta perdida quedó comprobado: conserva texto, identificador y archivo ya preparado; reintenta con la misma escritura y sólo una subida; el backend devuelve un único mensaje. Dos clics concurrentes comparten una operación. El compositor, selector y quitar archivo están deshabilitados durante el envío o confirmación pendiente. RC-09 quedó corregido para el escenario observado: conserva el producto y su identificador, permite confirmar el original y sólo después del éxito vacía el formulario. Sus campos se bloquean durante el envío/confirmación; cerrar y abrir el modal conserva esa operación. Las claves de montaje de la app incluyen paciente y página, evitando reutilizar el controlador de escritura con otra paciente.

Las conexiones nuevas de `Button More` sobre comidas publicadas en Inicio y `Button Picker` de chat del Diario móvil llaman Mensajes por código. La parte Diario pertenece a una implementación propia anterior: su revisión independiente final se mantiene a cargo del revisor de código. Esta ronda no tomó capturas ni navegó.

**Residuo RC-08: preparación rechazada antes de enviar bloquea reemplazar el archivo.** `createPendingWrite` conserva cualquier fallo como escritura pendiente. Si leer/subir/inspeccionar el archivo falla antes de llamar al envío del mensaje, el estado queda pendiente y la UI impide elegir o quitar ese archivo. Reproducción independiente con la API real en memoria: reserva PNG 201, contenido inválido rechazado 400, `send` no llamado y `write.pending === true`. El nuevo diagnóstico también está en `.gstack/reality-message-retry.audit.ts`; el reporte de tres diagnósticos permanece ignorado. No hubo una escritura de mensaje que haga necesario bloquear correcciones. Debe liberarse ese estado únicamente ante falla de preparación, conservando texto/archivo editables; después de intentar enviar debe seguir conservándose el snapshot para confirmar una respuesta perdida.

El coordinador recibió el caso. **RC-09 verificado; RC-08 requiere corregir y verificar ese residuo.** Siguen pendientes las comprobaciones persistentes y autorizaciones de producción ya enumeradas. El ensayo de archivos de esta ronda utilizó almacenamiento ficticio en memoria, no el bucket real de Supabase.

## Cierre de la revisión funcional local — 4 de octubre de 2026

**RC-08 y RC-09 corregidos y verificados; no quedan defectos reproducibles pendientes en el alcance independiente revisado.** Se conserva arriba el diagnóstico anterior y sus estados históricos.

La última corrección distingue preparación del archivo de intento de escritura: `messageStarted` pertenece al snapshot de cada mensaje y se establece después de preparar el adjunto, antes de enviar. Un fallo previo libera únicamente el snapshot pendiente, conserva texto/archivo en el formulario y vuelve a permitir corregirlo. Después de intentar escribir conserva el contenido y el adjunto preparado para confirmar el mismo mensaje. No reutiliza el indicador de una operación anterior. El texto visible distingue «todavía no se envió» de una escritura por confirmar.

Revalidación independiente: **47 pruebas aprobadas en cuatro archivos**, incluidas respuesta perdida tras guardar con adjunto real en la API de memoria, una sola subida, misma escritura al reintentar, un único producto en Compras, doble clic, recuperación de fallo de preparación, 14 principales, 21 secundarias y ocho de envío. El diagnóstico adicional de contenido inválido se repitió contra la API real en memoria: reserva 201, rechazo 400 antes del envío, `send` no llamado y `pending === false`. Sus tres diagnósticos aprobaron. Los reportes locales están en `.gstack/reality-final-retries.json` y `.gstack/reality-message-retry-results.json`; no son evidencia de Supabase real.

**Veredicto local:** implementación revisada apta para continuar con PR y controles generales del coordinador. **Veredicto de producción:** aún no certificada. Requiere la aprobación concreta del paquete SQL/configuración, CI de sesiones firmadas y contención externa, generación gratuita real y recorridos persistentes finales con ambos roles y el mismo commit desplegado. Las fotos IA continúan pendientes; el respaldo manual es la función implementada. Las comprobaciones DOM finales siguen a cargo del coordinador y no se sustituyen aquí por las visitas previas.

Esta certificación local corresponde a las áreas implementadas por otros agentes descritas en la ronda independiente. Mis cambios de ficha, Agenda, Diario, invitaciones, metas y fotos manuales tienen su revisión separada del revisor de código, no se autocertifican aquí. Esta ronda sólo escribió este informe y diagnósticos ignorados; no cambió funciones, no navegó, no tomó capturas, no publicó ni usó servicios pagos.

## Revisión acotada de idioma y marca Plan V — 4 de octubre de 2026

Se revisaron de forma independiente `branding.tsx`, su uso prioritario en `FramePair`, los textos de marca y pies, y el comparador local. **Sin defectos reproducibles encontrados en este cambio acotado.** La marca usa el recurso existente y oficial `src/assets/plan-v-logo-256.png`; se verificó que el archivo es PNG de 256 × 256.

Una ejecución de SSR del enlace exacto de marca y del renderizador, con la importación del recurso PNG representada como un módulo local, recorrió los 24 árboles originales. Los 22 que contienen `Logo` muestran la imagen oficial y el texto alternativo «Logo Plan V Nutrición», conservando las clases del contenedor y del símbolo. En escritorio el símbolo sigue ocupando 28 px; en celular permanece dentro del área original de 24 px con separación de 6,25 % a cada lado, equivalente a 21 px. Las dos vistas móviles de detalle (`457:13264`, receta; `507:17412`, recurso) continúan sin logo ni cabecera añadida: el enlace sólo actúa sobre un nodo `Logo` existente. Esto verifica estructura y clases; la medición final del navegador pertenece al coordinador.

La traducción sustituye «Nutrigo» por «Plan V», mantiene las etiquetas de navegación en español y convierte los 24 textos de derechos originales a `© [año] Plan V`. Los tres pies usados por la app (presentación MCP, pie de paciente heredado y consultorio) ya no muestran «Copyright». La app declara `es-AR`; el comparador local selecciona por defecto la vista Plan V en español, deja desmarcada y oculta la referencia original y fija `lang="es"` en esa vista. Mantiene una opción explícita para ver el código de referencia en su idioma original. La vista de diseño declara que no guarda datos y distingue la app funcional con datos ficticios.

Pasaron **61 pruebas en tres archivos**: contrato de originales, pantallas principales y pantallas secundarias. La verificación conserva hashes de las 24 respuestas y bytes de los 278 SVG; el estado de Git no muestra cambios en los JSON ni en el código MCP original durante este ajuste. Esta revisión sólo modificó el presente informe, no navegó ni tomó capturas y no cambió producción. El resultado local de idioma y marca no sustituye las pruebas finales de los recorridos persistentes ni modifica los pendientes de publicación enumerados antes.
