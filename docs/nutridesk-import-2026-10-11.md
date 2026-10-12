# Importación de pacientes · entrega local del 11/10/2026, cierre 12/10

Rama `codex/nutridesk-import`, base `ae3dc30`. No se tocó producción, no se enviaron correos reales y no se procesaron datos de salud con proveedores externos.

## Función disponible

El directorio abre «Importar pacientes». Excel `.xlsx`, CSV UTF-8/Unicode, Word `.docx`, PDF con texto o escaneado y fotos JPG/PNG se extraen en el navegador. Office se valida antes de descomprimir; se rechazan enlaces externos, XML con entidades, archivos antiguos `.xls`/`.doc`, archivos de más de 20 MB y PDF de más de 40 páginas. El lote admite 20 archivos y 100 pacientes. El texto extraído tiene límite de 200.000 caracteres por archivo; cada fragmento clínico confirmado admite 3.000.

La profesional asocia columnas, agrupa por email (nombres parecidos no identifican automáticamente a una persona), corrige contacto/fecha/valor/unidad, elige crear/incorporar/descartar y confirma cada ficha. Las unidades sugeridas sin columna son kg y cm, indicadas en la revisión. Los errores no eliminan la medición extraída: queda editable y debe corregirse antes de incluirla.

Crear importa contacto, teléfono y una ficha sin cuenta ni invitación. «Invitar» es una acción manual posterior, independiente. Se agregó el contrato que faltaba para preparar la primera invitación de una ficha importada; nunca se manda un mail desde la importación. El teléfono se carga sólo si falta: no reemplaza uno ya guardado.

Incorporar datos clínicos requiere ficha existente, revisión explícita y permisos vigentes de atención; mediciones además requieren su permiso, estudios el documental. Se guardan mediciones en los registros reales y antecedentes/estudios/planes históricos privados con archivo, SHA-256, página/hoja/fila. Los planes históricos no se publican ni cambian el plan actual. Los originales permanecen en la computadora; esta entrega conserva el texto y su procedencia, no una copia descargable del documento original.

## Contratos e integración

- Registrar `registerPatientImportRoutes(app)` de `server/patient-import/routes.ts` después del middleware de autenticación.
- `PatientImportDialog({onClose,onImported?})`: integrado en el directorio. `PatientImportedHistory({patientId})`: listo para Historia clínica; sólo profesional titular.
- API dedicada: `/api/patient-imports`, `/contacts`, `/:id`, `/:id/commit`, `/patients/:id/invite`, `/api/patients/:id/imported-history`.
- La revisión persistida contiene exclusivamente contactos/origen/acciones/resultados; el texto clínico permanece local hasta confirmar. Tras recargar, las fichas pendientes se retoman, y para texto no confirmado hay que releer el archivo. Una revisión de contacto cambiada exige lote nuevo; no puede sustituir silenciosamente uno confirmado.
- Migración `20261011160000_patient_import.sql` depende de `20261011141000_patient_phone.sql` del coordinador. Una transacción por fila, bloqueo de lote/origen/email, reintentos idempotentes y resultados parciales. Consentimiento comparte la cerradura de la sesión de ingreso. Las claves de consultorio son diferibles para conservar la transferencia existente.
- OCR alojado por Plan V: `jszip`, `tesseract.js`, `@tesseract.js-data/spa`; `@xmldom/xmldom` sólo para pruebas. `npm run build` prepara worker/core/idioma en `public/patient-import-ocr` desde el lockfile. En desarrollo correr `node scripts/prepare-patient-import-ocr.mjs` antes de abrir importación. Recursos generados ignorados, no se versiona su copia.
- El coordinador agrega `wasm-unsafe-eval` a `script-src` del CSP, conservando `worker-src self`, sin habilitar `eval` de JavaScript, CDN ni destinos de conexión nuevos. No se cambió `vercel.json` en esta rama.

## Evidencia

ECC TDD: `614b8e7` RED lector/mapeo inexistente; `6ebe3d0` GREEN 4 pruebas. `1a2f778` RED rutas inexistentes; `61186ad` RED migración ausente. Luego 18 pruebas de importación y 57 de inventarios/grants de seguridad, sin concurrencia de workers. Pruebas de invitación manual: RED 404, después GREEN. Las pruebas de Postgres usan PGlite descartable con grants abiertos como Supabase y dos consultorios.

Navegador gstack local: CSV → asociar columnas → revisar → confirmar → ficha visible en directorio, sin cuenta/invitación automática; diálogo cerrable después de confirmar. Capturas examinadas a 1440×1080 y 390×844 en `.gstack/import-1440.png` y `.gstack/import-390.png`. La importación no está dibujada en Figma: default de diálogo existente y tokens Nutrigo, con una columna en móvil. No se afirma coincidencia exacta contra un frame inexistente.

OCR de PNG ficticio probado en navegador: texto reconocido, sin errores de consola; worker/core/idioma solicitados exclusivamente desde el servidor local. Excel y Word reales se prueban con archivos Office ZIP generados; no se ejecutan fórmulas. Falta recorrido navegador de PDF escaneado y corpus de formatos históricos reales de consultorios.

Suite completa antes de actualizar inventarios: 2.483 aprobadas, 2 omitidas, 2 fallos por clasificación de nuevas funciones y ledger interno. Se corrigieron ambos inventarios y sus 57 pruebas pasaron después. Tipos, compilación, migraciones y barrera de secretos aprobados. El coordinador repetirá la suite completa sobre la integración final; no se presenta aquella corrida con dos fallos como totalmente aprobada.

## Informe regression guard (paso 10)

- Flujos críticos: alta sin cuenta/invitación, incorporación clínica con permiso, deduplicación, resultados parciales, reintentos, retiro de consentimiento y segregación de consultorios cubiertos. Navegador confirma el alta importada real en demo.
- Regresiones: agrupación case-insensitive, CSV con comillas, primer enlace manual de paciente importada, no sobrescribir teléfono, no retener borrador clínico remoto, transferencia sin bloquear claves externas.
- Contratos: Zod compartido/UI/API/RPC, demo y Supabase; origen para cada fragmento; teléfono coordinado con migración anterior; permisos de tablas y funciones inventariados.
- Áreas frágiles: archivos no confiables limitados, IA externa desactivada en este módulo, bloqueo compartido con consentimiento, invitación explícita, reintento por fila.
- Migración: aditiva, no destructiva; no aplicada a producción. Deshabilitar reversiblemente mediante revocación de ejecución de las cuatro RPC públicas y retirada de la UI; conservar tablas/contactos/historia para recuperación, sin borrar datos importados. Probar integración de la migración de teléfono antes de habilitar.
- Fire test: quitar la normalización de email hizo fallar agrupación (esperaba dos fichas y obtuvo tres); restaurada. Ningún dato real se usó.
- Automatizaciones: preparación OCR forma parte de build; validación de archivos/origen, grants/RLS y reintentos en pruebas. Publicación exige incluir CSP, migración previa y registro de rutas.
- Veredicto: **HOLD para publicación** hasta verificación integrada y autorización de producción. Código local revisable entregado; no se declara implementada la organización de documentos mediante IA externa ni el almacenamiento de originales descargables.
