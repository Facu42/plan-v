-- PV-47: la nutricionista habilita el acceso de su paciente desde la app.
-- Hasta acá la ruta respondía 501 en producción y toda paciente nueva quedaba
-- en 'pending' (sin registrar comidas ni hábitos) sin forma de destrabarla.
-- El cobro sigue fuera de la app: esto sólo registra lo que la profesional
-- decide (sin cargo, pago hasta una fecha o pendiente). 'past_due' se deriva.

create or replace function public.set_patient_billing(target uuid, next_status text, until date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  owner uuid;
  label text;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'billing_pro_only';
  end if;
  select p.nutritionist_id into owner from public.patients p
    where p.id = target and p.deactivated_at is null and p.anonymized_at is null;
  if owner is null or owner is distinct from nid then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  if next_status not in ('pending', 'waived', 'active') then
    raise exception using errcode = '22023', message = 'billing_status';
  end if;
  if (next_status = 'active') <> (until is not null) then
    raise exception using errcode = '22023', message = 'billing_until';
  end if;
  update public.patients
    set billing_status = next_status::public.billing_status,
        billing_until = until
    where id = target;
  label := case next_status when 'waived' then 'sin cargo' when 'active' then 'activo' else 'pendiente' end;
  insert into public.timeline_events (patient_id, kind, visibility, title, body)
  values (
    target, 'billing', 'patient', 'Acceso · ' || label,
    case when until is not null then 'Vigente hasta ' || to_char(until, 'DD/MM/YYYY')
      when next_status = 'waived' then 'Acceso habilitado por tu nutricionista'
      else 'A la espera de confirmación de pago' end
  );
  return jsonb_build_object('patient_id', target, 'billing_status', next_status, 'billing_until', until);
end; $$;

revoke all on function public.set_patient_billing(uuid, text, date) from public, anon;
grant execute on function public.set_patient_billing(uuid, text, date) to authenticated;
