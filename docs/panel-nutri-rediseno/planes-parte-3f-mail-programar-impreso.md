# Planes parte 3f — mail, programación e impreso

Base 764a107; rama work/planes-parte-3f-mail-programar-impreso. Autorizado por Facundo el 26/10/2026. Sin producción ni merge.

## Plan y flujos críticos (Regression Guard, paso 1)

- Guardar y publicar con revisión, control de alergias, versión y consultorio: pruebas existentes de plans/flow, postgres y parte 3.
- Programar día/hora sin adelantar visibilidad; mantener plan anterior y activar al consultar: nuevas pruebas de entrega, PostgreSQL y e2e.
- Mail únicamente al correo confirmado con permiso vigente, enlace al plan publicado, sin publicar y sin repetir ante concurrencia/incertidumbre: nuevas pruebas de servicio y PostgreSQL.
- Impreso abre vista para papel y respeta las cinco opciones existentes: e2e y pruebas PDF de parte 3b.
- Labels/orden Comidas, Indicaciones, Compras, Versiones, Entrega e Inter: e2e.

## Decisiones

Mail envía un enlace autenticado a la copia vigente, sin datos clínicos ni adjunto. Requiere publicación previa, transporte habilitado y permiso de correo existente. La demo nunca envía.
Programación usa el mecanismo existente de promoción al leer, ampliado a hora exacta en Argentina. No se crea cron, no se prometen mail/push automáticos. La copia revisada queda inmutable y se activa al consultar desde esa hora. Elegir una fecha no modifica las fechas de las comidas.
Impreso reutiliza PlanPrintDialog con acción print; descarga PDF sigue separada.

## Verificación y paso 10

- Suite completa: `npm test -- --maxWorkers=2`, Node 22: **3.396 aprobadas y 2 omitidas, 539 archivos**. Las dos omitidas son las existentes del proyecto. La primera ejecución detectó el inventario/grants sin actualizar; otra detectó pérdida de horarios al reemplazar una proyección. Ambas causas corregidas y suite completa final verde.
- Unit/integración focal: 3 nuevas de entrega, 5 de mail, 6 de handover; PostgreSQL de planes 12/12, permisos de funciones y manifiesto (33/33 en la tanda conjunta). El agente reality-checker repitió 14 focales y code-reviewer 18 de handover/PostgreSQL.
- E2e: tanda de parte 3 y 3f **5/5 aprobadas**. Tras el ajuste final de hora en formato24 y precarga de fecha/hora guardadas, los dos recorridos funcionales pasaron y el visual agotó tiempo esperando diálogo. Ese mismo visual se repitió aislado, sin cambiar expectativas ni ampliar el timeout: **1/1 aprobado** en 1440/390 y claro/oscuro. No se presenta la tanda con timeout como verde.
- `npm run check`, `npm run build`, `check:migrations`, `check:release-manifest`, `check:secrets`, `panel:v29:check` y `git diff --check`: aprobados. El proyecto no define un script de lint; no se inventó un resultado. Build conserva el aviso existente por tamaño de paquetes.
- Capturas finales inspeccionadas: [1440 claro](../screenshots/planes-p3f/programar-1440-claro.png), [1440 oscuro](../screenshots/planes-p3f/programar-1440-oscuro.png), [390 claro](../screenshots/planes-p3f/programar-390-claro.png), [390 oscuro](../screenshots/planes-p3f/programar-390-oscuro.png). Vista impresa y formulario con error también inspeccionados durante los e2e. Datos ficticios exclusivamente.

### Informe del paso 10

- **Flujos críticos verificados:** ✅ guardar/publicar con revisión; ✅ mantener plan anterior hasta día/hora; ✅ primera entrega; ✅ mail sin publicar, sin configuración/destinatario/permiso y sin duplicar; ✅ copia impresa/PDF; ✅ pestañas e Inter. La entrega externa real se mantiene sin probar porque no se habilitaron proveedores.
- **Regresiones cubiertas:** copia revisada desactualizada y aislamiento de consultorio (#185), publicación futura que conserva el anterior (#103), horarios y contenido inmutables (#89 y posteriores). La prueba existente de horarios detectó una regresión introducida durante el desarrollo; el wrapper final conserva la proyección completa. Nueva prueba de aviso paciente detecta fecha/hora efectiva frente al inicio del período.
- **Contratos revisados:** formulario → API Zod → repositorio → RPC de programación; Auth/permiso de correo → reserva SQL → transporte → estado de aceptación; proyección paciente y compras. No se duplicó la revisión clínica: se reutiliza la publicación revisada existente. Nuevas tablas/funciones añadidas al inventario de seguridad con pruebas de grants.
- **Áreas frágiles:** publicación diferida, snapshot y metas, separación entre consultorios y transporte externo. Probados límite horario, stale snapshot, permisos cruzados y reservas concurrentes. Mail ambiguo se congela y no se presume entregado.
- **Migraciones:** aditiva, transaccional, con RLS y sin pérdida de datos; aplicada solo en PostgreSQL descartable. Reversión compatible conservando datos/fechas; detalle abajo. Sin producción.
- **Fire test:** ✅ cambio controlado `hour12:false → true`; el test de handover falló al perder la hora24 esperada. Restaurado y seis pruebas verdes. Ningún cambio de prueba quedó en el producto.
- **Automatizaciones nuevas:** inventario y hash de la migración, allowlist de RPC, tablas internas con RLS/permisos, tests de horario/duplicados/revisión y e2e de los botones. Lo que requiere autorización/configuración queda en checklist obligatorio abajo.
- **Revisión:** code-reviewer aprobó la corrección de fecha/hora y la proyección paciente. Reality-checker no halló bloqueantes funcionales; pidió cerrar suite/visual/paso10, completados con la evidencia anterior.
- **Veredicto:** **SHIP para PR draft y revisión. HOLD para producción** hasta autorización escrita para la migración y comprobación del transporte en un entorno autorizado. No hay merge ni despliegue en esta tarea.

## Contratos, datos y operación

- `POST /api/plans/:id/email`: recibe `patient_id` y `expected_version`. Solo acepta la versión publicada y vigente de ese plan y esa paciente del consultorio autenticado. Resuelve el correo desde Auth, confirmado, con permiso vigente por `ops_email_eligible_patients`; no acepta una dirección arbitraria del navegador. Revalida destinatario/permiso/versión antes del transporte. Usa `MAIL_ENABLED=true`, `MAIL_PROVIDER` y la configuración existente Gmail/Brevo, además de `PUBLIC_SITE_URL` (o el origen permitido del servidor). No se activó ningún proveedor.
- El mail contiene `/app/plan`, requiere iniciar sesión y muestra la versión vigente al abrirlo. No lleva PDF adjunto, nombre de paciente, recetas, diagnósticos ni tokens públicos. El rótulo del selector explica este alcance. Si el borrador es más nuevo, se conserva privado.
- Resultado `accepted` significa aceptación por el proveedor, nunca recepción en bandeja; `already_accepted` no repite. La reserva única por versión se toma en PostgreSQL antes del envío. Un error, un corte del proceso o un resultado ambiguo deja `pending`/`uncertain`: ningún reintento la recupera. No existe botón de reenviar ni reintento automático en este slice.
- Revisión de un envío pendiente/incierto: un operador autorizado consulta la reserva por versión y contrasta el proveedor usando la llave estable del mensaje. No se debe borrar la reserva para probar si llega. Si no se puede confirmar, se conserva incierta y se puede entregar por App/PDF/Impreso. No se hicieron consultas operativas reales ni se guardan correos o datos clínicos en la reserva.
- `POST /api/plans/:id/schedule`: recibe versión, snapshot revisado y `scheduled_at` ISO con zona. El formulario usa día/hora de Argentina (`-03:00`). Solo acepta borrador revisado, fecha futura dentro del período, identidad titular, consentimiento y los mismos controles clínicos/versión de publicar. Un reintento de la misma copia y fecha es idempotente; otra fecha para esa copia devuelve conflicto. Para reemplazarla, se crea/revisa un nuevo borrador. No se agrega cancelación/edición de una copia inmutable en este slice.
- La programación deja la copia en `scheduled`, sin sustituir el plan vigente. `promote_due_meal_plan`, ya llamado desde las lecturas de plan/compras, ahora consulta la hora exacta cuando existe. Funciona también para la primera entrega, sin plan anterior. No requiere worker: se activa con la primera consulta desde la hora elegida. No hay promesa de push ni mail automático a esa hora.
- El resumen para la paciente usa el día y hora efectivos, conservando horarios de comidas, etiquetas, composición, indicaciones y metas de la proyección previa. Los planes diferidos anteriores, sin hora explícita, mantienen su comportamiento por día.

## Migración y reversión

`20261026190000_plan_delivery.sql`, posterior a los rangos reservados, agrega dos tablas internas con RLS y sin permisos directos para personas: `meal_plan_delivery_schedules` y `meal_plan_email_deliveries`. Expone únicamente las RPC de programar y reservar mail para profesionales autorizados; finalizar mail queda solo para el servicio. No elimina ni modifica datos históricos. Inventario y hash incorporados al manifiesto; nuevas funciones/tablas clasificadas en las pruebas de seguridad.

Solo se ejecutó en PGlite descartable. Reversión segura: volver al código anterior conservando esta migración, reservas y fechas, que son compatibles con las lecturas existentes. No eliminar tablas ni restaurar la promoción antigua mientras queden entregas horarias pendientes. Cualquier aplicación o reversión en producción requiere la frase escrita de Facundo.

## Paridad con v29 `#s-planes`

| Pieza del boceto | Resultado del slice |
|---|---|
| `.peshare`: App / Por mail / PDF / Impreso | Misma estructura, orden e iconos. Mail aclara enlace autenticado en vez del adjunto dibujado (alternativa autorizada en el brief). Impreso abre la vista de papel, con Imprimir y sin botón Descargar PDF. |
| Gestión: Programar publicación | Abre el mismo formulario día/hora usado por Entrega; no es un aviso vacío. |
| Entrega: Programar entrega | Día y Hora como el diálogo del boceto; panel lateral con los tokens existentes, revisión obligatoria, errores visibles y estado persistido. |
| Cinco opciones PDF | Conservadas y usadas por la copia impresa: logo, medidas caseras, compras, recetas y semana por hoja. |
| ptabs2 / `#ptabs` | Comidas → Indicaciones → Compras → Versiones → Entrega, sin cambios de etiquetas ni orden. |
| Tipografía y temas | Inter heredada del panel, también en campos y títulos. Verificación de navegador a 1440 y 390, claro/oscuro. No se modificó CSS ni el boceto. |

La diferencia de texto sobre avisos automáticos es deliberada: el boceto simula app/mail; esta implementación explica que no hay un job que mande esos avisos. No se declara paridad visual global aprobada por este slice.

## Checklist obligatorio antes de habilitar

- [ ] Facundo revisa el PR; no hacer merge por cuenta del agente.
- [ ] Obtener su frase escrita antes de aplicar la migración en producción.
- [ ] Verificar manifiesto/hash y aplicar la migración antes de desplegar código que llama las RPC nuevas.
- [ ] Para usar mail, verificar transporte y origen público en un entorno autorizado; mantener el canal apagado hasta esa comprobación. No se enviaron correos reales en esta tarea.
- [ ] Ante fallos de mail, conservar reservas y revisar proveedor; no borrar ni reintentar envíos inciertos.
- [ ] Recordar que la programación se activa al consultar y no envía push/mail automáticamente; no configurar un cron como parte de este PR.
