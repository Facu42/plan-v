# Importar historia sin crear cuentas

La revisión detectó un faltante real: se podían importar contactos, pero para sus antecedentes, estudios, planes y medidas había que vincular una cuenta para registrar permisos. El plan aprobado separa importación, cuentas e invitaciones. Se completó una vía de autorización **limitada a importar historia**, sin modificar el consentimiento general de la app.

## Recorrido y límites

1. Leer los archivos localmente, asociar cada fila con su paciente y revisar texto, fechas, unidades y origen.
2. Crear primero el contacto. La pantalla conserva el contenido clínico en esa revisión local y ofrece **Continuar con datos históricos**. Crea un lote nuevo de incorporación, con la ficha recién creada, sin volver a crear contacto, cuenta o invitación. Si se cierra el navegador, hay que volver a leer los originales: el contenido clínico pendiente no se guarda en almacenamiento del navegador ni en borradores del servidor.
3. La profesional registra una evidencia de autorización ya obtenida fuera de la app: fecha, fuente, documento y SHA-256 calculado localmente, propósitos concretos y confirmación de que corresponde a esa paciente. El documento permanece local; la aplicación guarda su referencia y huella, no verifica una firma ni declara cumplimiento legal.
4. Incorporar los datos revisados. Antecedentes, estudios y planes quedan privados; los planes no se publican. Las medidas conservan valor, fecha y unidad originales como snapshots históricos con origen. Se ven en **Historia importada** y no reemplazan mediciones actuales ni habilitan cálculos nuevos. El export clínico incorporará estos snapshots en su entrega correspondiente.
5. Desde la importación o la historia de la ficha se puede retirar la autorización con motivo y confirmación explícita. El retiro bloquea nuevas incorporaciones y la lectura apoyada en esa evidencia; mantiene los registros y su auditoría. Una evidencia anterior al retiro no la restablece. Un consentimiento online retirado tampoco se sustituye mediante este circuito.

Esta autorización nunca activa IA, grabación, correo, WhatsApp ni herramientas de procesamiento. No inserta `consent_events`, no amplía `care_consent` ni modifica `grant_consent`. Una ficha con cuenta vinculada usa su circuito de Privacidad. Registrar, consultar o retirar evidencia exige titularidad del consultorio; recepción y administrador no reciben acceso clínico por su rol.

## Contratos y persistencia

- `GET /api/patient-imports/patients/:id/authorization` devuelve paciente, revisión, estado de cuenta, evidencia visible propia y propósitos habilitados.
- `POST` en esa misma ruta exige `request_key`, `expected_revision`, `obtained_on`, `source`, `document:{file,fingerprint}`, `purposes` y `confirmed:true`.
- `POST /authorization/revoke` exige una revisión vigente, identidad estable de solicitud, motivo y confirmación explícita.
- Propósitos admitidos: `history`, `study`, `plan`, `measurement`. Se rechazan permisos de app y campos adicionales.
- El registro usa bloqueos de paciente e ingreso, revisión CAS e idempotencia; guarda evidencia y auditoría en la misma transacción. La incorporación mantiene una subtransacción por fila, con resultado individual y reintento de lo pendiente.
- La evidencia conserva el actor original: una transferencia de consultorio no concede al nuevo titular acceso a la evidencia ajena ni autorización heredada, aunque el mecanismo de transferencia actualice los ámbitos de las tablas hijas. La revisión CAS es global por paciente; el nuevo titular puede registrar su propia evidencia con esa revisión.
- La clave de origen incluye paciente y contenido, y es común a los circuitos externo y online. La compatibilidad con claves anteriores sólo reconoce registros del mismo paciente. Vincular una cuenta y otorgar permisos online no vuelve a importar la misma historia o medida.
- `imported-history` agrega `measurements` a su respuesta. Son registros separados de `care_records` y `measurements`; la lectura se controla por autorización externa o permisos online correspondientes, con RLS y asignación actual.

## Regression Guard: paso 10

- **Flujos críticos:** contacto → evidencia revisada → incorporación sin cuenta ni mail; retiro; vinculación de cuenta; aislamiento entre consultorios y reasignación; unidades/fechas/orígenes y errores parciales. Pruebas SQL con todas las migraciones, API demo y contratos web.
- **Regresiones:** pérdida del contenido clínico al terminar la creación; evidencia heredada tras transferencia; mismo origen devolviendo otra paciente; importación repetida al cambiar a permisos online. Las pruebas reprodujeron esos faltantes antes de sus correcciones.
- **Contratos:** esquemas compartidos estrictos, rutas autenticadas, cliente, pantalla, RPCs, RLS y catálogo de funciones revisados. La función online interna conserva su escritor de registros y cambia únicamente la clave de deduplicación y su compatibilidad por paciente.
- **Áreas frágiles:** asignación, consentimiento, importación e idempotencia. Se revalidan bajo bloqueos; retiro online posterior prevalece; la vinculación durante una revisión corta la vía externa. No hay autorización clínica automática desde el archivo.
- **Migración:** `20261013120000_patient_import_external_authorization.sql`, transaccional y aditiva. No borra historias ni altera datos previos. El importador online previo se conserva como función interna; no tiene grants para clientes ni servicio. Reversión operativa: deshabilitar las nuevas entradas y conservar evidencia, auditoría y snapshots; no borrar datos clínicos como rollback. No se aplicó en producción.
- **Fire test:** retirar temporalmente la comparación con el actor original hizo fallar la prueba de reasignación por permisos heredados y evidencia expuesta. Se restauraron los bytes originales y las pruebas SQL/manifiesto volvieron a pasar. El primer filtro del ensayo omitió casos por caracteres acentuados; se corrigió el filtro y se verificó un fallo real, no un resultado omitido.
- **Automatizaciones:** catálogo de RPCs, permisos directos de tablas, esquemas, pruebas de retiro/duplicados y manifiesto canónico. El manifiesto ahora enumera dieciséis migraciones y utiliza `sha256-utf8-lf-v1`.
- **Verificación:** ejecución final focal de **137 casos en diez archivos**, cero fallos, incluida la deduplicación con ledger antiguo y cambio a permisos online. Tipos, migraciones, manifiesto canónico de dieciséis archivos, secretos y diferencias aprobados. Compilación web aprobada, con avisos existentes de chunks y fuentes estáticas/dinámicas; después sólo se reforzó SQL/deduplicación del servidor y esta documentación. La verificación final del integrador debe volver a incluir la suite completa. No hay script de lint. No se midió fidelidad visual ni se probaron documentos de pacientes reales.
- **Veredicto:** preparada para revisión independiente del integrador; publicación y producción permanecen pendientes. Esta evidencia corresponde a datos ficticios y base local, no a una habilitación externa o validación legal.
