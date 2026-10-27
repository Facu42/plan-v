# Pacientes v29

Rama `claude/pacientes-v29`, desde main `9f11908` (con Inicio ya juntado). **Sin merge, sin producción y sin migraciones.** Espera el ok visual de Facundo.

Pacientes copia el `#s-pacientes` de `design/panel-nutri/v29/panel-trabajo.html`: título «Pacientes · N activas» con la línea de adherencia, objetivos y sin registrar; Importar y Nueva paciente arriba; solapas con su cantidad; chip de orden; tabla (Paciente, Patologías, Avance, Adherencia, Próxima consulta, Estado) y el resumen que se despliega hacia abajo con tres bloques: perfil y acciones, peso, avance y adherencia, y próximo turno con lo reciente.

Archivos: `PanelPacientes.tsx` (tabla y detalle), `pacientes-presentacion.ts` (todo lo que se calcula, sin React), `ShowroomPatients.tsx` (estado, altas, importar, editar, archivar, invitar), `panel-v29-app.css` (solo contra la hoja vieja y movimiento). Se borró la tabla vieja (`PanelPatientsTable`) y su CSS.

## De dónde sale cada dato

| Pieza | Dato real |
|---|---|
| Título y línea de arriba | Pacientes activas; promedio de adherencia de las que tienen registros; objetivos logrados este año (`goal_status` completo con fecha de este año); activas con 0 días registrados esta semana. |
| Solapas | Todas = activas. Necesitan atención = registros por revisar o adherencia menor a 70 % con registros. Primera vez = con turno y sin ninguna consulta hecha. Plan por vencer = plan publicado o programado que termina en 7 días o menos (necesita el plan de cada una: hasta que llega dice «—»). Inactivas = archivadas o desactivadas. |
| Solapa «Sin vincular» | **No está en el boceto.** Aparece solo si hay alguna paciente sin cuenta (o si se entra con ese filtro desde otro lado): conserva el filtro «Acceso pendiente» que ya existía. |
| Orden | El chip rota entre Próxima consulta, Nombre y Menor adherencia (antes era un menú; mismas tres opciones). |
| Fila | Objetivo de la ficha; avance = porcentaje de la ficha con el último peso; adherencia de la paciente; próxima consulta («Hoy 10:30», «Mañana», «Vie 30, 7:00», «4/11»); último registro de comida u hábito; estado y, si debe, la cuota debajo («Vencida», «Vence hoy»). |
| Detalle · peso | Últimas 10 mediciones de peso (ficha de cuidados), con variación primera a última y línea de objetivo si el objetivo escrito trae «NN kg». |
| Detalle · avance | Porcentaje de la ficha; «faltan X kg» solo con peso y objetivo en kilos. |
| Detalle · adherencia | Número = adherencia de la paciente. Columnas = comidas registradas por día en los últimos 7 días, contra 4 por día (desayuno, almuerzo, merienda y cena). |
| Detalle · próximo turno | Turno de la ficha, modalidad y si está confirmado. Debajo, tres hechos reales: último registro, última consulta hecha, estado del plan. La nota es el resumen de la última consulta publicada. |

## Qué no se copió del boceto (no hay dato o no hay función)

- **Patologías**: Plan V no guarda patologías en la ficha, así que cada fila dice «Sin declarar» y el detalle usa el texto vacío del propio boceto («Sin patologías declaradas · se completa en la historia clínica»). Cuando exista el dato, entra sin tocar el diseño.
- «34 años», «Paciente desde marzo 2019» (se usa el mes del alta real), «Celíaca / Hipotiroidismo», el delta de peso de cada fila y las notas inventadas de cada paciente.
- «Grupos» y «Etiquetas» del boceto: no existe la función.
- El buscador del encabezado (`.srch2`): el panel ya busca desde el menú de la izquierda.
- Salieron de la pantalla las cuatro tarjetas de resumen, la elección de columnas y densidad, y «Ir directo a» las 14 secciones de la ficha: el boceto no las dibuja (la ficha sigue teniendo sus secciones). El módulo `directory-columns` queda sin uso en la pantalla.
- **Acciones que el boceto no dibuja y se conservan** como enlaces chicos bajo los botones del detalle: Seguimiento, Editar, Archivar (con confirmación) o Restaurar, e Invitar (reemplaza a «Mensaje» cuando la paciente no tiene cuenta).

## Movimiento

Mismos tiempos de `openAnim`, sin librería, todo dentro de `prefers-reduced-motion: no-preference`:

| Pieza | En la app |
|---|---|
| Despliegue | Alto de 0 a su tamaño en .45 s (filas de la grilla) y cierre en .3 s al plegar o abrir otra; los tres bloques suben escalonados (.4 s, cada .08 s). |
| Peso | La curva se dibuja en 1 s, el área sube, los puntos aparecen de a uno (.04 s), el último con rebote, y el objetivo aparece con fundido. |
| Avance | El arco se llena en 1,1 s, las marcas aparecen escalonadas y el punto final rebota; el número cuenta hasta su valor en 1,1 s. |
| Adherencia | Las columnas crecen desde abajo (.6 s, cada .05 s), la línea de promedio se estira y el número de hoy sube. |
| Resto | Patologías entran de costado, la línea de hechos recientes también. |
| Quedó fuera | La cuenta de los números no se repite si se vuelve a abrir la misma paciente sin recargar la pantalla (cuenta una vez por apertura, como en el boceto). |

## Evidencia

- Capturas 1440 y 390, claro y oscuro, y el boceto: `docs/screenshots/pacientes-v29/`. Con datos de demo (4 pacientes).
- Suite con Node 22: **3.429 aprobadas y 4 omitidas**. `npm run check` y `npm run build` en verde.
- `panel:contrato:v29`: Pacientes con 19 piezas iguales al boceto, claro y oscuro (tarjeta, solapas, chip, encabezado, celda, avatar, estado, patología, barras, fila abierta, bloques, botones, números, turno, nota). Quedan las 2 fallas que **ya estaban en main** (altura de «Acción de la fila» en Planes, 27 contra 26 px). Informe en `design/panel-nutri/v29/contrato-informe.md`.
- Pruebas nuevas: `pacientes-presentacion.test.ts` (15), `showroom-patients.test.tsx` (14, reescrito para la tabla nueva y el movimiento). Se ajustó `showroom-empty-states.test.tsx` («Nueva paciente») y el recorrido de punta a punta 1 y los que abren fichas desde Pacientes (`e2e/recorridos.spec.ts`: ahora se abre la fila y se usa «Abrir ficha de …»). **Esos recorridos no se pudieron correr acá** (falta el navegador del runner); el mismo recorrido se hizo a mano con Playwright: alta de paciente nueva, fila abierta, «Abrir ficha» y filtro de atención.

## Regression Guard · paso 10

- **Flujos críticos:** alta con invitación, importar, editar, archivar/restaurar, invitar, abrir ficha/plan/mensaje/seguimiento desde la fila ✅ (mismas funciones, nueva ubicación). Búsqueda del menú sobre la lista ✅. Filtros desde otras pantallas (`?filtro=attention|archived|unlinked`) ✅ mapeados a las solapas nuevas.
- **Regresiones cubiertas:** adherencia 0 con registros ≠ sin registros; sin plan consultado no se cuenta «por vencer»; sin dato dice «Sin declarar», «Sin medir» o «—»; cuota que vence hoy no se lee como vencida.
- **Contratos:** `directory-summary` (plan y peso por lote de 50), `patients/:id/meals` (7 días), `care` (mediciones), `patients/:id/preview` (última consulta), tablero de cobros. Sin campos nuevos.
- **Áreas frágiles:** cada fuente del detalle falla por separado; si todas fallan el bloque dice «consultando…» o muestra los textos vacíos, nunca ceros inventados. Un fallo del tablero de cobros muestra «Cuota sin consultar».
- **Migraciones:** no hay.
- **Automatizaciones:** el contrato mide Pacientes en cada corrida.
- **Veredicto: HOLD** hasta el ok visual de Facundo. No se junta a main sin su frase.
