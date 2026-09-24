# PV-45 · Revisión mobile Nutrigo

Fecha: 2026-09-24. Referencia: archivo Figma `OTolnKfsxUFjaZOhhdb04i` y medidas asentadas en [`design/nutrigo-fidelity.md`](../design/nutrigo-fidelity.md). Capturas tomadas en la app local con `APP_MODE=demo`, `AI_MODE=demo` y `VITE_ALLOW_DEMO=true`.

## Cambios

- La barra mobile conserva el título de la pantalla a 64 px de alto, con iconos de 32 px y sin salto de línea. El archivo dibuja logo, título y menú; Plan V también conserva las alertas y las opciones de cuenta.
- Los nombres extensos tienen una variante breve sólo en mobile (`Plan`, `Diario`, `Menú`, `Compras`, etc.). El encabezado accesible y el título de escritorio mantienen el nombre completo.
- Las tarjetas de seguimiento en el ancho intermedio crecen según su contenido; ya no dejan texto fuera de la tarjeta a 800 px.

## Comparación visual

| Superficie | Figma | App local | Resultado |
|---|---|---|---|
| Inicio, 390 px | [`dashboard`](../design/pv45-mobile/figma-dashboard-390.png) | [`inicio`](../design/pv45-mobile/app-dashboard-final-390.png) | Barra 64 px, cards en una columna y composición vertical revisadas. |
| Menú, 390 px | [`menú`](../design/pv45-mobile/figma-menu-390.png) | [`menú`](../design/pv45-mobile/app-menu-final-390.png) | Destacado, filtros y lista en una columna. |
| Plan, 390 px | [`plan`](../design/pv45-mobile/figma-plan-390.png) | [`plan`](../design/pv45-mobile/app-patient-plan-final-390.png) | Grilla desplazable dentro del módulo, sin ensanchar la página. |
| Diario, 320 px | [`diario`](../design/pv45-mobile/figma-diary-390.png) | [`diario`](../design/pv45-mobile/app-patient-diary-after-320.png) | Resumen apilado y tabla desplazable; título completo. |
| Mensajes, 390 px | [`mensajes`](../design/pv45-mobile/figma-messages-390.png) | [`mensajes`](../design/pv45-mobile/app-messages-after-390.png) | Lista, conversación y perfil apilados. |
| Consultorio, 390 px | Diseño compartido del dashboard | [`inicio profesional`](../design/pv45-mobile/app-pro-dashboard-before-390.png), [`plan profesional`](../design/pv45-mobile/app-pro-plan-after-390.png) | Navegación y grilla revisadas en rol nutricionista. |
| Ancho intermedio, 800 px | Adaptación entre mobile y desktop | [`inicio`](../design/pv45-mobile/app-dashboard-fixed-800.png) | Texto de tarjetas contenido; sin overflow horizontal. |

También se inspeccionaron [`agenda`](../design/pv45-mobile/app-agenda-final-390.png), [`progreso`](../design/pv45-mobile/app-progress-final-390.png) y [`compras`](../design/pv45-mobile/app-grocery-final-390.png) a 390 px. En 320 px se verificaron [`inicio`](../design/pv45-mobile/app-dashboard-after-320.png), [`plan paciente`](../design/pv45-mobile/app-patient-plan-after-320.png), [`diario`](../design/pv45-mobile/app-patient-diary-after-320.png) y [`plan profesional`](../design/pv45-mobile/app-pro-plan-after-320.png). En estas rutas, el ancho del documento coincidió con el viewport; el plan y el diario mantienen desplazamiento interno intencional.

## Límites de esta revisión

- Las capturas de Figma usan datos y fotos del kit; el demo local usa datos propios de Plan V e imágenes ilustrativas. No son diferencias de estructura.
- El detalle de receta del nodo mobile `457:13264` quedó como referencia visual ([`Figma`](../design/pv45-mobile/figma-recipe-390.png)); no se pudo abrir en el paciente demo porque no tiene una receta publicada y asignada. Hace falta repetir ese recorrido con una receta real en staging.
- Esta revisión cubre la vista responsive en navegador. No incluye instalación PWA ni pruebas en un dispositivo físico.
