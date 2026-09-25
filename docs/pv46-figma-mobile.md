# PV-46: implementación mobile desde el MCP de Figma

Fuente: archivo Nutrigo `OTolnKfsxUFjaZOhhdb04i`. Los tamaños, el orden de secciones, las tipografías, los colores y los SVG locales se tomaron de `get_design_context` y `get_metadata` con `excludeScreenshot: true`. No se usaron capturas para desarrollar esta versión.

| Pantalla | Nodo Figma | Implementación |
| --- | --- | --- |
| Dashboard | `427:14405` | `FigmaMobileDashboard.tsx`, `figma-mobile-dashboard.css` |
| Calendario | `433:17250` | `ShowroomPatientAgenda.tsx`, `figma-mobile-agenda.css` |
| Mensajes | `433:19982` | `NutrigoMessages.tsx`, `figma-mobile-messages.css` |
| Menú saludable | `445:10499` | `ShowroomHealthyMenu.tsx`, `figma-mobile-menu.css` |
| Detalle de receta | `457:13264` | `RecipePlate.tsx`, `figma-mobile-recipe.css` |
| Plan semanal | `470:15300` | `ShowroomPatientPlan.tsx`, `figma-mobile-plan.css` |
| Lista de compras | `492:11324` | `ShowroomGrocery.tsx`, `figma-mobile-grocery.css` |
| Diario de comidas | `492:14886` | `ShowroomPatientDiary.tsx`, `figma-mobile-diary.css` |
| Progreso | `498:18237` | `ShowroomProgress.tsx`, `figma-mobile-progress.css` |
| Recursos | `504:15334` | `ShowroomResources.tsx`, `figma-mobile-resources.css` |
| Detalle de recurso | `507:17412` | `ShowroomResources.tsx`, `figma-mobile-resources.css` |

La interfaz usa los datos reales de Plan V. El `.fig` incluye gasto histórico, valores antropométricos, macros, reseñas, contactos y recursos de ejemplo. Cuando faltan en la app se muestran valores vacíos o estados explícitos. La gráfica de compras conserva el bloque y usa el conteo actual de categorías; no representa gastos que Plan V no registra. El área de la ilustración corporal sigue el placeholder gris que entrega `get_design_context` para ese nodo.

Esta es una implementación estructural de las pantallas mobile. La siguiente revisión debe comparar **cada nodo y cada estado interactivo** contra el código generado por el MCP, completar las diferencias de componentes, iconos y contenido disponible, y mantener `excludeScreenshot: true`. No declarar paridad visual final hasta cerrar esa revisión.
