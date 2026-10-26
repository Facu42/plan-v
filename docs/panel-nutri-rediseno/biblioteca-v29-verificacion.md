# Biblioteca v29: corrección efectiva del 25/10/2026

Rama `codex/biblioteca-v29`, [PR #182](https://github.com/Facu42/plan-v/pull/182). Esta revisión sustituye el cierre anterior rechazado por Facundo. La evidencia y los controles de `408dc57` corresponden a otra versión y no prueban estos cambios.

Fuente: `design/panel-nutri/v29/panel-trabajo.html`, `sxBiblioteca` y `onLib`, con las seis correcciones explícitas aprobadas por Facundo.

## Cambios de aplicación

| Gap | Cambio concreto |
|---|---|
| Recetas en Biblioteca | `src/components/nutrigo/PanelBiblioteca.tsx` y `NutrigoShowroom.tsx`: subtítulo «Guías, videos, PDF y recetas del consultorio.» y pie «Las recetas están en esta Biblioteca.». Ver recetas conserva `/crm/biblioteca?biblioteca=recetas`. |
| Tipo en tarjetas y detalle | `src/components/nutrigo/biblioteca-model.ts`: Guía/Video/PDF ↔ `guia`/`video`/`pdf`. Las categorías temáticas anteriores son Guía. `sxk` contiene solo el tipo; el detalle contiene tipo y descripción. |
| Nuevo recurso | `PanelBiblioteca.tsx`: tres campos (Título, Tipo, De qué se trata), subtítulo y Guardar pedidos. No importa ni monta `ProfessionalResourceEditor`. Guarda y publica mediante las API existentes para permitir asignarlo inmediatamente; la descripción queda en resumen y sección legible. Si falla publicar, conserva el id y reintenta sin crear otra copia. |
| Asignar | Título «Asignar «{título}»», subtítulo solicitado y ya asignadas marcadas. No se eliminan asignaciones existentes. Se llama a `api.assignResource` por cada nueva paciente; los fallos parciales conservan solo las pendientes. |
| Retiro del flujo editorial | Biblioteca ya no presenta Ver contenido, publicar/despublicar ni versiones. El editor general usado fuera de esta pantalla permanece disponible para sus otros usos. |
| Avisar por la app | Acción directa a todas las ya asignadas; mensaje con título y ruta al recurso. Sin asignadas: «Primero asignalo a alguien.». Si una falla, el siguiente toque reintenta solo pendientes con el mismo `client_id`. |

## Cómo se dispara el aviso

La nueva asignación usa `api.assignResource(slug, [patientId])` → `POST /api/resources/assign` → `server/resources/routes.ts`: tras guardar y recuperar las fichas, si es persistente, `assigned_count > 0` y `existing_count === 0`, llama a **`notifyPatientPush(id, 'resource')`**. Enviar una paciente por solicitud evita que un alta ya existente por concurrencia silencie el push de otra nueva. Una repetición sin altas nuevas no vuelve a dispararlo.

`server/push/push.ts` prepara el aviso de recurso que abre `/app/recursos`; el texto del teléfono es genérico para no exponer información clínica. La entrega depende de VAPID y de una suscripción activa ya configurados. La prueba nueva `server/resources/assignment-push.routes.test.ts` comprueba la llamada `resource`, la ausencia de duplicados y que no se avise si faltan permisos o falla la escritura. Usa dependencias aisladas: no envía a teléfonos reales.

La acción directa Avisar por la app usa `api.sendMessage` con título y ruta del recurso. Los avisos de mensajes conservan el mecanismo de push de mensajes existente. No se introduce una selección de destinatarias adicional.

## Verificación actual

| Comprobación | Resultado |
|---|---|
| `npm test -- --maxWorkers=2` | **3.306 aprobadas, cuatro omitidas; 524 archivos aprobados**, 359,83 segundos. |
| `npm run check` | Tipos de web, API y e2e aprobados. |
| `npm run build` | Aprobada, 13,51 segundos. Conserva el aviso previo sobre paquetes grandes. |
| `npm run check:secrets` | Aprobado. |
| `git diff --check` | Aprobado. No existe un comando separado de lint en el proyecto. |
| Contrato v29 | Aprobado para las piezas comparadas en claro y oscuro; incluye Biblioteca. No es una comparación de cada píxel ni del texto histórico del boceto. |
| E2e de Biblioteca | **Seis aprobados**: Recetas y recarga; tres campos, asignadas y aviso; reintento de guardado; concurrencia y error parcial de asignación; error de catálogo; celular. |
| `npm run test:e2e` | **Doce aprobados**, 3,4 minutos: los seis de Biblioteca y los seis generales, incluido aviso hasta lectura. Chrome instalado, API demo y variables de base remota vacías. |
| Navegador firmado | `scripts/product-browser.local.mjs` elige un recurso publicado desde la API y busca su título. Ya no depende de un rótulo editorial en `sxk`. Sintaxis y tres pruebas existentes del recorrido aprobadas; ejecución firmada pendiente en el CI de la nueva cabeza. |
| Pacing de e2e | `e2e/helpers.ts` cuenta respuestas de la API y reutiliza `createBrowserRatePacer` antes de entrar a la demo. Las ocho pruebas existentes del pacing, incluidas las del limitador real, pasan. Veinte pruebas focales de runner, modelo y push aprobadas. |
| Revisiones | `code-reviewer`: corregidos estilos y riesgo de push con selección desactualizada; segunda lectura sin bloqueadores. `reality-checker`: seis gaps con código y evidencia, sin certificar producción. |

Una primera suite sin límite de workers registró un timeout de persistencia en recetas y se interrumpió. La suite completa posterior con dos workers terminó sin fallos. El primer recorrido del formulario encontró un nombre de selector ambiguo: se corrigió con `aria-labelledby` y se verificó el recorrido completo. La primera corrida de todos los e2e detectó un aviso adicional dejado por la prueba nueva de concurrencia en la paciente demo compartida: esa prueba ahora marca su recurso como leído al terminar. Otra corrida llegó al límite real de 300 solicitudes por IP/minuto al ampliar la suite; el runner ahora aplica el pacing existente sin cambiar ni desactivar las protecciones del servidor. Los avisos de color de Node no son fallos de la aplicación.

Video y PDF se guardan como tipo; el diálogo de tres campos no incorpora adjuntos. No hay cambios de esquema, migraciones, configuración de producción ni pruebas con pacientes reales. El control firmado de la nueva cabeza debe evaluarse por su propio CI después del push; los resultados remotos antiguos no se reutilizan.

## Capturas actuales

- [Biblioteca a 1440](biblioteca-v29-evidencia/correccion/biblioteca-1440.png).
- [Nuevo recurso a 1440](biblioteca-v29-evidencia/correccion/nuevo-1440.png).
- [Nuevo recurso a 390](biblioteca-v29-evidencia/correccion/nuevo-390.png).

Capturadas con `/browse`, servicios locales y datos ficticios. El selector usa las clases `af`/`ai` del boceto. En celular el diálogo aparece abajo y los tres campos más Guardar quedan visibles.

## Regression guard — paso 10

- **Flujos críticos verificados:** ✅ catálogo, alta, asignación, aviso y lectura del recurso; ✅ Recetas y recarga; ✅ error y reintentos, celular; ✅ permisos y aislamiento cubiertos por la suite general. La entrega push a un teléfono real no forma parte de esta evidencia.
- **Regresiones cubiertas:** rótulos por tipo, categorías antiguas, alta sin editor, id estable ante fallo de publicación, asignaciones previas marcadas, selección desactualizada, fallos parciales, reintentos de aviso sin duplicados y conservación de Recetas/paciente.
- **Contratos revisados:** `resourcesApi.save/publish/catalog`, restricciones de título/resumen/secciones, `api.assignResource` con slug y fichas actualizadas, llamada de servidor al push `resource`, `api.sendMessage` con `client_id`, `read_at` y rutas de Recetas.
- **Áreas frágiles:** publicación interna y reintentos; estado desactualizado al asignar; dobles avisos. Se conserva el id guardado, se separan altas por paciente, se bloquean tarjetas durante operaciones y se conservan solo destinatarias fallidas.
- **Migraciones:** no corresponden. Nada se aplicó a una base remota.
- **Fire test:** ✅ se alteró temporalmente Video para devolver Guía: falló la prueba de tipos. Se restauró y las nueve pruebas de modelo y conexión push pasaron. Antes de implementar, las cuatro pruebas nuevas de mapeo también fallaron por ausencia de los helpers.
- **Automatizaciones:** seis e2e de Biblioteca y prueba de conexión push dentro de los comandos existentes del CI. No requiere pasos manuales nuevos para publicar la app.
- **Veredicto:** implementación comprobada localmente y presentada para revisión en el PR. El merge y producción quedan fuera de esta entrega; el CI de la nueva cabeza se informa por separado.
