-- Invitaciones internas por correo confirmado y nombres del propio equipo.
-- Reversión operativa: volver al cliente anterior; conservar las invitaciones.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
create function public.scheduling_invite_professional_email(org_id uuid,target_email text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare peer uuid; nid uuid:=public.my_nutritionist_id();
begin
 if nid is null or not public.is_org_manager(org_id) then raise exception using errcode='42501',message='org_forbidden';end if;
 if target_email is null or length(target_email)>254 or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using errcode='22023',message='org_email_invalid';end if;
 select n.id into peer from public.nutritionists n join auth.users u on u.id=n.user_id
 where lower(u.email)=lower(btrim(target_email)) and u.email_confirmed_at is not null;
 if peer is not null and peer<>nid and not exists(select 1 from public.organization_members m where m.organization_id=org_id and m.nutritionist_id=peer and m.status='active') then
  perform public.invite_org_member(org_id,peer,'member');
 end if;
 -- Respuesta genérica: no revela cuentas o correos sin confirmar.
 return jsonb_build_object('accepted',true);
end $$;
revoke all on function public.scheduling_invite_professional_email(uuid,text) from public,anon;
grant execute on function public.scheduling_invite_professional_email(uuid,text) to authenticated;
create function public.scheduling_professional_directory(org_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare nid uuid:=public.my_nutritionist_id();
begin
 if nid is null or not exists(select 1 from public.organization_members m where m.organization_id=org_id and m.nutritionist_id=nid and m.status in ('active','invited')) then raise exception using errcode='42501',message='org_forbidden';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('nutritionist_id',n.id,'name',n.display_name,'status',m.status,'is_self',n.id=nid) order by n.display_name,n.id)
 from public.organization_members m join public.nutritionists n on n.id=m.nutritionist_id where m.organization_id=org_id and m.status in ('active','invited')),'[]'::jsonb);
end $$;
revoke all on function public.scheduling_professional_directory(uuid) from public,anon;
grant execute on function public.scheduling_professional_directory(uuid) to authenticated;
commit;
