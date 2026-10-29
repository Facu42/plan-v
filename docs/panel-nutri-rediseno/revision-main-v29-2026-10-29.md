# Revisión de main contra el código del boceto v29 · 29/10/2026

**Veredicto: no se puede certificar que main coincida con v29.** Hay diferencias de estilos y estructura, además de funciones del boceto que siguen pendientes. Esta entrega revisa y mejora las herramientas de comprobación; no cambia las pantallas de la app ni las presenta como corregidas.

## Base y referencia

- Main revisado: `ebf7ac84acb957dd4aaca51d9e42f2e7b814b333`, confirmado también mediante GitHub durante la revisión.
- Referencia vigente según la regla fija del 28/10: `design/panel-nutri/v29/panel-trabajo.html`, SHA-256 `26e7172d9d95b95c71f8378287613395491a4b8dad438592d8e480af2c5cd839`.
- El original `PlanV-Boceto-v29.html` del repositorio coincide byte por byte con el archivo de Facundo: SHA-256 `eb03bc0a89425c85d3ce569a193b23f41102f143bef51b88500c013bf7fd1295`. La copia de trabajo incorpora las seis pantallas continuadas y es la referencia para la app; el original se conserva intacto.
- Datos de la API demo local en memoria y fixtures sintéticas de los comparadores. Sin cuentas, base ni datos clínicos reales.

## Diferencias que requieren trabajo

| Prioridad | Apartado | Evidencia y acción necesaria |
|---|---|---|
| Alta | Planes · Equivalencias | `PanelPlanes.tsx` muestra «Próximamente» en esa pestaña. El boceto dibuja el módulo. Hay que pasar su estructura y conectar la calculadora existente; el cartel no equivale al diseño. |
| Alta | Planes · Recetas | `onRecetas` abre `/crm/biblioteca?biblioteca=recetas`; el boceto conserva la sección dentro de Planes con lista y detalle. La comparación registra la ausencia de sus clases. No se certifica esa vista como v29. |
| Alta | Equipo | La matriz de permisos utiliza botones deshabilitados; Editar roles y Cambiar alcance también están deshabilitados en `PanelEquipoVistas.tsx`. El boceto permite esas acciones. El registro no tiene el detalle interactivo de los ejemplos. No basta con igualar colores. |
| Media | Estilos compartidos | Los botones de icono heredan en la app tamaño y relleno distintos del boceto. Se observan diferencias repetidas en `fontSize`, `paddingTop` y `paddingLeft`. Revisar la cascada y los resets antes de agregar excepciones por pantalla. |
| Media | Ficha | El muestreo de sus diez pestañas encuentra diferencias en disposición, espaciado y controles, además de estados que los datos de demo no dibujan. Clasificar cada caso antes de corregir; una etiqueta de otra paciente o un dato ausente no es por sí solo una regresión de diseño. |
| Media | Agenda y Página pública | Hay diferencias calculadas de alineación, separación y distribución de paneles. Las vistas de Página pública se recorren por separado; el calendario se mide en su semana inicial con turnos sintéticos. |
| Media | Asistente IA | `PanelAsistente.tsx` deja el gasto mensual en «Sin dato» y explica que no llega a esa pantalla. Es una integración incompleta respecto del panel del boceto, no una razón para inventar consumo. |
| Transversal | Otras pantallas | Inicio, Pacientes, Cobranzas, Mensajes, Seguimiento, Progreso, Alimentos, Biblioteca, Ayuda y Ajustes también tienen informes propios. Los resultados son muestras comparadas y candidatos para revisión, no una cantidad de errores de producto confirmados. |

## Problemas corregidos en el verificador

1. **Inter podía faltar sin que el control lo detectara.** Se comprobó una página con `document.fonts` vacío y `document.fonts.check('400 16px Inter') === true`; Chromium usaba DejaVu Sans. Por eso la primera ejecución que marcó 62 piezas distintas queda descartada como evidencia cuantitativa de paridad. El comparador ahora sirve los mismos archivos locales Inter 300–600 que importa la app y exige las cuatro caras cargadas. No se cambió el HTML de referencia para conseguirlo.
2. **Una pieza ausente podía aprobarse.** Ahora queda como «no encontrada», requiere clasificar estructura/estado/datos y produce salida fallida. No se interpreta automáticamente como «sin dato» aceptado.
3. **Faltaban pantallas y vistas.** Se agregan Inicio, Pacientes con resumen abierto, Agenda, Equipo, Ajustes, las diez pestañas de Ficha y escenarios separados de editor y Recetas. Mensajes recorre sus tres pestañas. Se conservan las nueve pantallas ya cubiertas.
4. **Un fallo perdía el avance.** Los errores se guardan por vista y el recorrido continúa. La comparación de estilos se agrupa en una lectura por página para evitar cientos de intercambios por vista.
5. **Límites explícitos.** Los informes dicen «muestreo de estilos». Se compara la primera combinación visible de etiqueta, clases y estado, incluyendo interlineado, márgenes y configuración de grilla. Esto no demuestra identidad de todo el árbol ni orden de todos los elementos repetidos.

## Resultados por escenario

**16 pantallas, 18 escenarios y 78 vistas recorridas en total entre claro y oscuro.** 0 bloqueos de recorrido tras el reintento del editor.

| Escenario | Oscuro: iguales / distintas / no encontradas | Claro: iguales / distintas / no encontradas |
|---|---|---|
| Ficha · 10 pestañas | [566 / 90 / 239](../../design/panel-nutri/v29/clases-ficha-dark.md) | [568 / 90 / 237](../../design/panel-nutri/v29/clases-ficha-light.md) |
| Inicio | [82 / 10 / 17](../../design/panel-nutri/v29/clases-inicio-dark.md) | [82 / 10 / 17](../../design/panel-nutri/v29/clases-inicio-light.md) |
| Pacientes · resumen abierto | [60 / 9 / 19](../../design/panel-nutri/v29/clases-pacientes-dark.md) | [60 / 9 / 19](../../design/panel-nutri/v29/clases-pacientes-light.md) |
| Planes · editor inicial | [61 / 17 / 33](../../design/panel-nutri/v29/clases-planes-editor-dark.md) | [61 / 17 / 33](../../design/panel-nutri/v29/clases-planes-editor-light.md) |
| Planes · Recetas | [0 / 2 / 30](../../design/panel-nutri/v29/clases-recetas-dark.md) | [0 / 2 / 30](../../design/panel-nutri/v29/clases-recetas-light.md) |
| Agenda · semana | [53 / 12 / 5](../../design/panel-nutri/v29/clases-agenda-dark.md) | [53 / 12 / 5](../../design/panel-nutri/v29/clases-agenda-light.md) |
| Equipo · 3 vistas | [53 / 14 / 47](../../design/panel-nutri/v29/clases-equipo-dark.md) | [53 / 14 / 47](../../design/panel-nutri/v29/clases-equipo-light.md) |
| Ajustes · 5 vistas | [108 / 21 / 29](../../design/panel-nutri/v29/clases-ajustes-dark.md) | [108 / 21 / 29](../../design/panel-nutri/v29/clases-ajustes-light.md) |
| Planes · lista, plantillas y equivalencias | [35 / 15 / 52](../../design/panel-nutri/v29/clases-planes-dark.md) | [35 / 15 / 52](../../design/panel-nutri/v29/clases-planes-light.md) |
| Página pública · 3 vistas | [115 / 18 / 25](../../design/panel-nutri/v29/clases-publica-dark.md) | [115 / 18 / 25](../../design/panel-nutri/v29/clases-publica-light.md) |
| Cobranzas | [52 / 5 / 15](../../design/panel-nutri/v29/clases-cobranzas-dark.md) | [52 / 5 / 15](../../design/panel-nutri/v29/clases-cobranzas-light.md) |
| Mensajes · 3 vistas | [70 / 7 / 73](../../design/panel-nutri/v29/clases-mensajes-dark.md) | [70 / 7 / 73](../../design/panel-nutri/v29/clases-mensajes-light.md) |
| Seguimiento | [27 / 2 / 4](../../design/panel-nutri/v29/clases-seguimiento-dark.md) | [27 / 2 / 4](../../design/panel-nutri/v29/clases-seguimiento-light.md) |
| Progreso | [34 / 3 / 21](../../design/panel-nutri/v29/clases-progreso-dark.md) | [34 / 3 / 21](../../design/panel-nutri/v29/clases-progreso-light.md) |
| Asistente IA | [29 / 2 / 3](../../design/panel-nutri/v29/clases-asistente-dark.md) | [29 / 2 / 3](../../design/panel-nutri/v29/clases-asistente-light.md) |
| Alimentos | [36 / 2 / 3](../../design/panel-nutri/v29/clases-alimentos-dark.md) | [36 / 2 / 3](../../design/panel-nutri/v29/clases-alimentos-light.md) |
| Biblioteca | [17 / 3 / 9](../../design/panel-nutri/v29/clases-biblioteca-dark.md) | [17 / 3 / 9](../../design/panel-nutri/v29/clases-biblioteca-light.md) |
| Centro de ayuda | [24 / 4 / 4](../../design/panel-nutri/v29/clases-ayuda-dark.md) | [24 / 4 / 4](../../design/panel-nutri/v29/clases-ayuda-light.md) |

Cada enlace abre el detalle de los selectores y propiedades. Las columnas separan muestras iguales, distintas y no encontradas. No sumar las últimas dos columnas como si fueran errores confirmados: pueden depender de contenido, selección o fixtures. Los bloqueos son del recorrido y no prueban por sí solos que falte una función.

## Control de medidas del contrato existente

La repetición con Inter comprobada terminó con **4 detecciones, dos casos repetidos en ambos temas**: falta el selector de turno de consultorio `.ev.c` en la agenda de la cuenta de prueba, y el botón de la fila de Planes mide 26 px de alto frente a 27 px del boceto. El primer caso necesita revisar el dato/fixture y su clase, antes de declararlo un defecto de pantalla. El segundo es una diferencia de medida confirmada.

[Detalle completo de medidas](../../design/panel-nutri/v29/contrato-revision-main.md). Es un contrato acotado de piezas; no reemplaza el muestreo ampliado ni certifica las vistas que no mide.

## Qué queda fuera de la certificación

No se certifican todos los elementos del árbol, sus órdenes, los diálogos y cajones, todas las variantes de datos, los estados vacíos o de error, accesibilidad completa, ni móvil 390. El muestreo de Agenda no cubre Mes y Día. El editor se recorre en su estado inicial; no todos sus cambios Día/Semana, cajón IA o publicaciones. Las animaciones se desactivan para medir el estado final y mantienen sus pruebas propias.

La revisión visual integral en el navegador de la conversación no se realizó: no pudo acceder al servidor local. Los resultados de estilos provienen de Chromium de las herramientas locales de prueba. No se utilizan capturas anteriores para declarar paridad actual.

## Verificación y Regression Guard · paso 10

- **Flujos críticos:** no se cambia código de la app ni endpoints. Inicio, navegación, ficha y planes siguen siendo los recorridos a preservar. Las 17 pruebas existentes de `panel-v29`, movimiento y `PanelPlanes` pasaron en tres archivos; eso no equivale a probar todas las funciones con sesiones reales.
- **Regresiones cubiertas:** comprobación de Inter realmente registrada; una ausencia ya no se aprueba; un bloqueo no descarta vistas anteriores.
- **Contratos revisados:** HTML/CSS de referencia ↔ selectores y estilos calculados; separación de las raíces de Planes y el catálogo de Recetas. Sin cambios de tipos ni contratos de API.
- **Áreas frágiles:** fuentes externas, estilos globales heredados y muestras de elementos repetidos. Se controla la carga real de fuente y se declaran los límites del muestreo.
- **Migraciones:** no aplica. Sin SQL, semillas ni configuración de producción.
- **Fire test:** al cambiar la página de referencia por una página sin Inter en un navegador de prueba, el detector exige y marca como faltantes los cuatro pesos, aunque `fonts.check()` solo devuelva `true`. Prueba aprobada mediante `npm run panel:fuentes:v29`.
- **Automatizaciones nuevas:** `panel:revision:v29` recorre todos los escenarios en ambos temas y guarda evidencia; `panel:fuentes:v29` se agrega al trabajo de navegador de CI antes de los e2e.
- **Tipos y compilación:** `npm run check` y `npm run build` finalizaron con éxito. Compilación con advertencia de tamaño de chunks. `git diff --check` sin errores. `check:secrets` informó `Secret boundary ok (unset)`; no se declara un escaneo completo de historia.
- **Suite general:** no quedó aprobada. La ejecución general registró un fallo en `server/clinical-processing/budget.postgres.test.ts`, prueba «rechaza exceso, duplicados y permisos directos; liquida sin liberar gasto incierto». Se interrumpieron ejecuciones que no terminaban. No se atribuye el fallo a estos cambios sin diagnosticarlo; ese archivo no fue modificado.
- **Revisión de código y realidad:** revisión independiente de las herramientas completada; los límites anteriores siguen impidiendo certificar coincidencia completa.
- **Veredicto: HOLD** para afirmar fidelidad completa o integrar esta entrega como un arreglo terminado del panel. Se entrega revisión y evidencia; la app conserva sus diferencias.

## Repetir

Con dependencias y Chromium de Playwright instalados, levantar API y Vite en demo local con las claves de Supabase vacías. Ejecutar `npm run panel:revision:v29` y `npm run panel:contrato:v29`. El comando de fuente no necesita servidores: `npm run panel:fuentes:v29`. En entornos con aislamiento de red por comando, los servidores y el comparador deben iniciarse dentro de la misma ejecución.
