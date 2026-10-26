# Planes v29 · Parte 3c

Autorización de Facundo del 26/10/2026. Rama `work/planes-parte-3c-plantilla-copiar`, desde main con partes 1, 2, 3 y 3b integradas. Referencia: `design/panel-nutri/v29/panel-trabajo.html`, `#s-planes`, acciones `guardar-tpl`, gestión `tpl` y `copiar`, listado y selector de plantillas.

## Qué cambia

- Guardar como plantilla funciona desde la barra y Gestión del plan. Pide Nombre y Para, guarda primero los cambios del editor cuando hace falta y crea una plantilla privada en borrador. El servidor verifica la pertenencia de la paciente de origen y la revisión guardada.
- Plantillas muestra el catálogo real con búsqueda, nombre, descripción, estado y ejemplo de comidas. No inventa calorías ni contadores de uso que el almacenamiento no registra. El botón de alta lleva al editor para crear desde un plan.
- Elegir plantilla al empezar y Aplicar a una paciente en el catálogo permiten crear un borrador. Se vuelve a leer la plantilla para detectar edición o retiro mientras estaba abierta. Se conserva el publicado del destino.
- Copiar a otra paciente funciona desde ambos accesos. Usa las comidas actuales del editor y sus fechas; pide una paciente del mismo consultorio, lee su plan al confirmar y usa su identificador y revisión. Una edición concurrente responde con error y mantiene abierto el formulario.
- Solo se trasladan comidas e ítems: no se incluyen identidad, objetivos, antecedentes, metas ni indicaciones generales de la paciente de origen. Las notas de preparación y textos de comidas son contenido reutilizable; se pide revisarlos por si la profesional escribió datos personales allí. No hay un detector semántico de datos personales.
- No se publica ni se dispara ningún aviso. El servidor mantiene las indicaciones propias del destino y resuelve su propia meta confirmada; no son datos copiados del origen.

## APIs, almacenamiento y límites

Se reutilizan `GET/POST /api/models`, `GET/POST /api/patients/:id/plans`. La ruta existente de aplicar modelos también pasa a rechazar explícitamente permisos nulos antes del repositorio. Se conservan los controles RPC y RLS existentes.

No hay migraciones, variables nuevas ni pasos manuales de activación. No se accedió a producción. Si en un entorno falta el almacenamiento de modelos, el error existente 501 se muestra y el formulario conserva los campos.

La plantilla usa el formato ya existente: días relativos, comidas, ingredientes, cantidades y notas de preparación. No guarda horarios ni etiquetas personalizadas. Al aplicarla comienza hoy; copiar directamente conserva las fechas de origen. Rigen los límites existentes: 42 ítems y diferencia máxima de 21 días entre inicio y fin. No se amplía el schema ni se truncan comidas.

Quedan fuera IA/deshacer, armar IA, mail/programar, logo, PWA, legal y créditos Cursor. No se modifican esas funciones.

## Pruebas y revisión

- Prueba primero: helper de copia rojo por función ausente; tres casos de pertenencia rojos (200 donde correspondía 403), luego verdes.
- Fire test: se anuló temporalmente el rechazo de permisos de modelos. Los tres casos fallaron; se restauró la validación y las cinco pruebas nuevas dirigidas pasaron.
- E2e: nueve recorridos de Planes aprobados; después de cerrar estilos se ejecutaron los cuatro de Parte 3c y pasaron. Cubren cantidad editada, guardado/recarga/listado/aplicación, conservación del publicado, error 503 y conflicto 409 simulados en el navegador (los conflictos reales también están cubiertos en repositorio), formulario sin nombre, selector desde paciente sin plan y un único diálogo, Escape, Inter y formularios en 1440/390 claro/oscuro.
- Revisión independiente de `code-reviewer` y `reality-checker`: sin bloqueantes de código ni visuales tras corregir el diálogo anidado y estilos. Diez capturas ficticias en [screenshots/planes-p3c](../screenshots/planes-p3c/).
- Compilación final aprobada con Node 22.23.4. Tipos aprobados; migraciones, manifiesto, vistas públicas, secretos, CSS generado v29 y auditoría de dependencias aprobados (cero vulnerabilidades). El repositorio no tiene comando lint; se ejecutó `git diff --check`.
- La primera suite corrió con Node 20 y tuvo errores de WebSocket por runtime y una expectativa vieja de «Próximamente» que se actualizó al catálogo real. Con Node 22 pasaron 532 archivos, pero dos workers no iniciaron por timeout. Repetición completa con un worker: **534 archivos aprobados, 3.362 pruebas aprobadas y dos omitidas; cero errores**. Comando: `npm exec --yes --package=node@22 -- sh -c 'npm test -- --maxWorkers=1'`.
- `panel:contrato:v29` general no terminó: esperó `#sxchat .sxfrom` en el asistente de cartera durante 20 segundos. Ese módulo y el script no cambian en este PR. No se afirma que ese contrato general esté verde. Las comprobaciones visuales y recorridos propios de Planes sí están aprobados.

## Regression guard · paso 10

- **Flujos críticos verificados:** ✅ guardar el contenido actual con nombre; ✅ listar/buscar/elegir plantilla; ✅ aplicar desde catálogo e inicio vacío; ✅ copiar cantidades al borrador de otra paciente; ✅ conservar publicado; ✅ rechazar consultorio ajeno antes de escribir y en PostgreSQL/RLS; ✅ mostrar errores y conservar formulario. Evidencia: suites de modelos y planes, nuevos tests de rutas/helper y e2e anteriores.
- **Regresiones cubiertas:** revisión de origen desactualizada, edición concurrente del destino, receta/snapshot fuera de alcance y conservación de copia publicada ya tienen pruebas en `models/flow`, `models/database` y `plans/postgres.integration`. Se añadieron rechazos explícitos en servidor para permisos nulos y las dos direcciones de escritura cruzada entre consultorios. Historial revisado: partes 2, 3 y 3b (#184–#186).
- **Contratos revisados:** `modelsApi` ↔ `modelSaveSchema` ↔ ruta/repo/RPC de modelos; `plansApi` ↔ `mealPlanDraftSchema` ↔ autorización y guardado. Lista blanca con `paraGuardar`; la revisión usada pertenece al destino. No se llama a publicar ni a notificar.
- **Áreas frágiles:** pertenencia/RLS (dos consultorios), revisión (errores y bloqueo optimista), contenido reutilizable (separado de ficha y metas), diálogo/formulario (ocupado y errores sin cerrar), y publicado (se conserva). Revisadas con pruebas adicionales.
- **Migraciones:** N/A. APIs y esquema existentes; sin producción. Reversión del cambio por revert del commit, sin pasos de base.
- **Fire test:** ✅ detectado; tres rechazos de permisos pasan a rojo al anular la protección; restaurado y verde.
- **Automatizaciones nuevas:** las pruebas quedan incluidas en `npm test` y `test:e2e` de CI, sin variables ni operaciones de memoria para desplegar. El flujo siempre crea borrador y lee la revisión al confirmar. No hay activación manual nueva.
- **Veredicto: HOLD para integrar.** Parte 3c tiene suite completa, tipos, compilación, permisos y e2e aprobados; el PR se abre en borrador porque el contrato visual general no pudo completarse en el asistente de cartera, fuera del alcance autorizado. No merge ni producción.
