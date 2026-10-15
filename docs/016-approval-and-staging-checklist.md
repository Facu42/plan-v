# 016 — paquete de aprobación y staging RLS

**Estado: checklist de preparación. No es aprobación, migración ni autorización
de conectar Supabase.**

- Contrato bajo revisión: `supabase/contracts/016_plan_v_contract_draft.sql`
- Estado del contrato: **DRAFT v2 — REVIEW ONLY — DO NOT APPLY / NO CORRER**
- Revisión de hallazgos: [`contract-016-review.md`](contract-016-review.md)
- Límites clínicos, privacidad y fuentes: [`limites-eticos.md`](limites-eticos.md)

No copiar este archivo a una consola SQL, no usar `supabase db push`, no cargar
pacientes reales, no configurar claves ni habilitar Storage, email o pagos con
esta lista incompleta.

## 1. Decisión de aprobación

La aprobación requiere una evidencia fechada y el nombre de quien la revisó. Las
personas responsables deben ser asignadas por Plan V; este documento no asume
que desarrollo sustituya a nutrición, privacidad, legal, DBA ni finanzas.

| Puerta | Evidencia exigida | Responsable a asignar | Estado |
| --- | --- | --- | --- |
| Dominio y UX | Confirma que menú semanal, fotos `pending_review`, hábitos declarados, recordatorios y paywall reflejan el producto actual. | Producto + Lic. responsable | ☐ |
| Seguridad PostgreSQL/Supabase | Revisión independiente de RLS, grants por columna, vistas definer, triggers y RPCs `accept_patient_invite` / `provision_nutritionist`. | DBA / seguridad | ☐ |
| Privacidad y clínica | Finalidad, base aplicable, aviso/consentimiento, atención de derechos, retención y eliminación; no reemplaza dictamen jurídico. | Privacidad + asesoría local + Lic. responsable | ☐ |
| Encargados y transferencias | Contratos/DPA y ubicación de datos para Supabase, email, IA y Mercado Pago antes de enviarles datos personales o sensibles. | Privacidad + compras/legal | ☐ |
| Operación | Runbooks aprobados para invite, Storage, pagos, incidentes y recuperación; responsables on-call definidos. | Operación | ☐ |
| Staging aislado | Matriz RLS de la sección 3 ejecutada con resultados y logs/redacciones adjuntos. | DBA + QA | ☐ |
| Go/no-go | Aprobación explícita de las seis puertas anteriores y versión/hash del artefacto de migración aprobado. | Responsables asignados | ☐ |

Si una puerta queda sin responsable, evidencia o aprobación explícita, el estado
continúa siendo **demo en memoria**.

## 2. Decisiones operativas que no debe completar código

Antes de convertir el borrador en una migración aprobada, registrar por escrito:

1. **Retención y borrado.** Plazo, base y flujo por categoría: ficha/menú,
   `meal_logs`, fotos, mensajes, cobros, auditoría, backups e índices. Debe
   contemplar que la documentación existente indica una guarda clínica mínima
   de 10 años para historia clínica; el alcance exacto de Plan V requiere
   validación profesional y jurídica.
2. **Derechos de la persona.** Canal y SLA para acceso/copia, rectificación,
   exportación, oposición/retiro cuando aplique y solicitud de eliminación;
   responsables para `privacy_requests`, `deletion_requested_at` y
   `anonymized_at`.
3. **Invitaciones.** Proveedor, remitente, data-processing terms, duración,
   expiración, reintentos, límite de reenvíos, revocación y soporte. No hay
   invitación real hasta que este flujo esté aprobado y probado.
4. **Storage.** Bucket privado, ruta `patients/<patient_id>/<archivo>`, MIME
   permitido, máximo, comprobación de contenido/magic bytes, tratamiento EXIF,
   URLs firmadas, TTL, auditoría, purga de objetos y reconciliación de huérfanos.
5. **Cobros.** Cuenta titular, sandbox, validación de firma, ventana de replay,
   idempotencia de eventos, conciliación, rechazo/reintegro y procedimiento de
   incidentes. Las transiciones `payments`/`billing_*` siguen service-only.
6. **IA.** Proveedor, datos mínimos enviados, consentimiento/base aplicable,
   contrato de encargado, retención del proveedor y confirmación de que fotos
   o datos de pacientes no se usan para entrenar modelos en v0.
7. **Secretos y acceso.** Ubicación de secretos sólo de servidor, rotación,
   mínimo privilegio, integrantes autorizados y procedimiento de revocación.

## 3. Matriz RLS staging (obligatoria)

### Entorno y reglas de ejecución

- Sólo instancia **descartable** y datos sintéticos no identificables.
- No usar `service_role` para demostrar permisos de paciente/nutri: cada prueba
  de actor debe usar un JWT de ese actor y el cliente `anon`/`authenticated`.
- El DBA registra: versión/hash de la migración aprobada, fecha, proyecto de
  staging, actor simulado, sentencia/llamada, resultado y evidencia redactada.
- Una denegación debe ser `permission denied`, `0 rows` por RLS o error del
  trigger/RPC esperado; una excepción inesperada es fallo.
- Repetir los negativos para lectura, inserción, actualización y borrado cuando
  el contrato declara ese comando. No aceptar sólo pruebas de API: RLS debe
  probarse contra la base.

### Fixture mínimo sintético

| Identidad | Relación |
| --- | --- |
| Nutri A | propietaria de Paciente A (`active`) y Paciente A-pendiente (`pending`) |
| Nutri B | propietaria de Paciente B (`active`) |
| Paciente A | `patients.user_id` de Paciente A |
| Paciente B | `patients.user_id` de Paciente B |
| Paciente A-pendiente | `patients.user_id` de fila `pending` |
| Service role | sólo para provisión, fixtures y transiciones que el contrato marca service-only |

### Casos de aceptación y denegación

| ID | Actor | Acción / objeto real 016 | Resultado esperado |
| --- | --- | --- | --- |
| RLS-01 | Nutri A | CRUD de `patients`, `meal_slots`, `meal_logs`, `habit_logs`, `reminders`, `timeline_events`, `appointments`, `ai_briefs` de Paciente A | Permitido dentro de su relación. |
| RLS-02 | Nutri A | Cualquier lectura/escritura sobre filas de Paciente B | Denegado/0 filas. |
| RLS-03 | Paciente A | `patients_patient_view`, `meal_logs_patient_view`, `messages_patient_view`, `appointments_patient_view` | Sólo su propia fila; nunca datos de B. |
| RLS-04 | Paciente A | Lectura cruda de `patients`, `meal_logs`, `messages`, `appointments` | No debe sustituir las vistas de paciente ni revelar campos profesionales. |
| RLS-05 | Paciente A | Verificar columnas de las vistas | Nunca `note_for_nutri`, `adherence_why`, `suggested_by_ai` ni `prep_note`. |
| RLS-06 | Paciente A | INSERT `meal_logs` propio | Sólo `pending_review`, `note_for_nutri=''` y `photo_path` bajo `patients/<A>/…`. |
| RLS-07 | Paciente A | INSERT `meal_logs` con `confirmed`, nota interna o path de B | Rechazado por policy/trigger. |
| RLS-08 | Paciente A | SELECT/UPSERT `habit_logs` propios | Permitido sólo con acceso pleno; B queda inaccesible. |
| RLS-09 | Paciente A-pendiente | Menú, vistas de logs/turnos y objeto de foto | Bloqueado por `patient_has_full_access`; mensajes enviados siguen visibles por su vista. |
| RLS-10 | Paciente A | SELECT `reminders` propios y `timeline_events` | Sólo recordatorios propios y timeline con `visibility='patient'`. |
| RLS-11 | Paciente A | INSERT/UPDATE/DELETE de `reminders` o `timeline_events` | Denegado: gestión profesional/service según contrato. |
| RLS-12 | Paciente A | UPDATE `profiles.role`; UPDATE `patients.billing_*` o `user_id` | Denegado por grant de columna, no sólo por UI/RLS. |
| RLS-13 | Nutri A | INSERT message con `author_id` de B; UPDATE/DELETE de mensajes | Rechazado: identidad caller-bound e inmutabilidad. |
| RLS-14 | Paciente A | INSERT mensaje propio con `suggested_by_ai=true`, `sent_at null` o `author_id` ajeno | Rechazado. |
| RLS-15 | Paciente A | Leer `ai_briefs`, `payments`, `patient_assets`, eventos de webhook/auditoría/privacidad | Denegado/0 filas según tabla; nada interno expuesto. |
| RLS-16 | Nutri A | Leer `payments` de A y cambiar pago o `billing_*` | Lectura propia permitida; escritura/transición denegada. |
| RLS-17 | Authenticated | Ejecutar `provision_nutritionist` | Denegado; sólo `service_role` puede promover/provisionar. |
| RLS-18 | Paciente invitado | `accept_patient_invite` válido | Una única aceptación con email confirmado y coincidente vincula el paciente. |
| RLS-19 | Paciente invitado | Invite vencido, revocado, ya aceptado o email distinto | Rechazado sin vincular ni mutar otro paciente. |
| RLS-20 | Nutri A / Paciente A | Foto en `storage.objects` | Bucket privado, prefijo correcto y sólo objetos del paciente relacionado; B y paths malformados denegados. |
| RLS-21 | Service role / webhook de prueba | Evento `(provider, external_event_id)` duplicado | Idempotencia: una sola aceptación; repetir no duplica pago/transición. |
| RLS-22 | Service role | Intentar borrar paciente con pagos aprobados | Falla por `restrict` hasta ejecutar el workflow de retención/anonimización aprobado. |
| RLS-23 | Nutri A | `meal_logs.meal_slot_id` de Paciente B | Rechazado por `validate_meal_log_slot`. |

Criterio: **todos los permitidos funcionan y todos los denegados fallan de la
forma esperada**. Una política que devuelve más filas de las debidas bloquea el
go/no-go aunque la API actual filtre su respuesta.

## 4. Pasaje controlado de borrador a staging

Sólo después del go/no-go de la sección 1:

1. Un DBA prepara una **migración nueva e inmutable** desde la versión revisada;
   el borrador del repo permanece como historial y no se ejecuta directamente.
2. Revisión por pares del diff de esa migración y de sus grants, policies,
   funciones `SECURITY DEFINER`, owner de las vistas y configuración Storage.
3. Aplicación exclusiva al proyecto descartable identificado en la evidencia.
4. Ejecución de la matriz RLS y smoke de los cuatro flujos del MVP con fixtures
   sintéticos. Ningún secreto, URL firmada válida, email ni payload de pago se
   pega en tickets o chat.
5. Corregir, revisar y repetir desde una instancia limpia si hay fallos.
6. Sólo con evidencias completas se planifica una aprobación separada de
   producción, credenciales y despliegue.

## 5. Evidencia mínima del go/no-go

Adjuntar o enlazar en el tracker seguro:

- revisión firmada del contrato/migración y hash;
- matriz RLS completa con resultado por ID y captura/log redactado;
- configuración de roles y pruebas negativas de grants;
- decisiones de retención, borrado, consentimientos/avisos y encargados;
- runbooks aprobados de invite, Storage, cobros, incidentes y recuperación;
- resultado de `npm test`, `npm run check`, `npm run build`, `npm audit`,
  firmas/attestations y `git diff --check` de la versión candidata;
- decisión explícita: **no aprobar / aprobar staging / aprobar producción**.

## Fuera de alcance

Este paquete no da asesoramiento jurídico, no suplanta evaluación de seguridad,
no crea cuentas, no contiene credenciales, no envía invitaciones, no procesa
pagos y no habilita datos de pacientes.
