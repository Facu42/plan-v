# Contrato: foto → macros (`meal_logs`)

Fecha: 2026-08-30. Ancla: `docs/inventario-y-modelo-v0.md`. No toca UI (Lumen) ni tablas nuevas (Forge ya las nombró). Savia cierra el JSON y las reglas de uso.

## Qué es (y qué no)

El paciente sube una foto de una comida. El copiloto **estima** alimentos y macros, escribe una nota para el nutri y deja el registro en `pending_review`. El profesional confirma o ajusta. **Nunca** es verdad clínica hasta `confirmed` o `adjusted`.

No es diagnóstico. No es receta. No es “está bien / está mal para tu condición”. No se envía solo al paciente como juicio. No cambia el menú solo.

## Fila `meal_logs` (v0)

Campos ya definidos por Forge. Savia fija semántica y forma del JSON.

| Campo | Tipo | Quién escribe | Semántica |
|---|---|---|---|
| `id` | uuid | sistema | PK |
| `patient_id` | uuid | sistema | tenant del nutri vía `patients` |
| `meal_slot_id` | uuid null | app, si hay match | slot del menú del día; null si es extra |
| `photo_url` | text | storage | obligatoria en v0; sin foto no hay log de este tipo |
| `foods` | jsonb | IA, nutri puede ajustar | ver schema abajo |
| `macros` | jsonb | IA, nutri puede ajustar | ver schema abajo |
| `confidence` | numeric 0–1 | IA | confianza **global** del plato, no el promedio ciego de ítems |
| `note_for_nutri` | text | IA | 1–3 oraciones, para el profesional. Nunca para el paciente tal cual |
| `status` | enum | ver flujo | `pending_review` \| `confirmed` \| `adjusted` |
| `logged_at` | timestamptz | sistema | momento de la carga (no el scheduled_time del slot) |

La IA **nunca** setea `confirmed` ni `adjusted`. Solo inserta `pending_review`.

### `foods[]`

```json
[
  {
    "name": "arroz blanco",
    "portion_est": 150,
    "portion_unit": "g",
    "confidence": 0.64
  }
]
```

- `name`: nombre culinario en español rioplatense, minúsculas salvo nombres propios. Preferir lo que el nutri reconocería (“milanesa de pollo”, no “poultry cutlet”).
- `portion_est`: número. Si no se puede estimar, omitir el ítem o dejar `portion_est: null` y bajar `confidence` del ítem y del plato.
- `portion_unit`: v0 solo `"g"` o `"ml"` o `"u"` (unidad: 1 huevo, 1 medialuna). Casa (“1 taza”) se convierte a g/ml con estimación y se declara en `note_for_nutri` si la conversión es floja.
- `confidence`: 0–1 de **ese** ítem (detección + porción).
- Máximo 8 ítems. Salsas, aceite y pan de acompañamiento van como ítems si se ven o si es razonable asumirlos; si se asumen, `confidence` del ítem ≤ 0.4 y se menciona en la nota.
- Prohibido: marcas, claims de salud, alérgenos como diagnóstico (“esto es sin TACC” salvo que el pack se lea con claridad).

### `macros`

```json
{ "kcal": 420, "protein_g": 18, "carbs_g": 55, "fat_g": 12 }
```

Enteros. Suma de ítems, no un número mágico del plato. Si un ítem no tiene porción, no aporta macros (sí puede aparecer en `foods`). `kcal` tiene que ser coherente con P/C/G (×4/4/9) ±10%; si no cierra, bajar `confidence` global y decirlo en la nota.

Fuera de v0: fibra, micronutrientes, “calidad” del plato, score de ultraprocesados.

### `confidence` global y bandas

La global **no** es el promedio de los ítems. Baja si: plato mixto, foto oscura/lejos/ángulo cenital malo, líquidos, salsas, aceite no visible, pack ilegible, más de un plato, mano tapando, filtro.

| Banda | Rango | Qué puede hacer el producto |
|---|---|---|
| `high` | ≥ 0.75 | Mostrar macros en ficha como **estimación**. Sigue `pending_review`. |
| `medium` | 0.45–0.74 | Mostrar macros + badge de duda. La nota es obligatoria. |
| `low` | < 0.45 | Mostrar alimentos detectados si hay. **No usar macros para adherencia ni para el gauge.** Nota obligatoria: por qué no sirve. |

Las bandas no se persisten: se derivan de `confidence`. Forge no suma columna.

## `note_for_nutri`

Una nota útil, no un resumen de macros (eso ya está en el JSON). Contesta: ¿qué tiene que mirar Vero?

Plantilla mental (no literal):
1. Qué se ve con ganas vs qué se adivina.
2. Qué puede estar sub/sobreestimado (grasa, hidratos, porción).
3. Si hay match o desvío vs el `meal_slot` del día (si vino `meal_slot_id`).

Prohibido en la nota: diagnosticar, sugerir fármacos, “debería hacer ayuno”, tono de coach al paciente. Sí puede: “no coincide con el almuerzo planificado (milanesa); parece pasta con salsa)”.

## Flujo de estado

```
insert IA → pending_review
                 ├─ nutri OK sin tocar JSON     → confirmed
                 ├─ nutri edita foods/macros    → adjusted
                 └─ nutri descarta (v0: no hay discarded; se deja pending o se borra a mano)
```

- `confirmed`: el JSON de la IA se considera aceptado.
- `adjusted`: el JSON **después** del edit del nutri es la fuente de verdad. Guardar el original no es v0 (si hace falta, se agrega `ai_foods` / `ai_macros` después).
- Adherencia y `ai_briefs` solo cuentan `confirmed` | `adjusted`, salvo el brief del día que **sí** puede mencionar pendientes (“3 fotos sin revisar”).

## Qué ve cada uno

| Superficie | Ve | No ve |
|---|---|---|
| App paciente | Foto, alimentos (editables por el paciente en v1, no v0), macros como “estimación, pendiente de Vero”, slot | `note_for_nutri`, bandas internas, sugerencias de acción, juicios |
| Ficha nutri | Todo + nota + banda + desvío vs slot | Mensajes automáticos al paciente |

v0 paciente: carga foto, no edita el JSON. Si quiere aclarar, va por mensaje (humano).

## Entrada al modelo de visión

Contexto **permitido** (y suficiente):

- imagen
- `slot`: desayuno \| almuerzo \| merienda \| cena \| extra
- `scheduled_title` / `scheduled_detail` del `meal_slots` si hay match
- hora local del `logged_at`

Contexto **prohibido** v0: diagnósticos, medicación, labs, peso como target clínico, notas privadas del nutri, chats previos.

Salida: **solo** JSON válido (foods + macros + confidence + note_for_nutri). Nada de markdown, nada de disclaimers legales en el JSON (van en producto, no en cada fila).

## Cómo alimenta el copiloto (`ai_briefs`)

Una foto sola no dispara un brief. El brief del día (o al abrir la ficha) agrega:

- N fotos `pending_review`
- desvíos vs `meal_slots` (solo logs confirmados/ajustados, más un renglón de pendientes)
- hábitos del día (`habit_logs` agua/sueño/energía)
- recordatorios no cumplidos (slot con hora pasada y sin `meal_log`)

`suggested_action` ∈ `mensaje` | `ajuste_menu` | `turno`. El mensaje sugerido vive en `messages` con `suggested_by_ai = true` y `sent_at = null`. **Nadie manda nada sin el nutri.**

## Criterios de hecho (para Forge / QA)

1. Insertar un `meal_log` con `status != pending_review` desde el pipeline de IA es bug.
2. `confidence < 0.45` no entra al cálculo de `adherence_score`.
3. `note_for_nutri` vacía está prohibida si `confidence < 0.75`.
4. `macros` incompletos (falta una clave) → rechazar el output del modelo y reintentar una vez; si falla, guardar foods si hay, macros null, confidence 0.2, nota “no pude estimar macros”.
5. RLS: el paciente no lee `note_for_nutri` (columna out of select para rol paciente, o vista).

## Fuera de este contrato

UI, tokens, captura de cámara, storage bucket, el prompt largo de ficha/check-in (van en `prompts-copiloto.md`), límites legales citados (`limites-eticos.md`).
