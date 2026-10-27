# Handoff: boceto panel nutri → app funcional

**Fecha:** 27 oct 2026 (America/Buenos_Aires)

**Dueño del hilo:** Plan V + Facu

**Main tip:** `c4bdf96` (`c4bdf96831c215ddad65c4f4528bda9701da3f6e`, post #193).

**Estado:** en main, con ok visual de Facu y squash-merge: #176–#182, #183–#190 (Planes 1–3f), #191 Centro de ayuda, #192 Equipo/Ajustes y #193 Motion panel v29. La migración `plan_delivery` se aplicó en producción `plan-v-app` el 26 oct, con aval escrito de Facu. El próximo módulo espera su elección.

## Decisiones cerradas (Facu, 25–27 oct 2026)

1. **Ok escrito** al boceto (v29 + PR #174 / `panel-trabajo.html`): **ok-v29-valor**.
2. **Fuente de estilos/contrato:** `design/panel-nutri/v29/panel-trabajo.html` (no el build `v3/` hasta nuevo aviso).
3. **Orden por valor:** tools → shell → Seguimiento → Progreso → Asistente IA fue el arranque aprobado, no las fases 1→13 de `version-final.md`. Ese recorrido ya está en main; ahora Facu elige qué sigue.
4. **La interfaz sale del boceto v29.** Si algo no está disponible, se muestra vacío o «Próximamente». No se inventa UI.
5. **Merge de UI solo tras ok visual de Facu:** «Bien», «si» o «mergeá». Adjuntá las capturas/imágenes del PR al pedirle ese ok. Facu mergea.
6. **Paridad del editor Planes:** chequeá las cinco pestañas `ptabs2`: Comidas, Indicaciones, Compras, Versiones y Entrega.
7. **Implementación preferida:** Codex Sol `gpt-6.1-sol` vía Herdr / `codex exec -m gpt-6.1-sol`. Si Codex se queda sin cuota, fallback a Cloud Agent Grok 4.7: Facu lo pidió explícitamente cuando Sol se quedó sin uso.
8. **Cloud Agent no es el default:** se usa cuando Facu lo pide o Codex no puede. Evitá gastar créditos de Cursor Agent en código de Plan V si se puede.

## Fuentes canónicas

| Qué | Dónde |
|---|---|
| Plan iterable (Page) | https://cursor.com/canvas/store-0f75b483-c592-490c-9d4f-f54cf2aee507/6a995189-0641-4c51-ba7e-6ad9946145ab |
| Plan canónico por fases | [version-final.md](version-final.md) (fuente = v29/panel-trabajo.html) |
| Boceto de trabajo aprobado | [panel-trabajo.html](../../design/panel-nutri/v29/panel-trabajo.html) (PR #174, en main) |
| Original v29 (NO tocar) | `design/panel-nutri/v29/PlanV-Boceto-v29.html` |
| Planes | [Parte 1](planes-v29-parte-1.md), [parte 2](planes-v29-parte-2.md), [parte 3](planes-v29-parte-3.md) y notas `planes-parte-3*.md` enlazadas abajo |
| Centro de ayuda | [centro-ayuda-v29.md](centro-ayuda-v29.md) |
| Equipo y Ajustes | [equipo-ajustes-v29.md](equipo-ajustes-v29.md) |
| Motion | [motion-v29.md](motion-v29.md) |
| Origen de este handoff | [PR #175](https://github.com/Facu42/plan-v/pull/175), en main |

## Qué ya está hecho

Todo lo siguiente está en main, con ok visual de Facu y squash-merge:

| Entrega | PR | Qué quedó |
|---|---|---|
| Tools v29 | [#176](https://github.com/Facu42/plan-v/pull/176) | `panel:v29` y `panel:contrato:v29` leen el boceto de trabajo; CSS e íconos nuevos sin pisar `panel-boceto.css` |
| Shell | [#177](https://github.com/Facu42/plan-v/pull/177) | Armazón, menú, tema y celular; raíz `#pv-panel-v29`, letra Inter |
| Seguimiento | [#178](https://github.com/Facu42/plan-v/pull/178) | Bandeja, comidas revisadas y pedido de registro por la app |
| Progreso | [#179](https://github.com/Facu42/plan-v/pull/179) | Cartera y evolución; sin datos inventados ni falta de registros marcada como incumplimiento |
| Asistente IA | [#180](https://github.com/Facu42/plan-v/pull/180) | Conversación, período, sugerencias y propuestas para revisar; nada se manda solo |
| Alimentos | [#181](https://github.com/Facu42/plan-v/pull/181) | Catálogo y alimentos propios; SARA 2 solo lectura |
| Biblioteca | [#182](https://github.com/Facu42/plan-v/pull/182) | Recursos y asignaciones; [verificación](biblioteca-v29-verificacion.md) |
| Planes 1 | [#183](https://github.com/Facu42/plan-v/pull/183) | Listado, filtros y botones |
| Planes 2 | [#184](https://github.com/Facu42/plan-v/pull/184) | Editor Día/Semana y pestañas del plan |
| Planes 3 | [#185](https://github.com/Facu42/plan-v/pull/185) | Asistente y publicación separada del borrador |
| Planes 3b | [#186](https://github.com/Facu42/plan-v/pull/186) | PDF real; [nota](planes-parte-3b-pdf-real.md) |
| Planes 3c | [#187](https://github.com/Facu42/plan-v/pull/187) | Guardar plantilla y copiar; [nota](planes-parte-3c-plantilla-copiar.md) |
| Planes 3d | [#188](https://github.com/Facu42/plan-v/pull/188) | Alcance (scope) y deshacer IA; [nota](planes-parte-3d-scope-deshacer.md) |
| Planes 3e | [#189](https://github.com/Facu42/plan-v/pull/189) | Armar con IA: Formato, Medidas e Incluir; [nota](planes-parte-3e-armar-ia.md) |
| Planes 3f | [#190](https://github.com/Facu42/plan-v/pull/190) | Mail, programar e impreso; [nota](planes-parte-3f-mail-programar-impreso.md). `plan_delivery` aplicada en prod con aval de Facu |
| Centro de ayuda | [#191](https://github.com/Facu42/plan-v/pull/191) | Buscador, guías, FAQ y pedido local; [nota](centro-ayuda-v29.md) |
| Equipo y Ajustes | [#192](https://github.com/Facu42/plan-v/pull/192) | Pantallas v29 y «Próximamente» donde falta soporte; [nota](equipo-ajustes-v29.md) |
| Motion panel v29 | [#193](https://github.com/Facu42/plan-v/pull/193) | Pastilla del menú, entradas, panel lateral y avisos; [nota](motion-v29.md). Squash `c4bdf96` |

## Qué NO hacer

- No mergear el HTML del boceto a `main` como frontend.
- No tocar `PlanV-Boceto-v29.html`.
- No WhatsApp.
- No usar Cloud Agent como default: solo con pedido de Facu o fallback cuando Codex no puede, incluida falta de cuota.
- No gastar créditos de Cursor Agent en código Plan V si se puede evitar; preferí Codex Sol 6.1.
- No migraciones a prod sin frase escrita de Facu. El aval de `plan_delivery` no autoriza otras migraciones.
- No inventar APIs/tablas.
- No pisar `panel-boceto.css` antes del marcado nuevo (archivos nuevos para tools).
- No inventar una interfaz que el boceto no dibuja.
- No mergear UI sin ok visual de Facu y capturas adjuntas al pedirlo.

## Próximo paso (pendiente — Facu eligiendo)

Secciones del boceto que en la app siguen viejas / no v29:

1. **Inicio** v29.
2. **Pacientes / ficha** v29.
3. **Dictar / Adjuntar** en Armar con IA (Planes 3g). Se saltó cuando Facu pidió Centro de ayuda.
4. **También en cola:** Mensajes, Agenda, Cobranzas y Recetas/Plantillas/Equivalencias como módulos propios si el boceto los dibuja aparte.

**27 oct, ~23:42 BA:** Facu mergeó #193 («si») y pidió seguir con Codex Sol 6.1. Se le ofreció widget Inicio / Pacientes-ficha / Dictar-Adjuntar. **Todavía no respondió.** Retomá preguntándole cuál sigue o con la opción que elija; ninguna quedó elegida por defecto.

## Bitácora

Las filas anteriores se conservan como historia: «sin juntar» describe el momento de cada entrada, no el estado actual de arriba.

| Cuándo | Qué | Quién |
|---|---|---|
| 27 oct | Inicio v29 en PR (rama `claude/project-thread-4ic2wy`), espera ok visual; [nota y plan de lo que falta](inicio-v29.md). | Claude |
| 27 oct | Handoff actualizado para retomar desde main `c4bdf96`: entregas cerradas, decisiones vigentes y próximo módulo a elección de Facu. Solo documentación. | Codex |
| 26–27 oct | Motion panel v29 en main por [#193](https://github.com/Facu42/plan-v/pull/193), Cloud Agent Grok 4.7 `bc-f265be57`; squash `c4bdf96`, con ok visual de Facu. | Plan V + Facu |
| 26 oct | Centro de ayuda [#191](https://github.com/Facu42/plan-v/pull/191) y Equipo/Ajustes [#192](https://github.com/Facu42/plan-v/pull/192) en main. Codex Sol se quedó sin cuota a mitad de Equipo/Ajustes; Cloud Agent Grok 4.7 `bc-36494eb5` lo cerró. | Codex + Cloud Agent + Facu |
| 26 oct | Planes 3b–3f [#186](https://github.com/Facu42/plan-v/pull/186)–[#190](https://github.com/Facu42/plan-v/pull/190) en main. Migración `plan_delivery` aplicada en prod `plan-v-app` con aval escrito de Facu. | Plan V + Facu |
| 26 oct | Planes, parte 3: se cerraron los seis huecos del boceto en el mismo [PR #185](https://github.com/Facu42/plan-v/pull/185). Panel del asistente, pantalla «Armar con IA», atajo, compartir, gestión y PDF con dos botones. Lo que no tiene atrás queda en «Próximamente». Sin juntar. | Cursor |
| 26 oct | Planes, parte 3: el asistente arma un borrador y publicar usa la API real. Nada llega a la paciente hasta esa confirmación. Programar la entrega queda en «Próximamente». [PR #185](https://github.com/Facu42/plan-v/pull/185), sin juntar. | Cursor |
| 26 oct | Planes, parte 1: el listado de `/crm/plan` copia la entrada del boceto. El editor de la semana y el asistente quedan para después. Sin juntar. | Cursor |
| 25 oct | Paridad de Alimentos en el [PR #181](https://github.com/Facu42/plan-v/pull/181), sin juntar. Facu rechazó la primera pasada. En gramos quedan las tres porciones del boceto y el origen se lee «SARA 2». SARA 2 no se edita. | Cursor |
| 25 oct | Alimentos en el [PR #181](https://github.com/Facu42/plan-v/pull/181), sin juntar. `/crm/alimentos` usa el dibujo del boceto con el catálogo que ya existía. SARA 2 no se edita. Un alimento propio sí. Suplementos y la fuente externa quedan afuera de esta pantalla. | Cursor |
| 25 oct | Asistente IA en el [PR #180](https://github.com/Facu42/plan-v/pull/180), ya en main. La pantalla copia el boceto: período, conversación, sugerencias y propuestas para revisar. Los números salen del asistente de cartera que ya existía. El gasto del mes no llega: «Sin dato» y tope US$ 5. Con la IA apagada no hay propuestas. Nada se le manda a la paciente. La letra del panel quedó en Inter, como el boceto. | Cursor |
| 25 oct | Fase 3 Progreso en el [PR #179](https://github.com/Facu42/plan-v/pull/179), ya en main: `/crm/progreso-global` usa el dibujo del boceto (cartera, filtros, orden y evolución al lado). Los números salen de `progress-global` y de la serie de peso que ya existía. La adherencia, la meta de peso y la grasa quedan en «Sin dato». Sin registros no es un incumplimiento. | Cursor |
| 25 oct | Fase 2 Seguimiento en [PR #178](https://github.com/Facu42/plan-v/pull/178), ya en main: `/crm/seguimiento` usa el dibujo del boceto con la bandeja, las comidas revisadas y el pedido por la app. Sin WhatsApp y sin tablas nuevas. | Cursor |
| 25 oct | Fase 1 shell en [PR #177](https://github.com/Facu42/plan-v/pull/177), ya en main: el armazón (menú, marca, buscador, cuenta, título, campana y el botón de Inicio) usa el boceto v29. Lo que el boceto dibuja y la app todavía no tiene queda vacío. Las pantallas de adentro no se redibujaron. Contrato en verde, claro y oscuro. | Cursor |
| 25 oct | El recorrido de sesiones firmadas no encontraba «Cerrar sesión»: está en el menú de la cuenta. El recorrido ahora abre ese menú. Misma rama del [PR #177](https://github.com/Facu42/plan-v/pull/177). | Cursor |
| 25 oct | Fase 0 tools en PR #176 (ya en main): css e íconos nuevos desde `panel-trabajo.html`. La letra y el celular quedan en la raíz nueva. | Cursor |
| 25 oct | Facu: ok-v29-valor; arranque Fase 0 tools vía Herdr Cursor | Plan V + Facu |
| 24–25 oct | Seis pantallas + diferenciación + evolución Progreso en PR #174 (ya en main) | Cursor agent `bc-cf297a92…` |
| 24 oct | Page del plan boceto→app | Plan V |
| 24 oct | Handoff creado (PR #175, ya en main) | Plan V |

## Cómo retomar (otro agente)

1. Leé este handoff, `design/panel-nutri/v29/panel-trabajo.html` y las notas del módulo que siga.
2. Partí de main `c4bdf96` o más nuevo. Las entregas #176–#193 ya están en main; no tomes los estados históricos de otras notas como pendientes actuales.
3. No redibujes el shell ni el motion que ya están en main.
4. Arrancá el módulo que Facu elija con Codex Sol 6.1. Si todavía no eligió, preguntale. Un PR por módulo, merge en espera y capturas adjuntas para su ok visual. Si tocás Planes, chequeá Comidas/Indicaciones/Compras/Versiones/Entrega (`ptabs2`). Facu mergea.
5. Actualizá esta bitácora al cerrar, con lo hecho y el commit/PR.
