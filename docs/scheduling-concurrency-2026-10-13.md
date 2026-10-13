# Agenda: concurrencia y conciliación de Google (13/10/2026)

Implementación local en `codex/nutridesk-core`, sin publicación ni cambios en producción.

## Comportamiento y contratos

Las desconexiones conservan un identificador de época privado. OAuth y la renovación de credenciales sólo guardan cuando coinciden la época y, para refresh, la reserva exclusiva vigente. Una respuesta antigua no puede restaurar una cuenta desconectada ni reemplazar una autorización nueva. Dos procesos no renuevan la misma credencial rotatoria simultáneamente.

Las notas de una profesional delegada y la revocación toman primero el bloqueo del paciente y después el de la asignación. La nota vuelve a comprobar los permisos después de esperar; recepción sigue sin acceso clínico.

Cada escritura de Google exige token exclusivo, revisión de consulta, época de conexión, revisión de configuración y ficha activa en el consultorio. El evento incluye su revisión privada y usa la revisión de Google para escribir condicionalmente. El trabajador renueva su reserva antes y después de las solicitudes. Una escritura que pudo llegar a Google queda `uncertain` y no se repite automáticamente, incluso tras reiniciar o cambiar el turno.

La recuperación es una revisión explícita, con dos lecturas a Google:

- Reserva: `GET /api/scheduling/bookings/:id/google-review?expected_revision=N`.
- Turno manual: `GET /api/team/:nid/appointments/:id/google-review`; revisión esperada opcional.
- Respuesta: `{revision, review:{matched,found,remote_start,remote_duration,remote_revision,can_requeue}, proof}`.
- Confirmación: `POST` a la misma ruta con `/confirm`, cuerpo `{expected_revision,proof,action:'accept_match'|'requeue',confirmed:true}`.
- Resultado: `{resolved:true,queued:boolean}`. Una coincidencia se reconoce sin reenviar. Un evento propio viejo o ausente sólo se encola tras confirmación. No se modifica Google desde estos endpoints.

La prueba firmada vence a los cinco minutos y se vincula a consultorio, consulta, revisión, época, configuración y resultado leído. Se rechaza si cambia la evidencia, la cuenta original, el calendario, la revisión, el permiso de recepción o el token. La cuenta/calendario de la escritura se conservan en el trabajo. Eventos ajenos o con revisión superior nunca se sobrescriben.

## Verificación ECC y Regression Guard

1. **Flujos críticos:** desconectar/reconectar, OAuth, refresh, sincronizar/cancelar, revocar delegación, reiniciar trabajador y conciliar. Cubiertos por pruebas focalizadas. Pendientes: integración real con Google/MP y observación de dos conexiones PostgreSQL esperando el bloqueo de paciente.
2. **Regresiones:** cuatro pruebas asíncronas reprodujeron la restauración de credenciales y escritura de trabajos antiguos (RED), luego pasaron. El fixture sin la nueva migración falló los controles SQL. La prueba del módulo de conciliación comenzó RED por ausencia del módulo.
3. **Contratos:** las dos rutas de recuperación exigen autorización; confirmación explícita y CAS en SQL. No se envía contacto ni contenido clínico a Google. No se cambian cuentas receptoras de pagos desde un retorno del navegador.
4. **Acoplamiento:** los proveedores reciben una función de comprobación del trabajo; credenciales, épocas y leases quedan en repositorio/SQL. Se reutilizan las agendas y roles existentes.
5. **Migración:** `20261012134000_scheduling_concurrency.sql`, aditiva, tablas privadas y RPC nuevos exclusivamente `service_role`; no amplía acceso autenticado. Aplicación pendiente. Detener trabajadores e integraciones antes de una actualización; no considerar seguros trabajos anteriores cuyo envío no pueda establecerse. Para retroceder, detener integraciones/trabajadores y conservar registros, épocas y estados inciertos; no borrar evidencia ni volver al proveedor anterior con credenciales activas.
6. **Verificación ejecutada:** `npx vitest run server/scheduling --maxWorkers=1`: **47 pruebas, 8 archivos, todas pasan**. Tipos servidor y `npm run check` global pasan en la última ejecución. Migraciones, secretos y diferencias pasan. Compilación web y suite completa corresponden al cierre del integrador.
7. **Áreas frágiles:** rotación de credenciales, revocación mientras se espera un bloqueo y confirmación posterior a un HTTP externo. Se agregaron comprobaciones persistentes y estados inciertos conservadores.
8. **Fire test:** sólo en PGlite desechable, el control de escritura se reemplazó por `true`; la prueba detectó aceptación de token inválido (RED). Restaurado el fixture, suite de agenda GREEN. Sin mutaciones de producción.
9. **Automatización:** CAS/leases/épocas, snapshot de cuenta/calendario, firma con vencimiento, rechazo de reenvío incierto y pruebas de aislamiento reducen pasos manuales. Antes de habilitar: instalar migración, comprobar `SCHEDULING_BOOKING_SECRET` y credenciales de integración, probar OAuth/Calendar real y montar/verificar controles de recuperación en ambas interfaces.
10. **Veredicto:** **HOLD para publicación** hasta revisión independiente e integración/QA externa autorizada. Los cambios locales quedan implementados y verificables; Google y PostgreSQL no forman una transacción atómica. La lectura y los controles no prueban entrega o sincronización real en un proveedor.

## Revisión clínica independiente

Se informaron al integrador dos hallazgos: repetición de solicitudes de IA con gasto incierto al cambiar la clave de reintento, y ausencia de `care_relationship` en el permiso del trabajador persistente. El integrador corrigió ambos; la revisión posterior comprobó `readState` para reservar/cobrar/incierto, fingerprint por tarea/sesión/revisión/alcance y consentimiento de atención en SQL, incluyendo cancelación por retiro. No se modificaron archivos clínicos desde esta entrega ni se atribuye aquí ejecución de sus pruebas.
