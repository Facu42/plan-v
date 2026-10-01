-- Panel del servicio: el administrador de Plan V (Facundo) lleva la suscripción de cada
-- nutricionista, registra sus pagos manuales y fija el precio mensual y los días de prueba.
-- Nada de esto cambia qué puede hacer una nutricionista: el "solo lectura" al vencer es la parte 3.
-- El panel no lee datos de salud: sólo nombre, mail, fechas y cantidad de pacientes.
-- Quién es administrador se carga a mano al aplicar (insert en platform_admins); no va en el repo.

create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.platform_settings (
  id boolean primary key default true check (id),
  monthly_price int check (monthly_price is null or monthly_price between 1 and 100000000),
  trial_days int not null default 30 check (trial_days between 0 and 365),
  updated_at timestamptz not null default clock_timestamp()
);
insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.nutritionist_subscriptions (
  nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,
  trial_ends_on date not null,
  paid_until date,
  override text not null default 'none' check (override in ('none', 'waived', 'suspended')),
  note text not null default '' check (char_length(note) <= 280),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.service_payments (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  amount int not null check (amount between 1 and 100000000),
  months int not null check (months between 1 and 24),
  paid_on date not null,
  method text not null check (method in ('transferencia', 'mercado_pago', 'efectivo', 'otro')),
  note text not null default '' check (char_length(note) <= 280),
  status text not null default 'confirmed' check (status in ('confirmed', 'voided')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists service_payments_nutritionist_idx
  on public.service_payments (nutritionist_id, paid_on);

-- Sin políticas: nadie lee estas tablas directo; todo pasa por las funciones de abajo.
alter table public.platform_admins enable row level security;
alter table public.platform_settings enable row level security;
alter table public.nutritionist_subscriptions enable row level security;
alter table public.service_payments enable row level security;
revoke all on public.platform_admins, public.platform_settings,
  public.nutritionist_subscriptions, public.service_payments from anon, authenticated;

-- Cada nutricionista nueva arranca con la prueba vigente en la configuración.
create or replace function public.service_start_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.nutritionist_subscriptions (nutritionist_id, trial_ends_on)
  select new.id, current_date + s.trial_days from public.platform_settings s where s.id
  on conflict (nutritionist_id) do nothing;
  return new;
end; $$;

drop trigger if exists nutritionists_service_trial on public.nutritionists;
create trigger nutritionists_service_trial
  after insert on public.nutritionists
  for each row execute function public.service_start_trial();

-- Las que ya existen arrancan hoy su prueba.
insert into public.nutritionist_subscriptions (nutritionist_id, trial_ends_on)
select n.id, current_date + s.trial_days
from public.nutritionists n cross join public.platform_settings s
where s.id
on conflict (nutritionist_id) do nothing;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

create or replace function public.service_assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'service_forbidden';
  end if;
end; $$;

create or replace function public.service_audit(target uuid, input_action text, details jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (actor_id, actor_role, source, action, object_type, object_id, nutritionist_id, metadata)
  values (auth.uid(), 'admin', 'user', input_action, 'nutritionist', target::text, target, coalesce(details, '{}'::jsonb));
$$;

-- "Pagado hasta" sale de los pagos confirmados, en orden. Un pago dentro de los 7 días de gracia
-- sigue desde el vencimiento anterior; si el corte fue más largo, cuenta desde el día que pagó.
create or replace function public.service_recompute(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub public.nutritionist_subscriptions%rowtype;
  p record;
  covered date;
  start_on date;
begin
  select * into sub from public.nutritionist_subscriptions s where s.nutritionist_id = target for update;
  if not found then
    return;
  end if;
  covered := null;
  for p in
    select sp.paid_on, sp.months from public.service_payments sp
    where sp.nutritionist_id = target and sp.status = 'confirmed'
    order by sp.paid_on, sp.created_at
  loop
    start_on := coalesce(covered, sub.trial_ends_on);
    if start_on < p.paid_on - 7 then
      start_on := p.paid_on;
    end if;
    covered := (start_on + make_interval(months => p.months))::date;
  end loop;
  update public.nutritionist_subscriptions
  set paid_until = covered, updated_at = clock_timestamp()
  where nutritionist_id = target;
end; $$;

-- plpgsql y no sql: el cuerpo se valida al usarse (las bases de prueba no tienen last_sign_in_at).
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

create or replace function public.admin_get_service_board()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  return jsonb_build_object(
    'settings', (
      select jsonb_build_object('monthly_price', s.monthly_price, 'trial_days', s.trial_days)
      from public.platform_settings s where s.id
    ),
    'nutritionists', coalesce((
      select jsonb_agg(public.service_nutritionist_json(n.id) order by n.display_name)
      from public.nutritionists n
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'occurred_at', e.occurred_at, 'action', e.action,
        'nutritionist_id', e.nutritionist_id, 'metadata', e.metadata
      ) order by e.occurred_at desc)
      from (
        select * from public.audit_events a
        where a.action like 'service.%'
        order by a.occurred_at desc
        limit 30
      ) e
    ), '[]'::jsonb)
  );
end; $$;

create or replace function public.admin_set_service_settings(monthly_price int, trial_days int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if (monthly_price is not null and monthly_price not between 1 and 100000000)
    or trial_days is null or trial_days not between 0 and 365 then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  update public.platform_settings s
  set monthly_price = admin_set_service_settings.monthly_price,
      trial_days = admin_set_service_settings.trial_days,
      updated_at = clock_timestamp()
  where s.id;
  insert into public.audit_events (actor_id, actor_role, source, action, object_type, metadata)
  values (auth.uid(), 'admin', 'user', 'service.settings', 'platform',
    jsonb_build_object('monthly_price', monthly_price, 'trial_days', trial_days));
  return (select jsonb_build_object('monthly_price', s.monthly_price, 'trial_days', s.trial_days)
    from public.platform_settings s where s.id);
end; $$;

create or replace function public.admin_record_service_payment(
  target uuid, amount int, months int, paid_on date, method text, note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if not exists (select 1 from public.nutritionist_subscriptions s where s.nutritionist_id = target) then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  if amount is null or amount not between 1 and 100000000
    or months is null or months not between 1 and 24
    or paid_on is null or paid_on > current_date + 1 or paid_on < current_date - 366
    or method is null or method not in ('transferencia', 'mercado_pago', 'efectivo', 'otro')
    or char_length(coalesce(note, '')) > 280 then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  insert into public.service_payments (nutritionist_id, amount, months, paid_on, method, note, created_by)
  values (target, amount, months, paid_on, method, btrim(coalesce(note, '')), auth.uid());
  perform public.service_recompute(target);
  perform public.service_audit(target, 'service.payment',
    jsonb_build_object('amount', amount, 'months', months, 'paid_on', paid_on, 'method', method));
  return public.service_nutritionist_json(target);
end; $$;

create or replace function public.admin_void_service_payment(payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  perform public.service_assert_admin();
  update public.service_payments sp set status = 'voided'
  where sp.id = payment_id and sp.status = 'confirmed'
  returning sp.nutritionist_id into target;
  if target is null then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  perform public.service_recompute(target);
  perform public.service_audit(target, 'service.payment_voided', jsonb_build_object('payment_id', payment_id));
  return public.service_nutritionist_json(target);
end; $$;

create or replace function public.admin_extend_trial(target uuid, days int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if days is null or days not between 1 and 365 then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  update public.nutritionist_subscriptions s
  set trial_ends_on = greatest(s.trial_ends_on, current_date) + days, updated_at = clock_timestamp()
  where s.nutritionist_id = target;
  if not found then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  perform public.service_recompute(target);
  perform public.service_audit(target, 'service.trial_extended', jsonb_build_object('days', days));
  return public.service_nutritionist_json(target);
end; $$;

create or replace function public.admin_set_service_override(target uuid, input_override text, note text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.service_assert_admin();
  if input_override is null or input_override not in ('none', 'waived', 'suspended')
    or char_length(coalesce(note, '')) > 280 then
    raise exception using errcode = '22023', message = 'service_invalid';
  end if;
  update public.nutritionist_subscriptions s
  set override = input_override, note = btrim(coalesce(admin_set_service_override.note, '')), updated_at = clock_timestamp()
  where s.nutritionist_id = target;
  if not found then
    raise exception using errcode = '22023', message = 'service_unknown';
  end if;
  perform public.service_audit(target, 'service.override', jsonb_build_object('override', input_override));
  return public.service_nutritionist_json(target);
end; $$;

-- Cierre: una dueña de consultorio ya no se pone "sin cargo" ni "en prueba" sola; sólo puede
-- cancelar. Los demás estados los pone el administrador. Los consultorios nuevos arrancan en prueba.
create or replace function public.set_organization_subscription_status(org_id uuid, input_status text, input_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status text := btrim(input_status);
  admin boolean := public.is_platform_admin();
begin
  if not admin and not public.is_org_manager(org_id) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  if new_status is null or new_status not in ('trialing', 'active', 'waived', 'canceled', 'past_due') then
    raise exception using errcode = '22023', message = 'org_subscription_invalid';
  end if;
  if not admin and new_status <> 'canceled' then
    raise exception using errcode = '42501', message = 'org_subscription_admin';
  end if;
  update public.organization_subscriptions
  set status = new_status,
      note = coalesce(nullif(btrim(input_note), ''), note),
      updated_at = clock_timestamp()
  where organization_id = org_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'org_missing';
  end if;
  if admin then
    insert into public.audit_events (actor_id, actor_role, source, action, object_type, object_id, metadata)
    values (auth.uid(), 'admin', 'user', 'service.org_status', 'organization', org_id::text,
      jsonb_build_object('status', new_status));
  end if;
  -- El administrador no es miembro del consultorio: la suscripción se devuelve directo.
  return (
    select jsonb_build_object(
      'organization_id', sub.organization_id, 'status', sub.status, 'plan_code', sub.plan_code,
      'valid_until', sub.valid_until, 'note', sub.note, 'updated_at', sub.updated_at
    )
    from public.organization_subscriptions sub where sub.organization_id = org_id
  );
end;
$$;

create or replace function public.create_organization(input_name text, input_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  oid uuid;
  tid uuid;
  slug text := lower(btrim(input_slug));
begin
  if nid is null then
    raise exception using errcode = '42501', message = 'org_role';
  end if;
  if char_length(btrim(input_name)) not between 2 and 80 or slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'org_invalid';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (btrim(input_name), slug, auth.uid())
  returning id into oid;
  insert into public.organization_members (organization_id, nutritionist_id, role, status, invited_by, joined_at)
  values (oid, nid, 'owner', 'active', auth.uid(), clock_timestamp());
  insert into public.teams (organization_id, name) values (oid, 'consultorio') returning id into tid;
  insert into public.team_members (team_id, nutritionist_id) values (tid, nid);
  insert into public.organization_subscriptions (organization_id, status, plan_code, valid_until, note)
  select oid, 'trialing', 'b2b_team', current_date + s.trial_days, 'prueba'
  from public.platform_settings s where s.id;
  return public.org_snapshot(oid);
end;
$$;

revoke all on function
  public.service_start_trial(),
  public.is_platform_admin(),
  public.service_assert_admin(),
  public.service_audit(uuid, text, jsonb),
  public.service_recompute(uuid),
  public.service_nutritionist_json(uuid),
  public.admin_get_service_board(),
  public.admin_set_service_settings(int, int),
  public.admin_record_service_payment(uuid, int, int, date, text, text),
  public.admin_void_service_payment(uuid),
  public.admin_extend_trial(uuid, int),
  public.admin_set_service_override(uuid, text, text)
from public, anon, authenticated;

grant execute on function
  public.is_platform_admin(),
  public.admin_get_service_board(),
  public.admin_set_service_settings(int, int),
  public.admin_record_service_payment(uuid, int, int, date, text, text),
  public.admin_void_service_payment(uuid),
  public.admin_extend_trial(uuid, int),
  public.admin_set_service_override(uuid, text, text)
to authenticated;
