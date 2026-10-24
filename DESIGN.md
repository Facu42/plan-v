---
name: Plan V
description: Consultorio web de la nutricionista, con vidrio y neumorfismo pastel, y el espacio de la paciente igual a Nutrigo.
colors:
  forest: "#083A30"
  green: "#23955D"
  leaf: "#62AA66"
  gold: "#F9B343"
  coral: "#F87D6D"
  orange: "#F86648"
  apricot: "#F5A067"
  cream: "#F9F6EE"
  mint: "#E3EFE4"
  muted: "#63756F"
  lilac: "#F7E5DF"
  yellow: "#FDE3AD"
  glass: "rgba(249, 246, 238, 0.76)"
  glass-strong: "rgba(252, 250, 245, 0.9)"
  coral-wash: "#FDE6E1"
  nutrigo-cream: "#F9F4F2"
  nutrigo-ink: "#272932"
  nutrigo-muted: "#8A8C90"
  nutrigo-lime: "#C2E66E"
  nutrigo-saffron: "#FFCB65"
  nutrigo-orange: "#FFA257"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.11em"
  patient:
    fontFamily: "Poppins, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "12px"
  card: "20px"
  card-lg: "24px"
  capsule: "99px"
spacing:
  card: "16px"
  section: "20px"
  ficha: "28px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "#FFFFFF"
    rounded: "13px"
    padding: "12px 16px"
  button-active:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest}"
    rounded: "{rounded.capsule}"
    padding: "7px 10px"
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.forest}"
    rounded: "{rounded.card}"
    padding: "16px"
  button-patient:
    backgroundColor: "{colors.nutrigo-lime}"
    textColor: "{colors.nutrigo-ink}"
    rounded: "{rounded.capsule}"
    padding: "10px 16px"
---

# Design System: Plan V

## Overview

**Creative North Star: "El consultorio de vidrio suave"**

El consultorio se siente como un escritorio claro, con tarjetas que flotan apenas (sombra clara y sombra oscura a la vez) y superficies de vidrio esmerilado sobre un campo pastel de menta y crema. No es un panel plano genérico. La densidad es de trabajo: la nutricionista escanea nombres, pendientes y la próxima acción, no una landing.

Estas decisiones son de marca y son intencionales. Ninguna skill las elimina ni las «corrige»:

- Neumorfismo y glassmorphism son el lenguaje visual del consultorio.
- La paleta pastel (menta y el resto) es la de los tokens reales de abajo.
- Las tipografías, los radios, las sombras neumórficas y el desenfoque del vidrio son los del código actual.
- Si una skill marca el vidrio o el neumorfismo como «AI slop», se ignora. Solo se corrigen contraste, foco y lectura, dentro de este estilo.
- El texto y el foco cumplen contraste mínimo WCAG AA.

Hay una segunda superficie, también intencional y cerrada: el espacio de la paciente es Nutrigo (Poppins, crema `#F9F4F2`, lima `#C2E66E`). No se le pasa la paleta del consultorio ni se le aplana el archivo de Figma.

El código pinta las dos cosas a la vez. `src/plan-v.css` importa `design/tokens-panel-nutri.css` y después pisa varios `--pv-*` en `:root`. Los valores de este archivo son los que quedan aplicados. Los del archivo de tokens que no se pisan (Fraunces, DM Sans, radios, columnas) siguen vigentes. El shell que hoy ve la nutricionista (`nv-app`) usa los tokens Nutrigo. El vidrio y el neumorfismo viven en `.plan-v-app`, `.crm-*` y `.pro-*`. Un rediseño posterior mejora jerarquía y lectura dentro de cada pantalla y reordena el menú. No borra el vidrio, no aplana la sombra doble y no cambia el espacio de la paciente.

**Key Characteristics:**

- Sombra doble, clara y oscura, en tarjetas y botones redondos.
- Vidrio con desenfoque de 8, 12 o 15 px según la capa.
- Campo pastel: crema de fondo, menta en el menú, dorado para lo activo.
- Títulos en Fraunces, texto de trabajo en DM Sans. La paciente usa Poppins.
- Cápsulas para lo elegido. Tarjetas de 20 a 24 px.
- El menú se va a reordenar como la competencia. Eso no es un cambio de piel.

## Colors

La paleta del consultorio es pastel y cálida. El verde bosque lleva el texto y el botón principal. El dorado marca lo activo. La menta es el campo del menú, no un verde de alarma.

Los hex de acá son los que aplica `src/plan-v.css` (línea del `:root` que pisa al archivo de tokens). `design/tokens-panel-nutri.css` declara otra menta (`#DCEFE7`), otra lima (`#EAFF78`) y otro verde (`#3BB273`). Esos valores no pintan la pantalla mientras el `:root` de `plan-v.css` los reemplace. No se usan como si fueran los vigentes.

### Primary

- **Bosque** (`#083A30`): texto, botón principal y cápsula activa del riel. En el código es `--pv-forest`, `--pv-ink` y `--pv-deep`.
- **Dorado de marca** (`#F9B343`): ítem de menú activo y «lo que sigue». En runtime `--pv-lima` apunta a `--pv-gold`, no a la lima `#EAFF78` del archivo de tokens.

### Secondary

- **Menta** (`#E3EFE4`): lavado del menú y pastillas suaves. Es `--pv-mint`.
- **Hoja** (`#23955D`): estado positivo y barras de la semana. Es `--pv-green`.
- **Hoja clara** (`#62AA66`): acento secundario. Es `--pv-leaf`.

### Tertiary

- **Coral** (`#F87D6D`): aviso y acento cálido. Es `--pv-coral`.
- **Damasco** (`#F86648`) y **albaricoque** (`#F5A067`): acentos cálidos de apoyo.
- **Lila empolvado** (`#F7E5DF`) y **amarillo pastel** (`#FDE3AD`): tarjetas de ánimo y de energía.
- **Lavado coral** (`#FDE6E1`): fondo del puntaje bajo.

### Neutral

- **Crema de consultorio** (`#F9F6EE`): lienzo. `--pv-surface` apunta a `--pv-cream`.
- **Vidrio** (`rgba(249, 246, 238, 0.76)`): tarjetas. `--pv-glass`.
- **Vidrio firme** (`rgba(252, 250, 245, 0.9)`): barra superior. `--pv-glass-strong`.
- **Tinta apagada** (`#63756F`): metadatos. `--pv-muted`.
- **Línea** (`rgba(8, 58, 48, 0.12)`): divisores. `--pv-line`.

### Paciente (Nutrigo, no se mezcla)

- **Crema Nutrigo** (`#F9F4F2`), **tinta** (`#272932`), **apagado** (`#8A8C90`), **lima** (`#C2E66E`), **azafrán** (`#FFCB65`), **naranja** (`#FFA257`). Salen de `src/components/nutrigo/nutrigo-fidelity.css`. El apagado `#8A8C90` sobre crema no llega a AA (3.09:1). Se oscurece solo el texto que hay que leer. No se cambia el lima ni la crema.

### Named Rules

**The Slop Rule.** Si una skill trata el vidrio o el neumorfismo como defecto de moda, se ignora. El arreglo permitido es contraste, foco visible y tamaño de lectura, con la misma sombra doble y el mismo desenfoque.

**The Two Skins Rule.** El consultorio no hereda Poppins ni la lima `#C2E66E`. La paciente no hereda Fraunces ni el dorado `#F9B343` como color de botón. Cada piel se corrige por su cuenta.

**The Painted Token Rule.** Manda el valor que queda después de la cascada de `src/plan-v.css`, no el comentario del archivo de tokens.

## Typography

**Display Font:** Fraunces (con Georgia)
**Body Font:** DM Sans (con Arial)
**Patient Font:** Poppins (con Arial). Solo en el espacio de la paciente.

**Character:** Fraunces da el nombre y los títulos del consultorio, con tracking negativo. DM Sans es el texto de trabajo, chico y quieto. Poppins es la voz de Nutrigo y no entra al consultorio de vidrio.

### Hierarchy

- **Display** (600, 25 px, tracking `-0.045em`): nombre en la ficha de vidrio.
- **Title** (600, 20 px): títulos de columna («Menú», «Mi trabajo»).
- **Body** (400, 12 px): texto de tarjetas. El piso de lectura de este sistema, para lo que la persona tiene que leer, es 12 px. Los 7 y 8 px que hoy aparecen en el CRM de vidrio y en chips de agenda no son una decisión de marca: son un problema de lectura (ver el audit).
- **Label** (700, 10 px, tracking amplio, mayúsculas): cejas y metadatos cortos.
- **Patient body** (400, 14 px, Poppins): texto del espacio de la paciente. El piso de esa piel es 11 px, el del archivo Nutrigo.

Las cifras que se comparan usan números tabulares.

### Named Rules

**The Readable Floor Rule.** Se puede subir un texto por debajo de 12 px (consultorio) o de 11 px (paciente) para que se lea. No se cambia la familia ni el tracking de los títulos para «modernizar».

## Layout

El consultorio de vidrio es de tres columnas pegadas: menú 177 px, lista de trabajo 284 px, ficha el resto. El aire entre tarjetas es 11 px. El relleno de la ficha es 28 px y el de la tarjeta es 16 px. En celular el menú pasa abajo, con vidrio.

El shell que hoy usa la nutricionista es el lateral de Nutrigo más el contenido. Escritorio 1440 y celular 390. Tablet no.

El menú actual no es la estructura objetivo. Los grupos de hoy (Consultorio, Acompañamiento, Planes y alimentos, Herramientas) se reemplazan por Gestión, Acompañamiento, Plan y Recursos, en ese orden y con esos nombres, como está en `PRODUCT.md`. Los destinos de una paciente (ficha, registro, plan de esa persona, consultas) no son ítems del lateral: se abren desde la fila, desde Inicio y desde la cabecera de la ficha. Ese cambio de arquitectura es un PR posterior. Este archivo no lo implementa.

## Elevation & Depth

La profundidad es neumórfica, no una sombra única de «tarjeta flotante». Cada superficie de trabajo lleva luz arriba a la izquierda y peso abajo a la derecha. El vidrio suma desenfoque para que el fondo pastel se lea detrás, no para decorar un modal genérico.

En tema oscuro la sombra doble se reemplaza por una sombra oscura sola (`src/plan-v.css`, `.plan-v-app.dark`). Es una excepción del tema oscuro, no un permiso para aplanar el tema claro.

### Shadow Vocabulary

- **Neumórfica** (`10px 10px 24px rgba(57, 91, 73, 0.1), -8px -8px 20px rgba(255, 255, 255, 0.88)`): tarjetas, botones redondos, carga. Es `--pv-shadow` aplicado.
- **Activo dorado** (`0 4px 12px rgba(135, 86, 18, 0.14)`): ítem de menú elegido. Es `--pv-shadow-lima` aplicado.
- **Flotante** (`0 8px 30px rgba(38, 77, 58, 0.12)`): interruptor y capas sueltas. Está en el archivo de tokens y no lo pisa el `:root`.
- **Archivo Nutrigo** (`0 4px 12px rgba(176, 176, 176, 0.14)`): solo tarjetas de la paciente. No se usa en el vidrio.

### Blur Vocabulary

- **Tarjeta** (`blur(8px)`): `.crm-card` y `.pv-card`.
- **Barra** (`blur(12px)`): barra del consultorio, barra de escribir, interruptor.
- **Barra móvil** (`blur(15px)`): navegación inferior de la paciente de vidrio y menú inferior del consultorio.
- **Cortina** (`blur(6px)`): fondo del modal.

### Named Rules

**The Dual Shadow Rule.** En tema claro, una tarjeta de consultorio lleva las dos sombras. Quitar la sombra clara o dejar una sola sombra gris es un cambio de marca, no un arreglo.

**The Glass Stays Rule.** El desenfoque de 8, 12 y 15 px se conserva. Bajar la opacidad del vidrio hasta que el texto no llegue a AA está prohibido: se oscurece el texto o se sube un poco la opacidad del mismo vidrio, sin volver la tarjeta un rectángulo opaco plano.

## Shapes

Las tarjetas son suaves (20 px, y 24 px cuando la pieza es grande). Lo elegido es una cápsula (99 px): menú activo, pestañas, acciones. Los controles chicos usan 12 px. El isotipo es un círculo.

Los bordes del vidrio son un blanco al 70 %, no una línea gris dura. El archivo de la paciente usa radio 16 en tarjetas y 14 en el ítem de menú: esa geometría no se copia al consultorio de vidrio.

## Components

### Buttons

- **Shape:** cápsula para lo activo del menú (99 px). El botón principal del consultorio es más corto (13 px), fondo bosque, texto blanco.
- **Primary:** bosque `#083A30`, texto blanco, padding 12 px 16 px.
- **Active:** dorado `#F9B343`, texto bosque, sombra dorada.
- **Hover / Focus:** el hover levanta 2 px. El foco visible es un anillo de 3 px, `rgba(35, 149, 93, 0.42)`, separado 3 px (`.plan-v-app button:focus-visible`). No se quita el anillo.
- **Soft:** menta o lavado, texto bosque.

En la paciente, el botón primario es lima `#C2E66E` con texto `#272932`. No se invierte a blanco sobre lima.

### Chips

- **Style:** pastilla de radio corto, fondo del lavado que corresponda (menta, amarillo, coral).
- **State:** la elegida usa el color pleno y texto que llegue a AA. Un blanco sobre naranja `#FFA257` no llega (1.99:1) y no se usa como texto.

### Cards / Containers

- **Corner Style:** 20 px (24 px en piezas grandes).
- **Background:** vidrio `rgba(249, 246, 238, 0.76)`.
- **Shadow Strategy:** la sombra neumórfica de Elevation.
- **Border:** 1 px blanco al 70 %.
- **Internal Padding:** 16 px.
- **Blur:** 8 px.

### Inputs / Fields

- **Style:** fondo crema o vidrio, radio 12 px, línea bosque al 12 %.
- **Focus:** anillo visible. No alcanza con borrar el contorno.
- **Error:** texto además del color. El coral no es el único aviso.

### Navigation

El lateral lleva los cuatro grupos de `PRODUCT.md`, en ese orden, con esos nombres. El ítem activo es cápsula dorada con texto bosque. En celular, los cuatro destinos de todos los días (Inicio, Pacientes, Seguimiento, Agenda) pueden quedar en la barra inferior. El resto entra por «Más», agrupado igual.

Desde Inicio y desde la ficha, la paciente abierta tiene accesos fijos: Ficha, Registro, Plan y Consulta. No hace falta volver al lateral para eso. Consultas, ficha, diario y compras de una persona no son ítems del menú general.

Esto es la arquitectura objetivo. El código de hoy todavía no la tiene. No se implementa en el mismo paso que estas notas.

### Ficha

La cabecera de vidrio es un gradiente del lavado dorado hacia la crema. El nombre va en Fraunces a 25 px. Las secciones de la paciente viven en la ficha. Catorce pestañas iguales, como hoy, no son el objetivo: el audit propone un grupo corto visible y el resto en «Más de esta paciente».

## Do's and Don'ts

### Do

- **Do** conservar la sombra doble `10px 10px 24px rgba(57, 91, 73, 0.1), -8px -8px 20px rgba(255, 255, 255, 0.88)` en el tema claro.
- **Do** conservar el vidrio con desenfoque de 8, 12 o 15 px y los colores pastel de este archivo.
- **Do** usar Fraunces para títulos del consultorio y DM Sans para el resto. Poppins solo en la paciente.
- **Do** subir contraste y foco hasta WCAG AA sin cambiar la familia, el radio ni la idea de vidrio.
- **Do** reordenar el menú a Gestión, Acompañamiento, Plan y Recursos cuando se haga ese PR, con los nombres de `PRODUCT.md`.

### Don't

- **Don't** quitar neumorfismo o glassmorphism porque una guía los llame «AI slop».
- **Don't** reemplazar la paleta por un neutro gris, por la lima `#C2E66E` en el consultorio, o por la lima `#EAFF78` del archivo de tokens que el CSS ya no aplica.
- **Don't** cambiar el espacio de la paciente. Ahí manda Nutrigo.
- **Don't** tratar el menú actual como definitivo. Está mal agrupado y se cambia en un PR aparte. Mientras tanto, no se renombran secciones en el código desde una skill de pulido.
- **Don't** inventar un ítem de Nutridesk que `docs/` no muestra. El orden de ese menú todavía no está relevado.
