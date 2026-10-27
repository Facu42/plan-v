# Centro de ayuda v29

[PR #191 en borrador](https://github.com/Facu42/plan-v/pull/191). Código `73cd947dc35d010de10f42b65eef0c58846d171a`. Rama `work/centro-ayuda-v29`, base `81315b3` (#190). Entrega preparada para revisión visual de Facu; **sin merge ni producción**.

La ruta `/crm/ayuda` usa el shell v29 existente, Inter y los temas claro/oscuro. `/crm/desarrollo?modulo=ayuda` sigue funcionando y marca Ayuda en el menú. Se reutilizan las ocho guías reales de `HelpCenter` y las cinco FAQ del boceto. Temas, búsqueda por título/pasos/error, selección y enlaces usan rutas reales; para consultas y privacidad se abre el directorio para elegir paciente.

No hay analíticas reales: se explica la falta de medición, sin cifras ni ranking inventados. «La más consultada» explica que todavía no se puede identificar. El pedido de ayuda exige descripción y confirmar que no incluye datos de pacientes; solo muestra una confirmación local, sin enviar ni persistir el texto. No se encontró un endpoint de soporte conectado.

## Evidencia

- [Capturas 1440/390, claro/oscuro](../screenshots/centro-ayuda/), pantalla y diálogo.
- [Medidas contra sxAyuda](../screenshots/centro-ayuda/medidas.md): siete piezas en ambos temas, sin diferencias de estilos resueltos.
- Suite completa con Node 22 y `npm test -- --maxWorkers=2`: **3.399 aprobadas y dos omitidas existentes, 540 archivos** (190 s). Verificación focal final: **12 aprobadas** en tres archivos. E2e final: **3 aprobados** (16,8 s).
- `npm run check`, build, secretos y whitespace aprobados. La primera tanda sufrió saturación/timeouts de PGlite; se repitió sin cambiar tests ni tiempos y terminó en verde.
- `panel:v29:check`: CSS generado y 62 íconos iguales a la fuente.
- `panel:contrato:v29`: **HOLD**. Se detuvo antes de Ayuda en `abrirAsistenteApp`, esperando `#sxchat .sxfrom` (20 s). Asistente y el script no se modificaron en este slice. El contrato general no cubre Ayuda; la medición enlazada sí compara esta pantalla.
- Sin script de lint en el repositorio; revisión de whitespace con `git diff --check`. Build conserva avisos de tamaño de bundles y comentarios de dependencias.

## Regression Guard · paso 10

- **Flujos críticos:** búsqueda/filtros/selección, FAQ, rutas anteriores y nuevas, pedir ayuda sin red, foco/Escape y móvil cubiertos por pruebas del slice. La suite general comprueba los contratos de acceso, planes, pagos y pacientes; no es una prueba contra producción.
- **Regresiones cubiertas:** se conserva la recuperación de invitaciones, la confirmación real del pago y la distinción entre falta de registros e incumplimiento. Se agregaron controles para selección al cambiar filtro, alias activo, permiso de ruta solo profesional y crecimiento de columnas móvil; se corrigieron los hallazgos de las revisiones.
- **Contratos:** `onOpen`, rutas permitidas por rol, menú, acciones del encabezado y destinos de guías/FAQ. Sin nuevas llamadas de API, almacenamiento ni cambios de esquema.
- **Áreas frágiles:** shell compartido y estilos heredados. Cambios acotados a la entrada de Ayuda; medidas y geometría verificadas. Planes, cobros y autenticación no cambian.
- **Migraciones:** no corresponden; sin acceso a la base de producción.
- **Fire test:** quitar `trim()` de la búsqueda hizo fallar la prueba de espacios; se restauró el código y las pruebas volvieron a verde.
- **Automatizaciones:** e2e conserva las comprobaciones de columnas, ancho, Inter, teclado, no envío y genera las ocho capturas. No requiere variables, migraciones ni pasos manuales de despliegue nuevos.
- **Revisiones finales:** sin hallazgos P1/P2 pendientes. code-reviewer detectó selección anterior y menú del alias; corregidos. reality-checker detectó superposición móvil; corregida y verificada de forma independiente a 390/1440, sin errores JS ni desborde observados.
- **Veredicto: HOLD** hasta ok visual de Facu y resolución/revisión del contrato general detenido en Asistente. El PR permanece en borrador.
