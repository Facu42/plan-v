# Comunicaciones: canales y revisión — 13/10/2026

Implementación local en `codex/nutridesk-core`. Sin activar servicios, usar credenciales ni enviar mensajes reales. La integración principal mantiene el registro de rutas, trabajador, permisos públicos y proxy web.

## Comportamiento y contratos

- `registerCommunicationChannelRoutes(app)` registra la difusión por correo, la revisión del recordatorio oficial y la baja pública exacta. El consultorio se deriva de la sesión; no se acepta un identificador de consultorio aportado por la interfaz.
- `tickCommunicationJobs(now?, limit=10)` reemplaza el recordatorio anterior: vence reservas incompletas, prepara avisos 24 horas antes de turnos existentes y procesa canales expresamente habilitados. La misma cola `ops_deliveries` conserva resultado individual y reserva de 120 segundos. Una entrega incierta nunca se reclama nuevamente.
- WhatsApp automático requiere `reminders`, relación de atención vigente, paciente activa y plantilla oficial APPROVED, estática, BODY único en es_AR, revisada contra el hash fijo. `broadcasts` no concede permiso para recordatorios. El proveedor vuelve a comprobar plantilla y permiso antes del POST.
- Correo exige `notification_preferences.email`, cuenta con correo confirmado y relación vigente. Las difusiones usan dos textos operativos fijos, revisión previa y hasta 100 pacientes seleccionadas. La consulta de elegibilidad de una cartera de mil pacientes usa una sola RPC privada y devuelve identificadores, sin direcciones de correo.
- Cambiar fecha/estado de turno cancela el recordatorio pendiente anterior. La comprobación previa al envío verifica la fecha reservada y las preferencias actuales. Retirar permiso durante el procesamiento impide el envío pendiente; una interrupción después de comenzar un envío se registra como incierta.
- GET de baja sólo muestra confirmación para evitar bajas por escáneres de correo. POST acepta el formulario y List-Unsubscribe One-Click. Los tokens se guardan como hash, vencen a los 180 días y se consumen una vez. La respuesta no identifica cuentas. Sólo el GET HTML exacto permite `form-action 'self'`; scripts, recursos, marcos y formularios del resto de las API siguen bloqueados.
- `EmailCommunicationPanel`, incluido en `CommunicationPanel`, presenta plantillas, pacientes elegibles, revisión, resultados individuales y configuración de la plantilla de recordatorio. Estados aceptados por el proveedor no se presentan como entrega en la bandeja de entrada.

## Configuración pendiente y publicación

La migración exclusiva es `20261012123000_communications_channels.sql`. Sus funciones de procesamiento, baja y elegibilidad son de servicio; creación y revisión son RPC autenticadas de la dueña. RLS impide consultar los envíos de otro consultorio. No amplía acceso clínico de recepción.

El transporte opcional usa nodemailer 10.1.0, instalado por la integración principal. `MAIL_ENABLED=false` conserva el servicio apagado. Gmail usa `MAIL_PROVIDER=gmail`, `SMTP_USER`, contraseña de aplicación en `SMTP_PASSWORD` y `SMTP_SENDER_NAME`; TLS estricto, puerto 465 y tiempos acotados. Brevo sigue disponible con `MAIL_PROVIDER=brevo` y su configuración existente. Credenciales presentes no activan envíos. Este transporte operativo es independiente del SMTP de Supabase Auth para alta y recuperación.

Antes de publicar: aplicar migración en entorno descartable, completar la revisión global y comprobar baja bajo el dominio/proxy real. Sólo después configurar proveedor y habilitar explícitamente el canal autorizado. Para rollback operativo deshabilitar `MAIL_ENABLED` y `WHATSAPP_ENABLED`; conservar cola y resultados. Cualquier rollback de esquema requiere una nueva migración revisada, sin borrar registros históricos.

La API oficial WhatsApp requiere cuenta y plantilla aprobada externas; Gmail/Supabase requieren configuración externa. No se comprobó entrega real ni se incurrió en esos costos. La lectura primaria comprobada fue el registro oficial npm de nodemailer (10.1.0, Node >=20, tipos incluidos); la navegación a la guía SMTP de nodemailer expiró y no se usa como evidencia de lectura.

## Regression Guard, pasos 1–10

1. **Flujos críticos verificados:** permisos separados de recordatorios/difusiones, alcance de dos consultorios, relación vigente, baja de correo, reprogramación, reserva exclusiva y resultado incierto cubiertos por pruebas locales. Entrega externa real pendiente de cuenta y activación autorizada.
2. **Regresiones:** no mezclar filas email con el despachador WA antiguo; cerrar SMTP no oculta aceptación o incertidumbre; formularios CSP utilizables; rechazo de encabezados/pies no revisados; cartera de mil sin mil viajes de red; revocación entre reserva y envío.
3. **Contratos:** DTO estrictos, hashes de catálogo iguales en código/SQL, scope autenticado antes de helpers privilegiados, plantillas/UI/backend, tokens sin identificación pública y resultados por canal.
4. **Acoplamiento:** reutiliza una cola y los permisos actuales; no duplica el envío anterior del trabajador. Las difusiones WA existentes permanecen manuales. El transporte se inyecta en pruebas para impedir llamadas reales.
5. **Migraciones:** extensión no destructiva, backfill de consultorio desde la difusión existente, restricciones de finalidad/índices idempotentes, permisos explícitos y pruebas PGlite. Rollback operativo por flags y preservación de resultados.
6. **Verificación:** 57 pruebas PASS en 12 archivos (`communications`, `mail`, `security/http.test.ts`, máximo un trabajador); `npm run check`, `check:migrations` y `check:secrets` PASS. Compilación y suite global final corresponden a la integración principal del árbol compartido.
7. **Áreas frágiles:** proveedor puede aceptar antes de un timeout, tratado como incierto sin reintento; permisos pueden retirarse durante procesamiento, revalidados; headers externos pueden bloquear la baja, prueba con middleware real y ajuste global por integración.
8. **Fire test:** dos pruebas nuevas fallaron primero con las implementaciones anteriores: formulario bloqueado por CSP y plantilla con HEADER/FOOTER fuera del hash. Tras los cambios, ambas y las regresiones focales pasaron. También se reprodujo previamente close SMTP que ocultaba la aceptación y se corrigió.
9. **Automatizaciones:** reserva persistente y vencimiento, reprogramación y baja cancelan pendientes, worker revisa permisos por mensaje, presupuesto/canales no se activan por mera presencia de claves; configuración listada en `.env.example`.
10. **Veredicto:** listo para integrar localmente. HOLD para habilitación externa/producción hasta validación global, migraciones, configuración y comprobación real autorizadas. No se hicieron commit, push ni operaciones de producción en esta entrega compartida.
