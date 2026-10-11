# Clasificación de las 16 tablas internas (2026-10-01)

Punto 3 de la revisión posterior al PR #40. **Las 16 tablas deben conservar el
acceso directo cerrado, sin agregar políticas para usuarias.** No se detectó
una apertura de permisos en estas tablas. El aviso informativo del asesor queda
justificado para este estado del esquema; no certifica por sí solo las funciones
que trabajan con ellas.

## Comprobación en la base publicada

Proyecto existente `plan-v-app` (`wvosvlxpfytokwfbcero`), base de código
`4b54dc1e4dab11de9a3428d26f4ef0847f4dac95`. Inventario observado el
1/10 a las 18:53 UTC y comprobaciones complementarias posteriores:

- Exactamente 16 tablas de `public` con RLS activo y ninguna política.
- Dueño `postgres`, sin forzar RLS al dueño. Los accesos privilegiados del
  servidor/dueño son deliberados; RLS no los limita.
- `anon` y `authenticated` sin SELECT, INSERT, UPDATE, DELETE, TRUNCATE,
  REFERENCES, TRIGGER ni MAINTAIN. Sin permisos parciales por columnas,
  incluidas las referencias. Comprobación de permisos efectivos, no solo del texto
  de las migraciones. TRUNCATE necesita esta comprobación porque RLS no lo controla.
- `service_role` conserva lectura, inserción, actualización y borrado.
- Ninguna vista ni vista materializada depende directamente de estas tablas.
  Tampoco hay disparadores de usuaria instalados sobre ellas. Las funciones sí
  pueden usarlas: se inventariaron referencias textuales en los cuerpos del catálogo.
- Asesor: 16 INFO de tablas sin políticas y 116 WARN de funciones elevadas
  ejecutables con sesión. Este trabajo no cambia esos contadores.

Solo se consultaron catálogos: ninguna fila de pacientes, solicitudes, pagos,
paquetes o tareas. No hubo escrituras en producción, migraciones, cambios de
planes ni contratación de recursos.

[Evidencia completa de permisos y funciones](security/tablas-internas-2026-10-01.json).

## Decisión por tabla

“Interna” significa que la app no accede directamente a la tabla con la sesión de
la usuaria. Algunas sostienen funciones de la app que sí están disponibles por
operaciones específicas con controles de identidad y vínculo.

| Tabla | Finalidad | Acceso previsto y decisión |
| --- | --- | --- |
| `audit_events` | Historial administrativo y de suscripciones. | Funciones administrativas y auxiliar `service_audit` cerrado. Mantener interna. |
| `notification_deliveries` | Estado e intentos de entrega de avisos. | Funciones de cola filtran el paciente; auxiliares de lectura cerrados. Mantener interna. |
| `notification_preferences` | Preferencias de avisos de cada usuaria. | `get/save_notification_preferences` usan `auth.uid()`, sin aceptar identidad ajena. Mantener interna; la función reemplaza el acceso directo. |
| `nutritionist_subscriptions` | Prueba, acceso y vencimientos del servicio. | Funciones `admin_*` controlan administrador; inicio de prueba y recomputación son internos. Mantener interna. |
| `outbox_events` | Cola de avisos por paciente. | Operaciones de entrada controlan el vínculo con la paciente. Mantener interna. |
| `patient_invite_events` | Historial de invitaciones. | Aceptación valida destinataria; la API escribe con el cliente privilegiado después de validar la invitación con la sesión. Mantener interna. |
| `payment_webhook_events` | Deduplicación de eventos externos de pago. | Tabla reservada: no se encontró escritor actual en la API ni función del catálogo que la use. Mantener cerrada; no se afirma que la integración esté funcionando. |
| `platform_admins` | Administradores autorizados. | `is_platform_admin` devuelve solo si la identidad actual es administradora. No permite leer o modificar la lista. Mantener interna. |
| `platform_settings` | Precio mensual y días de prueba. | Panel administrativo y lectura interna al crear organización/iniciar prueba. Mantener interna. |
| `privacy_access_events` | Historial de operaciones de privacidad. | `record_privacy_access` valida la paciente propia. Mantener interna. |
| `privacy_export_packages` | Paquetes de exportación temporales. | Funciones validan la paciente y la descarga comprueba vencimiento. Mantener interna; queda pendiente el contrato de finalización indicado abajo. |
| `privacy_requests` | Pedidos de exportación y retiro. | Funciones comprueban paciente propia; respuesta auxiliar cerrada. Mantener interna; no confundir desactivación con borrado completo. |
| `processing_jobs` | Almacenamiento previsto para tareas persistentes. | Existe el adaptador `createPostgresJobStore`, pero `processQueue` usa memoria y no lo conecta. Mantener cerrada; no se afirma persistencia ni coordinación entre API y worker. |
| `recipe_day_assignments` | Recetas asignadas a fecha y comida. | Asignación, listado y registro controlan profesional/paciente; `recipe_day_json` cerrado. Mantener interna. |
| `recipe_version_cards` | Ficha y macros declarados de una versión. | Escritura verifica dueña y borrador; lectura por recetas autorizadas, auxiliar `recipe_card_json` cerrado. Mantener interna. |
| `service_payments` | Pagos de la nutricionista a Plan V. | Registrar/anular exige administrador; representación y recomputación son internas. Mantener interna. |

Fuentes del código: migraciones core, jobs, privacy_ops, notification_outbox,
recipe_cards_days, service_admin y close_internal_functions;
`server/db/supabase-client.ts`, `server/db/supabase-repo.ts`,
`server/jobs/postgres.ts` y `server/jobs/queue.ts`. El JSON conserva las
referencias directas detectadas en los cuerpos reales. La búsqueda textual no es
un grafo completo de llamadas transitivas o SQL dinámico.

## Pruebas y límites

Nueva prueba `server/security/internal-tables.postgres.test.ts`: **38 casos
aprobados**, con una base local descartable y las migraciones completas, partiendo
de los permisos abiertos por defecto que otorga Supabase. Comprueba el inventario
exacto, todos los permisos de tablas y columnas, denegaciones reales para ambos
roles públicos, permisos del servidor y ausencia de vistas dependientes.
Comprueba además que una usuaria guarda y lee sus preferencias por la función
autorizada y otra conserva las propias. Todas las escrituras de esas pruebas son
locales y usan identidades ficticias.

Validación general final: `npm test -- --maxWorkers=4`, **212 archivos,
1109 pruebas aprobadas y 2 omitidas**. `npm run check` aprobado. No se agregaron
ni modificaron migraciones.

Revisiones finales de `code-reviewer` y `reality-checker` sin bloqueos; el segundo
corroboró además que los dos adaptadores reservados no están conectados al flujo
productivo. No repitieron la suite general ni realizaron acciones en producción.

Las identidades SQL están simuladas; no equivalen a sesiones firmadas atravesando
Auth y PostgREST. La comprobación con sesiones reales sigue pendiente (punto 4).
Esta clasificación tampoco revisa las 116 funciones en su totalidad. Sigue
pendiente el contrato de finalización de exportación/borrado mediante llamada
directa, ya registrado en los [informes de funciones sensibles](revision-funciones-sensibles-2026-10-01.md)
y sus [correcciones](correcciones-funciones-sensibles-2026-10-01.md).
Los dos adaptadores reservados señalados arriba requieren trabajo separado si se
decide habilitarlos.

La [documentación de Supabase sobre acceso a la API](https://supabase.com/docs/guides/api/securing-your-api)
distingue permisos de objetos y controles de filas. El [aviso 0008 del asesor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
se conserva como aviso esperado: agregar políticas de acceso directo cambiaría
este modelo sin resolver un problema demostrado.

