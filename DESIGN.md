---
name: Plan V
description: Consultorio de la nutricionista y espacio de la paciente, los dos con la piel Nutrigo.
colors:
  cream: "#F9F4F2"
  ink: "#272932"
  ink-soft: "#3E4046"
  muted: "#52545B"
  gray-file: "#8A8C90"
  lime: "#C2E66E"
  saffron: "#FFCB65"
  orange: "#FFA257"
  card: "#FFFFFF"
  line: "#E1E1E2"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Poppins, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Plus Jakarta Sans, Poppins, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Plus Jakarta Sans, Poppins, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
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
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    padding: "10px 16px"
  button-active:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-lg}"
    padding: "20px"
---

# Design System: Plan V

## Overview

**Creative North Star: "El mismo consultorio, la misma piel"**

La nutricionista y la paciente usan la piel Nutrigo. Lienzo crema, tarjetas blancas amplias, menú lateral oscuro con la tinta del sistema y el ítem activo en lima. Mucho aire. Los números importantes son grandes. Los estados son pastillas pastel, no cuatro tarjetas iguales.

Decisión de Facundo del 18/10/2026. Reemplaza la regla de dos pieles. Una skill no vuelve a separar el consultorio en vidrio y la paciente en Nutrigo.

- El consultorio usa Plus Jakarta Sans. La app de la paciente sigue en Poppins, igual al archivo.
- Una sola paleta: la de `src/components/nutrigo/nutrigo-fidelity.css` y `design/figma-reference`.
- El texto y el foco cumplen contraste WCAG AA. Si un gris del archivo no llega, se oscurece solo el texto.
- La app de la paciente sigue igual al archivo Nutrigo. El arreglo de contraste del consultorio vive en `.nv-pro` y no pisa los tokens de la paciente.
- El vidrio y el neumorfismo de `src/plan-v.css` quedan en pantallas viejas que esta fase no redibuja. No son la piel del panel.

**Key Characteristics:**

- Lienzo crema `#F9F4F2`. Tarjetas blancas de radio 24.
- Menú tinta `#272932`, flotante, radio 28, ítem activo lima `#C2E66E`.
- Azafrán `#FFCB65` para avisos y «próximamente». Naranja `#FFA257` solo de fondo, con texto tinta.
- Plus Jakarta Sans en el panel: títulos grandes y livianos, texto chico y limpio. La paciente sigue en Poppins. Números tabulares. Piso de lectura 12 px.
- Cápsulas para lo elegido. Pastillas pastel para estados y KPIs.

## Colors

Una paleta para las dos apps. Los hex salen de `src/components/nutrigo/nutrigo-fidelity.css`. El panel de la nutricionista los aplica en `.nv-pro` (`src/components/nutrigo/pro-shell.css`).

### Primary

- **Tinta** (`#272932`): texto, menú lateral y foco. En el archivo es `--nv-ink`.
- **Lima** (`#C2E66E`): ítem activo, botón principal y pastilla de «hoy». Texto siempre tinta, nunca blanco.

### Secondary

- **Azafrán** (`#FFCB65`): «próximamente», contadores y el acceso al asistente. Texto tinta.
- **Naranja** (`#FFA257`): fondo de aviso. El blanco encima no llega a AA (cerca de 2:1). El texto va en tinta.

### Neutral

- **Crema** (`#F9F4F2`): lienzo. `--nv-bg`. No se cambia.
- **Tarjeta** (`#FFFFFF`): bloques de trabajo. Sombra del archivo `0 4px 12px rgba(176, 176, 176, 0.14)`.
- **Línea** (`#E1E1E2`): bordes de controles.
- **Gris del archivo** (`#8A8C90`): está en el archivo como `--nv-muted`. Sobre crema da cerca de 3:1 y no se usa para texto que hay que leer.
- **Texto secundario del panel** (`#52545B`): reemplaza ese gris solo dentro de `.nv-pro`. Sobre crema queda cerca de 7:1. El cuerpo secundario usa `#3E4046`.
- **Etiquetas del menú oscuro** (`#D5D6D8` sobre `#272932`): pasan AA.

### Named Rules

**The One Skin Rule.** El consultorio y la app de la paciente comparten crema, tinta, lima, azafrán y naranja. La tipografía del panel es Plus Jakarta Sans; la de la paciente sigue siendo Poppins. No se vuelve a una piel de vidrio para la nutricionista.

**The Patient File Rule.** La app de la paciente sigue igual al archivo Nutrigo, incluso el gris `#8A8C90` donde el archivo lo dibuja. El oscurecido del texto es solo del panel (`.nv-pro`).

**The Contrast Rule.** Si un color del archivo no llega a AA, se oscurece el texto. No se cambia la lima ni la crema.

## Typography

**Font del panel:** Plus Jakarta Sans. Es la gratuita de Google más cercana a Gilroy: geométrica, con la o redonda, el mismo aire abierto y pesos de 400 a 600 para títulos grandes y livianos. Urbanist es un poco más estrecha y Outfit más compacta. La app de la paciente no cambia: sigue en Poppins, como el archivo Nutrigo.

**Character:** títulos grandes en peso 500, con tracking negativo. El texto de trabajo es 14 px. Nada que la persona tenga que leer baja de 12 px en el panel.

### Hierarchy

- **Display** (500, 36 px): nombre en la ficha, en dos líneas.
- **KPI** (500, 28–40 px): cifras de Inicio y de la ficha.
- **Title** (500, 20 px): títulos de bloque.
- **Body** (400, 14 px): texto de tarjetas.
- **Label** (600, 12 px): grupos del menú, metadatos, pastillas. Es el piso.

Las cifras usan separador de miles de Argentina y números tabulares.

### Named Rules

**The Readable Floor Rule.** En el panel, 12 px es el mínimo. En la app de la paciente se respeta el archivo (piso 11 px) y no se «corrige» desde el panel.

## Layout

Escritorio 1440 y celular 390. Tablet no.

En escritorio el menú es una barra oscura flotante, de 248 px, con radio 28. Arriba hay un buscador en píldora, con filtros (Pacientes, Planes, Registros, Consultas), la paciente elegida y botones redondos de cuenta, avisos y ajustes. El contenido ocupa todo el ancho. La ficha va en dos columnas: una angosta con la persona y otra ancha con la consulta. No hay una columna fija repetida a la derecha. En Inicio el asistente es una tarjeta oscura flotante.

En celular el menú lateral se va. Abajo quedan Inicio, Pacientes, Seguimiento, Agenda y Más. Más abre los mismos cuatro grupos.

Los destinos de una persona no son ítems del lateral. Se abren desde la fila de Pacientes, desde Inicio y desde el panel derecho. La paciente abierta se recuerda en la dirección al cambiar de sección.

## Elevation & Depth

La profundidad es la sombra corta del archivo Nutrigo, no una sombra doble ni vidrio.

- **Tarjeta** (`0 4px 12px rgba(176, 176, 176, 0.14)`).
- **Menú** (`0 18px 40px rgba(39, 41, 50, 0.18)`): el lateral flota sobre la crema.

El desenfoque de vidrio no entra en el panel. Las entradas animadas usan solo opacidad y transform.

## Shapes

En el panel, las tarjetas van a 22 px, con fondo gris-crema `#F4F0EC` y un borde casi invisible. El menú sigue a 28 px. El ítem activo del menú y los botones son cápsula. Las pestañas de la ficha se subrayan. La app de la paciente no cambia de forma.

## Components

### Buttons

- **Primary:** lima `#C2E66E`, texto tinta.
- **Soft:** crema o gris muy claro, texto tinta.
- **Hover / press:** el press escala a 0.98 en 160 ms. El foco es un anillo de 2 px, lima en el menú y tinta en el contenido, separado 3 px.
- Un control apagado explica por qué. No queda un botón mudo.

### Chips

Pastilla pastel (lima lavada `#EDFFC4`, azafrán lavado `#FFEDC9`, durazno `#FFF2E8`) con texto tinta de al menos 12 px.

### Cards / Containers

En el panel, fondo `#F4F0EC`, radio 22 y borde casi invisible. Sin blur. La app de la paciente conserva las tarjetas del archivo.

### Inputs / Fields

Fondo blanco, radio 12, línea `#E1E1E2`, alto mínimo 44. El foco se ve.

### Navigation

Cuatro grupos, en este orden: Gestión (Inicio, Pacientes, Agenda, Cobranzas, Página pública), Acompañamiento (Asistente IA, Seguimiento, Mensajes, Progreso), Plan (Planes, Alimentos, Recetas, Equivalencias, Modelos, Ejercicio), Recursos (Biblioteca, Centro de ayuda).

Cada ítem es un enlace real. Página pública se muestra como «próximamente» y abre una pantalla que lo dice. El Panel del servicio no entra en este menú. La configuración queda en la cuenta.

### Ficha

Cuatro pestañas fijas: Resumen, Registro, Plan, Consultas. El resto (historia, evolución, notas, plan semanal, compras, chat, archivos, laboratorio, planificación y cobros) vive en «Más de esta paciente». El nombre largo se corta y el título completo queda en el tooltip.

## Do's and Don'ts

### Do

- **Do** usar crema `#F9F4F2`, tinta `#272932`, lima `#C2E66E`, azafrán `#FFCB65` y naranja `#FFA257` en el panel y en la app de la paciente. En el panel, Plus Jakarta Sans. En la paciente, Poppins.
- **Do** oscurecer a `#52545B` o `#3E4046` el texto del panel que hoy usa `#8A8C90`.
- **Do** dejar el menú en tinta y el ítem activo en lima.
- **Do** mantener los enlaces y las rutas que ya existen. Lo que no existe se dice «próximamente».
- **Do** animar en 150–400 ms, con una curva suave, solo opacidad y transform. Con menos movimiento, la animación es más corta, no se apaga.

### Don't

- **Don't** volver a dos pieles, ni a Fraunces, ni al vidrio, para el panel de la nutricionista.
- **Don't** cambiar la lima ni la crema para «arreglar» contraste.
- **Don't** tocar la app de la paciente para que el panel se vea mejor.
- **Don't** esconder archivar, invitar, editar o escribir: si no están en la fila principal, siguen a un clic, con su nombre.
- **Don't** inventar un ítem de Nutridesk que `docs/` no muestra.
