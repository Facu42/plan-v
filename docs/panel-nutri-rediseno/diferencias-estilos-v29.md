# Punto 4: dónde están las diferencias de estilos

Base revisada: main `ebf7ac84`, contra el HTML `design/panel-nutri/v29/panel-trabajo.html`. Evidencia de la revisión #232, tema oscuro. Este documento localiza diferencias calculadas; no declara cada muestra como un error de producto.

## Diferencias concretas para revisar

| Pantalla | Dónde | Boceto | App |
|---|---|---|---|
| Compartidas | Botones de icono y switches | tamaño de texto 13,333 px; relleno vertical 1 px y horizontal 6 px | 12,5 px; relleno 0 |
| Ficha, Historia clínica | Contenedor `div.fx.hcx` | relleno superior 0 | 14 px |
| Ficha, varios botones | Separación icono/texto de `.cbtn.sbtn` | 6 px | 0 |
| Mensajes | Pestaña activa | relleno horizontal 9 px | 6 px |
| Agenda | Tarjetas de la columna derecha | `display: block` | `display: flex` |
| Agenda | Lugares libres, `.slot` | desbordamiento visible | scroll automático |
| Página pública | Fila de horarios `.pubhr` | distribución `space-around` | alineación al inicio |
| Ayuda | Bordes de paneles | #26272D | #2D2F36 |
| Ayuda | Botón `.chip` medido | gris sobre fondo #1C1D22 con borde | texto claro sobre lima oscura, sin ese borde |
| Planes, listado | Altura del botón de fila | 27 px | 26 px |

La cascada global de la app cambia los botones aunque se importen los estilos del boceto. Antes de corregir cada pantalla aisladamente hay que revisar esa herencia. Algunas diferencias de `overflow` pueden ser adaptaciones para listas reales más largas: requieren decisión de diseño, no eliminarlas automáticamente.

## Qué no cuento como defecto confirmado

No cuento como defecto el color distinto de un avatar correspondiente a otra paciente, las cifras o textos de ejemplo, un estado seleccionado distinto ni los márgenes automáticos que cambian con la longitud del contenido. Tampoco cuento las piezas ausentes por datos o estados sin recorrer como errores confirmados. La medición inicial de 62 diferencias se descartó por no cargar Inter en el boceto; el contrato acotado repetido dejó dos casos en ambos temas (turno `.ev.c` ausente en fixture y botón de Planes de 26 frente a 27 px).

Los puntos 1 y 2 (Recetas y Equivalencias) se implementan por separado en esta entrega. El detalle siguiente registra la situación encontrada en main antes de esas correcciones. No se modifican los demás estilos como parte de este pedido.

## Ubicación por pantalla

### Inicio

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.who` | ❌ distinta | **color**: boceto `rgb(110, 113, 122)` · app `rgb(241, 242, 238)` |
| `div.adh` | ❌ distinta | **color**: boceto `rgb(110, 113, 122)` · app `rgb(241, 242, 238)` |
| `div.adh > span.tr` | ❌ distinta | **color**: boceto `rgb(110, 113, 122)` · app `rgb(241, 242, 238)` |
| `div.adh > span.num` | ❌ distinta | **color**: boceto `rgb(110, 113, 122)` · app `rgb(241, 242, 238)` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-inicio-dark.md).

### Pacientes

| Elemento | Estado | Boceto y app |
|---|---|---|
| `tr.open` | ❌ distinta | **backgroundColor**: boceto `rgba(0, 0, 0, 0)` · app `rgb(33, 38, 26)` |
| `svg.chev.i` | ❌ distinta | **display**: boceto `inline` · app `block` |
| `div.goal` | ❌ distinta | **alignItems**: boceto `normal` · app `stretch` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-pacientes-dark.md).

### Agenda

| Elemento | Estado | Boceto y app |
|---|---|---|
| `section.ag > div.cal.card` | ❌ distinta | **alignItems**: boceto `normal` · app `stretch` |
| `div.agside > div.card` | ❌ distinta | **display**: boceto `block` · app `flex` |
| `div.mg > span.has.num` | ❌ distinta | **backgroundColor**: boceto `rgba(0, 0, 0, 0)` · app `rgb(33, 38, 26)` |
| `div.mg > span.num` | ❌ distinta | **color**: boceto `rgb(167, 170, 177)` · app `rgb(110, 113, 122)` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-agenda-dark.md).

### Ficha

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.tagsr > span.tg2` | ❌ distinta | **color**: boceto `rgb(255, 213, 138)` · app `rgb(167, 170, 177)`<br>**backgroundColor**: boceto `rgb(58, 47, 24)` · app `rgb(38, 39, 45)` |
| `div.n > button.sbtn` | ❌ distinta | **display**: boceto `block` · app `flex`<br>**columnGap**: boceto `normal` · app `0px`<br>**rowGap**: boceto `normal` · app `0px`<br>**alignItems**: boceto `normal` · app `center`<br>**justifyContent**: boceto `normal` · app `center` |
| `span.p-conf.pill` | ❌ distinta | **backgroundColor**: boceto `rgb(42, 50, 27)` · app `rgba(0, 0, 0, 0)`<br>**paddingTop**: boceto `3px` · app `0px`<br>**paddingLeft**: boceto `8px` · app `0px` |
| `div.tagsr > span.tg2` | ❌ distinta | **color**: boceto `rgb(255, 213, 138)` · app `rgb(167, 170, 177)`<br>**backgroundColor**: boceto `rgb(58, 47, 24)` · app `rgb(38, 39, 45)` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-ficha-dark.md).

### Cobranzas

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.c > section.fxp.g` | ❌ distinta | **overflow**: boceto `visible` · app `hidden` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-cobranzas-dark.md).

### Mensajes

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.tabs > button.on` | ❌ distinta | **paddingLeft**: boceto `9px` · app `6px` |
| `div.c.mside > section.fxp.g` | ❌ distinta | **overflow**: boceto `visible` · app `hidden` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-mensajes-dark.md).

### Planes

| Elemento | Estado | Boceto y app |
|---|---|---|
| `.app div.top` | ❌ distinta | **columnGap**: boceto `14px` · app `16px`<br>**rowGap**: boceto `14px` · app `16px` |
| `div.tabs` | ❌ distinta | **backgroundColor**: boceto `rgb(28, 29, 34)` · app `rgb(20, 21, 25)`<br>**borderTopLeftRadius**: boceto `14px` · app `9px`<br>**paddingTop**: boceto `5px` · app `2px`<br>**paddingLeft**: boceto `5px` · app `2px`<br>**columnGap**: boceto `5px` · app `4px`<br>**overflow**: boceto `auto` · app `visible`<br>**rowGap**: boceto `5px` · app `4px`<br>**alignItems**: boceto `center` · app `normal` |
| `div.tabs > button.on` | ❌ distinta | **fontSize**: boceto `12.5px` · app `11.5px`<br>**backgroundColor**: boceto `rgb(42, 50, 27)` · app `rgb(28, 29, 34)`<br>**borderTopLeftRadius**: boceto `10px` · app `7px`<br>**paddingTop**: boceto `8px` · app `6px`<br>**paddingLeft**: boceto `15px` · app `9px` |
| `button.sbtn` | ❌ distinta | **display**: boceto `inline-block` · app `inline-flex`<br>**columnGap**: boceto `normal` · app `0px`<br>**rowGap**: boceto `normal` · app `0px`<br>**alignItems**: boceto `normal` · app `center`<br>**justifyContent**: boceto `normal` · app `center` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-planes-dark.md).

### Publica

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.c > section.fxp.g` | ❌ distinta | **overflow**: boceto `visible` · app `hidden` |
| `span.t` | ❌ distinta | **columnGap**: boceto `2px` · app `normal`<br>**rowGap**: boceto `2px` · app `normal` |
| `div.c > section.fxp.g.pubprev` | ❌ distinta | **overflow**: boceto `visible` · app `hidden` |
| `div.c > section.fxp.g` | ❌ distinta | **overflow**: boceto `visible` · app `hidden` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-publica-dark.md).

### Equipo

| Elemento | Estado | Boceto y app |
|---|---|---|
| `.app div.top > div.tabs` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |
| `div.fx` | ❌ distinta | **paddingTop**: boceto `0px` · app `14px` |
| `div.fx > div.c` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |
| `.app div.top > div.tabs` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-equipo-dark.md).

### Ajustes

| Elemento | Estado | Boceto y app |
|---|---|---|
| `.app div.top > div.tabs` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |
| `div.fx > div.c` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |
| `button.sw[aria-checked="true"]` | ❌ distinta | **fontSize**: boceto `13.3333px` · app `12.5px`<br>**color**: boceto `rgb(255, 255, 255)` · app `rgb(241, 242, 238)`<br>**paddingTop**: boceto `1px` · app `0px`<br>**paddingLeft**: boceto `6px` · app `0px` |
| `button.sw[aria-checked="false"]` | ❌ distinta | **fontSize**: boceto `13.3333px` · app `12.5px`<br>**color**: boceto `rgb(255, 255, 255)` · app `rgb(241, 242, 238)`<br>**paddingTop**: boceto `1px` · app `0px`<br>**paddingLeft**: boceto `6px` · app `0px` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-ajustes-dark.md).

### Seguimiento

El muestreo solo detectó diferencias compartidas de iconos o dependientes del contenido; no se confirma otro defecto específico con esa evidencia.

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-seguimiento-dark.md).

### Progreso

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.fxr > button.l` | ❌ distinta | **backgroundColor**: boceto `rgba(0, 0, 0, 0)` · app `rgb(42, 50, 27)` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-progreso-dark.md).

### Asistente

El muestreo solo detectó diferencias compartidas de iconos o dependientes del contenido; no se confirma otro defecto específico con esa evidencia.

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-asistente-dark.md).

### Alimentos

| Elemento | Estado | Boceto y app |
|---|---|---|
| `section.fxp > div.tabs` | ❌ distinta | **overflow**: boceto `visible` · app `auto` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-alimentos-dark.md).

### Biblioteca

El muestreo solo detectó diferencias compartidas de iconos o dependientes del contenido; no se confirma otro defecto específico con esa evidencia.

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-biblioteca-dark.md).

### Ayuda

| Elemento | Estado | Boceto y app |
|---|---|---|
| `div.c > section.fxp.g` | ❌ distinta | **borderTopColor**: boceto `rgb(38, 39, 45)` · app `rgb(45, 47, 54)` |
| `div.c > section.fxp` | ❌ distinta | **borderTopColor**: boceto `rgb(38, 39, 45)` · app `rgb(45, 47, 54)` |
| `button.chip` | ❌ distinta | **color**: boceto `rgb(167, 170, 177)` · app `rgb(241, 242, 238)`<br>**backgroundColor**: boceto `rgb(28, 29, 34)` · app `rgb(42, 50, 27)`<br>**borderTopColor**: boceto `rgb(46, 48, 54)` · app `rgba(0, 0, 0, 0)` |

[Todos los selectores medidos](https://github.com/Facu42/plan-v/blob/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29/clases-ayuda-dark.md).
