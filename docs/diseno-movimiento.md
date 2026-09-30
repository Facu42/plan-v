# Diseño, experiencia y movimiento — registro

Apartado B de `docs/plan-apartados.md`. Lo lleva el hilo "Diseño y movimiento".
Agentes del apartado: `ux-architect` (lidera), `ui-designer`, `whimsy-injector`,
`accessibility-auditor`, `ui-finish-gate-reviewer`.

## 2026-09-29 — Movimiento de los elementos (punto 1)

**Qué dice el archivo de Nutrigo.** Nada: se pidió la información de animaciones del
archivo de Figma (`get_motion_context`) sobre Dashboard (`12:792`), Calendario (`84:1666`),
Mensajes (`84:2565`) y Menú saludable (`84:2716`) y las cuatro vuelven vacías. El archivo no
dibuja movimiento, así que se usa el default del plan.

**Qué había antes.** Sólo el cajón del celular se deslizaba (220 ms) y un puñado de
detalles sueltos (el formulario de cuidado, los pasos del ingreso). Todo lo demás cambiaba de
golpe.

**Default elegido** (archivo `src/components/nutrigo/motion.css`, se carga último):

| Momento | Qué pasa | Duración |
| --- | --- | --- |
| Pasar el mouse o tocar un botón, enlace o campo | Color, fondo, borde y sombra cambian suave | 150 ms |
| Apretar un botón | Se hunde apenas (97 %) | 150 ms |
| Pasar el mouse (o llegar con teclado) sobre una tarjeta que se abre | Sube 2 px y gana sombra | 200 ms |
| Cambiar de pantalla | Cada bloque aparece subiendo 8 px, uno detrás de otro (40 ms entre bloques) | 250 ms |
| Columna derecha ("Mi día") | Aparece | 250 ms |
| Mensajes de "sin datos" | Aparecen subiendo | 250 ms |
| Abrir el cajón del celular | El cajón se desliza (ya estaba) y el fondo oscuro aparece | 200 ms |
| Abrir menú de la cuenta, avisos o el submenú de Plan | Caen desde su botón | 150 ms |
| Avisos en el celular | Suben desde abajo | 250 ms |
| Hoja "Más" del celular | Sube desde abajo | 250 ms |
| Ventanas (nueva paciente, editar, registrar comida) | Fondo aparece y la ventana sube | 200 / 250 ms |

Reglas: nada dura más de 250 ms, no hay rebotes ni giros, y todo se apaga si la persona tiene
activado "reducir movimiento" en su teléfono o computadora.

**Cómo se comprobó.**
- App en modo demo, navegador real, 1440 y 390: al cambiar de pantalla y al abrir paneles se
  ven las animaciones nuevas; con "reducir movimiento" no se mueve nada.
- Videos de la recorrida en la carpeta del proyecto: `diseno-movimiento/movimiento-escritorio.webm`
  y `diseno-movimiento/movimiento-celular.webm`.
- `accessibility-auditor` revisó el archivo: sin problemas graves. Se sumó su sugerencia de que
  el foco con teclado dé la misma señal que el mouse en las tarjetas. Riesgo menor anotado:
  si se abre una ventana en el primer tercio de segundo después de cambiar de pantalla, puede
  quedar ubicada respecto del bloque que está entrando; pasado ese instante, nada queda corrido.
- Prueba nueva `motion.test.ts`: que el archivo se cargue último, que nada se mueva con
  "reducir movimiento", que las duraciones estén entre 150 y 250 ms y que las entradas no
  dejen nada corrido. Suite completa: 888 pruebas pasan, 2 omitidas.

## 2026-09-30 — Estados que el archivo no dibuja (punto 2)

El movimiento del punto 1 quedó publicado el 2026-09-30 (PR #22).

**Qué había.** Mensajes de "sin datos" en casi todas las pantallas, carga y error sólo en
Progreso, y el aviso amarillo de "sin conexión". Faltaban dos cosas que se ven en producción:
- Mientras bajaba el consultorio, la pantalla mostraba una línea de texto suelta.
- Si algo fallaba al dibujar (por ejemplo, después de una actualización de la app con la
  pestaña vieja abierta), la persona veía una página en blanco sin salida.

**Qué se hizo** (`src/components/shared/AppStatus.tsx` y `app-status.css`):
- **Cargando:** pantalla con el fondo del archivo (#F9F4F2), un giro verde oscuro (#73A107) y
  "Cargando tu espacio…". Se anuncia a lectores de pantalla y el giro se apaga con "reducir movimiento".
- **Error:** "Algo salió mal. No pudimos mostrar esta pantalla. Lo que ya tenías guardado sigue
  ahí. Volvé a cargar la app para seguir." con el botón verde "Volver a cargar".
  Envuelve toda la app, así que atrapa cualquier falla de dibujo.
- **Vacío y sin conexión:** ya existían con el estilo del archivo; no se tocaron.
- Los valores de color y tamaño están escritos a mano en esa hoja porque corre antes de que baje
  el consultorio (que trae las variables del archivo). Son los mismos valores del archivo.

**Cómo se comprobó.** Navegador real en 1440 y 390: con la descarga del consultorio cortada
aparece el error y el botón; con la descarga demorada aparece la carga y después el consultorio.
Pruebas nuevas en `AppStatus.test.tsx`.

## 2026-09-30 — Primer uso (punto 3)

**Nutricionista.** Quien se registra con "Soy nutricionista" entra a un consultorio vacío. Antes veía
"Sin pacientes activos" y un botón. Ahora ve "Empecemos", con tres pasos numerados en el orden
real de la app: crear su primer paciente ("Nuevo paciente" en Pacientes), compartirle el enlace
(copiar o WhatsApp) y armar su plan (Plan semanal), y un botón "Ir a Pacientes".
Archivo `src/components/nutrigo/FirstSteps.tsx`. Comprobado en 1440 y 390; pruebas en
`FirstSteps.test.tsx`.

**Paciente.** Ya tiene su recorrido: el ingreso guiado la primera vez y, hasta que su
nutricionista publica el plan, la pantalla "Tu plan está en camino". No se tocó.

## Lo que sigue en este apartado

4. Accesibilidad: contraste, uso con teclado, tamaños táctiles en móvil.
