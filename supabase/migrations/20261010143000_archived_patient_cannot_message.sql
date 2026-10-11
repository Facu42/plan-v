-- D6: una paciente archivada no puede dejar mensajes nuevos.
-- Archivar no borra el hilo ni le saca la lectura. El reintento del mismo
-- envío (mismo client_id) sigue devolviendo el mensaje que ya existía.
-- La nutricionista puede escribir. No toca filas ni columnas.
-- No aplicar en la base hospedada hasta la frase escrita de Facundo.

create or replace function public.my_archived_at()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select p.archived_at
  from public.patients p
  where p.user_id = auth.uid()
    and p.deactivated_at is null
    and p.anonymized_at is null
    and p.archived_at is not null
  limit 1;
$$;

revoke all on function public.my_archived_at() from public, anon, authenticated;
grant execute on function public.my_archived_at() to authenticated;

create or replace function public.reject_archived_patient_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_user uuid;
  archived timestamptz;
begin
  select p.user_id, p.archived_at
    into patient_user, archived
  from public.patients p
  where p.id = new.patient_id;
  if new.author_id is not distinct from patient_user and archived is not null then
    raise exception using errcode = '42501', message = 'thread_archived';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_archived_patient_message() from public, anon, authenticated;

drop trigger if exists reject_archived_patient_message on public.messages;
create trigger reject_archived_patient_message
  before insert on public.messages
  for each row execute function public.reject_archived_patient_message();

notify pgrst, 'reload schema';
