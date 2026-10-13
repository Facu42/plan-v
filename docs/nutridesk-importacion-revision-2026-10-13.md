# Revisión independiente: importación y exportación histórica

13/10/2026, copia aislada `nutridesk-core`. Datos exclusivamente ficticios. Navegador gstack, Vite local en 5188 y API demo local en 3018; Supabase, proveedores de IA, SMTP y pagos desactivados. Copia demo nueva y separada de la prueba anterior, conservada en el directorio temporal. Ninguna acción de producción.

## Recorrido observado

- CSV con contacto, antecedente y peso de 140 lb del 02/01/2020. Asociación manual de la columna de unidad; revisión explícita de paciente, fecha y contenido.
- Crear contacto conserva el contenido clínico de la revisión para «Continuar con datos históricos», sin crear cuenta ni invitación.
- Registrar evidencia ficticia de autorización, calculando SHA-256 del documento local; activar sólo antecedentes y medidas históricas. Nueva revisión de la fila antes de incorporar.
- La historia muestra el texto y la medida originales, con archivo/hoja/fila, manteniendo 140 lb y la fecha original. El permiso general de atención continúa sin estar vigente.
- Con marca ficticia del consultorio configurada, «Descargar PDF de históricos importados» termina y comunica éxito. La proyección HTTP contiene únicamente identidad mínima, históricos autorizados y marca del titular. No se habilita exportación clínica completa mediante este permiso.
- Retiro con motivo y confirmación desde el navegador: historia y mediciones devueltas por API pasan a cero; exportación histórica devuelve 403; desaparecen los datos y el botón de PDF de la pantalla.
- Anchos 1440 y 390: `scrollWidth` coincide con `innerWidth`; no desborde horizontal. Capturas locales ficticias en `design/auditoria/nutridesk-2026-10-13/` (ignoradas por Git). No se midió fidelidad visual contra Figma ni contraste exhaustivo.

## Pruebas independientes

La nueva función hizo fallar el catálogo de funciones autorizadas y el inventario de migraciones antes de incorporarla. Se agregó exclusivamente `export_patient_imported_history` al catálogo, en orden alfabético, y se regeneró el manifiesto canónico con diecisiete entradas. La primera actualización del catálogo quedó fuera de orden; se corrigió el orden sin relajar la comprobación.

Cierre focal: **109 pruebas aprobadas en seis archivos**, cero fallos. Incluye grants, tablas internas, manifiesto, exportación SQL, rutas y texto extraído de un PDF real. El SQL comprueba titulares, permisos parciales, otro consultorio, paciente, recepción, administrador, anon, retiro y reasignación. La ruta añade la comprobación previa del actor y del titular.

Reportes JSON temporales: `planv-export-root-red.json` y `planv-export-root-green.json`. Suite integrada completa pendiente del cierre de la revisión concurrente de notas de consulta.

## Regression Guard, paso 10

- Flujos: lectura local, contacto, autorización, incorporación, PDF y retiro; observados con datos ficticios y respaldados por pruebas locales.
- Regresiones: contenido clínico pendiente perdido al crear contacto, autorización heredada, duplicados por cambio a cuenta online; cubiertas por el módulo de importación. Exportación separada impide acceder a la clínica actual por el permiso limitado.
- Contratos: esquema/RPC/RLS/API y categorías del PDF revisados. Marca del consultorio leída del ámbito del titular.
- Áreas frágiles: identidad de paciente, consentimiento y versión. Cambiar o retirar permisos se comprueba en servidor y SQL; no hay concesión de permisos generales de app.
- Migraciones: nuevas 13120000 y 13123000 aditivas, sólo ejecutadas en bases locales temporales. Rollback detiene funciones nuevas y conserva datos y auditoría.
- Fire test: evidencia de actor original comprobada en el informe de autorización; catálogo e inventario detectaron realmente la función y el archivo nuevos.
- Automatización: catálogo estricto y manifiesto de diecisiete archivos con SHA-256 de UTF-8/LF. Verificación SQL de permisos y contenido original del PDF.
- Veredicto: recorrido local aprobado; habilitación de producción depende del cierre global, revisión de la pila y autorización correspondiente. No se probaron documentos ni cuentas de pacientes reales.
