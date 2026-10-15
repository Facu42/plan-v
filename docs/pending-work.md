# Pendientes de Plan V

## Inicio paciente y datos de muestra — 2026-09-27

- [x] Las tarjetas Peso, Pasos, Sueño y Agua de Inicio abren formularios accesibles en escritorio, tablet y móvil. Peso permite registrar también cintura y exige el permiso opcional de medidas; los cuatro registros actualizan Inicio y, donde corresponde, Progreso.
- [x] El demo en memoria inicia con peso, cintura, pasos, sueño, agua y dos actividades sintéticas, rotuladas como datos de muestra. Los datos de pacientes reales no reciben este seed.
- [x] Pasos se guarda en el hábito diario con validación de 0 a 100.000 y se conserva al actualizar sueño o agua. La migración incremental `20260927000000_habit_steps.sql` incorpora la columna para Supabase; todavía no se aplicó.
- [x] Recorrido de navegador de los cuatro formularios: guardado y lectura posterior a 1440/800/390 px; Progreso mostró el peso y la cintura nuevos. No hubo desbordamiento horizontal y Escape devolvió el foco a la tarjeta.
- [x] Verificación de este corte: `npm run check`, `npm run build`, auditoría del pack Figma y 609 pruebas aprobadas (2 omitidas).
- [ ] Antes de usar pasos con Supabase, revisar y aplicar la migración incremental en staging y verificar RLS y lectura/escritura con dos pacientes. El borrador antiguo `20260901000000_plan_v_v0.sql` se conservó como `supabase/contracts/legacy/20260901000000_plan_v_v0_original.sql` fuera de la cadena ejecutable; no se aplicó.
- [ ] Completar las demás funciones pendientes del producto y la revisión de fidelidad nodo por nodo descritas abajo. Este seed y los popups son para evaluar la experiencia en demo.

## Revisión funcional — 2026-09-27

- Paciente: la interfaz Figma de las 36 variantes quedó habilitada también en el build de producción. La lupa del header abre búsqueda de secciones, la campana abre Mensajes y el menú de cuenta permite ir a consultas, mensajes o cerrar sesión. Los botones «más» del dashboard abren Progreso, Diario, Menú, Ejercicios, Plan o Calendario según la tarjeta. El CTA lateral abre Mensajes; se retiró la oferta ficticia de un mes gratis. La flecha de regreso de detalles funciona en escritorio, tablet y móvil. Los submenús del plan responden a teclado y clic.
- Auditoría de controles: recorrido de las diez rutas principales a 1440, 800 y 390 px con `/browse`; tras conectar los controles anteriores no quedaron nodos visibles `Button` del pack sin semántica o destino conocido. El análisis de JSX no halló botones HTML sin acción, envío de formulario o estado deshabilitado en `figma-pack`. Recorrido en navegador de la lupa, búsqueda, regreso de receta y menú profesional.
- Nutricionista: el inicio ahora busca por nombre u objetivo, filtra comidas pendientes y ordena turnos futuros por fecha real; no incluye turnos con `starts_at` vencido o inválido. Un consultorio sin pacientes conserva el dashboard y puede abrir el directorio para dar de alta a la primera persona; la agenda también muestra su estado vacío. La selección de un turno abre Consultas de esa paciente.
- Verificación: `npm run check`, `npm run build`, auditoría Figma y 607 pruebas aprobadas (2 omitidas).
- Cierre de controles visibles: el campo «Buscar» del encabezado de Inicio ya abre el buscador de secciones con clic y teclado. La auditoría DOM del dashboard dio cero nodos `Button` visibles sin función en 390, 800 y 1440 px; el ancho del documento coincide con cada viewport. Inicio → Plan también conserva 1440 px sin desbordamiento. En Calendario, una reprogramación válida selecciona el día y el mes de la nueva cita.
- Verificación final de este corte: `npm run check`, 607 pruebas aprobadas (2 omitidas), `npm run build` y `audit-pack.mjs` completados el 27-09-2026. El build sólo mostró advertencias de comentarios `@__PURE__` de Zod.
- Recorridos API en demo: Mensajes se envió desde la pantalla Figma y apareció en el hilo profesional; Calendario confirmó asistencia, mostró un error claro al intentar un horario ocupado y aceptó otro horario libre; Ejercicios guardó una actividad y la mostró en la tabla. Diario abrió su formulario de captura y Progreso abrió Care con permisos explícitos. El dashboard profesional abrió el Diario de la primera paciente con comidas por revisar y mantuvo ancho de documento 390/800/1440 px sin desbordamiento.
- Pendiente para cierre de producto: probar en navegador con respuestas de API de éxito y error el envío de mensajes, reprogramación de consultas, capturas del Diario y Ejercicios, formularios/visor privados de Progreso y flujos profesionales de publicación/revisión. Completar documentos legales reales antes de hacer accionables los textos de privacidad y términos. Mantener `?operativo=1` mientras existan funciones del paciente fuera del pack. La publicación con pacientes reales sigue dependiendo de la validación de RLS y del entorno staging indicada en PV-08/09.

## Plan de acción vigente — 2026-09-26 (Figma, paciente y nutricionista)

Fuente visual: código, nodos, dimensiones y recursos obtenidos del archivo Figma `OTolnKfsxUFjaZOhhdb04i` mediante MCP. Detalle de contratos y orden en [functionalization-plan.md](../design/figma-code/functionalization-plan.md). Las capturas no son fuente de implementación. Los hitos de esta sección preceden al registro de pasos y los formularios de Inicio documentados arriba.

**Avance comprobado:** 36 variantes importadas (escritorio, tablet y móvil), 1175 recursos locales, logo Plan V en los 34 encabezados que tienen nodo de logo, insignias de Mensajes vinculadas al conteo real de no leídos en 34 nodos, sidebar desplegada de Plan de comidas, ajuste del frame al viewport, navegación móvil y dashboard de la nutricionista con datos del proyecto. Las tres variantes del plan y de compras ya muestran datos funcionales. Los 12 indicadores superiores del dashboard del paciente usan peso registrado, sueño e hidratación; los pasos quedan en «Sin registro» porque aún no existe una fuente de conteo. Los seis widgets de peso y nutrición de las tres variantes toman mediciones y comidas revisadas, con estado vacío y sin metas numéricas inventadas. Las ocho tarjetas de entrenamiento usan registros de los últimos siete días y abren Ejercicios. Las recomendaciones muestran comidas del plan y estado vacío para ejercicios sin prescripción; las 12 tarjetas de plan del día usan comidas y checks del diario. El calendario compacto usa la semana actual y sus flechas avanzan o retroceden una semana. Las 12 filas de actividad reciente muestran eventos reales o estado vacío. Las tres variantes de Calendario muestran eventos y fechas vigentes en las 105 celdas Figma, con filtros, vistas, selección, detalles, confirmación/reprogramación de consulta y registro de actividad; los meses de seis semanas agregan una fila. Las tres variantes de Mensajes usan el hilo real, búsqueda, no leídos, envío, recibos y perfil contextual. Menú saludable y Detalle de receta ya toman el plan y las recetas publicadas en escritorio, tablet y móvil; muestran los faltantes de nutrición e imagen sin cifras ficticias. Diario de comidas muestra los registros reales y sus valores revisados en las tres variantes, con captura desde el formulario existente. Progreso lee peso, cintura, fotos privadas, calorías revisadas, sueño e hidratación y abre los formularios de Care y el visor de estudios en escritorio, tablet y móvil. Ejercicios muestra actividades reales, filtros y registro; Consejos y su detalle muestran guías reales y asignaciones en las tres variantes. El nombre real del paciente se muestra en 14 pantallas. Se consultó el código MCP de los nodos Figma `72:1490`, `71:1235`, `84:1488`, `33:1103`, `33:1967` y los tres frames de Calendario, Mensajes, Menú saludable, Detalle de receta, Diario, Progreso, Ejercicios, Consejos y Detalle de consejo para conservar estructura y recursos. Auditoría estática, `check`, `build` y 606 pruebas aprobadas (2 omitidas).

**P0 — cerrar el dashboard del paciente:** revisar estados de carga y error de plan, peso y actividad; asegurar que todas las acciones visibles abran el módulo correcto. Mostrar valores nutricionales por receta y ejercicios prescritos sólo después de disponer de fuente clínica publicada. Mantener las cifras sin fuente como «—» o «Sin indicación». Conservar composición, assets y medidas de cada nodo Figma. Criterio de cierre: ninguna cifra clínica, fecha, recomendación o actividad de muestra aparece para un paciente real en las tres variantes, y la geometría real coincide con los frames.

**P0 — completar las demás pantallas del paciente:** Calendario ya muestra eventos reales, permite confirmar o reprogramar la consulta y registrar actividad con las APIs existentes; el panel indica carga/error del plan publicado y ofrece reintentar. Mensajes ya enlaza el hilo real, búsqueda, no leídos, envío, actualización, recibos y perfil contextual en escritorio, tablet y móvil. Menú saludable y Detalle de receta ya muestran plan/catálogo publicados, búsqueda, filtro, orden, estados y preparación seleccionada en las tres variantes. Diario de comidas ya muestra registros y macronutrientes revisados en la tabla Figma, con semana, búsqueda, filtro, paginación y acceso al formulario de captura. Progreso ya muestra peso, cintura, fotos privadas, calorías revisadas, sueño e hidratación en las tres variantes y abre los formularios de Care y el visor de estudios dentro del pack. Ejercicios ya muestra registros reales, búsqueda, filtros, paginación y formulario de captura en las tres variantes. Consejos y Detalle muestran las guías reales del proyecto, selección, categorías, etiquetas, guardado local, enlace y lectura de asignaciones; faltan artículos clínicos editoriales publicados. Falta revisar geometría, scroll y recorridos en navegador. La foto y la información nutricional de receta requieren contrato y fuente publicados; la acción de agregar al plan sigue siendo profesional. Los adjuntos de Mensajes requieren contrato y Storage. Implementar navegación, búsqueda, filtros, formularios y acciones mediante React y las APIs existentes, sin depender de coincidencias de `textContent`. Cada módulo debe cubrir carga, vacío, error y contenido en escritorio, tablet y móvil. Mantener `?operativo=1` hasta que no falte ninguna función de la interfaz existente. Siguiente bloque: revisión de geometría DOM y recorridos completos a 1440/800/390 px, comenzando por Calendario, Mensajes, Menú, Diario, Progreso, Ejercicios y Consejos.

**P1 — móvil y panel profesional:** revisar las 12 pantallas móviles frente al código Figma, interacción táctil, teclado, scroll, estado al cambiar de ancho y ausencia de desbordamiento a 390 px. Completar el panel de nutricionista en 1440, 800 y 390 px con lista y búsqueda de pacientes, agenda, mensajes, planes, diario, consultas y alertas conectados; eliminar cualquier agregado de ejemplo.

**P1 — segunda revisión de fidelidad:** contrastar nodos, assets, tipografía, espaciados y medidas con `get_design_context`/`get_metadata` del MCP. Medir geometría y overflow del DOM a 1440, 800 y 390 px, corregir las diferencias, recorrer acciones y estados vacíos, y cerrar con `check`, `build` y pruebas. No considerar esta etapa cerrada sólo por pasar la auditoría estática.

### Revisión DOM de tamaño y navegación — 26-09-2026

- [x] Usar `/browse` sobre localhost y el código/metadatos MCP de Figma, sin capturas como fuente. Medidas reales de las diez secciones principales a 1440 × 900, 800 × 900 y 390 × 844; detalles de receta y consejo abiertos en las tres variantes.
- [x] Unificar escala de escritorio con el alto del Dashboard: las doce pantallas de cada variante tienen ancho de frame uniforme (1440/800/390); a 1440 × 900 se presentan a 1052 px visibles. El documento no desborda horizontalmente. El stage deja ver contenido real que sobrepase la altura original.
- [x] Menú saludable: `get_design_context` y `get_metadata` confirman tres tarjetas visibles; el resto queda accesible con desplazamiento dentro de la lista original. Las columnas secundarias muestran 3 tarjetas por bloque en escritorio y 4 en tablet/móvil, con cuadrícula de dos columnas en tablet. En móvil se recorrió hasta la última preparación y se abrió su detalle. La medición DOM coincide con Figma: Destacado 844 px, Todos los menús 869 px, Más preparaciones 526 px, Otras recetas 694 px, lista de tarjetas 731 px y frame 3195 px. Búsqueda accesible desde el botón de filtro.
- [x] Diario y Ejercicios móviles: el contenido y el pie quedan dentro de sus frames de 1624 y 1084 px. El Diario conserva semana y estado en un panel de filtros desplegable; la tabla de Ejercicios se desplaza dentro de su caja de 816 px.
- [x] `npm run check`, `npm run build`, auditoría de fuente Figma y 606 pruebas aprobadas (2 omitidas) tras estos cambios.
- [ ] Recorrer en navegador envío/error de Mensajes, confirmación/reprogramación en Calendario, registro de Diario y Ejercicios, formularios y visor privado de Progreso, más estados vacíos y error. Medir composición interna y tipografía nodo por nodo en los 36 frames con datos largos.
- [x] Medir las 15 rutas del panel profesional a 1440/800/390 px: el ancho del documento coincide con el viewport en todas; las páginas con panel lateral tienen un área central más estrecha por diseño.
- [ ] Recorrer los flujos profesionales de pacientes, agenda, mensajes, planes, consultas y alertas, y revisar tipografía, espaciados y estados internos del dashboard en los tres anchos.

## Revisión vigente de avance — 2026-09-18 (evaluación de IA)

PV-28 primera faja: validador determinista `eval.v1` sobre propuestas de receta/menú (alergias, restricciones, cantidades, unidades, huecos y contexto desactualizado). Aplicar revalida el hash; una alergia explícita o una copia inédita ajena bloquean el guardado. 30 escenarios sintéticos versionados. El paciente no ve hallazgos ni botones de generar. Sin revisión clínica de Verónica sobre el set ni worker durable (PV-30).

Siguiente P0: PV-29 PWA, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (propuestas de IA)

PV-27 primera faja: jobs versionados `recipe`/`menu` con `prompt_version`, hash de contexto mínimo (alergias, restricciones, tiempo de cocina, catálogo y plan, sin nombre ni notas privadas), timeout y tope de tokens. El artefacto queda inédito: aplicar lo guarda en el catálogo o en la copia del plan, nunca publica. El paciente no lee `ai_jobs` ni `ai_artifacts`. Un fallo del proveedor deja el job en `failed` sin propuesta simulada. Migración incremental `20260918250000_ai_jobs.sql` (no copia 016b). Sin worker durable (PV-30). Evaluación en PV-28.

## Revisión vigente de avance — 2026-09-18 (consultas)

PV-25 primera faja: timezone `America/Argentina/Buenos_Aires` en el turno, confirmación persistida (ya no localStorage), historial en `appointment_events` y RPC `save_appointment` / `cancel_appointment` / `reschedule_appointment` / `confirm_appointment`. El solape del mismo consultorio se bloquea con lock asesor y rango semiabierto. La paciente no puede reprogramar con menos de 12 h; el consultorio sí. Un turno scheduled por paciente. Cancelar deja `status=cancelled` (no borra). Sin picker IANA, sin exclusion gist, sin push/email (PV-26). Migración incremental `20260918240000_appointment_events.sql` (no reescribe `appointments` de core; no copia 016b).

Siguiente P0: PV-27 jobs de IA, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (hilos y recibos)

PV-23 primera faja: el envío lleva `id` de cliente; reintentar el mismo id no duplica. `message_receipts` guarda entrega (al persistir para la otra persona) y lectura (al abrir el hilo). `POST /messages/read` ya no responde 501: usa `mark_thread_read`. Los mensajes siguen inmutables. Sin Realtime ni adjuntos (PV-26 / PV-24). Migración incremental `20260918230000_message_receipts.sql` (no reescribe `messages` de core; no copia 016b).

Siguiente P0: PV-25 consultas con timezone, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (diario persistente)

PV-22 primera faja: el diario guarda la comida (foto o texto) **antes** de pedir el análisis. Un `id` de captura evita duplicados. Si la IA no está disponible, el registro queda con `analysis_status=failed` y la paciente no vuelve a captura vacía. Reintentar el mismo id no crea otra fila. Revisión profesional sigue por `PATCH` de comida. Migración incremental `20260918220000_meal_log_analysis.sql` (no reescribe `meal_logs` de core; no copia 016b).

Siguiente P0: PV-23 hilos reales, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (planes versionados)

PV-19: planes semanales fechados (lunes), versionados, con slots y receta publicada opcional. Guardar crea o actualiza una copia inédita; publicar exige `expected_version` y deja esa copia inmutable. Editar después abre otra versión. Migración `20260918210000_meal_plans.sql` aplicada en Plan V vacío (`meal_plan_tables`, `meal_plan_rpcs`). El editor CRM ya no publica al guardar cada título.

PV-20 primera faja: el paciente, el menú y las compras leen la versión publicada. Si no hay publicada, sigue la plantilla demo. Días sin slots quedan vacíos. Detalle de receta y porciones sólo cuando el slot apunta a una receta publicada.

Siguiente P0: PV-22 diario persistente, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (medidas y recetas)

PV-17: peso y cintura guardan `unit` y `origin`. El paciente carga como autodeclarado; la nutricionista, como consultorio. No se estima desde fotos. Migración incremental `20260918190000_care_measurements.sql` aplicada en Plan V vacío (`care_measurements`).

PV-18 primera faja: catálogo profesional (`recipes`) con ingredientes/pasos en JSON, porciones y fuente. El paciente sólo ve publicadas de su nutricionista. Una receta publicada no se edita: se crea otra. Schema aplicado (`recipes_tables`, `recipes_rpcs`). Sin tabla de ingredientes, sin asignaciones por paciente, sin planes versionados (PV-19).

Siguiente P0: PV-19 planes fechados/versionados, o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (archivos y estudios)

PV-15: migración `20260918180000_assets.sql` aplicada al Plan V vacío (`acevlqrkvdinelgxnaki`, **0 pacientes**). Buckets privados `asset-quarantine` y `clinical-documents`. API de reserva/complete/access/withdraw, inspección de magic bytes, recorte de EXIF JPEG y tEXt PNG, cuota y URL de 60 s. PGlite cubre aislamiento de intenciones. No se reencodifican WebP; no hay worker durable (sí `purge_expired_asset_intents` para service_role). El complete de demo sigue aceptando data URL; en persistente el API también emite URL de subida a cuarentena.

PV-16: visor de estudios PDF/JPG/PNG en Progreso (paciente) y ficha CRM, con consentimiento `clinical_document` y retiro. Fotos corporales siguen en CarePanel. Sin OCR ni envío a IA.

Siguiente P0 del plan: **PV-17** (peso/medidas ya tienen UI/API de care; falta Auth real) y/o cablear `.env` staging para RLS live (PV-08). No aplicar 016/016b ni SQL a ruti-chat-crm.

## Revisión vigente de avance — 2026-09-18 (instancia Plan V)

El proyecto Supabase **Plan V** (`acevlqrkvdinelgxnaki`, org Facu42) se reactivó y recibió las migraciones ejecutables `core` / `intake` / `care` / `assets` sobre esquema vacío. **0 pacientes, 0 perfiles, 0 usuarios Auth.** No se ejecutó el draft 016/016b. No se aplicó SQL a **ruti-chat-crm**.

Para liberar el cupo Free (2 proyectos activos) se pausó `supabase-indigo-zebra` (`molizymlsilnciiilqqo`): test Vercel de Rumbotex de julio, no es Plan V ni la base viva de ruti (último mensaje 2026-07-10). ruti-chat-crm sigue `ACTIVE_HEALTHY`.

Verificado en esa instancia: tablas con RLS (incluye `asset_upload_intents`), 6 vistas paciente, catálogo de 7 consentimientos, trigger `on_auth_user_created`, buckets privados `meal-photos`, `care-photos`, `asset-quarantine` y `clinical-documents`. Historial MCP: `core_tables`, `core_functions`, `core_rls`, `intake`, `intake_rpcs`, `care_tables`, `care_rpcs`, `assets_types_tables`, `assets_rpcs`, `assets_policies_buckets`.

La app local **todavía no apunta** a este proyecto: falta `.env` con `APP_MODE=staging`, anon y **service role** (esta conexión no expone el service role). PV-08 no está cerrado: falta la matriz RLS-01…23 con usuarios sintéticos y el circuito Auth/invitación end-to-end.

Siguiente: cablear staging local, provisionar nutricionista (`PROVISION_SECRET`), correr RLS live. Storage/estudios ya tienen schema y demo.

## Revisión de avance — 2026-09-18 (seguimiento en git)

Continuación sobre el árbol sin consolidar del 17/09: módulo de seguimiento conectado (peso, cintura, actividad, fotos corporales, pagos manuales, reemplazos de menú con revisión profesional), navegación lateral en escritorio para ambos roles, lista de compras derivada del plan y de alternativas publicadas. **Pruebas locales: 509 aprobadas, 2 omitidas; TypeScript, build y guarda SQL aprobados.** En ese corte `npm run apply:disposable` existía pero no había `.env` local; el SQL remoto se aplicó más tarde el mismo día al proyecto Plan V vacío (sección de arriba).

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
- **PV-08** lecturas/escrituras ordinarias usan el JWT del actor (`createActorClient` + AsyncLocalStorage). Service role queda para auth/provisión. Migraciones `core`/`intake`/`care` aplicadas el 2026-09-18 al proyecto vacío Plan V (`acevlqrkvdinelgxnaki`). Tests PGlite siguen en `server/intake/postgres.integration.test.ts`. 016/016b draft fuera de la cadena. Matriz RLS live y Auth E2E pendientes.
- **PV-09** alta profesional por `POST /api/ops/nutritionists` con `PROVISION_SECRET` (nunca JWT de usuario). Invitación de un uso: crear → enviar (vence 7 días) → aceptar con email Auth confirmado y coincidente, o revocar. Recuperación de cuenta vía `/api/auth/recover` y el formulario de login, sin revelar si el email existe. 016 sigue sin aplicarse.

- **PV-10** paridad 016 de ficha, menú semanal, hábitos (incluye sueño), turnos, brief y objetivo publicado. Lectura posterior a cada escritura; si falta schema, 501 explícito (no éxito falso). Siguen 501 a propósito: archivo operativo (no hay `archived_at` en 016), cobranza (service role / PV-32), actividad, recursos, avisos y recibos de mensajes (016b / tickets posteriores).
- **PV-11** directorio paginado (`limit`/`offset` + `has_more`) sin extras N+1; el detalle y los mensajes (últimos 50) se piden al seleccionar. Cache de pacientes aislada por sesión: logout aborta requests y vacía el store. Respuestas `/api/*` van con `Cache-Control: no-store`.
- **PV-12** intake `intake.v1` autodeclarado separado de `clinical_notes`. Consentimientos versionados. Memoria + RPC Supabase (`server/intake/repository.ts`); 501 si falta schema. Un paciente con billing pendiente igual puede completar ingreso y consentir.
- **PV-13** onboarding de nueve pantallas, autoguardado serializado (800 ms + avanzar), reanudación y envío idempotente. Vacío ≠ “no tengo”.
- **PV-14** ficha profesional muestra resumen de ingreso, faltantes, alergias y notas privadas; el paciente no ve `reviewed_by` ni observaciones clínicas.
- **PV-15** archivos privados: reserva, cuarentena, inspección de contenido, cuota, recorte JPEG/PNG, URL de 60 s y retiro. Schema aplicado en Plan V vacío. Falta worker durable y reencode WebP.
- **PV-16** estudios PDF/JPG/PNG con visor temporal y retiro; fotos corporales ya tenían visor en seguimiento.
- **PV-17** peso/cintura con unidad y origen; historial y consentimiento. Sin estimación desde fotos. Falta Auth real.
- **PV-18** catálogo profesional publicado; el paciente no ve inéditas. Faltan asignaciones por paciente, tabla de ingredientes y planes versionados (PV-19).

Siguiente: `.env` staging → Plan V, RLS live e invitación real (PV-08/09), luego planes versionados (PV-19). No aplicar 016/016b ni SQL a ruti-chat-crm ni a un proyecto con pacientes.

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
- [ ] Ejecutar los casos `RLS-01…RLS-23` con usuarios sintéticos en Plan V (`acevlqrkvdinelgxnaki`, schema ya aplicado, 0 pacientes). PV-08 cablea JWT y deja RLS-02 live detrás de env; la matriz completa sigue pendiente.
- [ ] Adjuntar evidencias redactadas, hash de la migración y decisión explícita de go/no-go.

### 2. Completar Supabase y aislamiento multiusuario

La API falla de forma explícita con `501` en operaciones que aún no tienen contrato persistente aprobado. Falta:

- [ ] Alta e invitación real de pacientes. PV-09 deja el ciclo crear/enviar/revocar/aceptar y recuperación; el schema ya está en Plan V vacío. Falta `.env` (service role + `PROVISION_SECRET`) y el recorrido Auth/RPC persistente.
- [ ] Edición y archivo/restauración de pacientes mediante `archived_at`. PV-10 persiste la ficha (nombre/estado/etapa/notas profesionales); el archivo operativo sigue 501 porque 016 no tiene esa columna.
- [ ] Persistencia de objetivos e historial profesional. PV-10 escribe `patients.goal`; `goal_status`/`goal_history` quedan para 016b.
- [x] Creación, reprogramación y cancelación de turnos. PV-25 persiste timezone, confirmación, historial append-only, política de 12 h para la paciente y bloqueo transaccional de solapes del consultorio. Falta Auth real.
- [x] Escritura del menú semanal (PV-10, `meal_slots`).
- [x] Persistencia completa de sueño/hábitos (PV-10, `habit_logs.sleep_minutes`).
- [x] Descarte persistente de briefs del copiloto (PV-10, `ai_briefs.status=dismissed`).
- [ ] Cobranza y transiciones de `billing_status`/`billing_until` sólo por flujos autorizados.
- [ ] Verificar con RLS real que Nutri A nunca pueda leer o escribir datos de Nutri B.
- [ ] Verificar que la vista paciente nunca exponga notas internas, briefs, razones de adherencia, borradores ni historial profesional.

### 3. Aprobar e integrar servicios externos

- [ ] Email transaccional para invitaciones: proveedor, remitente, TTL, reintentos, revocación y rate limiting.
- [ ] Storage privado: PV-15 cubre magic bytes, cuota, recorte JPEG/PNG, URLs 60s y retiro en demo y Plan V vacío. Falta reencode WebP, worker de huérfanos y E2E con Auth.
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
- [ ] Zonas horarias y detección de conflictos: no existen en el modelo actual y no se rellenan.
- [ ] Confirmación paciente: timezone y conflictos. La asistencia demo ya existe; no reemplaza gestión profesional.

### Paso 5 — Mensajería ampliada

- [x] Base Nutrigo operativa: paciente y profesional envían mensajes; la profesional dispone de inbox multipaciente, búsqueda, selección y navegación contextual a Ficha/Consultas; el paciente navega a su Agenda.
- [x] Recibos demo (corte 74): entrega inmediata al enviar, leído al abrir el hilo y recuento de no leídos. Persisten sólo en memoria; con Supabase activo la marca de lectura responde 501.
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
