# Ficha v29 · parte 1 (armazón, diez solapas y Resumen)

Rama `claude/ficha-v29-armazon`, desde main `12ef4df` (Agenda ya juntada, #198). **Sin merge, sin producción y sin migraciones.** Espera el ok visual de Facundo.

La Ficha va en tres PR, uno por tema. Este es el primero. Copia el `#s-ficha` de `design/panel-nutri/v29/panel-trabajo.html` con el encabezado de Nutreando que quedó en el boceto (`.fh.ntfh`).

| PR | Qué | Estado |
|---|---|---|
| 1 | Encabezado, las diez solapas y el **Resumen** del boceto con datos reales. Las demás solapas conservan su contenido de siempre, ya dentro del marco nuevo. | Este PR |
| 2 | Historia clínica, Laboratorio y estudios, Mediciones. | Falta |
| 3 | Objetivos y hábitos, Consultas y notas, Plan, Registro alimentario, Archivos y Cobros. | Falta |

Archivos: `PanelFichaCabecera.tsx` (encabezado y solapas), `PanelFichaResumen.tsx`, `ficha-fx.tsx` (las piezas `fxP`, `fxRows`, `fxKv`… del boceto), `ficha-presentacion.ts` y `ficha-pendientes.ts` (todo lo que se calcula, sin React), `use-ficha-data.ts` (lo que se pide una sola vez por paciente), `ProfessionalPatientWorkspace.tsx` (arma todo), `panel-v29-app.css` (solo contra la hoja vieja). `PanelBocetoShell` ganó `header.bare` (la Ficha dibuja su propio encabezado, sin título ni buscador arriba) y `PanelBellContext` (la campana va dentro del encabezado de la ficha).

## Las diez solapas

Orden del boceto tras el pedido de Facundo del 23/10 (Consultas tercera). Cada una abre la misma sección de siempre, así los enlaces viejos (`?seccion=…`) siguen andando.

| Solapa | Sección que abre | Número |
|---|---|---|
| Resumen | `resumen` | — |
| Historia clínica | `historia` | — |
| Consultas y notas | `consultas` (con acceso a `notas`) | 1 naranja si hay una nota por aprobar |
| Mediciones | `evolucion` | — |
| Objetivos y hábitos | `planificacion` (**provisorio**, ver abajo) | — |
| Plan | `plan` (con Plan semanal y Lista de compras) | — |
| Registro alimentario | `alimentario` | comidas por revisar |
| Laboratorio y estudios | `laboratorio` | naranja: valores fuera del rango del informe |
| Archivos | `archivos` | no se muestra hasta abrirlo |
| Cobros | `cobros` | — |

Solo se muestran los números que se conocen: no se inventan.

## De dónde sale cada dato del Resumen

| Pieza | Dato real |
|---|---|
| Encabezado | Nombre, iniciales, estado (el mismo de Pacientes), «Paciente desde», restricciones y alergias declaradas en el ingreso como etiquetas (sin ninguna: «Sin patologías declaradas»), última actividad de la app, avance del ingreso y permiso de atención. |
| Mosaicos Peso, Grasa, Cintura | Último valor, cambio contra la medición anterior y los últimos siete puntos. Sin medida: «Sin dato». El cambio va en verde si va hacia lo que pide el objetivo (por defecto, bajar). |
| Evolución del peso | Hasta seis pesos con fecha y la línea del objetivo si el objetivo trae kilos. Sin permiso de medidas, sin mediciones o con error lo dice con una fila (y reintento). |
| Qué cambió desde la última consulta | Avance del objetivo, días registrados esta semana, comidas por revisar, último laboratorio (con los valores alterados) y estado del plan. |
| Avance al objetivo | Medio círculo con (primer peso − peso de hoy) ÷ (primer peso − meta en kilos). Si el objetivo no trae kilos usa el avance que cargó la nutri; sin ninguno, «—». |
| Alertas | Valores de laboratorio fuera de rango, plan que vence en 7 días, comidas por revisar, semana sin registros (aclarando que no es incumplimiento), adherencia baja y fuentes que no se pudieron consultar. Sin alertas: «Sin alertas». |
| Para hacer hoy | Aprobar la nota, revisar comidas, armar o renovar el plan, revisar valores alterados. Sin tareas: «Nada pendiente por hacer». |
| Próximo turno | El turno de la ficha, con modalidad y si está confirmado. |
| Plan vigente | Estado y fechas del plan, y cuántas comidas tiene hoy. |
| Anamnesis | Puntos completos del ingreso (consentimiento, nombre, alergias, restricciones y envío), alergias y lo primero que falta. |
| Acuerdos de la última consulta | El resumen publicado o el borrador de la última nota. Sin nota: «Sin acuerdos cargados». |

**Valores alterados:** solo se marca baja o alta cuando el informe trae el rango en un formato inequívoco (`30 - 400`, `< 5`, `mín. 30`). Si no, no se interpreta. Los valores con «<» o «>» propios no se comparan.

## Qué cambió y por qué (valores por defecto elegidos)

Según la regla 12 de `CLAUDE.md`: lo que el archivo no dibuja se arma con sus piezas y se dice qué se eligió.

- **Datos y contacto** (cambiar de paciente, teléfono, consultas realizadas, asistencias): el boceto no lo dibuja y es función de Plan V. Va como un panel más debajo del Resumen, con las piezas del boceto.
- **Botón «+ etiqueta»**: no está, porque la función de etiquetas y grupos no existe (paso 5 de `pacientes-v29-siguiente.md`). No se dibuja un botón que no hace nada.
- **Lápiz de editar** en el encabezado: el boceto no lo dibuja; se conserva porque es la única forma de editar los datos de la paciente.
- **Grabar consulta**: ya no tiene botón propio en el encabezado. Está en Consultas y notas, a un clic de «Iniciar consulta».
- **Chat**: abre la conversación en el área de contenido (sin solapa marcada). El cajón lateral del boceto queda para el PR 3. El número del botón no se muestra: no hay conteo de mensajes sin leer.
- **Objetivos y hábitos** muestra por ahora la planificación nutricional que antes colgaba del Plan, que pasa a tener solo Plan actual, Plan semanal y Lista de compras. El PR 3 arma la solapa como el boceto.
- **«Después»** de Próximo turno (el segundo turno): no se muestra, la ficha trae un solo turno.
- **Celular**: las columnas se apilan con la marca `data-mk="1"` del boceto.
- **Gris, borde y tarjeta**: la hoja vieja redefine `--ink`, `--ink2` y `--line` y agranda tarjetas y botones; en la Ficha vuelven los del boceto (mismo recurso que Pacientes y Planes).

## Comparación contra el boceto

`npm run local` y `node scripts/panel-v29-contrato.mjs --write` (informe en `design/panel-nutri/v29/contrato-informe.md`): las 21 piezas de la Ficha (encabezado, avatar, migaja, nombre, etiqueta, botones, solapas, mosaico, panel, fila, tarjeta oscura, medio círculo, datos en columna) salen **iguales en claro y oscuro**. Capturas en `docs/screenshots/ficha-v29/` (escritorio 1440 y celular 390, claro y oscuro, más las otras solapas dentro del marco nuevo). La única falla que queda en el contrato es la de Planes («Acción de la fila», 27 contra 26 px), anterior a este trabajo.

## Paso 10 · informe de Regression Guard

- **Flujos críticos verificados:** abrir la ficha desde Pacientes (contrato ✅ y capturas ✅); cambiar de solapa y que el enlace `?seccion=` siga igual (prueba de solapas ✅); revisar comidas pendientes, aprobar la nota, ver laboratorio y plan desde el Resumen (⚠️ cubierto por render con datos de ejemplo; los clics a otras secciones usan el mismo `change` de siempre); chat, notas, plan semanal y compras siguen alcanzables (⚠️ sin prueba de punta a punta propia: se verificó a mano con capturas de Plan, Mediciones y Chat); iniciar consulta con enlace seguro de videollamada (`secureMeetUrl`, sin cambios).
- **Regresiones cubiertas:** el Resumen no esconde bloques sin datos y dice «Sin dato» (prueba ✅); sin permiso de medidas lo dice en vez de dibujar una curva vacía (✅); si una fuente falla, avisa y ofrece reintentar (✅); sin vincular no ofrece el chat (✅); el avance nunca pasa de 0 a 100 y no se interpretan rangos ambiguos del laboratorio (✅).
- **Contratos revisados:** la ficha sigue usando las mismas llamadas (`careApi`, ingreso, laboratorio, notas, comidas, resumen del paciente); no se tocó el servidor ni `PATIENT_RECORD_SECTION_IDS`. `useFichaData` pide una vez lo que antes pedía solo el Resumen y ahora también lo usan el encabezado y las solapas.
- **Áreas frágiles:** (1) permisos de la paciente (medidas, estudios, atención): cada bloque dice qué permiso falta y nunca muestra datos sin él; (2) laboratorio leído del PDF: no se infiere nada fuera de un rango claro; (3) la hoja vieja `panel-boceto.css`: se contrarresta solo dentro de la Ficha.
- **Migraciones:** N/A.
- **Fire test:** se bajó el tope del avance de 100 a 99 en `avanceEnKilos`; la prueba «el avance nunca pasa de 0 a 100» se puso roja; se revirtió ✅.
- **Automatizaciones nuevas:** `PIEZAS_FICHA` en `scripts/panel-v29-contrato.mjs` compara 21 piezas con el boceto en cada corrida.
- **Veredicto:** HOLD hasta el ok visual de Facundo. Técnicamente SHIP (pruebas, tipos y contrato en verde).
