# Fase 3 · Pacientes con resumen rápido

## Resultado

Tabla según la composición aprobada, con Todas, Activas, Necesitan atención, Acceso pendiente y Archivadas. Búsqueda sin acentos, orden por próxima consulta/nombre/adherencia y preferencias de columnas/densidad. Próxima consulta, plan, adherencia, peso, cuota y app usan datos existentes; un dato desconocido se presenta como tal. Importar, crear, editar, invitar, seguir, escribir, archivar y restaurar conservan sus operaciones; las acciones de cada fila están en Más opciones. Los datos semanales anteriores siguen accesibles.

Tocar la fila, Enter o Espacio abre el resumen debajo de ella; queda una sola abierta. Escape devuelve el foco. Muestra próxima consulta, adherencia, peso autorizado, cuota, avisos, último resumen publicado y un acceso con dato corto por cada una de las 14 secciones actuales de Plan V. Escribir, Armar plan y Abrir ficha completa conservan navegación por paciente. Archivo/restauración invalidan el resumen y las columnas; una ficha archivada no ofrece enlaces clínicos. Las peticiones canceladas no escriben datos tardíos de otra paciente. Error de lectura visible con Reintentar.

Entrada de filas 300 ms con 28 ms de separación, hover de fondo/avatar/nombre/adherencia/flecha, despliegue 300 ms y giro de flecha. La regla de reducción de movimiento elimina transformaciones y despliegue espacial; conserva fundidos. Revisión de esta regla en código, sin afirmar simulación de una preferencia del sistema ni lector de pantalla.

## Contratos y privacidad

- `GET /api/crm/patients/:id/preview`: alcance profesional propio, rechazo de ficha ajena/desactivada, estado de archivo y consentimiento vigente. Devuelve metadata y un extracto publicado de hasta 301 caracteres; no transcripción, audio, notas privadas, cuestionario completo ni archivos.
- `POST /api/crm/patients/directory-summary`: máximo 50 ids, valida el lote entero antes de consultarlo y limita la concurrencia a cinco. Devuelve sólo id, posibilidad de abrir, plan y último peso permitido. El cliente recorre lotes de 50; no trae la ficha para llenar columnas.
- Los permisos se leen de metadata de eventos y estado del ingreso, sin el RPC que carga notas clínicas. El resumen consulta el ledger de esa paciente, sin leer la facturación del consultorio entero. El plan consulta el último estado publicado, programado y borrador por separado; no pierde un estado por truncar diez versiones.
- Último peso hasta hoy, ordenado por fecha de captura y creación; retiro de consentimiento devuelve null tanto en columna como en resumen. RLS y rol se verificaron con dos consultorios en Postgres descartable. Ningún permiso, tabla o configuración de producción cambió.

## Evidencia

[Comparación navegable](../../design/panel-nutri/fase-3-verificacion.html) · [Resultados de /browse](../../design/panel-nutri/fase-3/resultados.json).

Verificación estable final: `npm test -- --maxWorkers=4`, **3.164 aprobadas, dos omitidas y 489 archivos**, iniciada 08:39:24 ART, duración 180,84 s. `npm run check` y build aprobados (22,22 s); control de secretos aprobado. No hay comando de lint separado en el proyecto. Build conserva avisos anteriores de paquetes grandes/anotaciones de dependencias. /browse: **22 comprobaciones y seis combinaciones**, con ocho capturas. Comparación interactiva comprobada: todas las imágenes cargan y sus controles cambian tema/vista.

Las capturas incluyen tabla y resumen, 1440×900 y 390×844, en ambos temas. QA cubre una fila abierta, teclado/foco, filtros, búsqueda, alta/importación/edición disponibles, archivo/restauración reales en memoria, ocultación clínica al archivar, reintento tras 503 simulado localmente, navegación al Registro alimentario, columnas móviles y giro de la flecha. Sin desborde lateral en 1440/390/1280. Navegación a ficha conserva el 403 esperado de consultas completadas porque la demo no tiene permiso de relación de atención. No se simuló autorización ni se envió un mensaje.

Fire test: se retiró intencionalmente la comprobación de permiso de atención sólo en el servidor local de pruebas; el caso de retiro de consentimiento falló. Fuente restaurada y 11 pruebas de API aprobadas. Revisión independiente de código: 33 casos focales aprobados, sin P1/P2 tras corregir carga completa e invalidación. Revisión visual independiente de ocho capturas y reglas móviles; flecha corregida y evidencia renovada.

## Límites

Demo local con datos ficticios; sin cuenta real, teléfono físico ni lector de pantalla. El test Postgres usa migraciones reales y sesión simulada con RLS, sin Auth/PostgREST remoto. No se afirma envío de invitación por correo, grabación, IA externa, publicación de plan ni integración con proveedores. Los flujos previos conservan su cobertura de la suite existente. El total de atención mantiene la regla anterior de registros por revisar, sin inventar un indicador clínico nuevo.

## Regression Guard · paso 10

- **Flujos críticos verificados:** ✅ suite completa estable (3.164 aprobadas, dos omitidas, 489 archivos): acceso/roles, alta/importación/invitación, archivo, plan/versiones, cobros y mensajes; ✅ rutas nuevas con dos consultorios y rol paciente en Postgres descartable; ✅ /browse comprueba filtros, teclado/foco, alta/importación/edición disponibles, archivo/restauración, resumen, fallo/reintento y navegación a la ficha. Sin afirmar Auth remoto ni envío real.
- **Regresiones cubiertas:** resumen y columnas se invalidan al archivar/restaurar; ficha archivada sin enlaces clínicos; abortos y errores sin datos cruzados; último peso excluye fechas futuras y permisos retirados; estado del plan sin truncamiento arbitrario; opciones accesibles aunque la fila esté animada; filtros/columnas/densidad y resumen semanal conservados.
- **Contratos revisados:** API/cliente de resumen individual y lote, secciones compartidas de ficha, metadata de plan/peso, alcance profesional, consentimiento, cobros y rutas por paciente. Tipos compartidos y validación de lote en servidor.
- **Áreas frágiles:** permisos clínicos (consulta acotada y retiro cubierto), resumen asíncrono (abortos y reinicio por archivo), menú sobre filas animadas (popover en capa superior), columnas móviles (grilla responde a preferencias), cuotas (ledger propio y resumen existente).
- **Migraciones:** N/A. Sin SQL remoto, dependencias, claves ni configuración de producción.
- **Fire test:** detectado y restaurado; once pruebas de API aprobadas después de restaurar el permiso.
- **Automatizaciones nuevas:** contratos de resumen, RLS y metadatos, columnas/enlaces, orden del directorio y recorrido reproducible `scripts/panel-nutri-pacientes-qa.mjs`. Sin pasos nuevos de despliegue dependientes de memoria humana.
- **Veredicto:** SHIP para fase 3 en su propio PR. Suite, tipos, build y secretos aprobados; revisiones independientes sin P1/P2. Los límites de entorno no se presentan como pruebas en producción ni como cierre de fases 4–9.

## Continuidad

Sigue fase 4: Ficha con las once pestañas del boceto, conservando los accesos operativos existentes. Empezar por `ProfessionalPatientWorkspace.tsx`, las secciones compartidas y el bloque de ficha del boceto; el resumen de Pacientes ya enlaza cada destino. Notas de consulta conserva su lógica y permisos; corresponde rediseño visual. Una rama y PR propios.

## Control remoto del PR #152

La primera ejecución E2E de CI falló por un selector anterior al rediseño: intentaba Abrir ficha/plan sin abrir Más opciones. Se actualiza el recorrido para pulsar primero el menú visible, conservando todas las aserciones. Integración pendiente hasta que la nueva ejecución y signed-auth estén aprobadas; no se integra con un control rojo.
