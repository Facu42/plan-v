# Registro vivo — Plan V listo para usar de verdad

Pedido de Facundo (2026-09-28): analizar lo que dejó el otro agente y seguir hasta que el
producto sea funcional para competir en el mercado, registrando siempre avances y análisis.
Este archivo se actualiza en cada paso. Lo lee cualquier agente que siga (local o en la nube).

Rama de trabajo: `claude/plan-v-listo-mercado-2qxnln` (sale de `main` @ `d2251fa`).

## Criterio de prioridad

Primero lo que impide que una nutricionista y una paciente lo usen de punta a punta en
producción; después los detalles visuales finos de la auditoría Figma. El diseño sigue
siendo exacto al .fig de Nutrigo (ver `design/nutrigo-fidelity.md`).

## Estado de las líneas de trabajo (2026-09-28)

| Línea | Dónde | Estado |
| --- | --- | --- |
| Pase Nutrigo escritorio + móvil, shell, issue #7 | `main` (release 2026-09-24) | En producción |
| Mapeo móvil desde Figma MCP (pv46) | `codex/pv46-figma-mobile` | Sin mergear, 3 commits sobre main |
| Contenido de ejemplo del modo demo | `claude/project-thread-7h8rax` | Sin mergear |
| Consejos, detalle de consejo, ficha de receta y auditoría del 27/09 | PC de Facundo (`docs/auditoria-figma-mcp-2026-09-27.md`) | **No está en GitHub.** Pedido: subirlo a `codex/pv47-recetas-consejos`. Reporta 609 pruebas: parte de una base más vieja que main (871). |

## Análisis de producción (2026-09-28)

Fuentes: logs HTTP de Railway (servicio `api`), tablas y funciones de Supabase `plan-v-app`,
código de `main`. Hay uso real desde iPad/iPhone (paciente vinculada).

Hallazgos, por impacto:

1. **Cada comida registrada por la paciente devolvía error 500**, aunque quedaba guardada.
   Causa: después de guardar, el servidor escribe un evento en la línea de tiempo con el
   usuario de la paciente y RLS sólo deja escribir a la profesional (regla RLS-11, deliberada).
   Evidencia: `POST /meals/analyze` 500 el 2026-09-25 02:06 y fila `meal_logs` de esa hora
   guardada con `analysis_status=failed`. **Arreglado**: el evento pasa a ser "si se puede"
   (`sbAddTimelineEventBestEffort`), también en turnos.
2. **Receta asignada a un día y "Registrar esta comida"**: `GET /recipe-days` 501 en
   producción. No existía el SQL (`assign/list/register_recipe_day`). **Escrito** en
   `20260928120000_recipe_cards_days.sql`, probado en PGlite.
3. **Recetas con macros declarados**: en producción la ruta cortaba con 501 (la ficha vivía
   sólo en memoria). **Arreglado** con `recipe_version_cards` + `set_recipe_card` (misma migración).
4. **Paciente nueva queda bloqueada para siempre**: nace con acceso `pending` y la ruta para
   habilitarla respondía 501; además la pantalla de Pacientes (Nutrigo) no tenía control.
   **Arreglado**: `set_patient_billing` (`20260928130000_patient_access.sql`) y en "Editar"
   se elige Pendiente / Sin cargo / Pagado hasta una fecha.
5. **La paciente no tenía cómo llegar a su invitación**: no sale mail y la app no mostraba el
   enlace. **Arreglado**: al crear la paciente (y con el botón "Invitar" si todavía no tiene
   cuenta) se muestra el enlace con "Copiar enlace" y "WhatsApp". `POST /api/patients/:id/invite`
   reusa la invitación vigente o abre una nueva si venció o se revocó.
6. **Módulos sin instalar en la base de producción**: compras, adjuntos del chat, avisos,
   ejercicios, recursos editoriales, organizaciones. Las migraciones existen en el repo
   (`20260921280000`…`20260921340000`) pero no se aplicaron a `plan-v-app`, así que esas
   pantallas responden 501. **Pendiente de la decisión de Facundo** (tarjeta en el hilo).

## Pendientes conocidos (siguiente)

- Aplicar a producción las migraciones pendientes + las dos nuevas (con el OK de Facundo),
  y publicar el código (merge a `main`).
- Alta de nutricionistas: hoy sólo por operador (`/api/ops/nutritionists` con secreto); el
  registro público crea cuentas de paciente. Para salir al mercado hace falta alta propia
  con período de prueba. Decisión de producto abierta.
- Archivar paciente en producción sigue en 501 (falta columna revisada).
- Mails reales (invitación, avisos): sin proveedor. Hoy se comparte el enlace a mano.
- Cobro dentro de la app (Mercado Pago): fuera de alcance del piloto gratuito.
- Integrar `codex/pv46-figma-mobile`, `claude/project-thread-7h8rax` y el trabajo local de
  Consejos/recetas cuando llegue a GitHub.
- Backlog visual de la auditoría del 27/09 (iconos, textos, imágenes, estados).

## Verificación

| Fecha | Qué | Resultado |
| --- | --- | --- |
| 2026-09-28 | `npm test` en main | 871 OK, 2 omitidas |
| 2026-09-28 | `npm test` en la rama | 877 OK, 2 omitidas |
| 2026-09-28 | `npm run check`, `check:migrations` | OK |
| 2026-09-28 | Recorrido demo 1440 paciente (10 pantallas) y nutricionista (15) | Sin errores de API ni de página |
| 2026-09-28 | Alta de paciente → enlace → habilitar acceso (demo, navegador) | OK |
