# Fotos de platos al aprobar el menú

La simulación local usa Cloudflare Workers AI con FLUX.1 Schnell. La aprobación
profesional publica primero el menú y reserva las fotos en segundo plano. La
paciente recibe el mismo plan aunque la generación falle o se agote la cuota.

## Cómo verlo

- Paciente: `http://127.0.0.1:5606/app/recetas`. Menú muestra los cinco platos de
  Sofía; abrir cada receta permite ver ingredientes, porciones, preparación y foto.
- Plan: `http://127.0.0.1:5606/app/plan`. Las 28 comidas muestran la foto del plato;
  pulsar una comida abre su versión exacta. Inicio también usa las fotos guardadas.
- Nutricionista: `http://127.0.0.1:5606/crm/plan?paciente=pat-sofia`, pestaña Planes.
  Publicar un nuevo menú inicia las fotos. **Preparar fotos pendientes** sirve para
  completar menús ya publicados o reintentar fallos; **Actualizar fotos** vuelve a leer.
  Una foto cargada manualmente tiene prioridad y no se reemplaza automáticamente.
- Para reiniciar la simulación: `npm run demo:consultorio`. En el acceso elegir
  **Continuar en modo demo**. Datos y fotos permanecen en el archivo local existente.

Se generaron cuatro fotos reales: lentejas, yogur, tortilla y merluza. Se conservó
la foto manual del bowl. Publicado v7, del 5 al 11 de octubre, con 28 comidas y las
mismas indicaciones de v6. Los platos repetidos comparten la foto de su versión.
Las imágenes de prueba se revisaron visualmente; se corrigió la descripción del
modelo para usar vocabulario culinario en inglés, conservando español en la app.
Son ilustraciones: los ingredientes y cantidades escritos siguen siendo la referencia.

## Comportamiento y límites

- Modelo fijo `@cf/black-forest-labs/flux-1-schnell`, cuatro pasos, sin router ni
  proveedor pago alternativo. Sólo enviar título, ingredientes y preparación;
  los identificadores de paciente, antecedentes y notas no forman parte de la petición.
- Mantener **Workers Free** en la cuenta de Cloudflare. La confirmación de entorno
  no verifica el plan de facturación de la cuenta. El límite diario gratuito es
  10.000 neuronas; no significa imágenes ilimitadas. Un 429 espera hasta el próximo
  día UTC. Fallos tienen hasta tres intentos y después requieren reintento profesional.
- Una versión de receta publicada tiene una foto compartida. Las recetas dentro
  de propuestas de IA se identifican por contenido y consultorio, sin compartir
  entre consultorios. Una indicación de texto sin receta estructurada no genera foto.
- Publicar Biblioteca no inicia generación. El menú aprobado sí; también existe
  la solicitud explícita de foto de una receta publicada.
- Menú, Inicio y Plan actualizan fotos pendientes. Se mantiene la selección por
  receta y versión; favoritos se ofrecen cuando la receta tiene asignación válida.
- La publicación del plan no espera al proveedor. Doble clic y platos repetidos
  se deduplican; las reservas caducan y las respuestas antiguas no reemplazan fotos.
- Los JPEG se inspeccionan y se limpian por bloques: corregido un fallo real con
  imágenes grandes. Los límites de bytes, dimensiones y metadatos siguen activos.

## Configuración local y paquete de producción

Credenciales locales en `%LOCALAPPDATA%/PlanV/cloudflare-images.env`, fuera de Git
y OneDrive. El lanzador las entrega exclusivamente a la API; se excluyen del
proceso frontend. Las variables de servidor son:

```dotenv
IMAGE_PROVIDER=cloudflare_free
CLOUDFLARE_FREE_TIER=1
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Para producción, configurar esas variables en API y worker; ninguna lleva prefijo
`VITE_`. El worker debe permanecer en ejecución. La migración preparada es
`20261006120000_menu_dish_covers.sql`: cola duradera, trigger posterior a aprobación,
reserva/finalización sólo de servicio y reintento profesional con titularidad y
versión esperada. Se usa el bucket existente `recipe-covers`.

La tabla interna tiene RLS y no tiene permisos directos para `anon` o
`authenticated`. La paciente lee únicamente la presentación de su plan publicado;
el reintento exige nutricionista titular. Las excepciones nuevas en los inventarios
de seguridad están documentadas y probadas. Ante un rechazo definitivo de una
reserva, se elimina sólo el candidato no referenciado; una respuesta de red incierta
conserva el archivo hasta que se pueda confirmar su uso.

**Estado en producción (comprobado el 2026-10-07):** la migración `menu_dish_covers`
está aplicada en `plan-v-app` (versión `20261006234740`, con su disparador activo) y
la API y el worker de Railway tienen las cuatro variables de Cloudflare (se comprobaron
solo los nombres, no los valores). **Todavía nunca se generó una foto en producción:** la
cola tiene 0 filas, porque los tres planes publicados son del 5/10, anteriores al
disparador. Para encolarlas, la nutricionista publica un menú de nuevo o aprieta
«Preparar fotos pendientes» en la pestaña Planes. Falta confirmar con esa prueba el plan
gratuito de la cuenta de Cloudflare y los permisos del token.

## Fotos de ingredientes

**Estado: migración preparada, sin aplicar en producción.** El código está en la rama; en producción todavía no
existe la tabla ni se genera nada hasta que Facundo dé su frase escrita (pasos al final de esta sección).

### Cómo funciona

- **Una foto por ingrediente, para todo el servicio.** Catálogo compartido `ingredient_covers`: «tomates», «100 g de tomate»
  y «Tomate» comparten la clave `tomate`. La clave sale del nombre en minúsculas, sin tildes, sin cantidades ni unidades,
  sin «cocido/picado/fresco» y en singular razonable (`aceite-de-oliva`, `lenteja`, `limon`). Es un catálogo sin datos
  de personas: guarda solo la clave, el estado y la dirección de la foto.
- **Solo ingredientes conocidos.** Únicamente generan foto los nombres del vocabulario curado
  (`server/ai/ingredient-vocabulary.ts`, unos 250 ingredientes y modificadores de la cocina argentina). Un nombre que no
  está (texto libre, un nombre propio, cualquier dato escrito por error en un ingrediente) **no se encola, no viaja a
  Cloudflare y la receta queda sin foto en ese ingrediente**. Para sumar un ingrediente hay que agregarlo a ese archivo
  (y hay una prueba que comprueba que cada nombre del catálogo se alcanza escribiéndolo normalmente).
- **Se pide solo, sin esperar a nadie.** Al publicar un menú se reservan los ingredientes únicos conocidos de sus recetas y
  platos que todavía no tienen foto lista ni reservada, con un tope de 60 claves nuevas por publicación (el resto se
  completa con «Preparar fotos pendientes»). También lo hacen «Preparar fotos pendientes» y pedir la foto de una receta
  publicada. Publicar una receta de la Biblioteca sin menú no pide nada (igual que con las fotos de platos). Todo el
  encolado va aislado: ante cualquier error, o si tarda más de un instante, la publicación sigue igual y la paciente ve el
  mismo plan.
- **Mismo proveedor y límites que los platos.** Mismo modelo fijo (FLUX.1 Schnell en Workers Free). Lo único que viaja al
  proveedor es el nombre normalizado de un ingrediente conocido dentro de una descripción de «foto de estudio de un solo
  ingrediente, fondo claro, sin texto ni platos». Nunca pacientes, notas, cantidades ni recetas.
- **Caídas del proveedor no gastan intentos.** Un 401, 403 o 429 no cuenta como intento del ingrediente ni de la cuota del
  día, nunca deja la fila en «falló» y pausa al trabajador hasta la hora que indica el proveedor (un 429 espera al próximo
  día UTC). Solo los errores propios del pedido (imagen inválida, error 500) cuentan: tres intentos y después queda en
  «falló» hasta un reintento explícito.
- **Cuota diaria repartida.** La tabla `cover_daily_usage` cuenta INTENTOS reales por día UTC. Los ingredientes usan como
  máximo la mitad de la cuota total: `IMAGE_DAILY_LIMIT` (total, por omisión 100) e `INGREDIENT_COVERS_DAILY_LIMIT`
  (ingredientes, por omisión 30, siempre limitado a la mitad del total; `0` los pausa). Los platos tienen prioridad: el
  trabajador solo avanza con ingredientes cuando no hay ningún plato pendiente, y cada foto de plato intentada se suma al
  contador del día (`record_cover_attempt`, sin tocar la tabla de platos). Limitación: los platos no tienen tope propio ni se
  frenan por este contador; solo ceden lugar a los ingredientes. Las cifras por omisión son una estimación a confirmar con
  la primera prueba en la cuenta real. Un menú trae unos 20 a 40 ingredientes únicos y, como el catálogo es compartido,
  cada uno se genera una sola vez para todas las nutricionistas.
- **Dónde se guardan y quién lee.** Bucket público `recipe-covers`, ruta `ingredients/<clave>.<ext>`. La tabla tiene
  seguridad por filas activada **sin políticas**: ni anon ni personas con sesión leen ni escriben directamente. La API lee
  con la clave de servicio, solo las fotos listas de las claves pedidas (en lotes de 100), y entrega la dirección dentro de
  la receta o el plan de la paciente. La base solo acepta direcciones https de ese bucket con el archivo realmente guardado.
- **Qué recibe la paciente.** Cada ingrediente de las recetas asignadas (`/api/patients/:id/recipes`) y del plan publicado
  (`/api/patients/:id/plans`) trae `ingredient_cover_url` e `ingredient_cover_alt` cuando hay foto lista. Se descarta lo que
  no sea https del mismo proyecto de Supabase (mismo host que `SUPABASE_URL`), bucket público y ruta `ingredients/`, o la
  imagen incrustada de la demo (solo con la demo activa). Si la tabla aún no existe, la lectura falla o tarda, la receta
  se ve igual, sin fotos; el fallo queda registrado (código de error, nunca textos) cada diez minutos. La vista de la
  profesional y la copia a revisar no cambian.
- **Pantalla.** El detalle de receta del archivo de Nutrigo (`84:3145` y `457:13264`) dibuja cada ingrediente solo con su
  número y su texto: no tiene lugar para una foto. Por la regla del archivo no se inventó un diseño. Quedan listos los datos
  y `ingredientImage` en `plate-photo.tsx` (con las mismas reglas de seguridad y pruebas); falta que el archivo dibuje el
  recuadro (por ejemplo una miniatura de 32 px al lado del número) para conectarlo.

### Cómo probarlo en la demo

1. `npm run local` y «Continuar en modo demo». En la demo sin Cloudflare la generación es **simulada**: una esfera de color
   propia de cada ingrediente (PNG chico hecho en el servidor, alt «ilustración simulada de la demostración»). Con las
   credenciales de Cloudflare en el entorno se usa el proveedor real, con el mismo tope diario.
2. En `http://127.0.0.1:5173/crm/plan?paciente=pat-sofia`, pestaña Planes, publicar un menú nuevo. Los ingredientes únicos
   conocidos se encolan solos; el trabajador los atiende en segundos.
3. Comprobar los datos que recibe la paciente (el detalle de receta todavía no los dibuja, ver arriba):
   `curl http://127.0.0.1:3001/api/patients/pat-sofia/recipes` y `.../plans`: cada ingrediente conocido trae
   `ingredient_cover_url`; uno que no está en el vocabulario no.
4. Reiniciar `npm run local` conserva las fotos simuladas junto con el resto de la demo (usa la misma tabla de fotos en
   memoria, con la clave `ingredient:<clave>`).

### Pruebas

- `server/ai/ingredient-cover.test.ts`: claves, vocabulario curado, descripción y generación (modelo fijo, 429, bloqueos).
- `server/ai/simulated-image.test.ts`: la imagen simulada pasa la misma inspección que una foto real.
- `server/recipes/ingredient-covers.test.ts`: demo en memoria, trabajo persistente, cuota por intentos, caídas del
  proveedor, lectura segura (host, lotes, registro) y respuestas que nunca se rompen.
- `server/recipes/ingredient-covers.integration.test.ts`: del menú publicado a lo que recibe la paciente.
- `server/plans/ingredient-queue.test.ts`: publicación persistente con el encolado caído, colgado o con un plan raro.
- `server/recipes/ingredient-covers.postgres.integration.test.ts`: la migración completa sobre PGlite (permisos, sin
  lectura directa, idempotencia, reservas, cuota por intentos y reparto con platos, caídas del proveedor, direcciones).
- `server/recipes/cover-workers.test.ts` y `menu-covers-worker.test.ts`: prioridad de los platos y registro de sus intentos.

### Estado en producción (2026-10-08)

- Migración de ingredientes **aplicada** en `plan-v-app` con la autorización escrita de Facundo: las dos tablas tienen RLS
  y ninguna política; solo `service_role` las lee y escribe y ejecuta las cuatro funciones.
- Foto de plato probada con Cloudflare real: fila de prueba `f9bdc800-bae4-4bf6-88f1-7fc75d275c8a` en estado `ready`
  (JPEG de 468 KB en `recipe-covers`). Se conserva hasta que Facundo la apruebe; después se borran la fila y el archivo.
- La prueba completa de ingredientes requiere el código nuevo del worker (merge a `main`). Mientras tanto no hay filas de
  ingredientes en producción.

### Pasos para activarlo (el primero ya se hizo)

1. Aplicar `supabase/migrations/20261008120000_ingredient_covers.sql` en `plan-v-app` (crea dos tablas sin acceso directo,
   `ingredient_covers` y `cover_daily_usage`, y cuatro funciones solo para el servicio; no toca nada existente). Después
   revisar el asesor de seguridad de Supabase (las dos tablas nuevas deberían figurar como «con RLS y sin políticas»).
2. Nada que configurar si API y worker ya tienen `IMAGE_PROVIDER`, `CLOUDFLARE_FREE_TIER`, `CLOUDFLARE_ACCOUNT_ID` y
   `CLOUDFLARE_API_TOKEN` y la clave de servicio de Supabase. Opcional en el worker: `IMAGE_DAILY_LIMIT` e
   `INGREDIENT_COVERS_DAILY_LIMIT`.
3. Publicar la rama (merge a `main`: Vercel y Railway se despliegan solos). Antes de la migración el código no rompe nada:
   no encola y la lectura vuelve vacía (con un aviso en el registro cada diez minutos).
4. Probar: la nutricionista publica un menú o aprieta «Preparar fotos pendientes»; en unos minutos `ingredient_covers` tiene
   filas `ready`, `cover_daily_usage` suma los intentos del día y los archivos aparecen en `recipe-covers/ingredients/`.

## Evidencia de aceptación

- API real de Cloudflare: cuatro fotos JPEG guardadas, foto manual intacta;
  paciente y profesional leen las mismas 28 comidas y fotos.
- Comparación del contenido clínico antes/después: sin cambios por generación.
- Gstack: 13 vistas de Menú, Inicio, Plan y detalle de receta; escritorio de 1440,
  móvil de 390 e intermedio de 768. Imágenes cargadas, sin errores visibles ni
  desbordamiento del documento; la tabla móvil conserva su desplazamiento horizontal.
- Reinicio local: 14 respuestas completas idénticas y bytes de cuatro adjuntos
  idénticos; las cinco fotos también siguen guardadas sin nueva generación.
- Pruebas SQL en PGlite con permisos abiertos iniciales de Supabase: cierre de
  permisos, dos consultorios/pacientes, borrador, deduplicación, versión desactualizada,
  reserva vencida, cuota, reintento y foto manual durante generación.
- Revisiones independientes de `code-reviewer` y `reality-checker`: corregidas
  selección de versión, favoritos inválidos, prioridad de foto manual, publicación
  prematura en Biblioteca y limpieza de candidatos. Ocho pruebas de limpieza del
  worker comprueban también respuesta perdida y referencias concurrentes.
- Comprobación del diff y 428 archivos compilados: sin valores de credenciales
  Cloudflare. Comprobaciones de tipos, compilación y seguridad de migraciones aprobadas.
- Suite completa final: 251 archivos, 1.441 pruebas aprobadas y dos omitidas porque
  requieren el entorno descartable de sesiones firmadas. Ese entorno se verifica
  mediante el workflow dedicado de GitHub; no contra pacientes reales.

Las capturas y comprobaciones de gstack están en `.gstack/simulacion/fotos/`;
los resultados de generación en `.gstack/simulacion/photos-results.json` y el
registro de acciones en `.gstack/simulacion/actions.json`. Sólo contienen la
simulación ficticia y permanecen locales.

Referencias: [REST de Workers AI](https://developers.cloudflare.com/workers-ai/get-started/rest-api/),
[cuota gratuita](https://developers.cloudflare.com/workers-ai/platform/pricing/),
[modelo FLUX.1 Schnell](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/).
