# Referencia de Figma usada para esta corrección

Se obtuvo con el MCP de Figma el código y la captura de los 24 nodos: doce pantallas
en escritorio y sus doce versiones móviles. El [inventario](manifest.json) registra
los nodos, el componente correspondiente y la huella del código recibido. La fuente
es el archivo Nutrigo `OTolnKfsxUFjaZOhhdb04i`.

El código recibido se adaptó a los componentes React y estilos de Plan V. No se añade
Tailwind ni se publican URLs temporales de Figma. Los SVG exportados utilizados están
en `src/assets/nutrigo`; el inventario también registra sus huellas. Los bloques
completos de referencia quedan en `.gstack/figma-reference` para comparación local.

Las medidas comunes conservadas del archivo son: escritorio 1440, navegación 223,
Inicio con contenido 892 y columna diaria 325; separación 28; indicadores de 142,
gráficos de 306, gráfico de peso de 204 × 127 y dona de 228; móvil 390, cabecera 64
y márgenes laterales 16. Los cambios de composición están en `figma-source.css`;
las hojas específicas de cada pantalla conservan sus medidas originales.

Plan V usa textos en español, su marca y datos de su API. No copia valores clínicos,
reseñas, autores, fotos ni la promoción comercial de los ejemplos de Figma. La falta
de un dato se representa con un bloque vacío o «—». El gráfico de peso usa la silueta
exportada en gris, sin dibujar una meta que nadie haya indicado. Las fotos reales de
recetas siguen funcionando; cuando faltan, se usa el relleno gris del diseño.

Figma no contiene el consultorio profesional. Su directorio y ficha conservan las
operaciones de Plan V, con los mismos colores y componentes. Se añaden accesos visibles
a Pacientes, Ficha y Plan, y selección de paciente en todas las pantallas del consultorio.
