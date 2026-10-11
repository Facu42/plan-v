-- Favoritos privados del nutricionista, separados de los del paciente.
-- Producción requiere autorización. Recuperación: el cliente anterior ignora
-- esta tabla; conservarla para no perder las preferencias del consultorio.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create table public.professional_recipe_favorites (
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  primary key(nutritionist_id,recipe_id)
);
alter table public.professional_recipe_favorites enable row level security;
revoke all on public.professional_recipe_favorites from public,anon,authenticated;
grant select on public.professional_recipe_favorites to authenticated;
create policy professional_recipe_favorites_read on public.professional_recipe_favorites for select to authenticated
  using(nutritionist_id=public.my_nutritionist_id());

create function public.list_professional_recipe_favorites() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri();
begin
  return coalesce((select jsonb_agg(f.recipe_id order by f.created_at,f.recipe_id)
    from public.professional_recipe_favorites f join public.recipes r on r.id=f.recipe_id
    where f.nutritionist_id=nid and r.nutritionist_id=nid),'[]'::jsonb);
end; $$;
create function public.set_professional_recipe_favorite(target_recipe uuid,is_favorite boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid:=public.recipe_assert_nutri();
begin
  if is_favorite is null then raise exception using errcode='22023',message='recipe_favorite'; end if;
  if not exists(select 1 from public.recipes r where r.id=target_recipe and r.nutritionist_id=nid) then
    raise exception using errcode='42501',message='recipe_owner'; end if;
  if is_favorite then
    insert into public.professional_recipe_favorites(nutritionist_id,recipe_id) values(nid,target_recipe) on conflict do nothing;
  else delete from public.professional_recipe_favorites where nutritionist_id=nid and recipe_id=target_recipe; end if;
  return jsonb_build_object('recipe_id',target_recipe,'favorite',is_favorite);
end; $$;
revoke all on function public.list_professional_recipe_favorites(),public.set_professional_recipe_favorite(uuid,boolean) from public,anon;
grant execute on function public.list_professional_recipe_favorites(),public.set_professional_recipe_favorite(uuid,boolean) to authenticated;
commit;
