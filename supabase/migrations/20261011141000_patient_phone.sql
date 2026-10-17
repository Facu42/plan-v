alter table public.patients add column if not exists phone text;
alter table public.patients add constraint patient_phone_maximum_length check (phone is null or length(phone)<=40);
-- Conserva las políticas de pertenencia existentes: no concede acceso a otra fila.
grant select(phone),update(phone) on public.patients to authenticated;
