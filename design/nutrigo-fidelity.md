# Ley de fidelidad Nutrigo — Plan V

Fecha: 2026-09-22. **Facundo cerró la discusión: la interfaz va exacta al archivo .fig de Nutrigo, con el copy en español.** Esta nota manda sobre cualquier nota anterior, incluida la versión previa de este mismo archivo, que apartaba la piel del pack hacia pasteles Plan V, lima `#EAFF78` e Inter. Esa desviación queda sin efecto.

## Referencia de composición

Archivo Figma Cloud (Facu importó el pack):

https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard

File key: `OTolnKfsxUFjaZOhhdb04i`

La composición (sidebar, rails, densidad de las once pantallas) sale de ese archivo. El MCP de Figma quedó autorizado el 2026-09-22 y desde entonces las medidas se leen nodo por nodo; antes había respondido OAuth 403 y la ley no inventaba lo que no estuviera en el inventario.

**Cuota:** la cuenta es Starter, con unas veinte llamadas de MCP por mes. Por eso cada nodo se lee una sola vez y lo leído se asienta acá.

## Piel

Color y tipografía salen de **las variables del propio archivo**, leídas por el MCP de Figma el 2026-09-22 sobre el nodo `12:792`. No están muestreadas de una captura ni estimadas a ojo. Los nombres de la izquierda son los del `.fig`.

| Variable del .fig | Hex | Token | Uso |
|---|---|---|---|
| Cream-BG | `#F9F4F2` | `--nv-bg` | lienzo de página |
| Pure White | `#FFFFFF` | `--nv-card` | cards |
| White | `#FEFCFB` | `--nv-card-warm` | blanco cálido |
| Black | `#272932` | `--nv-ink` | texto principal |
| Gray-30 | `#52545B` | `--nv-ink-soft` | texto secundario fuerte |
| Gray-20 | `#8A8C90` | `--nv-muted` | texto apagado, nav inactiva |
| Gray-10 | `#BEBFC2` | `--nv-faint` | texto deshabilitado |
| Gray-Line | `#E1E1E2` | `--nv-line`, `--nv-border` | bordes y divisores |
| Gray-BG | `#EEEEEF` | `--nv-fill` | rellenos y tracks |
| Gray-BG-Subtle | `#F6F6F7` | `--nv-track` | relleno sutil, campos |
| Green | `#C2E66E` | `--nv-accent` | ítem activo, CTA primaria |
| Green-Light | `#DFF9A2` | `--nv-accent-soft` | estado positivo |
| Saffron | `#FFCB65` | `--nv-gold` | carbohidratos, energía |
| Saffron-Light | `#FFE6B5` | `--nv-gold-soft` | fondo ámbar |
| Orange | `#FFA257` | `--nv-coral` | proteínas, alertas |
| Orange-10 | `#FFE1C9` | `--nv-coral-soft` | fondo naranja |

Sombra, tal como la declara el archivo: `0 4px 12px rgba(176, 176, 176, 0.14)`.

El dorado `#F9B343` del isotipo Plan V no es token de interfaz. La lima `#EAFF78` de Plan V tampoco: el verde activo del pack es `#C2E66E`.

### Tipografía

**Poppins**, vía `@fontsource/poppins` (OFL-1.1, subset latino, sin pedidos a Google Fonts). La escala es la del archivo, con su altura de línea:

| Estilo | Tamaño | Peso | Line-height |
|---|---|---|---|
| H3 | 26px | 700 | 1.08 |
| H5 | 22px | 400 / 600 | 1.08 |
| Title | 18px | 600 / 700 | 1.2 |
| Title | 16px | 400 / 600 | 1.24 |
| Title | 14px | 400 / 600 | 1.25 |
| Title | 12px | 400 / 600 | 1.3 |
| Title | 11px | 400 / 600 | 1.24 |
| P | 12px | 400 | 1.5 |
| P | 11px | 400 | 1.6 |
| Btn | 14px / 12px | 500 | 1 |

Inter y Fraunces quedan fuera de esta superficie.

### Medidas

Del frame `12:792` "01. Dashboard (Desktop)", a 1440:

- sidebar 223 + contenido 892 + rail 325 = 1440
- padding de contenido 28, padding de card 16, separación entre secciones 20
- cards de estadística 197 × 142, con 16 de separación

### Navegación (nodo `12:793`)

Padding 28/20, separación 28, lista con separación 8. **El ítem no es una cápsula:** el archivo usa radio 14, padding 10/8/10/16, separación 12, icono de 20, texto 14 peso 500. El activo se pinta con Green `#C2E66E` sobre tinta. El contador de mensajes va en Orange, radio 9, 10px.

Los iconos son **Phosphor**: los nombres de las capas del archivo son literalmente los de la librería. Se usa `@phosphor-icons/react`, la misma fuente, en vez de redibujarlos.

### Card de estadística (nodo `74:2016`)

197 × 142, fondo blanco, **radio 16**, padding 16, columna con el rótulo arriba y el bloque de datos abajo, separación interna 12.

- rótulo: 14 regular, interlineado 1.25, tinta
- chip del icono: 26 × 26 (padding 6 sobre un glifo de 14), radio 10, fondo Green
- cifra: 16 semibold 1.24, tinta; unidad 12 regular 1.3, Gray-20, alineada por la base con 4 de separación
- gráfico: alto 24, radio 6, separación 6; barra llena Orange `#FFA257`, barra vacía Saffron `#FFCB65`, punto vacío Gray-BG `#EEEEEF`
- pie: porcentaje 12 semibold 1.3 Gray-30 `#52545B`; resto 11 regular 1.24 Gray-20

### Header del contenido (nodo `33:1574`)

50 de alto. A la izquierda un bloque de 340: título 22 semibold interlineado 1.08 y bajada 12 regular 1.3 en Gray-20, con 6 entre las dos. A la derecha el buscador: 330, blanco, radio 12, padding 9/13, icono 18 y texto 14 regular.

**El 26 bold no es el título de página**, es la cifra de la dona de peso. La escala del archivo lo usa una sola vez.

### Cuerpo (nodo `84:1489`)

836 de ancho, cuatro secciones con 20 de separación:

1. estadísticas: cuatro cards de 197, separación 16
2. peso 265 + calorías 551
3. progreso: tres ítems de 265 × 92
4. recomendados: 556 + 260

### Dona de peso (nodo `57:1509`)

Card de 265 × 306, radio 16, padding 16/16/24, separación 16. Media dona de 204 × 127. Adentro: cifra 26 bold y unidad 24 regular alineadas por la base con 3 de separación, y debajo un rótulo 11 regular Gray-20. A los extremos, el inicio y la meta en 14 semibold Gray-20. Abajo, una nota separada por una línea Gray-Line de 1, texto 11 regular 1.6 en Gray-30.

### Dona de calorías (nodo `62:1513`)

Card de 551 × 306, radio 16, padding 16, separación 16. Cuerpo en dos columnas con 16: dona de 228 y, a la derecha, columna con 20 de separación.

- centro de la dona: icono 32, cifra 22 semibold con unidad 22 regular, rótulo 11 regular Gray-20
- detalle: chip Green-Light de 32 × 36 radio 20 con icono 16, cifra 18 semibold, unidad 16 regular, rótulo 11
- lista de macros: ítem Gray-BG-Subtle radio 12 con 16 de separación; pastilla Gray-BG radio 10 de 89 con cifra 18 bold y unidad 9 en Gray-30; a la derecha, nombre 11 regular y porcentaje 11 semibold, y barra de 6 radio 6 en Green sobre blanco

### Calendario (nodo `84:1666`)

Cuerpo de 836. Arriba, tres cards de resumen de 108. Debajo, el calendario en una sola card: cabecera de días de 40 con línea Gray-Line y texto 12 regular Gray-20 (`217:6491`), y celdas de 119,43 × 120 con padding 4 y número de 18 en 10 (`217:6501`). El día de hoy es una pastilla Green; el elegido lleva contorno Green de 2; los días de fuera van en Gray-BG con texto Gray-10. Los controles de mes son botones de 30 radio 8, y las vistas y filtros son grupos segmentados sobre Gray-BG.

### Mensajes (nodo `84:2565`)

Sin rail: el cuerpo de 1161 se parte en 299 + 547 + 275 con 20. Los contactos son ítems de 96, la cabecera del chat mide 100 con padding 16 y el pie 88. Las burbujas van radio 12/12/12/2 en Gray-BG-Subtle; las propias, espejadas en Green-Light. Los campos no llevan borde: radio 12 sobre Gray-BG-Subtle.

### Menú saludable (nodo `84:2716`)

Contenido 816 + rail 289. El destacado es de 338 con imagen de 298 al lado del texto, radio 12 en la foto. La lista de abajo es una sección sin card, con artículos de 136 y fotos de 104. Los momentos del día son ítems de 100. Los filtros son un grupo segmentado.

### Plan semanal (nodo `84:2994`, fila en `373:10644`)

El archivo arma el plan como tabla de 1161: celda de día de 120 en Cream-BG con día 14 semibold y fecha 12 Gray-20, y una celda por comida con imagen de 88 y radio 14. Cada momento tiene su tinte: desayuno Green-Subtle, almuerzo Saffron-Subtle, merienda Orange-Subtle y cena Gray-BG-Subtle. Plan V muestra un día por vez, así que la fila se aplica a las comidas de ese día.

### Lista de compras (nodo `105:2472`)

Cuerpo 1161. Cards de resumen de 84. La lista es una tabla con solapas de 42 (activa en Green), filas de 66 y 16 de aire adentro de la card. El buscador no lleva borde: radio 12.

### Diario (nodo `105:2649`)

Tira de estadística de 104 con cuatro cards de 282 × 72 radio 16, chip de 26 radio 10. Debajo, la tabla en una card con filas de 68 separadas por línea Gray-Line y 16 de aire.

### Progreso (nodo `105:2790`)

Cuerpo 1161 = 767 + 374 con 20. Los widgets llevan padding 16 y cabecera de sección de 30. La tabla de medidas tiene filas de 44 y los períodos son un grupo segmentado.

### Insights (nodo `263:6588`)

Contenido 856 + rail 249. Cabecera con buscador y chips de 28 radio 8, solapas de 34, destacado de 369 al lado de la lista de 459, y abajo dos bloques de 414 con cards de 197 × 218. La lista del rail usa ítems de 56.

### Detalle de receta (nodo `84:3145`)

Cuerpo de 1161 = izquierda 275 + contenido 591 + derecha 295, **sin huecos**: la separación la hace el padding de cada columna.

- izquierda: Cream-BG radio 16, imagen cuadrada de 275 radio 16 sobre Gray-BG, y una ficha de datos con filas de 24 a los extremos, rótulo 14 regular Gray-20 e importe 14 semibold
- contenido: card blanca radio 16, padding 4/28, separación 24; título 22 semibold 1.08; bloque «sobre» en Gray-BG-Subtle radio 16 padding 16 con badge de 62 × 26 radio 8 en Saffron y texto 14 regular Gray-30; herramientas y pasos en dos columnas de 90 y 429 con 16
- derecha: separación 20; bloque de porciones Cream-BG radio 16 padding 16, con ingredientes como filas de 32 (número de 28 radio 7, texto 12 regular Gray-30); cuatro fichas de 64,75 × 118 radio 16 en Green con padding 12, icono de 32 radio 8 en White y rótulo de 9; widget de nutrición Cream-BG radio 16, primera fila 16 semibold y el resto 12 medium contra 12 semibold

Plan V no tiene pantalla de receta: la ficha vive como card dentro del diario y del plan, así que se aplican las piezas que sí existen (imagen, badge, título, fichas de macros, ingredientes). Las fichas de macro pierden los azules y rojos inventados: en el archivo las cuatro son Green.

### Detalle de recurso (nodo `279:9301`)

Cuerpo de 1161 = contenido 800 + 36 + rail 325. Cada columna es **una sola card blanca de radio 16 con padding 36**; las secciones de adentro no llevan card propia.

- cabecera: categoría 12 regular en Green-Dark `#73A107`, título 28 semibold 1.08, autor 12 regular Gray-30 y fecha 12 regular Gray-20
- entrada: caja con borde izquierdo de 2 Gray-Line y padding 16/24, texto 14 regular 1.4 Gray-20
- imagen: 728 × 408 radio 16 sobre Gray-BG
- cuerpo: títulos 14 semibold en Heading `#212738`, párrafos 14 regular 1.4 Gray-30
- cita: Cream-BG con borde izquierdo de 2 en Orange y radio 0 12 12 0, padding 16/24
- rail: separación 32 entre secciones, cabecera de 30, etiquetas como chips de 28 radio 8 en Cream-BG con el numeral en Gray-10, y artículos relacionados con título 14 semibold

La card de relacionados del archivo lleva una foto de 253 × 160 que Plan V no tiene: la fila queda con el icono de la guía en su lugar.

## Copy

**La interfaz va en español.** El .fig manda en composición, color, tipo y densidad; no en idioma. Ningún rótulo, vacío ni mensaje queda en inglés por copiar el frame. Las cifras y nombres de ejemplo del pack no se copian: los datos son de Plan V.

## Nodos del archivo

La página de interfaz es `1:2`. Los frames de escritorio, por id:

| # | Pantalla | Nodo | Alto |
|---|---|---|---|
| 01 | Dashboard | `12:792` | 1232 |
| 04 | Calendar | `84:1666` | 1048 |
| 07 | Messages | `84:2565` | 1046 |
| 10 | Healthy Menu | `84:2716` | 1118 |
| 13 | Recipe Details | `84:3145` | 1197 |
| 16 | Meal Plan | `84:2994` | 1088 |
| 19 | Grocery List | `105:2472` | 1412 |
| 22 | Food Diary | `105:2649` | 1322 |
| 25 | Progress | `105:2790` | 1157 |
| 28 | Exercise | `105:2931` | 1136 |
| 31 | Insights | `263:6588` | 1136 |
| 34 | Insight Details | `279:9301` | 2020 |

Todos miden 1440 de ancho. El archivo trae además una versión tablet (800) y una móvil (390) de cada pantalla.

Los frames móviles, por id:

| # | Pantalla | Nodo | Alto |
|---|---|---|---|
| 03 | Dashboard | `427:14405` | 4514 |
| 06 | Calendar | `433:17250` | 2004 |
| 09 | Messages | `433:19982` | 2995 |
| 12 | Healthy Menu | `445:10499` | 3195 |
| 15 | Recipe Details | `457:13264` | 3146 |
| 18 | Meal Plan | `470:15300` | 1726 |
| 21 | Grocery List | `492:11324` | 2364 |
| 24 | Food Diary | `492:14886` | 1624 |
| 27 | Progress | `498:18237` | 2382 |
| 30 | Exercise | `501:22824` | 1084 |
| 33 | Insights | `504:15334` | 2990 |
| 36 | Insight Details | `507:17412` | 3328 |

La versión tablet (800) todavía no está medida.

Se listan con el Plugin API, no con la REST API: la REST solo devuelve la página de estilos.

## Pantallas

Once superficies. Recipe Details e Insights entran. **Ejercicio no entra** en este pase visual; la página sigue en el producto.

1. Dashboard
2. Calendar
3. Messages
4. Healthy Menu
5. Recipe Details
6. Meal Plan
7. Grocery
8. Food Diary
9. Progress
10. Insights
11. Insight Details

## Móvil (390)

La piel móvil vive en un solo bloque `@media (max-width: 799px)` de `nutrigo-fidelity.css`.

**Ley común**

- barra superior blanca de 64 con padding 16, logo de 32, título de la pantalla en 16 semibold, y el botón de menú de 32 radio 12 a la derecha, en x 342 como en el archivo
- contenido de 390 con 16 de guarda: ancho útil 358
- cards de 358, radio 16, padding 16
- 24 entre bloques en Dashboard, Calendario y Diario; 32 en Menú, Plan, Compras, Progreso e Insights
- cabecera de contenido: bloque de título de 46, título 20 semibold, bajada 11 regular Gray-20
- cabeceras de sección de 30, título 14 semibold

**Por pantalla**

- **Dashboard** (`427:14405`): una card de estadística por fila, 142 y 16 entre cada una; el resto del cuerpo en una columna
- **Calendario** (`433:17250`): las cards de resumen en fila y el calendario **a sangre**, 390 de ancho, con cabecera de días de 36 y celdas de 55,71 × 120
- **Mensajes** (`433:19982`): lista, chat y perfil apilados a ancho completo; ítems de lista de 90 con padding 22/20, cabecera del chat de 98, perfil radio 12 con padding 24/16
- **Menú saludable** (`445:10499`): 32 entre bloques, destacado en una columna
- **Plan semanal** (`470:15300`): el archivo deja la tabla en 700 y la desplaza al costado; Plan V muestra un día por vez y mantiene la tira de días con desplazamiento lateral
- **Lista de compras** (`492:11324`): 32 entre el bloque de datos y la lista
- **Diario** (`492:14886`): 24 entre bloques, métricas una por fila
- **Progreso** (`498:18237`): en móvil el lienzo es blanco y los widgets pasan a Cream-BG, al revés que en escritorio
- **Insights** (`504:15334`): la cabecera es un bloque Gray-BG con padding 32/16; solapas de 30 radio 8
- **Detalle de recurso** (`507:17412`): una columna, card de texto con padding 24/16 e imagen cuadrada
- **Detalle de receta** (`457:13264`): título 20 semibold y ficha a una columna

**Navegación**

Igual que el archivo: el botón de la barra abre un cajón de 223 con la Navbar del nodo `12:793`, y la barra inferior de pestañas no se muestra por debajo de 800. El archivo no dibuja el estado abierto del menú (el set `Navbar` tiene Desktop 223, Tablet 76, Mobile 390 × 68 y Mobile Back 390 × 64, y ninguna variante con el cajón desplegado), así que el contenido del cajón es la Navbar de escritorio, que es el único menú que el archivo dibuja.

El cajón se cierra al navegar, al tocar el velo y con Escape; al cerrarse con Escape o con el velo el foco vuelve al botón.

**Desviaciones deliberadas en móvil**

- El selector de rol Paciente/Nutricionista y la campana de avisos no están en el archivo. Se compactan a 32 de alto para que la barra caiga en los 64.
- El archivo tiene tres cards de resumen en el calendario; Plan V tiene cuatro, así que van dos por fila. El alto de 178 del archivo es para una card con gráfico: la de Plan V lleva rótulo y cifra y se queda en 108.

## Tema oscuro

El .fig no trae pantallas oscuras, así que no hay nada a lo que ser exacto. El tema oscuro se deriva de la paleta de arriba y se marca como derivado, no como fidelidad.

## QA

Las once capturas están en `design/nutrigo-exports/` (`01-dashboard.png` … `11-insight-details.png`).

**Limitación conocida:** son capturas de pantalla completa de Figma abierto en el navegador, no exports limpios de frame. Cerca de la mitad del ancho es escritorio, barra de tareas y paneles de Figma, y el frame queda recortado a la derecha (en `01-dashboard.png` se corta la card Water Intake; en `08-food-diary.png` se cortan las columnas de macronutrientes). Sirven para color, tipo y composición general. No alcanzan para medir el borde derecho ni para un diff pixel a pixel.

## Traer el archivo (reemplaza las capturas)

`npm run figma:pull` baja el archivo de verdad por la REST API y deja:

- `design/nutrigo-nodes/<frame>.json` — el árbol de nodos completo: posición, tamaño, relleno, borde, radio, tipografía y auto-layout de cada capa. Esto es el .fig en forma trabajable; el binario `.fig` no tiene parser abierto y no sirve para esto.
- `design/nutrigo-exports/<frame>.png` — render limpio a 2x, sin cromo de navegador ni recorte.
- `design/nutrigo-svg/<frame>.svg` — vector con geometría y texto exactos.
- `design/nutrigo-tokens.json` — colores, escala tipográfica, radios y espaciados, por frecuencia de uso.

Necesita `FIGMA_TOKEN`, un personal access token con scope `file_content:read`. Ese scope anda en plan gratuito. El token va por variable de entorno, nunca en un argumento ni en un archivo del repo.

Cuando ese pull corra, los valores muestreados de las capturas se reemplazan por los del archivo y esta nota se actualiza con la diferencia.

La comparación no es aprobación visual. `PLANV_NUTRIGO_VISUAL` sigue sin setearse.

Marca y copy siguen siendo Plan V. No se copian archivos propietarios del kit ni se inventan fotos de plato.
