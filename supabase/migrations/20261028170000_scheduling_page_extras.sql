-- Página pública: permite la clave opcional `page_extras` (objeto de hasta 20 kB) en la configuración de la agenda.
-- Guarda el perfil ampliado, las obras sociales, los descuentos por medio de pago, las indicaciones por servicio, lo que se pide al reservar y los avisos.
-- Aditiva: misma función de guardado que 20261028140000, solo acepta esa clave más. Sin la clave, la página queda como hasta ahora. No toca datos.
-- Para volver atrás basta con volver a aplicar la función de 20261028140000.
create or replace function public.scheduling_save_config(target uuid,expected_revision int,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.scheduling_profiles; entry jsonb; cid text;
begin
 if not public.scheduling_owns(target) then raise exception 'scheduling_forbidden' using errcode='42501'; end if;
 if jsonb_typeof(payload)<>'object' or not (payload ?& array['timezone','calendars','types','weekly','blocks','page','google_calendar_id','google_enabled','create_meet','transfer_alias']) or (payload ? 'reminders_enabled' and jsonb_typeof(payload->'reminders_enabled')<>'boolean') or (payload ? 'page_extras' and (jsonb_typeof(payload->'page_extras')<>'object' or octet_length((payload->'page_extras')::text)>20000)) or octet_length(payload::text)>100000 or payload->>'timezone'<>'America/Argentina/Buenos_Aires' or jsonb_typeof(payload->'page')<>'object' or payload#>>'{page,slug}' !~ '^[a-z0-9][a-z0-9-]{2,59}$' or length(payload#>>'{page,bio}')>1200 then raise exception 'scheduling_config' using errcode='22023'; end if;
 if jsonb_typeof(payload->'calendars')<>'array' or jsonb_array_length(payload->'calendars') not between 1 and 10 or jsonb_typeof(payload->'types')<>'array' or jsonb_typeof(payload->'weekly')<>'array' or jsonb_typeof(payload->'blocks')<>'array' or jsonb_array_length(payload->'types')>30 or jsonb_array_length(payload->'weekly')>100 or jsonb_array_length(payload->'blocks')>300 then raise exception 'scheduling_config' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(payload) k where k not in('timezone','calendars','types','weekly','blocks','page','google_calendar_id','google_enabled','create_meet','transfer_alias','reminders_enabled','page_extras')) or exists(select 1 from jsonb_object_keys(payload->'page') k where k not in('slug','enabled','title','bio','location','contact','logo_url')) then raise exception 'scheduling_config' using errcode='22023';end if;
 for entry in select * from jsonb_array_elements(payload->'types') loop
  cid:=(entry->>'calendar_id')::uuid::text;
  if (entry->>'duration_min')::int not between 10 and 180 or (entry->>'price_minor')::bigint not between 0 and 100000000 or (entry->>'deposit_minor')::bigint not between 0 and (entry->>'price_minor')::bigint or entry->>'channel' not in('video','presencial') or not exists(select 1 from jsonb_array_elements(payload->'calendars') c where c->>'id'=cid) then raise exception 'scheduling_type' using errcode='22023'; end if;
 end loop;
 for entry in select * from jsonb_array_elements(payload->'weekly') loop
  if (entry->>'weekday')::int not between 0 and 6 or entry->>'start' !~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' or entry->>'end' !~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' or entry->>'start'>=entry->>'end' then raise exception 'scheduling_hours' using errcode='22023'; end if;
 end loop;
 if coalesce((payload->>'google_enabled')::boolean,false) and not exists(select 1 from public.scheduling_integrations where nutritionist_id=target and provider='google') then raise exception 'google_not_connected' using errcode='PT409'; end if;
 perform public.appointment_lock_nutritionist(target);
 select * into r from public.scheduling_profiles where nutritionist_id=target for update;
 if found then if r.revision<>expected_revision then raise exception 'scheduling_stale' using errcode='PT409'; end if;update public.scheduling_profiles set config=payload,slug=payload#>>'{page,slug}',revision=revision+1 where nutritionist_id=target returning * into r;
 else if expected_revision<>0 then raise exception 'scheduling_stale' using errcode='PT409'; end if;insert into public.scheduling_profiles(nutritionist_id,slug,config) values(target,payload#>>'{page,slug}',payload) returning * into r;end if;
 return to_jsonb(r);
end; $$;
revoke all on function public.scheduling_save_config(uuid,int,jsonb) from public,anon;
grant execute on function public.scheduling_save_config(uuid,int,jsonb) to authenticated;
