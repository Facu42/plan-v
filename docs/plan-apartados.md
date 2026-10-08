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

## Consultorio y paciente — 5/10/2026

Implementación del plan aprobado por Facundo, desde la versión principal vigente y en copia aislada. Entregas encadenadas por apartado: backend, consultorio, planes e IA, y paciente Nutrigo.

- [Bandeja y biblioteca: alcance, comprobaciones y migración preparada](consultorio-backend-2026-10-05.md).
- [Consultorio: ficha, seguimiento, biblioteca y cobranzas](consultorio-interfaz-2026-10-05.md).
- [Planes y aprobación de IA](consultorio-planes-2026-10-05.md).
- [Paciente Nutrigo: doce superficies, fuentes y evidencia](paciente-nutrigo-2026-10-05.md). Producción requiere autorización escrita específica.

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

- **Modelos gratuitos (2026-10-02):** Facundo recordó el acuerdo de no usar modelos pagos.
  Corregido el predeterminado de texto a `openrouter/free`, bloqueo de alternativas pagas
  y precios máximos cero en cada petición. Fotos pagas bloqueadas también con clave.
  Sin cambios de base/configuración ni contrataciones. Pruebas/revisiones y límites en
  [IA gratuita](ia-gratuita-2026-10-02.md), [PR #53](https://github.com/Facu42/plan-v/pull/53);
  calorías e imágenes siguen pendientes.

- **Correcciones de IA (2026-10-02):** configuración, tareas con reserva y contexto
  vigente, edición de recetas sin duplicados, publicación de la copia revisada y
  reintento de foto sin republicar. Dos migraciones aplicadas y PR #50 publicado
  con autorización escrita de Facundo; configuración del proveedor de imágenes
  aún pendiente. Permisos, health/ready y ambos roles ficticios comprobados en
  producción, sin llamadas pagas ni recursos de Supabase nuevos. Pruebas y alcance en
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

### Modelos: aplicación de planes e historial (2026-10-07)

Contraste previo del video Nutriboost 7:11 y 7:21: botón en modelos publicados, sin demostrar el recorrido de aplicación. Implementado el recorrido elegido por Facundo: paciente/fecha, comparación, confirmación y nuevo borrador conservando versiones anteriores; la copia publicada del paciente sigue vigente. Historial profesional de sólo lectura. Se aplica la copia publicada del modelo, aunque tenga una edición posterior en borrador. Sin ajuste automático ni publicación automática. Prueba ficticia: nuevo plan 50 g frente historial anterior 40 g; edición 55 g del modelo queda fuera. Suite general 1522 aprobadas/2 omitidas, más 2 adicionales de fechas/comparación; tipos, compilación, migraciones y revisión aprobados. [Evidencia y próximos pasos](modelos-dashboard-web-2026-10-07.md). Recomendaciones y Alimentos a evitar al documento quedan para el siguiente incremento. Migración local preparada, sin producción; web solamente, Academy/mobile excluidos.

| Fecha | Apartado | Qué se hizo |
| --- | --- | --- |
| 2026-10-07 | Pantallas de la paciente iguales a Nutrigo | Las diez pantallas dejan de ocultar o vaciar bloques del archivo: gráficos, listas y tarjetas originales con datos reales. Comparador píxel por píxel contra los 20 frames (Agenda 3871→1050 px, Compras 3296→1421 px; el archivo mide 1048 y 1412). Pasos del día de punta a punta (migración **aplicada en producción** con la frase escrita de Facundo, sin avisos de seguridad nuevos). Demo completa. ECC selectivo. 1.443 pruebas, tipos y compilación en verde. Publicado por [PR #68](https://github.com/Facu42/plan-v/pull/68) (`03a6aeb`). [Registro y pendientes](nutrigo-igual-al-archivo-2026-10-07.md). |
| 2026-10-07 | Auditoría de la demo | Demo con datos cargados al iniciar; 368 controles probados en 1440 y 390 sin hallazgos; arreglos: diálogo «Mis registros», pantallas de entrada y errores en español, aviso de cuota en el banner, 400 del ingreso. Estado real de las fotos con Cloudflare (aún 0 en producción) y registro del motivo de fallo. Segunda ronda: Agenda solo de citas, barra superior fluida, movimiento en Inicio, medidor de peso y menú con el código original del archivo. [Detalle](auditoria-demo-2026-10-07.md). |
| 2026-10-07 | Código original y datos variables | Medidores de peso y calorías con los SVG originales del archivo (leídos con `get_design_context`), adaptados al dato. Auditoría por pantallas de qué se reemplaza del código original y de la variabilidad de datos (vacío, 0, muchos, textos largos, NaN, zona horaria de Argentina, fotos inseguras): barras de macros que no se dibujaban, rótulos desbordados, día argentino en Inicio/Progreso, fotos de platos solo https, paginación de Ejercicio en celular, entre otros. 1.810 pruebas. [Detalle y decisiones pendientes](auditoria-codigo-original-2026-10-07.md). |
| 2026-10-08 | Fotos de ingredientes | Catálogo `ingredient_covers` con las mismas reglas de las fotos de platos (modelo fijo, plan gratuito, solo el nombre del ingrediente viaja a Cloudflare, solo vocabulario conocido, tope diario repartido con los platos). Migración `20261008120000_ingredient_covers.sql` probada en local y **aplicada en producción el 2026-10-08** con la frase escrita de Facundo; el aislamiento editorial (`20261005224500`) se aplicó el mismo día. Revisión de seguridad hecha y cerrada. Adjuntos del chat con las filas originales del archivo y nota de IA fuera del marco quitada. [Detalle](fotos-menu-cloudflare-2026-10-06.md). |
| 2026-10-06 | Fotos del menú aprobado | Cloudflare Workers Free conectado localmente: cuatro fotos reales generadas, manual conservada, cinco platos compartidos en 28 comidas. Cola por versión y aprobación, reintentos y prioridad manual; Menú, Inicio y Plan usan fotos persistidas. Reinicio comprobado. Migración y configuración de producción preparadas, sin aplicar. [Guía, evidencia y límites](fotos-menu-cloudflare-2026-10-06.md). |
| 2026-10-06 | Simulación de consultorio y paciente | Datos ficticios cargados y conservados: ficha, plan de 28 comidas, mensajes/adjuntos, seguimiento, agenda, recursos, compras, ejercicio y cobranzas. Correcciones de IA, bandeja, duplicación, teclado y tarjetas de Inicio. Reinicio comprobado con 14 respuestas y 4 archivos; 46 vistas más comprobación final de Inicio. 1.402 pruebas generales y 27 de sesiones firmadas en GitHub; auditoría de dependencias sin vulnerabilidades. [Guía, evidencia y límites](simulacion-consultorio-2026-10-06.md). |
| 2026-10-06 | Coherencia visual Nutrigo | Revisión de paciente y consultorio en 1440/390, colores y proporciones contra las fuentes; correcciones de formularios, títulos, cabecera, espacio y diálogos. 46 vistas y 10.628 atributos comprobados. [Evidencia y límites](revision-visual-nutrigo-2026-10-06.md). |
| 2026-10-05 | Producto funcional | Ensayo previo a publicar: 1358 pruebas generales, 24 de sesiones reales y 36 comprobaciones de navegador. Después se aplicaron las cinco migraciones aprobadas y se publicaron #54/#56/#57. Portada HTTPS y generación gratuita real de cuatro recetas editadas/publicadas comprobadas; en #57 pasaron 1364 generales, 25 nativas y 40 comprobaciones de navegador. La repetición final queda en el PR de cierre. [Evidencia actual y guía](cierre-producto-publicado-2026-10-05.md) · [registro previo](cierre-funcional-plan-v-2026-10-05.md) · [acciones y permisos](recorridos-y-contratos-plan-v-2026-10-05.md) · [paquete SQL](paquete-produccion-pr54-2026-10-05.md). |
| 2026-10-03 | Producto Nutrigo | Frontend de las 24 fuentes MCP, español y Plan V. PR #54, #56 y #57 publicados, cinco migraciones aprobadas aplicadas. Foto manual, planes, meta publicada, comidas y hábitos comprobados. Cuatro recetas nuevas de IA gratuita editadas/publicadas como v2; paciente recibe la misma copia con estimaciones conservadas. `codex/plan-v-functional-closure` corrige la espera del ensayo de fotos y registra CI/despliegues finales en su PR. Fotos IA pendientes. [Registro propio](producto-nutrigo-mcp-2026-10-03.md), [historial](publicacion-producto-plan-v-2026-10-05.md), [evidencia actual y guía](cierre-producto-publicado-2026-10-05.md). |
| 2026-09-28 | Organización | Se trajeron 43 agentes a `.claude/agents/`, se escribieron las reglas y este plan. Revisión de seguridad de Supabase leída (129 + 1 advertencias, 12 avisos). |
| 2026-09-28 | Organización | Se sacaron dos agentes que no aplican: `healthcare-marketing-compliance` (trata la ley de publicidad de China) y `senior-developer` (es para Laravel, otra tecnología). La revisión de salud en marketing la hace `legal-compliance-checker` con la ley argentina. Quedan 41. |
| 2026-09-29 | A. Seguridad | Cerradas 34 funciones internas de la base que quedaban abiertas (fuga comprobada), cabeceras de seguridad en web y API, historial de invitaciones arreglado. Términos, privacidad y consentimiento completos con los datos de la responsable; "Tus datos" para la paciente. Detalle en `docs/seguridad-privacidad.md`. |

## Dashboard profesional web — 7 de octubre de 2026

Alcance confirmado: todo el dashboard de escritorio; mobile para otra etapa; Academy excluida. [Avance, orden de trabajo y verificación](dashboard-nutricionista-web-2026-10-07.md).

Recetas continúa en `codex/nutri-recetas`: [contraste previo con Nutriboost, API de IA, ventana y composición vinculada a Alimentos](recetas-dashboard-web-2026-10-07.md). Dos incrementos verificados localmente: ventana con paciente contextual y composición reproducible de 11 nutrientes, medidas, tiempos y peso final. Migración preparada, sin aplicar en producción. Tercer incremento funcional verificado: búsqueda, filtros, favoritos profesionales privados y detalle con versiones separadas. Compactación autorizada y aplicada; relevamiento basado en lo visible en pantalla por decisión de Facundo. Categorías culinarias opcionales, filtro y clasificación por versión implementados y verificados localmente. Pendiente: integración completa con el editor del plan y bases externas autorizadas. Siempre contrastar cada apartado antes de desarrollarlo, incluyendo sus funciones de IA.

Recetas/Planes · 2026-10-07: integrado selector de recetas publicadas, cantidades, nutrientes y versiones históricas; editor primero autorizado. Ver cierre y pendientes en [registro de Recetas](recetas-dashboard-web-2026-10-07.md). Local, sin publicación en producción.

Planes web · 2026-10-07: primer editor por días y momentos y análisis del día en vivo. Contraste Nutriboost 2:44, validación local y pendientes (promedio semanal, copia de días y varias entradas por comida) en [registro del editor semanal](planes-semanal-web-2026-10-07.md). Rama codex/nutri-plan-semanal basada en Recetas; sin producción.

Planes web · segundo incremento: copia explícita a días vacíos, versiones/cantidades/notas conservadas y promedio semanal completo/parcial por nutriente. 1501 pruebas aprobadas/2 omitidas; evidencia y alcance en [registro del editor semanal](planes-semanal-web-2026-10-07.md). Pendiente selección de alimentos y varias entradas por comida. Local; sin producción.

Alimentos dentro de comidas · Facundo eligió opción A, filas compactas, y autorizó continuar tras el contraste Nutriboost 2:16/2:44. Implementados varios componentes por comida, selector Alimentos/Recetas, cantidades/medidas, composición congelada en servidor, copia/análisis, evaluación de publicación y compras. Migración preparada y probada localmente, sin aplicar en producción. Evidencia, revisiones y pendientes en [Planes](planes-semanal-web-2026-10-07.md); [propuesta aprobada](propuestas/plan-comida-componentes.html). Web únicamente; mobile y Academy excluidas.


Impresión del plan · 2026-10-07: contraste previo Nutriboost 2:06 (Exportar PDF) y 7:11 (tres categorías de Modelos). Implementada vista previa de copia guardada/publicada y guardar PDF mediante impresión del navegador; cantidades, versiones, notas y procedencia IA conservadas. No incluye cambios sin guardar ni envía avisos. PDF ficticio A4 de dos páginas revisado, aislamiento de paciente y seguridad sin marcos comprobados. Modelos sigue pendiente. [Contraste, evidencia, validación y plan de acción](planes-impresion-modelos-2026-10-07.md). Sin producción, sólo web.

Modelos · primer incremento, 2026-10-07: contraste Nutriboost 7:11, catálogo privado con Planes modelo/Recomendaciones/Alimentos a evitar, búsqueda, ventanas, edición de cantidades/notas, revisión/publicación y archivo. Copia desde versión actual guardada sin encabezado/objetivo del paciente; procedencia IA y recetas históricas conservadas y visibles. Edición de modelo publicado mantiene su copia vigente. 1520 pruebas aprobadas/2 omitidas; última verificación dirigida 22 aprobadas. Tipos/compilación/migraciones y revisiones de código/realidad aprobados. [Plan, evidencia y pendientes](modelos-dashboard-web-2026-10-07.md). Aplicación al paciente pendiente; Facundo eligió nuevo borrador, revisión de cambios y conservación de versión anterior. Sin producción; sólo web, Academy/mobile excluidas.

### Modelos: recomendaciones y alimentos a evitar al plan (2026-10-08)

Comparación previa Nutriboost 7:11: ambas categorías presentes, aplicación no demostrada. Implementado el recorrido acordado: sumar sin duplicados a nueva versión del mismo período, conservando comidas/objetivo/categoría previa y plan publicado. Edición en bloque desplegable con dos campos visibles, aprobado por Facundo tras detener un problema de comodidad. Listas en revisión, historial, documento publicado e impresión. Suite 274 archivos/1527 aprobadas, 2 omitidas; tipos, compilación y migraciones aprobados, revisiones de código/realidad sin bloqueantes. [Registro y evidencia](modelos-dashboard-web-2026-10-07.md). Sólo web, Academy/mobile excluidos; migración local preparada, sin producción. Se completa el recorrido básico de las tres categorías; no todo el dashboard.

2026-10-08: Facundo autorizó aplicar a producción el dashboard desarrollado. Ocho migraciones aplicadas; integración de cambios vigentes y correcciones de lectura de componentes/indicaciones en paciente. Registro: [publicación del dashboard web](publicacion-dashboard-web-2026-10-08.md). Web/API/worker pendientes de verificación final en ese registro.

Cierre productivo del dashboard desarrollado: PR73 integrado en 03d405b, ocho migraciones aplicadas y web/API/worker con la nueva versión comprobada. Suite 2114 aprobadas/2 omitidas; ensayo descartable con sesiones firmadas 27 casos y navegador 42 comprobaciones aprobados. [Registro](publicacion-dashboard-web-2026-10-08.md).

Planificación web · 2026-10-08: instalado emilkowalski/skills por pedido de Facundo y aplicada su guía de diseño. Contraste previo Nutriboost 1:43; detectada diferencia entre meta confirmada y objetivo guardado en el plan. Propuesta visual preparada, recorrido de incorporación al borrador pendiente de elección del usuario por claridad de experiencia. [Registro y acción](planificacion-dashboard-web-2026-10-08.md). Sin producción ni cambios a pacientes.

Planificación web · cierre del incremento, 2026-10-08: Facundo rechazó la maqueta independiente y pidió respetar Nutrigo; aplicada pestaña propia con componentes originales. Decidió actualización automática del objetivo del borrador al confirmar meta. Implementada en memoria y SQL transaccional, conserva publicado; nuevos planes toman confirmada. 2119 pruebas aprobadas/2 omitidas, tipos/build/migraciones/secretos y revisión de código/realidad aprobados; recorrido local confirmado. IMC/referencias y otras ecuaciones siguen pendientes. [Registro actualizado](planificacion-dashboard-web-2026-10-08.md). Sin producción.

### Planificación: segundo incremento (2026-10-08)
IMC y referencias generales de peso incorporadas con fuente CDC, límite de edad20+, resumen desplegable Nutrigo y pruebas de límites. Detalle, evidencias y pendientes en docs/planificacion-dashboard-web-2026-10-08.md. Sin producción. PR #78.

### Planificación: comparación de metas (2026-10-08)
Propuesta vs meta confirmada con diferencias de calorías/macros, revisada contra Nutriboost. Facundo decide conservar objetivos sin exigir peso numérico. 2136 pruebas aprobadas/2 omitidas. CI de db09fd9 completo aprobado. Detalle y evidencia en docs/planificacion-dashboard-web-2026-10-08.md. Sin producción; PR #78.

### Integración paciente-dashboard (2026-10-08)
Leídos definición de producto y auditoría de conexión del hilo paciente en634b0c6. Secuencia recomendada: iniciar integración ahora por alergias/permisos → plan/meta/versión recibida → registros/seguimiento → agenda/mensajes → objetivos/recursos/cuota. No esperar paridad completa. Responsabilidades, pendientes y decisiones no confirmadas registrados en [coordinación](coordinacion-paciente-dashboard-2026-10-08.md). Sin cambios productivos ni integración automática de ramas.

### Integración: alergias al asignar receta por día (2026-10-08)
Backend local corregido en codex/recipe-day-allergies: evaluador existente y control SQL atómico, no asigna ni reemplaza ante conflicto. 2140pruebas aprobadas/2omitidas. Ensayo visual detectó error detrás de ventana; ajuste UI detenido según pedido de Facundo, pregunta de ubicación pendiente. No se acredita terminado ni publicado. [Registro y evidencia](integracion-receta-alergias-2026-10-08.md).
