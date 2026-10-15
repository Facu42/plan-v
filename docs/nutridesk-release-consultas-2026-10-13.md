# Segunda entrega: consultas, audio y resúmenes revisados
## Estado vigente · 15/10/2026

Incorporada por merge la primera entrega revisada `a6ab13ae`, con MAIN `2d31f9d` y sus siete PR nuevos conservados. Suite propia actual: **2.617 aprobadas, cero fallos, dos omitidas; 389 archivos**. Tipos, build (11,09 s), migraciones, vistas locales y secretos aprobados; scanner real con control positivo, historial y objetos grandes sin hallazgos. [Informe y Regression Guard de la actualización](nutridesk-consultas-main-sync-2026-10-15.md). CI de la cabeza nueva se verifica por separado; los resultados remotos de 66fe1e03 son históricos. Sin cambios de producción ni habilitación de proveedores.

## Antecedentes de la separación · 13/10/2026

Rama local `codex/nutridesk-release-consultas`, basada en `codex/nutridesk-release-base` (`4769b3e6f647f28fd0e0d93bcef6aa58e01a3140`, PR de acceso). Recupera las versiones finales de consultas y presupuesto de la copia integrada en `14e3d7f`. Preparada para revisión por apartado; sin merge, habilitación de proveedor ni cambios de producción.

## Comportamiento incluido

- La ficha existente suma notas de consulta y su cabecera muestra consultas realmente realizadas. La profesional titular confirma cada turno pasado de forma explícita y puede corregirlo con otra confirmación; cada cambio usa revisión y queda auditado. Asistencia, horario transcurrido y cierre de audio permanecen independientes.
- Captura de micrófono y audio de una pestaña elegida, sin guardar video. Ambos indicadores permanecen visibles; audio remoto ausente o captura interrumpida marcan la consulta incompleta. En navegadores incompatibles se puede cargar audio o transcripción.
- Grabación y procesamiento con IA tienen permisos nuevos y separados. Los permisos anteriores no los habilitan. El servidor, las funciones de base y el worker comprueban paciente, consultorio, actor, estado de cuenta, relación de atención, permisos y revisión. El administrador del servicio no recibe acceso clínico global.
- La transcripción se conserva íntegra hasta 1 MiB UTF-8. El resumen trabaja con fragmentos de hasta 60 KB y reducción jerárquica; cada parte guarda huella, versión y resultado mediante comprobación del token de ejecución y de la revisión. Un reintento reutiliza resultados confirmados y no repite gasto incierto.
- El resumen automático espera todos los segmentos completos, consecutivos y procesados; nunca presenta como completa una captura con huecos. La profesional corrige el borrador privado y publica una versión compartible separada. Regenerar el borrador no modifica lo publicado.
- La paciente ve sólo los resúmenes publicados, por páginas, junto a su agenda existente. Su exportación de privacidad incorpora esos resúmenes; no incorpora borradores, transcripciones privadas ni notas profesionales.
- WAV mono PCM de 16 bits: máximo de 8 MiB por segmento, duración verificada a partir de muestras entre 0,1 y 90 segundos. Audio temporal privado con eliminación a los siete días y retiro anticipado del permiso de grabación o atención.
- Los trabajos usan reserva exclusiva, renovación y finalización condicionada al token vigente. Retirar el permiso durante una reserva bloquea el envío externo y libera la reserva sin gastar; si ya hubo respuesta o gasto incierto, no se libera como si no hubiera ocurrido.

## Integración y límites

El índice registra sólo consultas. El worker agrega procesamiento y limpieza de audio, conservando trabajos de fotos y recordatorios existentes. La ficha mantiene sus secciones previas y agrega Notas de consulta; todavía no incorpora la ficha ampliada, OCR, importación, nutrición avanzada, clínica avanzada, equipo, agenda pública, asistente global ni comunicaciones masivas.

La demostración local admite únicamente el dominio y las claves conocidas de consultas, con las ampliaciones de confirmaciones y auditoría, sin sobrescribir copias incompatibles. El presupuesto persistente está en Postgres; el ledger en memoria corresponde a la demostración de un proceso.

`package.json` y lockfile permanecen iguales a la primera entrega. CI agrega una comprobación sintética del escáner sin modificar las verificaciones existentes. Dependencias propias instaladas con `npm ci --ignore-scripts`, sin junction. Vercel conserva sus rutas y CSP previos y habilita únicamente micrófono y captura de pantalla necesarios para esta función. No se habilita evaluación JavaScript ni WebAssembly para módulos futuros. Los JSON fuente de Figma y los PDF permanecen intactos; las piezas nuevas usan los componentes y tokens existentes.

El guard de API admite hasta 7.000.000 bytes para el comando de consultas, para conservar el máximo UTF-8 cuando JSON escapa sus caracteres, y 11.201.000 bytes para segmentos WAV codificados en base64. El contrato sigue acotando texto y audio; otras rutas mantienen sus límites.

Groq queda apagado por configuración: `GROQ_ZDR_VERIFIED=0`, `GROQ_FREE_TIER_VERIFIED=0`, modo gratuito predeterminado. Sólo cuenta verificada, retención cero y consentimiento específico permiten llamadas. El modo pago conserva una bolsa atómica global de USD 5 mensuales, con mes de Argentina; no es un cupo por consultorio ni por paciente. La copia no contiene credenciales ni hace llamadas reales a proveedores.

SMTP propio continúa pospuesto por el usuario. Supabase Auth conserva el envío incluido sólo para pruebas con el equipo del proyecto; no se anuncia entrega a pacientes externos. Un remitente central propio queda pendiente para después.

## Correcciones de la revisión independiente

La revisión detectó que dos clics podían anexar dos veces la misma página y que usar la cantidad de sesiones como cursor omitía versiones compartidas cuando éstas eran más numerosas. La pantalla ahora reserva una lectura por instancia y generación de paciente, avanza por páginas de cincuenta y comprueba IDs. Una respuesta repetida o sin avance da error; sólo se reemplaza explícitamente una sesión identificada como copia retenida para la selección. La recarga posterior a una escritura espera una lectura nueva, conservando la publicación ya confirmada.

La consulta seleccionada de una página anterior se conserva al actualizar la primera página; la sesión devuelta por un comando se incorpora antes de recargar. La edición privada y el texto compartible conservan sus propias revisiones base: el polling no las renueva debajo de un borrador local. Guardar sólo notas no envía una transcripción antigua ampliada por el worker. Publicar o reintentar conserva una edición privada sin guardar; únicamente su guardado explícito la reconoce. Durante una operación se conservan los campos como lectura, y durante la captura se indica que las notas pueden editarse al finalizar. Iniciar captura o cargar transcripción comprueba una sola vez el aviso de cambios pendientes.

Las regresiones se reprodujeron con el comportamiento anterior extraído: lecturas dobles, mezcla entre pacientes, pérdida de selección, revisión renovada mientras la edición estaba sucia, envío accidental de transcripción y descarte por publicación. Doce pruebas del coordinador/editor y dos de la pantalla aprobaron después de montar los helpers en los handlers reales. No hay un DOM de pruebas instalado: la revisión de montaje y los ensayos de navegador del integrador complementan esas pruebas. Los tres archivos de pantalla/coordinador/pruebas son idénticos en esta copia y en la integración.

## Migraciones y permisos

En esta entrega se suman únicamente:

1. `20261011140000_clinical_ai_budget.sql`: bolsa mensual y ledger privados.
2. `20261011150000_consultation_sessions.sql`: permisos específicos, sesiones, versiones compartidas, audio privado, trabajos, resultados reutilizables, retiro de consentimiento y resumen jerárquico persistido.
3. `20261013100000_consultation_completions.sql`: confirmación explícita de consulta realizada con revisión y eventos de auditoría.

Funciones nuevas permitidas a sesión autenticada: `consultation_can_read`, `consultation_command`, `consultation_completion_command`, `consultation_completion_list`, `consultation_enqueue_chunk`, `consultation_list_tasks`. Todas comprueban identidad y alcance; funciones internas de reserva, procesamiento y resultados quedan sólo para servicio. Tablas internas añadidas al catálogo: `clinical_ai_budget_months`, `clinical_ai_spend`, `consultation_tasks`. Las restantes tablas de consultas tienen lectura protegida por políticas. Se verificaron también privilegios por columna y vistas públicas.

Aplicación sólo en bases temporales locales de prueba. No se ejecutaron migraciones remotas. Rollback operativo: detener procesamiento nuevo y volver al código previo conservando tablas, notas y ledger; no borrar notas ni reservas al revertir la función. Cada cabeza de la pila es para revisión, sin desplegarla como producto parcial.

## Regression Guard: paso 10

- Flujos críticos verificados: acceso y cartera heredados; notas privadas y publicación separada; permisos y retiro durante procesamiento; token, revisión y reintentos; presupuesto concurrente e incierto; captura incompleta; consulta realizada explícita; exportación de resúmenes compartidos. Cubiertos con pruebas locales de contratos, API real y Postgres temporal. Captura nativa de ambos interlocutores y entrega externa de proveedor continúan como verificación operativa pendiente; no se declara fidelidad visual sin evidencia.
- Regresiones cubiertas: truncación de textos grandes, repetición de costos, respuesta tardía sobre otra revisión, trabajos sin permiso vigente, audio incompleto, falsos éxitos de recarga, consulta inferida por horario/asistencia/audio y pérdida de recordatorios al separar módulos.
- Contratos revisados: tipos compartidos, esquemas, API, permisos de base, worker y privacidad. La prueba de ingreso busca el permiso de atención por propósito, preservando el catálogo ampliado.
- Áreas frágiles: fuentes de audio y cierre de navegador, permisos durante llamadas externas, reinicio del worker, cupo global y recarga tras guardar. Se preservan borradores, indicadores de incompletitud, comprobaciones tras reserva, costos inciertos y resultados persistidos.
- Migraciones: aditivas, roles y grants verificados; rollback conserva datos. Ninguna activación automática del proveedor ni cambios de producción.
- Pruebas primero: se preservaron pruebas finales de los hitos `f624f43`, `a61ed06`, `60534f1`, `856f700` y la revisión integrada `14e3d7f`. En esta separación hubo RED→GREEN de compatibilidad demo, guard de transcripción a través de la API real y continuidad de recordatorios.
- Fire test: se excluyó temporalmente gasto incierto del uso del ledger en esta copia. La prueba del presupuesto falló; se restauraron los bytes originales y aprobaron dieciséis pruebas de presupuesto, demo y guard de API. No se modificó producción.
- Automatizaciones: catálogos de tablas/funciones autorizadas, pruebas de guard con encabezado falso, lease y revisión, límites y huellas de resúmenes, revisión de migraciones y secretos. La configuración exige verificar retención cero y nivel gratuito antes de llamadas.
- Verificación final: **2.575 pruebas aprobadas, cero fallos, dos omitidas, 384 archivos** en la última suite completa; tipos web/servidor, compilación web, revisión de migraciones, secretos y diferencias aprobados. Compilación final en 14,87 segundos con avisos conocidos de chunks grandes y fuentes importadas estática y dinámicamente; sin script de lint. Informe JSON local: `%TEMP%/planv-release-consultas-tests.json`; logs de compilación y fire test en el mismo directorio temporal. Verificación focal de SQL y grants: sesenta y ocho casos; guard/API real: veintiún casos aprobados tanto aquí como en la copia integrada.
- Revisión independiente adicional: operaciones y clínica detectaron y corrigieron doble lectura de página, cursor calculado desde sesiones cuando había más versiones compartidas, pérdida de la consulta seleccionada al actualizar, revisión base de edición avanzada por polling y pérdida de borradores al publicar/reintentar. Doce casos nuevos de paginación/editor; catorce casos focales de interfaz aprobados también por el coordinador. API y permisos verificaron conservación de transcripción cuando se editaron sólo notas. Durante captura las notas se editan al finalizar; el campo informa ese estado. Una sola confirmación de descarte al cargar transcripción.
- Recorrido de navegador del coordinador con datos ficticios en la copia integrada: publicar con borrador privado sin guardar conserva su texto; guardarlo después confirma el cambio y preserva el resumen publicado. La proyección de paciente devuelve cero sesiones privadas. No valida micrófono ni audio remoto nativos.
- Veredicto: código y comprobaciones locales preparados para PR borrador, con revisión independiente completada. Habilitación real y producción pendientes de evidencia operativa y autorización correspondiente.

## Control de secretos en GitHub

El primer CI detectó un falso positivo en `.env.example`: la clave de Groq vacía hizo capturar la opción siguiente, cuyo valor exacto es `GROQ_ZDR_VERIFIED=0`. La reproducción usó únicamente una fixture sin credenciales. El ejemplo ahora usa comillas vacías. Para el historial publicado se permite sólo ese valor exacto Y ese archivo, únicamente en la regla genérica; no se reescribió Git ni se excluyó el archivo completo.

Nueva comprobación automática ejecuta el binario real de Gitleaks 8.30.1: el ejemplo histórico más una clave ficticia deben producir exactamente un hallazgo, la clave ficticia. Con el ejemplo entre comillas deben producir cero. Falló antes del ajuste y pasó después. Historial completo, fuentes nuevas y objetos grandes fragmentados aprobaron localmente con resultados redactados. Revisión independiente de seguridad sin P1/P2. Código de app sin cambios respecto de las 2.575 pruebas; nuevo CI sobre la cabeza corregida pendiente al crear este commit.
