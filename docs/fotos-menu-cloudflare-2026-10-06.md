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
