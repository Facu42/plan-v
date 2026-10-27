# Inicio v29

Rama `claude/project-thread-4ic2wy`, desde main `39eeaa8`. **Juntado a main el 27/10 (#196) con el ok de Facundo** («mergeá Inicio también»). Sin producción y sin migraciones. Los recorridos de punta a punta ya estaban rojos en main (5 pruebas: Ayuda, Planes y el recorrido 3); verify, signed-auth y secrets dieron verde.

Inicio copia el `#s-inicio` de `design/panel-nutri/v29/panel-trabajo.html`: encabezado con «· N consultas hoy» y la fecha, tres atajos (Nuevo plan, Cargar pago, Mensaje) y Nueva consulta; Pendientes (Todos, Para hacer, Felicitar); Necesitan atención; la tarjeta oscura «J · Noche»; Consultas de hoy (Hoy, Mañana, Semana) y los cinco números de abajo. Los estilos salen del CSS ya generado; solo se sumaron en `panel-v29-app.css` los pisos de la hoja vieja (tarjetas, números, avatares, chips).

## De dónde sale cada dato

| Pieza | Dato real |
|---|---|
| Pendientes | Tareas de la bandeja (`crm-work`), reservas por confirmar, la próxima consulta y los avisos de felicitar (objetivo logrado, rachas, aniversarios). Sin pendientes dice «No hay pendientes en esta lista.» |
| Necesitan atención | Pacientes con sin-registros, adherencia baja o registros por revisar. |
| Tarjeta oscura | Lo que se toca en las listas. Peso, alergias y restricciones se piden a la ficha solo de esa paciente. Sin dato dice «Sin dato». |
| Consultas | Turnos de hoy, mañana o la semana. Cuota del libro de cobros, adherencia de la paciente, estado del turno (Hecha, Próxima, Confirmada, Sin confirmar, Pide cambio). |
| Números | Consultas de hoy y hechas; pacientes activas y altas de seis meses; adherencia promedio; cobrado del mes por semana y contra el mes anterior; por cobrar y cuotas vencidas más viejas. |

## Qué no se copió del boceto (no hay dato o no hay función)

- «n.º de seguimiento», «34 años», «objetivo 65,0 / faltan 3,4», «registros 19/21» y los «% del objetivo» inventados de cada tarjeta: se muestran solo con dato real.
- «/ 8 lugares» y «85% de la meta»: no existen. Las tarjetas dicen cuántas consultas hay y cómo se reparte lo cobrado por semana.
- «Observaciones» muestra alergias y restricciones declaradas, no patologías.
- Los atajos «Nueva paciente», «Armar un plan», «Copiar link de reserva» y «Registrar cobro» de la versión vieja salieron: el boceto no los dibuja. Nueva paciente está en Pacientes y el link, en Página pública.
- Los recordatorios de mensajes por WhatsApp no existen en el panel.

## Movimiento

Mismos tiempos del boceto, sin librería, y todo dentro de `prefers-reduced-motion: no-preference`:

| Pieza | En la app |
|---|---|
| Tarjeta oscura | Manchas de fondo a la deriva (5 a 8 s), forma de línea que se dibuja y cambia cada 4,5 s, vaivén 3,4 s, entrada escalonada de cabecera, número, datos y botones (.35 a .6 s), fondo y forma que siguen al puntero (18/14 y −12/−10 px). Se repite al elegir otra fila. |
| Números | Entrada de las cinco tarjetas (.5 s, escalón .07), puntos, columnas, anillo (1,1 s), barras semanales y barras de vencidas; el número cuenta hasta su valor en 1,1 s la primera vez. |
| Resto | La entrada de módulo `fin` de las otras pantallas, el hover de la tarjeta de número (ya estaba en el CSS) y el paso de pestañas. |
| Quedó fuera | La entrada con escala del fondo de la tarjeta (choca con el seguimiento del puntero) y la cuenta de los números al volver a Inicio en la misma sesión. |

Comprobado en el navegador: con movimiento las manchas, la forma y las tarjetas animan y la forma cambia a los 4,5 s; con «reducir movimiento» no hay ninguna animación.

## Evidencia

- Capturas 1440 y 390, claro y oscuro, y el boceto: `docs/screenshots/inicio-v29/`. En el demo no hay consultas hoy, por eso la tabla está vacía; el estado de cada fila lo cubre una prueba.
- Suite con Node 22: **3.418 aprobadas y 4 omitidas, 543 archivos**. `npm run check` y `npm run build` en verde. `panel:v29:check` en verde.
- `panel:contrato:v29`: Inicio nuevo con 13 piezas iguales al boceto, claro y oscuro. Quedan 2 fallas que **ya estaban en main**: la altura de «Acción de la fila» en Planes (27 px del boceto contra 26 px de la app).
- Pruebas nuevas: `inicio-presentacion.test.ts` (7) y `PanelHome.test.tsx` (8).

## Regression Guard · paso 10

- **Flujos críticos:** Inicio abre, filtra, elige y abre fichas y cobranzas con los enlaces existentes ✅. Cada acción de la tarjeta usa la ruta que ya existía. El recorrido de sesión firmada no se corrió en este entorno ⚠️.
- **Regresiones cubiertas:** error de carga no se muestra como cero; sin cobros no se inventa monto; la cuota que vence hoy no se lee como vencida.
- **Contratos:** `crm-work`, tablero de cobros, reservas, ficha de cuidados y de ingreso. Sin campos nuevos.
- **Áreas frágiles:** el contador de cobros depende del tablero de cobranzas; si falla se dice «No disponible» y hay «Reintentar cobros».
- **Migraciones:** no hay.
- **Fire test:** la prueba de la cuota que vence hoy falló al cambiar la regla y volvió a verde al restaurarla ✅.
- **Automatizaciones:** el contrato mide Inicio en cada corrida.
- **Veredicto: GO**, juntado con el ok escrito de Facundo.

## Qué falta frente al boceto v29 y plan

Revisado contra `main`, `handoff-boceto-a-app.md` y `#s-*` del boceto. Ya están: shell, Seguimiento, Progreso, Asistente IA, Alimentos, Biblioteca, Planes, Ayuda, Equipo, Ajustes, motion del shell y ahora Inicio. Faltan:

1. **Pacientes** (`#s-pacientes`): listado con resumen que se despliega hacia abajo. Un PR; usa el listado y los filtros que ya existen.
2. **Ficha** (`#s-ficha`, 10 pestañas): la más grande. Partir en 3 PR (cabecera y Resumen; Historia clínica, Laboratorio y Mediciones; Consultas, Plan, Archivos y Cobros). Con la animación `fxAnim` del boceto.
3. **Agenda** (`#s-agenda`) y **Cobranzas** (`#s-cobranzas`), uno por PR; Cobranzas lleva el `fxAnim` y los gráficos.
4. **Mensajes** (`#s-mensajes`): sin WhatsApp; el chat de la app y los avisos.
5. **Página pública** (editor del boceto) y **Dictar/Adjuntar** de «Armar con IA» (Planes 3g), que hoy dicen «Próximamente».
6. **Celular**: pasada por pantalla con el contrato a 390.

Orden sugerido: Pacientes, Agenda, Cobranzas, Mensajes, Ficha (3 PR), Página pública, Planes 3g. Cada uno con su ok visual antes de juntarse.

**Movimiento pendiente en otras pantallas** (según `motion-v29.md`, que dejó fuera lo de GSAP): entrada animada de la Ficha y de Cobranzas (`fxAnim`), el detalle ilustrado de la paciente y los conteos de Progreso. Van dentro del PR de cada pantalla.
