# Quinta entrega: ficha clínica y exportación histórica

## Actualización vigente de MAIN9c56854 · 15/10/2026

Merge del padre `f0b65c31`, con acciones y actividad/calorías de PR119/122 preservadas. Focal propio actual: **129 aprobadas, cero fallos; 9 archivos**. La suite global actual se verifica en CI; los conteos locales globales anteriores quedan como históricos. Tipos/build/migraciones/vistas/secretos aprobados. [Informe de actualización](main-sync-9c568-2026-10-15.md). El CI de esta cabeza se observa por separado; los resultados anteriores se mantienen como antecedentes. Sin cambios de producción.


**Actualización 15/10:** conciliada con main `2d31f9d` y la pila revisada. Suite propia **2.775 aprobadas, cero fallos, dos omitidas; 424 archivos**; tipos, build (8,51 s), migraciones, vistas y límites de secretos aprobados. Contacto, pestañas y adaptación móvil de la ficha se conservan al recuperar el gris original. Se corrigieron exclusivamente las dos comprobaciones de estado de permiso del recorrido: ahora verifican menú por IA en vez del primer casillero (grabación). Tres casos RED→GREEN y prueba de habilitación/retiro/403 en demo; [diagnóstico y límites](consent-browser-regression-2026-10-15.md). CI firmado nuevo pendiente por SHA. Las referencias y conteos del 14/10 que siguen son históricos.

Rama `codex/nutridesk-release-clinica`, base exacta `304413fcbe3dcec9012edac1952704d7635cd218` de entrega 4. Veintisiete archivos de módulo, contratos, utilidades, componentes y dos migraciones se recuperaron con huellas exactas de CORE `da070fbe7a5a8145985d9d8096d9ac21c0758d0f`, según la receta local y sus SHA256. Sin commit propio, push, configuración de proveedor, merge ni producción.

## Comportamiento

La ficha ofrece Historia clínica, Evolución, Notas de consulta, Plan actual, Plan semanal, Lista de compras, Registro alimentario, Chat, Archivos y Laboratorio, conservando Resumen, Planificación, Consultas y Cobros. Los alias anteriores continúan válidos. La cabecera usa teléfono, próxima cita y las consultas explícitamente finalizadas de entrega 2; asistencia y vencimiento horario no equivalen a consulta finalizada.

Laboratorio lee documentos y fotos localmente, presenta valores, operador, unidades, rangos y página/fuente para revisión. Se vincula al original privado y no diagnostica. Segmental conserva equipo, componente, segmento y unidad; compara únicamente entradas compatibles. Seguimiento bariátrico muestra cambios aritméticos y exceso de peso sólo con referencia revisada válida. Los métodos requieren aprobación de cada profesional.

Kerr admite las cinco masas declaradas del informe y comprueba suma, diferencia e incompletitud. **El cálculo automático permanece pendiente.** El artículo original de Ross y Kerr de 1991 está accesible en el [editor oficial](https://www.apunts.org/en-fraccionamiento-masa-corporal-un-nuevo-articulo-X0213371791052237), pero persisten discrepancias impresas de unidades, denominadores y definiciones, además de validación profesional pendiente. [Investigación y límites de la referencia candidata](kerr-fuente-primaria-2026-10-14.md). No se implementaron coeficientes a partir de memoria ni se trata esta investigación como fórmula aprobada.

La exportación completa requiere permiso de atención y alcance del consultorio; las notas privadas se incluyen sólo por selección explícita. Su PDF usa la marca nutricional existente y matrícula clínica, conservando originales y gráficos únicamente de mediciones canónicas. La descarga histórica separada admite la autorización externa específica de entrega 3 y devuelve sólo identidad, categorías y medidas autorizadas, con fechas, unidades y origen. No habilita la ficha completa ni convierte mediciones históricas en gráficos actuales. Retiro, vinculación y reasignación conservan los controles originales.

## Separación

El índice añade sólo el router clínico. Los componentes consumen el motor PDF y las dependencias heredadas de 4; no cambian package/lock, worker, Auth, rutas públicas, CSP ni OCR. No se añade agenda/equipo, cartera, comunicaciones ni manifiesto final; estos corresponden a entregas posteriores. JSON fuente de Nutrigo y registro del otro hilo intactos.

La demostración amplía sólo records/documents/references/brands del dominio clínico; conserva lotes, evidencia externa, nutrición y consultas. El fixture de exportación mantiene administrador, paciente, otro consultorio, anónimo e identidad sin rol clínico. No inserta en la tabla futura de recepción; el caso institucional con esa tabla se restaura al incorporar entrega 6. No se afirma que esa función esté implementada en esta cabeza.

## Migraciones

Sólo se agregan `20261012113000_clinical_workspace.sql` y `20261013123000_imported_clinical_export.sql`. Siete RPC autenticadas: approve_clinical_reference, deactivate_clinical_reference, save_clinical_brand, save_clinical_source_document, save_clinical_workspace_record, audit_clinical_access y export_patient_imported_history. La validación interna no recibe permisos públicos. Las migraciones se simulan en orden numérico; no se ejecutó SQL hospedado. `productionApplied:false`. La reversión es de aplicación y conserva registros, documentos, referencias y auditoría; no elimina datos clínicos ni ledger.

## Regression Guard — paso 10

- Flujos críticos: acceso heredado, ficha y alias, consultas finalizadas, extracción revisable y original privado, referencias, medidas compatibles, ficha exportable y exportación histórica parcial, retiro, dos consultorios y PDF local. Pruebas nuevas y heredadas; proveedores y dispositivos físicos no se verifican aquí.
- Regresiones: permisos externos no abren clínica actual; la evidencia no se hereda entre actores; estudio no revisado no pasa como aprobado; unidad incompatible no se compara; datos importados no sobrescriben mediciones actuales; notas privadas no entran en el PDF por defecto.
- Contratos: API/servidor/base, revisión explícita, documento con hash y origen, permiso de categoría, selección de notas, marca única y proyección histórica limitada. El límite HTTP de documentos clínicos es 28.000.000 bytes para contener el documento original permitido con envoltorio base64.
- Acoplamiento: wrappers mínimos sobre 4; siete funciones se incorporan al catálogo exacto; dominio demo conocido; el test de montaje permite clínica y mantiene ausentes módulos futuros. El DTO clínico completo reemplaza el DTO mínimo sin duplicar la marca editable ni el motor PDF.
- Áreas frágiles: permisos, retiro, archivos, versión/origen y exportaciones. RLS/CAS/auditoría y contratos revisables se comprueban en Postgres local. Las pruebas locales no simulan una entrega real de proveedores ni todos los bloqueos entre procesos de producción.
- Pruebas primero: el montaje inicial tuvo cinco fallos comprobados —dominio demo, límite HTTP, router, catálogo de funciones y disponibilidad de ficha— y un fallo de preparación por la tabla futura de recepción. Se aplicaron ajustes mínimos. El focal de quince archivos aprobó 75 casos y detectó el orden incorrecto del catálogo; tras conservar exactamente las siete incorporaciones y ordenar la lista, el guard completo aprobó. No se modificó SQL para satisfacer el test.
- Fire test: se cambió temporalmente a aprobada la extracción de laboratorio; la prueba de revisión falló (siete aprobadas y una fallida). Se restauraron los bytes originales y aprobaron los ocho casos. Sin datos reales ni producción.
- Automatizaciones: build OCR/PDF heredados, límites HTTP, catálogo de funciones, simulación de migraciones, pruebas de retiro/origen y scanner con control positivo. No se agrega el manifiesto final que exige entregas futuras.
- Gate previo a la corrección de marca sobre la base reparada `304413f`: **2.719 pruebas aprobadas, cero fallos, dos omitidas, 416 archivos**. Focal de dieciséis archivos: **82 aprobadas, cero fallos ni omitidas**, incluyendo clínica, exportación, montaje, permisos y la regresión de PostgREST heredada. Tipos, build (13,79 segundos), migraciones, vistas, secretos, auditoría y diff aprobados. No se atribuyen los 2.679 casos de la base a esta cabeza. No hay lint separado ni porcentaje de cobertura medido.
- Veredicto final: borrador revisable con suite propia y revisión independiente aprobadas después de corregir marca y lifecycle. Producción y proveedores continúan sin activar; no se declara entrega de correos, captura física ni fidelidad visual.

## Evidencia local

`npm ci --ignore-scripts` propio: 172 paquetes instalados, 173 auditados, cero vulnerabilidades. Build 8,64 segundos, con aviso habitual de módulo showroom grande. Reportes en `%TEMP%/planv-release5-{wiring-red,focal,grants-green-20261014-fixed,fire-red,fire-green,full}-20261014.json` (el reporte de grants usa exactamente `planv-release5-grants-green-20261014-fixed.json`); logs homónimos de tipos/build/migraciones/vistas/secretos. No contienen datos clínicos reales.

Gitleaks heredado 8.30.1: control sintético detectado, fuente corregida, historial y blobs grandes sin hallazgos. El primer escaneo señaló una línea pública de investigación Kerr; se simplificó el enlace de búsqueda y se quitó un código diagnóstico del bloqueo, sin ampliar ninguna excepción. El reporte redactado no permite atribuir el match a una parte concreta de esa línea. No se ocultó un secreto ni se activó un proveedor.

Se recuperó la entrega 5 sobre la reparación de PostgREST de entrega 4 mediante avance directo y aplicación del stash exacto, conservando backup y dependencias ignoradas. Nueve archivos recuperados tenían únicamente diferencias CRLF/LF; se verificó su contenido y se restauraron los bytes contra las huellas de la receta. Las veintisiete copias clínicas vuelven a coincidir byte a byte. La suite previa de 2.718 casos corresponde a la base anterior y no demuestra esta cabeza. El SQL nutricional reparado se hereda íntegro, sin diferencias propias.

Evidencia final: `%TEMP%/planv-release5-postbase-full-20261014.json` y `%TEMP%/planv-release5-postbase-focal-20261014.json`; logs `planv-release5-postbase-{check,build,migrations,views,secrets}-20261014.log`. Gitleaks final: fuente de 38,04 MB, 556 commits y 73,13 MB de historial, más 54,94 MB en fragmentos de objetos históricos grandes; cero hallazgos. Control sintético positivo detectado y auditoría de dependencias con cero vulnerabilidades. JSON fuente de Nutrigo, packages/lock, CI, CSP/OCR, worker y registro del otro hilo sin diferencias propias.


## Corrección de marca al descargar

La revisión independiente encontró que la ficha y el pedido de estudios podían reutilizar la marca mostrada al abrir la pantalla aunque la exportación reciente devolviera otra marca o ninguna. El consumidor ahora obtiene primero el paquete autorizado de la API, valida su marca con el contrato clínico y utiliza exclusivamente esa configuración para generar el PDF. Una marca retirada o inválida impide la descarga; no recupera logo, contacto ni firma anteriores. Los botones consultan también cuando la pantalla se abrió sin marca, para permitir una configuración creada después.

La prueba permanente ejecuta el botón real del componente renderizado con una configuración inicial y una respuesta API posterior: cambio de marca/logo, retiro, marca nueva, logo no permitido y pérdida de acceso. Antes del cambio, cuatro casos fallaron y uno aprobó; después, trece casos de cinco archivos aprobaron. No compara texto fuente ni replica el selector de marca en un helper de prueba. El fixture corresponde al contrato completo. Sólo se modificaron el componente y la prueba nueva en CORE y entrega 5, con bytes iguales; los otros veintiséis archivos de la receta conservan sus huellas. La cuenta anterior de 2.719 pertenece a la cabeza previa a esta corrección. Suite nueva en ejecución; no se reutiliza su aprobación.


## Cierre y cambio de paciente durante el PDF

La segunda revisión encontró descargas tardías después de cerrar la ficha o pasar de A a B. Cada operación tiene bloqueo inmediato, paciente y generación; el cleanup de layout revoca el montaje antes de pintar otra vista. Se comprueba vigencia después de guardar, después de consultar el paquete autorizado y después de generar bytes, antes de descargar. Resultados obsoletos no generan descargas, cambios de estado ni refrescos. La navegación existente registra formulario sucio y operación ocupada. Las operaciones de exportación y guardado no exponen señal de abortado en su contrato heredado; se descartan respuestas obsoletas sin modificar ese API.

El pedido refresca la ficha sólo después de descargar y limpiar sus campos, para no desmontar su propio consumidor durante la preparación. Si el pedido ya se guardó pero falla PDF, conserva campos y registro y muestra ese resultado; no simula deshacerlo ni dispara una recarga que borre el mensaje.

Seis regresiones del consumidor fallaron en la versión previa: cierre durante API, A→B durante build, refresco prematuro del pedido, pedido ya guardado con PDF fallido, bloqueo de navegación ocupado y doble clic antes de repintar. El RED válido es planv-release5-lifecycle-red-20261014-actual.json; la primera versión del harness se descartó porque dos casos no interceptaban el runtime JSX de desarrollo. Los tests ejecutan callbacks, hooks y cleanups del componente real con framework/transportes controlados y estados iniciales ficticios, sin replicar selección de marca ni extracción por texto fuente. No demuestran navegador o hardware reales. GREEN focal: 37 casos en nueve archivos; tipos, build6,97s, migraciones, vistas y secretos aprobaron. Suite propia nueva en ejecución; el run interrumpido de marca no cuenta como gate final.

## Gate final posterior a ambas correcciones

Suite completa propia: **2.730 aprobadas, cero fallos, dos omitidas, 418 archivos**; `planv-release5-lifecycle-full-20261014.json`. Comenzó el 14/10 a las 18:44:49 UTC y terminó a las 18:52:10 UTC; ningún archivo de aplicación/servidor/SQL cambió después de comenzar. Tipos, build (6,97 segundos), migraciones, vistas, secretos y control positivo del escáner aprobados. Focal final de 37 casos en nueve archivos; revisión independiente final de once casos en dos archivos, sin P1/P2 abiertos. Esas cuentas no se suman a la suite.

[Revisión independiente material y evidencia](nutridesk-release-clinica-review-2026-10-14.md). El paquete conserva los JSON fuente de Nutrigo y el registro del otro hilo; la marca usa el contrato nutricional heredado. La prueba de seguridad de montaje conserva CSP/OCR y permite ahora clínica, manteniendo fuera agenda y operaciones futuras. La recepción institucional real se prueba al incorporar sus tablas en entrega 6.

Gate local aprobado para revisión en PR. El CI de la nueva cabeza se comprobará después del push. No hubo merge, aplicación de SQL hospedado, configuración de servicios, correos ni publicación a pacientes.
