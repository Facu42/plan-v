-- Asignar por día exige el mismo control clínico que asignar una receta.
-- La receta publicada y su versión congelada se validan antes de escribir.
create or replace function public.assign_recipe_day(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  rid uuid;
  pid uuid;
  day date;
  expected int;
  slot_label text;
  ver public.recipe_versions;
  rec public.recipes;
  aid uuid;
begin
  nid := public.recipe_assert_nutri();
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  begin
    rid := (payload->>'recipe_id')::uuid;
    pid := (payload->>'patient_id')::uuid;
    day := (payload->>'for_date')::date;
    expected := (payload->>'expected_version')::int;
  exception when others then
    raise exception using errcode = '22023', message = 'recipe_day';
  end;
  slot_label := payload->>'slot';
  if rid is null or pid is null or day is null or expected is null or expected < 1
    or slot_label not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra') then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  perform public.intake_assert_access(pid, true);
  select * into rec from public.recipes where id = rid;
  if not found or rec.nutritionist_id is distinct from nid then
    raise exception using errcode = '42501', message = 'recipe_forbidden';
  end if;
  select * into ver from public.recipe_versions v
    where v.recipe_id = rid and v.version = expected;
  if not found or ver.published_at is null then
    raise exception using errcode = '22023', message = 'recipe_not_published';
  end if;
  -- Mantener los antecedentes usados por el control hasta cerrar esta transacción.
  perform 1 from public.intake_sessions where patient_id = pid for share;
  perform public.assert_health_publishable(pid, public.recipe_version_haystack(ver.id));
  insert into public.recipe_day_assignments (patient_id, nutritionist_id, recipe_id, recipe_version_id, for_date, slot)
  values (pid, nid, rid, ver.id, day, slot_label)
  on conflict (patient_id, for_date, slot) do update
    set recipe_id = excluded.recipe_id,
        recipe_version_id = excluded.recipe_version_id,
        nutritionist_id = excluded.nutritionist_id
  returning id into aid;
  -- Que también aparezca en "Mis recetas" de la paciente.
  insert into public.recipe_assignments (recipe_id, patient_id, nutritionist_id, recipe_version_id)
  values (rid, pid, nid, ver.id)
  on conflict (recipe_id, patient_id) do update
    set recipe_version_id = excluded.recipe_version_id, assigned_at = clock_timestamp(), nutritionist_id = excluded.nutritionist_id;
  return public.recipe_day_json(aid);
end; $$;


revoke all on function public.assign_recipe_day(jsonb) from public, anon;
grant execute on function public.assign_recipe_day(jsonb) to authenticated;

