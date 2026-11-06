# Secretaria, varias sedes y estadísticas del consultorio (5/11/2026)

Pedido de Facundo (hilo de la landing, punto 3: «todo lo que diga próximamente tiene que estar desarrollado»).
Rama `claude/project-thread-447kpm`. Espera el ok visual de Facundo y la frase de la base.

## Qué hay

### Varias sedes
- Las sedes son las «agendas» que ya existían en la configuración de turnos (hasta 10). Se suman
  dirección y modalidad (presencial u online) opcionales: solo cambia la validación, sin SQL.
- Agenda › Horarios: bloque «Sedes» (nombre, dirección, modalidad, agregar y quitar). Al quitar una
  sede, sus tipos de consulta, horarios y bloqueos pasan a la primera que queda.
- Con más de una sede: cada tipo de consulta y cada franja semanal eligen sede; la agenda suma el chip
  «Todas las sedes / Sede…» que filtra turnos, lugares libres y bloqueos; «Nuevo turno» elige sede.
- Página pública: con más de una sede, la paciente elige primero la sede y ve su dirección.
- Los turnos que agenda la nutri guardan su sede en la tabla nueva `appointment_locations`
  (migración `20261106100000_appointment_locations.sql`, aditiva, **sin aplicar**). Sin la tabla, la
  agenda avisa que falta instalarla y el turno se guarda igual, sin sede.

### Estadísticas del consultorio
- Menú › Estadísticas (`/crm/desarrollo?modulo=estadisticas`). 6 o 12 meses, exportar a CSV.
- Consultas del mes, porcentaje de ausencias, pacientes nuevas, consultas por mes, tabla mes a mes,
  ingresos cobrados, consultas por sede, primera vez y seguimiento, presencial y online, y las cinco
  pacientes que más faltaron (con «Ver ficha»).
- Se arma con piezas de Cobranzas del boceto v29 (`fx`, `fxtiles`, `FxDk`, `fxr`, `FxStk`, `FxCols`);
  el boceto no dibuja esta pantalla.
- Ausencia = consulta marcada como no realizada. Ingresos = cobros confirmados por fecha de pago.

### Secretaria
- Equipo › invitar secretaria: ahora manda un mail con el enlace (`/equipo?codigo=…`, vence en 7 días)
  y muestra «Copiar enlace» por si el mail está apagado o falla.
- La secretaria no ocupa lugar de profesional (antes la invitación lo descontaba).
- Quien entra sin consultorio propio ve «¿Te invitaron como secretaria? Entrá con tu código»; si ya
  es secretaria va directo a su espacio. El enlace acepta el código solo.
- «Recepción» pasó a llamarse «Secretaria» en todo el panel.

## Límites conocidos
- El espacio de trabajo de la secretaria funciona pero sigue con el estilo viejo.
- La secretaria todavía no elige sede en los turnos que agenda.
- En modo demo no hay consultas pasadas: las estadísticas muestran ceros.

## Revisión contra el boceto
- `panel:contrato:v29`: 536 piezas en verde. Las 4 de Seguimiento («Foto de la comida» y «Acciones de la
  comida») dependen de si hay comidas en la cola de demo y usan estilos de `main` que esta rama no toca.
