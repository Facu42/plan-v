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

La subida a GitHub fue rechazada por revisión automática por requerir autorización explícita del usuario para publicar código e informes en el repositorio público. Se verificó mediante el conector que el propietario y la cuenta autenticada son Facu42, con permisos admin/push; el segundo intento reducido también fue rechazado. No se intentará otro método de subida. Los cambios están en el commit local y requieren esa autorización para subirlos. La rama remota creada sigue en el commit base; no se abrió PR ni se integró a main.
