-- Auditoría operativa del administrador, sin cuerpos ni datos clínicos.
-- Aplicar antes del servidor. No aplicar en producción sin autorización escrita.
-- Reversión: retirar el middleware; conservar la tabla como evidencia y revocar la RPC.
begin;
create schema if not exists private;
create table private.admin_audit_log (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  actor_id uuid not null,
  action text not null check (action in (
    'nutritionist.create','nutritionist.override','nutritionist.suspend','nutritionist.waive','nutritionist.restore','nutritionist.trial','payment.create','payment.void',
    'service.settings','nutritionist.send_access','nutritionist.note','test_accounts.create','ai.check','admin.other'
  )),
  target_id uuid,
  outcome text not null check (outcome in ('started','succeeded','failed')),
  occurred_at timestamptz not null default clock_timestamp(),
  unique (request_id, outcome)
);
create unique index admin_audit_log_one_result on private.admin_audit_log(request_id)
  where outcome in ('succeeded','failed');
alter table private.admin_audit_log enable row level security;
revoke all on private.admin_audit_log from public, anon, authenticated, service_role;
revoke all on sequence private.admin_audit_log_id_seq from public, anon, authenticated, service_role;

create function public.admin_record_audit(request_id uuid, input_action text, input_outcome text, target uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_platform_admin()
     or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal','aal1') <> 'aal2' then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if input_outcome = 'started' then
    insert into private.admin_audit_log(request_id,actor_id,action,target_id,outcome)
    values(request_id,auth.uid(),input_action,target,input_outcome);
  elsif input_outcome in ('succeeded','failed') then
    -- Serializa el cierre: un intento no puede terminar con dos resultados distintos.
    perform 1 from private.admin_audit_log a
      where a.request_id = admin_record_audit.request_id and a.outcome = 'started' for update;
    if not exists (
      select 1 from private.admin_audit_log a
      where a.request_id = admin_record_audit.request_id and a.actor_id = auth.uid()
        and a.action = input_action and a.target_id is not distinct from target and a.outcome = 'started'
    ) or exists (
      select 1 from private.admin_audit_log a
      where a.request_id = admin_record_audit.request_id and a.outcome in ('succeeded','failed')
    ) then
      raise exception 'Intento inválido' using errcode = '22023';
    end if;
    insert into private.admin_audit_log(request_id,actor_id,action,target_id,outcome)
    values(request_id,auth.uid(),input_action,target,input_outcome);
  else
    raise exception 'Resultado inválido' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.admin_record_audit(uuid,text,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_record_audit(uuid,text,text,uuid) to authenticated;
commit;
