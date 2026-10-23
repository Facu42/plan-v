# Plan: funciones de Nutreando para Plan V

Aprobado por Facundo el 23/10/2026 («si a las 3»: plan aprobado, obras sociales adentro, la etapa 0 arranca ya).
Pedido del 23/10: **todo por etapas y pasos cortos**, para que si se corta un agente (Claude sin crédito) pueda seguir
otro (Codex, Cursor) leyendo solo este archivo.

- Plan explicado para Facundo (documento): https://claude.ai/artifact/WCxGqfnemEA5joqGWELP8W
- Relevamiento del webinar de Nutreando (96 funciones, minutos y capturas): `/mnt/project-files/competencia/nutreando-vs-planv-2026-10-22.md`
  (carpeta compartida del proyecto). Video en la PC de Facundo: `C:\Users\facun\Videos\video nutreando.mp4`; pedirlo solo si hace falta.
- Método: planificador de ECC (`agents/planner.md` y `commands/plan.md` de affaan-m/everything-claude-code), leído sin instalar.

## Cómo retomar (leé esto primero)

1. Leé `AGENTS.md`, `docs/coordinacion-agentes.md` y `docs/panel-nutri-rediseno/traspaso-boceto-v3.md` (cómo se arma,
   prueba y publica el boceto).
2. Buscá en la tabla de estado el primer paso que no esté **Hecho**. Si dice **En curso**, mirá la rama anotada.
3. Al terminar un paso: cambiá su estado acá, anotá rama y commit, subí las fuentes del boceto
   (`design/panel-nutri/v3/src/`, `build.py`, `panel.html`) y sumá una línea a la bitácora de `docs/coordinacion-agentes.md`.
4. Estados: **Pendiente**, **En curso**, **Hecho**, **Espera ok** (de Facundo), **Bloqueado** (decir por qué).

## Reglas que no se discuten

- Primero la app de la nutri, después la de las pacientes.
- Toda función nueva entra primero al **boceto único** (https://claude.ai/artifact/JwXZXARtS7e6scYcpx8cKV, fuentes en
  `design/panel-nutri/v3/`). Se publica siempre al mismo link. Recién con el boceto aprobado pasa a la app, fase por fase,
  y cada fase se junta a `main` solo con el ok de Facundo.
- Antes de publicar el boceto, leer la versión publicada; si es más nueva que la tuya, traer la rama del otro agente y armar
  desde ahí. Hoy trabajan dos hilos de Claude sobre el boceto (ver reparto abajo).
- App de la paciente igual a Nutrigo, con sus colores. Lo que el archivo de Figma no dibuja se arma con sus piezas.
- Avisos a pacientes solo por la app y por mail. **Nada de WhatsApp en el panel.**
- Integraciones con claves (Brevo, Google, Mercado Pago) al final. Claves nunca por el chat.
- Nada en la base de producción sin la frase escrita de Facundo. Migraciones solo agregan (nada de DROP/DELETE).
- Carriles: no pisar ramas `codex/*`, `cursor/*`, `respaldo/*`.

## Las 26 funciones

| # | Función | Dónde va (pantalla del boceto) | Etapa |
| --- | --- | --- | --- |
| 1 | Lista «Para la paciente» al terminar la consulta (plan, devolución, material, registro, formulario, certificado, cobro, próximo turno); un solo aviso a la paciente | Ficha → Consultas y notas | 0 y 1 |
| 2 | Cerrar y firmar la consulta con matrícula (después, solo notas agregadas con fecha) + historial de quién cambió cada parte de la historia clínica | Ficha → Consultas y notas, Historia clínica | 0 y 1 |
| 3 | Registro de quién abrió cada ficha | Equipo / Ajustes → Seguridad, y en la ficha | 0 y 1 |
| 4 | Pedir registro alimentario: días, inicio, comidas, qué ve y qué carga la paciente, modo sin números (TCA) | Ficha → Registro alimentario | 0 y 1 |
| 5 | Formularios propios: plantillas, completar en consulta, enviar ahora o programado, formulario previo al turno | Ajustes (plantillas); Ficha → Historia clínica | 0 y 1 |
| 6 | Certificados con firma, matrícula y marca | Ajustes (plantillas); Ficha → Archivos | 0 y 1 |
| 7 | Campana de avisos en todas las pantallas + «Consulta en curso, retomar» | Encabezado de cada pantalla y menú lateral | 0 y 1 |
| 8 | Cumpleaños | Inicio → Pendientes, filtro «Felicitar» | 0 y 1 |
| 9 | Grupos de pacientes | Pacientes (filtro); Mensajes → mensaje a varias | 0 y 1 |
| 10 | Laboratorio leído por IA, comparado con el anterior, lectura en borrador con la ficha | Ficha → Laboratorio y estudios | 0 y 1 |
| 11 | Informe de balanza leído por IA (InBody, Tanita, Omron), confirmando cada valor | Ficha → Mediciones | 0 y 1 |
| 12 | Rangos y avisos en indicadores (cintura/talla, valor mal cargado) | Ficha → Resumen y Mediciones | 0 y 1 |
| 13 | Tipo de alimentación y estrategia del plan, respetados por la IA | Planes; Ficha → Plan (Requerimiento) | 0 y 1 |
| 14 | Servicios: consulta, paquete, membresía; precio, duración, quién reserva, instrucciones previas, descuento por medio de pago, reglas para cancelar | Página pública; Ajustes → Agenda | 0 y 1 |
| 15 | Obras sociales y copagos + planilla por obra social para facturar | Ajustes, Agenda, Cobranzas, Página pública | 0 y 1 |
| 16 | Links para compartir y QR | Página pública | 0 y 1 |
| 17 | Página pública completa + opiniones verificadas pedidas después del turno | Página pública | 0 y 1 |
| 18 | Permisos por módulo para cada persona del equipo | Equipo | 0 y 1 |
| 19 | App: «Para hacer» (formularios, documentos, certificados, registro pedido «1 de 7 días») | App paciente → Inicio | 2 |
| 20 | App: reservar, cambiar y cancelar turnos según reglas | App paciente → Agenda | 2 |
| 21 | App: cargar mediciones que la nutri habilita | App paciente → Progreso | 2 |
| 22 | App: registrar comida con un audio | App paciente → Diario | 2 |
| 23 | Confirmación y recordatorio de turno por app y mail, con «Confirmo / Necesito cambiar» en la agenda; reglas de regreso | Agenda, Ajustes | 3 |
| 24 | Google Calendar y Meet automático | Agenda, Ajustes → Integraciones | 3 |
| 25 | Seña con Mercado Pago y turno liberado si no paga | Agenda, Cobranzas, Página pública | 3 |
| 26 | Asistente en el chat para la paciente (solo lo publicado, deriva lo clínico) | Mensajes | 4 |

Fuera del plan (decidido): todo lo de WhatsApp, directorio de nutris, tienda, comunidad y academia con videos, DNI como llave
y paciente en varios consultorios, Open Food Facts, PayPal/Stripe. App de iPhone queda en el plan de tiendas.

## Estado por paso

### Etapa 0: dibujarlo en el boceto (sin app, sin base)

Reparto acordado con el hilo «Rediseño del panel de la nutri» (23/10): **este hilo** hace 0.1 a 0.4; **el hilo del panel**
hace 0.5 a 0.8 cuando Facundo le diga «seguí». Las piezas nuevas de este hilo van en `design/panel-nutri/v3/src/nt.js`
y `nt.css`, con ganchos mínimos en `build.py`.

| Paso | Qué | Funciones | Quién | Estado | Rama / commit |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Campana en todas las pantallas, «Consulta en curso» en el menú, cumpleaños en Inicio, grupos en Pacientes y en «Mensaje a varias» | 7, 8, 9 | Claude (hilo Nutreando) | En curso | `claude/project-thread-he8mny` |
| 0.2 | Ficha: lista «Para la paciente» + cerrar y firmar + notas agregadas; historial y accesos; pedir registro; formularios; certificados; laboratorio con IA; balanza con IA; aviso de valor mal cargado | 1, 2, 3 (vista en ficha), 4, 5, 6, 10, 11, 12 | Claude (hilo Nutreando) | Pendiente | |
| 0.3 | Planes y Ficha → Plan: tipo de alimentación y estrategia | 13 | Claude (hilo Nutreando) | Pendiente | |
| 0.4 | Probar (acts, mact, pact y medidas 1440×900 en claro y oscuro), mirar capturas, publicar al mismo link, subir fuentes | — | Claude (hilo Nutreando) | Pendiente | |
| 0.5 | Página pública: servicios, obras sociales en la reserva, links y QR, perfil completo, opiniones | 14, 15, 16, 17 | Hilo del panel | Pendiente | |
| 0.6 | Equipo: permisos por módulo, registro de accesos | 3, 18 | Hilo del panel | Pendiente | |
| 0.7 | Ajustes: plantillas de formularios y certificados, obras sociales, reglas de reserva, seguridad, avisos automáticos (con reglas de regreso); planilla por obra social en Cobranzas | 5, 6, 14, 15, 23 | Hilo del panel | Pendiente | |
| 0.8 | Celular (390) de todo el boceto | todas | Hilo del panel | Pendiente | |
| 0.9 | Ok de Facundo al boceto completo | — | Facundo | Espera ok | |

Ya resuelto: el recordatorio de cuota de Cobranzas decía «por WhatsApp»; `build.py` ya lo reemplaza por «a su app».

Cómo comprobar la etapa 0: `python3 design/panel-nutri/v3/build.py` y las pruebas de `design/panel-nutri/v3/tests/`
(ver sección 6.3 del traspaso del boceto). Todas terminan con `errors []`; ningún botón nuevo queda muerto; nada obliga a bajar
la página en 1440×900.

### Etapa 1: app de la nutri

Se pasa el boceto a la app con el método de `docs/panel-nutri-rediseno/instrucciones-boceto.md` (HTML y estilos tal cual,
solo se conectan datos reales). Cada fase es un PR con `npm test`, `npm run check`, `npm run panel:contrato` en verde y el ok
de Facundo para juntar. La base va en tres paquetes de migraciones (fechas nuevas, solo agregan), cada uno con su frase.

| Paso | Fase de la app | Funciones nuevas | Base | Estado |
| --- | --- | --- | --- | --- |
| 1.1 | Armazón (rehacer fase A con el boceto v3) | 7 | Paquete A: avisos leídos | Pendiente |
| 1.2 | Inicio | 8 (la fecha de nacimiento ya existe: `birth_date`) | No | Pendiente |
| 1.3 | Pacientes | 9 | Paquete A: grupos | Pendiente |
| 1.4 | Ficha, parte 1: consulta | 1, 2 | Paquete A: entregables, firma, notas agregadas | Pendiente |
| 1.5 | Ficha, parte 2: registro y formularios | 4, 5 | Paquete A: pedidos de registro, plantillas, envíos y respuestas | Pendiente |
| 1.6 | Ficha, parte 3: estudios y documentos | 6, 10, 11, 12 | Paquete A: certificados, lecturas de laboratorio | Pendiente (rangos esperan validación clínica de Verónica) |
| 1.7 | Agenda y Cobranzas | 14, 15 | Paquete B: servicios, obras sociales, precios | Pendiente |
| 1.8 | Mensajes | 9 en mensaje a varias | No | Pendiente |
| 1.9 | Planes | 13 | Paquete B: dos datos del plan | Pendiente |
| 1.10 | Página pública | 14, 16, 17 | Paquete B: opiniones | Pendiente |
| 1.11 | Equipo y Ajustes | 3, 18, plantillas de 5 y 6 | Paquete C: permisos y registro de accesos (revisar con cuidado, en Opus) | Pendiente |

Paquetes de base (pedir la frase exacta de Facundo en negrita, nombrando operación y lugar, antes de aplicar; base primero,
main después): A = consulta y ficha; B = servicios, obras sociales, opiniones y plan; C = equipo.

### Etapa 2: app de la paciente

| Paso | Qué | Funciones | Depende de | Estado |
| --- | --- | --- | --- | --- |
| 2.1 | «Para hacer» en Inicio | 19 | 1.5, 1.6 | Pendiente |
| 2.2 | Turnos: reservar, cambiar, cancelar | 20 | 1.7 | Pendiente |
| 2.3 | Mediciones habilitadas | 21 | 1.6 | Pendiente |
| 2.4 | Comida por audio (ya se transcribe con Groq) | 22 | — | Pendiente |

Cómo comprobar: `npm run local` y `node --import tsx scripts/nutrigo-compare.mjs [pantalla]`, imagen lado a lado.

### Etapa 3: con claves (al final)

| Paso | Qué | Funciones | Necesita | Estado |
| --- | --- | --- | --- | --- |
| 3.1 | Confirmación y recordatorios por app y mail; reglas de regreso | 23 | Clave de Brevo | Pendiente |
| 3.2 | Google Calendar y Meet | 24 | Cuenta de Google de prueba, después la de Facundo | Pendiente |
| 3.3 | Seña con Mercado Pago y liberar turno | 25 | Modo de prueba de MP; se apoya en las suscripciones de Cursor (#155 a #157) | Pendiente |

El código de agenda pública, Google y Mercado Pago ya está en `main` y apagado (pila de Codex, #136). Anotar en
`docs/coordinacion-agentes.md` antes de prenderlo.

### Etapa 4: asistente en el chat

| Paso | Qué | Estado |
| --- | --- | --- |
| 4.1 | Asistente para la paciente: solo lo publicado, cita la fuente, deriva lo clínico, resumen para la nutri; tope de US$5/mes | Pendiente (antes, Verónica lo prueba con preguntas que debe derivar) |

## Riesgos

| Riesgo | Cuidado |
| --- | --- |
| Dos agentes publican el boceto a la vez | Leer la versión publicada antes de publicar; traer la rama del otro |
| Permisos mal hechos muestran fichas | Paquete C aparte, pruebas de que recepción no ve historia clínica |
| La IA lee mal un estudio | Cada valor se confirma; la lectura es borrador privado |
| Rangos clínicos equivocados | No se prenden sin validación de Verónica |
| Se cuela WhatsApp | Revisar textos en cada paso |

## Bitácora

- 23/10 · Claude (hilo Nutreando) · Plan aprobado. Este archivo creado. Arranca 0.1 en `claude/project-thread-he8mny`.
