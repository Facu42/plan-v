-- Publicación explícita de grupos revisados. Apagado por defecto y CAS por consultorio.
-- Solo funciones privadas con autorización; wrappers públicos invoker para PostgREST.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';
grant usage on schema private to authenticated;

create table private.nutrition_exchange_visibility (
  owner_id uuid primary key references public.nutritionists(id) on delete cascade,
  enabled boolean not null default false,
  revision bigint not null check (revision between 1 and 9007199254740991),
  updated_at timestamptz not null default clock_timestamp()
);
alter table private.nutrition_exchange_visibility enable row level security;
revoke all on private.nutrition_exchange_visibility from public, anon, authenticated;
grant all on private.nutrition_exchange_visibility to service_role;

create function private.nutrition_exchange_visibility()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid := public.recipe_assert_nutri(); result jsonb;
begin
  if public.is_platform_admin() then raise exception using errcode='42501',message='exchange_professional_only'; end if;
  select jsonb_build_object('enabled',v.enabled,'revision',v.revision) into result
    from private.nutrition_exchange_visibility v where v.owner_id=owner;
  return coalesce(result,jsonb_build_object('enabled',false,'revision',0));
end; $$;
revoke all on function private.nutrition_exchange_visibility() from public,anon;
grant execute on function private.nutrition_exchange_visibility() to authenticated;
create function public.nutrition_exchange_visibility() returns jsonb language sql stable security invoker set search_path='' as $$ select private.nutrition_exchange_visibility(); $$;
revoke all on function public.nutrition_exchange_visibility() from public,anon;
grant execute on function public.nutrition_exchange_visibility() to authenticated;

create function private.save_nutrition_exchange_visibility(expected_revision bigint, visibility_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid := public.recipe_assert_nutri(); prior_revision bigint;
begin
  if public.is_platform_admin() then raise exception using errcode='42501',message='exchange_professional_only'; end if;
  if expected_revision is null or expected_revision<0 or expected_revision>=9007199254740991 or visibility_enabled is null then
    raise exception using errcode='22023',message='exchange_visibility_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text,291955));
  select v.revision into prior_revision from private.nutrition_exchange_visibility v where v.owner_id=owner for update;
  if coalesce(prior_revision,0)<>expected_revision then raise exception using errcode='PT409',message='exchange_visibility_changed'; end if;
  insert into private.nutrition_exchange_visibility(owner_id,enabled,revision)
    values(owner,visibility_enabled,expected_revision+1)
    on conflict(owner_id) do update set enabled=excluded.enabled,revision=excluded.revision,updated_at=clock_timestamp();
  return jsonb_build_object('enabled',visibility_enabled,'revision',expected_revision+1);
end; $$;
revoke all on function private.save_nutrition_exchange_visibility(bigint,boolean) from public,anon;
grant execute on function private.save_nutrition_exchange_visibility(bigint,boolean) to authenticated;
create function public.save_nutrition_exchange_visibility(expected_revision bigint,visibility_enabled boolean)
returns jsonb language sql security invoker set search_path='' as $$ select private.save_nutrition_exchange_visibility(expected_revision,visibility_enabled); $$;
revoke all on function public.save_nutrition_exchange_visibility(bigint,boolean) from public,anon;
grant execute on function public.save_nutrition_exchange_visibility(bigint,boolean) to authenticated;

create function private.list_patient_nutrition_exchanges(target_patient uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid; enabled boolean; result jsonb;
begin
  if auth.uid() is null or public.is_platform_admin() then raise exception using errcode='42501',message='exchange_patient_access'; end if;
  select p.nutritionist_id into owner from public.patients p
    where p.id=target_patient and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null;
  if owner is null or not (public.my_nutritionist_id() is not distinct from owner or public.my_patient_id() is not distinct from target_patient) then
    raise exception using errcode='42501',message='exchange_patient_access';
  end if;
  select v.enabled into enabled from private.nutrition_exchange_visibility v where v.owner_id=owner;
  if not coalesce(enabled,false) then return jsonb_build_object('enabled',false,'groups','[]'::jsonb); end if;
  -- Solo filas guardadas por save_nutrition_exchange: exige reviewed=true y congela alimentos reales.
  -- Lista blanca de campos; no se expone owner_id, reference ni la copia completa de Food.
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'name',g.payload->>'name','revision',g.revision,
    'items',(select coalesce(jsonb_agg(jsonb_build_object(
      'quantity',coalesce(i.item->'quantity',i.item->'grams'),
      'unit',coalesce(i.item->>'unit','g'),
      'food',jsonb_build_object('id',i.item#>>'{food,id}','name',i.item#>>'{food,name}',
        'nutrients',jsonb_build_object('kcal',i.item#>'{food,nutrients,kcal}','protein',i.item#>'{food,nutrients,protein}','carbs',i.item#>'{food,nutrients,carbs}','fat',i.item#>'{food,nutrients,fat}'),
        'portions',coalesce(i.item#>'{food,portions}','[]'::jsonb))
    ) order by i.ordinality),'[]'::jsonb)
      from jsonb_array_elements(g.payload->'items') with ordinality as i(item,ordinality))
  ) order by g.id),'[]'::jsonb) into result
  from public.nutrition_exchanges g where g.owner_id=owner;
  return jsonb_build_object('enabled',true,'groups',result);
end; $$;
revoke all on function private.list_patient_nutrition_exchanges(uuid) from public,anon;
grant execute on function private.list_patient_nutrition_exchanges(uuid) to authenticated;
create function public.list_patient_nutrition_exchanges(target_patient uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.list_patient_nutrition_exchanges(target_patient); $$;
revoke all on function public.list_patient_nutrition_exchanges(uuid) from public,anon;
grant execute on function public.list_patient_nutrition_exchanges(uuid) to authenticated;
commit;
