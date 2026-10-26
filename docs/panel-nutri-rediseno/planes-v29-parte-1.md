# Planes del panel, parte 1

26/10/2026. Solo la entrada del boceto v29 (`#s-planes` en `design/panel-nutri/v29/panel-trabajo.html`).

## Qué se ve

En `/crm/plan`, `/crm/plan?planes=todos` y `/crm/plan?planes=pedidos`:

- Título «Planes» y el texto «Organizá, armá y entregá los planes de tus pacientes».
- Secciones: Todos los planes, Plan de {nombre}, Recetas, Plantillas, Equivalencias.
- Listado con búsqueda, orden, filtros y la tabla (paciente, plan y objetivo, estado, semana, acción).
- A la derecha: tu próxima acción, pedidos de cambio y crear con el asistente.

Los botones (Nuevo plan, las secciones, los filtros, Crear plan / Abrir plan, la próxima acción y Elegir paciente y empezar) usan el mismo alto, el mismo relleno, la misma letra y los mismos colores que el boceto. El aviso de «Próximamente» no les cambia la forma.

Recetas abre `/crm/biblioteca?biblioteca=recetas`.

El estado sale del plan que ya guarda el consultorio. Si todavía no se pudo leer, se usa la semana de la ficha y no se inventa un borrador. Si la lectura falla, queda el aviso y «Reintentar». No hay un listado de pedidos de cambio: se muestra «No hay pedidos pendientes.» Un plan que cierra dentro de siete días dice «Por vencer». El boceto, con datos de ejemplo, dice «Vence el viernes»; eso no se copia.

## Qué no es esta parte

Los botones que abrirían el editor o el asistente dicen «Próximamente» y se quedan en el listado.

El editor que ya existía sigue en:

- `/crm/plan?paciente=…`
- `/crm/plan?editor=1` (el menú «Armar o editar»)
- `/crm/plan?paciente=…&propuesta=…`

### Parte 2 — editor del plan y de la semana

Queda afuera, tal como lo dibuja el boceto:

- Elegir paciente, meta, cuidados y la semana de comidas.
- Duplicar un día, porciones, fotos y los totales.
- Pestañas Comidas, Indicaciones, Compras, Versiones y Entrega.
- Plantillas (verlas, crearlas y aplicarlas) y la calculadora de equivalencias dentro de Planes.
- Deshacer, rehacer y las formas de empezar un plan (desde cero, desde una plantilla o copiando).

### Parte 3 — armado con IA y publicación

Queda afuera:

- El espacio del asistente y «Crear propuesta del plan».
- Revisar y publicar, la vista de la paciente, el PDF y programar la entrega.
- La lista de compras para descargar y aplicar un pedido de cambio.

Nada de esta parte le publica un plan a la paciente.

## Cómo probarlo

Entrá en modo demo a `/crm/plan`. Recetas tiene que abrir la Biblioteca. «Abrir plan», «Nuevo plan» y «Elegir paciente y empezar» avisan que llegan después. `/crm/plan?paciente=pat-sofia` sigue mostrando el editor de siempre.

## Informe del paso 10

- Flujos críticos verificados:
  - Listado, búsqueda, filtros y vacío: ✅ prueba de la pantalla y prueba de punta a punta.
  - Recetas → Biblioteca: ✅ prueba de punta a punta.
  - Editor viejo con paciente y con «Armar o editar»: ✅ prueba de punta a punta (el formulario del plan sigue).
  - Ficha «Abrir en el editor»: ⚠️ no se reescribió; sigue yendo a la ficha, no a esta pantalla.
  - Aislamiento entre consultorios: ✅ la lectura usa el plan profesional que ya existía, sin una vía nueva.
- Regresiones cubiertas: el enlace `/crm/plan?paciente=` sigue abriendo el editor. «Armar o editar» pasó a `?editor=1` para no tapar el listado, y el menú lo distingue.
- Contratos revisados: el plan profesional (`audience=pro`) se lee y no se guarda ni se publica desde esta pantalla. No hay tabla nueva.
- Áreas frágiles: el listado pide el plan de cada paciente. Si uno falla, ese queda con el dato de la ficha y aparece «Reintentar». El menú mira el parámetro `editor` para no marcar «Armar o editar» cuando estás en el listado.
- Migraciones: no hay.
- Fire test: ✅ se bajó el límite de «por vencer» de 7 a 3 días y la prueba del listado falló; se volvió a 7. En el arreglo de botones, el peso de «Crear plan» pasó a 700 y el navegador lo midió en 700 (el boceto está en 400); se volvió a 400.
- Automatizaciones nuevas: el contrato visual suma las piezas del listado y, desde este arreglo, el CTA, la acción de la fila, el filtro, el asistente y el orden (`npm run panel:contrato:v29`).
- Veredicto: SHIP de esta parte, con los botones del listado alineados al boceto después del rechazo visual. En el celular las dos columnas van una debajo de la otra para que la tabla no quede apretada.
