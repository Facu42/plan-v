# Campañas, WhatsApp, audio de consultas y bioimpedancia

## Pantallas (01/11/2026)

La web lee `GET /api/features`. Ese dato repite las banderas del servidor y arranca en falso: `REACTIVATION_CAMPAIGNS_ENABLED`, `BIOIMPEDANCE_ENABLED` y `LAB_DRAFT_ENABLED`. Con las tres apagadas no aparece el menú Campañas, ni el bloque de WhatsApp, ni la bioimpedancia, ni el borrador de laboratorio.

- Campañas (`/crm/desarrollo?modulo=campanas`): segmento, vista previa con la cantidad, canal y confirmación. Muestra el cupo que queda hoy, el historial y las bajas. Si la bandera está apagada, la pantalla dice «Próximamente». Confirmar prepara la campaña y no llama al envío.
- WhatsApp: en la ficha se ve si la paciente se dio de baja. En Ajustes se ve si la cuenta está cargada. Si faltan `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID` o `WHATSAPP_BUSINESS_ID`, dice «No disponible».
- Bioimpedancia, en las evaluaciones de la ficha: se pega el texto, se corrigen las cinco medidas y «Guardar revisado» manda `reviewed: true`. Abajo está la curva.
- Laboratorio: el borrador sale del texto pegado, sin IA externa. Cada valor se puede corregir. No se guarda si falta la revisión. El ejemplo sin nombres está en `server/lab-reading/fixtures/informe-anonimo.txt`.

No hay migración nueva. Las lecturas usan las tablas que ya tienen permiso por consultorio.

## Cómo dejar lista la cuenta de WhatsApp Business

Esto no se hizo en esta tarea. No hay token ni número real en el repositorio. Cuando Facundo lo autorice por escrito, los pasos son:

1. Crear la cuenta de Meta Business y sumar WhatsApp en el administrador de la app. El número tiene que ser de la API de WhatsApp Business, no la app común del teléfono.
2. Anotar tres datos y cargarlos en el servidor, sin commitearlos: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID` y `WHATSAPP_BUSINESS_ID`. Sin esos tres, el consultorio ve «No disponible».
3. Cargar también `WHATSAPP_APP_SECRET` y `WHATSAPP_VERIFY_TOKEN`. Hacen falta para saber que el aviso de baja viene de Meta. El webhook público es `GET` y `POST` de `/webhooks/whatsapp`.
4. Crear plantillas en idioma `es_AR`, de un solo cuerpo de texto, sin botones, sin imágenes y sin variables `{{ }}`. El texto tiene que incluir la palabra BAJA, para que la persona pueda dejar de recibir avisos.
5. El recordatorio de turno tiene que coincidir, palabra por palabra, con el texto operativo ya revisado. Recién ahí se guarda la revisión de la plantilla. Las campañas de correo y de aviso en la app usan las dos plantillas fijas, sin datos de salud.
6. Dejar `WHATSAPP_ENABLED` en falso hasta probar en un entorno que no sea producción. Apagar esa variable corta los envíos y conserva la cola y las bajas.

Mientras las banderas sigan apagadas, nada de esto manda un mensaje ni llama a Meta.

## Pantallas · Regression guard · paso 10

- Flujos críticos verificados: ✅ campañas apagadas muestran «Próximamente» y no llaman a la API (e2e); ✅ vista previa, canal, confirmación, cupo, historial y bajas (vitest y e2e con API simulada); ✅ baja de WhatsApp en la ficha y «No disponible» en ajustes; ✅ bioimpedancia con cinco medidas, guardado sólo revisado y curva; ✅ borrador de laboratorio con revisión obligatoria y fixture anonimizado. Login, cobros y MFA no se tocaron.
- Regresiones cubiertas: el menú no suma Campañas con la bandera apagada; otro consultorio no ve las bajas ni el borrador (403); sin revisión no hay pedido de guardado.
- Contratos revisados: `GET /api/features` repite las tres banderas; el tablero de campañas suma cupo, canales y bajas del propio consultorio; la ficha lee la baja; el borrador responde `reviewed: false` y no guarda.
- Áreas frágiles: un confirmado podría encolar envíos si alguien prende las banderas y el consultorio. La pantalla no llama al despacho. Con las banderas apagadas el worker tampoco manda campañas.
- Migraciones: no hay SQL nuevo. Las tablas existentes siguen con permiso por consultorio. `npm run check:migrations` aprobado.
- Fire test: ✅ se anuló el freno de revisión de la bioimpedancia; fallaron dos pruebas. Se restauró y volvieron a verde.
- Automatizaciones nuevas: la web lee las banderas del servidor en vez de una variable aparte. Si la consulta falla, todo sigue apagado.
- Veredicto: SHIP para revisión en borrador. HOLD para merge, producción, prender banderas o cargar la cuenta de WhatsApp.

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

SQL nuevo: `20261031200000_reactivation_campaigns.sql` y `20261031220000_bioimpedance_reviews.sql`. Solo se ensayaron en PostgreSQL local. Tablas con RLS, escrituras por funciones que verifican sesión/consultorio, funciones del worker solo para servicio. Sin modificación ni borrado de datos clínicos previos.

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

## Corrección de CI · 01/11/2026

Se revisaron con `gh run view --log-failed` los runs `41268479853` y `41269768506`. Ambos tenían las mismas cinco causas: dos FKs de bioimpedancia sin índice, inventario de migraciones incompleto, lista de funciones públicas sin las seis funciones nuevas, y prueba de cobros de octubre dependiente del mes real. La falla de Equivalencias era consecuencia del inventario incompleto.

Se agregaron los dos índices en la migración propia **todavía no aplicada**, se registraron las dos migraciones y sus hashes, se mantuvo la comprobación exacta de inventario (33 pendientes + 8 de base) y de permisos, y se fijó el reloj de la prueba de cobros a octubre con restauración al terminar. No cambió el código del centro de mando ni sus permisos.

Paso 10 complementario:

- Flujos críticos: ✅ índices de FKs, manifiesto exacto, visibilidad de Equivalencias, permisos por rol, cobros con fecha estable y aislamiento A/B de campañas/bioimpedancia.
- Regresiones: reproducción local de los cinco archivos fallidos antes del arreglo; 61 pruebas verdes después, en siete archivos. Sin omitir pruebas ni debilitar las comparaciones.
- Contratos: hashes SQL/manifiesto, inventario de funciones que puede ejecutar cada rol y fecha de referencia de datos ficticios.
- Áreas frágiles: inventario de migraciones y cambio de mes; se conservan verificaciones estrictas y se elimina la dependencia del calendario de CI.
- Migraciones: solo índices aditivos en el SQL propio aún no aplicado; ninguna operación remota. Hash actualizado. Rollback operativo: banderas apagadas.
- Fire test: el control de FKs y los otros cuatro archivos se reprodujeron en rojo con el estado anterior y quedaron verdes tras corregir las causas; se conserva además el fire test de consentimiento de la entrega original.
- Automatización: los guardas existentes ahora incluyen explícitamente las dos migraciones y seis funciones nuevas; el test de cobros usa un reloj determinista.
- Validación: `npm run check` ✅ y diff sin errores de espacios. Revisión independiente aprobada. Solo pruebas puntuales y tsc; no suite global ni build local.
- Veredicto: SHIP de la corrección a la rama del PR en borrador; el resultado de la nueva CI queda pendiente del push. Sin merge, despliegue manual ni producción.

```sh
npm test -- server/db-performance.postgres.test.ts server/nutrition-capabilities/exchange-visibility.postgres.test.ts server/ops/release-manifest.test.ts server/security/definer-grants.postgres.test.ts server/admin/centro.test.ts server/lab-reading/bioimpedance.postgres.test.ts server/communications/campaigns.postgres.test.ts --maxWorkers=1
npm run check
```

## Integración con main · 01/11/2026

Se integró `origin/main` (`8826ac83`) en la rama, sin rebase. Los conflictos Markdown conservan los dos aportes. El manifiesto une las migraciones de main y las propias (`20261031200000` y `20261031220000`) en orden de versión: 38 pendientes, 8 de base, 46 archivos. Centro y la prueba de permisos se tomaron completos de main. La lista JSON mantiene firmas completas y agrega solo las seis nuevas funciones cliente; helpers de transporte quedan internos y ningún permiso anónimo se reabre.

Paso 10 complementario de integración:

- Flujos críticos ✅: permisos de funciones con configuración Supabase simulada (anon, authenticated y funciones nuevas), manifiesto exacto, Centro y campañas/bioimpedancia con dos consultorios. 100 pruebas verdes en 13 archivos.
- Regresiones cubiertas: colisión de versión evitada, inventario combinado completo y lista de permisos con firmas (no solo nombres). Se conservan las pruebas de bajas, cupo y revisión profesional.
- Contratos: nuevas firmas contrastadas con los grants SQL y con `20261031235550_security_definer_grants`; revocación a PUBLIC/anon y transporte restringido a servicio. Manifiesto exacto 38/46 verificado.
- Áreas frágiles: orden de migraciones, hashes y permisos; no se debilitó ninguna comparación ni se reescribieron SQL ajenas.
- Migraciones: SQL propio intacto, sin aplicar remotamente. `npm run check:release-manifest` y `npm run check:migrations` aprobados.
- Fire test: se conserva el ensayo de consentimiento de la entrega y se ejecutaron las guardas de funciones nuevas cerradas/anon sin permisos del test de main.
- Automatización: inventario ordenado y lista exacta de seis firmas incluidos en los controles existentes.
- Veredicto: integración local verificada para commit/push. No se ejecutó merge del PR a main ni operación de producción; #244/#245 intactos.

```sh
npm test -- server/security/definer-grants.postgres.test.ts server/ops/release-manifest.test.ts server/admin/centro.test.ts server/communications server/lab-reading --maxWorkers=1
npm run check:release-manifest
npm run check:migrations
npm run check
```
