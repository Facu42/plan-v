# Agenda v29

Rama `claude/agenda-v29`, desde main `3ced7f6`. **Sin merge, sin producción y sin migraciones.** Espera el ok visual de Facundo.

La Agenda copia el `#s-agenda` de `design/panel-nutri/v29/panel-trabajo.html`: título «Agenda · 26 al 31 de octubre» con la línea «N consultas · N lugares libres · N pedidos de turno»; Día / Semana / Mes, flechas, Bloquear horario y Nuevo turno arriba; el calendario con hora por hora, la línea de ahora y los turnos de colores; y al lado el mes chico con sus referencias, Pedidos de turno y Lugares libres.

Archivos: `PanelAgenda.tsx` (pantalla y estado), `agenda-presentacion.ts` (todo lo que se calcula, sin React), `panel-v29-app.css` (solo contra la hoja vieja, el mes y el movimiento), `scripts/panel-v29-agenda-ejemplo.mjs` (datos de ejemplo para el contrato y las capturas).

## De dónde sale cada dato

| Pieza | Dato real |
|---|---|
| Título | Semana que se mira (o el día, o el mes). |
| Línea de arriba | Consultas reales de lo que se mira (sin bloqueos ni pedidos), lugares libres y pedidos de turno. |
| Turnos | Reservas confirmadas y turnos de las fichas (`buildPanelAgendaEvents`). Color: consultorio, videollamada, sin confirmar (pedido), primera consulta (borde punteado), hecha (gris), próxima (negra, una sola: la primera confirmada que todavía no empezó) y bloqueo (rayado). |
| Cantidad por día | Consultas reales de ese día. |
| Franja de horas | De 8 a 19 como el boceto; se ensancha solo si hay un turno afuera. |
| Mes chico | Mes que se mira, semana marcada, hoy en lima y un punto en los días con turnos. Se puede tocar un día para ir a él y cambiar de mes con las flechas. |
| Pedidos de turno | Reservas en estado «pedida» desde la página pública. «Primera vez» si todavía no tiene ficha, «seguimiento» si ya la tiene. |
| Lugares libres | Huecos dentro de los días de atención, con la duración de la consulta más corta, que no pisan turnos ni bloqueos y todavía no pasaron. Muestra 8 y dice cuántos más hay. Sin tipos de consulta, lo dice en vez de inventar horarios. |

## Funciones que se conservan (el boceto no las dibuja)

- **Aceptar** confirma el pedido; si ya tiene ficha, la vincula.
- **Proponer otro** despliega: elegir otra ficha (o crear una nueva), proponer nuevo horario (Reprogramar) y Cancelar turno.
- **Bloquear horario**: mismo diálogo de siempre.
- **Nuevo turno** abre la ficha de consultas como antes.
- **Pie de Lugares libres**: Copiar link de reservas, Horarios y precios, Pagos y calendario (con la cantidad que hay para revisar) y Conexiones (Google, Mercado Pago). Abren las tarjetas de siempre en un diálogo: editor de horarios, transferencias por confirmar o rechazar, sincronizar calendario, conciliar Mercado Pago, ver más reservas y conectar o desconectar. Los accesos del menú «Reservas por confirmar» y «Horarios y precios» siguen andando.
- **Mes** y **Día** no están dibujados en el boceto: se armaron con sus colores de turno.

## Qué no se copió

- «Recordatorio de turno activo · en la app 24 h antes»: no hay un ajuste que lo diga, así que no se afirma. El pie lleva los accesos de arriba.
- Los nombres, horarios y pedidos de ejemplo del boceto.

## Movimiento

Todo dentro de `prefers-reduced-motion: no-preference`, sin librería: los turnos, los pedidos y los lugares libres entran con un fundido corto (.2 a .28 s) y «Proponer otro» se despliega igual.

## Evidencia

- Capturas 1440 y 390, claro y oscuro, más Mes, Día, pedido desplegado, Pagos, Horarios y Bloquear: `docs/screenshots/agenda-v29/`. Con datos de ejemplo (el demo no guarda horarios ni reservas).
- `npm test`: 3.439 aprobadas y 4 omitidas. `npm run check` en verde.
- `panel:contrato:v29`: Agenda con 21 piezas iguales al boceto, claro y oscuro. Queda la única falla que **ya estaba en main** (altura de «Acción de la fila» en Planes, 27 contra 26 px). Informe en `design/panel-nutri/v29/contrato-informe.md`.
- Pruebas nuevas: `agenda-presentacion.test.ts` (7) y `PanelAgenda.test.tsx` reescrito (5).

## Regression Guard · paso 10

- **Flujos críticos:** confirmar y vincular un pedido, proponer otro horario, cancelar, bloquear horario, nuevo turno, copiar link, revisar transferencias, sincronizar calendario, conciliar Mercado Pago, conectar y desconectar ✅ (mismas funciones; las secundarias pasan a un diálogo).
- **Regresiones cubiertas:** sin tipos de consulta no se inventan lugares libres; un turno pasado no cuenta como «próxima»; bloqueos y pedidos no cuentan como consultas; mes que cambia de largo ya no salta (antes se movía 30 días).
- **Contratos:** `GET /api/scheduling` y los cambios de reserva, sin campos nuevos.
- **Áreas frágiles:** horarios en zona Buenos Aires; un fallo de carga muestra el aviso con «Reintentar».
- **Migraciones:** no hay.
- **Automatizaciones:** el contrato mide Agenda en cada corrida.
- **Veredicto: HOLD** hasta el ok visual de Facundo. No se junta a main sin su frase.
