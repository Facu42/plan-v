# 07 · Decisiones recomendadas (14/10/2026)
Para cada decisión abierta de los docs 01–06: la pregunta, las opciones, qué recomiendo y por qué. Ordenadas por qué conviene decidir primero: primero lo que bloquea seguridad y producción, después lo que bloquea el piloto con Vero, y al final lo que es negocio y escala. Competencia: ver `competencia-funciones.md`.

## A. Seguridad y base (esta semana)
**1. Vistas de paciente con escritura (TRD 8.2 / Esquema 10.1)**
Opciones: aprobar la migración que deja solo SELECT, o dejarlas como están.
Recomiendo: **aprobarla ya** (la frase escrita).
Por qué: hoy `anon`/`authenticated` pueden escribir en vistas de datos clínicos; la app de la paciente no lo necesita (escribe por funciones) y CI ya lo marca como error.

**2. Migraciones del repo posteriores al 10/10 (Esquema 10.2)**
Opciones: aplicarlas todas, de a una, o esperar.
Recomiendo: **de a una, empezando por las de seguridad y las ya mergeadas** (`meal_text_without_ai`, D1/D4/D7), cada una con su frase.
Por qué: hay funciones en `main` que la paciente no ve porque falta la migración; de a una se puede volver atrás si algo se rompe.

**3. ~22 tablas con RLS y sin política (Esquema 10.3)**
Opciones: dejarlas así (todo por funciones) y documentarlo, o agregar políticas explícitas de denegación.
Recomiendo: **dejarlas así y documentarlo**, con un test que falle si alguna gana una política abierta.
Por qué: RLS sin política ya niega todo; agregar políticas no suma seguridad y sí trabajo.

**4. Staging (TRD 8.3)**
Opciones: rama de Supabase (paga) o proyecto separado gratis.
Recomiendo: **proyecto Supabase separado** con migraciones y seed ficticio (`seed.ts`).
Por qué: es gratis, alcanza para un piloto de una nutri y saca las pruebas de la base real.

**5. ¿Etapa 0 y 1 bloquean todo? (Plan 2)**
Opciones: bloquean, o corren en paralelo con la fase 1.
Recomiendo: **seguridad y staging bloquean; el resto corre en paralelo**.
Por qué: lo que toca datos de pacientes va primero; lo visual no tiene por qué esperar.

**6. PRs viejos (Plan 3)**
Opciones: cerrar todos, revisar uno por uno, dejarlos.
Recomiendo: **cerrar los que no se mergean en 2 semanas, salvo #67 (indicadores), #89, #92 y #93**, que se rebasan.
Por qué: los PRs viejos confunden a los agentes y arman conflictos; esos cuatro son funciones que los dos competidores ya tienen.

**7. Monitoreo (TRD 8.4)**
Opciones: Sentry, otro APM, solo `/api/health`.
Recomiendo: **Sentry gratis con datos redactados + un monitor externo gratis (UptimeRobot o Better Stack) sobre `/api/health`**.
Por qué: con pacientes reales hay que enterarse de los errores antes que Vero, y el plan gratis alcanza.

## B. Piloto con Vero (antes de sumar pacientes)
**8. Métricas de éxito del piloto (PRD 5)**
Opciones: pacientes activos, % de comidas revisadas, retención, tiempo de armado del plan.
Recomiendo: **tres: pacientes que registran ≥3 días por semana, % de comidas revisadas en 48 h, y pacientes que siguen a los 60 días**.
Por qué: el producto le habla a la paciente; medir uso de la paciente y retención es lo que después se vende a otras nutris.

**9. Alternativas por comida (PRD 3)**
Opciones: construirlas ya, o bajar la promesa de la landing.
Recomiendo: **bajar la promesa hoy y construir una versión simple pronto**: la nutri carga 1–2 opciones por comida en el editor y la paciente elige.
Por qué: NutriDesk ya deja elegir de una lista por grupo y Nutriboost mide los reemplazos; prometer algo que no está rompe el principio de "estado explícito".

**10. Páginas del menú que no existen (PRD 4; Flujo 1)**
Opciones: mostrarlas con "próximamente", o esconderlas hasta que estén; menú de 17 ítems de una vez o de a una.
Recomiendo: **esconderlas y sumarlas de a una** cuando funcionen.
Por qué: un piloto con una sola nutri no gana nada con promesas en el menú, y el PRD pide no mostrar cosas que aparentan funcionar.

**11. Diario, Consultas, Objetivos y Compras dentro de la ficha (Flujo 2)**
Opciones: solo en la ficha, o también como páginas sueltas.
Recomiendo: **en la ficha, más la bandeja de Seguimiento para lo pendiente de todos**.
Por qué: así trabajan Nutriboost y NutriDesk (todo por paciente) y ya tenemos Seguimiento para lo multipaciente.

**12. Invitación por mail (Flujo 3) y correo transaccional (TRD 8.5)**
Opciones: seguir copiando el link a mano o mandarlo desde Plan V; proveedor Resend, Postmark o SES.
Recomiendo: **Resend con dominio propio, y mandar la invitación por mail además del link**.
Por qué: el outbox ya existe, Resend tiene plan gratis y es el más simple; destraba también D3 (avisos por correo).

**13. Paciente dada de alta (Flujo 5)**
Opciones: solo lectura, o todo sigue activo.
Recomiendo: **solo lectura** (ve su último plan, recetas e historial; no registra ni chatea).
Por qué: no deja a la paciente sin su plan, pero tampoco genera trabajo de revisión a la nutri sin cobrar.

**14. Pedido de cambio de turno (Flujo 4)**
Opciones: la nutri lo resuelve a mano, o agenda con reserva (fase 4).
Recomiendo: **a mano durante el piloto, arreglando los bugs conocidos**.
Por qué: Vero tiene pocas pacientes; la reserva online es de fase 4 y ahí NutriDesk (con seña) nos lleva ventaja igual.

**15. Chat en tiempo real (TRD 8.6)**
Opciones: Supabase Realtime o polling.
Recomiendo: **polling cada 15–30 s ahora; Realtime en la fase 6**.
Por qué: para un piloto alcanza y no suma piezas nuevas que vigilar.

**16. Diseño: panel de 3 columnas o shell Nutrigo, CSS viejo, tema oscuro (Diseño 1–3)**
Opciones: 3 columnas o shell Nutrigo; borrar o no el CSS Fraunces; mantener o no el tema oscuro.
Recomiendo: **shell Nutrigo para todo, borrar el CSS viejo cuando no quede ninguna pantalla usándolo, y sacar el tema oscuro del piloto**.
Por qué: la paleta ya está cerrada sobre Nutrigo; dos sistemas y dos temas duplican el trabajo de cada pantalla.

**17. Quién ejecuta qué (Plan 4)**
Opciones: Cursor para interfaz y Codex para datos/migraciones (plan v2), o un solo agente.
Recomiendo: **mantener la división del plan v2**, con la regla de que solo el agente de datos toca migraciones.
Por qué: separa el riesgo; las migraciones son lo único que puede romper datos reales.

## C. Producto y negocio (antes de salir a vender a otras nutris)
**18. Orden de fases (Plan 1)**
Opciones: 1→3→4→2→5→6 (IA primero) o 1→2→3→4 (clínico primero).
Recomiendo: **1→3→4→2→5→6**, pero arrancando la fase 3 por lo que ve la paciente (ánimo, objetivo, avisos) antes del asistente de la nutri.
Por qué: el target es la paciente y el asistente IA es nuestro diferencial; en antropometría y bioimpedancia NutriDesk ya es fuerte y no conviene pelear ahí primero.

**19. Presupuesto de IA (TRD 8.1)**
Opciones: solo modelos gratis con `deny`, o pagar modelos con retención cero.
Recomiendo: **tope fijo chico (por ejemplo US$20–30/mes en el piloto), modelos fijos con retención cero, sin datos personales en el prompt**.
Por qué: las fotos de comidas y la lectura de balanza son justo lo que los competidores ya hacen con IA; los modelos gratis no garantizan privacidad.

**20. Precio y modelo (PRD 1)**
Opciones: gratis con 3 pacientes + cobro por paciente activo, o prueba con fecha; precio frente a Nutriboost ($15.000/47.000/57.000) y NutriDesk ($35.000/64.800).
Recomiendo: **gratis hasta 3 pacientes y después un plan único cerca de $35.000/mes** (más "Fundadoras" con descuento de por vida).
Por qué: NutriDesk no tiene prueba gratis y es una queja visible; un plan gratis chico deja probar con pacientes reales, que es lo que vendemos.

**21. Mercado Pago (PRD 2; Esquema 10.4)**
Opciones: cada nutri conecta su cuenta o cobra Plan V; mantener `payments`/`payment_webhook_events` o usar `patient_payments`.
Recomiendo: **cada nutri conecta su propia cuenta** (Plan V no toca plata de pacientes) y **conservar las tablas de Mercado Pago para la fase 4**, enganchadas a `patient_payments`.
Por qué: el PRD ya dice que Plan V no mueve plata; cobrar nosotros nos hace agente de pago y suma impuestos y riesgo.

**22. Entidad legal, titular, AAIP y contrato de encargo (PRD 6)**
Opciones: Facu, Vero o ambos; persona o SAS.
Recomiendo: **SAS con Facu como titular de la plataforma, contrato de encargo con cada nutri (ella es la responsable de los datos de sus pacientes) y registrar la base en la AAIP**.
Por qué: Plan V guarda datos de salud de terceros; hay que tenerlo resuelto antes de sumar la segunda nutri y antes de cobrar.

**23. Bases de alimentos (PRD 7)**
Opciones: USDA, SARA 2, ArgenFoods.
Recomiendo: **SARA 2 primero (es la referencia argentina), USDA para lo que falte**, y ArgenFoods solo si la licencia lo permite por escrito.
Por qué: Nutriboost usa las tres y NutriDesk ofrece +2.000 alimentos; con el catálogo propio de hoy quedamos cortos al venderle a otras nutris.

**24. Android (TRD 8.7)**
Opciones: Capacitor o TWA.
Recomiendo: **TWA cuando haga falta push en Android**; seguir con PWA en el piloto.
Por qué: NutriDesk vende justamente "sin instalar nada" y nos va bien con la PWA; TWA reusa la misma web con mucho menos trabajo que Capacitor.
