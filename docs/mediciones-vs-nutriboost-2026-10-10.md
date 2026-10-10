# Mediciones y lista de pacientes frente a Nutriboost (guía de revisión, 2026-10-10)

Se siguió `GUIA-REVISION-NUTRIBOOST.md` (carpeta Plan V de Facundo). Equivalencia funcional; diseño de Nutrigo.

## Limitación de esta revisión
El Loom (`loom.com/share/35b428b9…`) y `nutriboost.ar` **no se pudieron abrir desde la nube** (sin salida a esos sitios). No hubo una pasada nueva
del video. La comparación usa la matriz de la v3 (§3, §4.2 y Anexo A, tramos 0:40 y 1:10–1:30) y su clasificación «visto». Para observar el video
hace falta una sesión en la PC de Facundo con navegador (gstack `/browse`). Nada de lo siguiente se presenta como reproducción nueva.

## Matriz: Mediciones (v3 §4.2, tramo 1:10–1:30)
| Función | Fuente / minuto | Estado en Plan V | Falta |
|---|---|---|---|
| Tres grupos de métricas (básicas, composición, perímetros) | v3, visto 1:10–1:30 | Hecho: 18 métricas | - |
| Mini gráfico y flecha de tendencia por métrica | v3, visto 1:10–1:30 | Hecho (flecha y diferencia en cada tarjeta; mini gráfico desde 2 registros) | - |
| Tarjeta de evolución del peso (diferencia desde la primera, cantidad, última fecha) | v3, visto 1:10 | Hecho | - |
| IMC | v3, visto 1:10 | Hecho (último peso y altura; referencia adulta CDC desde 20 años) | - |
| Medidores de % grasa, % músculo, masa grasa, masa muscular con rangos | v3, visto 1:10 | **Falta**: los rangos necesitan fuente clínica que elija Facundo; no se inventaron | Decisión de fuente |
| Detalle: gráfico, mín./prom./máx., historial con diferencia y marca de la última | v3, visto 1:30 | Hecho (períodos todo/90/30 días) | - |
| Carga manual por fecha | v3, visto 1:30 | Hecho | - |
| Importar PDF de balanza sin repetir fechas, con revisión previa | v3, visto 1:10; marca femmto | Hecho con lector de texto (rótulos en español e inglés); sin OCR ni IA | Probar con PDF reales de femmto e InBody (no hay muestras); OCR si el PDF es imagen |
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
