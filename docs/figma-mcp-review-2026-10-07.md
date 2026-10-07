# Revisión MCP de Nutrigo · 7 de octubre de 2026

Se volvió a consultar el archivo `OTolnKfsxUFjaZOhhdb04i` mediante el MCP de Figma para contrastar la interfaz del paciente con los nodos canónicos:

- `12:793` (Navbar): columna de 223 px, padding 20/28, separación 28, botones de 14 px, radios de 14 px y color activo `#C2E66E`.
- `33:1574` (Header): título Poppins semibold de 22 px, subtítulo de 12 px, buscador de 330 px.
- `78:782` (Card Statistic): tarjeta de 16 px de radio, padding 16 px, fondo blanco y acento `#C2E66E`.

La implementación conserva esos valores en `nutrigo-fidelity.css`, `patient-figma-front.css` y `FigmaPatientFront.tsx`. La revisión de esta etapa agrega el comportamiento que el archivo no puede expresar por sí solo: el cajón lateral móvil entra desde el borde sin desplazar el lienzo, el velo bloquea el fondo durante la apertura y el contenido mantiene `min-width: 0` para no provocar scroll horizontal.

También se verificó que el botón de avisos conserve el contexto del paciente. Si el paciente no puede seleccionarse (por ejemplo, por cambios sin guardar o porque dejó de estar autorizado), la acción se detiene en lugar de llevar a otra pantalla.

## Corrección de hidratación y actividad

La consulta posterior confirmó que `74:2056` contiene el gráfico de hidratación de Figma (borde Saffron, barra y rótulo inferior), mientras que `71:1235` contiene tres tarjetas de actividad con fondos Green, Saffron y Orange e íconos originales de correr, fuerza y tai chi. La adaptación de actividad estaba reemplazando ese `Body` entero por párrafos de texto, por eso desaparecían los dibujos. Ahora se conserva cada subtree del frame y sólo se reemplazan nombre, porcentaje, series y categoría con datos reales; si faltan datos se muestran las mismas tarjetas con “Sin rutina asignada”.

La hidratación mantiene el gráfico y sus proporciones visuales del archivo, pero reemplaza los números de ejemplo por el registro real del paciente. No se inventa una meta: el estado sigue identificando que es un registro de agua sin meta prescrita.

## Correcciones aplicadas después de la revisión visual

- `Home.tsx` conserva `Chart` de `74:2056` y calcula sólo la altura visual de la barra a partir de los vasos registrados; el rótulo sigue diciendo `vasos` y no convierte esa proporción en una meta clínica.
- `Widget Workout Progress` conserva `71:1235` completo, incluidos los SVG de `PersonSimpleRun`, `PersonSimpleDeadlifts` y `PersonSimpleTaiChi`.
- `Widget Weight Data` conserva el anillo de Figma y muestra el peso real junto con el objetivo profesional disponible (`Bajar de peso`, `Mantener el peso` o `Subir de peso`). Si no existe un objetivo en backend, muestra `Meta de peso no registrada` y elimina las cifras de ejemplo `85` y `65`.
- `Widget Calories Intake` agrega `Cargar comida` en el mismo encabezado visual y abre el formulario persistente del diario.
- `FramePair` lleva el ícono de avisos directamente a Mensajes; ya no abre una hoja de navegación general sin relación con la notificación.
- `nutrigo-overrides.css` fija el marco a la ventana en escritorio y deja el scroll en `Content`, evitando que una ficha larga desplace toda la aplicación. En móvil conserva el scroll natural de la pantalla.
