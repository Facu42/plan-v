# Paciente Nutrigo: revisión de doce superficies

La referencia es el archivo OTolnKfsxUFjaZOhhdb04i, capturado por get_design_context y conservado en design/figma-reference/original. Se reutilizan sus 24 árboles de nodos, clases, medidas y recursos; no se calcularon valores desde capturas. El contrato automatizado verifica hashes, clases y referencias contra los originales.

| Superficie | Escritorio 1440 | Móvil 390 |
| --- | --- | --- |
| Inicio | 12:792 | 427:14405 |
| Agenda | 84:1666 | 433:17250 |
| Mensajes | 84:2565 | 433:19982 |
| Menú | 84:2716 | 445:10499 |
| Detalle de receta | 84:3145 | 457:13264 |
| Plan | 84:2994 | 470:15300 |
| Compras | 105:2472 | 492:11324 |
| Diario | 105:2649 | 492:14886 |
| Progreso | 105:2790 | 498:18237 |
| Ejercicio | 105:2931 | 501:22824 |
| Recursos | 263:6588 | 504:15334 |
| Detalle de recurso | 279:9301 | 507:17412 |

Correcciones: navegación independiente de Plan/Compras; contador real de mensajes; Menú y Receta muestran asignaciones, porciones, preparación y nutrientes reales, con ausencias explícitas en lugar de valoraciones o cifras ficticias. Agenda construye el mes real y distingue fecha seleccionada, hoy y eventos. Compras elimina paginación ficticia. Progreso renueva enlaces privados antes de abrir fotos. Ejercicio, mensajes y formularios advierten cambios pendientes; Mi ficha y registros protegen datos editados. Recursos conserva publicación/asignación/lectura y abre detalles desde el principio.

Pagos, Mi ficha y permisos usan componentes existentes con Poppins y tokens Nutrigo como decisión visual por defecto, ya que el archivo no los define. Los tamaños intermedios conservan acceso mediante desplazamiento interno donde hace falta; no se creó una variante tablet.

Gstack: 14 confirmaciones de escritura/lectura y 60 medidas (12 superficies por 1440,390,1024,1280,360). Ninguna pantalla devolvió error de carga ni desbordamiento del documento. Las capturas de revisión son locales, de datos ficticios, en .gstack/screens; se inspeccionaron las doce superficies en ambos tamaños principales y se corrigieron el título móvil de Ejercicio y el desplazamiento al abrir Recursos. Los nodos fuente y sus clases permanecen intactos. Esto acredita conservación de la fuente y revisión de pantallas funcionando; no es una comparación píxel a píxel ni una prueba de producción.

Suite general del conjunto: 243 archivos, 1388 aprobadas/2 omitidas. Tipos, compilación, migraciones y secretos aprobados; después de los últimos detalles visuales se repitieron las pruebas del paciente y tipos. Sesiones firmadas, adjuntos, aislamiento y persistencia tras reinicio se ejecutan en CI con Supabase descartable. Resultados pendientes se anotan al terminar CI.

Registros de backend, consultorio y planes enlazados en docs/plan-apartados.md. Revisión independiente de código y evidencia cerrada. No se desplegó ni aplicó una migración en producción.
