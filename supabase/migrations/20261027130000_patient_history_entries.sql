-- Historia clínica por temas de la Ficha: cada dato lleva fecha, origen y, si se dio de baja, hasta cuándo y por qué.
-- Aditiva: una tabla nueva, sin tocar las existentes. Los datos no se borran: «dar de baja» solo completa ended_on.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create table if not exists public.patient_history_entries (
 id uuid primary key default gen_random_uuid(),
 nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
 patient_id uuid not null references public.patients(id) on delete cascade,
 topic text not null check (topic in ('motivo','diag','med','alerg','fam','halim','r24','hab','act','sue','dig','ciclo','emb','pref')),
 body text not null check (char_length(btrim(body)) between 1 and 600),
 since_text text not null default '' check (char_length(since_text) <= 40),
 source text not null default 'professional' check (source in ('professional','patient','import','recording','form')),
 recorded_on date not null,
 edited_on date,
 ended_on date,
 ended_reason text not null default '' check (char_length(ended_reason) <= 200),
 created_at timestamptz not null default clock_timestamp(),
 check (ended_on is null or ended_on >= recorded_on)
);
create index if not exists patient_history_entries_patient_idx
 on public.patient_history_entries (nutritionist_id, patient_id, topic, recorded_on);
alter table public.patient_history_entries enable row level security;
drop policy if exists patient_history_entries_select on public.patient_history_entries;
create policy patient_history_entries_select on public.patient_history_entries
 for select to authenticated
 using ((select public.scheduling_can_manage(nutritionist_id)));
drop policy if exists patient_history_entries_insert on public.patient_history_entries;
create policy patient_history_entries_insert on public.patient_history_entries
 for insert to authenticated
 with check ((select public.scheduling_can_manage(nutritionist_id)));
drop policy if exists patient_history_entries_update on public.patient_history_entries;
create policy patient_history_entries_update on public.patient_history_entries
 for update to authenticated
 using ((select public.scheduling_can_manage(nutritionist_id)))
 with check ((select public.scheduling_can_manage(nutritionist_id)));
revoke all on public.patient_history_entries from public, anon;
grant select, insert, update on public.patient_history_entries to authenticated;
commit;
