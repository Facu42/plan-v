-- Paquetes de consultas, vista de la paciente (2026-11-05): ve en su app cuántas consultas le quedan.
-- Solo agrega una función nueva. Devuelve nombre, total, usadas y fechas; nunca las notas de la nutri.
create or replace function public.get_my_patient_packs(target uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or target is distinct from public.my_patient_id() then
    raise exception using errcode = '42501', message = 'pack_forbidden';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'sessions', p.sessions,
      'used', (select count(*) from public.patient_pack_uses u where u.pack_id = p.id and u.voided_at is null),
      'starts_on', p.starts_on, 'expires_on', p.expires_on, 'closed', p.closed_at is not null
    ) order by p.starts_on desc, p.created_at desc)
    from public.patient_packs p where p.patient_id = target
  ), '[]'::jsonb);
end; $$;
revoke all on function public.get_my_patient_packs(uuid) from public, anon;
grant execute on function public.get_my_patient_packs(uuid) to authenticated;
