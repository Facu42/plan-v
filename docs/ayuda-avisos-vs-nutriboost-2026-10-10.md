# Centro de ayuda, campana de avisos y buscador global vs. Nutriboost (2026-10-10)

Rama `claude/centro-ayuda`. Alcance: dashboard profesional web, escritorio, diseño Nutrigo. Academy excluida; móvil sin ampliar.
Evidencia: capturas del demo en `nutriboost-capturas/` (video Loom sin audio, pacientes ficticios). Sin cuentas, sin producción, sin migraciones.

## Estado real antes de este cambio

- Campana de la barra: ya existía (`ShowroomConsultAlerts`): consultas próximas, registros de seguimiento, recordatorios y preferencias. No tenía sección «Mensajes».
- Buscador global: no existía. Sólo había buscadores por pantalla.
- Centro de ayuda: no existía; figuraba «en preparación» en `professional-modules.ts`.

## Qué se hizo

| Pieza | Archivos | Origen |
| --- | --- | --- |
| Centro de ayuda: portada con buscador y categorías, resultados con «N resultados para «…»», artículo con ruta, pasos, relacionados y botón a la pantalla | `src/components/nutrigo/help/*`, ruta `/crm/ayuda` | Buscador y tarjeta de resultado: visto. Portada, categorías, artículo, listado por categoría: propuesta propia |
| 16 artículos reales sobre funciones que existen hoy | `help/help-articles.ts` | Propuesta propia (el contenido de Nutriboost no es visible) |
| Mensajes en la campana: «Mensajes», «Sin mensajes nuevos», «Ver todos los mensajes» + conversaciones con no leídos | `MessageNotices.tsx`, `message-notices.ts` | Desplegable y enlace: visto. Lista por paciente: propuesta propia |
| «Marcar los avisos de consulta como listos» | `consult-alerts.ts`, `ShowroomConsultAlerts.tsx` | Propuesta propia |
| Buscador global agrupado: Pacientes, Recetas, Alimentos, Ayuda | `GlobalSearch.tsx`, `server/search/*`, `GET /api/search` | Barra y texto: visto. Resultados agrupados: propuesta propia (no verificado en el video) |

## Visto / narrado / propuesta propia / no verificado

| Tema | Estado | Evidencia |
| --- | --- | --- |
| Cabecera «¿En qué te damos una mano?» y buscador | Visto | `loom-9m01-centro-de-ayuda.jpg`, 9:01 |
| «N resultado(s) para …» y tarjeta con categoría + pregunta + línea de respuesta | Visto | 9m01 |
| Subtítulo «respuestas paso a paso y con capturas» | Visto; Plan V no incluye capturas todavía, el subtítulo omite «con capturas» | 9m01 |
| Categorías sin buscar, listado por módulo, artículo abierto | No visto; propuesta propia | LEEME.md |
| Más de 90 artículos | Anunciado, no visto; acá hay 16 | `plan-desarrollo…v3.md` §14.6 |
| Desplegable «Mensajes / Sin mensajes nuevos / Ver todos los mensajes» | Visto | `loom-9m23-notificaciones-mensajes.jpg`, 9:23 |
| «Marcar como leídas» | No visto. Para mensajes NO se implementó (ver decisiones); para avisos de consulta, propuesta propia | 9m23 |
| Barra «Buscar pacientes, recetas, alimentos…» con texto escrito | Visto | `loom-9m28-buscador-global.jpg`, 9:28 |
| Resultados agrupados del buscador | No verificado: la lista no aparece en 9:28 ni 9:31; sólo la menciona la guía | LEEME.md |
| Mensajes: lista, buscador, «+ Nueva» | Visto; no se tocó en este cambio | `loom-5m07-mensajes.jpg`, 5:07 |
| Adjuntos, leído, fechas por mensaje | No visto | 5m07 |

## Aislamiento por consultorio

- `GET /api/search` toma el consultorio de la sesión (nunca del cliente). Exige rol profesional: una sesión de paciente o de administrador sin consultorio recibe 403, así que el administrador comercial no obtiene resultados clínicos.
- Pacientes: sólo fichas activas del consultorio. La respuesta trae `id`, `name` y `href`; sin notas, mensajes ni datos de salud.
- Alimentos y recetas: se leen con los mismos accesos que sus catálogos (filtrados por la base).
- Mensajes de la campana: usan la bandeja existente (`/api/crm/work-queue?kind=message`), que ya está acotada y no devuelve el texto.
- Prueba con dos consultorios reales (PGlite con todas las migraciones y RLS): `server/search/search.postgres.integration.test.ts`. Además `server/search/search.test.ts` (modo demo).

## Pruebas ejecutadas

- `npm run check`: sin errores.
- `npm test`: 322 archivos, 2231 pruebas aprobadas, 2 omitidas.
- `npm run build` y `npm run check:secrets`: correctos.
- Pruebas nuevas: servidor (3 + 3), artículos y búsqueda de ayuda, mensajes de la campana, panel del buscador.

## Límites y decisiones para Facundo

1. **«Marcar mensajes como leídos» desde la campana no se implementó.** Marcarlos sin abrir la conversación le muestra a la paciente «Leído» sin que la profesional los haya leído. Opciones: (a) dejarlo como está (leen al abrir); (b) botón que marca todo; (c) marcar sólo el chat elegido.
2. Los resultados de recetas y alimentos llevan al catálogo, no a la ficha del ítem: esas pantallas no tienen enlace directo por elemento. Opción: agregar `?receta=` / `?alimento=` a esas pantallas.
3. El buscador sólo busca pacientes por nombre (no por email ni teléfono): el listado del consultorio no los trae y no se amplió la lectura de datos personales.
4. La campana trae los mensajes al abrirse; no actualiza el contador en vivo.
5. Los artículos no tienen capturas (hay que tomarlas de Plan V) ni el botón «¿te sirvió?» del plan.
6. No se hizo comprobación visual en navegador de este cambio; sólo pruebas de código.
