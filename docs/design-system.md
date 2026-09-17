# Plan V — sistema de diseño v2

## Dirección

Plan V es un **consultorio nutricional**: calma clínica, datos publicados y marca propia. Toma la organización de Nutrigo (sidebar, métricas, rail diario) y la ejecuta con paleta del logo, Poppins y componentes originales. Paciente y CRM comparten primitives; el CRM conserva el flujo multipaciente.

En demo local, esta interfaz es la canónica. `?design=legacy` conserva la aplicación anterior para comparación.

Logo canónico: `Logo Plan V Nutrición - Isotipo Circular.png`.

## Paleta extraída del logo

Valores representativos obtenidos del raster 1024×1024; si aparece un archivo vectorial oficial, ese archivo pasa a ser la fuente de verdad.

- crema `#F9F6EE` — lienzo claro y fondos extensos;
- verde profundo `#083A30` — texto principal, navegación y superficies oscuras;
- verde principal `#23955D` — acciones, selección y progreso;
- verde hoja `#62AA66` — series secundarias y estados positivos;
- dorado `#F9B343` — energía, recordatorios y calorías;
- coral `#F87D6D` — acento humano y avisos;
- naranja `#F86648` — alertas y series intensas;
- damasco `#F5A067` — información nutricional secundaria;
- dark surface `#102A24` y dark card `#173830` — derivados accesibles para tema oscuro.

No usar nuevamente lima, lila o verde ajenos al logo como colores estructurales. Los estados críticos deben incluir texto/icono además de color.

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
- Primario: dorado `#F9B343` sobre bosque `#083A30`. Activo de menú: bosque con texto crema.
- Cards con borde `#E2E6DC`, radio 14–16 px y sombra mínima. Sin bloques pastel que compitan con los datos.
- Gráficos con máximo cuatro colores de la paleta por vista y leyenda textual.
- Tablas compactas en escritorio; filas apiladas en móvil.
- Fotografías e ilustraciones propias o con licencia compatible; no emojis ni assets de preview.

## Tipografía

- Poppins confirmada por el usuario a partir del archivo Nutrigo. El showroom paciente/CRM usa Poppins local mediante `@fontsource/poppins` (OFL-1.1), pesos 400/500/600/700/800, subset latino y `font-display: swap`, sin solicitudes a Google Fonts. Las superficies originales conservan temporalmente Fraunces y DM Sans hasta su migración visual.
- El raster del logo no permite identificar una fuente exacta y no se reemplazará por una fuente externa sin confirmación.

## Licencia y originalidad

- Las imágenes del preview de Nutrigo no están incluidas en el producto.
- El usuario confirma compra de licencia de todo el pack y autoriza usarlo para Plan V. Mantener procedencia de assets al integrarlos; no se ha auditado independientemente el texto legal ni se presupone una categoría de licencia concreta.
- Usar diseño y recursos del pack autorizado manteniendo identidad Plan V; no copiar identidades ni cifras clínicas del contenido de ejemplo.

## Qué no hacer

- No sacrificar multipaciente ni el intercambio nutricionista–paciente para parecerse a un tracker individual.
- No crear botones, filtros, gráficos o estados decorativos sin flujo real.
- No usar fotos corporales, peso, ejercicio o recomendaciones clínicas sin contrato, permisos y revisión profesional.
- No introducir sombras duras, púrpura genérico, 3D o un chatbot flotante que tape información.
