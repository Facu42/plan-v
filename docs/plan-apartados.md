# Plan por apartados (2026-09-28)

Pedido de Facundo del 2026-09-28: usar los agentes de
[agency-agents](https://github.com/msitarzewski/agency-agents) para desarrollar ordenadamente
todo lo que le falta a Plan V. Sus sugerencias: app móvil, seguridad, diseño y experiencia
(movimiento de los elementos), autenticación, base de datos y marketing. Se sumaron dos
apartados que también hacen falta para salir al mercado: lo legal y la calidad en producción.

- Los agentes están en `.claude/agents/` (41 de unos 200; el resto no aplica a esta app).
- Reglas que valen para todos: `docs/agentes/reglas-plan-v.md`.
- Este plan **no repite** el plan de 7 pasos de `docs/registro-producto-listo.md` (prueba real,
  trabajo de la PC, mails reales, cobro, ramas viejas, backlog visual del 27/09, pendientes
  chicos). Eso sigue en el hilo "Plan V listo para el mercado". Acá solo se anota qué agentes le
  sirven a ese hilo (ver "Lo que ya tiene dueño").

## Orden

| Ola | Apartado | Puede arrancar | Depende de |
| --- | --- | --- | --- |
| 1 | A. Seguridad y privacidad | Ya | Nada |
| 1 | B. Diseño, experiencia y movimiento | Ya | Nada |
| 1 | C. Marketing: estrategia y contenido | Ya | Nada (el precio se suma después) |
| 2 | D. Autenticación e ingreso | Cuando A termine su revisión | A |
| 2 | E. Base de datos | Cuando A cierre sus cambios en la base | A |
| 3 | F. App móvil (tiendas) | Cuando D esté hecho | D, B |
| 3 | G. Calidad en producción | Cuando haya menos cambios grandes en curso | A, D, E |
| 3 | H. Marketing: publicidad paga y página pública | Cuando haya precio y el cobro ande | C, cobro (otro hilo) |

Por qué este orden: la app ya está publicada y guarda datos de salud, así que la seguridad va
primero. Diseño y marketing no tocan lo mismo que seguridad y pueden correr a la vez.
Autenticación y base de datos tocan los mismos archivos que seguridad, por eso esperan.
La app para tiendas necesita el ingreso terminado (las tiendas exigen ciertas formas de entrar).

## Lo que ya tiene dueño (hilo "Plan V listo para el mercado")

| Paso de ese plan | Agentes que le sirven |
| --- | --- |
| 1. Prueba real de punta a punta | `reality-checker`, `api-tester` |
| 3. Mails reales | `email-strategist` (textos), `backend-architect` |
| 4. Cobro a la nutricionista | `payments-billing-engineer` |
| 6. Backlog visual del 27/09 | `ui-designer`, `ui-finish-gate-reviewer` |
| Soporte a usuarias | `support-responder` |

---

## A. Seguridad y privacidad

- **Navegador publicado 2026-10-01:** par ficticio autenticado probado. Regresión
  del PR #43 por opciones de vistas distintas en producción corregida con
  `20261001222659`, ya aplicada. Ficha recuperada, notas privadas cerradas, vistas
  solo de lectura, recarga y cambio de roles comprobados; nota QA retirada.
  1113 pruebas generales y 16 de sesiones aprobadas. Dos avisos de vistas con
  permisos del propietario documentados; sin recursos de Supabase nuevos.
  Ver [resultado, corrección y límites](prueba-navegador-produccion-2026-10-01.md).

- **Sesiones firmadas 2026-10-01, punto 4:** cuatro cuentas ficticias en Supabase
  temporal dentro de GitHub. Se confirmó una política legacy que exponía notas
  profesionales a la propia paciente por la API de datos. Cierre aplicado como
  `20261001195127`, con permiso profesional y vistas conservados en el catálogo.
  Antes: 14 casos aprobados y 1 fallido;
  después: 16 aprobados sin omisiones. Suite general: 1111 aprobadas y 2 omitidas.
  No se contrataron recursos de Supabase. Ver [prueba y límites](sesiones-aislamiento-2026-10-01.md).

- **Clasificación 2026-10-01, punto 3:** las 16 tablas sin políticas están cerradas
  al acceso directo de visitantes y usuarias, también por columnas; no hay vistas
  que las expongan. Se mantienen internas, con las funciones autorizadas como
  entrada. Dos tablas son reservas sin integración activa (eventos externos de pago
  y tareas persistentes). 38 pruebas locales nuevas aprobadas. Sin cambios en
  producción ni recursos contratados. Ver [clasificación y límites](clasificacion-tablas-internas-2026-10-01.md).

- **Correcciones aplicadas 2026-10-01, punto 2:** cierre de lecturas/escrituras
  corporales y metas tras el retiro; validación y recálculo de metas en la base;
  corrección de meses pagados y vencimientos existentes. Dos migraciones aplicadas
  en `plan-v-app`, con autorización escrita y sin contratar recursos. 1071 pruebas
  generales aprobadas y 47 con las definiciones reales reproducidas localmente.
  Siguen cerradas las 34 internas; permanecen 116 advertencias esperadas de función
  ejecutable y 16 avisos de tablas, clasificados después en el punto 3. Ver
  [correcciones aplicadas](correcciones-funciones-sensibles-2026-10-01.md).

- **Revisión de funciones 2026-10-01, posterior al PR #40:** las 116 permitidas
  coinciden con la base y las 34 internas siguen cerradas. Se confirmaron tres
  pendientes: datos corporales/metas tras desactivar, metas vacías por llamada
  directa y migración del vencimiento por meses sin aplicar. Auditoría y pruebas
  sin escribir producción ni contratar recursos. Detalle e inventario en
  [revisión de funciones sensibles](revision-funciones-sensibles-2026-10-01.md).

- **Avance 2026-10-01:** migración de permiso separado de IA aplicada, cabeceras,
  límites, dependencias y revisión de secretos preparados y verificados. Configuración
  sobre los servicios existentes, sin contratar recursos de Supabase. Evidencia y
  avisos restantes en [despliegue de seguridad](despliegue-seguridad-2026-10-01.md).

- **Lidera:** `appsec-engineer`. **Apoyo:** `secrets-credential-engineer`, `privacy-engineer`,
  `penetration-tester`, `legal-compliance-checker`.
- **Qué hay hoy:** permisos por rol en la API, reglas de acceso por fila en la base (RLS),
  límite de pedidos por minuto, revisión de secretos (`npm run check:secrets`).
- **Qué falta (revisado el 2026-09-28 con el asesor de seguridad de Supabase):**
  1. 129 avisos: funciones de la base que cualquier usuaria con sesión puede ejecutar con
     permisos elevados. Revisar una por una y cerrar las que no deban ser públicas.
  2. La protección contra contraseñas filtradas está apagada (es un ajuste de Supabase).
  3. 12 tablas con acceso por fila activo y sin reglas: confirmar que son solo del servidor.
  4. Cabeceras de seguridad de la web y de la API (qué sitios pueden cargarla, etc.).
  5. Prueba de intrusión sobre la app publicada con dos cuentas (paciente y nutricionista):
     que ninguna vea datos de otra.
  6. Lo legal: la ley argentina 25.326 trata los datos de salud como sensibles. Faltan
     términos y condiciones, política de privacidad, consentimiento al registrarse, y poder
     descargar y borrar la propia cuenta.
- **Necesita de Facundo:** OK escrito para cambiar ajustes de producción (punto 2 y los cambios
  de la base); datos del responsable de los datos para la política de privacidad (nombre o
  razón social, CUIT, domicilio, mail de contacto).
- **Terminado cuando:** asesor de Supabase sin advertencias de seguridad o con cada una
  justificada, prueba con dos cuentas sin fugas, páginas legales publicadas y enlazadas en el
  registro.

## B. Diseño, experiencia y movimiento

- **Correcciones de IA (2026-10-02):** configuración, tareas con reserva y contexto
  vigente, edición de recetas sin duplicados, publicación de la copia revisada y
  reintento de foto sin republicar. Preparadas dos migraciones; producción y
  configuración del proveedor pendientes de autorización. Pruebas y alcance en
  [correcciones de IA](correcciones-ia-2026-10-02.md), [PR #50](https://github.com/Facu42/plan-v/pull/50).
  1.144 pruebas generales y 18 de sesiones/concurrencia aprobadas en GitHub;
  navegador local ficticio 1440/390 y controles aprobados.

- **Comprobación de IA, calorías y onboarding (2026-10-02):** 86 pruebas focalizadas
  aprobadas, con bloqueo de configuración IA y pérdida de meta al guardar borrador
  reproducidos sin proveedores. Propuesta de onboarding paciente/profesional generada
  con la API de Higgsfield indicada por Facundo; aprobada («Sí, aplicalo») e implementada
  para paciente y nutricionista: cinco etapas, revisión completa, recuperación legacy,
  foto optimizada y accesos reales. 1.116 pruebas aprobadas, TypeScript/build y recorridos
  1440/390 claros/oscuros comprobados; captura/informe `design-qa.md`.
  Integración/publicación registrada en [PR #49](https://github.com/Facu42/plan-v/pull/49).
  Registro: [comprobación y propuesta](verificacion-ia-calorias-onboarding-2026-10-02.md).

- **Corrección de Figma y accesos del CRM (2026-10-01):** código/capturas de 24 nodos
  obtenidos por MCP. Ampliado el 2026-10-02: frontend de las doce pantallas del paciente,
  sus móviles/detalles conectado a datos reales; 81 SVG originales locales. Accesos
  a Pacientes, Ficha y Plan con selección conservada; recorridos 1440/390, porciones,
  ordenamiento y guardado protegido comprobados; 1.114 pruebas aprobadas.
  [PR #46](https://github.com/Facu42/plan-v/pull/46) integrado y publicado el 2026-10-02;
  web, API y worker confirmados para el commit `6a2d292`, CI y sesiones aprobados.
  Registro: [Figma y consultorio funcional](figma-crm-funcional-2026-10-01.md).

- **Lidera:** `ux-architect`. **Apoyo:** `ui-designer`, `whimsy-injector` (movimiento),
  `accessibility-auditor`, `ui-finish-gate-reviewer`.
- **Qué hay hoy:** las trece pantallas del archivo en escritorio y móvil, más las pantallas
  propias de Plan V armadas con los mismos componentes. Casi no hay movimiento (23 transiciones
  sueltas en todo el CSS).
- **Qué falta:**
  1. Movimiento de los elementos. Primero leer si el archivo trae animaciones
     (`get_motion_context` del conector de Figma). Si no las trae, default: transiciones cortas
     (150 a 250 milisegundos) al pasar el mouse, al abrir paneles y cajón, al cambiar de
     pantalla y al aparecer tarjetas; nada que distraiga; y se apagan si el teléfono tiene
     activado "reducir movimiento".
  2. Estados que el archivo no dibuja: cargando, vacío, error, sin conexión. Mismo estilo.
  3. Recorrido de primer uso de la nutricionista y de la paciente (qué ve la primera vez).
  4. Accesibilidad: contraste, uso con teclado, tamaños táctiles en móvil.
- **No toca:** el backlog visual de la auditoría del 27/09 (es del otro hilo).
- **Necesita de Facundo:** nada para empezar. Mirar el resultado en la vista previa y decir si
  el movimiento le gusta.
- **Terminado cuando:** todas las pantallas tienen movimiento y estados, revisadas en 1440 y
  390 con capturas, y la revisión de accesibilidad sin errores graves.

## C. Marketing: estrategia y contenido

- **Lidera:** `social-media-strategist`. **Apoyo:** `brand-guardian`, `content-creator`,
  `instagram-curator`, `tiktok-strategist`, `short-video-editing-coach`,
  `legal-compliance-checker`, `growth-hacker`.
- **Qué hay hoy:** marca "Plan V — Verónica Trenti", cuenta `@planv.nutricion`, paleta y
  tipografía en `marca/brand_kit.json`. No hay plan de contenidos ni piezas.
- **Qué falta:**
  1. Definir a quién se le habla: la nutricionista es quien paga; las pacientes llegan
     invitadas. Mensaje principal y diferencial frente a otras apps.
  2. Calendario de un mes de publicaciones (posts, carruseles, historias) con los textos.
  3. Guiones de videos cortos (reels y TikTok) y los primeros videos. El proyecto tiene el
     conector de Higgsfield para generar imágenes y video.
  4. Revisión de salud con la ley argentina: sin promesas de resultados ni afirmaciones médicas.
- **Necesita de Facundo:** confirmar que la marca que se vende es "Plan V" con Verónica como
  cara; acceso o permiso para publicar en la cuenta (nada se publica sin su OK).
- **Terminado cuando:** hay estrategia escrita, calendario del primer mes y un lote de piezas
  listas para que Facundo las apruebe.

## D. Autenticación e ingreso

- **Lidera:** `identity-access-engineer`. **Apoyo:** `appsec-engineer`, `ui-designer`.
- **Qué hay hoy:** entrar con mail y contraseña, registrarse (paciente o "Soy nutricionista"),
  recuperar contraseña, invitación de paciente por enlace.
- **Qué falta:**
  1. Entrar con Google. Default: Google sí; Apple se suma solo cuando se publique en la tienda
     de iPhone (Apple lo exige si hay Google).
  2. Confirmación de mail y recuperación de contraseña con remitente propio (usa los mails
     reales del otro hilo; si todavía no están, se deja listo para enchufar).
  3. Límite de intentos fallidos y aviso de ingreso desde un equipo nuevo.
  4. "Cerrar sesión en todos los equipos" y cambiar contraseña desde el perfil.
  5. Pantallas de ingreso con los componentes del archivo.
- **Necesita de Facundo:** crear las credenciales de Google para el ingreso (el hilo le dará los
  pasos exactos) y el OK para activarlo en producción.
- **Terminado cuando:** una cuenta nueva entra con Google y con mail en la app publicada, y la
  prueba de intrusión de A se repite sin fugas.

## E. Base de datos

- **Lidera:** `database-reliability-engineer`. **Apoyo:** `database-optimizer`, `sre`.
- **Qué hay hoy:** 29 migraciones aplicadas, scripts de copia y restauración
  (`npm run backup`, `npm run restore`), pero no encontré que corran solos.
- **Qué falta:**
  1. Copias de seguridad automáticas y una prueba real de restaurar en una base aparte.
  2. Revisar el plan de Supabase: el gratuito se pausa por inactividad y no guarda copias
     diarias. Default recomendado: plan Pro antes de tener clientes pagos.
  3. Rendimiento: índices y consultas lentas (asesor de rendimiento de Supabase).
  4. Una base de pruebas separada de producción para que los hilos prueben sin riesgo.
- **No toca:** mover las fotos de recetas a Storage (es del otro hilo, paso 7).
- **Necesita de Facundo:** decidir el plan pago de Supabase; OK escrito para cada cambio en
  la base de producción.
- **Terminado cuando:** hay copia diaria automática, una restauración probada y anotada, y el
  asesor de rendimiento sin advertencias importantes.

## F. App móvil (tiendas)

- **Lidera:** `mobile-app-builder`. **Apoyo:** `mobile-release-engineer`,
  `app-store-optimizer`, `ui-designer`.
- **Qué hay hoy:** la web ya se puede instalar en el teléfono como app (tiene ícono, pantalla
  sin conexión, aviso de instalación y de versión nueva). El diseño móvil 390 está hecho.
- **Qué falta:**
  1. Default: no se reescribe la app. Se empaqueta la misma web como app de tienda
     (con Capacitor), así cada cambio sirve para web y teléfono.
  2. Notificaciones al teléfono (mensaje nuevo, recordatorio de comida, turno). Hoy no hay.
  3. Cámara para foto de comida y ajustes propios del teléfono (botón atrás, teclado).
  4. Fichas de tienda: nombre, descripción, capturas, ícono, política de privacidad (sale de A).
  5. Publicar primero en Android (más rápido y barato); iPhone después.
- **Necesita de Facundo:** cuenta de desarrollador de Google Play (pago único de 25 dólares);
  para iPhone, cuenta de Apple (99 dólares por año) cuando se decida.
- **Terminado cuando:** la app está aprobada en Google Play y una paciente real la usa desde ahí.

## G. Calidad en producción

- **Lidera:** `sre`. **Apoyo:** `test-automation-engineer`, `api-tester`,
  `performance-benchmarker`, `reality-checker`, `analytics-reporter`.
- **Qué hay hoy:** 884 pruebas automáticas, revisión en GitHub en cada cambio, alertas y
  registros básicos en el servidor.
- **Qué falta:**
  1. Pruebas de recorrido completo en navegador (paciente y nutricionista) que corran solas en
     cada cambio.
  2. Aviso inmediato cuando algo falla en la app publicada, con el detalle del error.
  3. Medir velocidad de carga en teléfono y bajarla si hace falta.
  4. Medición de uso sin datos de salud: cuántas nutricionistas se registran, cuántas activan
     pacientes, cuántas pagan.
- **Necesita de Facundo:** nada para empezar; si se elige una herramienta de errores externa,
  crear la cuenta (hay opciones gratuitas).
- **Terminado cuando:** los recorridos corren solos, llega un aviso de prueba ante un error, y
  hay un tablero simple con los números de uso.

## H. Marketing: publicidad paga y página pública

- **Lidera:** `growth-hacker`. **Apoyo:** `seo-specialist`, `paid-media-paid-social-strategist`,
  `paid-media-creative-strategist`, `paid-media-tracking-specialist`, `email-strategist`,
  `legal-compliance-checker`.
- **Qué hay hoy:** no hay página pública que explique Plan V ni precios; se entra directo al
  ingreso.
- **Qué falta:**
  1. Página pública de presentación con precios y botón "Probar gratis", en español y bien
     ubicada en Google.
  2. Medición de publicidad (qué anuncio trae registros) respetando la privacidad.
  3. Campañas en Instagram y Facebook dirigidas a nutricionistas, con las piezas de C.
  4. Mails de bienvenida y seguimiento de la prueba gratis.
- **Necesita de Facundo:** precio y duración de la prueba (decisión del otro hilo, paso 4),
  presupuesto mensual de publicidad, acceso a la cuenta publicitaria de Meta.
- **Terminado cuando:** la página está publicada, una campaña chica corre con medición y se ve
  cuántos registros trae.

---

## Registro

| Fecha | Apartado | Qué se hizo |
| --- | --- | --- |
| 2026-09-28 | Organización | Se trajeron 43 agentes a `.claude/agents/`, se escribieron las reglas y este plan. Revisión de seguridad de Supabase leída (129 + 1 advertencias, 12 avisos). |
| 2026-09-28 | Organización | Se sacaron dos agentes que no aplican: `healthcare-marketing-compliance` (trata la ley de publicidad de China) y `senior-developer` (es para Laravel, otra tecnología). La revisión de salud en marketing la hace `legal-compliance-checker` con la ley argentina. Quedan 41. |
| 2026-09-29 | A. Seguridad | Cerradas 34 funciones internas de la base que quedaban abiertas (fuga comprobada), cabeceras de seguridad en web y API, historial de invitaciones arreglado. Términos, privacidad y consentimiento completos con los datos de la responsable; "Tus datos" para la paciente. Detalle en `docs/seguridad-privacidad.md`. |
