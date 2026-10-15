# Auditoría de fidelidad Figma MCP — paciente

Fecha: 27 de septiembre de 2026. Fuente: archivo [Nutrigo — Nutrition & Diet Dashboard](https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard). Se leyó el código y la metadata de Figma mediante MCP (`get_design_context` y `get_metadata`, sin usar capturas como fuente). Se compararon los 36 marcos de escritorio, tablet y móvil con el DOM local a 1440, 800 y 390 px mediante `/browse`. Las medidas se normalizaron por la escala del marco de escritorio.

## Conclusión

**Todavía no hay paridad completa con Figma.** Las secciones principales de Inicio, Calendario, Mensajes, Plan de comidas, Progreso, Lista de compras y Ejercicios coinciden en posición y alto con los marcos revisados (margen de 3 px para subpíxeles). En esta continuación se reconstruyeron también Consejos de salud, Detalle de consejo y Detalle de receta a partir del código y la metadata de sus nodos. La geometría comprobada coincide, pero esto no demuestra paridad de cada icono, imagen, texto, radio, sombra o estado interactivo.

## Ajustes hechos en esta revisión

- Inicio: se recuperaron las alturas de recomendaciones, actividad y tarjetas en las tres variantes.
- Calendario: se ajustaron los paneles de agenda de tablet y móvil.
- Mensajes: se ajustó la altura de columnas e hilo. En móvil queda una desviación de unos 4 px en el área de chat.
- Plan de comidas: las siete filas vuelven a las alturas del diseño en tablet y móvil.
- Progreso: se igualaron las alturas de tabla, tendencia y tarjetas de sueño.
- Lista de compras: las estadísticas, los tres paneles de resumen, la lista y el pie se ordenaron según los marcos de Figma en las tres variantes. La lista sigue siendo interactiva.
- Diario de comidas y Ejercicios en tablet: barras de herramientas de 30 px, con desplazamiento horizontal para mantener accesibles todos los controles.
- Menú saludable: se fijó la altura de las tarjetas de escritorio y tablet, manteniendo desplazamiento interno cuando hay contenido adicional.
- Menú saludable móvil: el selector se rotuló «Ordenar:» para conservar la función real de orden por plan/nombre y encajar en los 135 px del control de Figma. El marco móvil quedó con 16/16 nodos medidos sin desvíos mayores de 3 px.
- Menú saludable tablet: los tres controles del encabezado se mapearon con sus IDs de Figma y se ajustaron a 500, 40 y 104 px; el marco quedó con 16/16 nodos medidos sin desvíos mayores de 3 px.
- Consejos de salud: portada, pestañas, artículo destacado, populares, recomendaciones y lateral reconstruidos para escritorio, tablet y móvil. El ancho desplazable de las pestañas móviles y sus seis botones medidos coincide con Figma.
- Detalle de consejo: artículo, cita, bloques de lectura, lateral y pie móvil reconstruidos. Se conservaron abrir, guardar, compartir y navegar.
- Detalle de receta: resumen, reseñas, utensilios, preparación, ingredientes, porciones, macros y tabla nutricional reorganizados como los tres marcos de Figma. Se añadió una receta completa solo al modo demo, etiquetada como ejemplo. El control de porciones modifica las cantidades, incluidos los ingredientes expresados como fracción. Los datos nutricionales del ejemplo están identificados como muestra; en recetas reales sin fuente nutricional publicada se muestran guiones.

## Diferencias pendientes, por prioridad

| Prioridad | Vista | Evidencia contra Figma | Trabajo necesario |
| --- | --- | --- | --- |
| P1 | Consejos de salud | Las medidas principales coinciden en los tres tamaños; en móvil se comprobaron 31/31 nodos del manifiesto sin desvíos mayores de 3 px. | Revisar activos, tipografía, textos traducidos y estados de búsqueda/filtro frente a cada capa del pack. |
| P1 | Detalle de consejo | Las medidas principales coinciden en los tres tamaños; escritorio 10/10, tablet 10/10 y móvil 24/24 nodos medidos sin desvíos. | Afinar contenido editorial, activos e interacciones de los botones secundarios. |
| P1 | Detalle de receta | Los tres marcos principales coinciden: escritorio 11/11, tablet 10/10 y móvil 17/17 nodos medidos sin desvíos; el cambio de 2 a 3 porciones actualizó 200 a 300 g en navegador. | Revisar microdetalle y las imágenes de recetas publicadas cuando existan activos reales; ampliar la fuente clínica de información nutricional. |
| P1 | Lista de compras | Los marcos principales ya coinciden, pero la tabla y los gráficos funcionales no usan aún cada subcomponente original. El costo y las calorías muestran “Sin dato” porque no existe una fuente de precios/macros para esa lista. | Ajustar filas, iconos, gráficos y estados con el código de Figma; conservar el estado real de compra. |
| P1 | Menú saludable | Los marcos medidos de móvil y tablet coinciden (16/16 nodos en cada uno). | Afinar textos, iconos y estados internos de tarjetas y filtros. |
| P1 | Diario de comidas tablet | El contenedor visible de la tabla mide 636 px frente a 980 px en Figma. La tabla interna conserva un mínimo de 980 px con desplazamiento horizontal, decisión de usabilidad a 800 px. | Validar si se quiere mostrar el recorte exacto de Figma o mantener la tabla desplazable. |
| P2 | Microdetalle global | Aún no se comparó cada capa de texto, icono, radio, sombra, imagen y estado interactivo de los 36 marcos. El modo demo tiene contenido distinto al estático del diseño. | Segunda pasada por componentes y estados, usando código/metadata del MCP y medidas del DOM, sin tomar capturas como implementación. |

## Criterio de cierre

Marcar esta tarea cerrada solo cuando las 36 variantes con datos de muestra tengan secciones y subcomponentes del pack donde corresponda, navegación/acciones funcionales, sin desbordamiento horizontal no previsto a 390 px, y se verifiquen medidas, tipografía, radios, colores y recursos. La compilación y las pruebas automatizadas no sustituyen esta revisión visual y estructural.

## Verificación técnica de este corte

`npm run check`: correcto. `npm run build`: correcto. `npm test -- --run --reporter=dot`: 609 pruebas correctas y 2 omitidas. Las comparaciones de navegador son de geometría y presencia de nodos; no son una comparación píxel a píxel.
