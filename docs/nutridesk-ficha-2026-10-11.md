# Ficha, colores y fotos de ingredientes — 11/10/2026

Rama `codex/nutridesk-ficha`, base `ae3dc30`. Implementación local para integrar con las entregas de consultas e importación. Sin publicar, sin cambios en servicios externos y sin tocar la base hospedada.

## Cambios

- Las diez secciones pedidas se enlazan con funciones reales: Historia clínica (ingreso y antecedentes importados), Evolución (comidas, progreso, medidas y objetivos), Notas de consulta, Plan actual (editor de versiones), Plan semanal (tabla/editor profesional), Lista de compras (lectura profesional), Registro alimentario (revisión de comidas), Chat, Archivos y Laboratorio.
- Se conservan Resumen, Planificación, Consultas y Cobros. Los enlaces anteriores de ingreso, registros y mensajes siguen funcionando. Registros conserva el acceso combinado a comidas y evolución para evitar romper enlaces a revisiones pendientes.
- Cabecera: estado, teléfono opcional, próxima consulta, turnos transcurridos y asistencias confirmadas. Un horario vencido **no** acredita asistencia ni consulta clínica finalizada. No se inventa el contador de consultas realizadas.
- Teléfono opcional en el editor: máximo cuarenta caracteres, vacío enviado como `null`; con protección ante salida con cambios sin guardar. Contrato del cliente y persistencia los integra el coordinador.
- Archivos y Laboratorio reutilizan los registros privados y las aperturas temporales existentes. Laboratorio sólo incluye documentos identificados como `laboratorio`. Se conserva revisión profesional y bloqueo de apertura sin permiso. No se mezcla con cobros/medidas ni se ofrecen cargas profesionales que el servidor actual no admite.
- Las fotos de ingredientes se conectan en el detalle real de Nutrigo, el detalle profesional y el detalle compartido. Número y cantidades permanecen visibles. La foto usa la pieza Image de 64 px del Dashboard original, junto al Number original de receta. Sin URL aprobada no se crea imagen; si falla queda el recuadro gris. La leyenda accesible señala el origen ilustrativo de IA.
- La capa anterior del consultorio deja de fijar una paleta distinta. Usa variables vigentes de Nutrigo y su gris oscuro `#52545B` en instrucciones, ficha, directorio y mediciones. El texto del control de estado de objetivos toma el color compartido.

## Fuente visual y defaults

El coordinador leyó con MCP el detalle `84:3145` y la navegación `12:793` del archivo Nutrigo `OTolnKfsxUFjaZOhhdb04i`; confirmó los tokens compartidos. Se reutilizan sus piezas locales. **Ningún JSON original del diseño fue modificado.**

La ficha profesional no tiene frame propio: el default son las tarjetas y controles existentes con tokens Nutrigo. Para ingredientes, agregar el recuadro de imagen junto al número es un default autorizado para la nueva función. Los colores compartidos coinciden con las variables leídas; todavía no hay comparación de navegador a 1440/390 que permita afirmar fidelidad visual final.

## Evidencia ECC

- RED `43930c8`: faltaban módulos de secciones e imagen. GREEN posterior: seis pruebas aprobadas.
- RED `85d7513`: dos pruebas detectaron la paleta alternativa y el gris demasiado claro de la interfaz operativa. GREEN: ambas aprobadas.
- RED `a922b04`: el editor no contenía teléfono. GREEN: catorce pruebas de directorio/editor aprobadas.
- Once pruebas focalizadas nuevas aprobadas para secciones/URLs, identificación de turnos, filtrado de documentos, acceso deshabilitado sin permiso, fotos y tema.
- Regresiones existentes verificadas: 34 pruebas de variabilidad del menú con la foto en escritorio/móvil, siete de receta/plato, una del detalle profesional, tres de corrección de medidas y dieciocho de fidelidad/paridad/accesibilidad. Se ejecutaron con un solo trabajador.
- Prueba adicional detectó un enlace `__proto__` que podía dejar la ficha vacía: corregido con comprobación de clave propia.
- `git diff --check` aprobado; `npm run check:secrets` aprobado.

## Regression Guard — paso 10

- **Flujos críticos verificados:** ✅ conservación de enlaces y datos de receta; ✅ foto real y respaldo; ✅ revisión/lectura privada de archivos con permiso; ✅ aislamiento visual entre documentos y cobros; ✅ directorio/editor; ✅ corrección de medidas y estilos existentes. ⚠️ recorrido interactivo completo, envío real, cobro y aislamiento entre consultorios no se verifican mediante estas pruebas de interfaz.
- **Regresiones cubiertas:** enlaces antiguos a comidas/evolución; número visible al incorporar imagen; ingredientes sin foto segura; mezcla de documentos/cobros; grises de instrucciones y paleta alternativa; campos telefónicos vacíos.
- **Contratos revisados:** mismos endpoints privados de seguimiento, compras sólo lectura, editor semanal profesional, campo telefónico nullable y opcional. Nuevos componentes de consultas e historia importada provistos por sus agentes; no se crearon sustitutos.
- **Áreas frágiles:** permisos y enlace al paciente; se preservan `useCare` y desmontaje por paciente/sección, las aperturas temporales y validación del servidor. Teléfono necesita integrar el contrato del cliente y persistencia. El contador transcurrido no es contador clínico de consultas finalizadas.
- **Migraciones:** esta entrega de interfaz no tiene migraciones. Persistencia telefónica pertenece a la integración del coordinador.
- **Fire test:** invertir temporalmente el filtro de laboratorio hizo fallar su prueba. Código restaurado y once pruebas focalizadas aprobadas de nuevo.
- **Automatizaciones nuevas:** pruebas permanentes de secciones, filtros, URLs desconocidas, fotos seguras, colores e ingreso telefónico. Lista de integración explícita abajo.
- **Veredicto: HOLD para publicación.** La rama aislada espera componentes y contrato de los otros agentes. El chequeo de tipos reporta únicamente `ConsultationNotes` ausente, `PatientImportedHistory` ausente y `phone` ausente del cliente. Antes de publicar faltan integración, suite completa, tipos, compilación, revisión independiente y evidencia de navegador 1440/390.

## Integración obligatoria

1. Incorporar `ConsultationNotes({patientId, appointmentId?})` y `PatientImportedHistory({patientId})` de las otras entregas.
2. Incorporar `phone?: string | null` en lectura/persistencia y en `updatePatientProfile`, máximo cuarenta caracteres. No guardar teléfono en preferencias locales.
3. Resolver conjuntamente `CarePanel`: esta entrega agrega modos/filtros; consultas agrega finalidades de permiso en otra parte del archivo. Importación agrega botón en directorio; esta entrega sólo cambia el editor telefónico.
4. Ejecutar pruebas, tipos y compilación en la integración; revisar la ficha y recetas en escritorio 1440 y celular 390. No publicar con comprobaciones pendientes.

Quedan fuera de esta entrega: extracción de resultados de laboratorio, pedido de estudios, PDF de ficha, anamnesis ampliada, captura/transcripción/resumen, persistencia de importación y validación de proveedor. Se integran por sus contratos reales; no se declara aquí que están completos.
