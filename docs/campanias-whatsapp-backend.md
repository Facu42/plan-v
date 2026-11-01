# Campañas, WhatsApp, audio de consultas y bioimpedancia

Rama `work/campanias-whatsapp`. Backend para revisión; sin merge, despliegue, cambios remotos ni envíos reales. No modifica landing, login ni alta profesional.

## Alcance y contratos

- Campañas reutilizan `server/communications/catalog.ts`, plantillas genéricas sin datos de salud y la cola durable existente. Segmentos: sin consulta **marcada realizada** hace N días y sin registro de comida/hábito hace N días. No se interpreta la ausencia como incumplimiento ni se lee contenido clínico. Una paciente nueva espera N días desde su alta.
- `REACTIVATION_CAMPAIGNS_ENABLED=true` habilita API y worker; además cada consultorio debe tener `ops_campaign_settings.enabled=true`. Ambos vienen apagados. Cada transporte conserva sus propias condiciones (`MAIL_*`, `VAPID_*`, `WHATSAPP_*`). Sin ellas no hay envío. El máximo diario se reserva en PostgreSQL, por consultorio y día de Argentina, compartido entre canales. Cuenta intentos reservados, incluso fallidos/inciertos; no se repite automáticamente una entrega incierta.
- Baja general de campañas persistente y exclusiva de la paciente; además se respetan preferencias de correo, WhatsApp y suscripciones push. Se comprueba al reservar y justo antes de enviar; en push antes de cada teléfono. Una revisión de preferencias invalida la reserva anterior. Las bajas siguen disponibles con la bandera general apagada.
- WhatsApp usa el proveedor existente, exige plantilla estática aprobada con BAJA y callback de autorización obligatorio. El recordatorio conserva su revisión y permiso específico. El hash mantiene la equivalencia de marca ya usada por el catálogo y SQL. Todos los caminos HTTP de dispatch usan el mismo control.
- Captura y archivo de audio consultan los consentimientos registrados antes de abrir dispositivos o decodificar. El servidor vuelve a exigir los permisos al iniciar/subir/procesar. Tras confirmar la transcripción o una cancelación por retiro de permiso se elimina el audio. Ante error de base o pérdida del lease se conserva hasta recuperar el trabajo o vencer el plazo. El job repara borrados pendientes de tareas exitosas/canceladas y vence pendientes a siete días. No borra el texto clínico confirmado.
- Bioimpedancia (`BIOIMPEDANCE_ENABLED=true`, apagada de fábrica): parser local de texto para peso en kg, grasa corporal %, músculo kg, agua % y nivel de grasa visceral. Acepta coma decimal; faltantes, unidades ajenas o líneas ambiguas quedan nulos. No diagnostica ni usa IA externa. Guarda solo con `reviewed:true`, con autor y fecha de revisión, permisos de relación y medición vigentes y RLS del consultorio. No se añadió pantalla.

## API para probar en un entorno local

Usar cuentas ficticias de dos consultorios. Las pruebas automatizadas usan PostgreSQL en memoria y proveedores simulados; no requieren claves externas.

| Método y ruta | Datos / resultado |
|---|---|
| GET `/api/portfolio/campaigns` | Plantillas, configuración, últimas 100 campañas y 500 entregas |
| PUT `/api/portfolio/campaigns/settings` | `{enabled,daily_limit}`; límite entre 1 y 100, inicial 20 |
| POST `/api/portfolio/campaigns/preview` | `{segment:"no_consultation" o "no_app_record",days}`; N entre 1 y 3650, hasta 100 destinatarias por envío |
| POST `/api/portfolio/campaigns` | Segmento + `{request_key,channel,template,template_hash,patient_ids}`; idempotente y revalida pertenencia al segmento |
| POST `/api/portfolio/campaigns/deliveries/:id/dispatch` | Reserva, verifica baja y registra resultado |
| PUT `/api/portfolio/campaign-preferences/me` | Paciente: `{patient_id,opted_out}`; nadie puede otorgarlo por ella |
| POST `/api/patients/:id/clinical-workspace/bioimpedance/preview` | `{text}`; devuelve cinco medidas, `reviewed:false`; no guarda |
| POST `/api/patients/:id/clinical-workspace/bioimpedance` | `{id,recorded_on,values,reviewed:true}`; fecha ISO, idempotente |
| GET `/api/patients/:id/clinical-workspace/bioimpedance` | Últimos 100 registros revisados |

La preview devuelve el catálogo exacto de correo/push. Para WhatsApp se usa también la revisión existente `/api/portfolio/communications/template` (nombre e idioma), y su hash se confirma al crear la campaña. Un turno agendado no cuenta como consulta realizada. El límite de 100 requiere elegir otro lote para segmentos mayores; no existe envío masivo implícito.

## Migraciones y habilitación futura

SQL nuevo: `20261031200000_reactivation_campaigns.sql` y `20261031210000_bioimpedance_reviews.sql`. Solo se ensayaron en PostgreSQL local. Tablas con RLS, escrituras por funciones que verifican sesión/consultorio, funciones del worker solo para servicio. Sin modificación ni borrado de datos clínicos previos.

Lista obligatoria para una habilitación futura (no ejecutada en esta tarea):

1. Autorización escrita de Facundo para cualquier cambio de producción.
2. Probar y aplicar las dos migraciones en el entorno autorizado antes de habilitar nuevas banderas.
3. Verificar transporte, preferencias de la paciente, plantilla revisada y límite del consultorio.
4. Habilitar primero la configuración del consultorio y después la bandera general, solo en el entorno autorizado.
5. Para volver atrás, apagar banderas y configuración. Conservar tablas, bajas y registros; no deshacer columnas ni borrar auditoría.

Referencia de permisos consultada: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security). No se consultó ni modificó el proyecto remoto.

## Verificación y paso 10 de regression-guard

- **Flujos críticos verificados:** ✅ segmentos por consulta realizada y por registros; ✅ preview/creación idempotente; ✅ separación de dos consultorios; ✅ cupo común por día y rotación al pausar/agotar cupo; ✅ bajas antes de cada envío, incluida ruta WhatsApp anterior; ✅ recordatorio WA con plantilla vigente; ✅ consentimiento antes de capturar/subir; ✅ transcripción y borrado persistente reparable; ✅ revisión de bioimpedancia antes de guardar. 106 pruebas focales verificadas en 18 archivos: ronda de 105/105 y, tras corregir la rotación, ronda de 24/24 en los cuatro archivos afectados (agrega una prueba).
- **Regresiones cubiertas:** nueve reproducciones iniciales fallaron por falta de guard y retención de audio; ahora verdes. Prueba nueva impide omitir la comprobación de baja del proveedor. Pruebas adicionales cubren pérdida de guardado de transcripción y bloqueo de cola entre consultorios.
- **Contratos revisados:** navegador→snapshot de permisos; API→Zod→RPC con identidad de sesión; RLS→dos clínicas; cola→proveedor con autorización antes de POST; preview→medidas revisadas→registro firmado por profesional. Se conserva el hash compatible del recordatorio.
- **Áreas frágiles:** envíos inciertos nunca se reintentan; una baja o una bandera apagada invalida el envío; un cupo agotado rota la cola; audio no se borra antes de confirmar la transcripción. Revisión independiente de código y reality-checker sobre estos límites; ambos hallazgos corregidos y cubiertos.
- **Migraciones:** aditivas y probadas con PostgreSQL local, con RLS y funciones limitadas por rol. No aplicadas remotamente. Reversión operativa mediante banderas apagadas, conservando auditoría y bajas. No hay SQL destructivo de datos existentes.
- **Fire test:** ✅ se anuló temporalmente el guard del navegador; fallaron exactamente seis pruebas de consentimiento. Se restauró y la ronda final de 24 pruebas pasó.
- **Automatizaciones nuevas:** reserva de cupo transaccional, revalidación de bajas, rotación de cola, borrado inmediato seguro y recuperación por el job existente. Checklist de habilitación registrado arriba.
- **Comprobaciones:** `npm run check` (los tres tsc), `git diff --check`, `npm run check:migrations` y `npm run check:secrets`. Solo pruebas puntuales; suite completa, build y navegador no ejecutados por la indicación posterior de Facundo.
- **Veredicto:** SHIP para revisión como PR **en borrador**, con banderas apagadas. HOLD para merge, migraciones remotas, activación de proveedores o despliegue: están fuera de esta autorización.

Comando de selección principal:

```sh
npm test -- server/communications server/lab-reading server/consultations/worker.test.ts server/consultations/audio-cleanup.test.ts server/consultations/integration.test.ts server/consultations/postgres.integration.test.ts server/consultations/flow.test.ts src/lib/consultation-capture.test.ts server/push/push.test.ts server/clinical-workspace/lab-reading.routes.test.ts --maxWorkers=1
npm run check
```

Ronda posterior a la corrección de cola:

```sh
npm test -- server/communications/campaigns.postgres.test.ts server/communications/campaign-routes.test.ts server/communications/worker.test.ts src/lib/consultation-capture.test.ts --maxWorkers=1
```
