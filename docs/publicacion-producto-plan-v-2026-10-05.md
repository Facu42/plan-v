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

## Corrección necesaria para cerrar la IA

La nueva app no había montado el control opcional de IA del frontend anterior. El servidor rechazó correctamente una generación sin ese permiso. Se agregó en «Mi ficha» el mismo componente de consentimiento y el catálogo ahora ofrece carga, error y reintento. La decisión usa la API existente y se relee del servidor; no se concede el permiso desde una cuenta profesional.

La revisión independiente de código encontró y cerró la falta de reintento del catálogo. Aprobó 34 pruebas focales locales; el ensayo de navegador ahora agrega habilitación/recarga en escritorio, retiro/recarga en celular, rechazo profesional sin permiso y recuperación del catálogo tras un fallo. La generación real gratuita continúa pendiente hasta publicar y comprobar esta corrección. No se declara terminado el producto todavía.

Guía y contratos: [recorridos de paciente y nutricionista](recorridos-y-contratos-plan-v-2026-10-05.md). Paquete SQL aprobado: [PR #54](paquete-produccion-pr54-2026-10-05.md).
