# Spec: suscripciones de pacientes con Mercado Pago (Plan V)

Versión 1 · 19/10/2026. Las preguntas P1–P10 quedaron cerradas el 19/10 (sección 7.3). El backend de esta rama sigue esas decisiones. La migración se escribe y **no se aplica**; no se toca Railway, Supabase de producción ni Mercado Pago.
Base leída: `plan-v` en `origin/main` 6697d28 y `plan-v-fase5` en `cursor/panel-nutri-fase-5` (PR #153, 0a485ad). También se miró `codex/panel-nutri-fase-4` (7444eae) para la ficha. El 20/10 se trajo `origin/main` `f51f413` sin rebase: la fase 5 sigue integrada y el contrato de esta spec no cambia. Las correcciones visuales del boceto están en el PR #158, no en esta rama.

---

## 0. Resumen en 10 líneas

1. Cada nutri cobra a sus pacientes **con su propia cuenta de Mercado Pago**. La plata entra directo a su cuenta y Plan V no toca dinero.
2. Hay dos formas de cobrar: **(a) débito automático mensual** de un "plan de seguimiento" (lo nuevo) y **(b) consulta suelta** con seña/saldo por Checkout Pro (ya existe, no cambia).
3. Para (a) usamos **suscripciones de Mercado Pago sin plan asociado y con pago pendiente** (`POST /preapproval` con `status: "pending"`): una por paciente, creada con el token OAuth de la nutri. Mercado Pago devuelve un link (`init_point`) y la paciente carga su medio de pago ahí. No tocamos datos de tarjeta.
4. El "plan de seguimiento" (nombre, precio, qué incluye) se guarda **en Plan V**, no como `preapproval_plan` en Mercado Pago, porque las suscripciones con plan asociado obligan a mandar `card_token_id` (o sea, a tokenizar la tarjeta nosotros).
5. **La app "Plan V" que ya existe sirve** (mismo Client ID, mismo OAuth, mismos tokens y la misma URL de avisos con "Planes y suscripciones" tildado). No hace falta crear otra app ni pedir a las nutris que vuelvan a conectar, salvo que la prueba en sandbox muestre lo contrario.
6. Lo que **sí** falta en el servidor: hoy solo existe `/api/public/scheduling/mp/webhook/:nutritionistId`. La URL general de la app (`.../mp/webhook/`, sin id) **no tiene ruta** y los avisos de suscripciones que lleguen ahí reciben 404, así que Mercado Pago los reintenta para siempre.
7. Los avisos de suscripción llegan a la URL general (la suscripción no acepta `notification_url` propia). Se reparten a la nutri correcta con `user_id` del aviso (= `account_id` de `scheduling_integrations`) y después con nuestro `external_reference`.
8. Cada cobro aprobado se anota solo en Cobranzas como pago confirmado "Mercado Pago · débito automático", así los números de la fase 5 cierran sin otra cuenta aparte.
9. Los avisos van **dentro de la app**: bandeja de Inicio y Cobranzas para la nutri, push genérico y tarjeta en Pagos para la paciente. Sin WhatsApp.
10. Reparto (decisión P10): Cursor hace el backend en `cursor/suscripciones-pacientes-backend` y, en otras ramas, las pantallas. La prueba en sandbox de Mercado Pago (sección 6.3) sigue pendiente y no bloquea este backend: queda apagado hasta que Facu la corra y prenda la bandera.

---

## 1. Objetivo y alcance

### 1.1 Objetivo
Que la nutri pueda cobrar su seguimiento mensual sin perseguir a nadie: arma su plan una vez, se lo manda a la paciente o lo publica, la paciente lo activa con su tarjeta en Mercado Pago y después se cobra solo cada mes. La nutri ve en Cobranzas y en la ficha quién está al día, a quién le rebotó el pago y quién canceló.

### 1.2 Qué entra
- Planes de seguimiento de la nutri: crear, editar, archivar, mostrar o no en su Página pública.
- Activar el débito automático para una paciente: desde la ficha, desde el chat, desde la Página pública o desde la app de la paciente (Pagos).
- Estados visibles en Cobranzas y en la ficha: esperando el primer pago, activa, en pausa, pago rechazado (reintentando o rechazado final), cancelada, link vencido.
- Pausar, reanudar y cancelar desde el panel. Cambio de precio con aviso.
- Cada cobro aprobado se registra solo en el libro de Cobranzas (`patient_payments`). Las devoluciones y contracargos lo anulan.
- Webhook general de la app, ruteo a la nutri, idempotencia, conciliación manual (botón) y automática (worker).
- Avisos dentro de la app (bandeja, push genérico, tarjetas).
- Pruebas automáticas y prueba con cuentas de prueba de Mercado Pago.

### 1.3 Qué no entra
- **El cobro de Plan V a las nutris** (admin ↔ nutri). Eso es `nutritionist_subscriptions`, `service_payments` y `/admin`; no se toca y no se reutiliza (ver 3.1).
- Comisión de Plan V sobre los cobros de las pacientes. La API de suscripciones no tiene `marketplace_fee` ni `application_fee`; eso existe solo en Checkout Pro (`marketplace_fee`) y Checkout API (`application_fee`) [F7][F6].
- WhatsApp y correo. Los avisos van por la app (decisión 11/10 y 19/10).
- Facturación electrónica (AFIP). Mercado Pago le manda el comprobante de pago a la paciente; la factura sigue siendo cosa de la nutri.
- Tokenizar tarjetas en Plan V (Card Payment Brick / Checkout API). Queda como opción futura (ver 3.10).
- Cambios en la consulta suelta: seña/saldo con Checkout Pro sigue igual (`scheduling_checkout_intents`, `createMpPreference`, `applyVerifiedPayment`).

---

## 2. Flujos

### 2.1 La nutri crea un plan de seguimiento
1. Cobranzas → botón **«Planes de seguimiento»** (o Página pública → tarjeta «Planes de seguimiento» → «Nuevo plan»).
2. Completa: **Nombre** (ej. "Seguimiento mensual"), **Precio** en pesos enteros, **Cada cuánto se cobra** (Mensual; Trimestral si Facu lo aprueba, ver P3), **Qué incluye** (texto corto, ej. "2 consultas online, plan semanal y chat"), **Prueba gratis** (opcional, apagada hasta confirmar en sandbox, ver 3.10 y P2) y **Mostrar en mi página pública** (sí/no).
3. Al guardar se crea el plan en Plan V y también una fila en `nutritionist_programs` con el mismo nombre y monto, así el plan aparece en «Programas activos» de Cobranzas. No se llama a Mercado Pago en este paso.
4. Si no tiene Mercado Pago conectado, puede crear el plan igual, pero el botón para activar el débito dice «Conectá Mercado Pago para cobrarlo con débito automático».

### 2.2 Ofrecer el plan a una paciente

**A. Desde la ficha (pestaña Cobros) o desde Cobranzas**
1. «Activar débito automático» → elige el plan → confirma el **correo de la cuenta de Mercado Pago de la paciente** (viene cargado con el correo de la ficha, se puede cambiar).
2. Plan V crea la suscripción en Mercado Pago (`POST /preapproval`, `status: pending`, con `payer_email`, `external_reference` = id nuestro, `reason` = nombre del plan, `auto_recurring` con monto y frecuencia, `back_url`) usando el token de la nutri.
3. Aparece el link con dos botones: **«Enviar por el chat»** (botón principal) y «Copiar link».
4. «Enviar por el chat» manda un mensaje normal de la nutri. Le llega el push genérico de mensaje que ya existe.

**B. Desde el chat**
En el chat de la paciente, un botón «Cobro» → «Débito automático» abre el mismo cuadro del punto A y al final manda el mensaje.

**C. Desde la Página pública** (`/consultorio/<slug>`)
1. La sección «Planes de seguimiento» muestra los planes marcados como visibles: nombre, qué incluye y precio por mes.
2. «Suscribirme» pide nombre, correo de Mercado Pago, teléfono y la casilla de contacto (la misma de las reservas).
3. Plan V crea la suscripción y redirige a Mercado Pago. Al volver (`back_url`) muestra «Estamos esperando la confirmación de Mercado Pago» y consulta el estado con un token de invitada, igual que en las reservas.
4. En Cobranzas aparece como **«Sin ficha»** hasta que la nutri la vincule a una ficha existente o cree una nueva (mismo criterio que confirmar una reserva: si el correo ya existe, se elige esa ficha).

**D. Desde la app de la paciente** (Pagos)
Si la nutri le asignó un plan con débito y todavía no lo activó, la tarjeta «Tu plan» muestra «Activar débito automático» y abre el link.

### 2.3 La paciente se suscribe
1. Abre el link de Mercado Pago. Puede entrar con su cuenta o pagar sin cuenta [F1]. Carga la tarjeta o elige un medio guardado.
2. **El correo tiene que coincidir con `payer_email`.** En suscripciones sin plan, Mercado Pago verifica que el correo que se usa al pagar sea el mismo; si no coincide, rechaza el pago [F7]. Por eso el campo dice «Correo de tu cuenta de Mercado Pago».
3. Mercado Pago puede hacer un cobro mínimo para validar la tarjeta y lo devuelve [F4].
4. La suscripción pasa a `authorized` y la primera cuota se acredita dentro de la hora [F4].
5. Llegan avisos `subscription_preapproval` (cambio de la suscripción), `subscription_authorized_payment` (cada cuota) y `payment` (cada pago) a la URL general. El worker los procesa (sección 3.4).

### 2.4 Qué ve cada una

| Estado en Plan V | Viene de Mercado Pago | La nutri ve (Cobranzas y ficha) | La paciente ve (Pagos) |
|---|---|---|---|
| `creating` / `uncertain` | sin respuesta clara al crear | «Preparando link» / «Revisar link» con «Conciliar» | nada |
| `pending` | preapproval `pending` | «Esperando el primer pago» + «Enviar por el chat» | «Activá tu débito automático» |
| `authorized` + pago ok | `authorized`, última cuota aprobada | «Activa · próximo cobro 10/11» | «Débito automático activo» |
| `authorized` + `retrying` | cuota en `recycling` | «Pago rechazado · Mercado Pago reintenta» | «No pudimos cobrar tu plan. Revisá tu tarjeta en Mercado Pago» |
| `authorized` + `rejected` | cuota `processed` con pago rechazado | «Pago rechazado» + «Recordar» | igual que arriba |
| `paused` | `paused` | «En pausa» + «Reanudar» | «Tu plan está en pausa» |
| `cancelled` | `cancelled` | «Cancelada por vos / por la paciente / por Mercado Pago» | «Tu débito automático terminó» |
| `expired` | link `pending` sin usar por 7 días (lo cancelamos nosotras) | «Link vencido» + «Generar otro» | nada |

Datos de Mercado Pago para estos estados: preapproval `pending | authorized | paused | cancelled` [F9]; cuota (`authorized_payment`) `scheduled | processed | recycling | canceled` y `payment.status` `approved | rejected | refunded | charged_back | ...` [F10].

### 2.5 Avisos dentro de la app
- **Nutri** (no tiene push hoy; `notifyPatientPush` es solo para pacientes):
  - Bandeja de Inicio (`PanelHome` / `ProfessionalWorkQueue`): «Nueva suscripción de Ana», «Pago rechazado de Ana», «Ana canceló su débito», «Suscripción sin ficha: vinculala».
  - Cobranzas: contador en la tarjeta «Débito automático» y el filtro «Con problemas».
- **Paciente**:
  - Push genérico nuevo `subscription`, sin datos de salud ni montos: título «Novedades de tu plan», texto «Abrí Plan V para ver el estado de tu pago», abre `/app/pagos`. Se manda al activar, en el primer rechazo y al cancelar.
  - Tarjeta en Pagos y aviso en Inicio, reutilizando `PatientFeeNotice`.

### 2.6 Pausar, reanudar y cancelar desde el panel
- **Pausar**: `PUT /preapproval/{id}` con `status: paused` [F8]. Mientras está en pausa no se generan cobros.
- **Reanudar**: `PUT` con `status: authorized` [F8].
- **Cancelar**: `PUT` con `status: cancelled`. **No se puede deshacer** [F9]. Pide confirmación: «Se dejan de hacer cobros. Para volver hay que generar otro link».
- Todos usan `expected_revision` para no pisar cambios. Si Mercado Pago no contesta, el estado queda «Revisar» y se resuelve con «Conciliar».
- Si la paciente cancela desde su cuenta de Mercado Pago, llega el aviso y se muestra «Cancelada por la paciente».

### 2.7 La consulta suelta no cambia
La paciente esporádica sigue reservando en la Página pública y paga seña o saldo con Checkout Pro (`/api/public/scheduling/:slug/bookings/:id/checkout`) o informa una transferencia. Este spec solo suma que el webhook general también pueda aplicar un pago de reserva que llegue sin el id de la nutri en la URL (3.4).

### 2.8 Casos especiales

| Caso | Qué pasa |
|---|---|
| **Cambia el precio del plan** | El precio nuevo vale solo para links nuevos. Para las activas, la nutri elige «Aplicar a las activas» y Plan V hace `PUT /preapproval/{id}` con `auto_recurring.transaction_amount` [F8] para cada una. Antes de aplicar, la paciente recibe un aviso en la app con la fecha («Desde el 10/12 tu plan pasa a $60.000»). Cuántos días de aviso: ver P5. |
| **Pago rechazado** | Mercado Pago reintenta hasta 4 veces en 10 días. Si se rechazan 3 cuotas, **da de baja la suscripción solo** y le avisa a la nutri por correo [F4]. Plan V muestra «reintentando», después «rechazado» y por último «Cancelada por Mercado Pago». La cuota del mes queda vencida en Cobranzas y aparece en «Cuotas vencidas» con «Recordar» (chat). |
| **La nutri desconecta Mercado Pago** | Las suscripciones **siguen cobrando en su cuenta**: viven en Mercado Pago, no en Plan V. Pero Plan V ya no puede leerlas. Antes de desconectar, si tiene activas, el panel avisa: «Tenés 5 débitos activos. Si desconectás, se siguen cobrando pero no vas a ver el estado acá. ¿Querés cancelarlos primero?». Después se marcan «Sin seguimiento: reconectá Mercado Pago». |
| **Reconecta con otra cuenta** | `account_id` distinto: las suscripciones viejas quedan de solo lectura con el aviso «Se crearon con otra cuenta de Mercado Pago». Es la misma regla que ya usa `reconcileBookingPayments`. |
| **La nutri quita la app desde Mercado Pago** | Llega aviso `mp-connect` (si se activa, ver 6.1). Se marca la conexión como revocada y pasa lo mismo que al desconectar. |
| **Paciente sin cuenta en Plan V** | Puede suscribirse desde la Página pública o con el link. Queda «Sin ficha» hasta vincularla. Los cobros se guardan, pero se pasan al libro de Cobranzas recién al vincularla. |
| **Paciente sin cuenta de Mercado Pago** | Puede pagar sin cuenta [F1], pero con el mismo correo que se cargó. Si se equivocó de correo, la nutri cancela el link y genera otro. |
| **Dos links para la misma paciente y plan** | No se permite: solo una suscripción viva (`creating`, `pending`, `authorized`, `paused`, `uncertain`) por paciente y plan. |
| **Paciente archivada o anonimizada** | Al archivar, el panel pregunta si cancela el débito. Si se anonimiza, se cancela siempre y se borran el correo y el nombre de contacto. |
| **El aviso llega antes que la respuesta al crear** | El worker no encuentra `provider_preapproval_id`, pero sí nuestro `external_reference`, y completa la fila. |
| **Aviso de otra app o cuenta desconocida** | Se guarda como `unroutable`, se contesta 200 y no se procesa. |
| **Prueba gratis** | Ver 3.10. Apagada en la v1 hasta confirmarla en sandbox. |
| **Día fijo de cobro** | `billing_day` existe solo con plan asociado [F11]. En la v1 se cobra el mismo día del mes en que la paciente se suscribió. |

---

## 3. Diseño técnico

### 3.1 Qué se reutiliza y qué no
- **Se reutiliza**:
  - OAuth y tokens: `server/scheduling/providers.ts` (PKCE, renovación con lease) y `credentials.ts` (AES-256-GCM con `SCHEDULING_TOKEN_KEY`).
  - Conexión: `scheduling_integrations` (`provider = 'mercado_pago'`, `account_id` = user_id de Mercado Pago de la nutri).
  - Firma: `verifyMpSignature` de `logic.ts`.
  - Llamadas: `X-Idempotency-Key` (ya está en `createMpPreference`).
  - Worker: `server/jobs/worker.ts` (tick de 1 s, banderas de drenado).
  - Libro: `patient_payments` (método `mercado_pago`, estado `confirmed`/`voided`), `patient_fees` y `nutritionist_programs`.
  - Push: `notifyPatientPush` con un tipo nuevo.
- **No se reutiliza**: `nutritionist_subscriptions` y `service_payments` (son el cobro de Plan V a la nutri) ni las tablas viejas `payments` y `payment_webhook_events`.

### 3.2 Tablas nuevas
Migración: `supabase/migrations/20261020120000_patient_subscriptions.sql`. **Queda sin aplicar** hasta que Facu escriba la frase de confirmación.

```sql
-- Plan de seguimiento de la nutri (vive en Plan V, no en Mercado Pago)
create table public.patient_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.nutritionist_programs(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 280),
  amount_cents bigint not null check (amount_cents between 100000 and 1000000000), -- en centavos de ARS
  currency text not null default 'ARS' check (currency = 'ARS'),
  frequency smallint not null default 1 check (frequency in (1, 3)),
  frequency_type text not null default 'months' check (frequency_type = 'months'),
  trial_days smallint check (trial_days is null or trial_days between 1 and 60),
  public_visible boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.patient_subscription_plans (nutritionist_id, status);
create index on public.patient_subscription_plans (program_id);

-- Una suscripción de Mercado Pago por paciente y plan
create table public.patient_subscriptions (
  id uuid primary key default gen_random_uuid(), -- también es external_reference
  nutritionist_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.patient_subscription_plans(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete set null, -- null = "Sin ficha"
  integration_id uuid references public.scheduling_integrations(id) on delete set null,
  provider_account_id text not null, -- account_id de la nutri al crear
  provider_preapproval_id text,
  payer_email text not null,
  contact_name text,
  contact_phone text,
  source text not null check (source in ('panel', 'chat', 'public_page', 'patient_app')),
  status text not null default 'creating' check (status in
    ('creating', 'uncertain', 'pending', 'authorized', 'paused', 'cancelled', 'expired', 'failed')),
  payment_state text check (payment_state in ('ok', 'retrying', 'rejected')),
  cancelled_by text check (cancelled_by in ('nutritionist', 'patient', 'mercado_pago', 'system')),
  amount_cents bigint not null,
  init_point text,
  next_payment_date timestamptz,
  last_payment_at timestamptz,
  provider_last_modified timestamptz, -- last_modified de Mercado Pago, para no aplicar estados viejos
  create_idempotency_key uuid not null default gen_random_uuid(),
  revision integer not null default 1,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index patient_subscriptions_provider_uidx
  on public.patient_subscriptions (provider_account_id, provider_preapproval_id)
  where provider_preapproval_id is not null;
create unique index patient_subscriptions_one_live_uidx
  on public.patient_subscriptions (plan_id, patient_id)
  where patient_id is not null and status in ('creating', 'uncertain', 'pending', 'authorized', 'paused');
create index on public.patient_subscriptions (nutritionist_id, status);
create index on public.patient_subscriptions (patient_id);
create index on public.patient_subscriptions (integration_id);

-- Cada cuota o pago que informa Mercado Pago
create table public.patient_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.patient_subscriptions(id) on delete cascade,
  nutritionist_id uuid not null references public.profiles(id) on delete cascade,
  provider_authorized_payment_id text,
  provider_payment_id text,
  period_start date,
  amount_cents bigint not null,
  status text not null, -- scheduled | processed | recycling | canceled (cuota)
  payment_status text, -- approved | rejected | refunded | charged_back | in_process ...
  retry_attempt smallint,
  ledger_payment_id uuid references public.patient_payments(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index on public.patient_subscription_payments (subscription_id, provider_authorized_payment_id)
  where provider_authorized_payment_id is not null;
create unique index on public.patient_subscription_payments (subscription_id, provider_payment_id)
  where provider_payment_id is not null;
create index on public.patient_subscription_payments (nutritionist_id, created_at desc);
create index on public.patient_subscription_payments (ledger_payment_id);

-- Bandeja de avisos crudos (solo service_role)
create table public.patient_subscription_events (
  id uuid primary key default gen_random_uuid(),
  provider_notification_id text, -- campo "id" del aviso
  request_id text, -- header x-request-id
  topic text not null, -- type: subscription_preapproval | subscription_authorized_payment | payment | mp-connect
  action text,
  provider_user_id text, -- user_id del aviso
  resource_id text, -- data.id
  live_mode boolean,
  signature_valid boolean not null,
  status text not null default 'queued' check (status in
    ('queued', 'processing', 'processed', 'ignored', 'unroutable', 'failed')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  subscription_id uuid references public.patient_subscriptions(id) on delete set null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create unique index on public.patient_subscription_events (topic, resource_id, provider_notification_id)
  where provider_notification_id is not null;
create index on public.patient_subscription_events (status, next_attempt_at);
create index on public.patient_subscription_events (subscription_id);
```

Adaptación al esquema que ya tiene Plan V (la migración de esta rama la aplica así):

- `nutritionist_id` apunta a `nutritionists`, que es el consultorio, no a `profiles`.
- `scheduling_integrations` no tiene columna `id` (la clave es consultorio + proveedor). No se agrega `integration_id`. La cuenta queda en `provider_account_id` y se compara con `account_id` (`provider = 'mercadopago'`).
- El nombre del plan va de 2 a 60 caracteres, que es el tope de `nutritionist_programs`.
- Solo mensual (`frequency = 1`). El precio va en centavos de peso y tiene que ser un peso entero.
- La prueba gratis no se ofrece: `trial_days` queda vacío y la API no lo acepta.
- En `patient_payments` se suman `source`, `provider` y `provider_payment_id`, con un índice único para que el mismo cobro de Mercado Pago no entre dos veces.
- La paciente lee por `get_my_subscriptions()`. Equipo y recepción leen con `scheduling_can_manage` (la función que ya existe). Nadie escribe esas tablas desde el navegador.
- Los avisos crudos (`patient_subscription_events`) no tienen políticas: solo el servidor.

Cambios chicos en tablas que ya existen:
- `patient_payments`: agregar `source text` (`manual | checkout | subscription`) e índice único parcial en `(provider, provider_payment_id)` si todavía no existe. Así un mismo pago de Mercado Pago no entra dos veces al libro.
- `notifyPatientPush`: agregar el tipo `subscription` (en el código, no en la base).

### 3.3 Seguridad (RLS)
- RLS activado en las 4 tablas.
- `patient_subscription_plans`: la nutri dueña puede leer (`nutritionist_id = auth.uid()`). Los planes públicos se leen solo por el endpoint público del servidor, no directo desde el navegador.
- `patient_subscriptions` y `patient_subscription_payments`: la nutri dueña puede leer. **Nadie escribe desde el navegador**: crear, pausar, cancelar y vincular pasan por el servidor (service_role) después de verificar sesión y dueña.
- `patient_subscription_events`: sin políticas, solo `service_role`.
- Paciente: no lee las tablas directo. Usa la función `get_my_subscriptions()` (`security definer`, `search_path` fijo) que devuelve solo sus filas y sin `payer_email` completo ni ids de Mercado Pago.
- Equipo y recepción: solo lectura con `has_nutritionist_access(nutritionist_id)` si Facu lo aprueba (P7).
- Pasar `get_advisors` (security y performance) antes de pedir la aplicación.

### 3.4 Endpoints
Todos en Railway (Express), con la bandera `PATIENT_SUBSCRIPTIONS_ENABLED` (si está apagada, contestan 404). El navegador ya llama a Railway directo y `vercel.json` también deriva `/api/scheduling/*` y `/api/public/scheduling/*`.

**Panel de la nutri** (sesión + dueña):

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/scheduling/subscription-plans` | Lista planes |
| POST | `/api/scheduling/subscription-plans` | Crea plan (+ `nutritionist_programs`) |
| PATCH | `/api/scheduling/subscription-plans/:id` | Edita (con `expected_revision`); `apply_to_active` opcional |
| POST | `/api/scheduling/subscription-plans/:id/archive` | Archiva |
| GET | `/api/scheduling/subscriptions?status=&patient_id=` | Lista suscripciones + resumen para Cobranzas |
| POST | `/api/scheduling/subscriptions` | Crea `{ plan_id, patient_id, payer_email, source, client_request_id }` → `{ id, status, init_point }` |
| POST | `/api/scheduling/subscriptions/:id/pause` / `resume` / `cancel` | Cambia estado (con `expected_revision`) |
| POST | `/api/scheduling/subscriptions/:id/link-patient` | Vincula una "Sin ficha" a una ficha |
| POST | `/api/scheduling/subscriptions/:id/reconcile` | Lee el estado en Mercado Pago y corrige |
| POST | `/api/scheduling/subscriptions/:id/send-chat` | Manda el link por el chat |

**Público** (sin sesión, con límite de pedidos):

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/public/scheduling/:slug/subscription-plans` | Planes visibles de la Página pública |
| POST | `/api/public/scheduling/:slug/subscriptions` | Crea una suscripción "Sin ficha" → `{ init_point, guest_token }` |
| GET | `/api/public/scheduling/:slug/subscriptions/:id?token=` | Estado para la pantalla de vuelta |
| POST | `/api/public/scheduling/mp/webhook` y `/mp/webhook/` | **Nuevo**: webhook general de la app |

**Paciente** (sesión de paciente): `GET /api/patient/subscriptions` (o la función `get_my_subscriptions()`).

`guest_token` = HMAC con `SCHEDULING_BOOKING_SECRET`, igual que `bookingToken`.

### 3.5 Llamada para crear en Mercado Pago
```http
POST https://api.mercadopago.com/preapproval
Authorization: Bearer <access_token de la nutri>
X-Idempotency-Key: <create_idempotency_key>
Content-Type: application/json

{
  "reason": "Seguimiento mensual · Lic. Ana Pérez",
  "external_reference": "<patient_subscriptions.id>",
  "payer_email": "paciente@correo.com",
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",
    "transaction_amount": 54000,
    "currency_id": "ARS"
  },
  "back_url": "https://planv.app/consultorio/<slug>/suscripcion/<id>",
  "status": "pending"
}
```
- Respuesta: `id` (preapproval), `init_point`, `status: pending`, `payer_id`, `next_payment_date` [F7].
- `start_date` y `end_date` se mandan solo para la prueba gratis (3.10). Mercado Pago dice que `start_date` funciona solo junto con `end_date` [F7].
- Antes de llamar: se guarda la fila en `creating` con la clave de idempotencia. Si la llamada no tiene respuesta clara (timeout, 5xx), la fila pasa a `uncertain` y la conciliación busca por `external_reference` (`GET /preapproval/search?external_reference=...`). Como ya está documentado en `reconcileBookingPayments`, **una búsqueda vacía no prueba que no se creó**: se reintenta con la misma clave antes de dar `failed`.
- `back_url` tiene que ser https y público. En local se usa el túnel de pruebas.

### 3.6 Webhook general y ruteo
**Recepción** (`POST /api/public/scheduling/mp/webhook`, rápido):
1. Si la URL trae `:nutritionistId`, sigue la ruta de siempre (pagos de reservas). La ruta nueva es la que no trae id.
2. Verifica `x-signature` con `verifyMpSignature` (template `id:<data.id en minúsculas>;request-id:<x-request-id>;ts:<ts>;`, HMAC-SHA256 con la clave secreta de la app) [F12]. Si falla: guarda con `signature_valid = false`, contesta 401 y no procesa.
3. Guarda el aviso en `patient_subscription_events` (`queued`). Si ya existe (mismo topic, recurso e id de aviso), no hace nada.
4. Contesta **200 enseguida**. Mercado Pago espera 22 s y si no recibe 200/201 reintenta cada 15 minutos [F12].

**Procesamiento** (worker, `processSubscriptionEvents`):
1. Toma un lote `queued` con `for update skip locked`.
2. Busca la nutri: `scheduling_integrations` donde `provider = 'mercado_pago'` y `account_id = user_id` del aviso. `account_id` **no es único** (una cuenta podría estar conectada a dos perfiles), así que puede haber varias candidatas.
3. Lee el recurso con el token de cada candidata:
   - `subscription_preapproval` → `GET /preapproval/{data.id}` [F8]
   - `subscription_authorized_payment` → `GET /authorized_payments/{data.id}` [F10]
   - `payment` → `GET /v1/payments/{data.id}`
4. Encuentra la fila nuestra por `provider_preapproval_id` o, si no está, por `external_reference`. Si `external_reference` no es un UUID nuestro, o pertenece a otra nutri, se descarta esa candidata.
5. Para `payment` que no es de suscripción: si `external_reference` coincide con un `scheduling_checkout_intents` de la nutri, se aplica con `applyVerifiedPayment` (así un pago de reserva que llegue a la URL general no se pierde). Si no, `ignored`.
6. `mp-connect`: `action = application.deauthorized` → marcar la integración como revocada.
7. Sin candidata: `unroutable`. Error de red o 5xx: reintento con espera creciente (1 min, 5, 30, 2 h, 12 h; tope 8 intentos) y después `failed`, que se ve en Admin → Salud.

**Qué se aplica:**
- Preapproval: `status`, `next_payment_date`, `auto_recurring.transaction_amount`, `payer_id`. Si `last_modified` de Mercado Pago es más viejo que `provider_last_modified`, no se aplica.
- Cuota: upsert en `patient_subscription_payments`; `recycling` → `payment_state = retrying`; `processed` + `approved` → `ok`; `processed` + `rejected` → `rejected`.
- Pago aprobado de suscripción: inserta **una sola vez** un `patient_payments` confirmado (`method = mercado_pago`, `source = subscription`, `provider_payment_id`, nota «Débito automático · Seguimiento mensual · noviembre 2026») y guarda `ledger_payment_id`. Si está "Sin ficha", queda pendiente de pasar al libro hasta vincular.
- `refunded` o `charged_back`: la fila del libro pasa a `voided` con el motivo.

### 3.7 Idempotencia
| Riesgo | Cómo se evita |
|---|---|
| La nutri toca dos veces «Activar» | `client_request_id` + índice único de una suscripción viva por paciente y plan |
| Reintento al crear en Mercado Pago | `X-Idempotency-Key` fija por fila (`create_idempotency_key`) |
| Aviso repetido | Índice único `(topic, resource_id, provider_notification_id)` |
| Dos workers con el mismo aviso | `for update skip locked` |
| Un pago entra dos veces al libro | Índices únicos de `provider_payment_id` en `patient_subscription_payments` y `patient_payments` |
| Estados que llegan desordenados | Se aplica siempre lo que devuelve el GET a Mercado Pago (no el aviso), comparando `last_modified` |
| Dos personas pausan y cancelan a la vez | `expected_revision` → 409 «Alguien cambió esto, recargá» |

### 3.8 Conciliación
- **Botón «Conciliar»** (por suscripción y «Conciliar todo» en Cobranzas): `GET /preapproval/{id}` y sus cuotas/pagos.
- **Worker cada 6 horas** con las suscripciones vivas:
  - `creating`/`uncertain` de más de 10 min → buscar por `external_reference`.
  - `pending` de más de 7 días → `PUT status: cancelled` y estado `expired` (así no queda un link viejo que se pueda pagar).
  - `authorized` sin cuota en `next_payment_date + 2 días` → leer cuotas.
- Para las cuotas: `GET /authorized_payments/search?preapproval_id=...` si existe (en la documentación está el GET por id, la búsqueda hay que confirmarla en sandbox, 6.3). Si no existe, `GET /v1/payments/search?external_reference=<id>` o por `metadata`, según lo que traiga el pago.
- Si la cuenta conectada cambió, no se toca nada y se marca «Se crearon con otra cuenta de Mercado Pago».

### 3.9 Tokens
- Se usa el `access_token` de la nutri que ya guardamos (sellado con AES-256-GCM). La renovación con lease ya existe en `providers.ts`.
- El permiso `write` ya se usa para crear preferencias, y las apps nuevas tienen `read`, `offline_access` y `write` activados por defecto [F13]. El link de autorización no manda `scope`, así que no hace falta volver a conectar.
- Si el token vence o fue revocado: la suscripción sigue cobrando en Mercado Pago, pero Plan V muestra «Reconectá Mercado Pago para ver el estado» y el worker no reintenta hasta que vuelva a conectar.
- Nunca se loguean tokens, `payer_email` completo ni `init_point` (los logs usan ids cortos).

### 3.10 Prueba gratis y día de cobro
- `free_trial` solo existe en planes (`preapproval_plan`) [F11]. Usar un plan implica `card_token_id`, o sea tokenizar la tarjeta con Card Payment Brick: más trabajo y más riesgo.
- Opción sin plan: `start_date` en el futuro + `end_date` [F7]. No está documentado si la primera cuota espera a `start_date` o se cobra igual. **Se prueba en sandbox (6.3, punto 4).** Hasta entonces, la prueba gratis queda apagada.
- Día fijo de cobro y prorrateo: también solo con plan [F11]. Fuera de la v1.

### 3.11 Pruebas
- **Unitarias** (vitest):
  - armado del body de `/preapproval`;
  - mapeo de estados de Mercado Pago a los nuestros;
  - firma con id alfanumérico y `ts` en segundos y milisegundos;
  - comparación de `last_modified`;
  - nota del libro.
- **Integración** (Supabase local + Mercado Pago simulado):
  - crear → `uncertain` → conciliar;
  - aviso repetido → una sola fila;
  - aviso antes de la respuesta;
  - aviso de cuenta desconocida → `unroutable`;
  - pago aprobado → una fila en `patient_payments`;
  - `refunded` → `voided`;
  - `account_id` repetido en dos perfiles;
  - RLS: una nutri no ve lo de otra y la paciente no lee las tablas.
- **E2E con cuentas de prueba** (6.2): suscribirse, primera cuota, pausar, reanudar, cancelar, tarjeta rechazada.
- **UI** (Playwright): flujos de Cobranzas, Página pública y ficha en escritorio y 390 px.
- `npm run check`, `npm run lint`, `npm test` y `get_advisors` en verde.

---

## 4. Pantallas

Se apoya en lo que ya hizo la fase 5 (`PanelCobranzas.tsx`, `PanelPublicPage.tsx`, `PanelConnections.tsx`) y en la ficha de la fase 4 (`PanelPatientBilling.tsx`, tarjeta «Programa y acceso»). Mismo estilo y componentes; no se rediseña.

### 4.1 Cobranzas (`/panel/cobranzas`)
- **KPIs**: no se agrega ninguno. Los cobros del débito ya entran en «Cobrado» porque van al libro. «Programas activos» cuenta también los planes de seguimiento.
- **Tarjeta nueva «Débito automático»** (entre «Ingresos por mes» y «Cuotas vencidas»):
  - Resumen: «12 activas · 2 esperando el primer pago · 1 con pago rechazado».
  - Lista corta con nombre, plan, estado (chip), próximo cobro y menú (Ver ficha, Enviar link por el chat, Pausar, Reanudar, Cancelar, Conciliar).
  - Filtros: Todas / Activas / Con problemas / Sin ficha.
  - Vacío: «Todavía no tenés débitos automáticos. Creá un plan de seguimiento y mandáselo a tus pacientes.» + «Crear plan».
  - Sin Mercado Pago: «Conectá Mercado Pago para cobrar con débito automático» → `/panel/conexiones`.
- **Botón «Planes de seguimiento»** arriba, al lado de los otros. Abre un panel lateral con la lista de planes y «Nuevo plan» (formulario del 2.1).
- **«Movimientos»**: los cobros del débito llevan la etiqueta «Débito automático» (sumar la etiqueta en `panel-billing.ts`).
- **«Cuotas vencidas»**: si la paciente tiene débito con pago rechazado, el «Recordar» manda por el chat: «Hola, Mercado Pago no pudo cobrar tu plan. ¿Podés revisar tu tarjeta en Mercado Pago?».

### 4.2 Página pública (`/panel/pagina-publica`)
- **Tarjeta nueva «Planes de seguimiento»** debajo de «Servicios»: lista de planes con el interruptor «Mostrar en mi página», precio y «Editar».
- Vista previa del celular: sección «Planes de seguimiento» con tarjetas (nombre, qué incluye, «$54.000 por mes», botón «Suscribirme»).
- Si no hay Mercado Pago conectado, el interruptor está apagado y bloqueado con el mismo aviso.

### 4.3 Página pública de la nutri (`/consultorio/<slug>`, `PublicProfessionalBooking.tsx`)
- Sección «Planes de seguimiento» entre los servicios y el calendario.
- «Suscribirme» abre un formulario corto: nombre, **correo de tu cuenta de Mercado Pago** (con ayuda: «Usá el mismo correo con el que vas a pagar»), teléfono, casilla de contacto y botón «Ir a Mercado Pago».
- Pantalla de vuelta: «Estamos esperando la confirmación de Mercado Pago» → «¡Listo! Tu débito automático quedó activo» o «Mercado Pago no confirmó el pago. Podés intentar de nuevo».

### 4.4 Ficha de la paciente (pestaña Cobros, `PanelPatientBilling.tsx`)
- Dentro de «Programa y acceso», bloque **«Débito automático»**:
  - Sin débito: «Activar débito automático» (abre el cuadro del 2.2).
  - Pendiente: «Esperando el primer pago · link creado el 19/10» + «Enviar por el chat» y «Copiar link».
  - Activa: «Activa · $54.000 por mes · próximo cobro 10/11» + menú Pausar / Cancelar / Conciliar.
  - Con problemas: chip rojo «Pago rechazado» + «Recordar».
  - Historial: últimas 6 cuotas con fecha, monto y estado.
- «Cambiar programa»: si tiene débito activo, avisa: «Este cambio no modifica el débito de Mercado Pago. ¿Querés cancelarlo y generar uno nuevo con el programa nuevo?».

### 4.5 Chat (panel)
- En la barra del mensaje, botón «Cobro» → «Débito automático» abre el cuadro del 2.2 y manda: «Te dejo el link para activar el débito automático de tu Seguimiento mensual ($54.000 por mes): <link>. Usá el correo <correo>.»

### 4.6 App de la paciente (Pagos, `ShowroomPagos.tsx`)
- Tarjeta «Tu plan»: nombre, monto por mes, estado y próximo cobro.
- Botones: «Activar débito automático» (si está pendiente) y «Ver en Mercado Pago» (link a sus suscripciones en Mercado Pago).
- Baja desde la app: solo si Facu lo aprueba (P4). Si no, el texto dice «Para darte de baja, hablá con tu nutri o cancelalo en Mercado Pago».

### 4.7 Textos y accesibilidad
- Voseo y palabras simples. Montos en pesos sin centavos. Fechas dd/mm.
- Estados con texto, no solo color. Botones con nombre claro. Funciona con teclado y a 390 px.

---

## 5. Quién hace qué

Una rama y un PR por tema. Las migraciones van con fecha ≥ 20261019000000 y **nadie las aplica sin la frase de Facu**. Facu decidió que Cursor haga el backend y las pantallas (P10). Las pantallas van en otras ramas; esta solo trae el backend.

| Paso | Quién | Rama | Qué | Depende de |
|---|---|---|---|---|
| 0 | Facu | — | Contesta las preguntas de la sección 7 | — |
| 1 | Codex (o Cursor si Facu autoriza) | `codex/suscripciones-spike-sandbox` | Script de prueba con cuentas de prueba: los 5 puntos de 6.3. Sin tocar producción. | 0 |
| 2 | Cursor | `cursor/suscripciones-pacientes-backend` | Migración (sin aplicar), endpoints, webhook general, worker, conciliación, libro, push `subscription`, pruebas. Bandera apagada. | Decisiones de 7.3 |
| 3 | Cursor | `cursor/suscripciones-cobranzas-pagina` | Cobranzas (4.1), Página pública (4.2) y página `/consultorio` (4.3), contra los contratos de 3.4 con datos simulados | #153 mergeado; contratos de 2 |
| 4 | Cursor | `cursor/suscripciones-ficha-chat` | Ficha (4.4) y chat (4.5) | Fase 4 mergeada; 3 |
| 5 | Lane de la app de pacientes (o Cursor) | `cursor/suscripciones-app-paciente` | Pagos (4.6) y aviso en Inicio | 2 |
| 6 | Facu | — | Aplica la migración con su frase, configura Mercado Pago (6.1), prende la bandera en Railway | 2–5 en verde |

- Codex publica primero los tipos y contratos (`shared/subscriptions.ts`) así Cursor arranca en paralelo con datos simulados.
- Ningún PR toca `nutritionist_subscriptions`, `service_payments` ni `/admin`.

---

## 6. Configuración de Mercado Pago y pruebas

### 6.1 ¿Sirve la app "Plan V" que ya existe?
**Sí, sirve.** Motivos:
- Las suscripciones se crean con el `access_token` de la cuenta que cobra. Con OAuth, ese token es el de la nutri, y eso ya lo hacemos para Checkout Pro [F13][F14].
- El permiso `write` ya está y se usa. Las apps tienen `read`, `offline_access` y `write` por defecto [F13], y nuestro link de autorización no pide `scope`, así que no hay que volver a conectar a nadie.
- El "producto a integrar" de la app es un dato informativo editable, no un permiso [F15].
- La URL de avisos de la app ya tiene tildado "Planes y suscripciones".

**Lo que hay que cambiar** (lo hace Facu en el panel de Mercado Pago, en el paso 6):
1. **Servidor**: crear la ruta `/api/public/scheduling/mp/webhook` (con y sin `/` al final). Hoy da 404 (sección 3.6). Sin esto no llega ningún aviso de suscripción.
2. **Tus integraciones → Plan V → Webhooks → Modo productivo**: dejar la URL general (`https://<railway>/api/public/scheduling/mp/webhook/`) con los eventos **Pagos**, **Planes y suscripciones** (`subscription_preapproval` y `subscription_authorized_payment`) y **Vinculación de aplicaciones** (`mp-connect`, para saber si una nutri quitó la app) [F12].
3. **Modo de prueba**: poner la misma ruta en el entorno de prueba (o la URL del túnel).
4. Confirmar que la **clave secreta** de esa pantalla es la misma que `MP_SCHEDULING_WEBHOOK_SECRET` en Railway. Si se regenera, hay que actualizar Railway en el mismo momento.
5. Opcional: agregar "Suscripciones" en los productos de la app (solo informativo).

**Ojo, la documentación se contradice**: una nota dice que configurar avisos desde Tus integraciones "no está disponible para Suscripciones", pero la tabla de eventos del mismo lugar lista "Planes y suscripciones" [F12][F16]. Y `/preapproval` no documenta `notification_url` [F7]. Por eso la prueba en sandbox (6.3) es obligatoria antes de programar.

**Cuándo haría falta otra app**: solo si en sandbox los avisos de suscripción de las cuentas conectadas no llegan a la URL de la app, o si Mercado Pago rechaza `POST /preapproval` con un token OAuth. En ese caso, plan B: sin avisos, solo conciliación (worker cada hora + botón), y consultarlo con soporte de Mercado Pago.

### 6.2 Cuentas de prueba
Se crean en Tus integraciones → Plan V → Cuentas de prueba, hasta 15, todas de Argentina [F17]:
- **Vendedora** (hace de nutri): se conecta a Plan V por el OAuth de prueba.
- **Compradora** (hace de paciente): su correo es el `payer_email`.
- Opcional: una segunda vendedora para probar el ruteo con dos nutris.

Tarjetas de prueba [F18]: aprobada con titular `APRO`, rechazada con `OTHE`. Mercado Pago dice que para probar suscripciones hay que usar cuentas de prueba para vendedora y compradora, no la cuenta real [F5].

### 6.3 Prueba en sandbox antes de programar (paso 1)
Un script aparte (`scripts/mp-subscriptions-spike.ts`), sin tocar la base de producción, que confirma:
1. **OAuth**: con el token OAuth de la vendedora de prueba, `POST /preapproval` con `status: pending` devuelve `init_point`.
2. **Avisos**: al suscribirse la compradora, llegan `subscription_preapproval`, `subscription_authorized_payment` y `payment` a la URL de la app, con `user_id` de la vendedora y firma válida con la clave secreta de la app.
3. **`notification_url`**: si `/preapproval` acepta `notification_url` (no documentado). Si funciona, se puede usar la ruta con id de la nutri como respaldo.
4. **Prueba gratis**: con `start_date` a 7 días + `end_date`, si la primera cuota espera o se cobra igual.
5. **Datos para conciliar**: si el `payment` trae `external_reference` o `metadata.preapproval_id`, y si existe `GET /authorized_payments/search?preapproval_id=` (no está en la referencia pública).

El resultado se anota en este archivo (sección 6.3) antes del paso 2.

### 6.4 Pasar a producción
Checklist [F3]: avisos funcionando con firma, conciliación andando, textos aprobados, bandera prendida primero para 1 o 2 nutris (lista en `PATIENT_SUBSCRIPTIONS_ALLOWLIST`) y después para todas.

---

## 7. Cuándo está terminado y preguntas para Facu

### 7.1 Criterios de terminado
- [ ] Migración `20261020120000_patient_subscriptions.sql` revisada, con RLS, índices en todas las FK y `get_advisors` sin alertas nuevas. **No aplicada** hasta la frase de Facu.
- [ ] Una nutri de prueba crea un plan, activa el débito para una paciente de prueba, la paciente paga en Mercado Pago y en menos de 2 minutos Cobranzas y la ficha muestran «Activa» y el cobro en «Movimientos».
- [ ] Un mismo aviso mandado 5 veces deja una sola fila en el libro.
- [ ] Tarjeta rechazada → «Pago rechazado» en Cobranzas y aviso a la paciente en la app.
- [ ] Pausar, reanudar y cancelar desde el panel se reflejan en Mercado Pago y en Plan V.
- [ ] Un aviso perdido se arregla con «Conciliar» y con el worker de 6 horas.
- [ ] Un link sin usar vence a los 7 días.
- [ ] Una nutri no puede ver ni tocar nada de otra (pruebas de RLS y de endpoints).
- [ ] No aparecen tokens, correos completos ni links de pago en los logs.
- [ ] Suscripción desde la Página pública queda «Sin ficha» y se puede vincular.
- [ ] La consulta suelta (seña/saldo) sigue andando igual (pruebas actuales en verde).
- [ ] Pantallas revisadas en escritorio y 390 px, con voseo y textos simples.
- [ ] `npm run check`, `lint` y `test` en verde. Un PR por tema, con capturas.

### 7.2 Preguntas para Facu
Quedaron respondidas el 19/10. El detalle está en 7.3. No vuelven a estar abiertas.

### 7.3 Decisiones de Facu (19/10/2026)

Estas decisiones reemplazan P1–P10. El backend de esta rama las cumple.

- **P1. Comisión.** Plan V no cobra comisión sobre estos débitos. No se manda `marketplace_fee` ni `application_fee`.
- **P2. Prueba gratis.** No entra en la v1. La API no acepta días de prueba ni manda `start_date` / `end_date`.
- **P3. Frecuencia.** Solo mensual. No hay trimestral en esta versión.
- **P4. Baja desde la app.** La paciente puede darse de baja desde la app. También puede cancelar la nutri, o Mercado Pago.
- **P5. Cambio de precio.** 10 días de aviso. El precio nuevo vale enseguida para los links nuevos. En las que ya están activas, se avisa y Mercado Pago recién lo cobra cuando pasan esos 10 días.
- **P6. Cuota manual.** Si la paciente queda con el débito activo, se apaga su cuota manual para no cobrar dos veces. Si el link todavía no se pagó, la cuota manual sigue.
- **P7. Equipo.** Solo la nutri activa, pausa, reanuda o cancela débitos. Recepción y equipo solo ven.
- **P8. Página pública.** Se ofrece en la página pública y también por link. Cada plan tiene su interruptor para mostrarse o no.
- **P9. Medios de pago.** Se aceptan todos los medios que ofrezca Mercado Pago. No se filtran.
- **P10. Quién programa.** Cursor hace el backend (esta rama) y las pantallas (ramas siguientes). Esta entrega no incluye pantallas.

---

## 8. Fuentes (documentación oficial de Mercado Pago Argentina, leída el 19/10/2026)
- [F1] Suscripciones, introducción: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview
- [F2] Medios de pago en suscripciones: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/payment-methods
- [F3] Salir a producción: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/go-to-production
- [F4] Consideraciones (reintentos, baja tras 3 cuotas rechazadas, primera cuota, validación de tarjeta): https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/considerations
- [F5] Probar la integración: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-test
- [F6] Split de pagos / marketplace: https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing y https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/how-tos/integrate-marketplace
- [F7] Crear suscripción (`POST /preapproval`): https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/create-preapproval/post y suscripción sin plan con pago pendiente: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-no-associated-plan/pending-payments
- [F8] Actualizar suscripción (`PUT /preapproval/{id}`) y obtener: https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/update-preapproval/put y https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/search-preapproval/get
- [F9] Gestión de suscripciones (estados, cancelar): https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/subscription-management
- [F10] Cuotas (`GET /authorized_payments/{id}`): https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/get-authorized-payment/get y gestión de pagos: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/payment-management
- [F11] Suscripción con plan asociado y planes (`card_token_id`, `free_trial`, `billing_day`, prorrateo): https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-associated-plan, https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/create-preapproval-plan/post y https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/proportional-amount
- [F12] Webhooks (eventos, firma `x-signature`, 22 s y reintentos): https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- [F13] OAuth, creación y permisos: https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation
- [F14] OAuth, introducción: https://www.mercadopago.com.ar/developers/es/docs/security/oauth/introduction
- [F15] Detalles de la aplicación: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/application-details
- [F16] Avisos en suscripciones: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/notifications
- [F17] Cuentas de prueba: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/test/accounts
- [F18] Tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/additional-content/your-integrations/test/cards
