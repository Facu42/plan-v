# Habilitación por etapas · Plan V

Paquete para revisión; no ejecutado contra producción. Base revisada: `ae3dc30e3095d4856e3a5055fdeca5ebcf2424e3`. Ver [informe y Regression Guard](../nutridesk-integracion-2026-10-13.md), [manifiesto de diecisiete migraciones](nutridesk-migrations-2026-10-13.json) y `.env.example`. No colocar credenciales en este documento, Git, PR ni variables `VITE_`.

## Puertas obligatorias

- [x] Suite integrada actualizada el 14/10: 2.886 casos aprobados, cero fallos y dos omitidos, en 442 archivos. Incluye autorización/exportación histórica, correcciones de notas, PDF vigente y presupuesto nuevo del asistente. No incluye la fuente SARA 2 adicional en preparación. Tipos y compilación final aprobados; manifiesto canónico de diecisiete migraciones, secretos, migraciones y vistas aprobados.
- [x] Tipos, compilación web, límites de secretos, seguridad de migraciones y diferencias comprobados.
- [x] Revisión independiente y correcciones de gasto, consentimiento, cobros y concurrencia.
- [x] Diecisiete archivos SQL y hashes coinciden con el manifiesto; lectura de versiones alojadas sin aplicarlos.
- [ ] Revisión y autorización escrita de los PR; no merge automático a main.
- [ ] Copia previa verificada y ensayo de la cadena en Postgres/Supabase desechable con configuración equivalente. PGlite no sustituye la prueba alojada completa de Auth/Storage ni bloqueo concurrente de conexiones reales.
- [ ] Revisar aliases antiguos ya aplicados: no volver a ejecutar migraciones antiguas con otro timestamp sólo por su nombre local.
- [ ] Autorización específica escrita para las migraciones y configuración antes de producción.

## Orden de habilitación

1. **Acceso:** Gmail pospuesto por el usuario; elegir más adelante un remitente central propio conectado a Supabase Auth, sin solicitar la clave personal de cada cliente. El correo incluido sólo permite pruebas con miembros del equipo (dos por hora actualmente). Preparar el SMTP elegido mediante `scripts/auth-smtp-config.mjs`, primero en modo de comprobación; conservar destinos existentes. Configurar sólo tras autorización. Probar destinatario acordado, alta, invitación existente, recuperación, enlace vencido y contraseña nueva. Registrar resultado de entrega, nunca el enlace secreto ni la clave.
2. **Ficha y extracción local:** aplicar únicamente las migraciones nuevas pendientes según manifiesto y dependencias, comprobar permisos y buckets privados. Ensayar con dos consultorios y una recepción. Importación no debe crear cuentas ni invitar automáticamente. Publicar tema/fotos/ficha e importación con IA externa apagada.
3. **Audio e IA nueva:** API y worker con la misma configuración privada Groq. Mantener `AI_MODE`, `GROQ_ZDR_VERIFIED`, `GROQ_FREE_TIER_VERIFIED` y `CLINICAL_AI_COST_MODE` según verificaciones efectivas; no marcar comprobado por tener una clave. Validar grabación de ambas voces, interrupción, cierre, retiro de consentimiento, retención siete días y gasto concurrente cercano a USD 5. Sin herramientas ni procesamiento por lotes. Claves nuevas de reintento no liberan gasto incierto.
4. **Agenda y cobros:** `SCHEDULING_PUBLIC_BASE_URL` apunta al origen web; proxies estrechos en Vercel. Configurar claves privadas de firma/cifrado, OAuth por profesional y callbacks/credenciales de Google y Mercado Pago. Probar seña/total, dos cuentas, webhook duplicado, devolución, credencial revocada y revisión explícita de sincronización incierta antes de habilitar cobros reales.
5. **Comunicación:** `MAIL_ENABLED=false` y `WHATSAPP_ENABLED=false` hasta configuración y autorización propias. Acceso por SMTP Supabase es independiente del transporte operativo. Verificar plantilla aprobada, preferencias/consentimiento, baja real y no reenvío incierto. WhatsApp tiene costos separados de los USD 5 de IA.
6. **Clínica:** habilitar fórmulas sólo tras validación profesional de referencias. Kerr automático sigue pendiente; no anunciarlo como implementado. USDA requiere clave opcional y procedencia; mantener datos originales de laboratorio y medidas. La fuente adicional SARA 2 se incorpora en una entrega propia, con unidades, valores ausentes, incidencias y snapshots; su SQL y hash deben agregarse al manifiesto cuando esté validada, antes de habilitarla.

## Reversión y seguimiento

Antes del merge, acordar la etapa y comprobar SHA de revisión: main despliega web/API/worker automáticamente. Si aparece un fallo, pausar la integración afectada y los trabajos nuevos, volver al código anterior y conservar tablas, consentimientos, fichas, publicaciones y ledgers. No borrar pagos ni datos clínicos para revertir. Audio conserva eliminación a siete días. Un retiro de esquema requiere exportación/copia y un plan específico.

Después de cada etapa comprobar salud/API/worker, aislamiento, colas y estados inciertos. La disponibilidad del proveedor y la entrega real se registran aparte de los mocks. La autorización de código no activa servicios pagos ni sustituye autorización de base/configuración.
