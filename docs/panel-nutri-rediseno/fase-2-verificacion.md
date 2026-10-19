# Fase 2 · Inicio del consultorio

19/10/2026 · Codex · `codex/panel-nutri-fase-2` · base main `1f48adf` (#150).

## Resultado

Inicio toma la composición del boceto aprobado: resumen calculado del día y contadores, próxima consulta preparada, cuatro accesos rápidos, pendientes por tipo, consultas de hoy, pacientes que necesitan atención, buenas noticias y cuatro números del mes. Tema claro/oscuro y menú de fase 1 conservados. El celular permite desplegar la preparación; las listas tienen desplazamiento interno en escritorio.

El resumen declara que está calculado con datos; no inventa una respuesta de IA. La próxima consulta consulta ingreso y seguimiento por sus API existentes, con alergias, restricciones, último peso, adherencia y foco pendiente. Preparar lleva a las notas; Ver ficha, al resumen. Nueva paciente abre el alta, Armar un plan permite elegir paciente, Registrar cobro abre Cobranzas y el enlace público se copia únicamente si la página está habilitada.

La bandeja conserva sus acciones. La revisión de comidas ahora lleva a Registro alimentario, corrigiendo el enlace anterior a Evolución. Las citas ordinarias se presentan en la agenda; los pedidos de reprogramación continúan como pendientes. Los turnos pasados se reconstruyen del historial real (`at` es el fin del turno cuando `when` está vacío). Los números del mes distinguen cobrado confirmado, saldo de cargos del mes y horarios de consulta transcurridos; estos últimos no prueban asistencia clínica.

## Contratos y permisos

`include_home=1` amplía la ruta existente `/api/crm/work-queue`. Devuelve, además de la página, avisos completos de inactividad, cantidad de pedidos de reprogramación y rachas por fechas de comidas. El resumen se calcula antes del filtro y la paginación, con los ids activos obtenidos por el mismo alcance profesional y RLS. Sin notas, mensajes, fotos ni contenidos clínicos nuevos en la respuesta. Las rachas usan las fechas completas del servidor, no los últimos registros de una ficha cargada en el navegador. Las rachas largas muestran «Al menos» al alcanzar el límite de la ventana consultada.

Los consumidores que no piden `include_home` conservan su contrato. No hay tablas, migraciones, permisos nuevos, dependencias, claves o ajustes de producción. Las reservas agotan páginas de 50, considerando que `has_more` también puede corresponder a transferencias. El reloj se actualiza cada minuto y al volver a la ventana; el resumen vuelve a consultarse al cambiar el día.

## Evidencia

[Comparación navegable](../../design/panel-nutri/fase-2-verificacion.html) · [Resultados de /browse](../../design/panel-nutri/fase-2/resultados.json).

- Suite completa final: `npm test -- --maxWorkers=4`, **3.153 aprobadas y dos omitidas, 486 archivos**, finalizada a las 01:30:27 ART (122,99 s). Los conteos de pasos anteriores son históricos.
- `npm run check`, compilación y secretos aprobados. La compilación conserva los avisos previos de paquetes grandes y anotaciones de dependencias.
- /browse: 13 comprobaciones y ocho combinaciones (claro/oscuro × 1440×900, 390×844, 1280×800 y 1680×900). Cuatro capturas principales. Sin desborde lateral; página exterior contenida en escritorio e importes sin recorte.
- Recorridos: filtros y atención estable, comidas hacia Alimentario, alta real, elección de paciente para plan, Cobranzas, página pública, preparación, Ctrl K/búsqueda y chat sin envío. Preparación desplegable comprobada en celular.
- Code-reviewer: revisión final sin P1/P2, 39 pruebas focales ejecutadas independientemente. Reality-checker: composición y datos aprobados, con los límites de abajo.
- RED/GREEN: pruebas reprodujeron pérdida del historial real, exclusión de reprogramaciones, contrato de resumen y dos turnos en un mismo día. Fire test separado: inclusión intencional de citas ordinarias en los pendientes fue detectada; código restaurado y diez pruebas del modelo aprobadas.

## Límites comprobados

Navegador con datos ficticios locales, sin cuenta real ni teléfono físico. La demostración no tiene el secreto de reservas públicas: intentar habilitar la página devuelve 501; no se debilita esa protección. La copia está probada con adaptador de portapapeles (habilitada/deshabilitada/fallo), pero no se afirma prueba del portapapeles del sistema con página publicada. El recorrido opcional `PANEL_QA_PUBLIC=1` requiere un entorno local de reservas configurado y restaura sus ajustes.

Las dos consultas del contador de consultas clínicas realizadas responden 403 en Notas de la demo porque falta su permiso de relación de atención; el recorrido comprueba ese límite y lo registra como denegación esperada, sin simular consultas completadas. Inicio y sus nuevas lecturas no producen esos errores. No se afirman grabación real, IA externa ni envíos a pacientes desde esta entrega.

## Regression Guard · paso 10

- **Flujos críticos verificados:** ✅ acceso y separación profesional/paciente, pacientes, invitación y archivo, plan/versiones, cobros y mensajes cubiertos por la suite completa; ✅ nueva metadata probada con dos consultorios en Postgres descartable y rechazo del rol paciente; ✅ navegación de Inicio, filtros, búsqueda, preparación y alta comprobadas en /browse. Portapapeles real con página publicada: límite explícito arriba; adaptador automatizado aprobado.
- **Regresiones cubiertas:** atención no cambia con el filtro/página; rachas no dependen de la ficha seleccionada; reprogramaciones no desaparecen; historial real sin hora textual; dos turnos el mismo día cuentan dos; reloj vivo; paginación de transferencias/reservas; revisión de comidas abre su sección; celular sin desborde ni importes recortados.
- **Contratos revisados:** cliente/API de work-queue y `include_home`, directorio e historial de turnos, ingreso profesional, seguimiento, cobros y agenda. Rutas y permisos conservados; ampliación de metadata aislada por consultorio.
- **Áreas frágiles:** datos resumidos del directorio (se consultan fechas completas autorizadas), horarios y cambios de día (zona Argentina y reloj), saldos/pagos (solo confirmados y reparto existente), cascada móvil (medidas reales y preparación desplegable), reserva pública (habilitación segura preservada).
- **Migraciones:** N/A. Sin SQL remoto, cambios de configuración de producción ni servicios pagos.
- **Fire test:** detectado ✅; se alteró solo el cálculo local de pendientes, prueba roja y restauración verificada.
- **Automatizaciones nuevas:** pruebas de contrato/resumen, historial, conteos, paginación y copia dentro de `npm test`; recorrido reproducible `scripts/panel-nutri-inicio-qa.mjs`. Ningún paso nuevo de despliegue depende de memoria humana.
- **Veredicto:** SHIP para la fase 2 en su propio PR. Suite completa, tipos, compilación y secretos aprobados; revisiones independientes sin bloqueos. Los límites de entorno indicados no se presentan como pruebas en producción ni como cierre de fases 3–9.

## Continuidad

Sigue fase 3, Pacientes con resumen desplegable en la misma lista. Abrir `ShowroomPatients.tsx`, `CrmPatientsView.tsx`, `server/db/supabase-repo.ts` y el bloque Pacientes del boceto. Mantener los filtros, alta, invitaciones, archivo, permisos y enlaces a todas las secciones. Añadir un resumen liviano autorizado por paciente en vez de traer toda la ficha al expandir.
