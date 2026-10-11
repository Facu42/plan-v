# Recorridos y contratos de Plan V

Este documento corresponde al PR #54. Las rutas son de la API existente; los identificadores se obtienen de la sesión y de las respuestas del servidor. No se anotan credenciales ni información clínica real. «Profesional» significa la nutricionista autorizada para esa paciente, no cualquier cuenta profesional.

## Acciones y comprobación del guardado

| Acción en la app | Escritura | Quién puede realizarla | Lectura que comprueba el resultado al recargar |
|---|---|---|---|
| Crear ficha e invitación | `POST /api/patients` → `create_patient_with_invite` atómico | Nutricionista habilitada | `GET /api/patients`; el reintento conserva la misma ficha e invitación, aun si el enlace ya se utilizó |
| Preparar enlace, recuperar enlace vencido, revocar | `POST /api/invites/:id/send`, `POST /api/patients/:id/invite`, `POST /api/invites/:id/revoke` | Nutricionista propietaria | El enlace se ofrece sólo con estado pendiente y vencimiento vigente; la ficha se conserva si falla prepararlo |
| Aceptar invitación | `POST /api/invites/accept` | Paciente con email confirmado que coincide con la invitación | `GET /api/me/patient`; aparece exclusivamente su ficha |
| Editar datos operativos y archivar/restaurar | `PATCH /api/patients/:id/profile`, `PATCH /api/patients/:id/archive` | Profesional con esos permisos | `GET /api/patients`; filtros Activos/Archivados y misma selección al pasar a Ficha/Plan |
| Otorgar/retirar consentimiento | `POST /api/patients/:id/consents` | Paciente titular | `GET /api/patients/:id/intake` y `GET /api/patients/:id/care`; retiro impide las lecturas/escrituras protegidas |
| Guardar avances, enviar y corregir ficha inicial | `PATCH /api/patients/:id/intake`, `POST …/intake/submit`, `POST …/intake/reopen` | Paciente titular | `GET …/intake`; se conserva contenido y revisión. Una revisión concurrente informa conflicto |
| Revisar ingreso y agregar nota clínica privada | `POST …/intake/review`, `POST …/clinical-notes` | Profesional | `GET …/intake/professional`; la vista de paciente no incluye notas internas |
| Cargar datos corporales | `PUT /api/patients/:id/body-data?audience=patient` | Paciente titular | `GET …/body-data`; edad/fecha, talla y peso vuelven desde el servidor |
| Calcular, guardar borrador y confirmar meta | `PUT /api/patients/:id/nutrition-target?audience=pro` | Profesional; servidor recalcula y comprueba revisión | `GET …/nutrition-target?audience=pro` devuelve borrador/publicada; paciente recibe sólo publicada |
| Crear/editar y publicar receta | `POST /api/recipes`, `POST /api/recipes/:id/versions`, `POST …/publish` | Profesional propietaria | `GET /api/recipes`; publicar exige versión y revisión actuales. Título e ingredientes publicados no cambian al editar otro borrador |
| Foto manual del plato | `POST /api/recipes/:id/cover/manual` | Profesional propietaria, receta publicada | Catálogo y receta asignada devuelven la foto guardada; se comprueban tipo, tamaño y portada anterior |
| Asignar receta por fecha y registrarla | `POST /api/recipes/:id/day`, `POST /api/patients/:id/recipe-days/:assignmentId/register` | Profesional asigna; paciente registra | `GET …/recipe-days?date=AAAA-MM-DD` y `GET /api/patients/:id`; comida única, porciones y origen nutricional persistentes |
| Crear/editar plan y publicar copia revisada | `POST /api/patients/:id/plans`, `POST /api/plans/:id/publish` | Profesional | Profesional `GET …/plans?audience=pro`; paciente `GET …/plans`. Nuevo borrador no reemplaza la versión publicada |
| Proponer menú con IA, rechazar o aplicar | `POST /api/ai/jobs`, `POST /api/ai/jobs/:id/reject`, `POST …/apply` | Profesional, con consentimiento vigente | `GET /api/ai/jobs/:id` y plan releído; propuesta exige revisión, contexto y permisos vigentes. Aplicar no publica por sí solo |
| Revisar una comida | `PATCH /api/patients/:id/meals/:mealId` | Profesional | `GET /api/patients/:id`; mantiene la etiqueta de estimación, no entrega nota interna a paciente ni permite que un análisis tardío sobrescriba la revisión |
| Registrar hidratación y descanso | `PATCH /api/patients/:id/habits` | Paciente y profesional autorizada según controles actuales | `GET /api/patients/:id`; valores reales, límites comunes y ausencia distinguida de cero |
| Registrar medidas, actividad y preferencias | `POST /api/patients/:id/care/records`, `PUT …/care/preferences`, `POST /api/patients/:id/activities` | Paciente; medidas requieren consentimiento | `GET …/care?audience=patient`, `GET …/exercise`; profesional relee con `audience=pro`. Reintentos usan el mismo identificador |
| Revisar registros del seguimiento | `PATCH /api/patients/:id/care/records/:recordId/review` | Profesional | `GET …/care?audience=pro`; revisión visible después de volver a Ficha |
| Subir, abrir y retirar foto corporal/estudio | `POST …/care/photos`, `POST …/care/documents`; `GET/DELETE …/photos/:id` o `…/documents/:id` | Titular; profesional sólo abre con permiso y consentimiento | `GET …/care`, descarga real mediante URL temporal; otra paciente/consultorio no recibe el enlace |
| Compras y marcas de comprado | `POST /api/patients/:id/shopping/items`, `POST …/shopping/check`, `DELETE …/items/:itemId` | Paciente titular | `GET …/shopping`; productos y marcas sobreviven a la recarga |
| Favoritos y lectura de recursos | `POST /api/patients/:id/favorites`, `POST …/resources/:resourceId/read` | Paciente titular | `GET …/library`; favorito y fecha de lectura persistentes |
| Asignar recursos | `POST /api/resources/assign` | Profesional sobre sus pacientes | `GET /api/patients/:id/library?audience=pro`; misma asignación visible para paciente |
| Turno, cambio de horario y confirmación | `PATCH /api/patients/:id/appointment`, `PATCH …/appointment/reschedule`, `PATCH …/appointment/confirm` | Profesional agenda; paciente solicita/cambia/confirma su turno según API | `GET /api/patients/:id`; fecha, hora, respuesta y enlace seguro vuelven a la agenda |
| Mensaje y lectura | `POST /api/patients/:id/messages`, `POST …/messages/read` | Titular y profesional | `GET /api/patients/:id`; contenido y lectura se recuperan desde ambos roles |
| Adjunto de conversación | `POST /api/assets/upload-intents`, `PUT /api/assets/:id/content`, `POST …/complete`; enviar mensaje con asset; abrir con `POST …/messages/:messageId/attachment` | Titular y profesional; activo privado de esa paciente | Mensaje releído y descarga de los bytes guardados, no sólo del nombre del archivo |
| Cuota, aviso, pago y deuda | `PUT /api/patients/:id/fee`, `POST …/payments`, `PATCH /api/payments/:id`, `PATCH /api/charges/:id` | Profesional define/confirma; paciente informa su pago | `GET …/ledger?audience=patient`, `GET /api/billing`; estado e importe persistentes, sin cobro automático |
| Recuperar contraseña | `POST /api/auth/recover`, enlace de Auth y actualización de contraseña con Supabase Auth | Titular de la cuenta | Salida y nuevo ingreso recuperan los mismos datos. En ensayo se crea enlace real de Auth sin proveedor de correo nuevo |
| Administrar servicio | Rutas `/api/admin/service` y `/api/admin/nutritionists/:id/…` | Administrador de plataforma | Tablero de servicio/subscripciones; permisos impiden obtener fichas, planes y datos clínicos ajenos |

Las vistas de paciente y profesional usan los mismos contratos, con sus permisos. Un texto de confirmación visual no reemplaza la lectura nueva del servidor. Los errores de escritura muestran fallo o confirmación pendiente; nunca éxito inventado. La IA usa sólo modelos cuyo precio gratuito se verificó; no existe cambio automático a un modelo pago.

Los favoritos editoriales devuelven el UUID del recurso. Los registros anteriores guardados por nombre interno se convierten respetando el recurso y la fecha existentes. Al finalizar o corregir el onboarding se consulta el plan publicado, con carga, error y reintento; un menú antiguo no sustituye esa comprobación.

## Guía para probar las dos experiencias

La dirección publicada es [Plan V](https://plan-v-eight.vercel.app/). Las cinco migraciones aprobadas y los PR #54, #56 y #57 están publicados. El comparador local sólo permite revisar la presentación. [Evidencia real y guía breve](cierre-producto-publicado-2026-10-05.md).

1. Entrar con la cuenta ficticia de nutricionista entregada en el chat. Abrir **Pacientes**, elegir la paciente y pasar por **Ficha** y **Plan**: debe conservarse la selección. Crear una paciente ficticia diferente únicamente si se quiere probar una nueva invitación.
2. En **Ficha**, revisar el ingreso y los datos corporales. Confirmar la meta. Guardar después otro borrador: la meta visible de la paciente debe seguir siendo la confirmada.
3. Crear una receta manual con ingredientes, porciones, calorías y fuente. Guardar, revisar, publicar y asignar una fecha. Crear el plan fechado, guardar el borrador y publicar. Anotar su indicación pública; editar otro borrador sin publicarlo.
4. Cerrar sesión y entrar con la cuenta ficticia de paciente. Para una invitación nueva, usar su enlace y el mismo email indicado. Completar consentimiento e ingreso, salir/reingresar y comprobar lo guardado. En **Mi ficha**, corregir y reenviar la ficha si hace falta.
5. Abrir **Plan** y **Diario**. Debe aparecer la indicación publicada, sin el borrador nuevo. Registrar la receta, agua y descanso; recargar. Agregar un producto a **Compras**, marcarlo, guardar un favorito, enviar mensaje y adjuntar un archivo ficticio.
6. En **Progreso**, habilitar únicamente los permisos opcionales que se quieran probar y registrar una medida. Confirmar un turno en **Agenda**, leer un recurso asignado y avisar un pago manual. Volver a la cuenta profesional: comprobar registros, mensaje/descarga del adjunto y confirmar el pago.
7. Para IA, otorgar el permiso correspondiente con la paciente ficticia y generar desde el editor profesional. Editar la propuesta, revisar nutrientes y totales y publicar; consultar la misma copia desde paciente. Este recorrido ya se comprobó con una generación real de cuatro recetas mediante `openrouter/free`; todas mantienen su etiqueta de nutrientes estimados. Si el proveedor está agotado, se puede reintentar o trabajar manualmente.

Estado de la evidencia: [registro de cierre](cierre-funcional-plan-v-2026-10-05.md). El ensayo usa cuentas y datos ficticios y almacenamiento temporal; no contrata servicios. Las fotos generadas por IA continúan pendientes y la subida manual se mantiene.
