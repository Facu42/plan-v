# Hoy / Up next (P3)

Rama `cursor/hoy-up-next-91ec`. Borrador. Sin merge, sin publicar y sin aplicar la migración.

El archivo de spec pedido (`planv-loop/2026-W45/05-spec.md`) no está en el repo. Esta nota sigue el pedido escrito: una acción humana por paciente, el clic abre la acción real, `done_at` al ejecutarla, vacío «Todo al día» y cero envíos automáticos.

## Qué ve la nutri

En Inicio, debajo de Consultas de hoy, hay una tarjeta **Hoy**. Como máximo una fila por paciente: mandarle un mensaje, ajustar el menú o proponer un turno. Si no hay nada, dice **Todo al día** y cuántas acciones hizo en 7 días.

La ficha muestra la misma fila, con el mismo botón. Consultas de hoy y «Para hacer hoy» siguen donde estaban.

Elegir la fila no manda nada. Abre el chat, el plan o el formulario de un turno nuevo. El mensaje sale recién con Enviar. El menú se anota recién al guardar o publicar. El turno se anota recién con Guardar turno. Ahí se guarda `done_at`.

## De dónde sale la acción

1. Si el copiloto ya dejó un mensaje, un ajuste de menú o un turno, se usa eso.
2. Si no, y hay fotos o comidas sin revisar (en la ficha o en la cola que ya existe), se propone un mensaje. El #267 no está en main y esta rama no depende de él.
3. Si la adherencia está entre 1 y 64 y hay un plan, se propone ajustar el menú.
4. Si está entre 65 y 79 y no hay turno próximo, se propone un turno.
5. Si la misma fuente ya se hizo en los últimos 7 días, no vuelve a salir.

No hay cron ni disparador que mande mensajes.

## Mapa de lo que ya había (paso 0, sobre main)

- `section.hoy` en Inicio es la tabla **Consultas de hoy**. No era un riel de acciones. Sigue igual y la tarjeta nueva va al lado, en el mismo bloque.
- «Todo al día» ya era el texto de la tarjeta oscura cuando la bandeja no tiene una fila elegida. El riel usa la misma frase cuando no hay acción.
- «Para hacer hoy» en la ficha es otra lista (notas, comidas, plan, laboratorio). No se vació.
- `up_next_title` / `up_next_body` viven en el brief del copiloto (`ai_briefs`). El contrato de la ficha ya pedía una sola acción y que el borrador no se envíe solo.
- La cola de trabajo ya trae comidas `pending_review` con id `meal:…`. El riel las puede usar. No se copió la confirmación de foto del #267.
- Seguimiento, el tablero de pendientes y el inicio de la paciente son otras pantallas. No se reescribieron.

## Persistencia

Migración `20261102160000_ai_brief_done_at.sql`: agrega `done_at` a `ai_briefs` y un índice. No borra filas. Para volver atrás: borrar el índice y la columna. **No está aplicada.** Sin la columna, el panel sigue mostrando el riel y el conteo queda en cero hasta la frase de Facundo.

En el modo demo la anotación queda en memoria y se borra al reiniciar.

## Informe del paso 10

- Flujos críticos verificados: una acción por paciente ✅; clic no envía ✅; anotar sin duplicar y sin tocar los mensajes ✅; paciente desconocida y cuerpo inválido ✅; ficha e inicio comparten el botón ✅; consultas de hoy siguen ✅.
- Regresiones cubiertas: el conteo de 7 días no acepta una fecha inválida; el cliente no puede mandar su propio `done_at`.
- Contratos revisados: acción `mensaje | ajuste_menu | turno`, `source_key` de 1 a 180, respuesta `{ hecho, hechos_7d }`.
- Áreas frágiles: Inicio y ficha se tocan con un bloque nuevo. Si la columna no existe en la base real, la escritura responde 501 y no manda el mensaje igual.
- Migraciones: aditiva, con reversión escrita. Sin aplicar.
- Fire test: se bajó la ventana de 7 días a 1. La prueba del conteo pasó de verde a rojo (esperaba 5 y dio 0). Se volvió a dejar en 7. ✅
- Automatizaciones nuevas: el manifiesto de migraciones incluye el archivo nuevo, así no queda solo en la memoria de alguien.
- Veredicto: **HOLD**. Falta la frase de Facundo para aplicar `done_at` y para juntar el PR.
