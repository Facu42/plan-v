# Correcciones de ficha, agenda, diario e invitaciones

Implementación preparada en `codex/nutrigo-producto-mcp`, sin publicación ni SQL de producción. Registra la corrección de RC-01/02/03/07 y la parte Diario de RC-06. El informe inicial permanece en [reality-check-nutrigo-producto-2026-10-03.md](./reality-check-nutrigo-producto-2026-10-03.md); la revisión independiente final sigue pendiente.

## Ficha enviada: corregir preservando lo recibido

La paciente abre su ficha enviada y elige **Corregir mi ficha enviada**. El servidor compara la revisión cargada con la vigente. Antes de pasar la ficha a borrador conserva la versión anterior exacta, incluido el contenido enviado y la revisión profesional previa, en un historial privado. El borrador mantiene los datos y los consentimientos existentes; la corrección exige nuevo envío y nueva revisión profesional. Si el consentimiento fue retirado, la paciente puede abrir la corrección y decidir nuevamente en Privacidad; la reapertura no concede consentimiento.

| Acción | Endpoint / RPC | Permiso | Comprobación al recargar |
|---|---|---|---|
| Recuperar ficha propia | `GET /api/patients/:id/intake` | Paciente propia | Estado, revisión y contenido persistidos, sin notas profesionales ni historial |
| Reabrir enviada/revisada | `POST /api/patients/:id/intake/reopen`, `{expected_revision}` → `reopen_patient_intake` | Sólo paciente propia; profesional y administrador no pueden ejecutarla | Borrador con revisión incrementada y mismo contenido; versión previa conservada en privado |
| Guardar corrección | `PATCH /api/patients/:id/intake`, `{expected_revision,step,payload}` | Sólo paciente propia | Borrador corregido, CAS y paso recuperado |
| Enviar corrección | `POST /api/patients/:id/intake/submit`, `{expected_revision}` | Paciente propia con consentimiento vigente | Estado enviado; no conserva la revisión profesional como válida para el nuevo contenido |
| Revisar nueva versión | `POST /api/patients/:id/intake/review`, `{expected_revision}` | Profesional asignada | Estado revisado y contenido de la paciente conservado |

La migración pendiente **`20261003231922_reopen_patient_intake.sql`** se creó con `supabase@2.119.0 migration new reopen_patient_intake --workdir .`. Añade `private.intake_revision_history` y dos funciones homónimas: el wrapper público es `SECURITY INVOKER`; el helper privado es `SECURITY DEFINER` con ruta de búsqueda vacía, exige paciente propia y bloquea la fila antes del CAS. No amplía la lista de funciones públicas definer. `anon` no ejecuta ninguna de las dos. `authenticated` no lee el historial. `service_role` conserva el permiso interno. El historial se elimina por cascada al eliminar la paciente y no se reconstruyen versiones históricas anteriores a esta migración. No se expone un endpoint para ese historial.

Una segunda sesión con la revisión anterior recibe 409 y debe recuperar la ficha actual. Abrir de nuevo el mismo borrador con su revisión vigente no inventa otra versión. Los reintentos de envío anteriores no pueden volver a enviar la versión cerrada después de la reapertura. Una respuesta perdida en la UI obliga a recuperar el estado guardado antes de editar.

## Agenda, diario e invitación

| Acción | Conexión | Resultado |
|---|---|---|
| Mostrar comidas en Agenda | `plansApi.published` → `GET /api/patients/:id/plans` | Eventos con `for_date` del plan publicado, título, porciones e indicaciones; no usa comidas legacy como publicaciones |
| Mostrar turno | Respuesta de ficha/turno con `starts_at` y `timezone` | Conserva instante real, presenta día y hora de Argentina, aunque el dispositivo use UTC/Tokyo/Los Ángeles; un turno vencido no se mueve automáticamente a la próxima semana |
| Listar Diario | Registros de la respuesta de paciente | Muestra cantidad cargada por período; oculta páginas/flechas ficticias que abrían otra navegación |
| Alta profesional | `POST /api/patients` y luego `POST /api/invites/:id/send` | Una falla del segundo paso conserva la ficha y muestra acceso sin preparar |
| Reintentar preparar acceso | `POST /api/patients/:id/invite` | Reintenta para esa misma ficha; sólo comparte enlace si el servidor devuelve `pending` y vencimiento vigente |

La invitación muestra el vencimiento real recibido. Una invitación `not_sent`, vencida o revocada no ofrece copiar ni compartir un enlace anunciado como listo. Crear paciente y preparar acceso usan bloqueo de envío en la UI; un error de activación no repite el alta.

## Verificación y límites

92 pruebas focales aprobadas en 12 archivos: HTTP de ingreso y adaptador Supabase; cadena completa de migraciones con PGlite y permisos; conflictos de versión; conservación de revisión/consentimiento; edición y reenvío; persistencia después de cerrar/reabrir la base; modelos de agenda; SSR de las versiones escritorio y celular; invitación fallida y estados de enlace. TypeScript completo, controles de migraciones y secretos y `git diff --check` aprobados.

El ensayo existente de sesiones firmadas incorpora la reapertura y dos solicitudes concurrentes, pero continúa **pendiente de ejecución en Supabase Auth/PostgREST temporal local o CI**. PGlite comprueba las funciones y los permisos, no la contención entre dos conexiones externas. El clic real de reapertura en el navegador también queda pendiente. Ninguna prueba usó cuentas reales, datos reales de salud ni producción.

Esta migración se suma a las otras tres preparadas (metas separadas, nutrientes estructurados y portada manual); las cuatro requieren aprobación concreta para producción. La generación gratuita real de texto y la revisión independiente final siguen pendientes según el cierre del coordinador. No se contrataron servicios ni recursos nuevos.
