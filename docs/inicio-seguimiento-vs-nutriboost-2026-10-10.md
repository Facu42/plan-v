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

| Pacientes nuevas con comparación | Hecho: fecha de alta en el consultorio (ya existía en la base; ahora el servidor la manda a la profesional). Sin esa fecha muestra «Sin dato» |

Código: `src/lib/inicio-indicators.ts`, `src/components/nutrigo/InicioIndicators.tsx` (con pruebas).

**Corrección (10/10):** en la base real nadie escribe el historial «elapsed»; sólo el modo demo lo generaba. Sin arreglo, en la web
publicada «Consultas» daba cero y «Última consulta» decía «Sin consultas registradas». Ahora el servidor arma ese historial con los turnos
no cancelados cuyo horario ya terminó (últimos 400 días), en la lista de pacientes. Sigue contando turnos cumplidos, no asistencia confirmada.

## Hecho en este incremento (Seguimiento)
| Función | Estado |
|---|---|
| Novedades de la cartera (comidas y agua de todas las pacientes) | Hecho: `GET /api/crm/feed`, sólo metadatos (franja, estado, vasos), sin fotos, descripciones ni notas; pacientes archivadas afuera |
| Filtros: período 7/14/30 días, revisión (todas / por revisar / revisadas) y paciente | Hecho |
| Detalle por día | Hecho: cada día se abre y muestra, por paciente, sus comidas con estado y el agua, con acceso a la ficha |
| Escribirle a la paciente desde las novedades | Hecho: «Escribirle» abre la pestaña Mensajes de su ficha |
| Marcar comidas como revisadas desde las novedades | No se hace a propósito: la regla de producto del 10/10 dice que la nutricionista aprueba el plan, no cada comida, y confirmar sin ver alimentos ni calorías sería a ciegas. La revisión sigue en la ficha |

Código: `server/crm/feed.ts`, `server/crm/feed-repository.ts`, `src/components/nutrigo/CarteraFeed.tsx` (con pruebas).

## Falta (con el motivo)
| Función v3 | Motivo |
|---|---|
| Mensajes enviados | La lista sólo trae las últimas conversaciones de cada paciente: sumar en el cliente subcontaría; hace falta un conteo en el servidor |
| Mini gráfico en cada tarjeta, gráfico de consultas por día y de adherencia agregada | Sin hacer |
| «Próximas acciones» con riesgo de abandono, reemplazos, descartar o posponer | Depende del motor de señales (§7, tabla `patient_signals`), sin hacer; no se señala riesgo clínico por ausencia de registros |
| Seguimiento: ánimo y síntomas, calendario de cumplimiento | El ánimo y los síntomas todavía no se registran en la app de la paciente; el resto depende de eso o es P2 |
| «Consultas» cuenta turnos transcurridos, no asistencia confirmada | Para contar asistencia hace falta que la profesional marque la consulta como realizada |

## Repartido en otros hilos (10/10)
Lanzados por la sesión en la PC de Facundo, desde main: asistente con IA sobre la cartera, Progreso global, Equivalencias, Centro de ayuda con campana
de avisos. Lanzado por el coordinador desde la rama del PR #89: cobros por paciente (Nuevo cobro, Asignar programa, Copiar link). En espera:
buscador global (no se vio la lista de resultados) y el asistente dentro de la ficha (falta decidir proveedor y costo).

## Planificación: comparar fórmulas (10/10)
- En Planificación, «Comparar fórmulas» muestra basal y gasto diario con Mifflin-St Jeor (la que usa la meta), Harris-Benedict revisada (Roza y Shizgal, 1984), FAO/OMS/ONU (1985, solo peso y tramo de edad), Katch-McArdle (con la grasa corporal más reciente de Mediciones) y el basal medido por la balanza si se cargó. Todas con el mismo factor de actividad.
- La meta guardada sigue con Mifflin-St Jeor: la base recalcula la meta con esa fórmula y rechaza otros campos. Elegir otra fórmula como base necesita una migración (y su frase para producción); queda pendiente hasta que Facundo lo pida.
- Código: `src/lib/energy-equations.ts`, `src/components/nutrigo/EnergyEquationComparison.tsx` (con pruebas).
