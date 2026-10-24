# Traspaso: el boceto único del panel de la nutri

Escrito el 23/10/2026 por Claude (hilo «Rediseño del panel de la nutri») porque Facundo pidió:
«Necesito que dejes todo el plan de cómo venís trabajando y cómo debería seguir trabajando otro agente».
Si vas a seguir este trabajo, leé este archivo entero antes de tocar nada. Complementa a [plan.md](plan.md)
y a [instrucciones-boceto.md](instrucciones-boceto.md); donde choquen, manda este (es lo más nuevo).

## 1. En cinco líneas

1. Desde el 20/10 el panel de la nutri tiene **un estilo nuevo** («medspa»: fondo claro, tarjetas pastel, una
   tarjeta negra que resalta, letra chica y fina, mucha información) y se diseña en **un solo boceto navegable**.
2. El boceto está publicado en **https://claude.ai/artifact/JwXZXARtS7e6scYcpx8cKV** (versión 16) y sus fuentes
   están en [`design/panel-nutri/v3/`](../../design/panel-nutri/v3/). Siempre se trabaja sobre ese link, nunca uno nuevo.
3. Hechas: Inicio, Pacientes, Agenda, Ficha (10 pestañas), Cobranzas, Mensajes y Planes. Faltan
   **Página pública, Equipo y Ajustes**, en ese orden.
4. Todo lo que se ve funciona (cada botón abre un panel, cambia la pantalla, descarga algo o avisa), entra en
   **1440×900 sin bajar la página**, en claro y en oscuro.
5. Recién cuando el boceto esté completo y Facundo lo apruebe, se pasa a la app **tal cual**, por fases y con
   su ok para juntar cada una a `main` (sección 7).

## 2. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Boceto publicado (lo que mira Facundo, desde el celular) | https://claude.ai/artifact/JwXZXARtS7e6scYcpx8cKV |
| Boceto armado (el mismo HTML, 620 KB) | `design/panel-nutri/v3/panel.html` |
| Base: armazón, Inicio, Pacientes, Agenda y Ficha | `design/panel-nutri/v3/src/base.html` |
| Piezas que se suman encima | `design/panel-nutri/v3/src/*.js`, `*.css`, `*.json` (tabla de abajo) |
| Script que arma `panel.html` | `design/panel-nutri/v3/build.py` |
| Pruebas automáticas del boceto | `design/panel-nutri/v3/tests/*.mjs` |
| Boceto viejo (estilo anterior, 19/10) | `design/panel-nutri/bocetos.html`. Sigue siendo la referencia de la app hasta que Facundo apruebe el nuevo |
| Informe de la ficha contra la competencia | https://claude.ai/artifact/WNPsKxv6yBMZkZLCuTLXVD |
| Bocetos anteriores del Inicio (historia, no se usan) | https://claude.ai/artifact/MkMv7F2tvzGh5WAbkK1HJ7, https://claude.ai/artifact/GhxLJQJ8idKgEM4aBDLjtF, https://claude.ai/artifact/9HPmV1GW4i8muirVuqCwNR |

Las piezas de `src/`:

| Archivo | Qué tiene |
|---|---|
| `fx.js`, `fx.css` | Ayudantes de dibujo que usan todas las pantallas: tarjetas (`fxP`), curvas, columnas, barras, filas, línea de tiempo, pares dato/valor, la tarjeta oscura (`fxDk`) y la entrada animada (`fxAnim`). También las 10 pestañas de la ficha |
| `cob.js`, `cob.css` | Cobranzas |
| `act.js`, `act.css` | Lo que hace funcionar los botones: el panel lateral (`aOpen`), campos de formulario (`aF`, `aI`, `aS`, `aT`, `aSeg`, `aCh`, `aCk`, `aRow`), el aviso de abajo (`toast`), la descarga de planillas (`aCSV`) y la tabla `ACT`, que dice qué hace cada botón de Inicio, Pacientes, Agenda, Ficha y Cobranzas |
| `imp.css` | Pasada de pulido (ver sección 5) |
| `msg.js`, `msg.css` | Mensajes: bandeja, respuestas guardadas y avisos automáticos |
| `pl.js`, `pl.css` | Planes: todos los planes, plan de una paciente, recetas, plantillas y equivalencias |
| `nt.js`, `pub.js`, `eq.js`, `aj.js`, `hc.js`, `ia.js`, `pe.js`, `mob.js` (y sus `.css`) | Funciones de Nutreando (hilo Nutreando): encabezado de la ficha y campana, Página pública, Equipo, Ajustes, Historia clínica y Laboratorio con fechas y propuestas de la consulta grabada (`hc.js`), armado del plan con IA (`ia.js`), editor del plan por día como Nutreando con columna derecha de gestión (`pe.js`, prueba `tests/pet.mjs`), y versión celular. Se enganchan en el bloque «nt» de `build.py`. Pruebas: `tests/ntscr.mjs` y `tests/mobt.mjs` |
| `mph.json`, `rcimg.json` | Fotos reales en texto (las del chat y las de recetas), sacadas de `src/assets/showroom/` y `public/landing/` |

## 3. Decisiones de Facundo que no se discuten

| Fecha | Decisión |
|---|---|
| 18/10 | Rediseñar el panel con **todas** las funciones de Plan V, como producto premium, con el logo de Plan V visible. Nada de estética de IA. Menú lateral ancho y plegable con flecha en un círculo y submenús. En Pacientes, el resumen se despliega hacia abajo en la misma lista. Planes con selector de paciente. Movimiento de 200 a 300 ms y, con «reducir movimiento», nada que se mueva. |
| 19/10 | Todo lo que se ve tiene que funcionar. Sin huecos vacíos. Sin tener que bajar para ver la parte de abajo. |
| 20 y 21/10 | Rechazó todos los Inicios anteriores. **Estilo nuevo**: el dashboard «medspa» (fondo claro, tarjetas pastel y una negra que resalta, letra chica y fina, mucha información, muy estético), pensado como software profesional para nutricionistas, con los colores de Plan V (lima y azafrán suavizados). Tema claro y oscuro con botón. |
| 21/10 16:40 | Inicio reacomodado: arriba Pendientes (con «Buenas noticias» adentro y filtro «Felicitar»), Necesitan atención y la tarjeta oscura que muestra lo que se toca; en el medio Consultas de hoy; abajo los cinco números. Los avisos automáticos se configuran fuera del Inicio. Sin la franja amarilla. |
| 21/10 | La ficha del boceto viejo no alcanzaba. Se investigó la competencia (NutriDesk y Nutriboost) y quedó en **10 pestañas sin repetidos**. |
| 22/10 | **Un solo boceto**: se sigue en el link de la sección 1, no en la copia que se armó en su computadora. Orden: Planes, Página pública, Equipo, Ajustes. |
| Siempre | **Nada de WhatsApp en el panel.** Los avisos a pacientes van por la app y por mail. |
| Siempre | Respuestas a Facundo en español simple, con voseo, sin jerga ni nombres de archivos o variables. Él mira desde el celular: todo se le entrega como link de Artifact. |

## 4. Estado de cada pantalla (versión 26, 24/10)

| Pantalla | Estado | Qué tiene |
|---|---|---|
| Inicio | Hecha | Pendientes con «Buenas noticias», Necesitan atención, tarjeta oscura de detalle, Consultas de hoy, cinco números |
| Pacientes | Hecha | Tabla con filtros y el resumen que se despliega hacia abajo con accesos a la ficha |
| Agenda | Hecha | Semana, turnos, bloqueos, recordatorios por la app |
| Ficha | Hecha | 10 pestañas: Resumen, Historia clínica, Mediciones, Objetivos y hábitos, Consultas y notas, Plan, Registro alimentario, Laboratorio y estudios, Archivos y Cobros. v23: Historia clínica por temas con fecha y origen de cada dato, propuestas de la consulta grabada y «cómo estaba» en una fecha; Laboratorio con columnas por fecha y marcas de la historia |
| Cobranzas | Hecha | Mes, trimestre y año, movimientos, cuotas vencidas, exportar planilla |
| Mensajes | Hecha | Bandeja de 3 columnas (lista, chat con fotos, audios y archivos, ficha corta), respuestas guardadas, avisos automáticos, mensaje a varias |
| Planes | Hecha | Todos los planes; plan de una paciente con selector, semana editable, lista de compras, indicaciones, versiones y cuatro maneras de empezar; recetas con fotos; 10 plantillas; equivalencias. Nada le llega a la paciente hasta publicar. v24: «Armar con IA» (pedido con palabras y opciones, lo que toma de la ficha, porqué de cada comida, asistente con cambios en una frase, control antes de publicar) |
| Página pública | Hecha (v20) | Mi página (perfil, dónde atiende, obras sociales, opiniones, vista de la paciente, QR, links por servicio, números del mes), Servicios (precios, obras sociales, descuentos, reglas) y Reservas en línea (reglas, horarios, confirmación y recordatorio por app y mail) |
| Equipo | Hecha (v21) | Integrantes con roles y sesiones, Permisos por módulo que se tocan (la ficha clínica solo para nutris) y Registro de accesos con descarga |
| Ajustes | Hecha (v21) | Mi cuenta, Plantillas (formularios y certificados), Avisos automáticos (usa los mismos datos que Mensajes), Seguridad e Integraciones. Planilla por obra social desde Exportar en Cobranzas |
| Celular | Hecha (v22) | Todo el boceto a 390: barra arriba, cinco accesos abajo, menú completo en cajón, paneles que suben desde abajo; entra solo debajo de 760 de ancho o con el botón «Celular». Tablet no se dibujó |

Descargas que funcionan de verdad: planillas de Cobranzas y listas (CSV), plan de la paciente y lista de compras
(texto). Usan la función de descargas del Artifact, que ya está declarada en el link.

## 5. Reglas de diseño del boceto

- **Entra en 1440×900 sin bajar la página.** Las listas largas se desplazan dentro de su tarjeta.
- **Sin huecos.** Si sobra lugar en una columna, va un bloque útil (no relleno decorativo).
- **Cada botón hace algo**: abre el panel lateral con un formulario real, cambia la pantalla, descarga, o muestra
  un aviso que dice qué pasó. Nunca un botón muerto.
- **Pulido (`imp.css`)**: sin bordes de color a la izquierda, sin tarjetas dentro de tarjetas, sin brillos ni
  sombras que levantan, estados escritos en texto, filas separadas por una línea fina, números alineados.
- **Fotos reales** de los archivos del repo, nunca generadas para pantallas con texto.
- **Textos** cortos, con voseo, con datos de ejemplo creíbles de Argentina. Un solo botón principal por fila.
- **Movimiento**: el boceto usa GSAP desde cdnjs solo para entradas suaves y funciona sin él. En la app vale la
  decisión del 18/10 (sin GSAP): el mismo movimiento se hace con CSS. Con «reducir movimiento», nada se mueve.

## 6. Cómo trabajo sobre el boceto

### 6.1 Armar

```
python3 design/panel-nutri/v3/build.py      # escribe design/panel-nutri/v3/panel.html
```

`build.py` toma `src/base.html` y le suma, en orden: los estilos de `src/*.css` antes del último `</style>`,
`fx.js` y `cob.js` antes de `const FTABS2=`, y al final del último `<script>` `act.js`, las fotos, `msg.js` y
`pl.js`. También inserta el HTML de cada pantalla nueva antes de `<div class="scr" id="s-ficha" hidden>`, conecta
el menú (`data-go`) y los botones de arriba, y suma la pantalla a la lista que se abre desde la dirección
(`#planes`, `#mensajes`...). Cada reemplazo tiene un `assert`: si el texto que busca cambió, se corta en vez de
armar algo roto. **No edites `panel.html` a mano**: se pisa con el próximo armado.

### 6.2 Sumar una pantalla (receta usada en Mensajes y Planes)

1. Crear `src/xx.js` y `src/xx.css`. Los datos de ejemplo van arriba del JS, como constantes.
2. Dibujar con los ayudantes de `fx.js` y las clases `.fx`, `.fxp`, `.c` (columnas), para que se vea igual que el resto.
3. Un único escuchador de clics por pantalla (delegado en su contenedor) y una tabla de acciones
   (`MACT` en Mensajes, `PA` en Planes) que dice qué hace cada botón.
4. Sumar el selector de la pantalla a la lista que saltea el escuchador general de `act.js`
   (`#actw,#s-mensajes,#s-planes,...`); si no, el botón hace dos cosas.
5. Envolver `go()` para que al entrar se dibuje y se anime (`const _g=go;go=function(id){_g(id);if(id==='xx')...}`).
6. Al final del JS: `if(location.hash==='#xx')go('xx')`, para que abra directo y el submenú quede abierto.
7. En `build.py`: sumar el CSS a la lista, el JS al final, el HTML de la pantalla, el `data-go` del menú, el botón
   de arriba y la pantalla en la lista de direcciones.
8. Armar, probar (6.3), mirar las capturas y publicar (6.4).

### 6.3 Probar

Una vez por sesión, GSAP local para que las pruebas no dependan de internet:

```
cd design/panel-nutri/v3/tests && mkdir -p .gsap && npm pack gsap@3.12.5 && tar -xzf gsap-3.12.5.tgz -C .gsap && rm gsap-3.12.5.tgz
```

Después, desde la raíz del repo (usa el Playwright del proyecto):

```
NODE_PATH=$PWD/node_modules node design/panel-nutri/v3/tests/plt.mjs
```

| Prueba | Qué mira |
|---|---|
| `acts.mjs` | Toca los 194 botones de Inicio, Pacientes, Agenda, Cobranzas y las 10 pestañas de la ficha; cada uno tiene que abrir un panel, avisar o cambiar algo |
| `mact.mjs`, `pact.mjs` | Lo mismo para Mensajes (36 acciones) y Planes (unas 60) |
| `msgt.mjs`, `plt.mjs`, `plt2.mjs`, `cobt.mjs`, `fxt.mjs` | Que cada vista mida 900 de alto en claro y oscuro y que nada se corte. Solo pueden desplazarse por dentro las listas largas (aparecen como `scroll:`) |

Todas tienen que terminar con `errors []`. Las que miden dejan capturas `.png` en la carpeta desde donde se
corren: miralas y borralas antes de guardar. Además se sacan capturas a 1440×900 en claro y oscuro y **se miran**:
el porcentaje no alcanza.

### 6.4 Publicar

Se publica `panel.html` con la herramienta de Artifact **al mismo link** (`url` de la sección 1), sin pasar
`capabilities` (así conserva la de descargas). Nunca un link nuevo. Cada publicación es una versión nueva
(la 16 es la del 23/10). Después de publicar, se guardan las fuentes en esta carpeta del repo con un commit:
la carpeta de trabajo de cada sesión se borra.

## 7. Qué sigue, en orden

1. **Página pública** en el boceto: perfil de la nutri, servicios y precios que ella define, turnos para reservar,
   lo que ve una paciente nueva. Mirar lo que ya existe en la app (`PanelPublicPage.tsx`) para no inventar funciones.
2. **Equipo**: personas del consultorio, permisos, invitaciones (la app ya tiene equipo, de Codex).
3. **Ajustes**: datos de la cuenta, servicio de Plan V, avisos automáticos, tema, seguridad (verificación en dos pasos).
4. Preguntarle a Facundo si entran pantallas que el boceto viejo tenía y el nuevo no: Asistente IA, Seguimiento,
   Progreso, Alimentos, Biblioteca y Centro de ayuda.
5. **Celular** (390) del boceto nuevo.
6. Con el ok de Facundo al boceto completo: **pasarlo a la app** con el método de
   [instrucciones-boceto.md](instrucciones-boceto.md) (HTML y estilos tal cual, solo se conectan datos reales),
   cambiando la fuente: `design/panel-nutri/v3/panel.html` en vez de `bocetos.html`. Eso implica:
   - que `scripts/panel-boceto-css.mjs` y `scripts/panel-nutri-boceto-contrato.mjs` lean el boceto nuevo;
   - rehacer el armazón de la fase A (#162) con el menú y el encabezado nuevos;
   - después las pantallas, una fase por PR (Inicio, Pacientes, Ficha, Agenda y Cobranzas, Mensajes, Planes,
     Página pública, Equipo y Ajustes), cada una con `npm run panel:contrato` en verde y **el ok de Facundo para
     juntarla a `main`**;
   - nada de la base de producción sin su frase escrita; los avisos siguen sin WhatsApp.

## 8. Lo que espera el ok de Facundo

- Que el boceto nuevo reemplace a `bocetos.html` como referencia de la app.
- El Inicio reacomodado del 21/10 y la ficha de 10 pestañas (ya están en el boceto; no los rechazó, tampoco los aprobó por escrito).
- Cada fase de la app antes de juntarla a `main`.

## 9. Trampas conocidas

- **Hay otra copia del boceto en su computadora** (una sesión que corre ahí armó versiones propias de Mensajes y
  Planes y propuso Configuración). Facundo eligió este link el 22/10. No mezclar ni copiar de esa versión sin que él lo pida.
- El boceto todavía tiene datos de ejemplo: en la app, sin dato, cada bloque muestra cero o un texto corto; nunca se oculta.
- Las fotos van embebidas en `mph.json` y `rcimg.json`: si se cambian, se vuelven a generar desde las imágenes del repo.
- Si un selector de prueba choca con otro de la página (pasó con `[data-f=all]`), acotalo al contenedor de la pantalla.
- Un elemento con `display:flex` ignora `hidden`: sumá `[hidden]{display:none}` a su clase.
- Hilo y modelo: el panel de la nutri se trabaja en Opus. Cada paso se anota en la bitácora de [plan.md](plan.md).
