# Planes del panel, parte 3

26/10/2026. Asistente y publicación del boceto v29 (`#s-planes` en `design/panel-nutri/v29/panel-trabajo.html`), sobre el editor de la parte 2. Parte desde el avance que ya había en `work/planes-parte-3-ia-publicar`. [PR #185](https://github.com/Facu42/plan-v/pull/185). No se junta a main sola.

## Paridad con el boceto (los seis huecos)

En la misma rama y el mismo PR, el editor se acerca a `#s-planes` del boceto:

1. **Asistente del plan.** Un panel lateral con Chat e Historial de cambios, el selector «Cambios en» (día, comida o todo el plan), sugerencias y el campo «Pedile un cambio…». Cada propuesta se puede Aplicar o Descartar. Aplicar usa la misma API de borrador de siempre. Deshacer y el recorte a un solo día o una sola comida dicen «Próximamente»: el pedido sigue siendo de la semana visible.
2. **Armar con IA.** En el listado hay un chip que abre la pantalla «Un plan pensado para…»: pedido, cambiar paciente, tipo de alimentación, estrategia, necesidades clínicas, formato, medidas, qué incluir y los datos de la ficha con «No usar». «Crear propuesta del plan» pide la semana y la deja para revisar en el panel. Dictar, adjuntar y el gasto del mes (se ve «Sin dato», tope US$ 5) no inventan un resultado.
3. **Atajo.** En la columna derecha, «Asistente del plan» con «Ajustar con IA» abre ese panel.
4. **Compartir con la paciente.** En su app lleva a Entrega y no publica solo. El PDF abre el cuadro que ya existía. Mail e impreso dicen «Próximamente».
5. **Gestión del plan.** Nuevo plan, el asistente, plantilla, copiar a otra paciente, programar, ver como la paciente, versiones y ajustes. Lo que ya existía se usa. Plantilla, copia a otra paciente y programar siguen en «Próximamente».
6. **PDF.** Interruptores del boceto (logo, medidas caseras, lista, recetas, una semana por hoja) y dos botones, Descargar PDF e Imprimir. Los interruptores todavía no cambian el documento: se dice en la pantalla.

## Qué quedó cableado

En `/crm/plan`, con el plan de una paciente abierto:

- **Asistente IA**, **Armar con el asistente**, el panel lateral y **Crear propuesta del plan** piden una propuesta a la API que ya existía (`menu_draft`). La propuesta es de la semana que estás viendo, para no pasarse del tope de días y de comidas. El texto del pedido viaja como preferencia, recortado a lo que la API acepta. Si la aplicás, queda como borrador privado. No se publica y no se le avisa a la paciente. Sin el permiso «Borradores de menú con IA», el plan no cambia y se avisa.
- **Revisar y publicar** y **Ver entrega** abren la pestaña Entrega. El botón **Publicar plan revisado** está a la derecha, como en el boceto, y llama a `POST /api/plans/:id/publish` con la versión y la copia revisada. Antes hay que marcar que revisaste el plan. Si hay comidas vacías, no se habilita. Si el borrador de la pantalla no está guardado, primero se guarda y después se publica esa copia. Si otra sesión cambió el borrador, o hay una alergia o restricción, el servidor lo frena y el aviso queda en español. Si no hay cambios nuevos, no se vuelve a publicar.
- **Vista de la paciente** muestra el borrador del día. Dice que no se notificó ni se envió nada.
- **App** y **PDF**, en el resumen del día, cambian esa columna. App es la vista previa y aclara que no se envió. En PDF hay dos botones, **Descargar PDF** e **Imprimir**, y abren el mismo cuadro de imprimir o guardar que ya tenía Planes. **Descargar PDF** en la semana hace lo mismo. Si hay cambios sin guardar y no hay una copia publicada, pide guardar antes. No publica.
- **Lista de compras**, en Compras y en Entrega, baja un archivo de texto con las cantidades de la semana.

## Qué quedó vacío a propósito

- **Deshacer** un cambio del asistente, dictar el pedido, adjuntar una referencia, el mail, la copia impresa distinta del PDF, y que los interruptores del PDF cambien el documento. La pantalla los muestra y dice «Próximamente» o que todavía no modifican el archivo.
- El alcance «un día» o «una comida» no recorta la propuesta: la API arma la semana visible.
- «No usar» en un dato de la ficha solo lo saca de las preferencias de ese pedido. La ficha guardada igual la lee el asistente.
- El gasto de IA del mes no se inventa: dice «Sin dato» y el tope de US$ 5.
- **Programar entrega** y **Programar publicación** se ven, y al tocarlos dicen «Próximamente». Al publicar, la paciente ve el plan desde el inicio del período. Si ese día es más adelante, sigue con el plan anterior hasta entonces. No hay una fecha y una hora aparte, ni un envío automático.
- Plantillas, equivalencias dentro de Planes, sumar o cambiar un plato, agregar colación y duplicar la semana completa siguen con el aviso de la parte 2.
- El editor de siempre sigue en `/crm/plan?paciente=…` y en `/crm/plan?editor=1`.

En el demo, Sofía no tiene el permiso del asistente. Por eso «Elegir paciente y empezar» abre el editor y avisa el permiso: no arma ni publica un plan solo.

## Cómo probarlo

Entrá en modo demo a `/crm/plan`. En el listado, «Armar con IA» abre la pantalla del pedido; Dictar pedido dice «Próximamente»; «Volver al plan» vuelve al editor. Abrí el plan de Sofía. A la derecha están el atajo del asistente, Compartir y Gestión. «Ajustar con IA» abre el panel (Chat e Historial). En el resumen, pasá de Análisis a App y a PDF: tienen que verse los interruptores y, separados, Descargar PDF e Imprimir. En Entrega, la publicación queda apagada mientras haya comidas sin alimentos (en el demo falta la colación). Vista de la paciente, lista de compras y Programar entrega se prueban ahí. «Elegir paciente y empezar» tiene que avisar del permiso y no decir que el plan se publicó.

## Informe del paso 10

- Flujos críticos verificados:
  - Publicar un borrador revisado, una sola vez, con el aviso de que la paciente ya puede verlo: ✅ prueba del módulo.
  - Período que empieza más adelante: ✅ el aviso dice que sigue el plan anterior.
  - Conflicto de versión (409) y alergia declarada: ✅ no queda como publicado. En la pantalla, el mismo 409 se recorre con el plan de Sofía sin reemplazar el que ella ya ve.
  - Sin la marca de revisado, y con el plan ya publicado sin borrador nuevo: ✅ no se llama a publicar.
  - El asistente pide la propuesta, manda el pedido recortado y Aplicar no publica: ✅ prueba del módulo. Sin permiso, el plan no cambia.
  - Radios App y PDF, interruptores, Descargar PDF e Imprimir, panel del asistente, pantalla Armar con IA, vista de la paciente, lista y Programar entrega: ✅ recorrido de punta a punta.
  - Listado, editor viejo y Recetas: ✅ el recorrido de Planes que ya estaba, actualizado porque el asistente ya no dice «parte 3».
- Regresiones cubiertas: un borrador no se publica solo; una versión vieja no pisa la nueva; el enlace `/crm/plan?paciente=` y `?editor=1` siguen en el editor viejo.
- Contratos revisados: publicar manda `expected_version` y la copia revisada. La propuesta respeta el tope de 21 días y 42 comidas. No hay tabla nueva.
- Áreas frágiles: la paciente solo cambia de plan en el publicar explícito. Si el borrador de la pantalla difiere de lo guardado, se guarda antes de publicar esa copia. Imprimir relee el plan guardado. El demo no tiene el permiso del asistente, así que ahí la propuesta no se arma: es el mismo freno de siempre, no un plan publicado por error.
- Migraciones: no hay.
- Fire test: ✅ se sacó a propósito el recorte de 80 caracteres del pedido a la IA y la prueba lo marcó (llegó el texto entero). Se volvió a dejar el recorte. El freno de «ya lo revisé» sigue cubierto por su prueba.
- Automatizaciones nuevas: no hay un paso manual nuevo para publicar. Programar entrega no se inventó.
- Veredicto: SHIP de esta parte, a la espera del ok visual. Nada le llega a la paciente hasta Publicar plan revisado. 3.350 pruebas aprobadas y 2 omitidas. Tipos en verde. Seis recorridos de Planes en verde, incluidos el panel, el PDF separado y Armar con IA. La hoja generada del boceto sigue coincidiendo. No se volvió a medir el contrato visual: no se cambió el alto ni el relleno de los botones que mide (Asistente IA y Armar con el asistente).
