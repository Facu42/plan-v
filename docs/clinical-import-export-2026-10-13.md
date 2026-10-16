# Exportación de históricos importados

La exportación clínica completa conserva su permiso de atención y agrega las medidas históricas importadas en un campo separado, junto a los antecedentes y planes importados. El PDF conserva fechas, valores, unidades originales y procedencia: archivo, hoja, página, fila y huella. Estos históricos separados no se agregan a la gráfica de peso ni a cálculos actuales.

Para fichas sin cuenta existe otra descarga: **Descargar PDF de históricos importados**. Su endpoint y la función de base devuelven sólo nombre/identificación y registros históricos autorizados por categoría. No devuelven ingreso actual, notas privadas, consultas, archivos actuales ni medidas canónicas. La marca del PDF proviene de la configuración propia del consultorio. La evidencia externa no habilita el exportador clínico completo ni crea consentimientos de app.

Contrato nuevo: `GET /api/patients/:id/clinical-workspace/imported-export`, tipo `ImportedClinicalExport` y RPC `export_patient_imported_history(uuid)`. La migración aditiva `20261013123000_imported_clinical_export.sql` reutiliza las decisiones vigentes de `patient_import_authorization_state`, verifica titular actual y registra auditoría. Sólo la sesión autenticada puede ejecutar la función; paciente, administración, recepción, otro consultorio y anónimo reciben denegación. El manifiesto y el catálogo de funciones fueron actualizados por el coordinador.

El módulo de importación anterior con cuenta vinculada puede haber guardado medidas en los registros canónicos, con origen en sus notas. Esta corrección conserva esos registros y no los migra ni cambia estadísticas anteriores. La vía externa nueva conserva snapshots históricos separados; la exportación no los convierte en medidas actuales.

## Regression Guard: paso 10

- Flujos críticos: exportación completa con permiso de atención, exportación sólo histórica sin cuenta, permiso parcial de una cuenta vinculada, revisión del propietario y descarga local. Cubiertos por API, Postgres local y lectura real del texto del PDF; montaje de la acción realizado por el coordinador.
- Regresiones: ausencia de medidas importadas en la ficha descargada, pérdida de unidades y procedencia, acceso operativo indebido, categoría no autorizada, autorización externa heredada tras reasignación y retiro de permiso. Las pruebas cubren cada caso.
- Contratos: tipos cliente/servidor, proyección SQL mínima, listas históricas autorizadas y composición de secciones PDF. Históricos y mediciones canónicas permanecen en campos separados; la gráfica actual usa exclusivamente las canónicas.
- Áreas frágiles: permiso por categoría y cambio de titular durante exportación. La función comprueba propiedad y permisos vigentes, sin usar una cuenta administrativa para leer clínicos.
- Migración: nueva función y permisos, sin borrar ni transformar datos. Rollback: retirar la acción nueva y volver al código anterior conservando registros; no ejecutar borrados de históricos.
- Pruebas primero y comprobación negativa: el contrato SQL inexistente y el helper PDF ausente hicieron fallar la ejecución inicial; se implementó hasta GREEN. Los casos de actor prohibido, permiso retirado y reasignación mantienen denegación verificable. No se hizo una mutación temporal de código en la copia compartida.
- Automatizaciones: inventario de migraciones y catálogo de funciones actualizado por el coordinador; lectura de texto PDF para verificar originales, roles reales de administrador/recepción y límites de proyección.
- Verificación propia: **18 casos aprobados en seis archivos**, tipos web/servidor, migraciones y secretos aprobados. El coordinador verificó además 109 casos de grants, tablas internas, manifiesto y exportación. Sin nueva afirmación de suite global ni prueba de navegador.
- Veredicto: listo para revisión e integración local. Sin commit propio ni modificaciones de producción. No se llamó un proveedor externo ni se publicaron datos de pacientes.
