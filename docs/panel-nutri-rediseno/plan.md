# Rediseño del panel de la nutricionista: plan para desarrollar

Creado el 19/10/2026 por Claude (hilo «Rediseño del panel de la nutri») a pedido de Facundo:
«Dejá todo un plan para desarrollar con otros agentes por si te quedás sin crédito».
Cualquier agente (Claude, Codex, Cursor) puede tomar una fase. **Leé este archivo entero antes de empezar.**

## 1. Qué hay que construir

Un panel nuevo para la nutricionista con las funciones que Plan V ya tiene, en el estilo que
Facundo aprobó. La referencia visual es el boceto:

- Boceto navegable: [`design/panel-nutri/bocetos.html`](../../design/panel-nutri/bocetos.html). Abrilo en el navegador.
  Tiene 19 pantallas, las 11 pestañas de la ficha, tema claro y oscuro, menú plegable y el resumen rápido
  de Pacientes. Copia publicada: https://claude.ai/artifact/B2CETdKwVCUY5TEJCZRcjp (privada, de Facundo).
- Capturas: `design/panel-nutri/*.jpg`.

### Decisiones de Facundo (no se discuten)

| Fecha | Decisión |
|---|---|
| 18/10 | Rediseñar el panel de la nutri. Que sea un producto premium, con el logo de Plan V bien visible y los colores de la app de la paciente (Nutrigo: lima `#C2E66E`, crema `#F9F4F2`, tinta `#272932`, amarillo `#FFCB65`, naranja `#FFA257`) para que las dos apps se sientan una sola. Letra Poppins. |
| 18/10 | Usar las skills de diseño y movimiento de su lista (Impeccable, Vercel web-design-guidelines, emil-design-eng, break-ui, make-interfaces-feel-better, Motion, Magic UI, transitions.dev, review-animations, improve-animations). Nada de GSAP. Animaciones de 200 a 300 ms, como máximo 500 ms. Con «reducir movimiento», solo fundidos. Un solo botón principal por fila. |
| 19/10 00:19 | Se deja de copiar Veda: panel propio, moderno, para Plan V. |
| 19/10 00:30 | Aprobó el Inicio: resumen del día en dos líneas, pendientes con un botón cada uno, consultas de hoy con la próxima preparada, pacientes que necesitan atención, buenas noticias, cuatro números del consultorio y accesos rápidos. Sin gráficos que solo decoran. |
| 19/10 01:57 | Aprobó el resto de las pantallas y pidió: **todo lo que se ve tiene que funcionar** (incluidas las piezas que sumó Claude), tema oscuro, el panel sin tener que bajar para ver la parte inferior, menú lateral plegable con una flecha dentro de un círculo y animada, movimiento al pasar el mouse por la lista de pacientes y, al tocar una, un resumen con accesos a cada sección de la ficha. |
| 19/10 02:25 | Pidió: la paciente se **despliega hacia abajo** en la misma lista (no un panel lateral); menú más ancho y con **submenús** (línea en árbol y número en círculo, como su captura); **Planes** más completo y con la paciente elegible; **fotos de comida difuminadas** de fondo en las tarjetas, sin estética de IA; todo adaptable y **sin huecos vacíos** (por ejemplo Mensajes). |

Esto **reemplaza** la regla vieja de usar el gris de Nutrigo en el panel de la nutri (14/10): el panel
pasa a tener la paleta de la app de la paciente. La app de la paciente sigue igual a Nutrigo, sin cambios.

## 2. Reglas para cualquier agente

1. **Antes de tocar código**, leé `CLAUDE.md`, `AGENTS.md`, `docs/coordinacion-agentes.md` y seguí
   `.claude/skills/regression-guard/SKILL.md`. Su informe del paso 10 va en el PR.
2. **El lado de la nutri es carril de Codex** (ver `docs/coordinacion-agentes.md`). Antes de empezar una fase,
   anotala en la tabla de carriles con tu nombre y la rama. No empujes a ramas `codex/*` ni `respaldo/*`.
3. **Una fase = una rama y un PR.** Nada directo a `main`: cada merge publica para usuarias reales.
4. **No se rompe ninguna función.** Las pantallas nuevas usan las mismas rutas de la API, los mismos
   datos y los mismos permisos. Si algo del boceto no existe en Plan V, se construye completo (con
   API, base, pruebas) o no se muestra. Nunca un botón que no hace nada.
5. **Migraciones**: fecha desde `20261019000000`, anotadas en la tabla de migraciones de la coordinación.
   Aplicarlas en producción solo con la frase escrita de Facundo.
6. **Nada de claves** en el repo ni en el chat.
7. **Antes del PR**: `npm test`, `npm run check` y, si hay migraciones, `npm run check:migrations`.
   Capturas a 1440×900 y 390×844, en claro y oscuro, comparadas con el boceto.
8. **Textos** en español con voseo, cortos, sin jerga. Sin datos inventados en producción: sin dato,
   el bloque muestra cero o un texto corto («Todavía no hay mediciones»).
9. Al terminar, una línea en la bitácora de `docs/coordinacion-agentes.md` y el estado de la fase acá abajo.
10. **Por partes, para que cualquier agente pueda seguir** (Codex, Claude o Cursor): un paso chico = un commit
    empujado a GitHub. Después de cada paso, escribí en la **sección 8 (Bitácora)** qué hiciste, cómo, qué falta
    y el próximo paso exacto. El que llega lee primero la sección 7 (Estado) y la última entrada de la sección 8.
11. **Skills obligatorias**: las de la sección 2.1, según el tipo de trabajo.

### 2.1 Skills que se usan en cada fase

| Para qué | Skill | Dónde está |
|---|---|---|
| Antes de tocar código y en el PR | regression-guard (informe del paso 10) | `.claude/skills/` en `main` |
| Diseño, jerarquía, color, espacios, estados vacíos | Impeccable (`craft`, `audit`, `polish`, `harden`) | rama `chore/design-skills` (`.agents/skills/impeccable`), todavía no está en `main`; Codex la tiene también en su PC |
| Reglas de interfaz web | Vercel web-design-guidelines | rama `chore/design-skills` |
| Detalle fino y sensación de producto premium | emil-design-eng, make-interfaces-feel-better | rama `chore/design-skills` |
| Movimiento (200–300 ms, reducir movimiento) | review-animations, improve-animations, animation-performance; Motion para React | `.claude/skills/` en `main` |
| Datos extremos (nombres largos, sin datos, números grandes) | break-ui | `.claude/skills/` en `main` |
| Accesibilidad (teclado, foco, lectores de pantalla) | frontend-a11y | `.claude/skills/` en `main` |
| Componentes React y rendimiento | react-patterns, react-performance, frontend-patterns | `.claude/skills/` en `main` |
| Pruebas | tdd-workflow, react-testing, e2e-testing, verification-loop | `.claude/skills/` en `main` |
| Rutas nuevas del servidor o datos de salud | security-review, postgres-patterns | `.claude/skills/` en `main` |

Nada de GSAP. Si una skill no está a mano, se lee su archivo desde la rama indicada; no se reemplaza por criterio propio.

## 3. Dónde vive hoy cada cosa

| Pantalla nueva | Código actual que hay que reusar (no reescribir la lógica) |
|---|---|
| Armazón y menú | `src/components/crm/CrmDashboard.tsx`, `src/components/crm/CrmModuleView.tsx` |
| Inicio | `src/components/nutrigo/InicioIndicators.tsx`, `src/components/nutrigo/ShowroomWorkCenter.tsx`, bandeja «Tu consultorio, hoy» (`server/crm/repository.ts`) |
| Pacientes | `src/components/crm/CrmPatientsView.tsx`, `CrmPatientCreateDialog.tsx` |
| Ficha (14 secciones reales) | `src/components/nutrigo/ProfessionalPatientWorkspace.tsx`, `patient-record-sections.ts`, etiquetas en `src/features/nutrigo/secondaryTranslation.ts` |
| Notas por voz | `src/components/nutrigo/ConsultationNotes.tsx`, `server/consultations/*` (grabación, transcripción con Groq, resumen; ver `docs/consultas-habilitacion-2026-10-16.md`) |
| Agenda | `src/components/nutrigo/ShowroomAgenda.tsx`, `showroom-calendar.ts` |
| Consultas de la ficha | `src/components/nutrigo/ShowroomConsultations.tsx` |
| Mensajes | `src/components/nutrigo/NutrigoMessages.tsx` |
| Cobranzas | `ShowroomCobranzas`, `src/components/crm/CrmBillingControl.tsx`, `docs/cobros-y-panel.md` |
| Progreso | `/crm/progreso-global` (`src/api/crm-progress.ts`, `docs/progreso-global-2026-10-10.md`) |
| Planes | `MealPlanEditor`, `ShowroomMealPlan`, `NutritionTargetPanel` |
| Asistente IA | `docs/ia-asistente-planes-2026-10-17.md`, tope de US$5 en el servidor |
| Laboratorio, archivos | `CarePanel`, `ClinicalPatientWorkspace` |
| Centro de ayuda | `src/components/nutrigo/HelpCenter.tsx` |

Si un archivo cambió de nombre, buscalo con `git grep` antes de decir que no existe.

### Las 11 pestañas del boceto contra las 14 secciones reales

| Pestaña del boceto | Secciones reales que junta |
|---|---|
| Resumen | `resumen` |
| Historia clínica | `historia` |
| Evolución | `evolucion` |
| Notas de consulta | `notas` |
| Plan (con «Plan actual», «Plan semanal», «Planificación», «Lista de compras») | `plan`, `semanal`, `planificacion`, `compras` |
| Registro alimentario | `alimentario` |
| Laboratorio | `laboratorio` |
| Archivos | `archivos` |
| Consultas | `consultas` |
| Cobros | `cobros` |
| Chat | `chat` |

Los enlaces viejos con `?seccion=` tienen que seguir abriendo la sección correcta (`recordTab`).

## 4. Fases

Cada fase se puede hacer sola, en este orden. Marcá el estado al empezar y al terminar.

### Fase 1. Base visual: colores, tema oscuro y armazón · Estado: hecha, PR #150 para revisar

- Variables de color del panel en un solo archivo (los valores claros y oscuros están en el `<style>`
  del boceto, bloque `html[data-mock="dark"] .m`). Ningún color escrito a mano en los componentes.
- Tema claro, oscuro y «como el sistema». Se elige en Configuración y en el menú de la cuenta; se guarda
  en el perfil (y en el navegador para que no parpadee al entrar). El lima y el amarillo no cambian.
- Contraste AA en los dos temas (texto chico 4,5:1).
- Armazón nuevo: menú lateral de 288 px con logo grande de Plan V, grupos Gestión, Acompañamiento, Plan, Recursos y Cuenta.
- **Submenús** en Pacientes (Todas, Necesitan atención, Acceso pendiente, Archivadas), Agenda, Cobranzas,
  Mensajes y Planes (Todos los planes, Armar o editar, Pedidos de cambio): flecha que gira, apertura de
  260 ms, línea en árbol a la izquierda y el número en un círculo oscuro. Solo queda abierto el de la sección
  actual; cada opción filtra o lleva a su pantalla de verdad. Si el menú no entra en la altura, se desplaza solo él.
- **Fotos de comida difuminadas** detrás de las tarjetas destacadas (resumen del día, próxima consulta,
  accesos rápidos, números): fotos propias de Plan V (`public/landing`, `src/assets/showroom`), achicadas y
  difuminadas de antemano (no con filtro en vivo), con una capa del color de la tarjeta encima para que el
  texto se lea. Nada de brillos ni degradés decorativos.
- **Menú plegable**: botón redondo con una flecha en el borde del menú. Al tocarlo, el menú se angosta a
  84 px y queda solo con íconos (con su nombre al pasar el mouse); la flecha gira 180°. 280 ms con
  curva suave. Se recuerda en el navegador. Con teclado: Enter y Espacio; `aria-expanded`.
- **Se adapta al ancho y sin huecos**: el contenido usa el ancho disponible (las grillas se estiran entre
  1280 y 1680 px) y las tarjetas toman el alto de su contenido, sin rellenos vacíos.
- **Sin bajar para ver la parte de abajo**: el panel ocupa el alto de la ventana (`100dvh`); la página no
  se desplaza a 1440×900. Lo largo (tablas, chats, listas) se desplaza dentro de su tarjeta. En pantallas
  más bajas se achican espacios antes de cortar contenido. En el celular sí se desplaza la página.
- Listo cuando: las pantallas actuales se ven bien en los dos temas, el menú pliega y despliega, y no hay
  desplazamiento de página a 1440×900.

### Fase 2. Inicio · Estado: hecha, PR #151

Bloques del boceto, todos con datos reales: resumen de la mañana (lo arma el asistente; sin IA, una frase
con los conteos), contadores de pendientes, próxima consulta preparada (alergias, último peso, adherencia,
lo que quedó pendiente), accesos rápidos (nueva paciente, plan con IA, copiar link de reserva, registrar cobro),
pendientes con un botón por fila y pestañas por tipo, consultas de hoy, necesitan atención, buenas noticias
(meta alcanzada, rachas de registro, aniversario) y cuatro números del mes.

### Fase 3. Pacientes con resumen rápido · Estado: hecha y verificada, PR #152

- Tabla del boceto con filtros (Todas, Activas, Necesitan atención, Acceso pendiente, Archivadas).
- **Movimiento al pasar el mouse**: la fila se tiñe, la foto crece un poco con un borde lima, el nombre
  cambia a verde, la barra de adherencia se rellena de nuevo y aparece una flecha que entra desde la
  izquierda. Entrada escalonada de filas (28 ms entre filas, 300 ms cada una). Con «reducir movimiento», solo fundidos.
- **Al tocar una fila** (o Enter) **se despliega debajo de esa misma fila** (300 ms, una sola abierta a la vez,
  la flecha de la fila gira) con: foto, nombre, próxima consulta,
  adherencia, peso, cuota, avisos (adherencia baja, cuota vencida, sin acceso a la app, sin plan), lo último
  de la consulta, y **un acceso por cada sección de la ficha** con un dato corto de cada una. Botones
  «Escribir», «Armar plan» y «Abrir ficha completa». Se cierra tocando la fila otra vez o con Escape; el foco queda en la fila.
- Necesita un pedido liviano a la API que traiga ese resumen por paciente (sin traer la ficha entera).

### Fase 4. Ficha con sus 11 pestañas · Estado: integrada a main por Codex, PR #154

Ver la tabla de la sección 3. Encabezado con «Escribir», «Grabar consulta» (abre Notas de consulta) e
«Iniciar consulta». Contenido de cada pestaña según el boceto:

- **Resumen**: peso con la meta, composición, comidas por revisar, nota de la IA para aprobar, adherencia, laboratorio, datos clave.
- **Historia clínica**: cuestionario de ingreso, datos del primer día, historia importada, «Cuidado al armar el plan» (lo respetan el editor y la IA).
- **Evolución**: gráfico (peso, grasa, cintura, músculo), tabla de mediciones, objetivos con avance, hábitos de la semana, fotos privadas.
- **Notas de consulta**: grabación de la videollamada con dos indicadores (micrófono y audio de la paciente), resumen y acuerdos de la IA, transcripción, «Publicar resumen revisado», otras formas (subir audio, pegar transcripción, escribir), notas anteriores y permisos. **Todo esto ya funciona en `ConsultationNotes`; es rediseño, no lógica nueva.**
- **Plan**: plan de hoy con alternativas, pedido de cambio de la paciente (aprobar o proponer otra), planificación (calorías y macros), lista de compras.
- **Registro alimentario**, **Laboratorio** (con tres fechas y gráfico del valor elegido), **Archivos** (con zona para arrastrar y exportar ficha en PDF), **Consultas** (con «Cerrar la consulta de hoy»), **Cobros**, **Chat**.

### Fase 5. Agenda, Cobranzas y Página pública · Estado: lista para juntar (Cursor, PR #153; Facundo autorizó)

Agenda semanal con colores por tipo, línea de la hora, bloqueos, reservas por confirmar, tipos de consulta
y link de reserva. Cobranzas con cobrado, por cobrar, vencido, ingresos por mes, cuotas vencidas con
«Recordar» y movimientos. Página pública con editor y vista previa en celular. Mercado Pago y Google
Calendar muestran «Conectar» hasta que haya claves (no se finge conexión). WhatsApp no se ofrece en el panel: los mensajes y recordatorios van por el chat y los avisos de la app (decisión de Facundo, 19/10).

### Fase 6. Acompañamiento: Asistente IA, Seguimiento, Mensajes y Progreso · Estado: sin empezar

Asistente con la ficha como contexto y el gasto del mes contra el tope; nada se envía a la paciente sin
aprobar. Seguimiento con comidas con foto, «Confirmar» y «Comentar», cómo se sienten (hábitos y síntomas,
PR #112) y días registrados. Mensajes en tres columnas con respuesta sugerida. Progreso de toda la cartera.

### Fase 7. Plan: Planes, Alimentos, Recetas, Equivalencias y Modelos · Estado: sin empezar

**Todos los planes**: estado del plan de cada paciente (publicado, borrador, por vencer, sin plan) con filtros,
números arriba y «Para hacer esta semana». **Plan de una paciente**: selector de paciente con buscador arriba,
franja de metas (calorías, macros, peso, adherencia, restricciones), pestañas Semana, Lista de compras,
Indicaciones y Versiones, semanas 1 a 4, publicar como paso aparte. En la semana: tocar un día muestra sus macros;
tocar una comida muestra sus macros y tres equivalentes para reemplazarla. Pedido de cambio de la paciente con
Aprobar. Paciente sin plan: cuatro maneras de empezar (asistente, modelo, copiar de otra paciente, desde cero).
Todo se guarda como borrador y conserva versiones (ya existen `MealPlanEditor` y los modelos de #73).
Alimentos (SARA 2 y propios), Recetas con foto, Equivalencias con calculadora y opción de mostrarlas en la
app de la paciente, Modelos (planes, menús, mensajes, formularios) con «Aplicar a paciente».

### Fase 8. Recursos y Cuenta: Biblioteca, Ayuda, Equipo y Configuración · Estado: sin empezar

Biblioteca para compartir material, Centro de ayuda con buscador y preguntas, Equipo con roles y permisos,
Configuración por secciones (perfil, consultorio, seguridad, avisos, cuotas, conexiones, plan, privacidad, tema).

### Fase 9. Pulido y cierre · Estado: sin empezar

Pasada de break-ui (sin datos, nombres largos, una sola medición), auditoría de Impeccable, revisión de
animaciones (review-animations) en video corto, accesibilidad con teclado y lector de pantalla, celular
en todas las pantallas. Recorridos de punta a punta de los flujos críticos.

## 5. Piezas que sumó Claude y que tienen que funcionar

Facundo pidió que funcionen. Verificar primero si ya existen en `main`; si no, construirlas completas.

| Pieza | Dónde | Cómo hacerla funcionar |
|---|---|---|
| Sesiones abiertas y «Cerrar las demás» | Configuración › Seguridad | Cerrar las demás: `supabase.auth.signOut({ scope: 'others' })`. Listar: el navegador no puede leer las sesiones de Supabase; hace falta una ruta del servidor que las lea con permisos de servidor solo para la propia cuenta (dispositivo, ciudad aproximada, último uso). Revisión de seguridad obligatoria. |
| Respuestas guardadas | Mensajes y Chat de la ficha | Reusar los modelos de tipo «Mensaje» de Modelos si existen; si no, tabla nueva por consultorio con permisos por fila. Al tocar una, se pega en el cuadro de texto (no se envía sola). |
| Actividad del equipo | Equipo | Registro de acciones del consultorio (quién, qué, cuándo, sin contenido clínico). Ver si la pila de Codex de equipo y recepción ya guarda uno antes de crear otro. |
| Pacientes nuevas y bajas | Progreso | Se calcula con la fecha de alta y la de archivo de cada paciente; el motivo de baja es un campo opcional al archivar. |
| Cómo se sienten y días registrados | Seguimiento | Hábitos y síntomas (PR #112) y comidas de los últimos 7 días. |
| «Pedir registro a todas» | Seguimiento | Aviso dentro de la app a las pacientes sin registros; push y WhatsApp cuando estén conectados. |
| Tema oscuro y menú plegable | Todo el panel | Fase 1. |
| Resumen rápido de la paciente | Pacientes | Fase 3. |

## 6. Cómo se revisa cada fase

1. Capturas en 1440×900 y 390×844, claro y oscuro, al lado del boceto.
2. `npm test` y `npm run check` en verde; pruebas nuevas para cada función nueva.
3. Informe del paso 10 de regression-guard en el PR.
4. Mostrarle a Facundo la página andando como Artifact (las vistas de Vercel le piden login).
5. Juntar a `main` cuando el PR esté terminado, en verde y sin choques (regla del 17/10). La base, solo con su frase.

## 7. Estado

| Fase | Dueño | Rama / PR | Estado |
|---|---|---|---|
| Bocetos y este plan | Claude | `claude/rediseno-panel-nutri-bocetos-iw3aor` | Hecho el 19/10 |
| 1 | Codex | `codex/panel-nutri-fase-1` · [PR #150](https://github.com/Facu42/plan-v/pull/150) | Integrada a main `1f48adf`; web, API y worker comprobados |
| 2 | Codex | `codex/panel-nutri-fase-2` · [PR #151](https://github.com/Facu42/plan-v/pull/151) | Integrada a main 4dc9a79; controles del PR aprobados |
| 3 | Codex | `codex/panel-nutri-fase-3` · [PR #152](https://github.com/Facu42/plan-v/pull/152) | Integrada a main `6697d28` |
| 4 | Codex | `codex/panel-nutri-fase-4` · [PR #154](https://github.com/Facu42/plan-v/pull/154) | Integrada a main |
| 5 | Cursor | `cursor/panel-nutri-fase-5` · [PR #153](https://github.com/Facu42/plan-v/pull/153) | Lista para juntar; Facundo autorizó. Convive con la ficha de la fase 4 |
| 6 a 9 | Por coordinar | — | Pendientes, una rama y un PR por fase |

## 8. Bitácora (una entrada por paso, la más nueva arriba)

### 2026-10-19 18:40 · Cursor · Fase 5, paso 4 (junto con la fase 4)
- Hecho: se trajo main a esta rama. La ficha de la fase 4 y Agenda, Cobranzas y Página pública conviven. En Cobranzas, Ver vuelve a llamarse «Ver cobranzas de…» para abrir la cuota. Si todavía no hay movimientos, el recorrido abre Registrar cobro.
- Cómo: merge de `origin/main` sin rebase. Se conservan las dos bitácoras. No se tocó el servidor.
- Rama y commit: `cursor/panel-nutri-fase-5`. [PR #153](https://github.com/Facu42/plan-v/pull/153), sin juntar hasta que los controles estén verdes.
- Falta: el verde de los controles remotos. Facundo ya autorizó juntar.
- Próximo paso exacto: juntar #153 a main cuando el PR esté verde.

### 2026-10-19 · Codex · Fase 4, paso 9 (selector del acordeón de revisión)
- Hecho: segunda cabeza con ambas verificaciones generales, recorridos y secretos verdes. El recorrido firmado confirmó publicación/meta, archivos privados, retiro/renovación de permisos, turnos y pagos; llegó a la revisión profesional.
- Cómo: el selector de texto del acordeón se ejecuta ahora mediante /browse, que lo admite, en lugar de querySelectorAll nativo. Se conserva Marcar revisado y la lectura persistente. Sólo script y documentación; comprobado en demo.
- Rama: codex/panel-nutri-fase-4, PR #154.
- Qué falta: recorrido firmado completo y controles de la nueva cabeza en verde antes de integrar.
- Próximo paso exacto: integrar #154 al aprobar todos los controles y detenerse; no tomar fase 5.

### 2026-10-19 · Codex · Fase 4, paso 8 (recorrido firmado)
- Hecho: las dos ejecuciones generales del PR aprobaron pruebas, tipos, compilación y controles; seis recorridos y secretos aprobados. El control firmado aprobó sus 30 pruebas de Auth/PostgREST y se detuvo en un acceso anterior de la ficha.
- Cómo: el recorrido abre ahora Plan antes de su subpestaña Planificación, conserva Confirmar y compartir y la comprobación de publicación. Corrección limitada al script; navegación comprobada en demo y sintaxis validada.
- Rama: codex/panel-nutri-fase-4, PR #154.
- Qué falta: repetir los controles remotos de esta cabeza e integrar sólo con todos verdes. No cambia el producto ni hay migraciones.
- Próximo paso exacto: comprobar el recorrido firmado completo, integrar #154 y detener este hilo; fase 5 en otro carril.

### 2026-10-19 · Codex · Fase 4, paso 7 (entrega en PR #154)
- Hecho: entregada la ficha de once pestañas en [PR #154](https://github.com/Facu42/plan-v/pull/154), con informe completo del paso 10 y comparación local disponible. Suite estable: 3.177 aprobadas y dos omitidas, 494 archivos; tipos/build/secretos verdes. 28 controles de navegador y 44 tamaños/temas, 47 capturas, seis e2e.
- Cómo: implementación 8456ded y cierre verificado 0987346; código y visual revisados sin P1/P2. Comparadores manuales preservados, retiro de permisos verificado incluso en vuelo, fire test detectado y restaurado. Sin migraciones ni cambios de producción.
- Rama: codex/panel-nutri-fase-4, PR #154, sobre main 6697d28. Los controles remotos del PR habilitan la integración; no se integra con un control rojo.
- Qué falta: sólo CI remoto e integración de esta entrega; fases siguientes fuera del alcance de este hilo. Las limitaciones de hardware/IA/PDF de punta a punta quedan explícitas en el informe.
- Próximo paso exacto: comprobar CI de #154, integrarlo con todo verde y detener este trabajo. **La fase 5 ya se realiza en otro carril por pedido de Facundo; no tomarla ni continuar con fases 6–9.**


### 2026-10-19 · Codex · Fase 4, paso 6 (cierre verificado)
- Hecho: once pestañas verificadas, suite estable de 3.177 aprobadas y dos omitidas (494 archivos), tipos/build/secretos verdes. Seis e2e, 14 controles y 44 tamaños/temas, nueve acciones privadas y cinco ensayos de paginación; 47 capturas. Comparación navegable comprobada y abierta para Facundo.
- Cómo: revisiones independientes de código y visual cerradas sin P1/P2. Fire test detectado y restaurado; comparadores manuales preservados con RED/GREEN. [Informe completo y paso 10](fase-4-verificacion.md). Sin migraciones ni cambios de producción.
- Rama: codex/panel-nutri-fase-4, base main 6697d28. Este cierre se respalda antes del PR propio.
- Falta: crear y registrar PR, controles remotos e integración con todo verde.
- Próximo paso exacto: abrir PR de fase 4 con el paso 10; integrar al aprobar CI y detener este hilo. La fase 5 está a cargo de otro carril por pedido de Facundo.


### 2026-10-19 · Codex · Fase 4, paso 5 (correcciones de revisión)
- Hecho: Historia agrupada y medidas del primer día autorizado, datos de ingreso preservados; chat con estilos propios de su contexto, visor y perfil con tema del panel, pestaña activa visible en celular. Corregido desborde del plan y retiro de Atención en documentos/evaluaciones.
- Cómo: revisión independiente de código y visual; nueve acciones privadas reales en demo, incluida apertura pendiente y retiro, laboratorio de tres fechas y nota manual/publicación. Seis e2e aprobados con Chrome local; tipos aprobados. Fire test detectó exposición de foto sin permiso, restaurado y tres casos verdes.
- Rama: codex/panel-nutri-fase-4; base main 6697d28 conciliada en 4520e73.
- Falta: suite completa final (primera corrida tuvo EBUSY de Windows y un timeout; sus 25 casos focales repitieron verdes), capturas finales y cierre independiente, informe y PR.
- Próximo paso exacto: completar suite serializada, controles del navegador y artefacto; abrir PR exclusivo de fase 4 e integrar sólo con CI verde. **Por indicación de Facundo, detenerse al terminar fase 4: fase 5 se hace en otro carril.**


Formato de cada entrada, para que el siguiente agente siga sin preguntar:

```
### AAAA-MM-DD HH:MM · Agente · Fase N, paso M
- Hecho: qué quedó funcionando (pantallas, rutas, pruebas).
- Cómo: decisiones tomadas, archivos principales, skills usadas.
- Rama y commit: nombre de la rama, commit, PR.
- Falta: lo que queda de la fase.
- Próximo paso exacto: qué archivo abrir y qué hacer primero.
```

### 2026-10-19 16:15 · Cursor · Fase 5, paso 3 (boceto y sin WhatsApp)
- Hecho: capturas de Agenda, Cobranzas y Página pública en 1440×900 y 390×844, claro y oscuro, al lado del boceto, en `design/panel-nutri/fase-5/`. Se sacó WhatsApp del panel de la nutri: no hay botón Conectar, ni recordatorio por WhatsApp, ni ajuste para activarlo. Recordar abre el chat de la app. El aviso de la cuota sigue en el inicio de la paciente. No se tocó el servidor ni las migraciones.
- Cómo: mismas pantallas. Las tarjetas de cobranzas usan la foto suave del panel. Lo que el boceto muestra con datos de Verónica y la app no tiene (turnos inventados, matrícula, foto de perfil) queda vacío o con el dato real.
- Rama y commit: `cursor/panel-nutri-fase-5`. [PR #153](https://github.com/Facu42/plan-v/pull/153), sin juntar.
- Falta: el visto de Facundo. El celular del boceto no dibuja Cobranzas ni Página pública (repite el Inicio).
- Próximo paso exacto: fase 6 (Asistente IA, Seguimiento, Mensajes y Progreso), en otra rama.

### 2026-10-19 14:45 · Cursor · Fase 5, paso 2 (cierre)
- Hecho: las tres pantallas quedaron en la rama y se conservaron las acciones que ya tenía la agenda: confirmar, cancelar y reprogramar, revisar transferencias, conciliar Mercado Pago, sincronizar el calendario, desconectar Google o Mercado Pago, ver más reservas y más fichas, seña por tipo, Meet, alias y agendas. Mercado Pago, Google Calendar y WhatsApp siguen en Conectar si el servidor no tiene claves. `npm run check` pasó. Las pruebas de estas pantallas: 13 en 5 archivos. La suite completa: 3171 pasaron, 2 omitidas y 5 fallaron en `server/security/mfa.test.ts` y `server/db/supabase-client.test.ts` porque esta máquina usa Node 20 y no tiene WebSocket nativo; esos archivos no están en el diff.
- Cómo: mismas rutas de agenda, cobros y página pública. Sin migración. La ficha de Codex no se tocó. No hay capturas de navegador en 1440 y 390: en esta sesión no hubo navegador.
- Rama y commit: `cursor/panel-nutri-fase-5`, `f04bc11`. [PR #153](https://github.com/Facu42/plan-v/pull/153), sin juntar.
- Falta: que Facundo mire las pantallas y, si cierran, juntarlas. La comparación lado a lado con el boceto queda para quien tenga navegador.
- Próximo paso exacto: fase 6 (Asistente IA, Seguimiento, Mensajes y Progreso), en otra rama, cuando se tome.

### 2026-10-19 14:05 · Cursor · Fase 5, paso 1 (pantallas)
- Hecho: Agenda semanal (día, semana y mes) con colores por tipo, línea de la hora, bloqueos, reservas por confirmar y tipos de consulta. Cobranzas con cobrado, por cobrar, vencido, ingresos por mes, cuotas vencidas con Recordar y movimientos. Página pública con editor y vista previa. Mercado Pago, Google Calendar y WhatsApp muestran Conectar y no figuran conectados si el servidor no tiene claves.
- Cómo: pantallas nuevas sobre las rutas y los datos que ya existían (agenda, cobros y página de reservas). Sin migración. La ficha de Codex no se tocó. Pruebas de los cálculos y de lo que se ve en cada pantalla.
- Rama y commit: `cursor/panel-nutri-fase-5`.
- Falta: suite completa, `npm run check`, informe del paso 10 y el PR.
- Próximo paso exacto: correr `npm test` y `npm run check`, completar la Bitácora y abrir el PR contra main.

### 2026-10-19 13:08 · Cursor · Fase 5, paso 0 (reserva)
- Hecho: fase 5 reservada antes de cambiar código. Facundo autorizó que Cursor tome la fase 5 porque Codex se quedó sin crédito. Codex sigue con la fase 4 en `codex/panel-nutri-fase-4`; esta rama no toca esa rama ni sus archivos de ficha.
- Cómo: leídos el plan, la Bitácora de `origin/codex/panel-nutri-fase-4` (solo lectura; último paso: pestañas de la ficha conectadas), la coordinación y Regression Guard. Base `origin/main` `6697d28` (fase 3 integrada).
- Rama y commit: `cursor/panel-nutri-fase-5`, desde `origin/main` `6697d28`. Sin cambios de base de producción.
- Falta: Agenda semanal, Cobranzas, Página pública, y Mercado Pago, Google Calendar y WhatsApp mostrando «Conectar» sin fingir conexión. Pruebas, comparación en 1440 y 390, claro y oscuro, e informe para el PR.
- Próximo paso exacto: abrir `design/panel-nutri/bocetos.html` en Agenda, Cobranzas y Página pública y mapearlas contra la agenda, las cobranzas y la página pública que ya existen.

### 2026-10-19 · Codex · Fase 4, paso 2 (registros completos y evolución)
- Hecho: lectura profesional de comidas paginada y filtrada por paciente, período/estado; pruebas de más de veinte registros, archivo, rol y dos consultorios. Resumen toma pendientes de esa ruta y días de metadata completa del feed. La ficha se hidrata al abrir y ofrece reintento; no infiere cero desde la lista vacía del directorio. Evolución compone gráfico por métrica, tabla por fechas, objetivo editable y hábitos; conserva mediciones, importación y métodos en desplegables.
- Cómo: reutiliza normalizador y firma de fotos, con consentimiento vigente y prefijo de almacenamiento propio; permisos leídos sin ingreso completo. Resumen no presenta como pendiente una nota ya compartida. 14 pruebas API focales y tipos aprobados; falta verificación final de toda la fase.
- Rama y commit: codex/panel-nutri-fase-4; respaldo antes de arreglar en fase3 otro selector de CI para Más opciones.
- Falta: completar laboratorio, notas, plan y demás composición; QA/teclado/móvil, suite final, revisiones y PR propios. #152 está pendiente por un selector viejo en signed-auth; e2e/verify aprobados tras la primera corrección.
- Próximo paso exacto: corregir scripts/product-browser.local.mjs en fase3 para abrir Más opciones antes de editar/archivar/restaurar; volver a fase4 y completar Laboratorio/Notas/Plan.

### 2026-10-19 · Codex · Fase 4, paso 1 (encabezado y resumen)
- Hecho: encabezado con acciones reales, once pestañas y subpestañas de Plan manteniendo las catorce rutas. Resumen conectado a medidas, comidas por revisar, notas autorizadas, días registrados, laboratorio, antecedentes y cuotas. Historia conserva ingreso/importación y suma cuidado al preparar plan. Tipos y ocho pruebas focales aprobados; primer vistazo /browse sin desborde en 1440.
- Cómo: pruebas RED de agrupación y datos antes de implementar. Se reutilizan API, permisos, gráficos/medidas y lógica de consulta; no se inventa meta numérica, diagnóstico, edad ni resumen de IA. Unidades distintas y comparadores de laboratorio no se mezclan. Todavía no se declara fase completa.
- Rama y commit: codex/panel-nutri-fase-4, base #152; este paso se respalda antes de continuar.
- Falta: evolución con composición aprobada, rediseño de notas, vista actual de Plan, laboratorio con comparación de tres fechas y gráfico, archivos/consultas/cobros/chat, revisión y QA final propias.
- Próximo paso exacto: completar las piezas de Evolución y Laboratorio sobre ClinicalPatientWorkspace, conservar todos sus formularios en paneles desplegables y adaptar Notas sin cambiar captura/publicación.

### 2026-10-19 08:44 · Codex · Fase 4, paso 0 (reserva)
- Hecho: fase 4 reservada antes de cambiar código. Fase 3 entregada en #152 y su CI corre.
- Cómo: continuación del pedido de Facundo, una rama y PR por parte. Se mantiene toda la lógica y permisos de las 14 secciones, agrupadas visualmente en las once pestañas aprobadas.
- Rama y commit: codex/panel-nutri-fase-4, desde la cabeza de fase 3; dependencia explícita de #152 hasta integrarlo y conciliar main.
- Falta: encabezado, pestañas agrupadas, resumen, historia, evolución, notas y composición de plan/registros/laboratorio/archivos/consultas/cobros/chat; QA, suite e informe propios.
- Próximo paso exacto: leer ProfessionalPatientWorkspace.tsx, ShowroomPatientRecord.tsx y funciones ficha/fResumen/fHistoria/fEvolucion/fNotas del boceto; mapear componentes reales y escribir las garantías de rutas antiguas antes de cambiar la UI.

### 2026-10-19 · Codex · Fase 3, paso 6 (recorrido con cuentas)
- Hecho: e2e y verify aprobados en el control remoto de a1b61bf. signed-auth llegó hasta edición/archivo y encontró sus selectores previos al menú; se actualizan para abrir Más opciones antes de editar, archivar y restaurar.
- Cómo: sólo cambia el recorrido; mantiene todas las comprobaciones y agrega esperar archivo persistido antes de restaurar. Sintaxis del script aprobada. Sin cambio de app, permisos ni migraciones.
- Rama y commit: codex/panel-nutri-fase-3, PR #152.
- Falta: nuevo signed-auth y controles de la cabeza actual. No integrar hasta todos verdes. Fase4 respaldada en 37c239e.
- Próximo paso exacto: volver a fase4 y completar Laboratorio/Notas/Plan mientras termina CI; después conciliar main al integrar #152.

### 2026-10-19 · Codex · Fase 3, paso 5 (control remoto)
- Hecho: CI detectó que el recorrido de ingreso seguía pulsando Abrir ficha/plan sin desplegar Más opciones. Actualizado el recorrido para usar el menú visible, sin cambiar la app ni retirar verificaciones.
- Cómo: tipos, suite completa y /browse del código siguen aprobados. Se ejecuta nuevamente la historia de seis flujos con el selector actual; el entorno local instala el navegador fijado por Playwright. No se integra con CI rojo.
- Rama y commit: codex/panel-nutri-fase-3, PR #152.
- Falta: controles remotos nuevos y cierre del recorrido; fase 4 está respaldada en su propia rama 4a6e9aa.
- Próximo paso exacto: esperar el nuevo control e2e de #152 y signed-auth; integrar sólo con todos verdes. Retomar codex/panel-nutri-fase-4.

### 2026-10-19 08:43 · Codex · Fase 3, paso 4 (PR)
- Hecho: abierto [PR #152](https://github.com/Facu42/plan-v/pull/152) con el paso 10 completo; controles remotos en curso. Código verificado dc0888a, informe 3e666c3.
- Cómo: rama propia, main conciliado, evidencia y comparación locales. Cierre sin cambiar lógica ni SQL.
- Rama y commit: codex/panel-nutri-fase-3, PR #152.
- Falta: integración cuando todos los controles estén aprobados, más fases 4–9.
- Próximo paso exacto: reservar fase 4 de Ficha en rama propia desde esta base, declarar dependencia de #152 y continuar mientras termina CI.

### 2026-10-19 08:42 · Codex · Fase 3, paso 3 (cierre estable)
- Hecho: 3.164 pruebas aprobadas y dos omitidas, 489 archivos; tipos, build y secretos aprobados. 22 comprobaciones /browse y seis combinaciones, ocho capturas; revisión de código y visual sin P1/P2. [Informe completo](fase-3-verificacion.md) y [comparación navegable](../../design/panel-nutri/fase-3-verificacion.html).
- Cómo: resumen individual liviano y lote de columnas autorizados, sin notas privadas ni cambios de base. Correcciones respaldadas en dc0888a, código estable de esa revisión más cierre documental; fire test detectado y restaurado. Cuenta de atención mantiene su regla previa de revisión, sin inferencias clínicas.
- Rama y commit: codex/panel-nutri-fase-3; este cierre se sube antes de abrir el PR. Se anota su número al crearlo.
- Falta: controles remotos e integración del PR; fases 4–9. Demo local, sin lector de pantalla, teléfono físico ni Auth remoto. 403 esperado de consultas completadas por permiso de atención ausente al abrir la ficha.
- Próximo paso exacto: reservar fase 4 en codex/panel-nutri-fase-4, desde esta base mientras corre CI, y leer ProfessionalPatientWorkspace.tsx junto a las once pestañas del boceto. Conservar enlaces viejos de las 14 secciones.

### 2026-10-19 · Codex · Fase 3, paso 2 (correcciones y QA)
- Hecho: corregidos resumen/columnas al archivar y restaurar, consultas de consentimiento sin notas clínicas, menú en capa superior y giro de flecha. /browse aprueba 22 comprobaciones y seis combinaciones, ocho capturas en ambos temas/tamaños; comparación navegable comprobada.
- Cómo: dos revisiones independientes; Postgres prueba consentimiento retirado, peso no futuro y ausencia de RPC global o ingreso completo. Fire test de permiso detectado y restaurado, 11 pruebas API verdes. Se agregó distinción entre falta de registros y adherencia registrada de cero.
- Rama y commit: codex/panel-nutri-fase-3; respaldo final antes del PR. Base main 4dc9a79 conciliada en b4ad3f4.
- Falta: registrar suite completa estable y tipos/build finales, abrir PR propio y sus controles remotos. Fases 4–9 siguen autorizadas por Facundo.
- Próximo paso exacto: cerrar fase-3-verificacion.md con resultados finales y copiar el paso 10 completo al PR; luego reservar fase 4 en rama propia.

### 2026-10-19 · Codex · Fase 3, paso 1 (tabla y contrato)
- Hecho: tabla del boceto, cinco filtros, columnas/densidad conservadas, acciones en Más opciones, resumen desplegable con 14 accesos y datos por sección. Plan y peso se cargan en lotes de metadata; sólo abrir la fila pide el resumen. Inicio #151 integrado a main 4dc9a79, controles remotos aprobados.
- Cómo: pruebas RED antes de implementar; 28 casos focales aprobados. API autorizada por consultorio y consentimiento, archivo sin contenido clínico, resumen de consulta publicado acotado. Revisión detectó consulta de cobros global: corregida a get_patient_ledger y cubierta con aserción Postgres. Sin tablas ni SQL remoto.
- Rama y commit: codex/panel-nutri-fase-3; respaldo de implementación y conciliación con main antes de la QA final.
- Falta: QA visual y de teclado/móvil, fire test, revisión final de ambos agentes, suite completa, informe y PR propio.
- Próximo paso exacto: ejecutar recorridos de Pacientes con /browse en ambos temas y tamaños; cerrar observaciones y registrar evidencia.

### 2026-10-19 · Codex · Fase 3, paso 0 (reserva)
- Hecho: fase 3 reservada antes del código; Inicio está en #151 y sus controles remotos corren.
- Cómo: se continúa el pedido de Facundo, una rama y PR por parte. Base explícita de #151, sin modificar su rama. Al integrarlo se concilia main antes de entregar esta fase.
- Rama y commit: `codex/panel-nutri-fase-3`, desde fase 2 `50c5d21`.
- Falta: tabla del boceto, filtros, resumen liviano autorizado, despliegue bajo la fila con accesos, movimiento y pruebas completas.
- Próximo paso exacto: leer ShowroomPatients.tsx y sus helpers, localizar la carga autorizada del directorio y definir/pruebar el contrato del resumen antes de implementarlo.

### 2026-10-19 · Codex · Fase 2, paso 4 (PR)
- Hecho: abierto [PR #151](https://github.com/Facu42/plan-v/pull/151) con el informe completo del paso 10 y comparación local disponible. CI en curso.
- Cómo: versión verificada 587db0e; cierre documental sin cambiar código. No hay migraciones.
- Rama y commit: `codex/panel-nutri-fase-2`, PR #151.
- Falta: controles remotos del PR; fases 3–9. Se conserva el alcance y los límites del informe de fase 2.
- Próximo paso exacto: reservar fase 3 en `codex/panel-nutri-fase-3` sobre esta base mientras termina CI; mantener una rama y PR por fase y conciliar main al integrar #151.

### 2026-10-19 · Codex · Fase 2, paso 3 (verificación final)
- Hecho: Inicio verificado; suite completa 3.153 aprobadas y dos omitidas, 486 archivos; tipos, build y secretos aprobados. /browse: 13 comprobaciones y ocho tamaños/temas, con cuatro capturas. Revisiones finales de code-reviewer y reality-checker sin P1/P2.
- Cómo: se cerraron los contratos reales de historial, conteos por turno, fechas completas de rachas, paginación y preparación móvil desplegable. Fire test detectado. [Informe y Regression Guard](fase-2-verificacion.md) y [comparación navegable](../../design/panel-nutri/fase-2-verificacion.html).
- Rama y commit: `codex/panel-nutri-fase-2`; implementación f06494c, correcciones 8711df5 y este cierre. PR propio se anota al crearlo.
- Falta: CI del PR e integración; fases 3–9. La demo no tiene secreto para habilitar reserva pública (501); copia cubierta por adaptador, sin afirmar portapapeles real. Completar consulta conserva el 403 por permiso de atención ausente en demo. Sin SQL remoto.
- Próximo paso exacto: abrir PR de fase 2 con el informe del paso 10; reservar fase 3 en otra rama y empezar por ShowroomPatients.tsx y el resumen liviano por paciente, sin modificar esta fase.

### 2026-10-19 · Codex · Fase 2, paso 2 (revisión de datos)
- Hecho: corregidas las cinco observaciones de código: reprogramaciones visibles, atención independiente de filtros, rachas resumidas desde fechas completas autorizadas, historial de turnos de hoy y reloj vivo. Corregida paginación compartida de reservas/transferencias y destino de revisión de comidas.
- Cómo: `include_home=1` amplía la API existente con metadata, sin campos clínicos ni permisos nuevos; pruebas RED de los fallos antes de resolverlos. 25 casos focales y prueba Postgres descartable con dos consultorios aprobados. La primera suite completa alcanzó pruebas RED incorporadas mientras corría; se repite al cerrar los cambios, no se considera evidencia verde.
- Rama y commit: `codex/panel-nutri-fase-2`; respaldo de correcciones antes de la QA final.
- Falta: segunda revisión independiente, capturas definitivas, recorridos, suite completa estable, fire test y PR.
- Próximo paso exacto: cerrar QA con /browse, verificar el resumen aunque la paciente no esté seleccionada y comprobar todos los accesos rápidos.

### 2026-10-19 · Codex · Fase 2, paso 1 (Inicio conectado)
- Hecho: resumen calculado, contadores por tipo, próxima consulta con antecedentes y peso, accesos reales, bandeja paginada, reservas por confirmar, agenda del día, atención, noticias y cuatro números del mes. Pruebas iniciales RED (`6930fe2`) y 11 casos GREEN; tipos aprobados. Revisión de código solicitada.
- Cómo: PanelHome y use-home-data reutilizan las API de bandeja, cobros, agenda, ingreso y seguimiento, sin cambiar permisos ni crear tablas. panel-home deriva fechas argentinas, rachas por días únicos y saldos de cargos del mes. El resumen declara que es calculado; no finge una respuesta de IA. Diseño del boceto en 1440/390; se corrigieron saludo móvil e importes recortados observados en /browse.
- Rama y commit: `codex/panel-nutri-fase-2`; este paso se respalda antes de la verificación final.
- Falta: comparación y evidencia final en ambos temas, pruebas de navegación y errores, suite completa, fire test, revisiones independientes e informe Regression Guard para el PR.
- Próximo paso exacto: ejecutar scripts/panel-nutri-inicio-qa.mjs con la demostración local; comprobar todos los botones y capturas antes de abrir el PR de fase 2.

### 2026-10-19 · Codex · Fase 2, paso 0 (reserva)
- Hecho: fase 2 reservada antes de cambiar código. Facundo pidió «Continúa con el resto» después de integrar #150; se continúa en orden, una rama y PR por fase.
- Cómo: base main `1f48adf` publicada y comprobada (web, API y worker); leídos plan, Bitácora, coordinación y Regression Guard. Se conserva el boceto aprobado y las funciones existentes.
- Rama y commit: `codex/panel-nutri-fase-2`, desde origin/main. Sin cambios de base de producción.
- Falta: Inicio completo, datos reales, pruebas, comparación 1440/390 en ambos temas e informe para el PR.
- Próximo paso exacto: leer ProfessionalWorkQueue.tsx, InicioIndicators.tsx y server/crm/repository.ts; mapear datos disponibles contra el Inicio de bocetos.html y escribir las pruebas de los huecos funcionales.

### 2026-10-19 · Codex · Fase 1, paso 3 (cierre)
- Hecho: fase 1 entregada en [PR #150](https://github.com/Facu42/plan-v/pull/150), con informe Regression Guard completo en el cuerpo. 3.132 pruebas aprobadas y dos omitidas (483 archivos), tipos, compilación y secretos aprobados. 22 comprobaciones y 72 medidas de navegador; revisión de código y visual independientes aprobadas para el armazón.
- Cómo: tokens y estilos limitados al panel de la nutri, navegación sobre rutas y componentes existentes; preferencias por cuenta con recuperación local. Capturas y comparación en design/panel-nutri/fase-1/, [informe](fase-1-verificacion.md) y [página de revisión](../../design/panel-nutri/fase-1-verificacion.html).
- Rama y commit: codex/panel-nutri-fase-1; implementación 419bbd7, verificación/correcciones afd4a83, PR #150. Este commit documental cierra la Bitácora. Sin merge, despliegue ni SQL de producción.
- Falta: revisión/integración del PR; fases 2–9. En formularios largos se desplaza el área central. AA acotado a tokens/estados nuevos; sincronización con cuenta real no comprobada en producción. Pedidos de cambio y respuestas guardadas quedan para fases 7/6 porque no existen en main.
- Próximo paso exacto: **fase 2: Inicio**. Crear su rama sobre esta base cuando esté integrada (o declarar dependencia de #150); leer ProfessionalWorkQueue.tsx, InicioIndicators.tsx y server/crm/repository.ts y conectar los bloques del Inicio del boceto con datos reales.

### 2026-10-19 · Codex · Fase 1, paso 2 (verificación)
- Hecho: base visual verificada en 18 pantallas, dos temas y dos tamaños; 22 comprobaciones y 72 medidas aprobadas. Ficha incluida; barra móvil, retorno del foco, altura de chat y contraste de selección/etiquetas corregidos. Suite completa: 3.132 aprobadas, dos omitidas; 483 archivos.
- Cómo: /browse, pruebas nuevas de preferencias/navegación/AA, fire test y revisión independiente de code-reviewer y reality-checker. [Informe y Regression Guard](fase-1-verificacion.md); [comparación navegable](../../design/panel-nutri/fase-1-verificacion.html).
- Rama y commit: codex/panel-nutri-fase-1; se sube este paso antes de abrir el PR propio.
- Falta: abrir el PR y anotar su número. No se publica desde este hilo. Límite: formularios largos desplazan el área central; el contenido de las fases siguientes sigue como estaba. Sin prueba de sincronización con una cuenta real de producción.
- Próximo paso exacto: abrir el PR de fase 1 con el informe del paso 10; después, fase 2 (Inicio), conservando esta base y leyendo ProfessionalWorkQueue.tsx e InicioIndicators.tsx.

### 2026-10-19 · Codex · Fase 1, paso 1
- Hecho: tokens claros/oscuros del boceto, preferencia por cuenta (metadato panel_theme) y navegador, tres temas, menú de 288/84 px, grupos y submenús conectados a filtros existentes. Fondo fotográfico preparado con desenfoque previo. Tipos y 20 pruebas focales aprobados.
- Cómo: nuevos PanelNavigation, PanelThemePicker y use-panel-theme; estilos sólo en el panel profesional. Bocetos vigentes aplicados directamente (diseño ya aprobado). Habilidades: Regression Guard, Impeccable, Emil, Vercel, accesibilidad, React, pruebas y movimiento del repo.
- Rama y commit: codex/panel-nutri-fase-1; este paso se sube antes de la comprobación visual final.
- Falta: QA en navegador de ambos tamaños/temas, teclado y datos extremos; suite completa, fire test y revisiones independientes.
- Próximo paso exacto: comprobar el panel local con /browse y corregir los problemas observados; las pantallas mantienen su contenido hasta sus fases propias. Pedidos de cambio y respuestas guardadas no existen en main; no se simulan y se incorporan en las fases 7 y 6.

### 2026-10-19 · Codex · Fase 1, paso 0 (reserva)
- Hecho: fase 1 reservada antes de tocar código, desde main 79056fe (PR #148 integrado).
- Cómo: leídos plan, Bitácora, CLAUDE.md, coordinación y Regression Guard. El PR #147 de Cursor es anterior al boceto vigente, usa Plus Jakarta Sans y otra base; no se modifica ni se toma como implementación del diseño aprobado.
- Rama y commit: codex/panel-nutri-fase-1; PR propio al terminar las verificaciones.
- Falta: variables claras/oscuras, tema persistente, armazón y submenús reales, menú plegable, fondos fotográficos preparados, adaptación y pruebas.
- Próximo paso exacto: abrir design/panel-nutri/bocetos.html y localizar el armazón profesional vigente antes de escribir pruebas de tema y navegación.

### 2026-10-19 · Claude · Bocetos y plan
- Hecho: boceto navegable (`design/panel-nutri/bocetos.html`) y este plan, aprobados por Facundo.
- Rama y commit: `claude/rediseno-panel-nutri-bocetos-iw3aor`, PR #148 (solo documentos).
- Próximo paso exacto: Fase 1. Crear la rama desde `main` actualizado, leer la sección 2 y el bloque
  `html[data-mock="dark"] .m` del boceto para pasar los colores a variables del panel.

### 2026-10-19 · Codex · Fase 4, paso 3 (Laboratorio y Notas)
- Hecho: comparación de análisis por fecha y unidad, ingreso manual con informe de origen y carga existente; nueva presentación de notas conserva captura, transcripción, revisión y publicación. Evolución conserva la revisión de registros compartidos.
- Cómo: reutilización de contratos y permisos; referencias originales sin inferencias clínicas. Enlaces privados temporales se descartan al cambiar permisos o paciente. Respaldo de avance antes de corregir el recorrido remoto de fase 3.
- Rama: codex/panel-nutri-fase-4, dependiente de #152.
- Falta: Plan, Archivos, composición final de Consultas/Cobros/Chat, revisión visual y funcional completa, suite final, informe y PR propio.
- Próximo paso exacto: corregir el selector del menú ya abierto al restaurar una ficha en #152; retomar las pestañas pendientes en esta rama.
### 2026-10-19 · Codex · Fase 3, paso 7 (recorrido de restauración)
- Hecho: localizado el fallo remoto al restaurar: el menú continuaba abierto después del archivo y la prueba lo cerraba. El recorrido ahora abre sólo si está cerrado; conserva todas las comprobaciones de persistencia.
- Cómo: 30 casos Auth/PostgREST y los recorridos anteriores aprobaron; corrección limitada al script, con sintaxis validada. Nueva ejecución remota pendiente.
- Rama: codex/panel-nutri-fase-3, PR #152. Sin cambios funcionales ni migraciones.
- Falta: CI verde para integrar #152; fase 4 en su rama reservada.
- Próximo paso exacto: revisar el resultado del nuevo recorrido firmado y conciliar main en fase 4 al integrar.

### 2026-10-19 · Codex · Fase 4, paso 4 (pestañas conectadas)
- Hecho: plan actual separado del editor, fuente publicada por fecha, pedidos de cambio profesionales, carga privada por arrastre y visor temporal, movimientos propios de cobro y composición de consultas/chat. Incluye corrección del retiro de Atención detectada en revisión independiente.
- Cómo: contratos existentes, sin migraciones; API completa de comidas con pruebas de medianoche argentina y foto sin permiso. Diez focales UI/datos y siete focales adicionales aprobados; tipos aprobados. Recorrido e2e ajusta la búsqueda de alergias al cuestionario por duplicación del resumen, conserva la aserción.
- Rama: codex/panel-nutri-fase-4. #152 completó ahora todos sus controles remotos; se integra y concilia esta rama.
- Falta: completar QA visual/funcional, pruebas finales, fire test, segunda revisión e informe/PR propio.
- Próximo paso exacto: conciliar main tras #152 y continuar /browse de las once pestañas en ambos temas y tamaños.
