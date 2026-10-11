# Correcciones de IA (2026-10-02)

Continuación de [la auditoría de IA, calorías y onboarding](verificacion-ia-calorias-onboarding-2026-10-02.md), a pedido de Facundo: «seguí con los pendientes de correcciones de IA».
Rama `codex/correcciones-ia`, [PR #50](https://github.com/Facu42/plan-v/pull/50). Integrado y publicado el 2026-10-02, con las dos migraciones aplicadas tras el OK escrito de Facundo.

## Qué cambia

- La IA lee la configuración completa, incluidas las claves públicas y sus alias de Supabase. La configuración válida de producción deja de ser rechazada por omitir esos campos.
- Las propuestas aceptan fechas reales y hasta 21 días de diferencia entre inicio y fin antes de llamar al proveedor, igual que el contrato existente del plan. Cada tarea tiene una única reserva de ejecución, vence a los 120 segundos y no admite resultados tardíos. El límite de tres tareas activas se comprueba bajo el mismo bloqueo en la base, también con solicitudes simultáneas.
- Se comprueban nuevamente la ficha y el permiso de IA antes y después de generar, y antes de aplicar. Si el contexto cambia, se pide una propuesta nueva. Un fallo de contexto termina la tarea en vez de dejarla ocupando la cola.
- El editor conserva el identificador y el origen de la receta propuesta. Guardarla ya no crea otra receta independiente ni pierde su procedencia. Los datos se validan antes de aplicar.
- Aprobar un menú compara y publica la misma copia revisada dentro de una operación de la base. Usa el bloqueo de la paciente que también usan las ediciones, y luego el del plan. Una edición desde otra pestaña exige revisar otra vez o crea la versión siguiente si la publicación ya terminó.
- Publicar una receta conserva el éxito aunque falle la foto. Se reserva la foto antes de llamar al proveedor; un doble clic no inicia dos generaciones. El botón «Reintentar foto» trabaja sobre la versión publicada, sin volver a publicarla. Hay espera de un minuto tras un intento terminado y una reserva máxima de tres minutos; una reserva vencida solo se recupera mediante reintento explícito.
- La llamada de imagen termina a los 60 segundos, sin reintentos automáticos. Solo envía el nombre del plato y sus ingredientes; valida formato y tamaño antes de subir a Storage. El tiempo de la subida y de las consultas de la base no está incluido en esos 60 segundos.
- Sin proveedor configurado, el botón de foto queda deshabilitado con una explicación. Ninguna imagen simulada se guarda como si hubiera sido generada en producción.

El modelo de imagen predeterminado se actualiza a `gpt-image-2.5-flare`, con calidad baja y salida WebP. Es un modelo de imagen listado en la [documentación oficial de OpenAI](https://developers.openai.com/api/docs/guides/image-generation) y en el catálogo del proveedor consultados el 2/10. Puede ajustarse con `OPENAI_IMAGE_MODEL`. La compatibilidad de opciones, cancelación y reintentos se comprobó además en la documentación/código del SDK instalado (`ai` 7.0.87, `@ai-sdk/openai` 4.0.53). **No se hizo una llamada facturable para verificar el acceso de la cuenta al modelo.**

## Comprobación y límites

- Pruebas de configuración, cancelación, fallos de fotos, permisos, versión esperada, identidad de recetas, vigencia del contexto, tareas abandonadas y resultados tardíos. Migraciones reproducidas en PostgreSQL local mediante PGlite; también se comprueban permisos directos de la nueva tabla y las funciones autorizadas.
- Navegador local con datos ficticios: crear una receta propuesta, editar ingredientes y pasos, guardar conservando una sola receta, y publicar sin proveedor de fotos. El flujo real de la API local de demostración conservó el identificador y el origen `propuesta_ia.v1`.
- Navegador local a 1440 y 390: rechazar una propuesta mantiene el plan de la paciente vacío; aprobar muestra la copia publicada. El fixture de menús modificó la respuesta de `/api/ai/jobs` en el navegador y, después de `/apply`, hizo un guardado adicional por `/plans` con el contenido ficticio revisable. Comprueba la UI, el guardado y la publicación de la API demo; **no el trayecto proveedor → aplicación sin intervención**. La foto del reintento fue una imagen de prueba ya existente, con una respuesta simulada: prueba del botón/carga, **no de generación ni de Storage**. Sin desbordamiento horizontal ni alertas en esos recorridos.
- La prueba de sesiones firmadas añade solicitudes simultáneas por PostgREST y dos conexiones de PostgreSQL independientes: límite de cola, reserva única de tarea/foto y exclusión entre publicación y edición. Usa Supabase temporal en GitHub; no crea proyectos hospedados ni usa pacientes reales. Docker no estaba disponible en esta PC.
- Revisiones de `code-reviewer` y `reality-checker` realizadas; se corrigió el bloqueo de publicación para compartir el de las ediciones.

Evidencia portable de estos recorridos ficticios: [identidad, origen y edición conservados](evidencias/ia-2026-10-02/ia-ui-recipe-identity-results.json), [receta publicada sin proveedor](evidencias/ia-2026-10-02/ia-ui-published-1440.png), [reintento de foto simulado en móvil](evidencias/ia-2026-10-02/ia-ui-photo-ready-390.png), [menú en revisión](evidencias/ia-2026-10-02/ia-ui-plan-review-1440.png), [menú aprobado en móvil](evidencias/ia-2026-10-02/ia-ui-plan-published-390.png) y [resultados de planes](evidencias/ia-2026-10-02/ia-ui-plan-results.json).

Suite general: **1.144 pruebas aprobadas y dos omitidas**, 216 archivos. TypeScript, compilación, control de migraciones y control de secretos aprobados. La primera corrida encontró la nueva tabla ausente del inventario de pruebas: se agregó y se comprobó su cierre directo. Otra corrida agotó memoria de la PC; la suite completa terminó bien con dos procesos (`npm test -- --maxWorkers=2`), sin omitir archivos por ese motivo. La compilación conserva el aviso previo sobre tamaño de algunos bloques.

GitHub verificó el código `ba599b1`: [CI general aprobado](https://github.com/Facu42/plan-v/actions/runs/37053658727) con 1.144 pruebas, controles y cero vulnerabilidades reportadas por la revisión de dependencias; historial/objetos grandes sin secretos detectados. [Sesiones firmadas aprobadas](https://github.com/Facu42/plan-v/actions/runs/37053658719): **18/18**, incluidos los dos casos nuevos de concurrencia, sin omisiones. La vista previa de Vercel también compiló. El cierre posterior solo modifica documentación/evidencia.

El límite mensual de tokens existente sigue siendo una estimación para admisión; no equivale a un tope de facturación del proveedor. No se afirma que la IA clínica ni las imágenes funcionen de punta a punta en producción a partir de estas simulaciones.

## Base y publicación aplicadas

Dos migraciones creadas con la CLI de Supabase y aplicadas mediante el MCP al proyecto existente `plan-v-app`:

1. `20261002165327_ai_cover_reservations.sql`: tabla interna de reservas de portada, funciones autorizadas para reservar/finalizar y publicación del plan revisado. La tabla tiene RLS y no permite lectura ni escritura directa a visitantes o usuarias; conserva los permisos necesarios del servidor.
2. `20261002165527_harden_ai_job_execution.sql`: reserva de ejecución, vencimiento, comprobantes de ficha/consentimiento y cola atómica. Cambia el protocolo de finalización para exigir la reserva. Marca como fallidas las tareas activas previas; las propuestas antiguas sin comprobantes deben generarse nuevamente antes de aplicarse.

La segunda migración y la nueva API deben publicarse coordinadas: entre la migración y el despliegue la API anterior no puede finalizar tareas con el protocolo nuevo. Preparar el PR aprobado y el despliegue antes de aplicar; evitar generar propuestas en esa ventana. Aplicar primero la migración de portadas, luego la de tareas e integrar inmediatamente el PR para desplegar web/API/worker. Comprobar versión desplegada, estado de migraciones, permisos y los recorridos con cuentas ficticias. Si hay un problema, mantener cerrada la generación y corregir hacia adelante; volver a la API anterior sola no revierte el protocolo de la base.

Facundo respondió «ok» a la autorización concreta para aplicar estas dos migraciones y publicar el PR #50. Se aplicaron primero las reservas de fotos y después las tareas; el PR se integró inmediatamente. No se cambiaron credenciales ni servicios, no se contrataron recursos de Supabase y no se consumieron créditos de generación.

### Comprobación en producción

- Supabase registró `ai_cover_reservations` como `20261002200412` y `harden_ai_job_execution` como `20261002200418`. El MCP asigna la hora de aplicación; corresponden a los archivos locales `20261002165327` y `20261002165527` respectivamente. Antes de aplicar había cero tareas de IA activas. Las cuatro columnas de reserva/contexto están presentes.
- El PR #50 se integró a las 20:04:22 UTC, commit `d313a62e50175c5c5202ced24713ff8ceb6cd4e8`. Vercel `dpl_4DvQHLo7WyTe5xRardLDSALnYafX` quedó READY en producción con el alias público y ese commit. Railway API `f4409a48-170a-4c64-b004-16c44ea61898` y worker `1e6432a3-2bbd-4ea3-a2d1-f11b495667fb` quedaron SUCCESS con el mismo commit.
- [CI de main](https://github.com/Facu42/plan-v/actions/runs/37058215575) y [sesiones/concurrencia de main](https://github.com/Facu42/plan-v/actions/runs/37058215561) aprobados. La API devuelve health/ready 200, Supabase activo, worker externo y el commit integrado.
- La tabla de reservas tiene RLS y niega acceso directo tanto a visitantes como a usuarias. Las cuatro funciones nuevas niegan ejecución a visitantes y permiten a sesiones autenticadas pasar por su autorización interna.
- El asesor conserva las dos advertencias de vistas ya documentadas. Sus avisos de tablas internas pasan de 16 a 17 por `recipe_cover_requests`, y los de funciones autenticadas de 116 a 120 por las cuatro entradas nuevas verificadas. Son aumentos esperados, no una apertura directa: permisos comprobados y pruebas de aislamiento/concurrencia aprobadas. Referencias del asesor: [tabla interna sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [función con autorización interna](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [vistas anteriores](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view).
- Navegador gstack con las dos cuentas ficticias entregadas por Facundo: ingreso profesional y de paciente, lectura de planes 200 en ambos roles, catálogo profesional 200, catálogo/foto profesional rechazados con 403 para la paciente y catálogo sin sesión rechazado con 401. Un período de IA excesivo devuelve 400 antes de generar. No se crearon tareas, recetas, fotos, planes ni consentimientos en esta comprobación; no se enviaron datos de salud a proveedores.
- La API publicada informa `image_generation: false`. Confirma que las fotos reales siguen deshabilitadas y que el despliegue no habilitó un proveedor de imágenes. No se hizo una generación real de texto ni de imagen.

Resultados sin credenciales ni datos de salud: [API profesional](evidencias/ia-2026-10-02/ia-deploy-api-results.json), [permisos de paciente](evidencias/ia-2026-10-02/ia-deploy-patient-results.json) y [clasificación del asesor](evidencias/ia-2026-10-02/ia-deploy-security-results.json).

## Lo que sigue abierto

- Las fotos necesitan una credencial de OpenAI disponible en la API. La revisión previa de nombres de variables encontró OpenRouter para texto, pero no OpenAI para imágenes. La clave de Higgsfield usada en el onboarding permanece fuera de la app y no habilita este generador. Configurar o cambiar proveedor requiere autorización aparte; no se copiaron credenciales al repositorio.
- Falta una generación real controlada de imagen y de propuesta con el proveedor habilitado, con costo autorizado y sin datos reales de salud en la prueba.
- La pérdida de la meta calórica confirmada al guardar un borrador y el desbordamiento del nombre largo del encabezado, hallados en la auditoría anterior, siguen pendientes en su propio apartado. Estas correcciones no cambian la fórmula calórica ni el onboarding ya publicado en el PR #49.
