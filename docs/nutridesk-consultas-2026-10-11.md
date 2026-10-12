# Consultas: audio, transcripción y resúmenes revisados

Entrega en `codex/nutridesk-consultas`, basada en `ae3dc30`. Sin cambios en producción, pagos, correos ni proveedores externos durante las pruebas.

## Comportamiento implementado

- Nota manual y carga de transcripción TXT sin IA. Grabación de micrófono y pestaña seleccionada, mezclados únicamente como audio PCM WAV. Indicadores separados de conexión y señal; captura sin audio remoto, interrumpida o con subida fallida se marca incompleta.
- Grabaciones cargadas se decodifican localmente en el navegador y se dividen en WAV independientes. Codec incompatible muestra una explicación y permite WAV o texto. Límite inicial: archivo de 20 MB y tres horas; segmento de 8 MB y 90 segundos, generado habitualmente cada treinta segundos.
- Consentimientos nuevos, opcionales y versionados: `consultation_recording.v1` y `ai_consultation.v1`. No se heredan permisos anteriores. La paciente los activa desde los permisos de IA existentes; la profesional no puede concederlos por ella.
- Sesiones vinculadas a paciente y, opcionalmente, cita. Transcripción y borrador privados. Copia compartida separada, revisada por la profesional y publicada como nueva versión inmutable. Editar o regenerar lo privado no modifica lo ya compartido.
- Procesamiento persistente por segmentos; guarda texto, marcas de tiempo y duración comprobada desde muestras PCM, sin confiar en duración enviada por el navegador. Al finalizar y completar los segmentos se encola un resumen privado; los trabajos fallidos permiten reintento explícito.
- Cola con reserva exclusiva, token por ejecución, renovación de 120 segundos cada treinta segundos, recuperación tras vencimiento y finalización condicional. Revocación de consentimiento cancela tokens y bloquea persistencia de resultados en vuelo; retiro del permiso de grabación expira el audio para eliminarlo en el siguiente barrido.
- Audio en bucket privado sin políticas de lectura para usuarios, sin enlaces públicos. Eliminación automática a los siete días. Notas y transcripción conservan la política clínica existente. Cierre inesperado se puede finalizar desde la ficha; el barrido marca capturas abandonadas de más de tres horas como incompletas.
- El demo conserva este módulo en su estado local y admite copias anteriores sin el nuevo dominio. No inventa respuestas de IA cuando falta proveedor.

## Integración del coordinador

Registrar `registerConsultationRoutes(app)` desde `server/consultations/routes.ts` después del middleware de autenticación y límites de la API. Rutas: GET/POST `/api/patients/:id/consultations` y POST `/:sessionId/chunks`. Comandos compartidos y validados en `src/types/consultations.ts`: start, finish, draft, summarize, publish y retry. Listado paginado de sesiones/resúmenes.

Importar `ConsultationNotes({ patientId, appointmentId? })` en la ficha profesional. `ConsultationSharedNotes({ patientId })` muestra a la paciente sólo las copias compartidas. Las consultas manuales conservan el comportamiento disponible cuando no hay configuración de IA.

Configurar `configureConsultationProcessing({ transcribeClinicalAudio, summarizeClinicalText })` desde `server/consultations/worker.ts`. Ambas funciones reciben `scope: {patientId,nutritionistId,requestedBy}`, `taskId`, `requestKey`, `sessionId`, `revision` y `consentVersion: 'ai_consultation.v1'`. Transcripción añade `audio`, `mime: 'audio/wav'` y `durationSeconds`; devuelve `{text,segments}`. Resumen añade `text`; devuelve `{summary}`. Para segmentos, la revisión del proveedor es `index+1`; para resumen, la revisión de la sesión.

El proveedor real y la bolsa global de USD 5 son propiedad de la entrega central, no se duplican aquí. Debe revalidar con RPC service-only `consultation_worker_allowed({ task_id })` antes/después y comprobar duración con `decodeConsultationWav` exportado en `server/consultations/audio.ts`. No transmitir si faltan configuración, verificación de retención cero, cuota o consentimiento.

El worker central debe llamar `runPendingConsultations()` y `cleanupExpiredConsultationAudio()`. Al retirar una cuenta, llamar `purgeConsultationAudioForPatient(patientId,persistent)` desde el trabajo de privacidad después de la desactivación: cancela trabajos, borra audio y resultados temporales; no elimina las notas profesionales retenidas. El paquete de exportación de la paciente debe incluir sólo las versiones compartidas; nunca transcripciones ni borradores privados.

## Evidencia ECC y Regression Guard, paso 10

La solicitud financiera `requestKey` permanece estable al recuperar un lease y cambia únicamente con el comando explícito `retry`; no cambia la revisión clínica para habilitar gasto. Repetir `summarize` o reenviar el segmento no desbloquea una reserva consumida o incierta. El ledger central decide si una respuesta no facturada permite reutilizar esa clave; ningún reintento automático libera gasto incierto.

- Flujos críticos verificados: ✅ separación de paciente/profesional, dos consultorios y administrador sin lectura clínica; ✅ copia compartida independiente; ✅ conflictos de revisión; ✅ permisos nuevos y revocación; ✅ lease vencido/trabajador viejo; ✅ duración WAV, reenvío distinto, orden de segmentos y auto-resumen. ⚠️ captura real de dos interlocutores en Chrome/Edge, codec de cada grabación real y visual a 1440/390 requieren comprobación de navegador después de integrar la ficha.
- Regresiones cubiertas: no reutilizar autorización vieja para audio/IA; no devolver transcripción privada a la paciente; no sobrescribir copia revisada al editar; no completar resultado revocado u obsoleto; no confiar en duración declarada para facturar; no registrar error del proveedor con datos sensibles.
- Contratos revisados: esquema compartido entre formulario/API, asociación de cita/paciente, RPC autorizadas, metadata de audio privada, proveedor inyectado y finalización CAS. Las tablas privadas no tienen escritura directa autenticada; el bucket sólo se usa en servidor/worker.
- Áreas frágiles: permisos, carreras de trabajador, subidas y navegación. Doble revalidación, tokens de ejecución, segmentos idempotentes por identificador/índice/hash y aviso de cambios/subidas pendientes.
- Migración: `20261011150000_consultation_sessions.sql`, aditiva. Verificada en PGlite local con roles y dos consultorios. No aplicada a Supabase alojado. Rollback operativo: desactivar rutas/worker y conservar tablas/bucket; cualquier retirada definitiva requiere exportación/copia antes de eliminar datos.
- Fire test: ✅ se desactivó temporalmente el control de revisión en memoria; falló `rechaza paciente cruzado y revisión vieja`; se restauró el control y pasaron las pruebas. Todo ocurrió en el worktree local.
- Automatizaciones nuevas: validación de WAV, consentimiento antes/después, cancelación transaccional por retiro, recuperación del lease, auto-resumen, expiración de audio y compatibilidad del estado demo. Integración del worker y privacidad son requisitos explícitos del coordinador.
- Pruebas: 15/15 aprobadas, en tres archivos (`flow.test`, `worker.test`, `postgres.integration.test`) con un trabajador. RED inicial en `4a9d4d7` (módulo ausente); GREEN inicial en `434107a`. Los tests SQL usan un esquema descartable con helpers de identidad mínimos; el coordinador debe repetir la cadena completa de migraciones y la suite integrada.
- Verificación: tipos web/servidor, compilación web, revisión de migraciones y límite de secretos aprobados; sin script de lint disponible. No se midió cobertura porcentual ni entrega a Groq real. No se afirma fidelidad visual ni captura comprobada por hardware.
- Veredicto: **HOLD para producción** hasta integración central, revisión independiente, suite integrada, prueba de navegador y aprobación de migración/configuración. Código listo para revisión y combinación local; no se hicieron push, PR ni publicación desde esta entrega.
