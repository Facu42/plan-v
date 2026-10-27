# Motion del panel, paridad con el boceto v29

Rama `cursor/motion-panel-v29-e2b6`, desde main `11645a6` (Equipo y Ajustes, #192). Código del movimiento `a986e2f`. [PR #193](https://github.com/Facu42/plan-v/pull/193) en borrador. **Sin merge, sin publicación y sin migraciones.**

No se redibujó ninguna pantalla. No se agregó una librería de animación. El CSS generado `panel-v29.css` no se editó a mano: ya traía las transiciones del boceto `design/panel-nutri/v29/panel-trabajo.html`. Lo que faltaba era dispararlas.

Con «reducir movimiento» del sistema, la pastilla no se estira, el panel lateral se cierra en el acto y la entrada de módulo no corre (`animation: none`). El boceto ya apagaba las transiciones del menú en ese caso.

## Qué se portó

Los tiempos son los del boceto, no unos nuevos.

| Pieza | Dónde | Qué hace |
|---|---|---|
| Pastilla `.nvpill` | `PanelNavigation` | Se estira 180 ms (`ease-in`) y suelta 300 ms con `cubic-bezier(.2, 1.4, .4, 1)`. La clase `.go` achica la barrita. El primer pintado, el scroll y «reducir movimiento» van directo. Al plegar, la pastilla sigue la opción 450 ms (`dataset.inst`) y a los 470 ms vuelve a animar. |
| Menú | CSS ya generado | `.nv` fondo .2s, `.car` rota .3s, `.nvpill` opacidad .2s y `::before` .25s, `.subw` filas .32s, `.si` entra con `--i`, `.lbl` .2s, `.app` columnas .34s, `.fold svg` rota .34s. En el celular, `.side` y `.mscrim` ya se deslizan con `.mdr`. |
| Entrada de módulo | `panel-v29-app.css` | `animation: fin .25s ease` en Ayuda, Equipo, Ajustes, Planes, Biblioteca, Seguimiento, Progreso, Alimentos y Asistente. Es el mismo `fin` de `.fbody` (opacidad y 4 px). No se usa la clase `.fbody` porque cambia la grilla. |
| Panel lateral `#act` / `#actw` | Ayuda, Biblioteca, Seguimiento, Alimentos | Entra en el frame siguiente (`.on`). Al cerrar con la X, el fondo o Cancelar se saca `.on` y se espera 220 ms. Curva del boceto: `transform .26s cubic-bezier(.16, 1, .3, 1)` y opacidad .2s. |
| Aviso `#atoast` | Esas pantallas y el asistente de cartera | `.on` en el frame siguiente. A los 3600 ms se apaga y el nodo se va después de la salida (.26s). |
| Interruptor `.sw` | Editor de planes y asistente del plan | Ya estaba: fondo .2s y la perilla `translateX(12px)`. |
| Cajón `.iadr` | Asistente del plan | Ya estaba: la clase `open` entra y sale con `.26s cubic-bezier(.2, .7, .2, 1)`. |
| Chevron de comida | Editor de planes | `.pux-meal-toggle > svg` ya rota en 200 ms con `aria-expanded`. |
| Hover | Planes | `.pema .ibtn:hover` sube 1 px. La fila `tbody tr` cambia el fondo en .2s. |

## Qué quedó afuera

No está la pieza en la app, o el propio boceto la apagó. No se inventó la pantalla para poder animarla.

- GSAP: conteo de números, gráficos del Inicio y el detalle ilustrado de la paciente. El generador de CSS ya los deja afuera.
- `.kpi`, `.k1`, `.ev`: no están montados (Inicio y Agenda no son v29).
- `.fxtile:hover`: el boceto lo cancela más abajo (`transform: none`). No se volvió a prender.
- `.pd` / `pdin` / `#det`: la ficha de la paciente no es el detalle v29.
- `.chatd`: el chat de la ficha no está. El cajón que sí está es `.iadr`.
- `.live`, `.rec .dotr`, `.ntlive`, `.pflash`, `mIn`, `#mchat .anew`: no hay ese componente.
- `.hcidx` / `.hce`: Ayuda usa las tarjetas `.fxr`, no ese índice.
- `.eqc`, `.ajtp`, `.ajav` y el interruptor `.sw` de Equipo/Ajustes: esas pantallas usan casillas y chips «Próximamente». Pasarlas a `.sw` cambiaría el dibujo y parecería que algo se puede activar.
- El diálogo `.ea-dialog` es un cuadro del navegador, no el panel `#act`.
- Flechas `.ar` de las tarjetas de vidrio (`.dv-g` / `.dvx`): no están montadas.
- El menú de cuenta `.pv-acct` es de la app. El boceto no le pone movimiento.
- Los botones del pie de «Pedir ayuda» (Ayuda) y Guardar, que cierra el padre al terminar, salen de una: el cierre de 220 ms corre cuando el panel mismo pide cerrar.

## Evidencia

En el demo local, a 1440, claro y oscuro: el menú se pliega a íconos, el submenú de Pacientes se abre, el panel de una pregunta de Ayuda entra desde la derecha, y en el plan de Sofía el interruptor Fotos prende y el chevron de Desayuno gira. Al prender Fotos aparece el aviso «Estas comidas no tienen foto.».

Suite: **3.409 aprobadas y dos omitidas, 542 archivos**. `npm run check` en verde. `panel:v29:check`: el CSS generado sigue igual al boceto.

## Regression Guard · paso 10

- **Flujos críticos:** entrar al panel en demo, plegar el menú, abrir un submenú, cambiar de módulo (Ayuda, Equipo, Ajustes, Planes, Biblioteca, Seguimiento, Progreso, Alimentos, Asistente), interruptor de Fotos, chevron de comida, abrir y cerrar un panel lateral, aviso. El cálculo de la pastilla está cubierto. ✅ El movimiento en el navegador no lo mide la suite: queda en las capturas. ⚠️
- **Regresiones cubiertas:** si el umbral de 1 px deja de estirar un salto grande, falla `panel-v29-motion.test.ts`.
- **Contratos:** no hay cambio de API, de rutas ni de datos. El CSS generado sigue igual que el boceto (`panel:v29:check`).
- **Áreas frágiles:** la pastilla mide la opción prendida. Si esa clase falta, se esconde. Un panel que se monte ya con `.on` no se ve entrar: por eso `.on` entra en el frame siguiente.
- **Migraciones:** no hay. No se tocó la base.
- **Fire test:** subir el umbral a 100 px hizo fallar el estirado de 90 px. Se volvió a 1 px. ✅
- **Automatizaciones:** no hay un paso nuevo de publicación ni una variable. No se publica.
- **Veredicto: HOLD** hasta el ok visual de Facundo. El PR queda en borrador.
