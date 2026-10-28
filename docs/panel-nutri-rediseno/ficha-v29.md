# Ficha v29 · parte 1 (armazón, diez solapas y Resumen)

Partes 1, 2a, 2b, 2c y 3a **juntadas a main el 27/10** (#199 y #201 a #204, un solo cambio `a7dc819`) con el ok visual de Facundo. La tabla de Historia clínica ya está en la base. Registro alimentario va en su propio PR. Siguen Consultas y notas, Plan, Archivos, Cobros y el chat.

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
- **Botón «+ etiqueta»**: se desarrolló en un PR aparte (ver «Etiquetas por paciente» al final). Mientras la migración no esté aplicada en la base, el botón no se dibuja (la lectura falla y la ficha sigue sin etiquetas propias).
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

## Parte 2a · Mediciones

Solapa armada con el HTML del boceto (el de piezas `fx`): cuatro a cinco medidores, tabla con solapas, Evolución, Kerr y «Para {nombre}». Captura: `docs/screenshots/ficha-v29/mediciones-claro-app.png` (al lado, la del boceto). El contrato compara las piezas de Mediciones en claro y oscuro: todas iguales.

Valores por defecto elegidos:
- **Pliegues y fórmula**: Plan V todavía no carga pliegues; la tabla lo dice y el botón «Sin fórmula validada» queda apagado hasta que Verónica valide una fórmula.
- **Medidores**: IMC (peso y altura, categorías de la OMS), Grasa, Músculo, Cintura y Cintura/cadera. Sin dato muestran «—» y «Sin dato» o «Falta la altura»; las escalas son fijas.
- **Evolución**: pestañas Peso, Grasa y Cintura (el boceto trae Pliegues, que no existe); la línea de meta solo aparece si el objetivo trae kilos.
- **Kerr**: solo resultados cargados por la profesional, con la etiqueta «Resultados de la profesional». No se calcula nada automático.
- **Informe de mediciones y Fotos de progreso**: los botones llevan a Archivos.
- **Objetivos y hábitos** (meta y hábitos de la semana) pasan a la solapa Objetivos y hábitos; las medidas completas, evaluaciones clínicas y registros compartidos quedan debajo, plegados.

### Paso 10 · Mediciones
- **Flujos:** cargar medición, importar balanza (diálogos de siempre, sin cambios), cambiar solapas y gráfico (✅ prueba de render + contrato).
- **Regresiones cubiertas:** sin permiso de medidas lo dice y apaga los botones (✅); sin datos no inventa valores (✅); IMC solo con peso y altura (✅, 13 pruebas de cálculo).
- **Contratos:** sin cambios de servidor ni de API; mismos `careApi` y diálogos.
- **Migraciones:** N/A. **Veredicto:** HOLD hasta el ok visual de Facundo; técnicamente SHIP.

## Parte 2b · Laboratorio y estudios

Solapa armada con el HTML final del boceto (`FT.laboratorio`, el de las vistas «Valores» y «Por fecha»), con los valores revisados reales del laboratorio. Capturas: `docs/screenshots/ficha-v29/laboratorio-claro.png`, `laboratorio-oscuro.png` (con una fecha abierta) y `laboratorio-por-fecha.png`. El contrato compara 12 piezas en claro y oscuro (con un laboratorio de ejemplo simulado, porque la demo no trae informes): todas iguales.

Valores por defecto elegidos:
- **Estado (Bajo, Alto, Límite, Normal)**: solo con valor exacto y un rango del informe que se entienda («30 - 200», «< 5», «mín. 30»…). Con comparador o rango ambiguo se muestra «Sin rango»; nunca se interpreta de más. «Límite» = dentro del primer 10 % del rango, como el boceto.
- **Columnas**: las últimas tres fechas con análisis; tocar una fecha abre «Análisis del …» con cada valor y cómo cambió contra el anterior; «Por fecha» lista cada informe con sus valores, cuántos salen del rango y el botón Ver (el PDF de siempre).
- **Curva**: línea de tiempo real con la banda del rango del informe; sin eventos (medicación, dieta) hasta que exista la Historia clínica con fechas (parte 2c).
- **Agrupación por categoría** (Hierro, Vitaminas, Tiroides…): no se hace; Plan V no guarda la categoría de cada valor y no se inventa. Todos los valores van en una lista.
- **«Sugerencia de la IA» y «Aplicar al plan»**: no hay una función real detrás. En su lugar, cuando el valor elegido sale del rango, una nota «Para revisar» con el rango del informe, sin recomendar alimentos.
- **«Analizar con IA»**: no se dibuja, no tiene función real; la lectura por IA del PDF sigue en «Cargar análisis».
- **«De la consulta grabada»**: el bloque queda con un texto corto («Sin propuestas por ahora») hasta que se conecten las consultas grabadas con el laboratorio.
- **Pedidos de estudios**: lista los pedidos guardados (estudios, fecha y motivo). «Nuevo pedido» lleva a Archivos, donde ya se arma el pedido y su PDF. No hay estado «Por enviar / Recibido»: no se guarda.
- **Agregar valor a mano**, **Cargar análisis** y **Estudios adjuntos y revisión** conservan sus formularios; se abren arriba de la solapa.

### Paso 10 · Laboratorio
- **Flujos:** cargar análisis (lector de PDF), agregar valor a mano con informe de origen y confirmación profesional, ver el PDF, cambiar entre valores y fechas (✅ cálculo con 11 pruebas; los formularios y el visor no se tocaron).
- **Regresiones cubiertas:** sin permiso lo dice y apaga los botones (⚠️ cubierto por render en demo); resultados con comparador no se dibujan como exactos (✅); rango ambiguo → «Sin rango» (✅); otra paciente nunca aparece en la lista (✅).
- **Contratos:** sin cambios de servidor ni de API; mismo `clinicalWorkspaceApi.snapshot`.
- **Migraciones:** N/A. **Veredicto:** HOLD hasta el ok visual de Facundo; técnicamente SHIP.

## Parte 2c · Historia clínica

Solapa armada con el HTML final del boceto (`FT.historia`): índice de catorce temas, datos con fecha y origen que se editan en el lugar, «Dar de baja» (pasa a «Antes»), vista «Por fecha», «Ver cómo estaba» (la historia a una fecha) y los datos que cambian el plan. Capturas: `docs/screenshots/ficha-v29/historia-claro.png` y `historia-por-fecha-oscuro.png`. El contrato compara 10 piezas en claro y oscuro (con una historia de ejemplo simulada): todas iguales.

**Base de datos:** tabla nueva `patient_history_entries` (migración `20261027130000_patient_history_entries.sql`, solo agrega; no se borra nunca un dato, «dar de baja» completa la fecha). **No se aplicó nada en la base**: espera la frase de Facundo. Mientras tanto la API existe pero la tabla no, así que en producción la solapa mostraría el aviso de error con «Reintentar». Se junta después de aplicar la migración.

Valores por defecto elegidos:
- **Qué guarda cada dato:** texto (hasta 600 letras), «desde cuándo» (opcional), origen, fecha de carga, fecha de edición y, si se dio de baja, hasta cuándo y por qué. Hoy todo lo que se carga desde el panel queda como «Vos»; los otros orígenes (paciente en la app, importado, consulta grabada, formulario) ya existen en la tabla para cuando se conecten.
- **Permiso:** se lee y se escribe solo con el permiso de atención de la paciente (`care_relationship`), igual que los pedidos de estudios.
- **Lo que ya había** (respuestas del formulario de ingreso, historia importada, datos del primer día) no se copia a la tabla nueva: queda en el bloque «Respuestas del formulario, datos importados y primer día», debajo y abierto por defecto (así se revisa el ingreso sin buscarlo); «Ver respuestas» y «Formularios» lo abren.
- **«De la consulta grabada» (propuestas de la IA)**: el bloque queda con un texto corto, sin botones, hasta que se conecten las consultas grabadas con la historia. Nada entra solo.
- **«Datos que cambian el plan»**: junta lo vigente de Alergias, Diagnósticos, Medicación y Preferencias; no interpreta ni resume.
- **«Plantilla: General + Celiaquía»** y **«Mandar formulario»**: no se dibujan; no hay función real detrás.
- **«No aplica»** (Embarazo, etc.): no hay forma de marcarlo todavía; un tema sin datos dice «Falta completar».
- **Tema inicial:** Medicación y suplementos, como el boceto.
- **Dar de baja** no pide motivo (el boceto tampoco); queda con la fecha de hoy.

### Paso 10 · Historia clínica
- **Flujos:** agregar, editar y dar de baja un dato, ver por fecha y cómo estaba a una fecha (✅ 6 pruebas de la API en memoria, 8 de cálculo y 4 de pantalla; recorrido a mano con capturas).
- **Regresiones cubiertas:** sin permiso de atención no lee ni escribe (✅); otra paciente → 403 (✅); campos de más o temas inventados → 400 (✅); un dato dado de baja ya no se puede cambiar (✅); lo dado de baja nunca desaparece (✅).
- **Contratos:** rutas nuevas `/api/crm/patients/:id/history` (GET, POST, PATCH `/:entryId`, POST `/:entryId/end`); no se tocó ninguna existente. Falta una prueba de la política de filas contra Postgres: se corre al aplicar la migración.
- **Áreas frágiles:** (1) permisos por paciente y por consultorio (`scheduling_can_manage`); (2) contenteditable: se guarda al salir del campo o con Enter; si el servidor falla, el aviso queda a la vista y el texto escrito no se pierde de pantalla.
- **Migraciones:** una, aditiva, sin `DROP`. **Veredicto:** HOLD: espera la frase de la base y el ok visual de Facundo. Técnicamente SHIP una vez aplicada.

## Parte 3a · Objetivos y hábitos

Solapa armada con el HTML de `objetivos:` del boceto (dos columnas: Objetivos y Hábitos de la semana a la izquierda; Energía y Síntomas a la derecha), con lo que la paciente carga en su app. Capturas: `docs/screenshots/ficha-v29/objetivos-claro.png` y `objetivos-oscuro.png` (paciente de la demo con registros de ejemplo de hábitos, energía y síntomas). El contrato compara 6 piezas en claro y oscuro; todas iguales.

Valores por defecto elegidos (lo que el boceto dibuja y Plan V no tiene):
- **Objetivos:** Plan V guarda **un solo objetivo** por paciente, con avance declarado por la profesional (no se calcula del peso). Se dibuja ese objetivo con su anillo; «Actualizar» (o «Agregar» si no hay) abre el editor de siempre y el historial queda en un desplegable. Los otros cuatro objetivos del boceto («se actualizan solos») no existen todavía y **no se inventan**.
- **Hábitos de la semana:** Agua (promedio de vasos de los días con registro; meta de la paciente), Sueño (promedio de horas; referencia fija de 7 h, porque no hay meta de sueño por paciente), Actividad (días con actividad cargada en los últimos 7; pide el permiso de atención) y Energía (último registro). Sin registro dicen «—», nunca un cero inventado. Pasos y litros no se dibujan: no hay dato.
- **Energía en vez de Ánimo:** el boceto muestra el ánimo de 1 a 5; la app solo guarda energía Alta, Media o Baja. Se dibujan los 14 días en tres niveles y el promedio de 1 a 3. El bloque queda aunque no haya datos.
- **Síntomas:** los que la paciente marcó en 14 días, del más repetido al menos; sin ninguno, un texto corto. No se dibuja el «cuándo» del síntoma («después del almuerzo»): no se guarda.
- **«Relación que ve la IA»:** no se dibuja; no hay función real detrás.
- Debajo sigue la «Planificación nutricional» de siempre (metabolismo, gasto, meta), con la letra del resto del panel (SF Pro); la solapa se arma sin el margen extra de las pantallas anteriores, igual que Mediciones.
- **Energía del último registro:** se muestra como Alta, Normal o Baja.

### Paso 10 · Objetivos y hábitos
- **Flujos:** actualizar/agregar el objetivo (editor existente, sin cambios); lectura de hábitos, energía y síntomas (✅ 7 pruebas de cálculo y 2 de pantalla).
- **Regresiones cubiertas:** sin permiso de atención la actividad dice «—»; sin registros no hay ceros inventados; objetivo vacío ofrece «Agregar».
- **Contratos:** ninguna ruta ni tabla nueva; solo lectura de datos que ya llegan. Se quitó `PanelPatientObjetivos` (sin otros usos).
- **Áreas frágiles:** el promedio de energía mezcla etiquetas; un valor viejo fuera de Alta/Media/Baja (por ejemplo «Buena» en la demo) se muestra como texto en el último registro pero no cuenta en la columna.
- **Migraciones:** ninguna. **Veredicto:** HOLD hasta el ok visual de Facundo; técnicamente SHIP.

## Etiquetas por paciente (botón «+ etiqueta», PR aparte)

Rama `claude/etiquetas-paciente`. Facundo pidió que los botones del boceto sin función se desarrollen; este era el único de la Ficha.

- **Pantalla:** el cajón «Etiquetas de Sofía» del boceto (`#actw`, chips `.ach`, campo «Nueva etiqueta», Guardar). Las propias van primero (las dos primeras en azafrán, el resto en gris, como el boceto) y después las alergias y restricciones del ingreso. Hasta 8 por paciente, 30 letras cada una, sin repetidas (no distingue mayúsculas).
- **Servidor:** `GET/POST /api/crm/patients/:id/tags` y `DELETE …/tags/:tagId` (`server/crm/patient-tags.ts`). Solo profesionales y solo pacientes del consultorio. En demo guarda en memoria.
- **Base:** tabla nueva `patient_tags` (`supabase/migrations/20261027120000_patient_tags.sql`), aditiva, con RLS por consultorio. **Aplicada en la base el 27/10** (con su frase; verificada: tabla y 3 políticas). Antes esperaba la frase escrita de Facundo. Hasta entonces, en producción el botón no aparece.
- **Pendiente ligado:** mostrar y filtrar por etiqueta en Pacientes.
- **Paso 10:** flujos (agregar, quitar, repetida, tope, otra paciente) cubiertos por `patient-tags.integration.test.ts` y `PanelFicha.test.tsx`; migración: aditiva, sin DROP, manifiesto de release actualizado; fire test N/A (sin umbral numérico nuevo salvo el tope de 8, cubierto por prueba).
## Parte 3b · Registro alimentario

Rama `claude/ficha-v29-plan-registro`. Copia `alimentario:` del boceto (con el panel de Nutreando) con las comidas reales que carga la paciente. Archivos: `PanelPatientFoodDiary.tsx` (misma carga, filtros, «Cargar más» y revisión de antes), `ficha-alimentario.ts` (promedios y calorías por día).

- **Tabla:** cuándo (comida y fecha), qué comió (foto o ícono y descripción), estimado (`~420 kcal`, con «Estimado por IA» si corresponde), estado y el botón «Revisar» / «Ver revisión» que abre la misma revisión de siempre. Filtros Todo, Por revisar, Revisadas y Últimos 7 días / Mes / Todo.
- **Calorías por día:** columnas de los últimos 7 días con las estimaciones; el día sin estimaciones queda en cero y sin ninguna estimación dice «Sin estimaciones de calorías». Sin meta: Plan V no guarda una meta diaria, así que no se dibuja la línea de meta del boceto.
- **Promedio:** calorías y reparto de proteínas, carbohidratos y grasas (barras = parte de las calorías, no «contra la meta»), solo con los registros ya cargados.
- **Registro de la semana** en lugar de «Registro pedido» del boceto: el anillo y los datos son los reales (días con registro, comidas, por revisar).
- **Valores por defecto elegidos:** la columna «Contra el plan» del boceto se llama «Estado», porque Plan V no compara cada comida con el plan; muestra Por revisar / Revisada / Ajustada. «Lo que ve la IA» dice «todavía no hay observaciones» hasta que exista esa lectura.
- **Botones con función (pedido de Facundo del 27/10):** «Descargar» baja las comidas cargadas como planilla CSV (separada por «;», con acentos para Excel, sin que un texto pueda leerse como fórmula). «Pedir registro» abre el cajón del boceto (días 7 o 14 y qué comidas cargar) y manda el pedido por el chat de la app, igual que en Seguimiento (nunca WhatsApp). De paso se corrigió Seguimiento: su «Pedir registro» mandaba un identificador que el servidor rechazaba.
- **Contrato:** `PIEZAS_ALIMENTARIO` en `scripts/panel-v29-contrato.mjs`, 7 piezas iguales en claro y oscuro. Capturas: `docs/screenshots/ficha-v29/alimentario-claro.png`, `-oscuro.png`, `-celular.png`.
- **Paso 10 · Regression Guard:** flujos tocados: ver registros, filtrar por estado y período, cargar más, reintentar, revisar una comida (mismas llamadas que antes). Pruebas nuevas: `ficha-alimentario.test.ts` y el cajón en `PanelFicha.test.tsx`; en el navegador de demo se bajó la planilla y se mandó el pedido. Migraciones: ninguna. Áreas frágiles: promedios con registros sin estimación (no inventan datos). Veredicto: HOLD hasta el ok visual de Facundo; técnicamente SHIP.

### Ajuste del 28/10 · Registro alimentario igual al código del boceto
Se comparó el árbol del boceto contra el de la app elemento por elemento (regla fija del código). Cambios: el interlineado queda «normal» como en el boceto; el encabezado tiene un solo grupo de solapas (Todo / Por revisar) más Descargar y Pedir registro, con la separación de 6 px entre ícono y texto; el período (últimos 7 días, último mes, todo) se cambia tocando la leyenda; «Calorías por día» muestra la meta y «Promedio de la semana» compara con la meta calculada cuando existe; el bloque «Hábitos, actividad y vista anterior» pasó debajo de las columnas; la tabla se desplaza dentro de su tarjeta. Queda como valor por defecto «Registro de la semana» en lugar de «Registro pedido» (no se guarda el pedido) y la columna Estado en lugar de «Contra el plan».
