# Recetas y Equivalencias dentro de Planes · v29

Pedido de Facundo: corregir los puntos 1 y 2 de la revisión de main y especificar las diferencias de estilos del punto 4. Base `ebf7ac84`, rama `work/recetas-equivalencias-v29`.

## Resultado

Recetas conserva las pestañas de Planes. Copia de `pRecetas` y su buscador r29 de `panel-trabajo.html`: dos columnas, filtros, tarjetas, detalle de ingredientes y pasos. Utiliza el catálogo real, edición en cajón y publicación explícita. Compartir selecciona una paciente y asigna la versión publicada mediante la API existente. Agregar al plan abre paciente, fecha, comida y porciones; conserva el resto del borrador y sus metadatos, comprueba revisión y exige confirmación para reemplazar una comida. Nunca publica el plan automáticamente.

Equivalencias copia `pEquiv` y su advertencia r29: grupos, alimento/cantidad, energía y tabla de alternativas, últimos cambios y panel de grupos. Calcula con la energía y medidas declaradas de los alimentos de los grupos revisados del consultorio; conserva unidades nativas g/ml sin inventar densidades. El alta y edición de grupos usa el editor y la API existentes en cajón v29. Los accesos del menú lateral abren las nuevas pestañas y el retorno al listado sincroniza la navegación.

## Límites explícitos

El switch global «Mostrar equivalencias en la app» no tiene API de preferencias equivalente. Permanece deshabilitado con explicación; las propuestas reales se revisan y publican por paciente. El historial muestra propuestas publicadas de la paciente elegida, no intercambios ficticios atribuidos a pacientes. No se cambió la base para fingir esa configuración.

El editor de receta conserva campos adicionales de cantidades, referencia y composición que exige el contrato real; su cajón usa v29 pero no copia un formulario ficticio insuficiente. No se inventan fotos, nutrientes, contadores de uso, grupos o cambios. No se afirma identidad de todo el árbol HTML ni aprobación visual integral.

El punto 4 se detalla por pantalla y selector en [diferencias-estilos-v29.md](diferencias-estilos-v29.md). No se corrigen en esta entrega los demás apartados.

## Regression Guard · paso 10

- Flujos críticos: navegación listado/recetas/equivalencias, edición con descarte confirmado, publicar receta explícitamente, compartir versión publicada, errores de escritura y agregar al borrador conservando otras comidas y el plan publicado.
- Regresiones: la vuelta del menú lateral restablece el listado; el cajón comprueba descarte/busy antes de animar, por lo que cancelar no lo vuelve invisible; cantidades inválidas no producen NaN ni filas de cero gramos.
- Contratos: se reutilizan recipesApi, plansApi, nutritionCapabilityApi y careApi, con revisión/versiones y snapshots del servidor. Sin endpoints ni tablas nuevos.
- Áreas frágiles: guardar un plan no debe reemplazar silenciosamente una comida ni cambiar su publicación; las recetas con borrador se comparten desde la versión publicada. Pruebas específicas para ambos casos.
- Migraciones: N/A. Sin SQL ni cambios de configuración.
- Fire test: duplicar intencionalmente la energía cambiando el divisor 100 por 50 provocó tres fallos en las pruebas de Equivalencias; se restauró la operación correcta.
- Automatización: tests unitarios y tres recorridos e2e añadidos al conjunto habitual de CI.
- Revisión independiente: code-reviewer y reality-checker revisaron los componentes y la integración; se corrigió el P2 de retorno al listado.

## Validación final

- 25 pruebas específicas aprobadas en siete archivos: Recetas, Equivalencias, agregar al borrador, Planes, navegación, catálogo existente y descarte de cambios.
- Tres recorridos de escritorio aprobados: Equivalencias con grupo y alimentos guardados en la API real de demo; agregar al borrador preservando otras comidas y publicación; crear/guardar/publicar/compartir receta con error de escritura y cancelación de descarte cubiertos.
- Un recorrido móvil 390 aprobado: ambas pestañas accesibles sin desborde horizontal de la raíz. Capturas locales de escritorio y móvil inspeccionadas, solo con datos de demo; no se agregan al repositorio.
- `npm run check` aprobado. Compilación aprobada en la primera ejecución; repetición final registrada antes de cerrar. `git diff --check` sin errores.
- La suite general no terminó dentro del límite de 180 segundos y no produjo un resultado completo; no se declara aprobada. El intento inicial de e2e falló antes de interactuar por falta de Chromium; instalado Chromium y corregidos los recorridos/etiquetas, los cuatro recorridos finales pasaron.
- Veredicto: implementación del alcance comprobada localmente; **HOLD para merge** hasta que la suite general termine en verde. Sin cambios de producción ni base.


## Estado de entrega

Facundo autorizó expresamente el 29/10 publicar código e informes en su repositorio público y después corregir el punto 4. La subida se completó y se abrió el [PR #233](https://github.com/Facu42/plan-v/pull/233) en borrador. El bloqueo automático anterior quedó resuelto con esa autorización. Main `247a00d` se incorporó sin conflictos a la rama local antes de corregir los estilos. No se integró a main ni se tocó producción.

## Ampliación: punto 4 de estilos

Diferencias confirmadas corregidas y muestras que comparaban distintos elementos rectificadas en [el informe por pantalla](diferencias-estilos-v29.md). La revisión independiente de código no encontró P1/P2 en el diff CSS. La revisión de evidencia detectó la escala del boceto en la medición de altura; el nuevo recorrido la normaliza antes de medir.

Regression Guard adicional: navegación, lectura y formularios mantienen sus contratos; sin endpoints ni migraciones nuevos. Áreas frágiles: cascada compartida, colores de enviar/grabar y desplazamiento de listas. Las reglas se limitan al panel profesional; se conservan variantes y el scroll de Agenda. La comparación de estilos por identidad del elemento queda automatizada para ambos temas. Validación de la ampliación:

- 25 pruebas específicas aprobadas nuevamente, en siete archivos.
- Nueve recorridos de uso aprobados: los cuatro de Recetas/Equivalencias, los tres de Ayuda y dos comparaciones de estilos. Después de normalizar la escala y corregir `vertical-align:baseline`, los dos recorridos de estilos se repitieron: **27,00 px en ambos botones**, fuente y app, en claro y oscuro. Cada recorrido mide 14 elementos/estados.
- Fire test CSS: se inyectaron 2 px de relleno en Historia únicamente en la página de prueba. El recorrido falló exactamente por `padding-top:2px` contra `0px`; la prueba temporal fue retirada. No cambió archivos de la app ni otras páginas.
- Se corrigió el cargador del contrato general para registrar Inter local 300–600: `document.fonts.check()` podía aprobar sin ninguna cara registrada y producir mediciones con otra fuente. La comprobación específica también carga esas fuentes y quita la escala antes de medir.
- Suite general: con el proceso en UTC hubo tres fallos en pruebas de horario de archivos intactos contra main. Se repite con `TZ=America/Argentina/Buenos_Aires` antes de iniciar Vitest. No se modifican lógica ni pruebas para ocultar esos fallos.
- Suite general con `forks`: **3.646 aprobadas y cuatro omitidas, 582 archivos**, salida 0, 612,74 s. Es la corrida iniciada en esta sesión con `npm test -- --pool=forks --maxWorkers=2 --no-file-parallelism`; sustituye el límite anterior de 180 s. Los fallos de horario descritos corresponden al experimento separado con threads/UTC.
- Tipos y compilación finales aprobados (build 15,96 s); sintaxis del comparador, frontera de secretos y `git diff --check` aprobados. No hay script de lint independiente en el proyecto.
- Contrato general corregido: **solo dos comprobaciones sin muestra**, el mismo turno `.ev.c` de Agenda en claro y oscuro. Los turnos confirmados de la fixture ya pasaron y se dibujan como hechos; la fixture carece de otro turno de consultorio futuro que no sea el próximo. Todas las medidas y colores muestreados restantes coinciden. No se declara el contrato completo en verde mientras falte esa muestra.
- Capturas de Recetas y Equivalencias generadas con demo, sin datos de producción. La evidencia es auxiliar; el código y los estilos calculados son la referencia.
- Veredicto: alcance implementado y pruebas de uso aprobadas; **HOLD para merge** por contrato general sin muestra completa de Agenda y revisión final. PR en borrador. No se publicó a main ni se aplicaron cambios de producción.
