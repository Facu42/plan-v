begin;
set local lock_timeout='2s';
set local statement_timeout='30s';

-- La autoría de un recurso propio es la nutricionista que lo escribió, no «Plan V».
create function private.resources_professional_author() returns trigger language plpgsql set search_path='' as $$
declare name text;
begin
  if new.nutritionist_id is null then return new; end if;
  select left(btrim(n.display_name), 80) into name from public.nutritionists n where n.id = new.nutritionist_id;
  if char_length(coalesce(name, '')) >= 2 then new.author_name := name; end if;
  return new;
end $$;
revoke all on function private.resources_professional_author() from public, anon, authenticated;
create trigger resources_professional_author before insert or update of published on public.resources
  for each row execute function private.resources_professional_author();

update public.resources r set author_name = left(btrim(n.display_name), 80)
from public.nutritionists n
where r.nutritionist_id = n.id and r.author_name = 'Equipo editorial Plan V' and char_length(left(btrim(n.display_name), 80)) >= 2;

-- Despublicar oculta el recurso a las pacientes sin borrar su contenido ni sus asignaciones.
create function public.unpublish_editorial_resource(target uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid := public.my_nutritionist_id(); rec public.resources%rowtype;
begin
  if nid is null then raise exception using errcode = '42501', message = 'resource_assign_role'; end if;
  select * into rec from public.resources r where r.id = target for update;
  if not found then raise exception using errcode = 'P0002', message = 'resource_missing'; end if;
  if rec.nutritionist_id is distinct from nid then raise exception using errcode = '42501', message = 'resource_not_owner'; end if;
  update public.resources set published = false, eyebrow = 'BORRADOR' where id = target returning * into rec;
  return public.resource_row_json(rec);
end $$;
revoke all on function public.unpublish_editorial_resource(uuid) from public, anon;
grant execute on function public.unpublish_editorial_resource(uuid) to authenticated;
commit;
