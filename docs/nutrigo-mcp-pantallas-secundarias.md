# Pantallas secundarias desde código MCP

Trabajo en la rama del producto desde `main`, separado de los ajustes de fidelidad anteriores. Componentes en `src/features/nutrigo/screens/`, usando los nodos originales de `src/features/nutrigo/source/`. Las etiquetas en español se conservan en `secondaryTranslation.ts`. Sin capturas, nuevos servicios ni modificaciones en producción.

## Pantallas y acciones

| Pantalla | Nodos escritorio / celular | Lectura y escritura | Permiso y comprobación |
|---|---|---|---|
| Agenda | `84:1666` / `433:17250` | Ficha de paciente; `POST /api/patients/:id/appointment/confirm`, `POST /api/patients/:id/appointment/reschedule` | Paciente de esa ficha. Confirmación, cambio solicitado y horario vuelven a leerse desde la ficha al recargar. Los enlaces de video requieren HTTPS. |
| Diario | `105:2649` / `492:14886` | Registros de la ficha; el alta de comida abre el formulario existente y `POST /api/patients/:id/meals/analyze`; `PATCH /api/patients/:id/habits` para agua y descanso | Paciente de esa ficha. No se muestran nutrientes pendientes de revisión. Los hábitos se vuelven a leer tras la escritura. |
| Progreso | `105:2790` / `498:18237` | `GET /api/patients/:id/progress?days=…`, `GET /api/patients/:id/care?audience=patient`, `GET /api/patients/:id/care/photos/:recordId` para abrir una foto | Paciente con los consentimientos vigentes. Se muestran medidas compartidas y su procedencia. El botón de registros abre el formulario de medidas y archivos existente del producto. |
| Ejercicio | `105:2931` / `501:22824` | `GET /api/patients/:id/exercise`, `POST /api/patients/:id/activities`, `POST /api/patients/:id/routines/:assignmentId/feedback` | Paciente de esa ficha. Actividades y respuesta de la rutina se leen del servidor. La app no inventa gasto calórico ni peso usado. |
| Compras | `105:2472` / `492:11324` | `GET /api/patients/:id/shopping`, `POST …/shopping/items`, `POST …/shopping/check`, `DELETE …/shopping/items/:itemId` | Paciente de esa ficha. Se puede agregar, marcar y eliminar productos manuales. Las cantidades del plan permanecen derivadas del servidor. No hay precios estimados sin datos. |
| Mensajes | `84:2565` / `433:19982` | Ficha e hilo existente; `POST /api/patients/:id/messages`, `POST …/messages/read`, `POST /api/assets/upload-intents`, `PUT /api/assets/:intentId/content`, `POST /api/assets/:intentId/complete`, `POST …/messages/:messageId/attachment` | Paciente y su profesional. Sólo se muestran los mensajes de esa paciente. Se conservan texto y archivo ante una falla de envío; después de enviar, una falla al actualizar no invita a reenviar. Los comprobantes se leen de los estados persistidos. |
| Recursos | `263:6588` / `504:15334` | `GET /api/patients/:id/library`, `POST /api/patients/:id/favorites`, `POST /api/patients/:id/resources/:slug/read` para recomendaciones asignadas | Biblioteca disponible para esa paciente. Guardados y lecturas de recursos asignados se vuelven a leer al recargar. Las guías públicas sin asignación se pueden consultar y guardar; su apertura no crea una asignación profesional. El enlace conserva `#recurso=slug`. |
| Detalle de recurso | `279:9301` / `507:17412` | El mismo catálogo; autoría, secciones, temas y relacionados de la entrada publicada | Ninguna recomendación clínica del ejemplo de Figma se presenta como contenido de Plan V. El recurso sólo ofrece páginas permitidas al paciente. |

## Controles de implementación

- Un controlador alimenta la variante actual de cada pantalla; no se montan simultáneamente escritorio y celular.
- Las lecturas se cancelan al cambiar pantalla o paciente. Una respuesta anterior a una escritura no reemplaza el resultado guardado.
- Las escrituras no anuncian éxito cuando fallan. Bloqueos de envío evitan dobles clics simultáneos; mensajes y productos manuales conservan su identificador de reintento.
- Los formularios adicionales tienen foco inicial, cierre con Escape y recorrido de Tab dentro del diálogo. El cierre se bloquea mientras se guarda.
- Los campos sin datos quedan vacíos o explican su ausencia. No se fabrican calorías de actividad, fases del sueño, precios, identidad de la nutricionista o medidas corporales.
- El filtro de medidas admite 7, 30 y 90 días. Los hábitos del resumen indican explícitamente una ventana de siete días.

## Verificación local

`npx vitest run src/features/nutrigo/screens/secondary-screens.test.tsx`: **17 pruebas aprobadas**. Escritorio y celular sobre los templates originales, nutrientes pendientes privados, fechas válidas, tablas con datos del servidor, recibos reales del hilo, medidas ausentes y contenido editorial publicado, incluido su detalle y artículos relacionados. Estas pruebas comprueban vinculación y privacidad del renderizado; no reemplazan la comprobación del producto completo con sesiones y persistencia que debe realizar el hilo principal.

La publicación, las migraciones, los recorridos con cuentas reales de prueba y la verificación de Vercel/API/worker quedan a cargo del hilo principal. Este apartado no declara la aplicación completa terminada.
