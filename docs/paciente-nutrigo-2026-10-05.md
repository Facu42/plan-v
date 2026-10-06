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

## Contrato de acciones y aceptación

La [matriz vigente de acciones, escritura, permiso y lectura posterior](recorridos-y-contratos-plan-v-2026-10-05.md) se conserva. Esta entrega añade:

| Acción | Operación | Permiso | Comprobación posterior |
| --- | --- | --- | --- |
| Abrir pendientes, filtrar y paginar | GET /api/crm/work-queue | Nutricionista; consultorio desde sesión | Misma lista autorizada, contadores y cursor; sin notas ni borradores |
| Crear material del consultorio | POST /api/resources | Nutricionista propietaria | GET /api/resources?audience=pro; id y contenido guardados |
| Publicar material revisado | POST /api/resources/:id/publish | Propietaria; otra profesional y paciente rechazadas | Catálogo profesional published=true |
| Crear nueva versión editorial | Nuevo slug mediante POST /api/resources | Propietaria | Nueva copia; asignación anterior conserva su recurso |
| Asignar material creado | POST /api/resources/assign | Propietaria del material y de los pacientes | Biblioteca del paciente devuelve el mismo contenido; consultorio ajeno bloqueado por API y función de base |
| Abrir recurso asignado | POST /api/patients/:id/resources/:resourceId/read | Paciente titular | Biblioteca profesional devuelve read_at persistente |
| Navegar, volver y cambiar paciente con edición pendiente | Sin escritura; controlador central | Sesión del rol actual | Cancelar conserva formulario y URL; guardar habilita la salida |

La suite general cubre errores de conexión, proveedor caído, consentimiento retirado, concurrencia y reintentos. El recorrido autenticado cubre alta, invitación, ingreso, meta, receta, plan, registros, permisos, agenda, mensajes, adjuntos, cuota/aviso/confirmación, archivo/restauración, cierre de sesión y recuperación tras reinicio. El resultado concreto del entorno temporal queda visible en las comprobaciones de cada PR.

Entregas encadenadas: [backend #59](https://github.com/Facu42/plan-v/pull/59), [consultorio #60](https://github.com/Facu42/plan-v/pull/60), [planes #61](https://github.com/Facu42/plan-v/pull/61), [paciente #62](https://github.com/Facu42/plan-v/pull/62).
