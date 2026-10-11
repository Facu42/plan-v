-- Los materiales propios de un consultorio no se leen ni se asignan desde otro.
-- No se modifica contenido ni asignaciones existentes.
begin;
drop policy if exists resources_visible_select on public.resources;
create policy resources_visible_select on public.resources for select to authenticated using (
  (nutritionist_id is null and kind = 'operational' and published)
  or (kind = 'clinical' and published and exists (
    select 1 from public.resource_assignments a where a.resource_id = public.resources.id
      and a.patient_id is not distinct from public.my_patient_id()
  ))
  or (public.my_nutritionist_id() is not null and (nutritionist_id is null or nutritionist_id = public.my_nutritionist_id()))
);

create or replace function public.assign_editorial_resource(resource_slug text, patient_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  rid uuid;
  pid uuid;
  assigned_count int := 0;
  existing_count int := 0;
begin
  nid := public.my_nutritionist_id();
  if nid is null then
    raise exception using errcode = '42501', message = 'resource_assign_role';
  end if;
  select id into rid from public.resources r
  where r.slug = btrim(resource_slug) and r.published;
  if rid is null then
    raise exception using errcode = '22023', message = 'resource_unknown';
  end if;
  if exists (select 1 from public.resources r where r.id = rid and r.nutritionist_id is not null and r.nutritionist_id is distinct from nid) then
    raise exception using errcode = '42501', message = 'resource_not_owner';
  end if;
  if patient_ids is null or array_length(patient_ids, 1) is null then
    raise exception using errcode = '22023', message = 'resource_patients';
  end if;
  foreach pid in array patient_ids
  loop
    if not public.is_assigned_patient(pid) then
      raise exception using errcode = '42501', message = 'resource_not_assigned';
    end if;
    insert into public.resource_assignments (resource_id, patient_id, nutritionist_id, assigned_by)
    values (rid, pid, nid, auth.uid())
    on conflict (resource_id, patient_id) do nothing;
    if found then
      assigned_count := assigned_count + 1;
    else
      existing_count := existing_count + 1;
    end if;
  end loop;
  return jsonb_build_object(
    'assigned_count', assigned_count,
    'existing_count', existing_count,
    'resource_id', btrim(resource_slug)
  );
end;
$$;

commit;
