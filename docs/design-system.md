# Plan V — sistema de diseño v2

## Dirección

Plan V es un **consultorio nutricional**. Decisión de Facundo del 2026-09-22: la interfaz va **exacta al archivo .fig de Nutrigo**, con el copy en español. El .fig manda en composición, color, tipografía y densidad; no manda en idioma ni en datos. Paciente y CRM comparten primitives; el CRM conserva el flujo multipaciente.

Ley canónica: [`design/nutrigo-fidelity.md`](../design/nutrigo-fidelity.md). Ante cualquier diferencia entre este documento y esa nota, manda la nota.

En demo local, esta interfaz es la canónica. `?design=legacy` conserva la aplicación anterior para comparación.

Logo canónico: `Logo Plan V Nutrición - Isotipo Circular.png`.

## Paleta de interfaz (del .fig)

Muestreada pixel a pixel de `design/nutrigo-exports/`, no estimada a ojo.

- lienzo `#F9F4F2` — fondo de página, blanco cálido;
- card `#FFFFFF` — superficies;
- carbón `#272932` — texto principal;
- gris `#8F9195` — texto secundario y navegación inactiva;
- borde `#EEEEEF` — bordes y tracks;
- verde `#C2E66E` — ítem activo y CTA primaria;
- lima claro `#DFF9A2` — fondos de estado positivo;
- ámbar `#FFCB65` — carbohidratos, energía, progreso;
- naranja `#FFA257` — proteínas, alertas, series intensas.

La paleta del logo (verde `#23955D`, dorado `#F9B343`, coral `#F87D6D`) identifica la marca en el isotipo y en piezas de Instagram. **No pinta la interfaz.** La lima `#EAFF78` de pases anteriores queda retirada: el verde activo del pack es `#C2E66E`.

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

- Tipografía operativa nunca por debajo de 12 px; cuerpo 13–14 px; títulos de página 24–28 px.
- Cifras con `tabular-nums`. Iconos SVG lineales de 18–20 px.
- Topbar en el workspace (búsqueda/rol/tema). Sidebar solo para navegación y marca.
- Primario: verde `#C2E66E` con texto carbón `#272932`. Activo de menú: la misma píldora verde.
- Cards con borde `#EEEEEF`, radio 16–24 px y sombra suave.
- Gráficos con máximo cuatro colores de la paleta por vista y leyenda textual.
- Tablas compactas en escritorio; filas apiladas en móvil.
- Fotografías e ilustraciones propias o con licencia compatible; no emojis ni assets de preview.

## Tipografía

- Poppins, la cara del .fig, vía `@fontsource/poppins` (OFL-1.1), subset latino y `font-display: swap`, sin solicitudes a Google Fonts. Jerarquía 400 cuerpo / 500 etiquetas / 600 títulos / 700 ítem activo.
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
