# Pendientes de Plan V

## Revisión vigente de avance — 2026-09-21

PV-24 en esta rama: adjuntos de chat sólo mediante assets autorizados (`chat_attachment`, bucket `care-documents`). Paciente y profesional pueden adjuntar; meal_photo/estudios/corporales no se mezclan. Preview 60 s `no-store` auditado; retiro 404; Marina 403/404. El DTO no lleva URL viva. Escrituras persistentes por RPC nueva (`send_thread_attachment` / `open_message_attachment`); el texto sigue en `send_thread_message`. Fail closed 501 sin schema. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL ni buckets. Verificación: 743 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente incompleto del plan: PV-26 outbox. PV-32 se salta (piloto gratuito). No PV-34. No visual Nutrigo.

PV-21 en esta rama: lista de compras del plan publicado. Ingredientes con cantidades y unidades (escala por porciones; misma unidad se suma; `g` y `taza` no se mezclan); texto libre sin cantidad inventada; agregados manuales que sobreviven a republicar; checks por `source_key` sincronizados. Escrituras sólo paciente (profesional 403). Fail closed 501 sin RPC. El fallback de títulos del menú semanal sigue si no hay plan fechado. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL. Verificación: 735 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente incompleto del plan: PV-24 adjuntos de chat. PV-32 se salta (piloto gratuito). No PV-34. No visual Nutrigo.

PV-33 en esta rama: E2E dos roles / go-no-go. Acta ejecutable `piloto-acta.v1` → **`go-synthetic-no-go-live`**. Demo Sofía/Marina (un `DEMO_NUTRITIONIST_ID`): receta asignada, plan fechado publicado, diario con IA caída (el registro queda), mensajes, turno, exportación ARCO, Marina no lee el paquete, webhook Mercado Pago 404. PGlite Nutri A/B + Paciente A/B: el mismo circuito + `42501` + `42883`. Viewports 390/1440 como contratos de layout (`/app` vs `/crm`, `lockedRole`); **no** es aprobación visual Nutrigo. `eval.v1` **no** es puerta clínica. **Live no**: hace falta Supabase vacío descartable + Railway en esta rama; el API público sigue PR #1. Verificación: 725 pruebas OK, 2 omitidas; check, check:migrations y build OK. P0 de código/demo/PGlite en H5 cubierto. Resto P0 humano (Railway, Auth live, PWA física, revisión de Verónica, retención legal).

PV-31 en esta rama: exportación/retiro/purga y restore conjunto. Pedido ARCO del paciente (`export`/`delete`/`correction`); paquete allowlist (ficha visible, intake, consentimientos, plan publicado, comidas, mensajes, mediciones, metadatos de archivos) **sin** notas clínicas, `adherence_why`, artefactos de IA ni URLs firmadas vivas; retiro corta lecturas; purga de fotos corporales espera 30 días; borrado lógico (`deactivated_at`) sin cascade de pagos; restore conjunto sigue ensayo (`applied_remote_sql: false`). Escrituras persistentes por RPC nuevas; sin schema → 501. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL ni se re-apuntó Railway. Verificación: 714 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-33 E2E dos roles (PV-21/24/26/32 son P1). No P1, no visual Nutrigo.

PV-30 en esta rama: frontend Vite, API Node y worker separados; perímetro de secretos (`VITE_*` no lleva service role); logs JSON sin PII; rate limits (auth/ops más estrictos; health/ready libres); alertas HTTPS sin clínica; `/api/health` y `/api/ready` públicos **en este binario**. **Live Railway sigue en el binario de PR #1** (`/api/ready` 401, CORS `*`); no se re-apuntó ni se inventaron claves. Verificación: 702 pruebas OK, 2 omitidas; check, check:migrations, build y check:secrets (test) OK. Siguiente P0: PV-31 export/purga/restore (PV-21/24/26 son P1). No P1, no visual Nutrigo.

PV-29 en esta rama: PWA de PR #3 cerrada sin reescribir. Shell `plan-v-shell-v2` borra caches viejos y avisa Recargar; offline explícito (`offline.html` + aviso in-app); `/api`, Supabase, Storage, functions y URLs firmadas fuera del cache; copy iPhone ≠ Android; avisos en login, Nutrigo y legado. **No se afirma instalación en un teléfono físico.** Verificación: 698 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-30 deploy/secretos/rate limits/alertas (PV-21/24/26 son P1). No P1, no visual Nutrigo.

PV-28 en esta rama: evaluación sintética `eval.v1` (30 escenarios) antes de publicar/asignar. Alergias y restricciones se revalidan al publicar, no sólo al generar; unknown bloquea; ningún alérgeno explícito del set pasa; faltantes/unidades/XOR/fechas/slots; `expected_version` desactualizada → 409; apply/worker no publican. Escrituras persistentes revalidan en RPC (`assert_health_publishable`); sin schema → 501. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL ni se inventaron claves de IA. Verificación: 691 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-29 PWA (PV-21/24/26 son P1). No P1, no visual Nutrigo.

PV-27 en esta rama: jobs de IA versionados para receta/menú (`prompt_version` + `context_hash`), límites de costo/tiempo/cola (25 s, 8k tokens/job, 200k/mes, máx. 3 activos → 429), contexto mínimo (sin nombre ni notas) y borradores profesionales (`apply` no publica). Escrituras persistentes van por RPC (`enqueue_ai_job` / `finish_ai_job` / `apply_ai_job`); sin schema → 501. Stale si cambia el ingreso → 409. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL ni se inventaron claves de IA. Verificación: 653 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-28 evaluación sintética (PV-21/24/26 son P1). No P1, no visual Nutrigo.

PV-25 en esta rama: turnos con `starts_at` timestamptz, timezone `America/Argentina/Buenos_Aires`, confirmación persistida (`patient_reply` / `confirmed_at` inmutable en el primer attending), reprogramación paciente sólo día/hora, cancel+insert (no borra el anterior), lock transaccional de solapes por profesional → 409. Escrituras persistentes van por RPC (`schedule_appointment` / `reschedule_appointment` / `confirm_appointment`); sin schema → 501. GET hospedado cae al `appointments` 016 sin columnas nuevas (no 500). **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL. Verificación: 646 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-27 jobs de IA (PV-21/24/26 son P1). No P1, no visual Nutrigo.

PV-23 en esta rama: hilos 1:1 reales con no leídos, `client_id` idempotente y recibos de entrega/lectura por persona (no por dispositivo). La primera marca queda; un segundo leído no cambia el instante. El GET de ficha no marca leído. Escrituras persistentes van por RPC (`send_thread_message` / `mark_thread_read`); sin schema → 501. GET hospedado cae al `messages` 016 sin recibos (no 500). **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL. Verificación: 635 pruebas OK, 2 omitidas; check, check:migrations y build OK. Siguiente P0: PV-25 timezone/historial de turnos (PV-21 es P1). No P1, no visual Nutrigo.

PV-22 en esta rama: diario foto/texto persistente. El registro se guarda **antes** de la IA; un `client_id` duplicado no crea otra comida; si la IA falla quedan foto/texto con `analysis_status=failed` y `macros=null`. Revisión profesional append-only en `meal_reviews`. Fail closed 501 sin schema/buckets. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL ni buckets.

PV-20 en esta rama: paciente ve el plan fechado publicado (detalle de receta, porciones, días vacíos reales, mismo contenido que CRM). Un borrador de receta posterior no cambia ese snapshot. Fail closed 501 sin schema. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL.

PV-19 en esta rama: planes fechados/versionados (slots, receta XOR texto, timezone `America/Argentina/Buenos_Aires`); publicación transaccional con `expected_version`; copia publicada inmutable; el borrador siguiente no la cambia. Fail closed 501 sin schema. **Live no**: el proyecto hospedado tiene `patients`; no se aplicó SQL.

## Revisión vigente de avance — 2026-09-19

Secuencia acordada en [informe del 19/09](revision-avance-2026-09-19.md):

1. Cerrar **invitación → ingreso → revisión → plan publicado** en staging descartable, con dos profesionales, dos pacientes ficticios, matriz RLS, persistencia tras reinicio/cambio de sesión, y **subida/retiro de un estudio**.
2. Validar acompañamiento e IA: diario, mensajes entre sesiones, agenda y propuesta → revisión de Verónica → publicación.
3. Completar el piloto: PWA instalable, procesamiento durable, respaldos/restauración y recorrido final en móvil.

En este árbol: Ver seguimiento y fecha futura ya corregidos; circuito de estudios PDF/JPG/PNG en demo y PGlite; matriz RLS-01…23 en PGlite; circuito invitación → ingreso → revisión → plan publicado en PGlite, API demo y navegador; **corte 2 de acompañamiento PASS en demo** (diario, mensajes, agenda, reemplazo publicado, fallo de IA cubierto por tests). **No hay `DISPOSABLE_DATABASE_URL`**: no se aplicó SQL remoto ni se acreditó Auth/Storage live. No aplicar migraciones a un proyecto con pacientes.

## Revisión vigente de avance — 2026-09-18

Continuación sobre el árbol sin consolidar del 17/09: módulo de seguimiento conectado (peso, cintura, actividad, fotos corporales, pagos manuales, reemplazos de menú con revisión profesional), navegación lateral en escritorio para ambos roles, lista de compras derivada del plan y de alternativas publicadas. **Pruebas locales: 509 aprobadas, 2 omitidas; TypeScript, build y guarda SQL aprobados.** `npm run apply:disposable` aplica `core`/`intake`/`care` a un Postgres vacío y aborta si ya hay pacientes; no hay `.env` local con `DISPOSABLE_DATABASE_URL`, así que no se tocó ningún proyecto remoto. Falta Auth/RLS live, estudios PDF y el circuito completo de Storage (PV-15).

Siguiente: cerrar verificación de navegador del seguimiento y, en el plan de acción, continuar Storage/estudios (PV-15/16) sin aplicar SQL a datos reales.

## Revisión vigente de avance — 2026-09-17

[Informe y prioridades actualizados](revision-avance-2026-09-17.md). Continuación sobre `532ff27`: guardados serializados con revisión confirmada, reintento de envío sin duplicación, recuperación de carga y revisión privada en CRM. **494 pruebas aprobadas, 2 omitidas; TypeScript, build y guarda SQL aprobados.** Navegador verificado en demo aislada. Falta Supabase descartable con Auth real; el runner histórico aún referencia el draft y debe actualizarse antes de usarlo. Los números de cortes anteriores que siguen abajo son históricos.

## Secuencia vigente tras la revisión de arquitectura — 2026-09-16

El [plan de acción revisado](plan-de-accion-2026-09-16.md) organiza el trabajo restante en **PV-01…PV-39**, con dependencias y criterios de aceptación. Ese orden prevalece sobre el orden histórico de pasos de este archivo: fundaciones/privacidad → contrato y persistencia → ingreso/archivos → recetas/planes → IA y acompañamiento → piloto → paridad completa Nutrigo.

Confirmaciones nuevas del usuario: **PWA paciente + CRM web**, y **fotos de comidas, estudios y fotos corporales opcionales desde el inicio**. La IA debe proponer menús y recetas para revisión/publicación profesional. El alcance está confirmado; estas funciones todavía no están implementadas por esta revisión.

- [Arquitectura y permisos](superpowers/specs/2026-09-16-plan-v-arquitectura-design.md).
- [Onboarding moderno e IA profesional](superpowers/specs/2026-09-16-plan-v-onboarding-ia-design.md).
- [Primer bloque ejecutable: PV-01…05](superpowers/plans/2026-09-16-plan-v-fundaciones.md).

Nueva verificación (fundaciones PV-01…05, 2026-09-16 noche): check y build aprobados; `check:migrations` en verde tras sacar el SQL de borrador de `supabase/migrations/`. Los 4 fallos de `server/contracts-016.test.ts` eran CRLF en Windows (`;\n` contra `;\r\n`); PV-06 normaliza el SQL en los tests. PV-07 monta Nutrigo en sesiones autenticadas y en el build de producción.

Estado PV-01…05:

- **PV-01** baseline en `docs/release-baseline.md`. Working tree del checkpoint local; no se publicó el remoto.
- **PV-02** `APP_MODE` obligatorio; demo sólo explícita; registro público siempre paciente.
- **PV-03** DTO paciente por allowlist; timeline paciente filtrada por `visibility=patient`.
- **PV-04** fallos de IA/DB ya no se disfrazan de éxito; foto persistente se rechaza antes de llamar al proveedor.
- **PV-05** guarda de migraciones + workflow CI. Node verificado: 24.16.0.
- **PV-06** núcleo 016 intacto; ampliación piloto en `supabase/contracts/016b_piloto_ampliacion_draft.sql` (DRAFT/NO CORRER). Diccionario y política en `docs/contrato-diccionario-piloto.md`. Fuera del piloto: `exercise_library`, organizaciones, listas de compra persistidas.
- **PV-07** Nutrigo entra al build de producción y a sesiones autenticadas. Rol tomado de la sesión (sin selector). Rutas `/app/:pagina` y `/crm/:pagina` con atrás/adelante y `#recurso=`. El selector de rol queda sólo en demo sin sesión; `?design=legacy` no aplica con sesión.
- **PV-08** lecturas/escrituras ordinarias usan el JWT del actor (`createActorClient` + AsyncLocalStorage). Service role queda para auth/provisión. Migraciones nuevas `20260917190000_core.sql` y `20260917190100_intake.sql` para esquema vacío; tests PGlite en `server/intake/postgres.integration.test.ts`. 016/016b draft siguen fuera de la cadena. No aplicar a un proyecto con pacientes.
- **PV-09** alta profesional por `POST /api/ops/nutritionists` con `PROVISION_SECRET` (nunca JWT de usuario). Invitación de un uso: crear → enviar (vence 7 días) → aceptar con email Auth confirmado y coincidente, o revocar. Recuperación de cuenta vía `/api/auth/recover` y el formulario de login, sin revelar si el email existe. 016 sigue sin aplicarse.

- **PV-10** paridad 016 de ficha, menú semanal, hábitos (incluye sueño), turnos, brief y objetivo publicado. Lectura posterior a cada escritura; si falta schema, 501 explícito (no éxito falso). Siguen 501 a propósito: archivo operativo (no hay `archived_at` en 016), cobranza (service role / PV-32), actividad, recursos, avisos y recibos de mensajes (016b / tickets posteriores).
- **PV-11** directorio paginado (`limit`/`offset` + `has_more`) sin extras N+1; el detalle y los mensajes (últimos 50) se piden al seleccionar. Cache de pacientes aislada por sesión: logout aborta requests y vacía el store. Respuestas `/api/*` van con `Cache-Control: no-store`.
- **PV-12** intake `intake.v1` autodeclarado separado de `clinical_notes`. Consentimientos versionados. Memoria + RPC Supabase (`server/intake/repository.ts`); 501 si falta schema. Un paciente con billing pendiente igual puede completar ingreso y consentir.
- **PV-13** onboarding de nueve pantallas, autoguardado serializado (800 ms + avanzar), reanudación y envío idempotente. Vacío ≠ “no tengo”.
- **PV-14** ficha profesional muestra resumen de ingreso, faltantes, alergias y notas privadas; el paciente no ve `reviewed_by` ni observaciones clínicas.

Siguiente: verificación de navegador del seguimiento, después Storage/estudios (PV-15/16). No aplicar las migraciones a un proyecto con datos reales.

El registro de cortes que sigue se conserva como evidencia de **demo/memoria**. Sus casillas no acreditan producción ni aprobación visual integral.

**Última actualización:** 2026-09-17  
**Estado general:** demo funcional en memoria con las once entradas profesionales, las seis acciones principales y las superficies paciente Agenda, Compras, Progreso, Diario, Plan semanal, Menú saludable, Mensajes, Ejercicio y Recursos operativas en el consultorio Plan V. El showroom es la interfaz canónica de la demo (`/` en desarrollo); `?design=legacy` queda como escape. Recursos ya permite asignación individual/masiva y seguimiento de lectura en demo, pero todavía no está habilitada para pacientes reales ni producción.

Este es el registro canónico de pendientes. Los cortes terminados y su evidencia técnica se conservan en `.scratch/`.

## Norte de producto

El paciente usa un producto con **la estructura y las funciones de Nutrigo**. Encima se agregan los vínculos con la nutricionista. El CRM es el **eco profesional** de esa misma vida, no otra app.

1. **App paciente (completar primero):** Inicio, Agenda, Mensajes, Menú, Plan, Compras, Diario, Progreso, Ejercicio y Recursos como destinos de primer nivel; detalle de receta y de guía dentro de esas superficies. Escritorio con menú lateral al estilo del pack; móvil con barra inferior. Marca Plan V, español, tema oscuro propio.
2. **Vínculo con el consultorio:** invitación e ingreso, consentimiento, plan/recetas que ella publica, revisión de comidas, turno y confirmación, mensajes, guías asignadas, objetivo publicado, rutina sólo con profesional habilitado. El paciente no edita la ficha clínica ni ve notas internas.
3. **CRM:** directorio, ficha, diario a revisar, plan, consultas, agenda, objetivos, mensajes, actividades, recursos asignados y los once módulos. Refleja lo que el paciente registra y lo que Verónica publica.

No copiar assets, identidades, health score ni cifras clínicas del kit. No inventar peso, macros o recetas para rellenar pantallas.

**Estado visual (corte 75):** el espacio paciente recupera el menú lateral de Nutrigo en escritorio (≥1100 px) con las diez superficies. En móvil sigue la barra de 4 destinos + Más. El CRM profesional conserva su barra inferior.

**Corte 76 (calendario):** Agenda paciente con vistas mes/semana/día sobre eventos reales ya existentes (próxima consulta, indicaciones del plan mapeadas a la semana lunes–domingo actual, `meal_logs` y `activity_logs`). La Agenda profesional muestra el mismo calendario como eco de la paciente seleccionada.

**Corte 77 (avisos de consulta):** campana en ambos roles con las próximas ocurrencias publicadas (hasta 7 días). Aviso en Inicio si es hoy, mañana o en breve. Se pueden marcar como listos en el dispositivo.

**Corte 78 (historial, reprogramación, recordatorios y avisos):** la paciente ve el historial de cambios de turno y puede reprogramar día/hora del turno vigente (sin cancelar ni cambiar modalidad). La campana suma comidas y hábitos del plan de hoy. El teléfono usa avisos del navegador en este dispositivo; el mail queda en un buzón demo y no sale a internet. Timezone y conflictos siguen abiertos.

## Estado verificado

- [x] Suite local: 73 archivos, 370 pruebas aprobadas.
- [x] TypeScript de frontend y servidor aprobado.
- [x] Build de producción aprobado: 121 módulos transformados.
- [x] Auditoría npm: 0 vulnerabilidades; firmas y attestations verificadas.
- [x] Frontend demo y API operativos en `5180` y `3010` al cerrar el último corte.
- [ ] Trabajo consolidado en Git: la rama `cursor/professional-app-ai-ca47` está 1 commit por delante del remoto y mantiene numerosos cambios y archivos sin seguimiento.

## Alcance ampliado: paridad funcional con Nutrigo

**Fuente local incorporada:** `../nutrigo_reference/Nutrigo - Nutrition & Diet Dashboard/`. El inventario de 36 frames, medidas exactas y matriz de convergencia está en [Nutrigo local → Plan V](nutrigo-reference-map.md). Esta referencia sustituye las estimaciones del preview; no elimina módulos ni capacidades propias. Usuario confirma Poppins, licencia adquirida del pack, peso/medidas opcionales y rutinas por profesional habilitado. El relevamiento de controles heredados todavía no está completo.

La referencia aporta doce superficies. Plan V implementará funciones equivalentes con diseño original, marca propia y doble flujo: la nutricionista crea/revisa/asigna; el paciente consulta/registra/responde. No se copiarán imágenes ni assets del preview.

| Superficie de referencia | Funciones adicionales para Plan V | Relación multipaciente |
| --- | --- | --- |
| Dashboard | resumen diario, calorías/macros, hidratación, sueño, agenda, comidas, progreso y accesos rápidos | CRM agregado + dashboard individual por paciente |
| Calendar | calendario mensual/semanal/diario, comidas, consultas, recordatorios, ejercicios y detalle de evento | la nutricionista agenda/asigna; el paciente confirma y consulta |
| Messages | buscador de conversaciones, adjuntos, perfil contextual, archivos compartidos y estados de entrega | inbox multipaciente de la profesional + hilo privado del paciente |
| Healthy Menu | biblioteca de recetas, categorías, búsqueda, filtros, favoritos y recomendadas | la profesional crea/aprueba/asigna; el paciente explora sólo lo habilitado |
| Recipe Details | foto, porciones, macros, ingredientes, checklist, pasos, tiempos, utensilios y sustituciones | edición profesional + vista/uso del paciente |
| Meal Plan | planificador semanal visual, navegación por semana y asignación de recetas a cada comida | plantilla profesional por paciente + lectura/seguimiento individual |
| Grocery | categorías, cantidades, unidades, comprado/pendiente, agregado manual, filtros y resumen | lista derivada del plan; paciente opera, profesional puede revisar |
| Food Diary | registro cronológico, foto/descripción, macros, filtros por fecha/comida y estados de revisión | paciente registra; nutricionista confirma o ajusta |
| Progress | gráficos de adherencia, objetivo, hidratación, sueño, energía y tendencias | comparativa profesional entre pacientes + detalle privado individual |
| Exercise | biblioteca, agenda, duración, series/repeticiones, registro y progreso | sólo actividad aprobada/asignada; sin prescripción automática |
| Insight | artículos, categorías, destacados, búsqueda, detalle, tags, relacionados, favoritos y compartir | contenido profesional asignable a uno o varios pacientes |
| Global | búsqueda, notificaciones, perfil, favoritos, estados vacíos/error y responsive 1440/800/390 | resultados y alertas siempre limitados al actor y su relación |

### Funciones sensibles que requieren decisión y contrato

- [x] Alcance de producto: usuario aprueba peso y medidas opcionales, registro de actividad y rutinas asignadas por profesional habilitado.
- [ ] Peso/medidas: implementar historial, permisos, consentimiento y retención. Actualización 2026-09-16: fotografías corporales opcionales y estudios incluidos por confirmación del usuario; requieren modelo, consentimiento específico, Storage privado y QA antes de datos reales.
- [ ] Ejercicio: el registro paciente autodeclarado ya funciona en memoria y es visible para su nutricionista; faltan persistencia/RLS y acreditación/permiso para asignar rutinas. El rol nutricionista por sí solo no habilita prescripción automática.
- [ ] Presupuesto y gastos de supermercado: confirmar si aportan valor o si Grocery queda sólo como lista operativa.
- [ ] Contenido editorial clínico de Insights: autoría, revisión y derechos de imágenes. La biblioteca actual contiene sólo seis guías operativas originales sobre el uso de Plan V y prohíbe la publicación clínica automática por IA.
- [x] Usuario confirma que compró la licencia de todo el pack Nutrigo y autoriza su uso en Plan V. Conservar procedencia de los assets; esto no afirma revisión independiente de términos legales.

## P0 — Bloqueos para usar datos reales

### 1. Aprobar el contrato de datos 016

- [x] Reabrir el contrato como versión ampliada documental (PV-06): 016 queda como núcleo; 016b cubre intake, consentimientos, recetas/planes, archivos por categoría, jobs de IA, recibos, historial de turnos y recursos. No se aplica SQL.
- [x] Diccionario, permisos por acción y política de archivo/exportación/borrado en `docs/contrato-diccionario-piloto.md` (propuesta, no dictamen legal).
- [x] Separar schema piloto de extensiones: `exercise_library`, organizaciones/equipos, shopping_lists persistidas y presupuesto quedan fuera de 016/016b (PV-35/38/39).
- [ ] Actualizar la matriz RLS ejecutable y seeds para cada entidad nueva (PV-08). El RLS de 016b es mínimo fail-closed, no la suite A/B.
- [ ] Asignar responsables para producto/nutrición, seguridad/DBA, privacidad/legal, proveedores, operación y QA.
- [ ] Aprobar las siete puertas de `docs/016-approval-and-staging-checklist.md`.
- [ ] Confirmar plazos de retención con privacidad/legal (los de PV-06 son de trabajo).
- [ ] Revisar formalmente las RPC `accept_patient_invite` y `provision_nutritionist`.
- [x] Convertir el núcleo revisado en migraciones nuevas e inmutables. No ejecutar 016 ni 016b sobre un proyecto con pacientes reales. `npm run apply:disposable` aplica `core`/`intake`/`care` a un esquema vacío y aborta si ya hay pacientes.
- [ ] Ejecutar los casos `RLS-01…RLS-23` con usuarios sintéticos en una instancia descartable. PV-08 cablea JWT y deja RLS-02 live detrás de env; el resto de la matriz sigue pendiente de esa instancia.
- [ ] Adjuntar evidencias redactadas, hash de la migración y decisión explícita de go/no-go.

### 2. Completar Supabase y aislamiento multiusuario

La API falla de forma explícita con `501` en operaciones que aún no tienen contrato persistente aprobado. Falta:

- [ ] Alta e invitación real de pacientes. PV-09 deja el ciclo crear/enviar/revocar/aceptar y recuperación; falta aplicar 016 en instancia descartable para persistirlos.
- [ ] Edición y archivo/restauración de pacientes mediante `archived_at`. PV-10 persiste la ficha (nombre/estado/etapa/notas profesionales); el archivo operativo sigue 501 porque 016 no tiene esa columna.
- [ ] Persistencia de objetivos e historial profesional. PV-10 escribe `patients.goal`; `goal_status`/`goal_history` quedan para 016b.
- [x] Creación, reprogramación y cancelación de turnos (PV-10 + PV-25 en demo/PGlite). Reprogramar no borra: marca `cancelled` e inserta. Solapes 409. Confirmación persistida. Live schema bloqueado (`patients` existe).
- [x] Escritura del menú semanal (PV-10, `meal_slots`).
- [x] Persistencia completa de sueño/hábitos (PV-10, `habit_logs.sleep_minutes`).
- [x] Descarte persistente de briefs del copiloto (PV-10, `ai_briefs.status=dismissed`).
- [ ] Cobranza y transiciones de `billing_status`/`billing_until` sólo por flujos autorizados.
- [ ] Verificar con RLS real que Nutri A nunca pueda leer o escribir datos de Nutri B.
- [ ] Verificar que la vista paciente nunca exponga notas internas, briefs, razones de adherencia, borradores ni historial profesional.

### 3. Aprobar e integrar servicios externos

- [ ] Email transaccional para invitaciones: proveedor, remitente, TTL, reintentos, revocación y rate limiting.
- [ ] Storage privado de fotos: MIME, magic bytes, límite, EXIF, rutas por paciente, URLs firmadas, TTL, purga y objetos huérfanos.
- [ ] Mercado Pago Checkout Pro en sandbox: preferencia, firma de webhook, replay window, idempotencia, conciliación, rechazo y reintegro.
- [ ] Proveedor de IA: datos mínimos, consentimiento/base aplicable, DPA, retención y prohibición de entrenamiento con datos de pacientes.
- [ ] Gestión de secretos sólo en servidor, rotación, mínimo privilegio y revocación.

### 4. Operación y despliegue

- [ ] Preparar staging aislado y un candidato de versión reproducible.
- [ ] Configurar variables por ambiente sin cargar datos reales antes del go/no-go.
- [ ] Desplegar frontend y API; verificar que el commit desplegado coincida con el aprobado.
- [ ] Añadir monitoreo, logs seguros, alertas, rate limiting y telemetría mínima.
- [ ] Definir backups, restauración probada, respuesta a incidentes y responsables on-call.
- [ ] Ejecutar E2E de los cuatro flujos del MVP con datos sintéticos.
- [ ] Aprobar go/no-go separado para producción.

## P1 — Roadmap funcional ordenado

### Paso 1 — Identidad y sistema visual Plan V

**Estado visual (corte 75):** el paciente sigue la IA de Nutrigo (sidebar en escritorio, 10 superficies). El CRM profesional sigue en barra inferior. Sigue abierto el refinamiento fino y completar funciones del pack que todavía están recortadas.

- [x] Integrar el logo oficial mediante la marca compartida de login, sidebar/topbar, app paciente y estados de carga/error.
- [x] Sustituir los tokens raíz por la paleta extraída del logo: `#083A30`, `#23955D`, `#62AA66`, `#F9B343`, `#F87D6D`, `#F86648`, `#F5A067`, `#F9F6EE`.
- [x] Implementar base visual del showroom: navegación, cards, botones, búsqueda, directorio, badges, gráficos y estados.
- [x] Dashboard paciente aislado con plan, diario, conversación operativa y progreso de solo lectura; responsive 1440/800/390/320 y ambos temas.
- [x] Showroom CRM con KPIs agregados, selección multipaciente y once módulos operativos dentro de Nutrigo. Ficha, Comidas, Plan, Consultas, Pacientes, Agenda y Objetivos mantienen sus superficies específicas; Reciente, Guardado, Centro de seguimiento, Paneles y Videollamadas usan `ShowroomWorkCenter`. Guardado conserva Planes B y permite asignar las seis guías operativas a uno o varios pacientes.
- [x] Lista de compras paciente dentro de Nutrigo, derivada sólo del plan semanal vigente: categorías, deduplicación, ocurrencias, checklist local aislado por paciente, búsqueda, filtros y exportación. No agrega cantidades, unidades ni alimentos no expresados.
- [x] Progreso paciente específico en Nutrigo: adherencia, objetivo publicado, agua, sueño, energía, actividad diaria y estados de comidas derivados de la ventana segura de siete días; sin exponer notas profesionales ni inventar mediciones.
- [x] Diario de comidas paciente específico en Nutrigo: resumen real, cronología, búsqueda, filtros por estado, macros sólo en comidas revisadas y registro operativo (foto/texto + IA) reutilizando el endpoint y el circuito existente; verificado con read-back API en servicios aislados.
- [x] Agenda paciente Nutrigo: calendario mes/semana/día sobre la próxima consulta, el plan de la semana actual, diario y actividad; confirmación de asistencia demo; reprogramación de día/hora por la paciente; historial de cambios de turno; enlace HTTPS seguro y acceso a Mensajes (cortes 76–78).
- [x] Menú saludable paciente Nutrigo derivado exclusivamente del plan vigente: títulos deduplicados, días, momentos, ocurrencias, búsqueda y filtros; imágenes ilustrativas rotuladas y navegación real a Plan/Compras, sin fingir una biblioteca de recetas.
- [ ] Validación visual integral de tema claro/oscuro, densidad, tipografía e iconografía. Casilla reconciliada con `tasks/todo.md` y el mapa Nutrigo: no se encontró evidencia unívoca de aprobación general. Se conservan los controles visuales puntuales ya registrados.
- [x] IA paciente Nutrigo (corte 75): diez superficies en menú lateral de escritorio; móvil 4 destinos + Más. El CRM profesional conserva barra inferior.

**Dirección visual (corte 72):** consultorio nutricional moderno con navegación inferior. Paleta del logo, Poppins, tipo de lectura 12–16 px, títulos 22–26 px, menú fijo abajo, tarjetas con borde fino. El showroom reemplaza las pantallas viejas en demo; `?design=legacy` se conserva como interfaz anterior.

### Paso 2 — Contrato de producto ampliado

- [x] Inventario de entidades demo/derivadas/futuras y matriz de permisos por rol documentados en `docs/contract-expansion-inventory.md` (borrador sin SQL, corte 70; actualizado con 016b en PV-06).
- [x] Modelar en 016b recetas/ingredientes, planes fechados, progreso permitido (mediciones/fotos corporales), notificaciones (outbox) y recursos. Favoritos unificados, grocery persistido y ejercicios/rutinas siguen post-piloto.
- [x] Actualizar diccionario/privacidad documental sin ejecutar migraciones (`docs/contrato-diccionario-piloto.md`).
- [ ] Preparar seeds demo y contratos API para desarrollar cada vertical slice en memoria.
- [ ] Matriz RLS completa + migración inmutable: PV-08.

### Paso 3 — Dashboard dual

- [x] Dashboard paciente con resumen diario, macros, hábitos, agenda, comidas y progreso.
- [x] Dashboard nutricionista con agregados y navegación al paciente origen (resumen navegable, corte 68).
- [x] Cada KPI deriva de datos existentes y abre un flujo real (corte 66).

### Paso 4 — Calendario y agenda

- [x] Base operativa: Agenda profesional agregada y Agenda paciente Nutrigo de sólo lectura sobre la próxima consulta vigente, con calendario mensual, modalidad/duración, enlace HTTPS seguro y acceso a Mensajes.
- [x] Vistas mes/semana/día y filtros sobre eventos fechados reales (corte 76): próxima consulta derivada, plan de la semana calendario actual, registros de diario y actividad. Sin historial de consultas inventado. Evidencia: `.scratch/nutrigo-calendar/76-patient-calendar.md`.
- [x] Eventos de consultas, comidas (plan de la semana vigente + `meal_logs`) y actividad autodeclarada (corte 76). Eco en Agenda profesional de la paciente seleccionada.
- [x] Avisos in-app de próximas consultas para paciente y nutricionista (corte 77): campana, recuento, aviso en Inicio si es hoy/mañana/en breve, ocultar en el dispositivo.
- [x] Historial de turnos (cambios publicados y fechas vencidas) y reprogramación de día/hora desde la paciente, conservando duración y modalidad (corte 78). No registra asistencia.
- [x] Recordatorios de comidas y hábitos derivados del plan de hoy, agua y descanso (corte 78).
- [x] Avisos al teléfono vía Notification del navegador en este dispositivo, y mail en buzón demo (corte 78). Sin proveedor de envío ni push remoto.
- [x] Zonas horarias y detección de conflictos (PV-25 demo/PGlite): timezone Buenos Aires, lock transaccional por profesional, 409 si se solapa. Live schema bloqueado.
- [x] Confirmación paciente persistida (PV-25): `patient_reply` + `confirmed_at` inmutable; localStorage queda cache. No reemplaza la gestión profesional.

### Paso 5 — Mensajería ampliada

- [x] Base Nutrigo operativa: paciente y profesional envían mensajes; la profesional dispone de inbox multipaciente, búsqueda, selección y navegación contextual a Ficha/Consultas; el paciente navega a su Agenda.
- [x] Recibos demo (corte 74) y PV-23: entrega/lectura por persona, `client_id` idempotente, primera marca inmutable. Persistente vía RPC; sin schema 501. GET hospedado cae al hilo 016 sin recibos.
- [ ] Adjuntos y archivos compartidos bajo Storage privado.

### Paso 6 — Menú saludable y recetas

- [x] Base paciente Nutrigo derivada del plan publicado: títulos únicos, días, momentos, ocurrencias, búsqueda y filtros; no se presenta como biblioteca de recetas.
- [ ] Modelar biblioteca real, categorías editoriales, favoritos y recomendadas.
- [ ] Detalle con porciones, macros, ingredientes, checklist, pasos, tiempos, utensilios y sustituciones.
- [ ] Creación/aprobación/asignación profesional y acceso limitado del paciente.

### Paso 7 — Planificador semanal

- [x] Vista paciente Nutrigo de sólo lectura con siete días, resumen, selección diaria y búsqueda transversal; aislada por paciente y limitada al plan publicado vigente.
- [ ] Modelo fechado/versionado y navegación real entre semanas; la semana actual sigue siendo una plantilla por día, no historial.
- [ ] Asignar recetas estructuradas, cantidades/porciones, duplicar semanas y aplicar plantillas por paciente.
- [x] Mantener edición profesional, selección multipaciente y publicación inmediata sobre el mismo plan vigente.

### Paso 8 — Grocery

- [x] Superficie paciente en Nutrigo derivada del plan semanal vigente, con categorías, deduplicación, ocurrencias y límites explícitos.
- [x] Comprado/pendiente local aislado por paciente, búsqueda, filtros y exportación de texto.
- [ ] Modelar ingredientes estructurados, cantidades, unidades y agregados manuales; no inferirlos de los títulos actuales.
- [ ] Implementar presupuesto/gastos sólo si se aprueba como necesidad real.

### Paso 9 — Diario de comidas

- [x] Superficie paciente Nutrigo con resumen real, cronología, búsqueda, filtros por estado y registro operativo foto/texto + IA (mismo endpoint y circuito existente, verificado con read-back aislado).
- [x] Relación explícita registro ↔ comida planificada mediante etiqueta Del plan/Fuera del plan (corte 67).
- [x] Historial navegable por fecha/semana; el diario filtra registros reales de la semana calendario (lunes–domingo), con vacío explícito si no hay datos. No inventa semanas ni permite ir al futuro.
- [x] Ingreso paciente demo (corte 73): seis pantallas de invitación, funcionamiento, privacidad, ficha, hábitos opcionales y listo. Sin peso, fotos corporales ni cuenta Auth real.
- [x] Confirmación de asistencia en Agenda paciente (demo local); no cancela ni reprograma el turno. Timezone y conflictos siguen pendientes.
- [x] Detalle de revisión profesional visible al paciente sin exponer notas internas (corte 71): confirmada vs ajustada, alimentos y macros publicados, visible también en móvil.

### Paso 10 — Progreso

- [x] Superficie paciente accesible en Nutrigo con adherencia actual, objetivo publicado, agua, sueño, energía y comidas revisadas en la ventana real de siete días.
- [ ] Comparación multipaciente por períodos para la profesional, sin ranking punitivo ni presentar agregados actuales como historia longitudinal.
- [ ] Implementar peso y medidas sólo después de definir consentimiento, retención y privacidad. Fotografías corporales requieren una decisión aparte.

### Paso 11 — Ejercicio y actividad

- [x] Registro paciente de actividad autodeclarada operativo en demo: tipo, duración, intensidad percibida, nota opcional, resumen real de siete días e historial; lectura profesional aislada por paciente en Actividades.
- [ ] Persistir `activity_logs` en el contrato 016 con RLS, retención y auditoría. La API devuelve 501 cuando Supabase está activo hasta aprobar ese contrato.
- [ ] Biblioteca/detalle estructurado de ejercicios y asignación de rutinas por profesional habilitado; definir series/repeticiones, feedback y permisos sin otorgar prescripción por el mero rol nutricionista.
- [x] Límites éticos de la base actual: sin diagnóstico, prescripción automática, calorías quemadas ni datos inferidos.

### Paso 12 — Insights y Guardado

- [x] Base paciente de Recursos: seis guías operativas originales, categorías, destacado, búsqueda, detalle, tags, relacionados y navegación a la función explicada. No son recomendaciones clínicas ni copian contenidos del kit.
- [ ] Contenido editorial clínico estructurado y revisado, con autoría, imágenes licenciadas y reglas de publicación.
- [ ] Favoritos/Guardado unificado para recetas, artículos, Planes B y recursos. Guardado profesional ya reúne Planes B y asignación de guías, pero los favoritos personales de Recursos continúan sólo en `localStorage`, aislados por paciente y rotulados como conveniencia del dispositivo; todavía no existe una entidad real de receta/artículo.
- [x] Compartir las seis guías operativas mediante enlace profundo validado (`#recurso=<id>`), Web Share cuando existe y copia del enlace como fallback. Atrás/adelante del navegador y reapertura directa conservan el detalle; navegar a otra función limpia el hash.
- [x] Asignación individual o masiva de las seis guías operativas, idempotente y aislada por paciente, con estado pendiente/leído visible en ambos roles. Funciona sólo en memoria demo; con Supabase activo falla cerrado con 501 hasta incorporar contrato, RLS y auditoría al schema 016.

### Paso 13 — Completar módulos CRM

- [x] Centro de seguimiento: priorización, acciones a Ficha/Diario y filtros configurables por banda de adherencia y revisiones pendientes ya operativos (corte 64); faltan agrupaciones guardadas y preferencias persistidas.
- [ ] Paneles: agregados y navegación a atención prioritaria ya operativos; faltan períodos y desgloses históricos.
- [x] Actividades/Reciente: base Nutrigo agregada con filtros por paciente/recencia y paginación incremental ya operativa (corte 65); faltan timestamp global persistido y paginación de servidor, que dependen del modelo longitudinal y del contrato 016.
- [ ] Videollamadas: acceso seguro y gestión por paciente ya operativos; faltan estados de sala/proveedor y videollamada nativa.
- [x] QA ampliado, primera matriz: estados vacíos explícitos de los cinco módulos del centro de trabajo, Objetivos y directorio cubiertos por `showroom-empty-states.test.tsx` (corte 69); faltan matrices de carga/error ligadas a flujos API.

## P2 — Producción y escala

- [ ] Flujo real de invitación/auth, Storage, mensajería, notificaciones y Mercado Pago.
- [ ] Persistencia Supabase/RLS de todas las vertical slices aprobadas.
- [ ] Multi-nutricionista, organizaciones, equipos y roles administrativos con aislamiento aprobado antes de expandir comercialmente.
- [ ] Configuración de marca, servicios y horarios por consultorio.
- [ ] Importación/exportación y portabilidad de datos.
- [ ] Facturación de Plan V a profesionales, límites de uso y soporte.
- [ ] Métricas de producto, documentación de usuario y alta comercial.

## Riesgo de entrega actual

- [ ] Revisar y agrupar los cambios locales por corte.
- [ ] Revisar seguridad y privacidad del diff completo.
- [ ] Crear commits locales coherentes sólo después de la revisión.
- [ ] Subir la rama y verificar CI. Actualmente los cambios recientes no están consolidados ni desplegados.

## Funcionalidad ya completada en demo/memoria

No debe volver a abrirse como pendiente salvo regresión:

- [x] Navegación de los once módulos del CRM.
- [x] Ficha, menú semanal, comidas/hábitos, consultas, mensajes y cobranza demo.
- [x] Tema claro/oscuro global y persistente.
- [x] Agenda básica conectada al editor de consultas.
- [x] Objetivos con métricas, filtros, edición, progreso e historial profesional.
- [x] Pacientes con métricas, búsqueda, filtros, edición, archivo y restauración.
- [x] Lista de compras, recordatorios, camino de siete días y paywall demo del paciente.
- [x] Contratos locales de autenticación, autorización y privacidad cubiertos por pruebas.

## Orden recomendado

**Histórico:** el orden debajo documenta la secuencia anterior. Para ejecutar desde esta revisión, seguir PV-01…PV-39 del [plan actualizado](plan-de-accion-2026-09-16.md); adelanta persistencia/privacidad y mantiene toda la paridad Nutrigo.

1. Completar la app paciente al nivel de estructura y funciones de Nutrigo (IA, calendario, recetas/detalle, plan fechado, grocery con unidades, progreso/ejercicio/recursos).
2. Cerrar los vínculos con la nutricionista sobre esas mismas superficies (publicación, revisión, asignación, turno, mensajes, ingreso).
3. Reflejar cada entidad nueva en el CRM, conservando los once módulos y el aislamiento multipaciente.
4. Contrato 016 ampliado, RLS, seeds y serializers; sin ejecutar SQL hasta go/no-go.
5. Supabase, proveedores, E2E, operación, despliegue y producción.
