# Operaciones de Nutridesk — informe histórico del 12/10/2026

**Estado vigente (15/10):** ver [entrega 7 de operaciones y comunicaciones](nutridesk-release-operaciones-2026-10-15.md). Ese informe actualiza el contrato con `request_id`, el proveedor Groq, el presupuesto global y las comprobaciones de la entrega. Las secciones siguientes documentan el checkpoint anterior y no describen por sí solas el estado actual.

Rama `codex/nutridesk-operaciones`. Sin publicación, migraciones hospedadas, credenciales nuevas ni mensajes reales. Este informe diferencia funciones conectadas de activaciones externas pendientes.

## Qué funciona en el código

- Asistente de cartera: consultas locales de comidas, pendientes y falta de registros; fuentes del consultorio navegables y comparación 7/30/90 días. CSV completo protegido contra fórmulas. Mil pacientes ficticias comprobadas. La ausencia de registros nunca significa incumplimiento; no se reutiliza una adherencia histórica para el período elegido.
- Propuestas de IA: sólo agregados de al menos cinco pacientes con permiso vigente. No salen nombres, identificadores, filas individuales, notas, mensajes ni la pregunta libre. El proveedor gratuito existente rechaza modelos pagos; no ejecuta herramientas. Se vuelven a comprobar asignación y permisos antes de mostrar propuestas generales revisables. **No se probó una respuesta externa real**.
- Ayuda con búsqueda, pasos y recuperación de errores. Preferencia del período predeterminado guardada por consultorio y descarga de indicadores. La marca queda en la configuración nutricional de la integración principal; no hay otra copia.
- Difusiones de WhatsApp: selección de hasta cien destinatarios, vista previa de plantilla oficial estática aprobada con BAJA/STOP, confirmación y resultados por destinatario. Se comprueba otra vez el contenido revisado y el consentimiento justo antes de solicitar el envío. Sin parámetros, imágenes ni texto clínico libre.
- Cola persistente de difusiones: confirmación idempotente, reserva exclusiva de sesenta segundos, token y finalización condicionada. Las reservas vencidas quedan inciertas y no se reenvían. El procesamiento se inicia por destinatario desde la lista, conserva pendientes tras cerrar la página y no simula entrega en demo.
- Preferencias WhatsApp: sólo la paciente vinculada otorga o retira permisos; quedan eventos auditables y revisión incremental. Una BAJA/STOP recibida con firma válida retira ambos permisos y cancela pendientes. Se conserva un webhook temprano; «aceptado» no se presenta como «entregado» y los estados no retroceden.
- Recordatorios existentes por correo: sin límite oculto de quinientos turnos. Exigen dirección confirmada, preferencia `notification_preferences.email=true`, consentimiento de atención vigente, paciente activa y turno del consultorio correcto. Se revalidan antes de enviar. Brevo sigue apagado; estos cambios no reemplazan el correo de acceso Supabase/Gmail.

## Contratos e integración

| Recurso | Operación |
| --- | --- |
| `/api/portfolio/indicators` | GET, período 7/30/90 y CSV opcional |
| `/api/portfolio/assistant` | POST `{question,days,use_ai}`; respuesta local con fuentes y propuestas generales opcionales |
| `/api/portfolio/settings` | GET/PUT `{default_days}`; exclusiva del consultorio |
| `/api/portfolio/communications` | GET resultados/preferencias; POST `{request_key,template,language,template_hash,patient_ids}` |
| `/api/portfolio/communications/template` | GET `name,language`; contenido aprobado y hash para revisión |
| `/api/portfolio/communications/:id/dispatch` | POST; reserva y procesa un destinatario, nunca reintenta estado incierto |
| `/api/portfolio/preferences/me` | GET/PUT `{phone,reminders,broadcasts,consent_version:'whatsapp.v1'}`; exclusiva de paciente |
| `/webhooks/whatsapp` | Verificación Meta y HMAC sobre cuerpo original, límite 256 KiB, cuenta/teléfono configurados |

Migración aditiva `20261012120000_ops_capabilities.sql`: preferencias/eventos, lotes/entregas, eventos de Meta y período del consultorio. RLS, permisos de tabla y RPC explícitos; funciones del trabajador sólo para servicio. Reversión operativa: apagar `WHATSAPP_ENABLED`, conservar auditoría y no retirar tablas con trabajos activos.

La integración principal debe montar `ContactPreferences` en privacidad/cuenta de paciente. `ProfessionalModules` ya conecta asistente, ayuda, reportes y difusiones mediante `/crm/desarrollo?modulo=...`. `ConfigurationReports` no guarda marcas; se combina con `NutritionSettingsPanel` en principal.

Activación externa posterior: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_BUSINESS_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, versión Graph y `WHATSAPP_ENABLED=true`. No se cargó ni activó ninguna. El costo de WhatsApp queda separado de IA. Un permiso retirado después de que Meta acepte el mensaje no puede deshacer esa entrega.

**Pendientes explícitos:** recordatorio automático de turnos por WhatsApp, difusiones por correo, panel de recepción, prueba real de Meta y proveedor IA, montaje de preferencias en principal y revisión visual final de la integración. No se declara implementado ninguno por tener un acceso o un permiso preparado.

## Evidencia ECC y Regression Guard

- RED: dos fallos por filas individuales/adherencia histórica; falta de proveedor y migración; rutas de difusiones/reportes ausentes; correo ignoraba baja. También se reprodujeron pérdida de webhook temprano, falta de revalidación y fallo después de «enviado» ocultado.
- GREEN: **33 pruebas focalizadas en siete archivos** (SQL PostgreSQL descartable, proveedor simulado, autorizaciones HTTP, recordatorios, indicadores y pantallas). Pruebas HTTP adicionales del registro global del asistente pasaron durante la suite completa.
- Tipos: `npm run check` aprobado. Compilación aprobada (advertencia de tamaño de algunos paquetes). Migraciones, secretos y diferencia de espacios aprobados. No existe comando de lint en este proyecto ni cobertura instrumentada en esta ejecución; no se inventa un porcentaje.
- Suite completa ejecutada: **2.532 aprobadas, dos omitidas y seis fallos en cuatro archivos**. Los fallos son fixtures de consultas heredados: orden del catálogo de permisos, `appointment.id` nuevo y clasificación de tablas/RPC de consultas. Los catálogos de operaciones se ampliaron explícitamente; los ajustes de consultas están en principal y deben preservarse al integrar. Repetir el gate completo en principal antes del PR.
- Fire test: quitar temporalmente el bloqueo de integración apagada hizo fallar la prueba que exige cero llamadas al proveedor. Se restauró y las ocho pruebas finales del proveedor pasan. Sólo proveedor simulado; nunca producción.
- Navegador gstack: recorrido local de consulta de pendientes obtuvo tres comidas pendientes con dos fuentes ficticias y captura de escritorio 1440. Se corrigieron campos sin borde y separación. El navegador falló luego con `spawn bun ENOENT`/`EEXIST`; una captura móvil quedó recortada y no prueba fidelidad. **No hay aprobado visual 390 ni afirmación de coincidencia con Figma**. Los frames originales no se tocaron; estas superficies nuevas usan card/controles y tokens existentes.
- Revisión estática propia: alcances HTTP/SQL, permisos exclusivos de paciente, renovación de preferencias, resultados inciertos, webhook temprano y revisión del contenido. Revisión independiente de la integración todavía pendiente.

### Informe del paso 10

- Flujos críticos: ✅ indicadores/asignación profesional, privacidad de contexto, opt-in/baja, reservas/deduplicación, firmas y estados de entrega, preferencia de correo, carteras de mil. ⚠️ envío externo real y recorrido completo paciente→preferencias requieren integración/configuración; visual móvil sin aprobado.
- Regresiones cubiertas: límites truncados, permiso retirado durante preparación, estado temprano perdido, entrega incierta repetida, falta de opt-in de correo y adherencia fuera de período.
- Contratos revisados: tipos de cliente/API, validación estricta, RLS/RPC, adaptador Meta, configuración separada de marca.
- Áreas frágiles: auth/alcance, consentimiento, callback externo y envío incierto. Se aplican controles en servidor y SQL; no se registra contenido sensible.
- Migraciones: aditiva, ejecutada sólo en PostgreSQL local descartable; activación/reversión explicadas arriba.
- Fire test: atrapado y restaurado ✅.
- Automatizaciones nuevas: idempotencia, revisión incremental, revalidación, baja y estados tempranos/monotónicos dejan de depender de memoria. Listas de privilegios prueban cada tabla/RPC nuevo.
- **Veredicto: HOLD para publicación.** Integrar ajustes de consultas, montar preferencias, obtener revisión independiente, completar comparación móvil y pruebas externas autorizadas. El módulo funcional queda preparado para revisión; ningún fallo se oculta ni se toma una configuración como entrega real.
