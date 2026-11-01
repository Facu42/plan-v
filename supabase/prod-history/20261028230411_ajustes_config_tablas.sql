-- Archivo histórico: migración 20261028230411_ajustes_config_tablas aplicada en producción (plan-v-app) vía MCP y nunca commiteada.
-- NO es parte de la cadena de supabase/migrations: su efecto ya está cubierto por migraciones posteriores del repo.
-- No re-aplicar. Ver docs/migraciones-prod-vs-main.md.

create table if not exists public.nutrition_templates (
 id uuid not null,
 owner_id uuid not null references public.nutritionists(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and pg_column_size(payload) < 20000 and payload->>'kind' in ('Formulario','Certificado')),
 updated_at timestamptz not null default clock_timestamp(),
 primary key (owner_id, id)
);
alter table public.nutrition_templates enable row level security;
create policy nutrition_templates_select on public.nutrition_templates for select to authenticated using (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_insert on public.nutrition_templates for insert to authenticated with check (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_update on public.nutrition_templates for update to authenticated using (owner_id=public.my_nutritionist_id()) with check (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_delete on public.nutrition_templates for delete to authenticated using (owner_id=public.my_nutritionist_id());
revoke all on public.nutrition_templates from public, anon;
grant select, insert, update, delete on public.nutrition_templates to authenticated;

create table if not exists public.notice_settings (
 owner_id uuid not null references public.nutritionists(id) on delete cascade,
 key text not null check (key ~ '^[a-z0-9_]{3,40}$'),
 enabled boolean not null default false,
 when_text text check (when_text is null or char_length(when_text) between 3 and 120),
 message text check (message is null or char_length(message) between 5 and 500),
 updated_at timestamptz not null default clock_timestamp(),
 primary key (owner_id, key)
);
alter table public.notice_settings enable row level security;
create policy notice_settings_select on public.notice_settings for select to authenticated using (owner_id=public.my_nutritionist_id());
create policy notice_settings_insert on public.notice_settings for insert to authenticated with check (owner_id=public.my_nutritionist_id());
create policy notice_settings_update on public.notice_settings for update to authenticated using (owner_id=public.my_nutritionist_id()) with check (owner_id=public.my_nutritionist_id());
revoke all on public.notice_settings from public, anon;
grant select, insert, update on public.notice_settings to authenticated;
