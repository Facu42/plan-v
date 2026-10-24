# Panel de la nutri: instrucciones para dejarlo como versión final

Escrito el 24/10/2026 por Claude (hilo «Escribir instrucciones para dejar el panel final») porque Facundo preguntó:
«Ya hay algo desarrollado para el dashboard / CRM de la nutricionista. Con todo este boceto nuevo, ¿cómo le tendría
que dar las instrucciones para que lo apliquen y lo dejen como versión final, con el backend enganchado y la
sincronización con la app del paciente?».

Sirve para **cualquier agente** (Claude, Codex, Cursor) que llegue sin contexto. Manda sobre
[plan.md](plan.md) e [instrucciones-boceto.md](instrucciones-boceto.md) donde choquen; el detalle del boceto sigue en
[traspaso-boceto-v3.md](traspaso-boceto-v3.md) y las funciones de Nutreando en [../nutreando/plan.md](../nutreando/plan.md).

---

## 1. Prompt corto para pegarle al agente

> Vas a dejar el panel de la nutricionista de Plan V como versión final. Repo `Facu42/plan-v`, rama nueva desde `main`.
> Leé primero, enteros: `CLAUDE.md`, `AGENTS.md`, `docs/coordinacion-agentes.md`,
> `docs/panel-nutri-rediseno/version-final.md` (este plan, manda sobre los demás) y
> `docs/panel-nutri-rediseno/traspaso-boceto-v3.md`. Seguí `.claude/skills/regression-guard/SKILL.md`.
> La referencia visual es el boceto `design/panel-nutri/v3/panel.html` (armalo con `python3 design/panel-nutri/v3/build.py`).
> Hacé **solo la próxima fase que figure como Pendiente** en la sección 7 de `version-final.md`: copiá el HTML y los
> estilos del boceto tal cual y conectalos a los datos reales que ya existen. No inventes diseño, no borres funciones,
> no dejes botones que no hacen nada. Si la fase necesita tablas nuevas, escribí la migración (solo agrega) y **pará**:
> la base de producción se toca solo con la frase escrita de Facundo. Al terminar: `npm test`, `npm run check`,
> `npm run panel:contrato` y, si hay migraciones, `npm run check:migrations`; capturas a 1440×900 y 390×844 en claro y
> oscuro al lado del boceto; PR con el informe del paso 10 de regression-guard; actualizá la sección 7 y la bitácora.
> **No juntes a `main`**: cada fase espera el ok de Facundo. Respondele en español simple, con voseo y sin jerga.

Para pedir la fase siguiente alcanza con: «Seguí con la próxima fase de `docs/panel-nutri-rediseno/version-final.md`».

---

## 2. Dónde estamos hoy (revisión del 24/10 sobre `main` 854dac6)

En una línea: **la app ya tiene casi todas las funciones con datos reales, pero con el diseño viejo; el boceto nuevo
(v26) tiene el diseño final, pero con datos de ejemplo.** El trabajo es juntar las dos cosas, pantalla por pantalla.

- **Boceto nuevo (v26)**: https://claude.ai/artifact/JwXZXARtS7e6scYcpx8cKV, fuentes en `design/panel-nutri/v3/`.
  Diez pantallas (Inicio, Pacientes, Agenda, Ficha con 10 pestañas, Cobranzas, Mensajes, Planes, Página pública,
  Equipo, Ajustes) y versión celular. Todo es maqueta: datos fijos en el JavaScript del boceto. **Todavía no tiene el
  ok de Facundo** (paso 0.9 de `docs/nutreando/plan.md`).
- **App real** (`/crm/*`): armazón de la fase A (PR #162) copiado del **boceto viejo** (`design/panel-nutri/bocetos.html`),
  pantallas de las fases 1 a 5 (PR #150 a #154) con el estilo viejo. Todas leen datos reales de la API y la base.
- **Herramientas**: `scripts/panel-boceto-css.mjs` (copia estilos e íconos) y `npm run panel:contrato` (compara la app
  con el boceto) **todavía leen el boceto viejo**. Hay que apuntarlas al nuevo (fase 1).

### 2.1 Pantalla por pantalla

| Pantalla del boceto v26 | Fuente en el boceto | Hoy en la app (ruta y componente) | Datos | Qué falta para la versión final |
|---|---|---|---|---|
| Armazón: menú, encabezado, campana, tema | `src/base.html` (`shell`), `nt.js` (campana, «Consulta en curso») | Todas las `/crm/*`: `PanelBocetoShell`, `PanelNavigation` (boceto viejo) | Reales (contadores del menú) | Rehacer con el menú y el encabezado nuevos; campana con avisos reales (necesita base, paquete A) |
| Inicio | `base.html` (`inicio`), `nt.js` (cumpleaños) | `/crm/inicio`: `PanelHome` | Reales (bandeja del consultorio, turnos, cobros) | Diseño nuevo: Pendientes con «Buenas noticias» y «Felicitar», Necesitan atención, tarjeta oscura, Consultas de hoy, cinco números. Cumpleaños con `birth_date` (ya existe) |
| Pacientes | `base.html` (`pacientes`), `nt.js` (grupos) | `/crm/pacientes`: `ShowroomPatients`, `PanelPatientsTable` | Reales | Tabla y resumen desplegable nuevos; grupos de pacientes (base, paquete A) |
| Ficha (10 pestañas) | `base.html` (`ficha`), `fx.js`, `hc.js`, `nt.js` | `/crm/ficha`: `ProfessionalPatientWorkspace` y `PanelPatient*` (11 pestañas viejas) | Reales (historia, mediciones, notas por voz, laboratorio, archivos, cobros) | Pasar a las 10 pestañas nuevas sin perder ninguna sección real; «Para la paciente», firma, pedir registro, formularios, certificados, lectura de laboratorio y balanza con IA, historial de cambios (base, paquete A) |
| Agenda | `base.html` (`agenda`) | `/crm/agenda`: `PanelAgenda` | Reales (turnos, reservas, bloqueos) | Diseño nuevo; recordatorios por app y mail (sin WhatsApp) |
| Cobranzas | `cob.js` | `/crm/cobranzas`: `PanelCobranzas`, `PanelDebit`, `PanelFeePay` | Reales (cuotas, cobros, débito con Mercado Pago de la nutri) | Diseño nuevo; planilla por obra social (base, paquete B) |
| Mensajes | `msg.js` | `/crm/mensajes`: `NutrigoMessages` | Reales (chat, adjuntos, leídos) | Diseño de 3 columnas; respuestas guardadas y mensaje a varias (base, paquete A); avisos automáticos se configuran en Ajustes |
| Planes | `pl.js`, `ia.js`, `pe.js` | `/crm/plan`: `ProfessionalPlans`, `ShowroomMealPlan`, `MealPlanEditor`; `/crm/modelos`: `ModelCatalog`; equivalencias en `NutritionExchanges` | Reales (borrador, versiones, publicar, modelos, IA con tope US$5) | Editor «Día» como Nutreando, armado con IA nuevo, tipo de alimentación y estrategia (base, paquete B), alternativas que elige la paciente (PR #145, espera la frase de la base) |
| Página pública | `pub.js` | `/crm/agenda?agenda=publica`: `PanelPublicPage` | Reales (perfil, tipos de consulta, reservas) | Servicios, paquetes, obras sociales, QR, opiniones (base, paquete B) |
| Equipo | `eq.js` | `/crm/desarrollo?modulo=equipo`: `ProfessionalModules` | Reales (integrantes, invitaciones de la pila de Codex) | Permisos por módulo y registro de accesos (base, paquete C, revisión de seguridad) |
| Ajustes | `aj.js` | `/crm/desarrollo?modulo=configuracion`: tema, `PanelConfigConnections`, `NutritionSettingsPanel` | Reales | Mi cuenta, Plantillas, Avisos automáticos, Seguridad (dos pasos ya está, apagado), Integraciones |
| Celular (390) | `mob.js` | La app ya se adapta, con el diseño viejo | — | Cajón, barra de abajo y paneles que suben, como el boceto |

### 2.2 Pantallas que la app tiene y el boceto nuevo no dibuja

Asistente IA, Seguimiento (revisar comidas), Progreso de la cartera, Alimentos, Biblioteca, Centro de ayuda.
**Regla: no se borran.** Mientras Facundo no decida, quedan con el armazón nuevo y su contenido actual, en el menú
donde estaban. Pregunta abierta en la sección 9.

---

## 3. Método (obligatorio en cada fase)

1. **El boceto se copia, no se redibuja.** Cada pantalla del boceto es HTML generado por su `src/*.js`. Se pasa a
   React con las mismas etiquetas, clases y orden; solo se cambian los textos y números de ejemplo por datos reales.
2. **Estilos sin tocar valores.** `scripts/panel-boceto-css.mjs` copia los estilos del boceto a
   `src/components/nutrigo/panel-boceto.css` con la raíz del panel adelante, para no pisar la app de la paciente.
   Lo que la app necesita y el boceto no tiene va aparte (`panel-boceto-app.css`), con una línea que diga por qué.
3. **Se conecta lo que ya existe.** Antes de crear algo, buscar con `git grep` la ruta de la API o el componente
   (tabla 2.1 y sección 5). La lógica vieja se reusa; se cambia solo el dibujo.
4. **Sin dato, el bloque igual se ve**, con cero o un texto corto en español («Todavía no hay mediciones»). Nunca se
   oculta ni se vacía. En producción no hay datos de ejemplo.
5. **Cada botón hace algo real** o no se muestra. Si el boceto tiene una función que la app no tiene, se construye
   entera (API, base, permisos, pruebas) en la fase que corresponda, o se deja para su fase con un aviso honesto
   («Disponible pronto»), anotado en la sección 7. Mercado Pago y Google muestran «Conectar» hasta que haya claves.
6. **Movimiento** de 200 a 300 ms hecho con CSS (sin GSAP, aunque el boceto lo use). Con «reducir movimiento», nada se mueve.
7. **Textos** con voseo, cortos. **Nada de WhatsApp** en el panel: los avisos a la paciente van por la app y por mail.
8. **Comprobación**: `npm run panel:contrato` en verde para las piezas de la fase (sumarlas a `PIEZAS` en
   `scripts/panel-nutri-boceto-contrato.mjs`), capturas a 1440×900 y 390×844, claro y oscuro, **miradas** al lado del
   boceto. A 1440×900 la página no se desplaza: lo largo se desplaza dentro de su tarjeta.
9. **Una fase, una rama, un PR.** Rama desde `main` con nombre del agente (`claude/…`, `codex/…`, `cursor/…`). No tocar
   ramas de otros. Anotar la fase en la tabla de carriles de `docs/coordinacion-agentes.md` al empezar.

---

## 4. Fases, en orden

Cada fase: qué se hace, qué datos usa, qué falta de base, qué se sincroniza con la paciente y cómo se acepta.
**Ninguna fase se junta a `main` sin el ok escrito de Facundo.** Ninguna migración se aplica sin su frase.

### Fase 0. Ok de Facundo al boceto v26

- Mostrarle el link del boceto y pedir el ok al boceto entero, más la respuesta a la sección 9.
- Aceptación: su ok escrito en el chat. Sin esto, las fases siguientes pueden prepararse pero no juntarse.

### Fase 1. Herramientas apuntando al boceto nuevo

- `scripts/panel-boceto-css.mjs` y `scripts/panel-nutri-boceto-contrato.mjs` leen `design/panel-nutri/v3/panel.html`
  en vez de `bocetos.html`. Regenerar `panel-boceto.css`, íconos y fotos. El boceto viejo queda como historia.
- Sin cambios visibles todavía para la nutri (o los mínimos para que nada se rompa).
- Aceptación: el contrato corre contra el boceto nuevo; `npm test` y `npm run check` en verde.

### Fase 2. Armazón nuevo (menú, encabezado, campana, tema, celular)

- Fuente: `base.html` (`shell`, `hdr`), `nt.js` (campana y «Consulta en curso»), `mob.js` (cajón y barra de abajo).
- Datos: los mismos contadores y rutas de `panelNavGroups`; plegado y tema guardados como hoy.
- Base (paquete A): marcar avisos de la campana como leídos. Hasta tener la frase, la campana muestra los avisos que
  ya existen (bandeja del consultorio `/api/crm/work-queue`, mensajes sin leer) sin «marcar como leído».
- Aceptación: todas las pantallas actuales se abren dentro del armazón nuevo; contrato del armazón en verde.

### Fase 3. Inicio

- Fuente: `base.html` (`inicio`) y `nt.js` (cumpleaños).
- Datos: `PanelHome` y `use-home-data` (bandeja `/api/crm/work-queue`, turnos de scheduling, cobranzas `/api/billing`,
  intake y care de la próxima paciente). Cumpleaños con `birth_date`. Sin base nueva.
- Aceptación: cada número sale de la base; cada fila abre su lugar; entra en 1440×900.

### Fase 4. Pacientes

- Fuente: `base.html` (`pacientes` y su resumen desplegable), `nt.js` (grupos).
- Datos: `/api/crm/patients`, archivo, alta, importación (`/api/patient-imports/*`), acceso a la app.
- Base (paquete A): grupos de pacientes. Sin la frase, el filtro de grupos queda para después con aviso.
- Aceptación: filtros del submenú (`?filtro=`) siguen andando; el resumen se despliega hacia abajo; enlaces viejos abren igual.

### Fase 5. Ficha, parte 1: armazón y pestañas con lo que ya existe

- Fuente: `base.html` (`ficha`), `fx.js` (las 10 pestañas), `hc.js` (Historia clínica y Laboratorio).
- Las 10 pestañas nuevas juntan las 14 secciones reales (`patient-record-sections.ts`); los enlaces viejos
  `?seccion=` siguen abriendo el lugar correcto. Notas por voz (`ConsultationNotes`, `/api/patients/:id/consultations`)
  se rediseñan sin cambiar la lógica.
- Sin base nueva.
- Aceptación: ninguna sección real quedó sin lugar; prueba que recorre cada `?seccion=` vieja.

### Fase 6. Ficha, parte 2: cerrar la consulta y «Para la paciente»

- Funciones 1 y 2 de Nutreando: lista «Para la paciente» (plan, devolución, material, registro, formulario,
  certificado, cobro, próximo turno) que sale en **un solo aviso**; cerrar y firmar con matrícula; después solo notas
  agregadas con fecha; historial de quién cambió cada parte.
- Ya existe: cierre de consulta (`/api/patients/:id/consultations/completions`), resúmenes compartidos
  (`consultation_shared_summaries`), registro de auditoría (`audit_events`).
- Base (paquete A): entregables de la consulta, firma, notas agregadas.
- Sincroniza con la paciente: un aviso en la app (campanita y push) y por mail; en su Inicio ve lo que le dejaron.
- Aceptación: al cerrar, la paciente de prueba recibe un único aviso con todo; una nota firmada no se puede editar.

### Fase 7. Ficha, parte 3: registro, formularios, estudios y documentos

- Funciones 4, 5, 6, 10, 11, 12: pedir registro alimentario (con modo sin números), formularios propios, certificados,
  laboratorio y balanza leídos por IA (cada valor se confirma), avisos de valor raro.
- Ya existe: organizador de documentos con IA (`/api/patients/:id/document-organizer`), laboratorio y ficha clínica
  (`/api/patients/:id/clinical-workspace`), pedido de datos del cuerpo (`/api/patients/:id/body-data/request`).
- Base (paquete A): pedidos de registro, plantillas, envíos y respuestas, certificados, lecturas de laboratorio.
- **Los rangos clínicos no se prenden sin la validación de Verónica.**
- Sincroniza con la paciente: «Para hacer» en su Inicio (formularios, documentos, registro pedido «1 de 7 días»).
- Aceptación: un formulario enviado aparece en la app de la paciente y su respuesta vuelve a la ficha.

### Fase 8. Agenda y Cobranzas

- Fuente: `base.html` (`agenda`), `cob.js`.
- Datos: turnos (`/api/patients/:id/appointment`, `/api/team/:nid/appointments`), reservas
  (`/api/scheduling/bookings`), cobros (`/api/patients/:id/charges`, `/payments`, `/api/billing`), débito y pago único
  (`/api/scheduling/subscriptions`, `/api/patient/fee-checkout`, ya aplicados en la base).
- Base (paquete B): servicios, paquetes, obras sociales y copagos, planilla por obra social.
- Sincroniza con la paciente: turno nuevo, cambio o cancelación aparece en su Agenda; puede confirmar o pedir cambio
  (`/appointment/confirm`, `/appointment/reschedule`); cuota y pagos en su pantalla Pagos.
- Aceptación: un turno creado en el panel aparece en la app de la paciente y su confirmación vuelve al panel.

### Fase 9. Mensajes

- Fuente: `msg.js`.
- Datos: `/api/patients/:id/messages`, adjuntos, leídos; mensajes a varias por mail (`/api/portfolio/communications`).
- Base (paquete A): respuestas guardadas (o reusar Modelos de tipo mensaje si alcanza) y grupos para «mensaje a varias».
- Sincroniza con la paciente: el chat es el mismo de los dos lados; push al llegar un mensaje (ya existe).
- Aceptación: mensaje del panel llega a la app de la paciente con aviso, y la respuesta vuelve marcada como sin leer.

### Fase 10. Planes

- Fuente: `pl.js` (todos los planes, recetas, plantillas, equivalencias), `ia.js` (armar con IA), `pe.js` (editor «Día»).
- Datos: `/api/patients/:id/plans` (borrador, versiones, publicar, historial), `/api/models`, `/api/recipes`,
  `/api/foods` (SARA 2), `/api/nutrition/exchanges`, `/api/patients/:id/nutrition-target`, IA con tope de US$5.
- Base (paquete B): tipo de alimentación y estrategia del plan. Alternativas que elige la paciente: PR #145 (listo,
  espera la frase de Facundo para su migración).
- Sincroniza con la paciente: **nada le llega hasta publicar**. Al publicar, la paciente ve el plan nuevo con «qué
  cambió» (`meal_plan_handovers`), aviso en la app y push; lista de compras al día; con #145, ve y elige las alternativas.
- Aceptación: publicar en el panel cambia el plan en la app de la paciente; un borrador no se ve.

### Fase 11. Página pública

- Fuente: `pub.js`.
- Datos: `PanelPublicPage`, `/api/public/scheduling/*`, `/api/scheduling/settings`.
- Base (paquete B): opiniones verificadas, servicios y obras sociales en la reserva.
- Aceptación: una reserva hecha desde la página pública aparece en la Agenda.

### Fase 12. Equipo y Ajustes

- Fuente: `eq.js`, `aj.js`.
- Datos: `/api/team/*`, `/api/orgs/*`, `/api/notification-preferences`, `/api/nutrition/settings`, conexiones de agenda.
- Base (paquete C, en Opus y con revisión de seguridad): permisos por módulo y registro de quién abrió cada ficha.
- Aceptación: una persona de recepción **no puede** ver la historia clínica (prueba automática de permisos).

### Fase 13. Pantallas sin boceto y cierre

- Asistente IA, Seguimiento, Progreso, Alimentos, Biblioteca y Ayuda según lo que decida Facundo (sección 9).
- Pasada final: sin datos, nombres largos, una sola medición; teclado y lector de pantalla; celular en todas;
  recorridos de punta a punta (`npm run test:e2e`).

---

## 5. Base de datos: qué hay y qué falta

**Ya existe y está aplicado en producción** (comprobado el 24/10 contra el historial de la base): pacientes, planes
con versiones y traspasos, mediciones, cuerpo y pedidos de datos, comidas y revisiones, mensajes y adjuntos, turnos y
reservas, cobros, cuotas, débito y pago único, consultas grabadas con resumen y cierre, ficha clínica y laboratorio,
organizador de documentos, equipo e invitaciones, modelos, recetas, SARA 2, equivalencias, avisos al teléfono, auditoría.

**Escrita y sin aplicar**: `20261017030000_mfa_aal2_gate` (verificación en dos pasos, espera su frase).

**Falta** (migraciones nuevas, solo agregan, nada de DROP/DELETE; fecha posterior a la última de `main` y anotadas en
la tabla de migraciones de `docs/coordinacion-agentes.md`):

| Paquete | Para qué fase | Qué agrega |
|---|---|---|
| A · consulta y ficha | 2, 4, 6, 7, 9 | avisos leídos de la campana, grupos de pacientes, entregables «Para la paciente», firma y notas agregadas, pedidos de registro, plantillas de formularios, envíos y respuestas, certificados, lecturas de laboratorio, respuestas guardadas |
| B · servicios y plan | 8, 10, 11 | servicios, paquetes y membresías, obras sociales y copagos, opiniones, tipo de alimentación y estrategia del plan |
| C · equipo | 12 | permisos por módulo, registro de accesos a fichas |
| PR #145 | 10 | alternativas del plan que elige la paciente (ya escrito) |

Cada tabla nueva: permisos por fila (la nutri ve solo lo suyo; la paciente solo lo propio y publicado), índice para
cada clave foránea, `(select auth.uid())` en las reglas, prueba de aislamiento (`npm run test:auth-isolation`).

**Cómo se aplica**: el agente escribe la migración en el PR y le pide a Facundo su **frase exacta en negrita, que
nombre la operación y el lugar** (por ejemplo: «**aplicá el paquete A del panel en la base**»), escrita por él en
su chat. Un «ok» o un mensaje reenviado no alcanza. Primero la base, después `main`.

---

## 6. Sincronización con la app de la paciente

La app de la paciente **no cambia de diseño** (igual a Nutrigo con sus colores). Lo que se hace en el panel le tiene
que llegar así:

| Lo que hace la nutri | Lo que ve la paciente | Cómo viaja | Estado |
|---|---|---|---|
| Publica un plan | Plan nuevo con «qué cambió» y aviso | `meal_plans` y versiones, `meal_plan_handovers`, push | Ya anda |
| Aprueba alternativas | Elige entre opciones aprobadas | PR #145 | Espera la frase de la base |
| Escribe un mensaje | Chat con aviso | `messages`, push | Ya anda |
| Crea, mueve o cancela un turno | Agenda con confirmar o pedir cambio | `appointments`, rutas de confirmar y reprogramar | Ya anda |
| Pide mediciones o datos del cuerpo | Pedido en su Progreso | `patient_body_data_requests` | Existe; revisar que se vea en la app |
| Cierra la consulta con «Para la paciente» | Un solo aviso y «Para hacer» en Inicio | Paquete A + aviso en app y mail | Falta (fases 6 y 7, y etapa 2 de Nutreando) |
| Publica el resumen de la consulta | Resumen revisado | `consultation_shared_summaries` | Existe; revisar que se vea en la app |
| Indica un recurso o receta | Recursos y recetas | `resource_assignments`, `recipe_assignments` | Ya anda |
| Registra una cuota o cobro | Pantalla Pagos | `patient_fees`, `patient_charges`, pago único | Ya anda |
| Recordatorio de turno | Aviso en la app y mail | outbox y avisos; mail con Brevo | App sí; mail espera la clave de Brevo |

Reglas: **nunca WhatsApp**; mail solo cuando esté la clave de Brevo (antes, solo avisos en la app y push); nada
clínico en el texto del aviso (el aviso dice «Tenés novedades», el detalle se ve adentro de la app).
Lo que la paciente necesita y la app todavía no tiene (reservar y cancelar, cargar mediciones, comida por audio,
«Para hacer») es la etapa 2 de `docs/nutreando/plan.md` y se hace después del panel, comparando con Figma Nutrigo.

---

## 7. Estado de las fases

Actualizar al empezar y al terminar cada una.

| Fase | Qué | Dueño | Rama / PR | Estado |
|---|---|---|---|---|
| 0 | Ok al boceto v26 | Facundo | — | Espera ok |
| 1 | Herramientas al boceto nuevo | — | — | Pendiente |
| 2 | Armazón | — | — | Pendiente |
| 3 | Inicio | — | — | Pendiente |
| 4 | Pacientes | — | — | Pendiente |
| 5 | Ficha 1 (pestañas) | — | — | Pendiente |
| 6 | Ficha 2 (cerrar consulta, «Para la paciente») | — | — | Pendiente (paquete A) |
| 7 | Ficha 3 (registro, formularios, estudios) | — | — | Pendiente (paquete A; rangos esperan a Verónica) |
| 8 | Agenda y Cobranzas | — | — | Pendiente (paquete B) |
| 9 | Mensajes | — | — | Pendiente (paquete A) |
| 10 | Planes | — | — | Pendiente (paquete B y #145) |
| 11 | Página pública | — | — | Pendiente (paquete B) |
| 12 | Equipo y Ajustes | — | — | Pendiente (paquete C) |
| 13 | Pantallas sin boceto y cierre | — | — | Pendiente (decisión de Facundo) |

Las fases 3 y 4 pueden ir en paralelo con agentes distintos después de la 2; el resto, en orden.

---

## 8. Cómo se entrega cada fase

1. PR desde la rama de la fase, con: qué cambió, capturas al lado del boceto (claro y oscuro, 1440 y 390), informe de
   `npm run panel:contrato`, `npm test`, `npm run check`, informe del paso 10 de regression-guard y, si hay
   migraciones, el SQL y la frase que hay que pedirle a Facundo.
2. Para que Facundo lo vea desde el celular: la página andando o la comparación publicada como Artifact (las vistas de
   Vercel le piden login). Codex o Cursor que no pueden publicar: dejan las capturas en el PR y le piden a Claude que publique.
3. Esperar su ok. Con el ok: base primero (si hay migración y está su frase), después juntar a `main`, mirar que Vercel
   y Railway publiquen bien.
4. Una línea en la bitácora de `docs/coordinacion-agentes.md` y el estado en la sección 7 de este archivo.

---

## 9. Preguntas abiertas para Facundo

1. **Ok al boceto v26 entero** (fase 0).
2. **Pantallas que el boceto nuevo no dibuja** (Asistente IA, Seguimiento, Progreso, Alimentos, Biblioteca, Ayuda):
   ¿se dibujan en el boceto con el estilo nuevo, se juntan dentro de otras pantallas, o se quitan del menú?
   Mientras no responda, quedan como están, dentro del armazón nuevo.
3. **Quién desarrolla**: el plan sirve para Claude, Codex o Cursor. Recomendado: Claude en Opus para las fases 2, 6,
   7 y 12 (base y permisos); las demás las puede tomar cualquiera.
