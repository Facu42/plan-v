# Revisión MCP de Nutrigo · 7 de octubre de 2026

Se volvió a consultar el archivo `OTolnKfsxUFjaZOhhdb04i` mediante el MCP de Figma para contrastar la interfaz del paciente con los nodos canónicos:

- `12:793` (Navbar): columna de 223 px, padding 20/28, separación 28, botones de 14 px, radios de 14 px y color activo `#C2E66E`.
- `33:1574` (Header): título Poppins semibold de 22 px, subtítulo de 12 px, buscador de 330 px.
- `78:782` (Card Statistic): tarjeta de 16 px de radio, padding 16 px, fondo blanco y acento `#C2E66E`.

La implementación conserva esos valores en `nutrigo-fidelity.css`, `patient-figma-front.css` y `FigmaPatientFront.tsx`. La revisión de esta etapa agrega el comportamiento que el archivo no puede expresar por sí solo: el cajón lateral móvil entra desde el borde sin desplazar el lienzo, el velo bloquea el fondo durante la apertura y el contenido mantiene `min-width: 0` para no provocar scroll horizontal.

También se verificó que el botón de avisos conserve el contexto del paciente. Si el paciente no puede seleccionarse (por ejemplo, por cambios sin guardar o porque dejó de estar autorizado), la acción se detiene en lugar de llevar a otra pantalla.
