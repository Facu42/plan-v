# Ley de fidelidad Nutrigo — Plan V

Fecha: 2026-09-22. **Facundo cerró la discusión: la interfaz va exacta al archivo .fig de Nutrigo, con el copy en español.** Esta nota manda sobre cualquier nota anterior, incluida la versión previa de este mismo archivo, que apartaba la piel del pack hacia pasteles Plan V, lima `#EAFF78` e Inter. Esa desviación queda sin efecto.

## Referencia de composición

Archivo Figma Cloud (Facu importó el pack):

https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard

File key: `OTolnKfsxUFjaZOhhdb04i`

La composición (sidebar, rails, densidad de las once pantallas) sale de ese archivo y del inventario local. El MCP de Figma en Cursor respondió OAuth 403. Esta ley no espera ese MCP y no inventa medidas de frames que no estén ya en el inventario.

## Piel

Color: la paleta del pack, **no** pasteles Plan V. Los valores de abajo están muestreados pixel a pixel de las capturas en `design/nutrigo-exports/`, no estimados a ojo ni traídos del kit de marca.

| Token | Hex | Uso en el .fig |
|---|---|---|
| `--nv-bg` | `#F9F4F2` | lienzo de página, blanco cálido |
| `--nv-card` | `#FFFFFF` | cards |
| `--nv-border` | `#EEEEEF` | bordes, tracks de barra |
| `--nv-track` | `#F6F6F7` | relleno sutil, campos |
| `--nv-ink` | `#272932` | texto principal, carbón (no verde bosque) |
| `--nv-muted` | `#8F9195` | texto secundario, nav inactiva |
| `--nv-accent` | `#C2E66E` | verde lima del pack: ítem activo, CTA primaria |
| `--nv-accent-soft` | `#DFF9A2` | lima claro, fondos de estado positivo |
| `--nv-gold` | `#FFCB65` | ámbar: carbohidratos, energía, progreso |
| `--nv-coral` | `#FFA257` | naranja: proteínas, alertas, series intensas |

El dorado `#F9B343` del isotipo Plan V no es token de interfaz. La lima `#EAFF78` de Plan V tampoco: el verde activo del pack es `#C2E66E`.

Tipo: **Poppins**, la cara del pack, ya instalada vía `@fontsource/poppins` (OFL-1.1, subset latino, sin pedidos a Google Fonts). Jerarquía 400 cuerpo / 500 etiquetas / 600 títulos / 700 ítem activo. Inter y Fraunces quedan fuera de esta superficie.

Radios de card ~16–24, sombra suave, navegación en píldora, aire.

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
