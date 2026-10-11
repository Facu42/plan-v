-- Panel del servicio, altas (01/10/2026): el administrador da de alta nutricionistas, les reenvía
-- el acceso, crea un par de cuentas de prueba y deja una nota interna por nutricionista.
-- Las cuentas se crean con la API de Auth desde el servidor; acá sólo queda lo que vive en la base:
--   * marca de cuenta de prueba en la suscripción (las de prueba no cuentan en los números del panel),
--   * nota interna de hasta 500 caracteres,
--   * registro de auditoría de las altas y reenvíos (sin mails ni claves en el registro).
-- Sin tablas nuevas. Todas las funciones validan que quien llama sea administrador.

alter table public.nutritionist_subscriptions
  add column if not exists is_test boolean not null default false;

alter table public.nutritionist_subscriptions
  drop constraint if exists nutritionist_subscriptions_note_check;
alter table public.nutritionist_subscriptions
  add constraint nutritionist_subscriptions_note_check check (char_length(note) <= 500);

-- Igual que antes, más la marca de prueba.
create or replace function public.service_nutritionist_json(target uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return (select jsonb_build_object(
    'id', n.id,
    'display_name', n.display_name,
    'email', coalesce(u.email, ''),
    'created_at', n.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'is_test', coalesce(s.is_test, false),
    'patients_active', (
      select count(*) from public.patients p
      where p.nutritionist_id = n.id and p.archived_at is null and p.deactivated_at is null and p.anonymized_at is null
    ),
    'patients_total', (select count(*) from public.patients p where p.nutritionist_id = n.id),
    'subscription', jsonb_build_object(
      'trial_ends_on', s.trial_ends_on,
      'paid_until', s.paid_until,
      'override', coalesce(s.override, 'none'),
      'note', coalesce(s.note, '')
    ),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sp.id, 'amount', sp.amount, 'months', sp.months, 'paid_on', sp.paid_on,
        'method', sp.method, 'note', sp.note, 'status', sp.status, 'created_at', sp.created_at
      ) order by sp.paid_on desc, sp.created_at desc)
      from public.service_payments sp where sp.nutritionist_id = n.id
    ), '[]'::jsonb)
  )
  from public.nutritionists n
  left join auth.users u on u.id = n.user_id
  left join public.nutritionist_subscriptions s on s.nutritionist_id = n.id
  where n.id = target);
end; $$;

-- Nota interna del administrador (no la ve la nutricionista).
create or replace function public.admin_set_service_note(target uuid, note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if note is null or char_length(btrim(note)) > 500 then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  update public.nutritionist_subscriptions s
  set note = btrim(admin_set_service_note.note), updated_at = clock_timestamp()
  where s.nutritionist_id = target;
  if not found then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  perform public.service_audit(target, 'service.note', jsonb_build_object('length', char_length(btrim(note))));
  return public.service_nutritionist_json(target);
end; $$;

-- Altas y reenvíos de acceso hechos desde el servidor con la API de Auth: quedan anotados con
-- quien los hizo. Sólo estas acciones y sólo el modo de alta; nunca mails ni enlaces.
create or replace function public.admin_log_service_event(target uuid, input_action text, input_mode text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if input_action is null or input_action not in ('service.nutritionist_created', 'service.access_sent')
    or (input_mode is not null and input_mode not in ('invite', 'password')) then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  if not exists (select 1 from public.nutritionist_subscriptions s where s.nutritionist_id = target) then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  perform public.service_audit(target, input_action,
    case when input_mode is null then '{}'::jsonb else jsonb_build_object('mode', input_mode) end);
end; $$;

-- Marca la nutricionista de una cuenta de prueba: deja de contar en los números del panel.
create or replace function public.admin_mark_test_account(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  update public.nutritionist_subscriptions s
  set is_test = true, updated_at = clock_timestamp()
  where s.nutritionist_id = target;
  if not found then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  perform public.service_audit(target, 'service.test_accounts_created', '{}'::jsonb);
  return public.service_nutritionist_json(target);
end; $$;

revoke all on function
  public.service_nutritionist_json(uuid),
  public.admin_set_service_note(uuid, text),
  public.admin_log_service_event(uuid, text, text),
  public.admin_mark_test_account(uuid)
from public, anon, authenticated;

grant execute on function
  public.admin_set_service_note(uuid, text),
  public.admin_log_service_event(uuid, text, text),
  public.admin_mark_test_account(uuid)
to authenticated;
