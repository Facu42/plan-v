# Traspaso del proyecto (actualización vigente: 2026-10-19)

19/10 · Cursor · Fase 5 comparada con el boceto en `design/panel-nutri/fase-5/`. [PR #153](https://github.com/Facu42/plan-v/pull/153). WhatsApp salió del panel de la nutri; los avisos van por la app. Sin SQL remoto. La fase 6 (Asistente IA, Seguimiento, Mensajes y Progreso) es la siguiente.

19/10 · Codex · Fase 3 de Pacientes verificada en `codex/panel-nutri-fase-3`: tabla y resumen bajo la fila con datos autorizados, 3.164 pruebas y dos omitidas, tipos/build/secretos y revisiones aprobadas, 22 comprobaciones /browse. Informe: [fase 3](panel-nutri-rediseno/fase-3-verificacion.md). Inicio #151 integrado a main 4dc9a79 con web/API/worker en verde. Sigue fase 4, Ficha, en rama y PR propios; sin SQL remoto.


## Rediseño del panel · 19/10

Fase 1 integrada en #150, main `1f48adf`, con web/API/worker comprobados. Inicio se desarrolla en `codex/panel-nutri-fase-2`, siguiendo el boceto aprobado y conservando las API y permisos. [Informe, evidencia y límites de fase 2](panel-nutri-rediseno/fase-2-verificacion.md). Facundo pidió continuar las partes restantes, cada una en su rama y PR; el siguiente paso es fase 3, Pacientes con resumen desplegable. Estado vivo y reservas en la [Bitácora del plan](panel-nutri-rediseno/plan.md).

## Actualización de consultas · 17/10

Facundo confirmó retención cero activada y cuenta Free en Groq. Ya se configuró el proveedor en API y worker y se probó transcripción/resumen real con audio ficticio. PR140 corrige silencios y fragmentos finales de audio, conservando main `49a6a5d`; el estado de publicación definitivo y los controles están en [PR140](https://github.com/Facu42/plan-v/pull/140). Esto sustituye las menciones históricas de Groq pendiente de confirmación para consultas. [Uso, alcance y evidencia](consultas-habilitacion-2026-10-16.md).

## Estado integrado de la entrega 8 · 16/10/2026

La rama aislada `codex/nutridesk-release-sara2` incorpora mediante avance directo la entrega 7 final `5c8ea5441d466c54be20899b14b8cf0758cbcce4` ([PR #127](https://github.com/Facu42/plan-v/pull/127)) y conserva todo `main` hasta `9c56854`, incluidos los PR #117, #119 y #122. Se recuperó la implementación SARA 2 revisada: 930 registros y 39 componentes, unidades de 100 g/100 ml y copias históricas. [Instructivo vigente](instructivo-plan-v-actualizado-2026-10-15.md), [evidencia de SARA 2](sara2-verificacion-2026-10-15.md) y [coordinación](coordinacion-agentes.md).

El manifiesto separa **18 migraciones pendientes y tres archivos exactos de main ya observados aplicados**. No se vuelve a aplicar esas tres migraciones por el nombre local de su archivo. La suite propia definitiva, finalizada el 16/10 a las **09:11:31 ART**, aprobó **2.999 casos, cero fallos y dos omitidos, en 458 archivos**; tipos, compilación (7,80 segundos), migraciones, manifiesto, vistas y secretos aprobados. Revisión independiente de código y QA de 1440/390 aprobados sin P1/P2: se corrigieron recortes del editor y catálogo cargado, además de etiquetas de volumen. Las **1.787 huellas** permanecen intactas después de la suite y QA (`2e5bd04d…`). [QA final](sara2-qa-2026-10-16.md). Las cifras antiguas de abajo son históricas. El CI de la cabeza propia se comprobará tras subir el borrador; no se publicó esta entrega ni se aplicó su SQL.

El 16/10 ROOT verificó mediante la herramienta oficial que todos los controles de #127 en `5c8ea54` están aprobados: verify, e2e, sesiones firmadas, secretos y vista previa. Es evidencia del padre 7; la entrega 8 requiere su propio CI sobre la cabeza que se publique para revisión.

Continúan pendientes por decisión o validación real: SMTP propio pospuesto (Supabase Auth permanece, sin prometer correos a destinatarios externos), retención cero y modalidad de Groq, captura real de ambas voces y cuentas reales de Google, Mercado Pago y WhatsApp. La IA nueva comparte un límite global autorizado de USD 5 mensuales; desde el 17/10 el asistente de planes está encendido (`AI_PLAN_ASSISTANT=on`, solo modelos gratis). La IA clínica de Groq (resumen de consultas, documentos, cartera) sigue sin atender hasta que Facundo confirme retención cero y nivel gratuito en Groq (`GROQ_ZDR_VERIFIED`, `GROQ_FREE_TIER_VERIFIED`). Kerr conserva carga manual hasta resolver unidades y validar la fórmula con la profesional.

## Referencia histórica: entrega 6 aislada · 14/10/2026

Agenda, reservas públicas, equipo con recepción operativa, asignación clínica y cobros por profesional preparados en `codex/nutridesk-release-agenda`, base clínica `66ed039`. [Alcance, evidencia y límites](nutridesk-release-agenda-2026-10-14.md): suite propia de 2.816 aprobadas, cero fallos, dos omitidas (431 archivos), tipos/build/migraciones/vistas/secretos y revisión independiente aprobados. Cinco SQL preparados, sin aplicación hospedada. Navegador público/equipo a 1440/390; asociación de ficha existente con UUID real comprobada en fixtures, no con `pat-sofia` demo. Comunicaciones/cartera finales, configuración de Google/Mercado Pago, SMTP y producción continúan pendientes.

Una sola página para que cualquier agente (Claude, Codex u otro) siga sin tener el chat.
**Desde el 14/10:** el reparto de trabajo entre agentes está en [`coordinacion-agentes.md`](coordinacion-agentes.md) y los documentos de producto en [`producto/`](producto/README.md).
Los detalles de cada tema están en los archivos que se nombran. Este archivo se actualiza
cuando cambia algo de lo de abajo. Sin claves ni secretos: esos los tiene Facundo.

## Qué es y cómo se trabaja

- Plan V: app para que nutricionistas acompañen a sus pacientes (plan, comidas, medidas, turnos,
  mensajes, cobranzas). Facundo la desarrolla y la vende; **no** es nutricionista ni paciente:
  ningún flujo debe pedirle convertir su cuenta. Su cuenta de Google es paciente y administradora.
- Se comunica en español y quiere respuestas simples, sin jerga. Si hay algo para comprobar, se
  comprueba solo (con conectores o navegador) y recién después se le pide **una** cosa exacta, con el
  valor listo para pegar.
- Reglas completas: `docs/agentes/reglas-plan-v.md`. Las más importantes: diseño exacto al archivo
  de Nutrigo (Figma `OTolnKfsxUFjaZOhhdb04i`; si Plan V se aparta, gana el archivo); escritorio 1440 y
  móvil 390 (tablet no); una rama y un PR por tema; nada directo a `main`; todo cambio en la base de
  producción o en servicios pagos necesita su frase escrita (un "ok" suelto no alcanza).
- Habilidades de apoyo (14/10): `security-review`, `postgres-patterns` (ECC) y cuatro de animación y datos
  extremos de Emil Kowalski en `.claude/skills/`. Solo informan; en la app de la paciente manda Nutrigo.
  Detalle en `docs/agentes/reglas-plan-v.md`.
- Antes de un PR: `npm test`, `npm run check` y, si hay migraciones, `npm run check:migrations`.
  Para ver la app con datos de ejemplo: `npm install`, `npm run local` y "Continuar en modo demo".

## Dónde vive todo

- Código: https://github.com/Facu42/plan-v. Cada merge a `main` publica solo la web (Vercel,
  https://plan-v-eight.vercel.app) y la API con su worker (Railway, ambos desde `main`).
- Base: Supabase, proyecto `plan-v-app` (Pro desde el 30/9, copia diaria de 7 días). La API solo
  acepta los orígenes de `CORS_ORIGINS` (Railway).
- Panel de administración: https://plan-v-eight.vercel.app/admin (entra con su Google).

## Lo hecho (publicado en `main`)

El [producto desde el código original del MCP](producto-nutrigo-mcp-2026-10-03.md), PR #54, ya se integró con las cinco migraciones aprobadas aplicadas y la landing #55 conservada. Los PR #56 y #57 publicaron permisos opcionales y corrigieron espera/formato y reserva de trabajos de IA. Web/API/worker comprobados en `df8e5d0`. La generación gratuita real de cuatro recetas nuevas se editó y publicó como v2; la paciente recibe exactamente la copia revisada y conserva las etiquetas de estimación. Foto manual, planes, comidas/hábitos y privacidad de borradores/meta comprobados en producción. [Evidencia actual y guía](cierre-producto-publicado-2026-10-05.md), [historial de publicación](publicacion-producto-plan-v-2026-10-05.md), [acciones y contratos](recorridos-y-contratos-plan-v-2026-10-05.md) y [paquete SQL](paquete-produccion-pr54-2026-10-05.md). La continuación `codex/plan-v-functional-closure` corrige una espera del ensayo de navegador y registra el cierre; su PR conserva el CI y los despliegues finales. Fotos IA pendientes de proveedor gratuito probado. No editar el registro del otro hilo.

- Producto listo para usar de punta a punta, diseño Nutrigo en 13 pantallas: `docs/registro-producto-listo.md`.
- Seguridad y privacidad: términos y privacidad, 34 funciones internas cerradas en la base:
  `docs/seguridad-privacidad.md`, `docs/legal/`.
- Correcciones posteriores al PR #40 ya aplicadas en la base: datos corporales y
  metas cerrados tras el retiro, validación y cálculo dentro de la base y meses
  pagados corregidos. Dos migraciones verificadas, sin contratar recursos:
  `docs/correcciones-funciones-sensibles-2026-10-01.md`.
- Diseño y movimiento, carga y errores, primer uso de la nutricionista, accesibilidad, botones del
  celular: `docs/diseno-movimiento.md`.
- Ingreso con Google y pantalla "Antes de seguir": `docs/autenticacion.md`.
- Cobros por paciente (rama claude/nutri-cobros-por-paciente-46sdfg, PR borrador sobre #89): Nuevo cobro, Asignar programa y Copiar link; migración 20261010150000 sin aplicar. Detalle en docs/cobros-por-paciente-2026-10-10.md.
- Cobranzas, Pagos de la paciente y Panel del servicio (altas, cuentas de prueba, actividad):
  `docs/cobros-y-panel.md`.
- Calorías y macros (Mifflin-St Jeor) con migración aplicada: `docs/calorias-macros.md`.

- Corrección de Figma y accesos del consultorio integrada por
  [PR #46](https://github.com/Facu42/plan-v/pull/46) el 2026-10-02, commit `6a2d292`:
  MCP de las 24 vistas; ampliado a los bloques
  originales de las doce pantallas del paciente y sus móviles/detalles, 81 SVG locales,
  accesos Pacientes/Ficha/Plan y selección conservada. Pruebas 1440/390, porciones,
  ordenamiento y guardado protegido; 1.114 pruebas aprobadas. Web, API y worker publicados
  para ese commit; CI y sesiones de main aprobados. Ingreso público comprobado sin errores.
  Sin migraciones, cambios de ajustes de producción ni recursos nuevos.
  Ver `docs/figma-crm-funcional-2026-10-01.md`.

- Pantallas de la paciente iguales a Nutrigo, publicadas el 2026-10-07 por
  [PR #68](https://github.com/Facu42/plan-v/pull/68), commit `03a6aeb`: las diez pantallas ya no
  ocultan ni vacían bloques del archivo; comparador `scripts/nutrigo-compare.mjs`; pasos del día.
  Migración `20261007120000_habit_steps.sql` aplicada en `plan-v-app` con la frase escrita de
  Facundo, sin avisos de seguridad nuevos. CI verde (pruebas y recorrido de navegador); Vercel
  READY y API/worker de Railway en SUCCESS para ese commit. Datos que el diseño muestra y faltan,
  con propuestas: `docs/nutrigo-igual-al-archivo-2026-10-07.md`.

## Lo pendiente

- Cuenta archivada (D6, 2026-10-10): la paciente ve que su cuenta está archivada y no puede enviar mensajes; puede seguir leyendo el hilo. La nutricionista puede escribir. Migración `20261010143000_archived_patient_cannot_message` en el repositorio, sin aplicar en la base hospedada hasta la frase escrita de Facundo. Decisión en `docs/decisiones-producto-2026-10-10.md`.
- Mediciones de la ficha (2026-10-10, rama `claude/project-thread-ngsfiv`, PR borrador): composición corporal, perímetros, detalle con mín/prom/máx y carga por fecha. Migración `20261010120000_body_metrics` preparada, **sin aplicar** (pide la frase de Facundo). Lista de pacientes con columnas y densidad elegibles (guardado en el navegador). Importar informe de balanza en PDF (se lee en el navegador, vista previa y confirmación antes de guardar; probado sólo con un PDF de ejemplo, falta probar con InBody/femmto reales). Página andando con datos de ejemplo: https://claude.ai/artifact/Psg642ViPdzAXNbmr4PXhd. Comparado con la v3 (`docs/mediciones-vs-nutriboost-2026-10-10.md`; el Loom no abre desde la nube): se sumaron evolución del peso, mini gráficos, última consulta, conexión y mensaje. Falta: medidores con rangos (fuente clínica a elegir por Facundo) y teléfono (no se guarda). Segunda pasada completa del video desde la PC de Facundo (10/10): se sumaron mín./prom./máx. del peso, «Registrar nueva medición», «App de la paciente: conectada» en la ficha y pacientes nuevas en Inicio; modelos de plan ya existían (8/10). Inicio: selector de período e indicadores de consultas, ingresos y pacientes nuevas con comparación. Seguimiento: novedades de la cartera (comidas y agua, filtros de período, revisión y paciente, detalle por día, «Escribirle»). Planificación: comparación de fórmulas (Harris-Benedict, FAO/OMS/ONU, Katch-McArdle y basal de la balanza; la meta sigue con Mifflin-St Jeor). Cobranzas: cambiar el día de vencimiento ya no genera una segunda cuota en el mismo mes (migración `20261010170000_fee_one_charge_per_month`, sin aplicar; no toca cuotas ya creadas). Ficha: «Pedirle que actualice su ingreso» manda un mensaje con el enlace; la paciente decide si lo reabre. Planes: «Avisarle a la paciente» (el «Notificar cliente» del video) le manda por Mensajes que la versión publicada ya está en su sección Plan; el análisis del plan suma energía por momento y reparto de proteínas, carbohidratos y grasas, como el «Análisis del plan» del video (2:44). Recetas: una propuesta de IA sin abrir se retoma después de recargar la página, sin pedir otra. Mensajes: los sin leer de toda la cartera y la conversación abierta se actualizan solos (cada 30 y 15 segundos) sin recargar. Recursos: firman con el nombre de la nutricionista y se pueden despublicar (migración `20261010190000_resource_author_unpublish`, sin aplicar). Horarios por comida: la nutricionista indica la hora de cada momento (misma para todos los días del plan) y se ve en su editor, la impresión y, por decisión de Facundo (10/10), junto al nombre de cada comida en el plan de la paciente («Desayuno · 08:00»); queda fija al publicar y pasa a la versión siguiente (migración `20261010200000_plan_meal_times`, sin aplicar). Mails (Facundo eligió Brevo): «Mandar por mail» en la invitación de pacientes (enlace de Supabase, mail en castellano por Brevo) y recordatorio de cada turno 24 h antes, sin migración; se activan al cargar `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` en Railway (`docs/mails-supabase-2026-10-10.md`). Estado de los 15 apartados para Facundo: https://claude.ai/artifact/KP8CCeQCVprNEL2avqyMmU. Corregido: «última consulta» y consultas de Inicio salen de los turnos ya terminados (antes sólo funcionaban en demo) (`docs/inicio-seguimiento-vs-nutriboost-2026-10-10.md`, con lo que falta y por qué). Para verlo en producción faltan su frase «aplicá la migración de mediciones en la base de producción», «aplicá la migración de una cuota por mes en la base de producción», «aplicá la migración de recursos en la base de producción», «aplicá la migración de horarios del plan en la base de producción» y su «publicalo». Detalle: `docs/mediciones-dashboard-2026-10-10.md`.
- Conexión paciente ↔ panel (2026-10-10): decisiones D1–D7 en `docs/decisiones-producto-2026-10-10.md`; estado de cada
  hallazgo en `docs/auditoria-conexion-paciente-crm-2026-10-08.md`; producto y orden de trabajo en
  `docs/producto-definicion-2026-10-08.md`. PR #94 (día de Argentina en el servidor) ya está en `main`. Fotos de ingredientes
  y de platos con el modelo gratuito: pruebas en producción (tortilla ×3, tomate, huevo) hasta que Facundo las apruebe.
- Diario de texto sin permiso de IA (D5, 2026-10-10, [PR #101](https://github.com/Facu42/plan-v/pull/101)): la paciente guarda la descripción aunque no haya activado el análisis.
  La estimación, y la foto, solo corren con ese permiso. Migración `20261010233000_meal_text_without_ai.sql` en el repo,
  sin aplicar en la base en línea: espera la frase escrita de Facundo. No se apoya en los PR #98, #99 ni #100.
  Corregir una comida o medida propia (D4): mientras no está revisada, la paciente la corrige o la borra; si ya fue
  revisada, le pide el cambio a su nutricionista y el registro no se toca. La hoja del diario no está dibujada en el
  archivo: se abre con el mismo diálogo de registros. La migración queda en el repositorio y no se aplica en la base
  en línea hasta la frase escrita de Facundo. El aviso por correo (D3) sigue pendiente: hace falta definir cómo se mandan.
  `docs/producto-definicion-2026-10-08.md`. PR #94 (día de Argentina en el servidor) ya está en `main`. D7 (plan nuevo
  con vigencia) está en el borrador #103: si el plan nuevo empieza más adelante, la paciente sigue con el anterior, ve
  qué cambia y recibe el aviso en la campana. La migración `20261010180000_meal_plan_effective_date` queda solo en el
  repositorio hasta que Facundo escriba la frase para aplicarla. No se corrió en la base hospedada. El correo de D3
  sigue esperando un proveedor de mail. Fotos de ingredientes y de platos con el modelo gratuito: pruebas en producción (tortilla ×3,
  tomate, huevo) hasta que Facundo las apruebe.
- Cuota impaga (D2, 2026-10-10, rama `cursor/cuota-no-bloquea-39fa`): no bloquea la app ni vacía el Inicio. Solo el
  corte de acceso de la profesional lo hace. En el celular el aviso es la tarjeta amarilla del archivo, arriba del
  contenido. Sin migración. Sigue abierto el recargo al cambiar el día de vencimiento.
- Objetivo de la paciente (D1, 2026-10-10): el panel ya mandaba estado, avance y nota; ahora se guardan en la base
  (migración `20261010183000_patient_goal_followup`) y la paciente los ve en Inicio y en Progreso. La nota queda para
  la nutricionista. No es la meta de calorías. **La migración no se aplicó en la base en línea**: espera la frase
  escrita de Facundo. Hasta entonces la app sigue mostrando el texto del objetivo. El archivo de Nutrigo no dibuja
  este objetivo (dibuja el peso): la tarjeta usa la card blanca del archivo y va debajo del marco. No hay visto bueno visual.
- Revisión del front de la paciente contra Nutrigo, 2026-10-09 (rama `claude/front-paciente-nutrigo-tuezz8`):
  las diez pantallas ya coinciden con Figma en modo demo. Producción no tiene modo demo. El ingreso, recuperar
  la clave, «Antes de seguir», la cuenta sin vincular, la carga y el error de conexión se arman con piezas del
  archivo (logo, título, control segmentado, campo y botón verde). Figma no dibuja esas pantallas: la tarjeta
  blanca de 420 es el default. No hay franja de instalar en la entrada. Falta que Facundo compare la entrada;
  este cambio no afirma que coincida. Diagnóstico en `docs/revision-front-paciente-2026-10-09.md`. Piloto:
  invitación a instalar dentro de la tarjeta del menú.
  Segunda tanda (2026-10-10, con su cuenta de prueba en producción): la campana ahora abre un panel de avisos (antes abría el menú) y los «…» de cada tarjeta llevan a su pantalla; la comida cargada sin descripción ya no escribe «null»; las calorías de comidas sin revisar dicen «en revisión»; sin rutina asignada, Inicio muestra las actividades que la paciente registró. Sin cambios de base ni API. Pendiente: fotos de platos (dependen de que las recetas tengan portada), pantallas sin datos.


- Producción, 2026-10-08 (con la frase escrita de Facundo): aplicadas `20261008120000_ingredient_covers` (fotos de
  ingredientes; dos tablas sin acceso directo) y `20261005224500_editorial_clinic_isolation` (cada consultorio solo lee y
  asigna sus propios materiales; se aplicó por partes —función y política— porque el conector cortaba a los 60 s, y quedó
  anotada en el historial de migraciones). La foto de prueba de un plato está en producción y **no se borra hasta que
  Facundo la vea y la apruebe**; la prueba de ingredientes completa necesita publicar el código nuevo (merge a `main`).
  Detalle: `docs/fotos-menu-cloudflare-2026-10-06.md`.
- Auditoría de la demo del 2026-10-07 (rama `claude/inspiring-lovelace-nfsot9`): superficies fuera del
  archivo que todavía tienen estilo viejo y la primera prueba de fotos con Cloudflare en producción.
  Ver `docs/auditoria-demo-2026-10-07.md`.
- Pantallas de la nutricionista y la administración con piezas del archivo de Nutrigo
  (Figma no las dibuja); van en otra rama. El ingreso de la paciente ya usa esas piezas.

- IA gratuita, pedido del 2/10: el predeterminado seguía siendo `gpt-4o-mini` y no cumplía
  lo acordado. Rama `codex/ia-solo-modelos-gratuitos`: `openrouter/free`, rechazo de pagos
  salvo habilitación explícita, límite de precio cero y fotos pagas deshabilitadas.
  Sin migraciones ni cambios de variables de producción. Ver
  `docs/ia-gratuita-2026-10-02.md` y [PR #53](https://github.com/Facu42/plan-v/pull/53)
  para comprobaciones y estado de publicación. Paciente ficticio aún necesita completar
  alergias/restricciones y habilitar su permiso de IA antes de probar una generación real.

- Correcciones de IA del 2026-10-02 integradas y publicadas por
  [PR #50](https://github.com/Facu42/plan-v/pull/50), commit `d313a62`:
  configuración, tareas reservadas y vigentes, identidad de recetas, publicación
  de la copia revisada y recuperación de fotos. Dos migraciones aplicadas mediante
  MCP en `plan-v-app`, con el «ok» escrito de Facundo; web/API/worker desplegados.
  Fotos aún requieren proveedor configurado; no se realizaron llamadas pagas ni
  se contrataron recursos de Supabase. Permisos y ambos roles ficticios comprobados.
  1.144 pruebas generales y 18 de sesiones firmadas/concurrencia aprobadas en
  GitHub, TypeScript/build y controles en verde; navegador ficticio 1440/390.
  API health/ready 200 y nueva versión confirmada. Asesor: 17 avisos de tablas
  internas y 120 avisos de funciones ejecutables por cuentas con sesión (incluyen
  las nuevas); dos avisos anteriores de vistas conservados y documentados.
  Ver `docs/correcciones-ia-2026-10-02.md` para pruebas, despliegue y límites.

- Solicitud del 2026-10-02: comprobar IA de platos/planes, cálculo y rediseñar onboarding.
  Auditoría local con 86 pruebas aprobadas y dos fallos reproducidos: resolutor IA omite
  clave pública de Supabase y guardar borrador oculta meta confirmada. Foto de platos
  requiere OpenAI, ausente entre nombres de variables Railway; Higgsfield todavía no
  está conectado a ese generador. Propuesta visual Higgsfield hecha con la clave local
  indicada por Facundo; diseño aprobado («Sí, aplicalo») e implementado en ambos roles.
  Cinco etapas conservan ingresos anteriores; revisión completa y datos corporales separados.
  Accesos profesionales reales; 1.116 pruebas, TypeScript/build y navegador 1440/390 aprobados.
  Capturas y reporte `design-qa.md`; integración/publicación y comprobación final en
  [PR #49](https://github.com/Facu42/plan-v/pull/49). Sin cambios de base/configuración.
  Rama `codex/onboarding-ia-verificacion`; ver `docs/verificacion-ia-calorias-onboarding-2026-10-02.md`.

- Seguridad, punto 4: prueba con cuatro sesiones reales en Supabase temporal de
  GitHub realizada. Se encontró lectura de notas profesionales por una política
  legacy de paciente. Migración `20261001195127_close_legacy_patient_row_access.sql`
  **aplicada en producción** bajo la autorización escrita previa de este hilo.
  Se conserva permiso profesional; 16 casos temporales de sesiones aprobados. Ver
  `docs/sesiones-aislamiento-2026-10-01.md`.
  El navegador detectó una regresión por opciones de vistas omitidas en el catálogo.
  Corregida y aplicada como `20261001222659`: ficha recuperada, notas privadas
  cerradas y vistas solo de lectura. Par ficticio probado con recarga y cambio
  de sesión; nota QA retirada, invitación e ingreso preparados para usar.
  1113 pruebas generales y 16 de sesiones aprobadas. Dos avisos de vistas con
  permisos del propietario documentados; sin recursos de Supabase nuevos.
  Registro: `docs/prueba-navegador-produccion-2026-10-01.md`.
  El punto 3 está
  clasificado: las 16 tablas están cerradas al acceso directo; 38 pruebas locales
  nuevas lo protegen. Ver `docs/clasificacion-tablas-internas-2026-10-01.md`.
  El 1/10 se verificaron las 34 funciones internas cerradas y las 116 públicas
  entonces existentes; la ampliación de IA del 2/10 se registra arriba.
  Las tres correcciones confirmadas de los puntos 1 y 2 están
  aplicadas; evidencia anterior y posterior en los informes de funciones sensibles.

- Abiertos sin juntar: #27 base de datos (63 índices; en verde, necesita su frase "aplicá índices en la
  base"), #24 marketing (borrador, no toca la app), #25 documentación.
- Trabajo local del 27/9 en la PC de Facundo (Consejos, detalle de consejo, ficha de receta, Menú
  saludable): rama `codex/pv47-recetas-consejos`, sin juntar con `main`.
- Cobro a nutricionistas (prueba gratis y, sin pago, solo lectura sin borrar nada): falta que
  Facundo cargue el precio mensual y decida los días de prueba (30 por defecto).
- Prueba real de punta a punta con una nutricionista y una paciente.
- Mails: confirmar cómo se mandan (Supabase sin costo o Resend con marca propia).
- Calorías: aviso al pedir los datos (hoy solo dentro de la app) (la revisión legal la maneja Facundo aparte, ya no es pendiente del proyecto).
- Revisión legal (13 puntos en `docs/legal/revision-legal.md`).
- App para tiendas (Android primero, empaquetando la web), calidad en producción, publicidad paga y
  página pública con precios (espera el precio). Plan: `docs/plan-apartados.md`.

## Base más rápida: índices y reglas de acceso (2026-10-17)

Retoma el PR #27 (de septiembre, quedó viejo porque entraron muchas tablas). El asesor de rendimiento de Supabase
marcaba 114 claves hacia otras tablas sin índice y 7 reglas de acceso que calculan la usuaria fila por fila.
Migración `20261017010000_performance_indexes`: reescribe esas reglas con `(select auth.uid())` usando ALTER POLICY
sobre la expresión que tienen hoy (mismos permisos) y crea un índice por cada clave sin cubrir en `public` y
`private`, sin borrar nada. Prueba `server/db-performance.postgres.test.ts`: falla si una clave nueva queda sin
índice o si una regla vuelve a llamar a `auth.uid()` por fila. Quedan a propósito las advertencias de reglas dobles
y de índices sin uso (la base es chica y todavía no hay uso real que las mida). **Aplicada en producción el 17/10** con la frase de
Facundo; el historial de la base la anota como `20261017013123` (registrada en el manifiesto de migraciones). Verificado:
0 claves sin índice y las 7 reglas con `(select auth.uid())`.
Un revisor automático encontró 4 claves cubiertas solo por índices parciales (con WHERE), que no sirven para la
clave: `20261017020000_fk_full_indexes` les crea un índice completo (aplicada el 17/10 con la frase de Facundo, historial
`20261017021355`) y la prueba ahora exige índices válidos, listos y sin WHERE.

## Meta de agua por paciente (2026-10-16)

Decisión de Facundo (15/10, «Meta por paciente»): la nutri elige la meta de agua de cada paciente, de 4 a 16 vasos
por día, en «Editar ficha» (vacía = 8, la de siempre). La paciente la ve en Inicio, Diario y Progreso, y el aviso de
agua del día y la adherencia se miden contra esa meta. Además se puede anotar hasta 16 vasos por día (antes el tope
era 8). Migración `20261016090000_water_goal` (columna `patients.water_goal_glasses`, vista `patient_water_goal_view`
solo con la fila propia, y la regla de `habit_logs` pasa a 0..16). **Aplicada en producción el 16/10** (Facundo pegó el SQL
porque lleva un DROP de la regla vieja) y publicada con el PR #128.

## Lista del súper en unidades del comercio (2026-10-15)

La lista suma los gramos del plan, pero en la verdulería o la carnicería nadie pide 480 g. Ahora cada producto se
muestra como se pide: «1/2 kg», «3/4 kg», «1,25 kg», «1,5 l», «1 docena» de huevos y unidades enteras, siempre
redondeando para arriba. Lo que no llega a un cuarto queda en gramos de a 50 (150 g); las medidas de cocina (cda,
cdita, taza) y lo menor a 100 g quedan como vienen. Al pasar el mouse se ve lo que suma el plan. El texto de
«Compartir lista» usa las mismas cantidades. Solo pantalla: la base guarda lo mismo. Código: `localAmount` en
`src/features/nutrigo/screens/shopping-format.ts`.

## Recordatorio de consulta al teléfono (2026-10-15)

El día antes de cada consulta agendada, la paciente con avisos activados recibe «Mañana tenés consulta · Mirá el
horario en Plan V», que abre su Agenda. No lleva la hora, el lugar ni el nombre de la nutri (viaja por Google,
Apple o Mozilla). Usa el mismo tramo de 10 minutos que el recordatorio por mail (`server/mail/reminders.ts`), sin
tocar la base. Lo corre el servicio worker de Railway (la API tiene `WORKER_SEPARATE`), así que las tres claves
`VAPID_*` tienen que estar también en el worker; sin ellas no manda nada. Código: `server/push/reminders.ts`.

## Mensajes al instante en la app de la paciente (2026-10-15)

Antes la paciente solo veía un mensaje nuevo de su nutri si recargaba la página. Ahora la app trae la ficha
sola mientras está a la vista: cada 15 s con «Mensajes» abierto (igual que el consultorio) y cada 60 s en las
demás pantallas, así la campanita avisa del mensaje. Al volver a la pestaña actualiza enseguida. Con la pestaña
oculta no pide nada. Código: `src/features/nutrigo/use-live-refresh.ts` (con pruebas) y `PatientApp.tsx`.
No toca la base ni el diseño. Tiempo real de verdad (sin esperar 15 s) necesitaría Supabase Realtime: queda para más adelante.

## Actividad, rutina y pasos de la paciente (2026-10-15)
- Inicio de la paciente: «Actividad reciente» y el bloque de ejercicio usan las actividades reales de la pantalla de Ejercicio (antes, en producción, quedaban vacíos porque la ficha no las trae).
- El avance de la rutina en Inicio cuenta las series que la paciente cargó con «Registrar rutina» esa semana (antes quedaba siempre 0).
- Diario «Registrar» suma «Registrar pasos». La nutri ve los pasos de la semana en «Registros y evolución» (hoy y promedio).
- Calorías quemadas (decisión de Facundo, 15/10: «a mano»): «Registrar actividad» suma un campo opcional «Calorías quemadas»; Inicio y Progreso las suman al bloque «Quemadas» y la tabla de Ejercicio las muestra. Es un dato que declara la paciente, no una medición. Migración `20261015210000_activity_kcal` (columna nueva y función `log_patient_activity_with_kcal`; sin borrar nada). **Aplicada en producción el 15/10** con la frase de Facundo; el historial de la base la anota como `20261015173356` (es repetible).
- La meta de agua sigue fija en 8 vasos.

## Lo que espera de Facundo

- Probar con las cuentas de prueba (ver abajo): panel, Cobranzas, Pagos, calorías.
- Cargar el precio mensual y decidir los días de prueba.
- Elegir cómo mandar mails y si Marketing promociona desde cuenta nueva (`@planv.app`) o desde `@planv.nutricion`.
- Google: generar un secreto nuevo del cliente, completar "Información de marca" y publicar la app.
- Marketing: autorización de Verónica y créditos de Higgsfield.

## Cómo probar con cuentas de prueba

1. Entrar a `/admin` con su cuenta de Google, pestaña "Cuentas de prueba".
2. Escribir su mail y una clave de 10 o más caracteres. Se crean, ya confirmadas y vinculadas, una
   nutricionista (`usuario+plan-v-nutri@dominio`) y una paciente (`usuario+plan-v-paciente@dominio`),
   la paciente con datos de ejemplo y sin cargo.
3. Entrar en https://plan-v-eight.vercel.app con esos mails y esa clave (no hace falta abrir el mail;
   con Gmail llegan a la misma casilla). La primera vez pide aceptar términos ("Antes de seguir").
   Para ver el primer uso de una nutricionista vacía, crear otra desde la pestaña de altas ("Crear con clave").

## Página pública para pacientes y sistema de diseño

- Dirección: `/pacientes` (`pacientes.html`), para que la nutricionista la comparta con sus pacientes. Es una página aparte: no toca la entrada ni la app. Rutas en `vercel.json`, `vite.config.ts` y la prueba `server/ops/pv30.test.ts`.
- Sistema de diseño de las páginas públicas: `docs/sistema-de-diseno-publico.md` (y `.html` para verlo), con las variables en `src/landing/tokens.css`. Los colores son los del logo. Reemplaza la paleta de la guía de redes (`docs/redes`). La app no lo usa.
- Movimiento (cinta, números, parallax); con "reducir movimiento" queda quieta.
- Fotos ilustrativas generadas con IA (API de Higgsfield, script fuera del repo); la de Verónica Trenti es real y Facundo la autorizó por escrito en el chat (2026-10-02). El pie lo aclara.
- Pendiente: el botón principal lleva hoy a `/` (la entrada de la app); falta definir el destino real. La landing para nutricionistas (`/nutricionistas`) sigue en borrador en el PR 45.

## Cómo se registra

- Cada tema anota lo avanzado en su archivo de `docs/` (arriba) o en `docs/plan-apartados.md`.
- El estado resumido del proyecto vive además en la memoria compartida del proyecto en Claude; este
  archivo es la copia para quien no la tiene.


Continuación del cierre de paciente y nutricionista: [correcciones, evidencia y paquete de cinco migraciones](cierre-funcional-plan-v-2026-10-05.md).

Contrato de cada acción, permisos y lecturas al recargar: [recorridos y guía para ambas experiencias](recorridos-y-contratos-plan-v-2026-10-05.md).

## Movimiento de la paciente, primer pase (2026-10-10)
Se cerró el PR #67 (conflictos, inspirado en otra interfaz). Pase nuevo desde main: en Inicio, pasos y calorías (consumidas, quemadas, restantes) suben contando (`CountUp`, desde cero al entrar y desde el valor anterior al cambiar) y las barras de progreso se llenan al aparecer. Todo apagado con «reducir movimiento». Siguen: peso, macros, pulso al cargar, Ejercicio y Progreso.

## Calorías de la paciente suman al instante (2026-10-10)
Facundo: lo que aprueba la nutricionista es el plan, no lo que la paciente carga al comer. En la vista de la paciente (Inicio, Diario, Progreso) las comidas pendientes de revisión ya suman calorías y macros (estimadas). La vista de la nutricionista no cambia. PR en borrador, sin juntar.

## Progreso global (2026-10-10)
Pantalla `/crm/progreso-global` (PR #93): peso y comidas de toda la cartera por período. Sin migración. Detalle en `docs/progreso-global-2026-10-10.md`.
## Continuación Nutriboost: nutrición y PDF del plan · 14/10/2026

Entrega 4 verificada en `codex/nutridesk-release-nutricion`, sobre la cabeza final de importación `b143744b4024314e8313662a1a911b70a28c914b`. Incorpora cálculo efectivo de la fórmula revisada, referencias propias de micronutrientes, grupos, catálogo paginado, seis momentos personalizados y descarga PDF del plan. Suite propia: 2.678 aprobadas, cero fallos, dos omitidas y 407 archivos; tipos/build/migraciones/vistas/scanner y revisión independiente aprobados. [Informe y paso 10](nutridesk-release-nutricion-2026-10-14.md). Sólo SQL nueva `20261011180000`, sin aplicar. No activar USDA ni cambiar Supabase/SMTP/Groq. Las siguientes entregas conservan clínica avanzada/ficha, agenda/equipo/cobros y operaciones generales; el cálculo automático Kerr sigue pendiente.


Quinta entrega apilada: [ficha clínica y exportación histórica, evidencia y límites](nutridesk-release-clinica-2026-10-14.md). Base 304413f; gate previo 2.719 pruebas aprobadas; verificación nueva de marca vigente en curso, sin producción.


## Ánimo y síntomas de la paciente (2026-10-15)
En el Diario, «Registrar» → «Cómo me siento»: energía del día (con energía, normal, sin energía; se guarda en la energía que ya existía) y ocho síntomas de una lista cerrada. La nutricionista los ve en la ficha, «Registros y evolución», debajo de «Descanso y energía». Nutrigo no dibuja esta pantalla: se armó con su diálogo de registro y los botones del diario. Migración `20261015100000_habit_symptoms` (agrega una columna con lista cerrada): ya aplicada en la base el 14/10 con la frase de Facundo (el historial de la base la anota como `20261014215543`). La de #110 (vistas solo lectura) también quedó aplicada. PR112 y PR110 ya integrados en main el 14/10; no volver a ejecutar sus migraciones.

## Avisos al teléfono de la paciente (2026-10-15)
En la campanita de la paciente, «Avisos», hay una fila «Recibir avisos en este teléfono». Al aceptarla, el teléfono recibe un aviso cuando la nutri le escribe, publica su plan, le indica un recurso o cambia su consulta. Los avisos pasan por Google, Apple o Mozilla, así que solo llevan un texto genérico (nunca el mensaje ni datos de salud). En iPhone hace falta tener Plan V instalada en la pantalla de inicio.
Queda apagado hasta tener las tres variables `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en la API de Railway; sin ellas la fila no aparece y no se manda nada. Migración `20261015200000_push_subscriptions` (tabla nueva, solo el servidor la usa): **aplicada en producción el 15/10** con la frase de Facundo; el historial de la base la anota como `20261015163006` (es repetible). Falta cargar las claves en Railway y juntar el PR; el código se puede juntar antes sin efecto. PR en borrador.

## Recorridos de punta a punta y monitor de producción (2026-10-14)
Etapa 1 del plan (`docs/producto/06-plan-implementacion.md`, puntos 6 y 7, sin costo):
- `npm run test:e2e` (Playwright) levanta la API y la web en modo demo, con las claves de Supabase vacías, y recorre en orden cinco caminos de dos roles: alta de paciente con invitación, ingreso de la paciente visto por la nutri, plan editado y publicado visto por la paciente, comida registrada en el diario vista por la nutri, y revisión de la nutri vista por la paciente. Corre en cada PR (trabajo «recorridos de punta a punta» de CI). Prueba a propósito: romper «Confirmar sin cambios» hace fallar el recorrido 5.
- `.github/workflows/monitor.yml` mira cada 15 minutos `api/health` (con la base conectada) y la web. Si fallan tres intentos abre un issue con la etiqueta `caida` que menciona a Facundo; cuando vuelve, lo cierra. Arranca recién cuando el archivo está en `main`.
- Quedan afuera porque cuestan o piden cuenta: base de staging aparte, Sentry y un monitor externo con aviso al celular.

## Cobro a nutricionistas: aviso al vencer, solo lectura a mano (2026-10-15)
Parte 3 de `docs/cobros-y-panel.md`. Facundo eligió (15/10) que **vencer no corte nada solo**: la nutricionista vencida sigue usando todo y ve una tarjeta amarilla «Servicio vencido» con la fecha y el precio (`ServiceNotice.tsx`, lee `GET /api/me/service`, sin la nota interna); antes ve «Tu prueba termina pronto» o «Tu servicio vence pronto» (7 días antes). Solo lectura únicamente cuando Facundo la **suspende** desde su panel (`/admin`, «Excepción» → «Suspender»): sigue viendo todo, pero cualquier escritura responde 403 con un mensaje claro (`server/service/own-service.ts`). Quedan abiertas la sesión, `/api/me`, el panel del administrador y los avisos; las pacientes nunca se frenan; si no se puede consultar el estado, deja pasar. El estado se recuerda un minuto y se borra cuando el administrador cambia algo. Sin migraciones.

## Rachas de la paciente (2026-10-15)
En Inicio, el texto bajo el saludo («Tu acompañamiento, día a día») pasa a mostrar la racha cuando la paciente lleva dos días seguidos o más registrando una comida o un hábito (agua, sueño, pasos, ánimo o síntomas), contados en días de Argentina. Si hoy todavía no registró, la invita a hacerlo para no cortarla. Como la paciente solo recibe sus últimas 20 comidas y 14 días de hábitos, la cuenta no inventa días: si llega a ese borde dice «o más». Código: `src/features/nutrigo/streak.ts` (con pruebas). El archivo de Nutrigo no dibuja rachas; se usa el mismo texto del archivo, sin piezas nuevas. Sin migraciones.

## Próximas acciones de la nutricionista (2026-10-15)
La bandeja «Tu consultorio, hoy» suma dos tipos de pendiente: **Cuotas vencidas** (cuota impaga con el vencimiento pasado y sin aviso de pago de la paciente; si avisó, queda «Aviso de pago por confirmar»; abre Cobranzas) y **Sin registros hace 7 días** (paciente con acceso a la app, dada de alta hace 7 días o más, sin comidas ni hábitos declarados en 7 días; dice cuántos días pasaron, o «en los últimos 30 días»; abre Mensajes). Es un aviso para escribirle, nunca un juicio clínico. El servidor solo lee fechas de comidas y hábitos de los últimos 30 días, sin contenido. Código: `server/crm/repository.ts` (con pruebas en `work-queue.test.ts` y en Postgres descartable). Sin migraciones.

### Operaciones y comunicaciones — entrega 7, 15/10

La rama `codex/nutridesk-release-operaciones` continúa desde PR123 y conserva los cambios de main hasta `9c56854`. El [informe vigente](nutridesk-release-operaciones-2026-10-15.md) documenta asistente, fuentes, CSV, preferencias, comunicaciones y límites externos; sustituye el estado del informe histórico del 12/10. Se cerraron dos P2: permiso de correo accesible con guardado/baja explícitos y bloqueo de WhatsApp sin configuración de bajas. Suite final propia: 2.977 aprobadas, cero fallos y dos omitidas en 452 archivos; tipos, build y gates aprobados. La [revisión de código](nutridesk-release-operaciones-review-2026-10-15.md) y la [QA a 1440/390](nutridesk-release-operaciones-qa-2026-10-15.md) no dejan P1/P2 abiertos en el alcance local; 1.789 huellas exactas tras suite y recorrido. Las cinco mejoras heredadas de demo y pacing, OCR/CSP y los JSON originales se conservan. La entrega de SARA 2 sigue separada. No se publicaron cambios ni se activaron servicios desde esta entrega.

- IA de apoyo para planes semanales (17/10/2026, rama `claude/project-thread-adfvy4`, PR #143 en main): ENCENDIDA en producción desde el 17/10 con `AI_PLAN_ASSISTANT=on` (solo modelos gratis; sin la variable vuelve a apagarse), sin migraciones ni pantallas nuevas; usa SARA 2, equivalencias, modelos y alergias de la nutri, y la bolsa global de US$5 al mes. Detalle: `docs/ia-asistente-planes-2026-10-17.md`.
- Verificación en dos pasos (2026-10-17, issue #132 tarea 1, rama `claude/project-thread-jlmakv`): pantallas de alta con QR y de código, chequeo `aal2` en el servidor (`MFA_ENFORCE=1`) y en el frente (`VITE_MFA_ENFORCE=1`), y migración `20261017030000_mfa_aal2_gate` **sin aplicar** (interruptor `private.mfa_enforcement.enabled`, apagado). Todo apagado de fábrica. Pasos para prenderlo, uno por uno con la frase de Facundo: `docs/verificacion-dos-pasos-2026-10-17.md`.
- Regla de Facundo (17/10/2026): la IA queda encendida como parte de la función de la app (solo modelos gratis, tope de US$5 al mes en el servidor). Un PR terminado, en verde y sin conflictos se junta a main sin su frase, salvo que cambie la base, la configuración de producción o active un servicio pago: ahí sigue haciendo falta su frase escrita. Los borradores que esperan su decisión no se juntan.

## Rediseño del panel de la nutri (19/10/2026)

Facundo aprobó los bocetos del panel nuevo (paleta de la app de la paciente, tema claro y oscuro, menú plegable, ficha con 11 pestañas). Boceto: `design/panel-nutri/bocetos.html`. Plan por fases para cualquier agente: `docs/panel-nutri-rediseno/plan.md`. El 19/10 02:25 se sumaron submenús, paciente que se despliega en la lista, Planes completo (elegir paciente, semana editable, compras, indicaciones, versiones, cuatro maneras de empezar) y fotos de comida difuminadas. Todavía no hay código: el desarrollo espera que Facundo diga quién lo toma.


## Rediseño del panel de la nutri · 19/10/2026

Fase 1 del [plan aprobado](panel-nutri-rediseno/plan.md) entregada por Codex en [PR #150](https://github.com/Facu42/plan-v/pull/150), rama `codex/panel-nutri-fase-1`: paleta/tema, menú y armazón. [Verificación y límites](panel-nutri-rediseno/fase-1-verificacion.md). Sigue fase 2 (Inicio); los cuerpos de pantallas se desarrollan por sus fases. Sin integración a main ni cambios de producción.
