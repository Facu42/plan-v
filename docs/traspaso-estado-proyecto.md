# Traspaso del proyecto (2026-10-01)

Una sola página para que cualquier agente (Claude, Codex u otro) siga sin tener el chat.
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

- Mediciones de la ficha (2026-10-10, rama `claude/project-thread-ngsfiv`, PR borrador): composición corporal, perímetros, detalle con mín/prom/máx y carga por fecha. Migración `20261010120000_body_metrics` preparada, **sin aplicar** (pide la frase de Facundo). Lista de pacientes con columnas y densidad elegibles (guardado en el navegador). Detalle: `docs/mediciones-dashboard-2026-10-10.md`.

- Revisión del front de la paciente contra Nutrigo, 2026-10-09 (rama `claude/front-paciente-nutrigo-tuezz8`):
  las diez pantallas ya coinciden con Figma en modo demo; Facundo no lo ve porque producción no tiene demo y las
  pantallas de entrada siguen con estilo viejo. Reglas de diseño en `CLAUDE.md`; diagnóstico, matriz y plan en
  `docs/revision-front-paciente-2026-10-09.md`. Piloto: invitación a instalar dentro de la tarjeta del menú.
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
- Pantallas de la nutricionista, ingreso y administración con piezas del archivo de Nutrigo
  (Figma no las dibuja); van en otra rama.

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
- Calorías: aviso al pedir los datos (hoy solo dentro de la app) y revisión del consentimiento con abogado.
- Revisión legal (13 puntos en `docs/legal/revision-legal.md`).
- App para tiendas (Android primero, empaquetando la web), calidad en producción, publicidad paga y
  página pública con precios (espera el precio). Plan: `docs/plan-apartados.md`.

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
