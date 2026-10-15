# Laboratorio, evaluaciones y PDF del consultorio — 12/10/2026

Implementación local en la rama `codex/nutridesk-clinica`. No se aplicaron migraciones ni se modificó producción. Se continúa el código previo, con ECC TDD, security-review, healthcare-phi-compliance y healthcare-cdss-patterns.

## Qué está implementado

- Lectura local de PDF y fotos JPG/PNG mediante PDF.js y OCR español empaquetado en la web. No sale contenido a IA externa. Vista previa por página y revisión obligatoria de cada analito, resultado original, número, comparador, unidad, rango del informe y ubicación. Los originales sólo se suben al confirmar, con consentimiento documental vigente; no se diagnostica ni reemplaza el rango del laboratorio.
- Bioimpedancia segmental: extracción conservadora con componente, segmento y unidad explícitos, carga manual y comparación entre dos fechas únicamente con igual componente y unidad. Rechaza duplicados y unidades incompatibles. Conserva el equipo y cada dato original.
- Kerr: registro de las cinco masas **declaradas por la profesional**, originales y referencia aprobada; señala masas faltantes y diferencia de su suma con el peso. **No calcula Kerr automáticamente ni incorpora coeficientes no verificados.**
- Seguimiento bariátrico: cirugía, peso preoperatorio/actual, referencia opcional elegida por la profesional, cambios aritméticos, síntomas, suplementación y próxima revisión. Sin referencia menor al peso preoperatorio, no calcula pérdida de exceso. No propone tratamiento ni un peso clínico automáticamente.
- Aprobación de referencias por cada profesional, inmutables, con URL, fecha y validación; se guarda una copia junto a cada evaluación y se puede deshabilitar el uso futuro sin cambiar resultados anteriores.
- Pedido de estudios, exportación PDF real con Poppins empaquetada, logo y contacto, gráfica de peso y páginas. La copia exportada conserva resultados revisados y origen importado; el ingreso, las mediciones y categorías se describen en español, sin JSON ni nombres internos. Las notas privadas sólo se incluyen al seleccionarlo.
- Acceso exclusivo de profesional titular, permisos vigentes por propósito, documentos privados y auditoría append-only de lecturas/exportación/altas con IDs opacos. El administrador del servicio carece de acceso clínico global; la paciente no puede leer estos borradores ni aprobar métodos.

## Contratos de integración

- Registrar `registerClinicalWorkspaceRoutes(app)` en la API después de su autenticación y límites de solicitudes. Los documentos usan JSON/base64 de hasta 28.000.000 bytes para admitir 20 MB; mantener el límite general compatible y la restricción por ruta.
- Montar `ClinicalPatientWorkspace` con `patientId` y `mode`: `laboratorio`, `mediciones` o `exportacion`. La integración con la ficha principal pertenece al coordinador. El componente reinicia su estado al cambiar paciente/apartado y conserva formularios ante errores.
- API: `/api/clinical/references` (crear y deshabilitar), `/api/clinical/brand`, y `/api/patients/:id/clinical-workspace` (vista, `records`, `documents`, documento privado y `export`). Cliente y servidor comparten los esquemas estrictos de datos. Reintentar con el mismo ID es idempotente; cambiar contenidos con ese ID devuelve conflicto.
- Preparar OCR y tipografía automáticamente mediante `npm run build`. No hacer llamadas pagas ni configurar proveedores para este módulo.
- La migración `20261012113000_clinical_workspace.sql` requiere los módulos de consentimiento, archivos, importación y auditoría ya existentes. Es aditiva, sin cambios a datos anteriores. Reversión operacional: deshabilitar las entradas web/API y conservar tablas/documentos; no eliminar historias clínicas como rollback.
- **Marca compartida pendiente al combinar entregas:** usar `getNutritionSettings(owner).settings.brand` para el encabezado de plan y ficha, y conservar únicamente matrícula como dato propio clínico. Al guardar marca desde clínica debe actualizarse nutrición con su revisión esperada. Respetar también el borrado de logo/contacto y sus límites comunes. El módulo nutricional no está en esta rama, por lo que esta conexión se realiza al integrarlos.

## Evidencia y límites

RED documentado en commits: extracción auto-revisada; Kerr incompleto marcado completo; unidades/duplicados ambiguos; laboratorio RPC sin ID/valor; mediciones OCR visibles tras retiro documental; PDF comprimido de 41 páginas aceptado; auditoría faltante. GREEN comprobado tras cada corrección en utilidades, API demo y PostgreSQL local con roles reales.

La primera suite completa detectó la lista de funciones autorizadas incompleta; se añadieron sólo las RPC con controles probados. La segunda suite: **369 archivos, 2506 pruebas aprobadas, dos omitidas**. Luego se agregaron auditoría y exportación en español; la suite final aprobó **2508 pruebas, con dos omitidas, en 369 archivos**. Compilación web, tipos, secretos y revisión de migraciones comprobados; no existe comando lint en el proyecto ni se afirma porcentaje de cobertura medido.

Fuentes primarias intentadas con `/browse`: ASMBS «Standardized Outcomes Reporting in Metabolic and Bariatric Surgery» carga pero exige membresía; PubMed y el editor SOARD devolvieron 403. No se afirma verificación del texto científico inaccesible. Se conserva la aprobación explícita de la fuente por la nutricionista y no se habilita cálculo Kerr desde coeficientes.

Faltan la integración del coordinador, revisión independiente, prueba visual 1440/390, subida OCR real desde navegador y comprobación con informes reales desidentificados de cada equipo. El PDF se validó como documento paginado real, pero no se afirma revisión visual de cada página.

## Informe Regression Guard, paso 10

- Flujos críticos verificados: laboratorio revisable ✅; permisos de atención/documentos/mediciones ✅; aislamiento entre dos consultorios/paciente/administrador ✅; idempotencia ✅; fórmulas no inventadas y datos insuficientes ✅; PDF paginado ✅; navegador integrado ⚠️ pendiente.
- Regresiones cubiertas: lectura de medición documental tras retiro; PDF comprimido sobre 40 páginas; duplicados/unidades; datos nulos en RPC; incompletitud Kerr; revisión de extracción obligatoria.
- Contratos revisados: esquema compartido web/API; RPC validada aun con llamada directa; referencias y documentos propios; RLS; exportación exclusiva profesional.
- Áreas frágiles: salud, documentos y fuentes. Sin diagnósticos/IA externa; máximo 20 MB/40 páginas validado en cliente y servidor; originales privados, aprobación profesional y auditoría sin contenido de salud.
- Migraciones: aditivas; roles y acceso comprobados con PGlite. Producción no tocada.
- Fire test: las pruebas nuevas reprodujeron los huecos anteriores (RED) y pasaron tras corregirlos. PDF de 41 páginas real obtuvo 201 antes y 400 después. No se alteró producción.
- Automatizaciones: OCR y fuente PDF local en el build; guard de funciones autorizado actualizado; límites y permisos exigidos por servidor/base, no por memoria.
- Veredicto: **listo para integración local; HOLD para producción** hasta revisión, marca compartida y navegador integrado. Esta rama no habilita funciones clínicas calculadas sin fuente profesional aprobada.
