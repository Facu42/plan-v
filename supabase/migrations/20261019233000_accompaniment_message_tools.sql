-- Fase 6 del panel. Preparada y verificada localmente; aplicar en producción sólo con la frase de Facundo.
-- Reversión sin pérdida: retirar permisos de las dos funciones nuevas y de la tabla, conservar sus datos
-- y volver al código anterior. No borrar respuestas ni motivos registrados.

create function public.valid_professional_message_replies(value jsonb)
returns boolean language sql immutable set search_path='' as $$
 select case when pg_catalog.jsonb_typeof(value) is distinct from 'array' then false
 else pg_catalog.jsonb_array_length(value)<=50 and not exists (
  select 1 from pg_catalog.jsonb_array_elements(value) item
  where pg_catalog.jsonb_typeof(item) is distinct from 'object'
   or pg_catalog.jsonb_typeof(item->'id') is distinct from 'string'
   or coalesce(item->>'id','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   or pg_catalog.jsonb_typeof(item->'title') is distinct from 'string'
   or pg_catalog.length(pg_catalog.btrim(item->>'title')) not between 1 and 100
   or pg_catalog.jsonb_typeof(item->'body') is distinct from 'string'
   or pg_catalog.length(pg_catalog.btrim(item->>'body')) not between 1 and 2000
 ) and (select pg_catalog.count(*)=pg_catalog.count(distinct item->>'id') from pg_catalog.jsonb_array_elements(value) item)
 end;
$$;
revoke all on function public.valid_professional_message_replies(jsonb) from public,anon;
grant execute on function public.valid_professional_message_replies(jsonb) to authenticated,service_role;

create table public.professional_message_settings (
 nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,
 revision uuid not null default gen_random_uuid(),
 replies jsonb not null default '[]'::jsonb check (public.valid_professional_message_replies(replies)),
 starred_patient_ids uuid[] not null default '{}'::uuid[] check (pg_catalog.cardinality(starred_patient_ids)<=500),
 updated_at timestamptz not null default now()
);
-- La PK ya cubre la clave foránea nutritionist_id.
alter table public.professional_message_settings enable row level security;
revoke all on public.professional_message_settings from public,anon;
grant select,insert,update on public.professional_message_settings to authenticated;
grant select,insert,update,delete on public.professional_message_settings to service_role;
create policy professional_message_settings_own on public.professional_message_settings
for all to authenticated
using (exists(select 1 from public.nutritionists n join public.profiles pr on pr.id=n.user_id
 where n.id=professional_message_settings.nutritionist_id and n.user_id=(select auth.uid()) and pr.role='nutri'))
with check (exists(select 1 from public.nutritionists n join public.profiles pr on pr.id=n.user_id
 where n.id=professional_message_settings.nutritionist_id and n.user_id=(select auth.uid()) and pr.role='nutri'));

alter table public.patients add column archive_reason text check (archive_reason is null or pg_catalog.length(archive_reason)<=240);
comment on column public.patients.archive_reason is 'Motivo opcional de archivo indicado por su profesional; no se expone a otras cuentas ni al administrador.';

-- Verificar propiedad y elegibilidad y encolar el aviso en una operación. El bloqueo de la ficha
-- evita que un archivo concurrente se interponga entre la comprobación y el alta del aviso.
create function public.enqueue_followup_reminder(target_patient uuid,request_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 patient public.patients;
 today date := (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date;
 since date;
begin
 if request_id is null or target_patient is null then
  raise exception using errcode='22023',message='followup_invalid';
 end if;
 select p.* into patient from public.patients p
 join public.nutritionists n on n.id=p.nutritionist_id
 join public.profiles pr on pr.id=n.user_id
 where p.id=target_patient and n.user_id=(select auth.uid()) and pr.role='nutri'
 for update of p;
 if not found then raise exception using errcode='42501',message='followup_forbidden'; end if;
 since:=today-6;
 if patient.archived_at is not null or patient.deactivated_at is not null or patient.anonymized_at is not null
  or (patient.created_at at time zone 'America/Argentina/Buenos_Aires')::date>=since
  or exists(select 1 from public.meal_logs m where m.patient_id=target_patient
   and m.logged_at>=since::timestamp at time zone 'America/Argentina/Buenos_Aires'
   and m.logged_at<(today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  or exists(select 1 from public.habit_logs h where h.patient_id=target_patient and h.date between since and today
   and (h.hydration_declared or h.hydration>0 or h.energy is not null or h.sleep_minutes is not null or h.steps is not null or pg_catalog.cardinality(h.symptoms)>0))
  or exists(select 1 from public.activity_logs a where a.patient_id=target_patient
   and a.logged_at>=since::timestamp at time zone 'America/Argentina/Buenos_Aires'
   and a.logged_at<(today+1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
 then return pg_catalog.jsonb_build_object('skipped',true);end if;
 return public.enqueue_outbox_event(pg_catalog.jsonb_build_object(
  'patient_id',target_patient,'event_type','reminder','client_id',request_id,
  'dedupe_key','record-request:'||patient.nutritionist_id::text||':'||request_id::text,
  'subject','¿Cómo venís con tus registros?',
  'body','Tu nutricionista te invita a retomar los registros en el Diario de Plan V. Cuando puedas, contale cómo venís.',
  'kind','reminder'));
end;
$$;
revoke all on function public.enqueue_followup_reminder(uuid,uuid) from public,anon;
grant execute on function public.enqueue_followup_reminder(uuid,uuid) to authenticated;
