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
| Ejercicio | `501:22824` | `FigmaMobileExercise.tsx`, `figma-mobile-exercise.css` |
| Recursos | `504:15334` | `ShowroomResources.tsx`, `figma-mobile-resources.css` |
| Detalle de recurso | `507:17412` | `ShowroomResources.tsx`, `figma-mobile-resources.css` |

La interfaz usa los datos reales de Plan V. El `.fig` incluye gasto histórico, valores antropométricos, macros, reseñas, contactos y recursos de ejemplo. Cuando faltan en la app se muestran valores vacíos o estados explícitos. La gráfica de compras conserva el bloque y usa el conteo actual de categorías; no representa gastos que Plan V no registra. El área de la ilustración corporal sigue el placeholder gris que entrega `get_design_context` para ese nodo. La tabla de Ejercicio usa asignaciones y actividades reales; deja peso y calorías vacíos porque esos campos no existen en el modelo actual.

La extracción del código generado por el MCP cubrió los doce frames mobile de la página `💻 Interface` (`1:2`). En el dashboard se sustituyeron los arcos dibujados con CSS por los SVG exportados por Figma y se reconstruyó el deslizador de peso según `427:14416`. En Ejercicio se tomaron las dimensiones, columnas, iconos y barra horizontal de `501:22824` y se conectaron búsqueda, orden, alta de actividad y registro de series a las funciones existentes. En Mensajes se preservan las alturas de la lista (`916 px`), la conversación (`900 px`) y el perfil (`933 px`) del frame aun cuando Plan V tenga menos contactos que el ejemplo. Las secciones mayores de dashboard, agenda, menú, diario, compras, recursos y Mensajes se cotejaron por geometría DOM a 390 px; Ejercicio también a 320 px, sin usar capturas.

El MCP devuelve React y clases Tailwind generados a partir del diseño, con contenido de ejemplo. No entrega el código original de una app funcional ni los datos de Plan V. Esta implementación adapta ese código al proyecto sin copiar los pacientes, registros ni valores ficticios del `.fig`. El gate visual mobile sigue separado del gate Nutrigo desktop ya aprobado.
