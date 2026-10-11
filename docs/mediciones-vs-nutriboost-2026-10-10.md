# Mediciones y lista de pacientes frente a Nutriboost (guía de revisión, 2026-10-10)

Se siguió `GUIA-REVISION-NUTRIBOOST.md` (carpeta Plan V de Facundo). Equivalencia funcional; diseño de Nutrigo.

## Limitación de esta revisión
El Loom (`loom.com/share/35b428b9…`) y `nutriboost.ar` **no se pudieron abrir desde la nube** (sin salida a esos sitios). No hubo una pasada nueva
del video. La comparación usa la matriz de la v3 (§3, §4.2 y Anexo A, tramos 0:40 y 1:10–1:30) y su clasificación «visto». Para observar el video
hace falta una sesión en la PC de Facundo con navegador (gstack `/browse`). Nada de lo siguiente se presenta como reproducción nueva.

## Capturas tomadas en la PC de Facundo (10/10, 6 capturas, `motion-reel-kit\nutriboost-capturas`)
Una sesión en su PC abrió el Loom y el sitio y sacó 4 capturas del video (0:42, 1:11, 1:20, 1:30) y 2 del sitio; no revisó cuadro por cuadro. Son de ~800 px: el texto chico no se lee.
- **Visto en la lista (0:42):** 4 indicadores (clientes totales, activos este mes, con próxima consulta, sin consulta agendada), pestañas Todos/Activos/Inactivos, filtros, buscador, vista cómoda/compacta, columnas Teléfono, Última consulta («Hace 5 días»), Próxima consulta y Estado, botón «Registrar cliente». **El indicador de conexión no se distingue** en la captura.
- **Visto en Mediciones (1:11–1:30):** peso grande con gráfico de evolución, una fila de unos 5 medidores circulares, grupo «Medidas básicas» con mini gráfico, tres cifras (62,5 / 63,3 / 63,8 kg; probablemente mín./prom./máx., rótulos ilegibles) y formulario de carga manual.
- **Sólo dicho, no visto:** balanzas femmto/InBody con OCR (Loom 1:45) y «la IA importa el PDF» (sitio). **El aviso de importar PDF que la v3 marca como visto en 1:10 no apareció en estas capturas**; no se pudo confirmar. El sitio es una sola página, sin pantallas de pacientes propias (tarjeta «Mediciones con IA» y paso «ficha + PDF de balanza»).
- **Diferencias con Plan V que quedan:** los 4 indicadores de la lista de Nutriboost son otros (totales, activos del mes, con próxima consulta, sin consulta agendada) frente a Activos / Pendientes de revisión / Con próxima consulta / Archivados de Plan V (los de Plan V siguen la decisión de Facundo; no se cambiaron); pestañas Todos/Activos/Inactivos; columna Teléfono; medidores circulares y el peso grande con gráfico arriba de Mediciones.

## Segunda pasada completa del video (10/10, 28 capturas + 2 del sitio)
La sesión en la PC de Facundo recorrió el Loom entero (9:58, sin audio; los subtítulos sólo de apoyo) tramo por tramo según la guía.
Detalle y tabla de corroboración en `motion-reel-kit\nutriboost-capturas\LEEME.md` (en su PC). Corrige lo anterior:
- **El aviso «Importar de balanza Femto… sin repetir fechas» con botón «Subir PDF» sí se ve** (1:15 y 1:34). No se vio el resultado de subir un PDF.
- Los rótulos del detalle de peso son Mínimo / Promedio / Máximo (62,5 / 63,3 / 63,8 kg) y hay un botón «Registrar nueva medición». Hecho en Plan V:
  la tarjeta «Evolución del peso» muestra «Mín · Prom · Máx» y el detalle de cada métrica ofrece «Registrar nueva medición».
- «Aplicación para el cliente — Conectado» se ve en Entregables (3:43). Hecho: el encabezado de la ficha dice «App de la paciente: conectada / sin cuenta».
- El medidor de IMC muestra la categoría («Peso normal»), el de % grasa muestra variación; masa grasa, % músculo y masa muscular aparecen como
  «Sin dato» y **no se ven rangos**. La planificación muestra IMC, metabolismo basal (Mifflin-St Jeor) y nivel de actividad: Plan V ya lo tenía.
- Tiempos de la guía corroborados en todos los tramos, con desfases chicos (asistente 4:27, responde ~4:45; Modelos 7:12; Academy 7:18, excluida).
- No verificado: lista de resultados del buscador global, «marcar como leídas», adjuntos y leído en Mensajes, listado de recetas, Agenda.
- **Modelos de plan ya existen en Plan V** (menú «Modelos»: planes modelo, recomendaciones, alimentos a evitar, borrador/publicado y aplicar a una
  paciente; publicado el 8/10, ver `docs/publicacion-dashboard-web-2026-10-08.md`). Un mensaje anterior de este hilo decía que no había plantillas: era un error de búsqueda.

## Matriz: Mediciones (v3 §4.2, tramo 1:10–1:30)
| Función | Fuente / minuto | Estado en Plan V | Falta |
|---|---|---|---|
| Tres grupos de métricas (básicas, composición, perímetros) | v3, visto 1:10–1:30 | Hecho: 18 métricas | - |
| Mini gráfico y flecha de tendencia por métrica | v3, visto 1:10–1:30 | Hecho (flecha y diferencia en cada tarjeta; mini gráfico desde 2 registros) | - |
| Tarjeta de evolución del peso (diferencia desde la primera, cantidad, última fecha, mín./prom./máx.) | Visto 1:10–1:30 | Hecho | - |
| IMC | v3, visto 1:10 | Hecho (último peso y altura; referencia adulta CDC desde 20 años) | - |
| Medidores de % grasa, % músculo, masa grasa, masa muscular con rangos | v3, visto 1:10 | **Falta**: los rangos necesitan fuente clínica que elija Facundo; no se inventaron | Decisión de fuente |
| Detalle: gráfico, mín./prom./máx., historial con diferencia y marca de la última | v3, visto 1:30 | Hecho (períodos todo/90/30 días) | - |
| Carga manual por fecha | v3, visto 1:30 | Hecho | - |
| Importar PDF de balanza sin repetir fechas, con revisión previa | Visto 1:15 y 1:34 (aviso y botón); resultado no visto | Hecho con lector de texto (rótulos en español e inglés); sin OCR ni IA | Probar con PDF reales de femmto e InBody (no hay muestras); OCR si el PDF es imagen |
| Estudios subidos por la paciente | anunciado, no visto | Fuera de este incremento | - |

## Matriz: lista de pacientes (v3 §3, tramo 0:40)
| Función | Estado en Plan V | Nota |
|---|---|---|
| Indicadores clickeables que filtran | Hecho: Activos, Pendientes de revisión (aprobado por Facundo), Con próxima consulta, Archivados | Nutriboost muestra además «Totales» y «Sin consulta agendada»: no se sumaron |
| Pestañas, búsqueda, filtros | Hecho | - |
| Elegir columnas y densidad (guardado por usuaria) | Hecho: «Columnas y densidad» (guardado en el navegador) | No es por cuenta, es por navegador |
| Última consulta («hace N días») | Hecho como columna opcional, desde el historial de turnos vencidos | Sin historial muestra «Sin consultas registradas» |
| Próxima consulta | Ya estaba (dentro de «Próximo foco») | - |
| Indicador de conexión | Hecho como columna opcional (cuenta vinculada o sin cuenta) | - |
| Acción de mensaje directo | Hecho (sólo pacientes con cuenta) | - |
| Teléfono | **Falta**: el sistema no guarda teléfono de la paciente | Requiere dato nuevo |

Las columnas nuevas (Última consulta, Conexión) arrancan ocultas para no tocar el diseño original; se activan desde «Columnas y densidad».
