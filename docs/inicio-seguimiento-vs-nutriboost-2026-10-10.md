# Inicio y Seguimiento frente a Nutriboost (2026-10-10)

Fuente: matriz de la v3 (§2 Inicio, §4.5 Acompañamiento, §5 Progreso global, §7 Motor de señales). El video y el sitio no se pudieron abrir desde la
nube; una sesión en la PC de Facundo fue pedida para sacar capturas de los tramos 0:00–0:36, 0:40 y 1:10–1:30 (ver `docs/mediciones-vs-nutriboost-2026-10-10.md`).
Nada de lo siguiente se presenta como reproducción nueva del video.

## Hecho en este incremento (Inicio)
| Función v3 | Estado |
|---|---|
| Selector de período (7 / 30 / 90 días) | Hecho, en «Tu consultorio, hoy» |
| Tarjeta de consultas con comparación contra el período anterior (misma duración) | Hecho: horarios de turno ya transcurridos (historial de turnos), separadas en primeras y de seguimiento |
| Tarjeta de ingresos con cantidad de pacientes que pagaron y comparación | Hecho: pagos confirmados por fecha de pago; si los cobros no cargan lo dice, sin cero |

Código: `src/lib/inicio-indicators.ts`, `src/components/nutrigo/InicioIndicators.tsx` (con pruebas).

## Falta (con el motivo)
| Función v3 | Motivo |
|---|---|
| Clientes nuevos | La paciente no trae fecha de alta en la lista: hace falta exponer ese dato desde el servidor |
| Mensajes enviados | La lista sólo trae las últimas conversaciones de cada paciente: sumar en el cliente subcontaría; hace falta un conteo en el servidor |
| Mini gráfico en cada tarjeta, gráfico de consultas por día y de adherencia agregada | Sin hacer |
| «Próximas acciones» con riesgo de abandono, reemplazos, descartar o posponer | Depende del motor de señales (§7, tabla `patient_signals`), sin hacer; no se señala riesgo clínico por ausencia de registros |
| Seguimiento: ánimo y síntomas, calendario de cumplimiento, feed de cartera con reacción | El ánimo y los síntomas todavía no se registran en la app de la paciente; el resto depende de eso o es P2 |
| «Consultas» cuenta turnos transcurridos, no asistencia confirmada | Para contar asistencia hace falta que la profesional marque la consulta como realizada |
