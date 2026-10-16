-- Avisos al teléfono (push) para la paciente.
-- Cada fila es un teléfono o navegador donde la paciente aceptó recibir avisos.
-- Solo la escribe y la lee el servidor (rol de servicio): las sesiones del navegador no tienen
-- permisos sobre la tabla. Los avisos nunca llevan datos de salud, solo textos genéricos.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique
    constraint push_subscriptions_endpoint_https check (endpoint like 'https://%' and length(endpoint) <= 1000),
  p256dh text not null constraint push_subscriptions_p256dh_size check (length(p256dh) between 1 and 200),
  auth text not null constraint push_subscriptions_auth_size check (length(auth) between 1 and 100),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

comment on table public.push_subscriptions is
  'Teléfonos donde la persona aceptó avisos push. Solo el servidor la usa; los avisos no llevan datos de salud.';
