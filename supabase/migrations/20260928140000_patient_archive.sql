-- PV-47: la nutricionista archiva y restaura pacientes desde la app.
-- Hasta acá la ruta respondía 501 en producción ("pendiente de una columna").
-- Archivar sólo saca a la paciente de la lista activa de su profesional: no
-- cierra la cuenta ni borra datos (eso sigue siendo deactivated_at / anonymized_at).
-- El acceso de la paciente se maneja aparte (set_patient_billing). No escribe en
-- la línea de tiempo: el enum de eventos de la base no tiene un tipo de perfil.

alter table public.patients add column if not exists archived_at timestamptz;

create or replace function public.set_patient_archived(target uuid, archived boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  owner uuid;
  stamp timestamptz;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'archive_pro_only';
  end if;
  if archived is null then
    raise exception using errcode = '22023', message = 'archive_flag';
  end if;
  select p.nutritionist_id into owner from public.patients p
    where p.id = target and p.deactivated_at is null and p.anonymized_at is null;
  if owner is null or owner is distinct from nid then
    raise exception using errcode = '42501', message = 'archive_forbidden';
  end if;
  update public.patients
    set archived_at = case when archived then coalesce(archived_at, clock_timestamp()) else null end
    where id = target
    returning archived_at into stamp;
  return jsonb_build_object('patient_id', target, 'archived_at', stamp);
end; $$;

revoke all on function public.set_patient_archived(uuid, boolean) from public, anon;
grant execute on function public.set_patient_archived(uuid, boolean) to authenticated;
