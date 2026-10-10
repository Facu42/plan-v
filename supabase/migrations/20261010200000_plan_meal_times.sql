-- Horario orientativo de cada momento del plan («Desayuno 08:00»), visible para la nutricionista y la paciente.
-- Se guarda por versión: queda fijo al publicar y pasa a la versión siguiente si el pedido no lo cambia.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter table public.meal_plan_versions add column meal_times jsonb;
create function public.guard_plan_meal_times() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and old.status in ('published','archived') and new.meal_times is distinct from old.meal_times then raise exception using errcode='22023',message='meal_times_immutable'; end if;
 if new.meal_times is null then return new; end if;
 if jsonb_typeof(new.meal_times) is distinct from 'object'
  or exists(select 1 from jsonb_each(new.meal_times) e where e.key not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')
   or jsonb_typeof(e.value) is distinct from 'string' or (e.value#>>'{}') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then
  raise exception using errcode='22023',message='meal_times_shape';
 end if;
 return new;
end $$;
revoke all on function public.guard_plan_meal_times() from public,anon,authenticated;
create trigger plan_meal_times_guard before insert or update on public.meal_plan_versions for each row execute function public.guard_plan_meal_times();

alter function public.meal_plan_version_json(uuid) rename to meal_plan_version_pre_meal_times;
create function public.meal_plan_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select public.meal_plan_version_pre_meal_times(vid)||case when v.meal_times is null then '{}'::jsonb else jsonb_build_object('meal_times',v.meal_times) end from public.meal_plan_versions v where v.id=vid;
$$;
revoke all on function public.meal_plan_version_pre_meal_times(uuid),public.meal_plan_version_json(uuid) from public,anon,authenticated;

alter function public.list_published_meal_plan(uuid) rename to published_plan_pre_meal_times;
create function public.list_published_meal_plan(target_patient uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; data jsonb;
begin
 result:=public.published_plan_pre_meal_times(target_patient); if result is null then return null; end if;
 select v.meal_times into data from public.meal_plan_versions v where v.meal_plan_id=(result->>'id')::uuid and v.version=(result->>'version')::int;
 return result||case when data is null then '{}'::jsonb else jsonb_build_object('meal_times',data) end;
end $$;
revoke all on function public.published_plan_pre_meal_times(uuid),public.list_published_meal_plan(uuid) from public,anon,authenticated;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

-- Un objeto vacío borra los horarios; si el pedido no los trae, se conservan los de la última versión.
alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_plan_pre_meal_times;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb; prior jsonb;
begin
 perform public.intake_assert_access(target_patient,true);
 if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='plan_data'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_patient::text,3));
 select v.meal_times into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
  where p.patient_id=target_patient and p.nutritionist_id=owner order by v.version desc limit 1;
 result:=public.save_plan_pre_meal_times(target_patient,payload-'meal_times');
 update public.meal_plan_versions set meal_times=case when payload ? 'meal_times' then nullif(payload->'meal_times','{}'::jsonb) else prior end
  where id=(result->'current'->>'id')::uuid;
 return public.meal_plan_professional_json((result->>'id')::uuid);
end $$;
revoke all on function public.save_plan_pre_meal_times(uuid,jsonb),public.save_meal_plan_draft(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

-- Aplicar un modelo crea una versión nueva: conserva los horarios de la anterior.
alter function public.apply_professional_model(uuid,jsonb) rename to apply_model_pre_meal_times;
create function public.apply_professional_model(model_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb; prior jsonb; patient uuid;
begin
 if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='model_review'; end if;
 patient:=(payload->>'patient_id')::uuid;
 select v.meal_times into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
  where p.patient_id=patient and p.nutritionist_id=owner order by v.version desc limit 1;
 result:=public.apply_model_pre_meal_times(model_id,payload);
 if prior is not null then update public.meal_plan_versions set meal_times=prior where id=(result->'current'->>'id')::uuid; end if;
 return public.meal_plan_professional_json((result->>'id')::uuid);
end $$;
revoke all on function public.apply_model_pre_meal_times(uuid,jsonb),public.apply_professional_model(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_professional_model(uuid,jsonb) to authenticated;
commit;
