# Campañas de captación en /admin · 04/11/2026

Pedido: brief de Facundo, rama `feat/admin-campaigns`. Se agrega una entrada Campañas al centro de administración existente. Conserva el tema oscuro y los estilos del centro. El alcance comercial es la audiencia de nutricionistas interesadas en Nutridash; no se agregan funciones al panel de las profesionales ni se usan pacientes como contactos.

## Recorridos y contratos

1. Agregar contacto o importar CSV (`email,first_name,last_name`). Se valida todo el archivo antes de escribir, acepta comillas, BOM y CRLF, limita a 100 filas y deduplica por correo. La importación informa cuántos contactos guardó y en cuál se detuvo si Resend falla. Reimportar agrega al segmento sin volver a suscribir a quien se dio de baja. Un contacto existente conserva sus datos y su baja.
2. Crear un borrador persistente en Resend. El remitente y la respuesta los fija el servidor. Guardar nunca envía. Se puede guardar un borrador incompleto respecto de la baja; enviarlo exige el enlace.
3. Revisar el borrador, marcar la confirmación y enviar. El servidor vuelve a consultar el borrador: exige estado draft, audiencia de leads, remitente/respuesta configurados y un enlace real con `{{{RESEND_UNSUBSCRIBE_URL}}}`. También controla la versión de texto si existe. Un marcador suelto, comentado, en script/style o dentro de otro atributo no habilita el envío. El HTML se muestra como texto, sin ejecutarse dentro del panel.
4. Consultar estados y aperturas. Se muestran aperturas cuando Resend las ofrece; si no, se indica que no están disponibles. La consulta trae hasta 100 destinatarios con apertura y aclara si hay más, sin presentar esa cifra como total.
5. Consultar avisos transaccionales: lista y relectura del último evento solo para `avisos@nutridash.net`. La respuesta proyecta identificador, remitente, fecha y evento; no entrega asunto, destinatarios, contenido ni adjuntos clínicos. No hay rutas de escritura de esos avisos.

Todas las rutas `/api/admin/campaigns/*` verifican el administrador de plataforma y MFA aal2 mediante la guarda existente. Modo demo, profesional sin permiso de administración, paciente y sesión sin segundo factor quedan fuera antes de llamar a Resend. Las escrituras conservan la auditoría previa existente de `/admin`; no se copian cuerpos ni correos a ese registro.

Los listados tienen paginación por cursor y botón Cargar más. Broadcasts y correos filtran cada página de la cuenta: una página vacía puede tener páginas siguientes. Las solicitudes de Resend se espacian 550 ms en una cola por proceso, tienen límite de 15 segundos por solicitud y no reintentan escrituras automáticamente. Si se pierde una respuesta, hay que revisar el estado antes de volver a enviar. La cuota de Resend se comparte entre instancias y otras integraciones; ante 429 se informa el límite.

Fuentes oficiales consultadas: [contrato OpenAPI](https://github.com/resend/resend-openapi/blob/main/resend.yaml), [cambio de audiencias a segmentos](https://resend.com/blog/new-contacts-experience), [broadcasts](https://resend.com/docs/api-reference/broadcasts/create-broadcast), [listado de correos](https://resend.com/docs/api-reference/emails/list-emails). `RESEND_AUDIENCE_ID` conserva el nombre solicitado y se usa como identificador del segmento de leads en la API actual.

## Configuración para una futura habilitación

Lista obligatoria antes de habilitar, sin modificar producción en esta tarea:

- Cargar `RESEND_API_KEY` exclusivamente en el servidor, con permisos para contactos, broadcasts y lectura de correos. Nunca `VITE_`.
- Cargar `RESEND_AUDIENCE_ID` con el UUID del segmento dedicado a leads, nunca de pacientes.
- Verificar el dominio y `RESEND_CAMPAIGN_FROM`, cuyo valor predeterminado es `Nutridash <novedades@news.nutridash.net>`. Las respuestas van a `contacto@nutridash.net`.
- Probar con contactos ficticios autorizados: borrador, envío, entrega, enlace de baja y conservación de la baja al reimportar. Revisar seguimiento de aperturas y permisos de lectura según la cuenta de Resend.
- Revisar la cola por proceso si se usan varias instancias. Una importación de 100 contactos nuevos puede tardar unos dos minutos por el límite del proveedor.

Sin clave o audiencia válida las campañas quedan deshabilitadas y la pantalla explica la configuración pendiente. La lectura de avisos solo necesita la clave. `.env.example` documenta las tres variables; no se incluyeron credenciales, dependencias nuevas ni migraciones.

## Verificación y paso 10 de regression-guard

- **Flujos críticos verificados:** guarda admin/MFA y aislamiento de demo ✅; contacto y conservación de baja ✅; CSV válido/inválido y error parcial ✅; borrador sin envío ✅; envío con confirmación y revalidación de baja ✅; estados/aperturas ✅; avisos transaccionales solo lectura sin contenido clínico ✅. Pruebas HTTP con autenticación simulada y el registro real de rutas. Navegador con datos ficticios y proveedor simulado, escritorio 1440 y móvil 390, sin desborde ni errores de página.
- **Regresiones cubiertas:** se conserva el segundo factor obligatorio del centro (historial de #259) y la protección de metadatos clínicos del admin. La revisión independiente encontró falsos positivos del enlace de baja: data-href/bloques no visibles, href escrito dentro de un atributo y comentarios/bloques sin cierre. Se agregaron negativos y lectura de etiquetas/atributos que respeta comillas y duplicados.
- **Contratos revisados:** UI → cliente autenticado → Hono/Zod → Resend REST. Audiencia, remitente, respuesta y confirmación fijos; cursor/identificador UUID; errores del proveedor sin cuerpos ni claves; bajas nunca restablecidas por importación; páginas filtradas sin perder el cursor original.
- **Áreas frágiles:** autenticación (se reutiliza guarda con MFA, falla cerrada), importación (validación previa y resultado parcial), proveedor (timeout, cola y sin reintento de escritura), baja (se valida contenido persistente antes del envío), datos clínicos (proyección operativa de solo lectura).
- **Migraciones:** no corresponde. No se accedió a la base ni a la configuración de producción.
- **Fire test:** se desactivó temporalmente la validación de baja en el entorno de pruebas; las cinco pruebas negativas entonces existentes fallaron. Se restauró la función y las 17 pruebas de ese momento pasaron. Luego se ampliaron los casos negativos a partir de la revisión.
- **Automatizaciones nuevas:** validación del CSV, conservación de bajas y control previo al envío comprobados en pruebas; interfaz apagada cuando falta configuración; dos recorridos de navegador repetibles en `e2e/admin-campaigns.spec.ts`. La habilitación externa queda en la lista obligatoria anterior.
- **Pruebas y controles:** 90 pruebas focales aprobadas en cuatro archivos (27 de CSV/baja/cliente, 52 de rutas y 11 del centro/auditoría); dos recorridos de navegador aprobados. `npm run check` (tres proyectos), `npm run build`, `npm run check:secrets` y `git diff --check` aprobados. Build conserva advertencias de anotaciones de Zod y tamaño de paquetes. `npm test -- --maxWorkers=2`: 666 archivos aprobados, 4101 pruebas aprobadas y 5 omitidas (4106 en total), en 222 segundos sobre la versión final sin cambios durante la ejecución. La primera corrida restringida no sirve como gate: bloqueó subprocesos Node/Chrome; se repitió con los permisos correspondientes. No hay script de lint configurado en este repositorio: se usa el control de espacios `git diff --check` y los tres proyectos de TypeScript, sin inventar un resultado de ESLint.
- **Límites:** no se probó entrega real, credenciales/dominio reales ni sesión Supabase real desde navegador. No se hizo una medición específica de rendimiento. Los recorridos visuales usan el harness local del centro y la integración HTTP simula autenticación y proveedor. Esos límites requieren validación antes de habilitar, no una escritura remota durante esta tarea.
- **Revisión independiente:** `code-reviewer` y `reality-checker` revisaron implementación y evidencias. Ambos comprobaron las 27 pruebas de CSV/baja/cliente. Sin P1/P2 pendientes; apto para PR borrador con los límites indicados.
- **Veredicto:** HOLD para habilitación y merge mientras se completa la revisión de Facundo y la configuración/prueba del proveedor. El entregable es un PR en borrador; no se autoriza despliegue.
