-- Etiquetas por paciente de la Ficha (botón «+ etiqueta»). Aditiva: una tabla nueva, sin tocar las existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create table if not exists public.patient_tags (
 id uuid primary key default gen_random_uuid(),
 nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
 patient_id uuid not null references public.patients(id) on delete cascade,
 label text not null check (char_length(btrim(label)) between 1 and 30),
 tone text not null default 'n' check (tone in ('a','n')),
 created_at timestamptz not null default clock_timestamp()
);
create unique index if not exists patient_tags_unique_label
 on public.patient_tags (patient_id, lower(btrim(label)));
create index if not exists patient_tags_nutritionist_idx
 on public.patient_tags (nutritionist_id, patient_id);
alter table public.patient_tags enable row level security;
drop policy if exists patient_tags_select on public.patient_tags;
create policy patient_tags_select on public.patient_tags
 for select to authenticated
 using ((select public.scheduling_can_manage(nutritionist_id)));
drop policy if exists patient_tags_insert on public.patient_tags;
create policy patient_tags_insert on public.patient_tags
 for insert to authenticated
 with check ((select public.scheduling_can_manage(nutritionist_id)));
drop policy if exists patient_tags_delete on public.patient_tags;
create policy patient_tags_delete on public.patient_tags
 for delete to authenticated
 using ((select public.scheduling_can_manage(nutritionist_id)));
revoke all on public.patient_tags from public, anon;
grant select, insert, delete on public.patient_tags to authenticated;
commit;
