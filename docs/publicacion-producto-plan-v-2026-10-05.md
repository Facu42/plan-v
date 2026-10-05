# Publicación y comprobación de Plan V — 5 de octubre de 2026

Facundo respondió «si» al pedido concreto para aprobar el PR #54 en `cdc30e97307fb1cee07ccf620163035acc730489`, las cinco migraciones con sus hashes y la configuración gratuita incluida en el paquete. Se aplicó exactamente ese SQL mediante MCP al proyecto existente `plan-v-app`, sin crear recursos ni ampliar Supabase.

| Migración del paquete | Versión registrada en Supabase |
|---|---|
| separate_nutrition_target_drafts | 20261005142207 |
| structured_menu_nutrition | 20261005142217 |
| manual_recipe_cover | 20261005142227 |
| reopen_patient_intake | 20261005142230 |
| harden_product_writes | 20261005142233 |

El PR #54 se integró como `83a93a85b3c80702fff51738303130d96480805a`. La API y el worker publicaron automáticamente esa versión. Vercel no creó el despliegue de la fusión; se solicitó por su API autenticada el mismo commit de Git, sobre el proyecto Hobby existente y sin cambiar sus ajustes.

| Servicio | Despliegue comprobado de 83a93a8 | Resultado |
|---|---|---|
| Vercel | dpl_9HzB1xWhMEeVrRb4oRS4fzBD8bpt | READY; dominio público asignado |
| API | 22511e2c-ff08-48b1-a464-22330f451205 | SUCCESS; health y ready 200, SHA correcto |
| Worker | 06c08be2-5070-4ab7-afa1-50a64fc7c7e0 | SUCCESS; mismo SHA |

API y worker conservan la clave existente y tienen `AI_MODE=live`, `AI_COST_MODE=free`, `OPENROUTER_MODEL=openrouter/free`. No se habilitaron imágenes IA, servicios pagos, otras réplicas ni volúmenes.

El [CI general de main](https://github.com/Facu42/plan-v/actions/runs/37324348625) y el [ensayo de sesiones y navegador](https://github.com/Facu42/plan-v/actions/runs/37324348586) terminaron correctamente. Las 24 pruebas de sesiones y 36 comprobaciones del navegador previo siguen siendo evidencia temporal; no equivalen a una generación de IA en producción.

## Comprobaciones en producción con las cuentas ficticias

Se usó gstack, sin capturas, con sesiones independientes de paciente y nutricionista. No se copiaron datos reales de salud ni claves.

- Ambos ingresos y las rutas privadas funcionan.
- La meta calórica confirmada se recupera desde el servidor tras recargar.
- Una receta manual guarda 200 kcal declaradas, ingredientes y pasos. Se publicó su revisión.
- Su foto manual reutiliza el recurso de plato ya aprobado. Se guardó en el bucket existente, abrió por HTTPS y volvió a cargarse después de recargar, con dimensiones reales de 960 px. No se realizó una generación de imagen.
- Un plan manual fechado se guardó y publicó; la paciente accede a la receta, ingrediente y calorías declaradas desde ese plan.
- Corregir la ficha conserva el permiso de atención y permite volver a enviarla. Se observó un conflicto 409 durante una edición: la interfaz ofreció recuperar, sin indicar éxito ni sobrescribir. Después de recuperar se enviaron y releyeron alergias/restricciones ficticias como «ninguna». La causa de ese conflicto no se atribuyó a un defecto: el revisor reprodujo autosave y navegación con SQL local real sin conflicto. Se conserva esta observación para investigar si se repite.

## Permisos de IA publicados y prueba real

La nueva app no había montado el control opcional de IA del frontend anterior. El servidor rechazó correctamente una generación sin ese permiso. Se agregó en «Mi ficha» el mismo componente de consentimiento y el catálogo ahora ofrece carga, error y reintento. La decisión usa la API existente y se relee del servidor; no se concede el permiso desde una cuenta profesional.

La revisión independiente de código encontró y cerró la falta de reintento del catálogo. Aprobó 34 pruebas focales locales. El [PR #56](https://github.com/Facu42/plan-v/pull/56) se integró como `6edd6fc07c506c05f6b7d0a8cbc269a52ca990a7`. [CI general](https://github.com/Facu42/plan-v/actions/runs/37353684618) y [sesiones/navegador de main](https://github.com/Facu42/plan-v/actions/runs/37353684601) aprobados: 24 pruebas de aislamiento y 40 verificaciones de gstack, incluyendo habilitación/recarga en escritorio, retiro/recarga en celular, rechazo 403 y recuperación de un 503 inyectado. El proveedor está desactivado en ese ensayo temporal.

| Servicio | Despliegue comprobado de 6edd6fc | Resultado |
|---|---|---|
| Vercel | dpl_J28gJ87xQB4Wo3WTfxfpc9qDMFbe | READY; dominio público, publicación Git automática |
| API | f5017a07-0f56-4ff8-8fce-c14e07c01f3e | SUCCESS; health y ready 200 con el SHA correcto |
| Worker | cf769a20-6d8d-490f-b211-9b870c70a923 | SUCCESS; mismo SHA |

En producción el permiso `ai_menu_draft` se habilitó desde la cuenta ficticia de paciente en Mi ficha, se releyó del servidor y permaneció marcado al recargar. La foto manual asignada también abre en el menú de paciente; su respuesta HTTPS conserva los mismos 155644 bytes y SHA-256 del recurso original. El nuevo borrador profesional de calorías guarda 1870 kcal mientras la paciente sigue recibiendo exclusivamente la meta publicada de 1857. El plan permanece en revisión publicada 1 frente al borrador privado 2. La paciente registró una comida declarada de 200 kcal; la profesional la confirmó. Agua (6 vasos) y descanso (450 minutos) sobreviven a recarga y nueva lectura profesional. Cerrar sesión y volver a ingresar conserva el plan.

Se obtuvo una propuesta real de `openrouter/free`: job `93f9900c-e9a2-4111-86c1-10505080edfa`, un almuerzo con receta del catálogo, completado en 17 s y con totales recalculados en servidor de 1857 kcal, diferencia 0 frente a la meta publicada. Después se rechazó desde el control de la app para ensayar otra propuesta; no se publicó. Un pedido de cuatro momentos falló sin modificar el plan y el pedido de receta nueva terminó tras 25,8 s, coincidiendo con el límite anterior de 25 s. No se atribuye la primera respuesta a una causa específica: su diagnóstico sólo informa que no fue utilizable.

La rama `codex/plan-v-free-ai-validation` amplía la espera a 90 s, dentro de la reserva existente de 120 s para propuestas, y acota el formato entregado al SDK a las fechas, momentos, IDs disponibles y cantidad de ítems solicitados. Se rechazan momentos duplicados y el registro interno identifica la etapa fallida sin contenido de salud ni mensajes del proveedor. La revisión encontró que las alternativas usan otra cola con reserva predeterminada de 15 s; `runOne` ahora solicita 120 s mediante el parámetro existente, para evitar recuperar ese trabajo mientras el proveedor sigue activo. Pruebas con handler suspendido y reloj de 89 s comprueban una sola ejecución, en memoria y SQL local. También se bloquea el candidato SQL con `FOR UPDATE SKIP LOCKED`; el ensayo temporal agrega dos conexiones y mantiene la primera transacción abierta para comprobar que la segunda no tome el mismo trabajo. No hay migraciones ni ajustes nuevos de producción. Sigue pendiente comprobar con la versión final una receta nueva estimada y el recorrido edición → publicación → lectura de paciente. No se declara terminado ese recorrido todavía.

**Resultado posterior:** el PR #57 se publicó como `df8e5d0` en web/API/worker. Se completó una generación real gratuita de cuatro recetas nuevas en 45,329 s; la propuesta se editó, guardó y publicó como v2. La paciente recibe la misma copia revisada, con ingredientes/porciones y estimaciones conservadas, comprobada en escritorio y celular. [Evidencia del producto publicado y guía](cierre-producto-publicado-2026-10-05.md). Las pruebas sintéticas no sustituyen esta comprobación real. La repetición final del navegador y los despliegues de la continuación se registran en el PR de cierre.

Guía y contratos: [recorridos de paciente y nutricionista](recorridos-y-contratos-plan-v-2026-10-05.md). Paquete SQL aprobado: [PR #54](paquete-produccion-pr54-2026-10-05.md).
