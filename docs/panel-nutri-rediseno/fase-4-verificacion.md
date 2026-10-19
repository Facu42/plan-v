# Fase 4 · Ficha de paciente

Entregada en [PR #154](https://github.com/Facu42/plan-v/pull/154), rama `codex/panel-nutri-fase-4`. Código verificado en 0987346; después sólo se registra este enlace y la Bitácora.

## Resultado

Ficha con once pestañas principales según la composición aprobada: Resumen, Historia clínica, Evolución, Notas, Plan, Registro alimentario, Laboratorio, Archivos, Consultas, Cobros y Chat. Se conservan las catorce secciones anteriores: las cuatro del plan quedan agrupadas y los enlaces `ingreso`, `registros` y `mensajes` mantienen sus destinos.

El encabezado abre mensajes, notas y la videollamada HTTPS existente o la gestión del turno. Historia conserva el ingreso, su revisión y sus observaciones privadas; agrega los datos de la primera fecha con mediciones autorizadas. Evolución permite nuevas mediciones, actualización de objetivos, correcciones, importación, evaluaciones y revisión de registros compartidos.

Plan muestra la copia publicada vigente por fecha, con horarios, nombres de momentos e indicaciones completas. El editor existente conserva borradores, revisión y publicación. Pedidos de cambio usan la revisión profesional existente. El diario consulta todas las páginas del período, permite filtrar y revisar; no calcula promedios a partir de una página incompleta.

Laboratorio compara tres fechas y grafica sólo valores numéricos exactos de una misma unidad. Mantiene rango, comparador, texto y documento de origen. El ingreso manual y la carga existente requieren revisión profesional. Notas conserva la lógica de grabación, micrófono/audio remoto, recuperación, transcripción, borradores y publicación; se modifica su presentación.

Archivos permite seleccionar o arrastrar PDF/JPG/PNG de hasta 20 MB, confirmar la carga privada, abrir el archivo y acceder a la exportación existente. Consultas conserva turnos y confirmación explícita de consultas realizadas. Cobros muestra movimientos propios y permite abrir todas sus operaciones existentes. Chat conserva envío, adjuntos, lecturas, perfil y actualizaciones, dentro de la ficha.

## Datos y permisos

- `GET /api/crm/patients/:id/meals`: rol profesional, ficha activa del consultorio, paginación de hasta 50, filtros de estado y 7/30 días con medianoche argentina. Devuelve `has_more` y `next_offset`; no depende de las veinte comidas resumidas en la ficha. La firma de fotos respeta el consentimiento y el prefijo privado de esa paciente.
- Resumen e Historia hidratan la ficha antes de tratar sus colecciones como datos completos. Gráficos excluyen fechas futuras, pacientes ajenas y mezcla de unidades.
- Documentos del consultorio requieren Atención y Estudios; los adjuntos de paciente conservan sus permisos propios. El retiro de Atención invalida el snapshot, cierra el visor y descarta aperturas anteriores aún en vuelo. Las evaluaciones y exportación también se desmontan al retirarlo.
- El visor usa enlaces temporales y descarta su estado a los 60 segundos o al cambiar su alcance. No hay rutas públicas nuevas ni cambio de permisos del servidor.
- No se inventan edad, meta numérica de peso, diagnóstico, normalidad del laboratorio, asistencia, información nutricional ni respuesta de IA. Los estados sin permiso o sin información se presentan como tales.

## Evidencia

[Comparación navegable](../../design/panel-nutri/fase-4-verificacion.html) · [Pantallas y controles](../../design/panel-nutri/fase-4/resultados.json) · [Acciones privadas](../../design/panel-nutri/fase-4/acciones-privadas.json) · [Paginación del cliente](../../design/panel-nutri/fase-4/paginacion-cliente.json).

Suite estable final: `npm test -- --maxWorkers=4`, **3.177 aprobadas y dos omitidas, 494 archivos**, iniciada 13:50:58 ART; 201,76 segundos. Tipos, compilación final (10,65 s) y secretos aprobados; sin comando separado de lint. La compilación mantiene el aviso previo de paquetes grandes. /browse: **14 comprobaciones y 44 vistas/temas/tamaños**, más **nueve acciones privadas** y **cinco comprobaciones de paginación**. 47 capturas. La comparación navegable se verificó: cinco imágenes cargadas y controles de pestaña/tema cambian implementación y referencia.

Seis recorridos de punta a punta aprobados en 50,8 segundos con Chrome instalado, servidores independientes en demo y claves de Supabase vacías. El runtime estándar de Playwright no estaba instalado; se usó una configuración temporal fuera del producto, sin cambiar la configuración del CI. Los recorridos conservan todas sus aserciones: se acota la búsqueda de alergias al cuestionario y se usa el nombre nuevo de la pestaña del diario.

Nueve acciones privadas verificadas con operaciones reales en memoria local: carga, decodificación de un PNG de prueba de 1 × 1 píxel, apertura del visor, retiro de Atención con visor abierto y con respuesta pendiente, laboratorio con tres fechas ficticias, nota manual guardada, resumen publicado y acceso a exportación. Se restauran los permisos originales al terminar. Las capturas adicionales no representan una imagen clínica grande ni una llamada real.

Cinco comprobaciones del cliente con respuestas sintéticas locales: página de 50, bloqueo de promedio incompleto, agregado de 15 sin duplicados, limpieza de filas ante fallo y reintento. La API real tiene pruebas independientes con 65 comidas, rol/consultorio/archivo, retiro de fotos y límites argentinos de siete y treinta días.

Revisión de código independiente: sin P1/P2, quince pruebas focales aprobadas. Revisión visual independiente de las once secciones, ambos temas/tamaños; corregidos Historia, datos iniciales, CTA, desborde del plan, orientación de pestaña activa, composición/contraste y altura del hilo del chat. El compositor móvil se alcanza desplazando la página; no se afirma que toda la ficha quepa en el primer pantallazo.

La primera suite tuvo un EBUSY de Windows al preparar la tipografía del PDF y un timeout de reapertura de Postgres. Sus 25 casos focales repitieron verdes y la suite completa serializada aprobó. No se consideran verdes las ejecuciones interrumpidas por recargas del servidor de desarrollo durante conciliaciones o generación de estilos.

CI de c810975: ambas ejecuciones generales y los recorridos aprobaron. El control firmado aprobó 30 casos de Auth/PostgREST, pero el navegador intentaba acceder a Planificación sin abrir su pestaña principal Plan. Se actualiza ese acceso del recorrido, conservando la confirmación y la lectura de la meta publicada; la integración espera su repetición completa en verde.

## Regression Guard · paso 10

- **Flujos críticos verificados:** ✅ ficha y enlaces anteriores; ingreso/revisión y antecedentes; medidas y objetivos; plan publicado/editor; diario/revisión; notas y publicación; documentos privados; turnos/cierre explícito; cobros; chat. Suite, seis e2e y recorridos locales. La captura de audio y proveedores mantienen sus pruebas existentes; no se ensayó una videollamada física.
- **Regresiones cubiertas:** ✅ datos truncados a veinte comidas, promedio de página incompleta, error/reintento, medianoche argentina, foto sin permiso, fechas futuras, mezcla de unidades, comparador manual omitido, lectura cruzada y respuesta de visor anterior al retiro.
- **Contratos revisados:** ✅ cliente/API de comidas, límites y estados; scope profesional, autorización y firma privada; mediciones, laboratorio/documento fuente; versiones publicadas del plan; contratos existentes de notas, cobros y mensajes.
- **Áreas frágiles:** permisos y asincronía se invalidan por paciente/alcance; paginación usa respuesta explícita; original de laboratorio y comparadores se conservan; grabación, publicación y pagos reutilizan sus operaciones y validaciones.
- **Migraciones:** N/A. Sin tablas, SQL, secretos, configuración ni datos de producción.
- **Fire test:** ✅ retirada controlada de la máscara de fotos en la API local hizo fallar la prueba. Código restaurado y tres casos verdes.
- **Automatizaciones nuevas:** scripts reproducibles `/browse` de ficha, acciones privadas y paginación; pruebas de API, fronteras de fechas y comparadores. CI existente exige verificaciones y sesiones firmadas antes de integrar.
- **Veredicto:** SHIP para fase 4: suite, tipos, build, secretos y revisiones aprobados. Integrar sólo tras controles remotos verdes del PR. No requiere migración.

## Alcance final

Sólo fase 4. Facundo indicó el 19/10 que la fase 5 se está haciendo en otro carril. Este trabajo se detiene al entregar e integrar la fase 4; no reserva ni modifica fases posteriores. PR propio sobre main, sin commits directos a main. La fase 3 quedó integrada por #152 en 6697d28, con web/API/worker aprobados.
