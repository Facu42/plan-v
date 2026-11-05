-- Medidor de uso de IA por nutri y elección de modelo por función (panel del administrador).
-- Migración ADITIVA: dos tablas nuevas, sin tocar ninguna existente. No aplicar en producción
-- sin la frase escrita de Facundo.
-- Reversión: drop table public.ai_usage_events, public.ai_model_settings;
--
-- Qué se guarda: cuántas veces, qué función, qué modelo, cuántos tokens y cuánto costó.
-- Nunca el contenido de lo que se escribió ni datos de pacientes.

create table if not exists public.ai_model_settings (
  feature text primary key check (feature in (
    'menu_draft', 'recipe_draft', 'replacement', 'copilot', 'meal_photo',
    'lab_reading', 'content_post', 'admin_assistant', 'general'
  )),
  model text not null check (model ~ '^[a-z0-9._-]+/[a-z0-9._:-]+$' and char_length(model) <= 120),
  -- USD por millón de tokens. 0 y 0 = modelo gratis.
  input_usd_per_mtok numeric(10, 4) not null check (input_usd_per_mtok >= 0 and input_usd_per_mtok <= 100),
  output_usd_per_mtok numeric(10, 4) not null check (output_usd_per_mtok >= 0 and output_usd_per_mtok <= 100),
  updated_by text not null default '' check (char_length(updated_by) <= 254),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  -- Sin llave foránea a propósito: borrar una nutri no debe borrar el historial de gasto.
  nutritionist_id uuid,
  feature text not null check (char_length(feature) between 2 and 40),
  model text not null check (char_length(model) between 2 and 120),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  -- Millonésimas de dólar.
  cost_micros bigint not null default 0 check (cost_micros >= 0),
  -- Créditos internos: solo cuentan si la acción salió bien. La nutri nunca ve el número.
  credits integer not null default 0 check (credits >= 0),
  ok boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists ai_usage_events_nutri_month_idx
  on public.ai_usage_events (nutritionist_id, created_at desc);
create index if not exists ai_usage_events_created_idx
  on public.ai_usage_events (created_at desc);

-- Solo el servidor (service_role) lee y escribe. Ninguna política para anon ni authenticated.
alter table public.ai_model_settings enable row level security;
alter table public.ai_usage_events enable row level security;
revoke all on public.ai_model_settings, public.ai_usage_events from public, anon, authenticated;
grant select, insert, update, delete on public.ai_model_settings to service_role;
grant select, insert on public.ai_usage_events to service_role;
