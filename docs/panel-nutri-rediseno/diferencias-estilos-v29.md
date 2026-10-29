# Punto 4: diferencias corregidas contra el código v29

Referencia: `design/panel-nutri/v29/panel-trabajo.html`, con el DOM que dibuja cada pantalla. Rama `work/recetas-equivalencias-v29`, [PR #233](https://github.com/Facu42/plan-v/pull/233). Se incorporó main `247a00d` antes de corregir. No se modifica el boceto ni la app de la paciente.

## Correcciones

| Pantalla | Dónde estaba la diferencia | Corrección |
|---|---|---|
| Compartidas | `.ibtn` y `.sw`: tipografía y relleno de botones sustituidos por la hoja general | Valores nativos de la fuente: 13,3333 px y relleno 1 px / 6 px. La regla de iconos del panel anterior se limita a ese panel, conservando colores propios de enviar/grabar/editor |
| Ficha, Historia clínica | `.pw-record` y `.hcx` sumaban relleno sobre el contenido | Ambos quedan sin relleno superior, como `#fwrap > .fx` en la fuente |
| Ficha | `.fxp .cbtn.sbtn` perdía la separación del icono | Separación de 6 px y SVG sin desplazamiento artificial |
| Equipo | La grilla `.fx` conservaba 14 px superiores por faltar el wrapper `#eqwrap` | Relleno superior 0, equivalente a la regla original |
| Ayuda | Variables de bordes del panel anterior filtradas al contenedor | Hereda `--line` y `--line2` de v29; borde oscuro `#26272D` |
| Planes, listado | Botones `.r29-table .sbtn` forzados a flex y SVG desplazado | Botón y SVG en línea como en la fuente, sin modificar los botones flex del editor |
| Página pública | `.pubhr.pubev` se alineaba al inicio cuando tenía hasta tres filas | `space-around` también con pocas filas, tal como v29 |
| Cobranzas, Mensajes y Página pública | La clase React `.sxw` activaba el recorte de las seis pantallas nuevas del boceto | `.fxp.g` recupera `overflow:visible`; las listas `.fxs` conservan su propio desplazamiento |

## Rectificación del informe anterior

La auditoría inicial agrupó por etiqueta y clases. Cuando la app mueve el encabezado fuera de la pantalla o usa otra etiqueta semántica, algunos selectores genéricos enfrentan elementos distintos. Estas muestras no justifican cambiar el diseño:

| Muestra anterior | Qué comparaba | Valor correcto |
|---|---|---|
| Mensajes, pestaña 9 / 6 px | `#mview` del encabezado contra `#mfil` de filtros | `#mfil` tiene 6 px también en el boceto; comprobado por ID |
| Ayuda, gris / lima | Buscar del encabezado contra un tema seleccionado | El tema seleccionado es lima en ambas implementaciones |
| Planes, distribución de `.tabs` | Menú superior `div#pview` contra filtro interno; en React el menú es `nav#pview` | Comparar la misma función por ID, sin sustituir estilos del filtro |
| Inicio, textos grises / claros | Consulta terminada contra consulta pendiente | Depende del estado real |
| Pacientes y Agenda, selección y fondos | Fechas, filas o celdas en estados distintos | Comparar con el mismo estado; `normal` / `stretch` tampoco prueba por sí solo una diferencia visible |
| Progreso, fondo de fila | Fila normal contra fila elegida | El estado `.on` determina el fondo |

La medición inicial de 62 dimensiones no era válida porque faltaba Inter en la fuente. El nuevo recorrido carga los pesos 300–600 localmente y desactiva la escala de `#stage` antes de medir. La altura usa tolerancia de 0,6 px, igual que el contrato general; los otros valores se comparan exactamente.

## Adaptaciones que se conservan

En Agenda, las tarjetas laterales usan flex y la lista de lugares libres tiene scroll para conservar acceso con datos reales largos. En Equipo y Ajustes también hay desplazamiento de columnas. Son adaptaciones explícitas de funcionamiento, no errores de color o relleno. No se eliminan automáticamente a partir de una muestra genérica.

No se cuentan como defectos el color de un avatar de otra paciente, textos/cantidades reales, márgenes que dependen del contenido ni piezas sin datos. Los informes originales de medición siguen disponibles en el [commit de auditoría](https://github.com/Facu42/plan-v/tree/d85804d4ac1ec7173890ad72a6c7a12f411361fa/design/panel-nutri/v29).

## Verificación

`e2e/estilos-punto4-v29.spec.ts` compara la app real con el HTML ejecutado del boceto, en claro y oscuro: controles, Historia, Equipo, Ayuda, Mensajes, distribución pública y fila de Planes. Para el caso de pocas filas se reducen ambas listas a dos entradas de prueba. No usa imágenes como fuente de valores ni escribe en producción.

El resultado final y el informe de Regression Guard están en [Recetas y Equivalencias](recetas-equivalencias-v29.md).
