# MVP v0 — corte de producto

Fecha: 2026-08-30. Autor: Nexo. Aprobado para ingeniería cuando Plan V dé luz.
UI: no se rediseña. Layout, tokens y cards son ley de Lumen (`docs/design-system.md`, QA 30 ago PASA).
Contratos clínicos: ley de Savia (`contrato-foto-macros.md`, `contrato-ficha-cards.md`, `prompts-copiloto.md`, `limites-eticos.md`).
Modelo: `docs/inventario-y-modelo-v0.md`. Este archivo no inventa cards ni tablas de dominio salvo **pagos**.

## Tesis

v0 es el loop facturable de **una** profesional: Lic. Verónica Trenti cobra el acompañamiento mensual a **sus** pacientes. Plan V todavía no cobra a otros consultorios. El diferencial que justifica el cobro no es el expediente: es el copiloto (Up next + gauge + foto→macros con humano en el loop). Si Vero no puede invitar, cobrar, cargar un menú y abrir el día con “qué hacer con quién”, no es v0.

Un paciente de v0: paga (o Vero lo exceptúa), ve el menú y la lista de compras, carga foto + agua/sueño, recibe recordatorios y mensajes **de Vero**. Vero confirma fotos, manda (o descarta) el borrador del copiloto, ajusta el menú y agenda el turno. Nadie diagnostica. Nadie manda nada solo.

## Quién cobra qué

| Actor | Cobra | Cómo (v0) | Qué no |
|---|---|---|---|
| Vero → paciente | 1 SKU: **acompañamiento mensual** (ARS, monto que Vero carga) | Mercado Pago Checkout Pro (preferencia, pago del período) **o** marca manual (transferencia/efectivo) | Débito automático, cuotas, split marketplace |
| Plan V → consultorios | nada | — | SaaS, seats, white-label |

Monto: lo define Vero. Este doc no fija precio. Un solo SKU. Sin recetario, sin tripwire, sin pack de consultas adentro de la app.

Estados de cobro en `patients`:

- `waived` — Vero exceptúa (prueba, familia). App completa.
- `pending` — alta hecha, sin pago. App bloqueada salvo pantalla de pago + mensajes de Vero.
- `active` — `billing_until` ≥ hoy. App completa.
- `past_due` — período vencido. Misma pantalla de pago. Vero sigue viendo la ficha.

Renovación v0: el paciente paga el próximo período desde la app (o Vero reenvía el link). **No** preapproval / tarjeta guardada.

## Listo para cobrar (definición de hecho)

Un paciente real de Vero puede:

1. Recibir el invite y **pagar** (MP aprobado **o** Vero marca cobrado).
2. Ver el menú de la semana y una lista de compras derivada.
3. Cargar foto de una comida y verla como **estimación, pendiente de Vero**.
4. Cargar agua / sueño / energía y recibir recordatorios de comida/agua/sueño.
5. Chatear con Vero (humano).

Vero puede, el mismo día:

1. Alta + invite + link de pago (o waiver).
2. Cargar `meal_slots` de la semana.
3. Abrir ficha: Up next + gauge + timeline según contratos.
4. Confirmar o ajustar un `meal_log`.
5. Mandar (o descartar) el borrador de mensaje. El copiloto **no** envía.
6. Ver en Mi seguimiento quién está `pending` / `past_due` / `active` **sin card nueva** (chip o `status` de worklist ya existente).

Deploy Vercel + auth real son **cómo** se llega, no el producto. Sin esos dos, el loop no cobra.

---

## 1. Panel nutri

Superficie: `ReferenceDashboard` (CRM 3 col). `NutritionistDashboard` / `.pro-shell` no se monta.

### IN

- Auth de Vero (email mágico o password; un solo `nutritionists`).
- Mi seguimiento: lista de **sus** pacientes (seed Sofía / Marina / Lucía es demo; v0 son filas reales).
- Ficha: rail (`ingreso | plan | seguimiento | alta`), tabs, cards **ya pintadas**.
  - Up next ← `ai_briefs` (un `suggested_action`: `mensaje` | `ajuste_menu` | `turno`). Ausente/dismissed = card vacía.
  - Gauge ← `adherence_score` 7d + `adherence_why` (solo nutri).
  - Timeline ← eventos; el modelo no las reescribe.
- Confirmar / ajustar `meal_logs` (`pending_review` → `confirmed` | `adjusted`). Ver `note_for_nutri`.
- Mensajes: editar y **enviar** borradores `suggested_by_ai` (`sent_at` null → now). Escribir uno propio. Nunca auto-send.
- `ajuste_menu`: CTA abre el slot; Vero edita `meal_slots`. El copiloto no reescribe el menú.
- `turno`: Vero crea `appointments` (fecha, `video | presencial`, `duration_min`, `prep_note`, `meet_url` pegado). El copiloto no agenda.
- CTA Call de Lumen: abre `meet_url` del próximo turno `video`, o no-op si no hay. **No** WebRTC propio.
- Alta de paciente: nombre, email, goal; invite; link de pago o `waived`.
- CRUD `meal_slots` de la semana (desayuno / almuerzo / merienda / cena).
- Marca de cobro: `waived` / cobrado manual / reenviar preferencia MP.
- RLS: solo `nutritionist_id` propio.

### OUT

- Chatbot de IA al costado. Cards nuevas. Relationship Analytics.
- `.pro-shell`, shadcn leftover, Tailwind dump.
- Videollamada nativa, grabación, sala de espera, Calendly.
- WhatsApp, email marketing, plantillas masivas.
- Multi-nutri, roles admin/secretaria, consultorio.
- Historia clínica exportable, labs, peso como target, notas de diagnóstico.
- Editar `adherence_score` a mano. Regenerar brief en cada foto (corre al abrir ficha o al arrancar el día).
- Rediseño de layout, tokens o microcopy de Lumen.

---

## 2. App paciente

Superficie: `PatientHome` (shell ~470px, nav Hoy / plan / camino / mensajes). No otra app nativa.

### IN

- Invite + auth (el paciente puede no tener user hasta el invite).
- Paywall si `pending` | `past_due`: pagar MP o esperar a Vero. Mensajes de Vero **sí** se ven (cobranza / “te exceptué”).
- **Hoy:** menú del día (`meal_slots`), CTA foto, agua, check-in de energía.
- **Plan:** menú de la semana (lectura).
- **Lista de compras:** union de `title` + `detail` de los `meal_slots` de la semana en curso. Check local. No hay supermercado ni precios.
- **Camino:** número de adherencia **sin** `adherence_why`; sus `meal_logs` y `habit_logs`. Sin juicio (“comiste mal / bien”).
- **Mensajes:** thread con Vero. No ve borradores ni `suggested_by_ai` no enviados.
- Recordatorios `meal | water | sleep` (`reminders.time_local`). In-app; notification del browser si el permiso está.
- Foto → macros según contrato (abajo).
- Gauge paciente (si Lumen lo muestra): el número, nunca el por qué.

### OUT

- Editar JSON de macros (v1). Cargar comida sin foto.
- `note_for_nutri`, `ai_briefs`, `adherence_why`, bandas internas, sugerencias de acción.
- Peso, circunferencias, fotos de cuerpo, labs, recetas comunitarias.
- Chat con la IA. Red social. Marketplace. Push WhatsApp/SMS.
- Onboarding de marketing, reto 7 días, kit/recetario adentro de la app.
- App store nativa (v0 es web paciente, mismo deploy).

---

## 3. Foto → macros

Contrato: `docs/contrato-foto-macros.md`. Acá solo el corte de producto.

### IN

- Paciente sube **una foto** (obligatoria). Match opcional a `meal_slot_id`.
- IA inserta `meal_logs` **solo** `pending_review`. `foods`, `macros` {kcal, protein_g, carbs_g, fat_g}, `confidence` 0–1, `note_for_nutri`.
- Paciente ve: foto, alimentos, macros como “estimación, pendiente de Vero”.
- Nutri ve: todo + nota + desvío vs slot. Confirma o ajusta.
- `confidence < 0.45`: no entra al gauge. Macros no se usan para adherencia.
- Una foto **no** dispara `ai_briefs`. El brief del día puede decir “N fotos sin revisar”.
- Storage de la foto. RLS: paciente no selecciona `note_for_nutri`.
- v0: **no** entrenar modelos con fotos de pacientes.

### OUT

- Diagnóstico, “está bien/mal para tu condición”, receta, cambio de menú automático.
- Fibra, micros, score de ultraprocesados, marcas, alérgenos como diagnóstico.
- Auto-`confirmed`. Mensaje automático al paciente post-foto.
- `discarded` como estado (v0: se deja pending o Vero borra a mano).
- Guardar JSON original post-ajuste (`ai_foods` / `ai_macros` es v1).

---

## 4. Pagos

Tabla nueva (única extensión al modelo v0). El resto de tablas no se tocan.

```
payments
  id uuid PK
  patient_id uuid → patients
  nutritionist_id uuid → nutritionists
  provider  mercadopago | manual
  amount_ars int
  currency  ARS
  status  pending | approved | refunded | rejected
  period_start date
  period_end date          -- inclusive; v0 = 30 días
  mp_preference_id text null
  mp_payment_id text null
  created_at timestamptz
  approved_at timestamptz null
```

En `patients` (columnas, no tabla nueva): `billing_status`, `billing_until`.

### IN

- Vero carga el monto ARS del SKU (dato de `nutritionists` o config de un renglón; no un catálogo).
- Crear preferencia MP Checkout Pro a nombre de **la cuenta de Vero** (plata a Vero, no a Plan V).
- Webhook `payment.updated` → `approved` setea `billing_status=active` y `billing_until=period_end`.
- Marca manual: Vero elige período y queda `approved` / `provider=manual`. Sin comprobante AFIP.
- Reenviar link. Ver último pago en ficha **sin card nueva** (línea en timeline `kind` no clínico, o chip de worklist).
- Paciente: botón pagar en el paywall. Success / failure / pending MP.
- Waiver explícito de Vero.

### OUT

- Stripe, PayPal, cripto.
- Suscripción MP / tarjeta en archivo / débito automático.
- Split / marketplace / comisión de Plan V.
- Factura electrónica AFIP, IVA discriminado, PDF.
- Prorrateo, descuentos, cupones, planes anuales, 2 SKUs.
- Cobrarle a Vero (SaaS). Multi-cuenta MP.
- Mostrar el pago como “indicador clínico”.

Copy del paywall: acompañamiento con Vero, no “compra de IA médica”. Sin promesas de resultado (Ley 24.301 / 13.272).

---

## Flujos (los 4 que tienen que cerrar)

1. **Alta → cobro → app.** Vero da de alta → invite + preferencia (o waiver) → paciente paga → ve Hoy.
2. **Menú → compras → recordatorio → foto.** Vero carga la semana → paciente ve plan + lista → recordatorio → foto `pending_review`.
3. **Foto → ficha → Up next.** Nutri confirma/ajusta → al abrir ficha o al arrancar el día, un solo Up next. Gauge sin pending ni `confidence < 0.45`.
4. **Up next → acto de Vero.** `mensaje` se envía solo si ella manda; `ajuste_menu` ella edita el slot; `turno` ella agenda y pega el link. CTA Call abre ese link.

Si uno de los cuatro no se puede hacer con un paciente pago, v0 no cierra.

---

## Criterios de éxito (QA, no opinión)

1. Lumen QA del panel **sigue PASA** (3 col, lima, rail, tabs, Up next, gauge). Cero cards nuevas.
2. Insertar `meal_log` con `status != pending_review` desde el pipeline de IA = bug.
3. `confidence < 0.45` no mueve `adherence_score`.
4. Paciente no lee `note_for_nutri`, `ai_briefs`, `adherence_why`, ni `messages` con `sent_at` null.
5. `suggested_action` inválida → no hay fila `ai_briefs`.
6. Un `payment.approved` (MP o manual) deja `billing_status=active` y destapa la app; `pending`/`past_due` no.
7. Vero cobra un peso real (sandbox MP primero, después live) a una cuenta suya.
8. RLS: nutri A no ve pacientes de nutri B (aunque v0 sea un solo nutri).
9. Cero diagnóstico / fármaco / suplemento / “riesgo clínico” en copy generado (`limites-eticos.md`).
10. Seed demo (Sofía, Marina, Lucía) no se va a producción como pacientes de cobro.

## Fuera de v0 (global)

Diagnóstico automático, receta médica, suplementos, red social, marketplace, multi-consultorio, SaaS a terceros, WhatsApp, videollamada propia, app nativa stores, labs, peso-target, chatbot, entrenamiento con fotos de pacientes, factura AFIP, débito automático.

## Orden (Forge, cuando Plan V dé luz de cloud agent)

1. Auth + tablas del inventario + `payments` / `billing_*`. No el KV.
2. Bind de las 3 cards. Sin card nueva.
3. Pipeline foto→macros según contrato.
4. Checkout Pro + webhook + paywall.
5. Deploy Vercel. Seed **no** es producción.

Savia no reabre contratos para v0. Lumen no pinta pantallas nuevas: paywall y chip de cobro reutilizan shell / badge existentes; si hace falta un estado visual, es un chip en la worklist, no una card.
