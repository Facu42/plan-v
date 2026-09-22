# Ley de fidelidad Nutrigo — Plan V

Fecha: 2026-09-22. **Facundo cerró la discusión: la interfaz va exacta al archivo .fig de Nutrigo, con el copy en español.** Esta nota manda sobre cualquier nota anterior, incluida la versión previa de este mismo archivo, que apartaba la piel del pack hacia pasteles Plan V, lima `#EAFF78` e Inter. Esa desviación queda sin efecto.

## Referencia de composición

Archivo Figma Cloud (Facu importó el pack):

https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard

File key: `OTolnKfsxUFjaZOhhdb04i`

La composición (sidebar, rails, densidad de las once pantallas) sale de ese archivo y del inventario local. El MCP de Figma en Cursor respondió OAuth 403. Esta ley no espera ese MCP y no inventa medidas de frames que no estén ya en el inventario.

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
- radios de card 16–24, navegación en píldora

## Copy

**La interfaz va en español.** El .fig manda en composición, color, tipo y densidad; no en idioma. Ningún rótulo, vacío ni mensaje queda en inglés por copiar el frame. Las cifras y nombres de ejemplo del pack no se copian: los datos son de Plan V.

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
