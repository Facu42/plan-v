# Inventario src + modelo de datos v0

Fecha: 2026-08-30. Sin cloud agent. src/ no se mueve.

## Qué está vivo

Entrada: `src/main.tsx` → `App.tsx` → `PlanVExperience`.
CSS de producto: `src/plan-v.css` (Fraunces + DM Sans).
Toggle prototipo: Paciente | Nutricionista.

| Superficie | Componente | Shell CSS | Estado |
|---|---|---|---|
| App paciente | `PatientHome` | `.patient-shell` | Mock: menú del día, agua, check-in energía, foto→macros, nav Hoy/plan/camino/mensajes |
| Panel nutri (el que se ve) | `ReferenceDashboard` | `.crm-body` 177/284/1fr | 3 col CRM: menú + Mi seguimiento + ficha (rail, tabs, cards, gauge, timeline) |
| Panel overview | `NutritionistDashboard` | `.pro-shell` | **No se monta.** Código muerto. |

`PlanVExperience` en vista `pro` renderiza `ReferenceDashboard`, no `.pro-shell`. Chrome Dynamics ya pintado (2026-08-30): surface + mint-wash, lima en `:root`, rail cápsulas, gauge ticks SVG.

## Qué es leftover (no cablear)

- `src/components/ui/*` shadcn
- `src/styles/globals.css` + `src/index.css` (Tailwind v4 dump, primary #030213)
- CaloriesView, MacroCircle, MealSection, NutritionCarousel, WeeklyCalendar, Header, BottomNavigation — Figma Make, no importados por App
- `src/supabase/functions/server/*` — Hono + KV `kv_store_c98eafff`. Sin tablas de dominio. Auth no existe en el cliente.

No usar `globals.css` / `index.css` en el surface Plan V. Tokens de Lumen: `design/tokens-panel-nutri.css` (`--pv-lima: #EAFF78`).

## Modelo mínimo (Supabase, RLS)

Todo cuelga de `auth.users`. Vero = primer `nutritionists`. El paciente puede no tener user hasta el invite.

```
profiles
  id uuid PK = auth.users.id
  role  nutri | paciente
  full_name text
  avatar_url text

nutritionists
  id uuid PK
  user_id uuid unique → profiles
  license text null
  display_name text

patients
  id uuid PK
  nutritionist_id uuid → nutritionists  (tenant)
  user_id uuid null → profiles
  full_name text
  stage  ingreso | plan | seguimiento | alta   -- rail
  status text   -- Atención | Plan B | En ritmo (worklist)
  goal text
  sensitive_hours text
  plan_b text
  next_focus text
  adherence_score int  -- 0–100, gauge 7d (computed)
  adherence_why text   -- <=160, números y huecos; solo nutri
  created_at timestamptz

meal_slots  -- plan del día (menú)
  id uuid PK
  patient_id uuid → patients
  for_date date
  slot  desayuno | almuerzo | merienda | cena
  scheduled_time time
  title text
  detail text

meal_logs  -- foto → macros (contrato Savia)
  id uuid PK
  patient_id uuid → patients
  meal_slot_id uuid null → meal_slots
  photo_url text
  foods jsonb          -- [{name, portion_est}]
  macros jsonb         -- {kcal, protein_g, carbs_g, fat_g}
  confidence numeric   -- 0–1
  note_for_nutri text
  status  pending_review | confirmed | adjusted
  logged_at timestamptz

reminders
  id uuid PK
  patient_id uuid → patients
  kind  meal | water | sleep
  time_local time
  enabled bool

habit_logs
  id uuid PK
  patient_id uuid → patients
  kind  water | sleep | energy
  value text           -- "5/8", "baja", minutos sueño
  logged_at timestamptz

appointments
  id uuid PK
  nutritionist_id uuid → nutritionists
  patient_id uuid → patients
  starts_at timestamptz
  duration_min int
  channel  video | presencial
  status  scheduled | done | cancelled
  prep_note text

messages
  id uuid PK
  nutritionist_id uuid
  patient_id uuid
  author_id uuid → profiles
  body text
  suggested_by_ai bool default false
  sent_at timestamptz   -- null = borrador; el nutri confirma

ai_briefs
  id uuid PK
  nutritionist_id uuid
  patient_id uuid
  suggested_action text   -- mensaje | ajuste_menu | turno  (uno solo)
  up_next_title text      -- fijo según action
  up_next_body text       -- <=240, para Vero
  draft_message text null -- solo si mensaje; sent_at null hasta que Vero mande
  source_ids uuid[]
  status  pending_review | done | dismissed
  created_at timestamptz
  -- unique parcial: un pending_review por patient_id
```


## Bind ficha (Savia — `docs/contrato-ficha-cards.md`)

Sin card nueva. Las tres que ya están en Lumen:

| Card | Fuente | Regla |
|---|---|---|
| Up next | `ai_briefs` | Un `suggested_action` por paciente. No regenerar en cada foto. Ausente/dismissed = card vacía. El copiloto no reescribe `meal_slots` ni agenda turnos. |
| Gauge | `patients.adherence_score` | Ventana 7d. `comidas_ok` = `meal_logs` `confirmed`\|`adjusted` **y** `confidence ≥ 0.45`. `pending_review` y low no suman. Por qué en `adherence_why` (solo nutri). |
| Timeline | lectura de eventos | Union de `meal_logs`, `meal_slots` missed, `habit_logs`, `reminders`, `appointments`, `messages` con `sent_at`. El modelo **elige** el Up next mirando esas rows; **no las reescribe**. `note_for_nutri` no es evento. |

RLS: nutri solo ve `patients.nutritionist_id` propio. Paciente solo sus filas. Paciente no ve `ai_briefs`, `adherence_why`, `note_for_nutri`. `ai_briefs` y `messages.suggested_by_ai` nunca se envían solos. Gauge paciente (si se muestra) es el número, sin el por qué.

Fuera de v0: diagnóstico, receta, red social, marketplace, multi-consultorio.

## Orden de ingeniería

1. ~~Pintura CSS panel~~ hecho 2026-08-30 (`plan-v.css` + ticks en `PlanVExperience`).
2. Auth + estas tablas (no el KV). Cloud agent cuando Plan V dé luz.
3. Cablear las 3 cards al bind de arriba, sin card nueva, sin romper el prototipo visual.
