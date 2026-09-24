# Plan V — sistema de diseño v2

## Dirección

Plan V es un **consultorio nutricional**. Decisión de Facundo del 2026-09-22: la interfaz va **exacta al archivo .fig de Nutrigo**, con el copy en español. El .fig manda en composición, color, tipografía y densidad; no manda en idioma ni en datos. Paciente y CRM comparten primitives; el CRM conserva el flujo multipaciente.

Ley canónica: [`design/nutrigo-fidelity.md`](../design/nutrigo-fidelity.md). Ante cualquier diferencia entre este documento y esa nota, manda la nota.

En demo local, esta interfaz es la canónica. `?design=legacy` conserva la aplicación anterior para comparación.

Logo canónico: `Logo Plan V Nutrición - Isotipo Circular.png`.

## Paleta de interfaz (del .fig)

Leída de las variables del archivo por el MCP de Figma, no muestreada de capturas. Tabla completa con los nombres del `.fig` en [`design/nutrigo-fidelity.md`](../design/nutrigo-fidelity.md).

- lienzo `#F9F4F2` (Cream-BG), card `#FFFFFF` (Pure White), blanco cálido `#FEFCFB`;
- texto `#272932` (Black), secundario `#52545B`, apagado `#8A8C90`, tenue `#BEBFC2`;
- línea `#E1E1E2` (Gray-Line), relleno `#EEEEEF`, sutil `#F6F6F7`;
- verde `#C2E66E` y lima claro `#DFF9A2` — activo y CTA;
- ámbar `#FFCB65` / `#FFE6B5` — carbohidratos y energía;
- naranja `#FFA257` / `#FFE1C9` — proteínas y alertas.

Sombra: `0 4px 12px rgba(176, 176, 176, 0.14)`, tal como la declara el archivo.

La paleta del logo (verde `#23955D`, dorado `#F9B343`, coral `#F87D6D`) identifica la marca en el isotipo y en piezas de Instagram. **No pinta la interfaz.** La lima `#EAFF78` de pases anteriores queda retirada.

Los estados críticos deben incluir texto o icono además de color.

## Shell compartido

- Escritorio: sidebar clara, topbar con búsqueda/notificaciones/perfil y contenido fluido.
- Tablet: sidebar compacta o drawer; cards en dos columnas cuando haya espacio.
- Móvil: una columna, navegación inferior de hasta cinco destinos y acciones secundarias dentro de cada sección.
- Breakpoints de verificación: 1440, 1024, 800, 390 y 320 px.
- Tema oscuro: conservar los acentos del logo sobre fondos verdes profundos, sin invertir el logo ni teñir fotografías.

## CRM nutricionista

- Mantener los once módulos existentes.
- Conservar el selector/lista multipaciente siempre accesible en escritorio y como drawer en móvil.
- Cada función compartida indica con claridad quién puede crear, revisar, aprobar, enviar, editar o sólo consultar.
- La ficha profesional conserva Up next, adherencia, timeline, revisión de comidas, menú, consultas, mensajes y cobranza.
- Paneles y tablas adoptan la composición visual de Nutrigo sin reemplazar datos reales por métricas decorativas.

## Experiencia paciente

- Destinos principales móviles: Inicio, Plan, Diario, Progreso y Mensajes.
- Calendario, recetas, compras, ejercicios e insights viven dentro de esos destinos o en rutas secundarias.
- Nunca mostrar notas profesionales, borradores, razonamiento interno, otros pacientes ni controles de aprobación.

## Componentes

- Títulos de página 26 px (H3 del archivo). El archivo baja hasta 9–11 px en microcopy; en producto el piso es 11 px.
- Cifras con `tabular-nums`. Iconos SVG lineales de 18–20 px.
- Topbar en el workspace (búsqueda/rol/tema). Sidebar solo para navegación y marca.
- Primario: verde `#C2E66E` con texto carbón `#272932`. Activo de menú: la misma píldora verde.
- Cards con borde `#E1E1E2`, radio 16–24 px, padding 16 y sombra del archivo.
- Gráficos con máximo cuatro colores de la paleta por vista y leyenda textual.
- Tablas compactas en escritorio; filas apiladas en móvil.
- Fotografías e ilustraciones propias o con licencia compatible; no emojis ni assets de preview.

## Tipografía

- Poppins, la cara del .fig, vía `@fontsource/poppins` (OFL-1.1), subset latino y `font-display: swap`, sin solicitudes a Google Fonts. La escala sale del archivo: H3 26/1.08, H5 22/1.08, títulos 18/1.2, 16/1.24, 14/1.25, 12/1.3, 11/1.24, párrafos 12/1.5 y 11/1.6, botones 500 con line-height 1.
- Inter y Fraunces quedan fuera de esta superficie. Las pantallas legacy (`?design=legacy`) conservan Fraunces y DM Sans hasta que se retiren.

## Licencia y originalidad

- Las imágenes del preview de Nutrigo no están incluidas en el producto.
- El usuario confirma compra de licencia de todo el pack y autoriza usarlo para Plan V. Mantener procedencia de assets al integrarlos; no se ha auditado independientemente el texto legal ni se presupone una categoría de licencia concreta.
- Usar diseño y recursos del pack autorizado manteniendo identidad Plan V; no copiar identidades ni cifras clínicas del contenido de ejemplo.

## Qué no hacer

- No sacrificar multipaciente ni el intercambio nutricionista–paciente para parecerse a un tracker individual.
- No crear botones, filtros, gráficos o estados decorativos sin flujo real.
- No usar fotos corporales, peso, ejercicio o recomendaciones clínicas sin contrato, permisos y revisión profesional.
- No introducir sombras duras, púrpura genérico, 3D o un chatbot flotante que tape información.

## Idioma

La interfaz va en español. Ningún rótulo, vacío ni mensaje queda en inglés por copiar un frame del pack, y las cifras y nombres de ejemplo del .fig no se copian: los datos son de Plan V.

## Tema oscuro

El .fig no trae pantallas oscuras. El tema oscuro se deriva de la paleta de arriba y se documenta como derivado, no como fidelidad.
