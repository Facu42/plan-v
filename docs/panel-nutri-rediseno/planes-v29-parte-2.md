# Planes del panel, parte 2

26/10/2026. El editor de la semana del boceto v29 (`#s-planes.pux-plan` en `design/panel-nutri/v29/panel-trabajo.html`). Parte desde main, con la parte 1 ya junta (#183). No reabre ese PR.

## Qué coincide con el boceto

En `/crm/plan`, «Abrir plan», «Crear plan» y «Nuevo plan» abren el editor adentro de Planes. No abren el formulario viejo.

Si la paciente todavía no tiene plan, se ven las cuatro formas de empezar y lo que ya está en su ficha (objetivo, plan B, foco, horario). «Empezar vacío» arma cuatro semanas, de lunes a domingo, con el día de hoy marcado. Un plan que ya está guardado muestra las semanas que tiene, juntas, al lado de los días. «Copiar de otra paciente» copia las comidas a un borrador nuevo. No copia sus datos personales.

Con la semana abierta se ve:

- La paciente, la meta diaria, el estado de trabajo y los cuidados.
- Las pestañas Comidas, Indicaciones, Compras, Versiones y Entrega, en ese orden. La tira es gris, con radio 9 y relleno 2. Comidas, cuando está elegida, es la pastilla blanca. La hoja vieja la había dejado crema y más redonda.
- Los días y las semanas (1, 2, 3 y 4 al empezar vacío; la activa en negro), el total del día y el resumen de al lado (energía, macros y el equilibrio de la semana).
- Cada comida se abre de a una. «Expandir todas» las abre juntas. La hora se ve. Cambiar o agregar un plato usa el mismo ícono del boceto.
- Duplicar un día reemplaza el día de destino.
- Las porciones, la nota y quitar una comida se guardan en el borrador. Deshacer y rehacer también.
- En la misma barra que Guardado y Asistente IA están «Guardar como plantilla», «Copiar a otra paciente» y «Ajustar metas». No hay un menú «Más».
- Indicaciones (recomendaciones y lo que hay que evitar), la lista de compras de la semana y las versiones. Restaurar una versión arma un borrador. No publica.
- Entrega muestra el control de comidas vacías y de días lejos de la meta, cuando hay calorías cargadas.

Los botones, los chips y las llamadas a la acción del editor y de «cómo empezar» miden igual que el boceto: mismo alto, mismo relleno, misma letra, mismo tracking y el mismo negro o el mismo borde. La letra del panel sigue en Inter 300–600.

Si no hay meta, dice «Sin dato» o «sin meta cargada». Si no hay cuidados cargados, el chip dice «Sin cuidados cargados». No se inventan números ni «Sin gluten» como dato de la paciente.

## Qué queda para después

### Parte 3

Estos botones se ven como en el boceto y avisan que llegan después. No publican nada y no le llega nada a la paciente:

- Asistente IA y «Armar con el asistente».
- Revisar y publicar, y Ver entrega.
- Vista de la paciente, imprimir o guardar PDF, y programar la entrega.
- Descargar la lista de compras.
- Las radios App y PDF del resumen.

### Dentro de Planes, dejado a propósito

- Plantillas (la sección, elegir plantilla, guardar como plantilla y Nueva plantilla).
- Equivalencias dentro de Planes. La calculadora sigue en su módulo.
- Sumar o cambiar un plato, agregar colación y duplicar la semana completa. Las porciones de lo que ya está sí se editan.
- Guardar como plantilla y copiar este plan a otra paciente avisan que llegan después. El botón queda a la vista. Copiar desde otra paciente, al empezar, sí está. Ajustar metas abre la meta cuando el plan ya la tiene; si no, avisa que no está cargada.
- Una comida que cae después de las tres semanas que acepta el borrador no se guarda, y se avisa. El plan publicado no cambia.

El editor que ya existía sigue en `/crm/plan?paciente=…` y en `/crm/plan?editor=1`.

## Cómo probarlo

Entrá en modo demo a `/crm/plan`. Abrí una fila o tocá Nuevo plan. Si no hay plan, tocá Empezar vacío: tienen que verse las semanas 1, 2, 3 y 4, y en la barra «Guardar como plantilla», «Copiar a otra paciente» y «Ajustar metas», sin un menú «Más». Probá duplicar un día, abrir otra comida y las pestañas Indicaciones, Compras, Versiones y Entrega. Asistente IA y Revisar y publicar tienen que avisar que llegan en la parte 3. Recetas sigue abriendo la Biblioteca. `/crm/plan?paciente=pat-sofia` sigue mostrando el editor de siempre.

## Informe del paso 10

- Flujos críticos verificados:
  - Listado, búsqueda, vacío y Recetas → Biblioteca: ✅ prueba de punta a punta (4 recorridos de Planes).
  - Abrir plan, Plan de {nombre} y Nuevo plan entran al editor nuevo y no al formulario viejo: ✅ prueba de punta a punta.
  - Editor viejo con paciente y con «Armar o editar»: ✅ prueba de punta a punta.
  - Duplicar día, porciones, compras, versiones y la semana de lunes a domingo: ✅ pruebas del editor.
  - Publicar: ⚠️ no se llama. El botón avisa y no entrega el plan.
- Regresiones cubiertas: el enlace `/crm/plan?paciente=` y `?editor=1` siguen abriendo el editor viejo. La parte 1 del listado sigue midiendo igual en el contrato visual.
- Contratos revisados: guardar usa el mismo borrador del plan profesional (fechas, huso de Argentina, ítems y revisión). No se publica desde esta pantalla. No hay tabla nueva.
- Áreas frágiles: el editor pide el plan de cada paciente al entrar al listado. Si la paciente no tiene meta, no se inventa. Una comida sin calorías deja ese total en «Sin dato», no en una suma a medias. La semana vacía arranca el lunes aunque hoy sea domingo. Al empezar vacío se ven cuatro semanas; guardar sigue cortado a tres semanas, que es lo que ya aceptaba el borrador.
- Migraciones: no hay.
- Fire test: ✅ se hizo que duplicar un día no copiara nada y la prueba falló (el destino siguió en «Sopa» en vez de «Pollo al horno»). Se volvió a dejar la copia real.
- Automatizaciones nuevas: el contrato visual, en claro y en oscuro (`npm run panel:contrato:v29`), mide también cómo empezar (Armar con el asistente y Elegir plantilla) y, en la semana, la pestaña, el día, la semana activa, Día/Semana, Editar metas, el chip de cuidados, Asistente IA, deshacer, la hora y el botón de sumar a la comida. El menú «Más» salió de la barra, así que el contrato ya no lo busca.
- Fire test de los botones: ✅ se achicó a propósito el espacio del ícono de Asistente IA y el contrato lo marcó (6 px del boceto contra 4 px). Se volvió a dejar en 6 px. La tira de Comidas se redondeó a 14 px y el contrato la marcó (el boceto mide 9). Se volvió a dejar en 9.
- Fire test de las semanas y de la barra: ✅ se dejó el arranque vacío en una sola semana y la prueba pidió el 15 de noviembre en vez del 25 de octubre. Se volvió a poner «Más ···» en la barra y la prueba del editor lo marcó. Se volvió a dejar las cuatro semanas y las tres acciones a la vista.
- Veredicto: SHIP de esta parte, a la espera del ok visual de Facundo. Al empezar vacío se ven las semanas 1 a 4, y la barra muestra guardar como plantilla, copiar a otra paciente y ajustar metas, sin el menú «Más». 3.330 pruebas aprobadas y 2 omitidas. Tipos en verde. Contrato visual en verde, claro y oscuro. Cuatro recorridos de Planes en verde. En el celular las cuatro formas de empezar van una debajo de la otra, las cuatro semanas se ven juntas y las comidas no se pisan.
