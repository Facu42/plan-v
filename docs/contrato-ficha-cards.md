# Contrato: brief de ficha → cards Lumen

Fecha: 2026-08-30. Plan V (CEO) aprobó foto→macros como ley (`pending_review`, umbral 0.45, `note_for_nutri` oculta al paciente) y pidió este mapeo. No es UI: Lumen no cambia layout. Savia dice **qué dato entra en cada card que ya existe**.

Fuente visual: `design/gap-panel-nutri.md` (Dynamics → Plan V).

| Card Lumen (ya existe) | Producto | Qué pone el copiloto |
|---|---|---|
| Up next | Próxima acción | `ai_briefs.suggested_action` + copy corto |
| Lead score / Grade A | Gauge de adherencia | `patients.adherence_score` + por qué |
| Timeline | Timeline clínico | eventos de `meal_logs`, `habit_logs`, recordatorios, turnos |

No se inventan cards. Relationship Analytics / vínculo queda fuera de v0 del copiloto.

## 1. Up next ← `ai_briefs`

Una fila `ai_briefs` `pending_review` por paciente, al abrir ficha o al arrancar el día del nutri. No se regenera en cada foto.

```json
{
  "suggested_action": "mensaje",
  "up_next_title": "Mandarle un mensaje",
  "up_next_body": "Ayer no cargó el almuerzo y el agua quedó en 3/8. Un toque corto, no un sermón.",
  "draft_message": "Hola, vi que ayer se te escapó el almuerzo. ¿Lo resolvemos con el Plan B o lo pasamos a hoy?",
  "source_ids": ["…meal_log", "…habit_log"]
}
```

`suggested_action` ∈ `mensaje` | `ajuste_menu` | `turno`.

| action | `up_next_title` (fijo) | CTA de la card (Lumen ya tiene CTA negra) |
|---|---|---|
| `mensaje` | Mandarle un mensaje | Confirmá / editá y mandá. `messages.suggested_by_ai`, `sent_at = null` hasta que Vero mande. |
| `ajuste_menu` | Ajustar el menú | Abrir el slot. El copiloto **no** reescribe `meal_slots` solo. |
| `turno` | Proponer un turno | Prep note. No agenda solo. |

Reglas:
- Un solo Up next a la vez. Si hay varios problemas, el modelo elige **uno** (el que desbloquea el día).
- `up_next_body` ≤ 240 caracteres, tono profesional rioplatense, para Vero. Cero diagnóstico, cero fármacos, cero “está en riesgo clínico”.
- `draft_message` solo si action = `mensaje`. Habla como Vero, no como la IA. No interpreta macros como juicio al paciente.
- Si no hay nada accionable: no se fabrica un Up next. Card en estado vacío (eso es UI de Lumen; el contrato es `ai_briefs` ausente o `dismissed`).

## 2. Gauge ← `patients.adherence_score`

Entero 0–100. No es un índice médico. No se llama “riesgo” en copy hacia el paciente. En ficha nutri puede leerse “adherencia”.

v0, simple:

```
score = round(100 * (
  0.50 * comidas_ok / comidas_planificadas
+ 0.25 * dias_con_agua / dias_ventana
+ 0.25 * dias_con_sueño / dias_ventana
))
```

Ventana: últimos 7 días (o desde `created_at` si es más corta).

`comidas_ok`: `meal_logs` con `status` ∈ `confirmed` | `adjusted` **y** `confidence ≥ 0.45` (los `pending_review` y los `low` no suman). Denominador: `meal_slots` de esos días.

Si no hay slots planificados, el término comidas no puntúa (no inflar con 100). Agua/sueño: presencia de `habit_logs` ese día, no el valor “perfecto”.

El gauge necesita un **por qué** (microcopy, no un diagnóstico):

```json
{
  "adherence_score": 62,
  "adherence_why": "4 de 7 almuerzos confirmados. Agua cargada 3/7 días. Sueño ayer no está."
}
```

`adherence_why` ≤ 160 caracteres. Números y huecos. Nunca “paciente no cumplidor”, “riesgo de recaída”, “sospecha de TCA”.

## 3. Timeline ← eventos, no un párrafo

El brief **no** pinta la timeline. Empuja hechos. Lumen ya tiene el riel.

Tipos v0 (id estable para no duplicar):

| `kind` | Fuente | Título (nutri) | Cuerpo |
|---|---|---|---|
| `meal_logged` | `meal_logs` | slot + estado | macros solo si `confirmed`/`adjusted` y confidence ≥ 0.45; si no, “foto en revisión” o “estimación floja” |
| `meal_missed` | `meal_slots` + no hay log y `scheduled_time` ya pasó | “Sin registro” | slot y hora |
| `habit` | `habit_logs` | agua / sueño / energía | `value` crudo |
| `reminder_fired` | `reminders` disparado | recordatorio | kind + hora. Alimenta el resumen; no es un nag al nutri |
| `appointment` | `appointments` | turno | canal + estado |
| `message` | `messages` con `sent_at` not null | mensaje | no incluir borradores `suggested_by_ai` |

Orden: `at` desc. El copiloto no inventa eventos que no estén en esas tablas. `note_for_nutri` **no** es un evento de timeline (vive en la foto, en ficha al abrir el log).

## Qué no va a ninguna de las tres

- Diagnóstico, receta, suplementos, interpretación de labs.
- `note_for_nutri` al paciente (ley).
- Un chat de IA al costado. El diferencial es estas tres cards, no un LLM flotando.
- Regenerar el brief en cada keystroke.

## Criterios de hecho

1. `suggested_action` inválida → no insertar `ai_briefs`.
2. Up next y gauge se pueden calcular con el mismo pull; la timeline es lista de rows, no output del LLM (el modelo **elige** el Up next mirando esas rows, no las reescribe).
3. Paciente: no ve `ai_briefs`, no ve `adherence_why`, no ve `note_for_nutri`. Gauge del paciente (si Lumen lo muestra) es el número, sin el por qué clínico.
4. Sin diagnóstico en `up_next_body`, `adherence_why`, `draft_message`, títulos de timeline.

Prompt largo del modelo: `prompts-copiloto.md` (en curso). Este archivo es el contrato de slots.
