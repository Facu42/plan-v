# Revisión del front de la paciente contra Nutrigo (2026-10-09)

Pedido de Facundo: "sigo sin ver el diseño de Plan V como lo diseñé en Figma con el nombre de Nutrigo".
Rama `claude/front-paciente-nutrigo-tuezz8`. Comparación lado a lado publicada como Artifact del proyecto:
https://claude.ai/artifact/WZJZUSPbry81G9cX6CHhjt

## Diagnóstico

- `main` (y producción, Vercel `dpl_GFxnhktjDNsBQwjXPj4niaoZ6n1u`, commit `0bc2b02`) ya trae las diez
  pantallas de la paciente armadas con el código de cada frame (PR #68, 2026-10-07). El MCP de Figma
  responde en esta sesión.
- `scripts/nutrigo-compare.mjs` en modo demo, mismo tamaño que Figma: entre 2,3 % y 11,6 % de píxeles
  distintos (textos en español y datos propios). Peores: Agenda (11,6 / 9,5 %), Menú celular (10,4 %),
  Mensajes (9,0 / 8,1 %).
- Por qué Facundo no lo ve (deducido del código; no se pudo entrar con su cuenta):
  1. Producción no tiene modo demo: solo se ve con una cuenta de paciente vinculada y con registros.
  2. Cuenta sin vincular, cargando o con error: tarjetas `loading-card` con el estilo viejo (no Nutrigo).
  3. Una franja verde "Instalar Plan V" fija arriba de todo, que no existe en el archivo.
  4. Sin datos, cada bloque muestra cero o "Sin dato"; las fotos de platos son grises (en Figma también).

## Matriz Plan V ↔ Nutrigo (paciente)

| Plan V | Escritorio | Celular | Estado |
|---|---|---|---|
| Inicio | `12:792` | `427:14405` | código del frame; 4,8 / 6,6 % |
| Agenda | `84:1666` | `433:17250` | código del frame; 11,6 / 9,5 % |
| Mensajes | `84:2565` | `433:19982` | código del frame; 9,0 / 8,1 % |
| Menú | `84:2716` | `445:10499` | código del frame; 7,1 / 10,4 % |
| Plan | `84:2994` | `470:15300` | código del frame; 3,9 / 2,3 % |
| Compras | `105:2472` | `492:11324` | código del frame; 5,2 / 6,2 % |
| Diario | `105:2649` | `492:14886` | código del frame; 4,1 / 4,5 % |
| Progreso | `105:2790` | `498:18237` | código del frame; 5,7 / 6,6 % |
| Ejercicio | `105:2931` | `501:22824` | código del frame; 3,8 / 5,0 % |
| Recursos | `263:6588` | `504:15334` | código del frame; 4,6 / 4,2 % |
| Pagos, Ficha y permisos | — | — | Figma no las dibuja: piezas del archivo |
| Ingreso, cuenta sin vincular, carga, error | — | — | Figma no las dibuja: hoy estilo viejo |

## Plan

1. Reglas permanentes en `CLAUDE.md` (hecho en esta rama).
2. Piloto, Inicio de una paciente real (hecho en esta rama): sin franja de instalar arriba; la invitación va
   en la tarjeta amarilla del menú (el «Claim Now!» del archivo) y, en el celular, como fila de «Mi cuenta».
   El botón de esa tarjeta conserva su texto Poppins Medium 12 del archivo (antes el aviso de cuota lo agrandaba).
3. Pantallas de entrada (cuenta sin vincular, carga, error) con piezas del archivo.
4. Revisar cada pantalla sin datos, que es lo que ve una paciente nueva.
5. Achicar las diferencias de Agenda, Menú celular y Mensajes.

## Comprobaciones del piloto

- Pruebas nuevas: `src/pwa/install-offer.test.ts`, `src/features/nutrigo/install-card.test.tsx` y casos nuevos en
  `fee-notice.test.tsx` y `PatientMenuSheet.test.tsx`.
- Navegador 1440 y 390 en modo demo, simulando el aviso de instalación del navegador.
