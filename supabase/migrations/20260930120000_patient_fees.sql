-- Cobranzas (2026-09-30): la nutricionista lleva la cuenta de las cuotas de sus
-- pacientes. Plan V no mueve plata: la paciente le paga directo a su nutricionista
-- (efectivo, transferencia, link de Mercado Pago) y acá sólo se registra.
--
-- - patient_fees: cuota mensual de cada paciente (monto en pesos enteros y primer
--   vencimiento; se repite cada mes el mismo día).
-- - patient_charges: una fila por cuota vencida o por vencer. Se generan al leer
--   (billing_sync_charges) hasta la próxima cuota futura, así un cambio de monto
--   no reescribe las cuotas que ya vencieron.
-- - patient_payments: pagos. La nutricionista los carga confirmados; la paciente
--   puede avisar "Ya pagué" y queda a confirmar.
-- - nutritionist_payment_settings: alias, link de pago e indicaciones que ve la
--   paciente. La cuota por defecto es nutritionists.monthly_fee_ars (ya existía).
--
-- La deuda no toca el acceso de la paciente: eso sigue en set_patient_billing y
-- lo decide la nutricionista. Lectura directa por RLS; escrituras sólo por RPC.

create table if not exists public.nutritionist_payment_settings (
  nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,
  alias text not null default '' check (char_length(alias) <= 60),
  payment_link text not null default '' check (payment_link = '' or (payment_link ~ '^https://' and char_length(payment_link) <= 300)),
  instructions text not null default '' check (char_length(instructions) <= 500),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.patient_fees (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  amount int not null check (amount between 1 and 100000000),
  first_due_on date not null,
  -- Al cambiar la cuota, las cuotas ya generadas hasta esta fecha quedan como estaban.
  charges_from date,
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.patient_charges (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  due_on date not null,
  amount int not null check (amount between 1 and 100000000),
  status text not null default 'open' check (status in ('open', 'waived')),
  created_at timestamptz not null default clock_timestamp(),
  unique (patient_id, due_on)
);

create table if not exists public.patient_payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  amount int not null check (amount between 1 and 100000000),
  paid_on date not null,
  method text not null check (method in ('efectivo', 'transferencia', 'mercado_pago', 'otro')),
  note text not null default '' check (char_length(note) <= 280),
  status text not null check (status in ('confirmed', 'reported', 'rejected', 'voided')),
  reported_by_patient boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz
);

create index if not exists patient_charges_nutri_idx on public.patient_charges (nutritionist_id, due_on);
create index if not exists patient_payments_patient_idx on public.patient_payments (patient_id, paid_on desc);
create index if not exists patient_payments_nutri_idx on public.patient_payments (nutritionist_id, status);
create index if not exists patient_fees_nutri_idx on public.patient_fees (nutritionist_id);

alter table public.nutritionist_payment_settings enable row level security;
alter table public.patient_fees enable row level security;
alter table public.patient_charges enable row level security;
alter table public.patient_payments enable row level security;

drop policy if exists payment_settings_nutri_select on public.nutritionist_payment_settings;
create policy payment_settings_nutri_select on public.nutritionist_payment_settings
  for select using (nutritionist_id = (select public.my_nutritionist_id()));

drop policy if exists patient_fees_select on public.patient_fees;
create policy patient_fees_select on public.patient_fees
  for select using (
    nutritionist_id = (select public.my_nutritionist_id())
    or patient_id = (select public.my_patient_id())
  );

drop policy if exists patient_charges_select on public.patient_charges;
create policy patient_charges_select on public.patient_charges
  for select using (
    nutritionist_id = (select public.my_nutritionist_id())
    or patient_id = (select public.my_patient_id())
  );

drop policy if exists patient_payments_select on public.patient_payments;
create policy patient_payments_select on public.patient_payments
  for select using (
    nutritionist_id = (select public.my_nutritionist_id())
    or patient_id = (select public.my_patient_id())
  );

revoke all on public.nutritionist_payment_settings, public.patient_fees, public.patient_charges, public.patient_payments
  from public, anon, authenticated;
grant select on public.nutritionist_payment_settings, public.patient_fees, public.patient_charges, public.patient_payments
  to authenticated;

-- Interna: genera las cuotas vencidas y la próxima por vencer.
create or replace function public.billing_sync_charges(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  f public.patient_fees%rowtype;
  d date;
  n int := 0;
begin
  select * into f from public.patient_fees where patient_id = target;
  if not found then return; end if;
  loop
    d := (f.first_due_on + make_interval(months => n))::date;
    if f.charges_from is null or d > f.charges_from then
      insert into public.patient_charges (patient_id, nutritionist_id, due_on, amount)
      values (target, f.nutritionist_id, d, f.amount)
      on conflict (patient_id, due_on) do nothing;
    end if;
    exit when d > current_date or n >= 600;
    n := n + 1;
  end loop;
end; $$;

-- Interna: la paciente activa de la nutricionista que llama, o error.
create or replace function public.billing_assert_owner(target uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  nid uuid;
  owner uuid;
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
  return nid;
end; $$;

-- Interna: arma la cuenta de una paciente (cuota, cuotas y pagos).
create or replace function public.billing_ledger_json(target uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'patient_id', target,
    'fee', (
      select jsonb_build_object('amount', f.amount, 'first_due_on', f.first_due_on)
      from public.patient_fees f where f.patient_id = target
    ),
    'charges', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'due_on', c.due_on, 'amount', c.amount, 'status', c.status) order by c.due_on)
      from public.patient_charges c where c.patient_id = target
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'amount', p.amount, 'paid_on', p.paid_on, 'method', p.method, 'note', p.note,
        'status', p.status, 'reported_by_patient', p.reported_by_patient, 'created_at', p.created_at
      ) order by p.paid_on desc, p.created_at desc)
      from public.patient_payments p where p.patient_id = target
    ), '[]'::jsonb)
  );
$$;

-- Nutricionista: todas sus pacientes activas con su cuenta, más sus datos de pago.
create or replace function public.get_billing_board()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  pid uuid;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'billing_pro_only';
  end if;
  for pid in select f.patient_id from public.patient_fees f where f.nutritionist_id = nid loop
    perform public.billing_sync_charges(pid);
  end loop;
  return jsonb_build_object(
    'settings', (
      select jsonb_build_object(
        'default_fee', n.monthly_fee_ars,
        'alias', coalesce(s.alias, ''),
        'payment_link', coalesce(s.payment_link, ''),
        'instructions', coalesce(s.instructions, '')
      )
      from public.nutritionists n
      left join public.nutritionist_payment_settings s on s.nutritionist_id = n.id
      where n.id = nid
    ),
    'patients', coalesce((
      select jsonb_agg(public.billing_ledger_json(p.id) || jsonb_build_object('full_name', p.full_name) order by p.full_name)
      from public.patients p
      where p.nutritionist_id = nid and p.deactivated_at is null and p.anonymized_at is null and p.archived_at is null
    ), '[]'::jsonb)
  );
end; $$;

-- Nutricionista dueña o la propia paciente: su cuenta y cómo pagar.
create or replace function public.get_patient_ledger(target uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  if target is distinct from public.my_patient_id() then
    perform public.billing_assert_owner(target);
  end if;
  perform public.billing_sync_charges(target);
  select p.nutritionist_id into nid from public.patients p where p.id = target;
  return public.billing_ledger_json(target) || jsonb_build_object(
    'payment_info', (
      select jsonb_build_object(
        'nutritionist_name', n.display_name,
        'alias', coalesce(s.alias, ''),
        'payment_link', coalesce(s.payment_link, ''),
        'instructions', coalesce(s.instructions, '')
      )
      from public.nutritionists n
      left join public.nutritionist_payment_settings s on s.nutritionist_id = n.id
      where n.id = nid
    )
  );
end; $$;

create or replace function public.set_payment_settings(default_fee int, alias text, payment_link text, instructions text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'billing_pro_only';
  end if;
  if default_fee is not null and (default_fee < 1 or default_fee > 100000000) then
    raise exception using errcode = '22023', message = 'billing_amount';
  end if;
  if char_length(coalesce(alias, '')) > 60 or char_length(coalesce(instructions, '')) > 500
    or (coalesce(payment_link, '') <> '' and (btrim(payment_link) !~ '^https://' or char_length(btrim(payment_link)) > 300)) then
    raise exception using errcode = '22023', message = 'billing_settings';
  end if;
  update public.nutritionists set monthly_fee_ars = default_fee where id = nid;
  insert into public.nutritionist_payment_settings (nutritionist_id, alias, payment_link, instructions, updated_at)
  values (nid, btrim(coalesce(alias, '')), btrim(coalesce(payment_link, '')), btrim(coalesce(instructions, '')), clock_timestamp())
  on conflict (nutritionist_id) do update
    set alias = excluded.alias, payment_link = excluded.payment_link,
        instructions = excluded.instructions, updated_at = excluded.updated_at;
  return jsonb_build_object('default_fee', default_fee, 'alias', btrim(coalesce(alias, '')),
    'payment_link', btrim(coalesce(payment_link, '')), 'instructions', btrim(coalesce(instructions, '')));
end; $$;

-- Fija, cambia o quita (amount null) la cuota. Lo ya vencido no se reescribe.
create or replace function public.set_patient_fee(target uuid, amount int, first_due_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  last_due date;
begin
  nid := public.billing_assert_owner(target);
  if amount is not null and (amount < 1 or amount > 100000000 or first_due_on is null
    or first_due_on < current_date - 730 or first_due_on > current_date + 365) then
    raise exception using errcode = '22023', message = 'billing_fee';
  end if;
  perform public.billing_sync_charges(target);
  delete from public.patient_charges c where c.patient_id = target and c.due_on > current_date;
  select max(c.due_on) into last_due from public.patient_charges c where c.patient_id = target;
  if amount is null then
    delete from public.patient_fees f where f.patient_id = target;
  else
    insert into public.patient_fees (patient_id, nutritionist_id, amount, first_due_on, charges_from, updated_at)
    values (target, nid, amount, first_due_on, last_due, clock_timestamp())
    on conflict (patient_id) do update
      set amount = excluded.amount, first_due_on = excluded.first_due_on,
          charges_from = excluded.charges_from, updated_at = excluded.updated_at;
    perform public.billing_sync_charges(target);
  end if;
  return public.billing_ledger_json(target);
end; $$;

-- Interna: valida los datos de un pago.
create or replace function public.billing_assert_payment(amount int, paid_on date, method text, note text)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if amount is null or amount < 1 or amount > 100000000 then
    raise exception using errcode = '22023', message = 'billing_amount';
  end if;
  if paid_on is null or method is null or method not in ('efectivo', 'transferencia', 'mercado_pago', 'otro')
    or char_length(coalesce(note, '')) > 280 then
    raise exception using errcode = '22023', message = 'billing_payment';
  end if;
end; $$;

-- La nutricionista registra un pago (queda confirmado).
create or replace function public.record_patient_payment(target uuid, amount int, paid_on date, method text, note text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  nid := public.billing_assert_owner(target);
  perform public.billing_assert_payment(amount, paid_on, method, note);
  if paid_on < current_date - 1095 or paid_on > current_date + 1 then
    raise exception using errcode = '22023', message = 'billing_payment';
  end if;
  insert into public.patient_payments (patient_id, nutritionist_id, amount, paid_on, method, note, status, created_by, reviewed_at)
  values (target, nid, amount, paid_on, method, btrim(coalesce(note, '')), 'confirmed', auth.uid(), clock_timestamp());
  insert into public.timeline_events (patient_id, kind, visibility, title, body)
  values (target, 'billing', 'patient', 'Pago registrado', 'Tu nutricionista registró un pago del ' || to_char(paid_on, 'DD/MM/YYYY'));
  return public.billing_ledger_json(target);
end; $$;

-- La paciente avisa que pagó; queda a confirmar por su nutricionista.
create or replace function public.report_patient_payment(target uuid, amount int, paid_on date, method text, note text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  if auth.uid() is null or target is null or target is distinct from public.my_patient_id() then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  perform public.billing_assert_payment(amount, paid_on, method, note);
  if paid_on < current_date - 60 or paid_on > current_date + 1 then
    raise exception using errcode = '22023', message = 'billing_payment';
  end if;
  if (select count(*) from public.patient_payments p where p.patient_id = target and p.status = 'reported') >= 5 then
    raise exception using errcode = '22023', message = 'billing_too_many_reports';
  end if;
  select p.nutritionist_id into nid from public.patients p where p.id = target;
  insert into public.patient_payments (patient_id, nutritionist_id, amount, paid_on, method, note, status, reported_by_patient, created_by)
  values (target, nid, amount, paid_on, method, btrim(coalesce(note, '')), 'reported', true, auth.uid());
  perform public.billing_sync_charges(target);
  return public.get_patient_ledger(target);
end; $$;

-- La nutricionista confirma o rechaza un aviso de pago, o anula un pago cargado.
create or replace function public.review_patient_payment(payment_id uuid, decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pay public.patient_payments%rowtype;
begin
  select * into pay from public.patient_payments where id = payment_id;
  if not found then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  perform public.billing_assert_owner(pay.patient_id);
  if decision = 'confirm' and pay.status = 'reported' then
    update public.patient_payments set status = 'confirmed', reviewed_at = clock_timestamp() where id = payment_id;
    insert into public.timeline_events (patient_id, kind, visibility, title, body)
    values (pay.patient_id, 'billing', 'patient', 'Pago confirmado', 'Tu nutricionista confirmó tu pago del ' || to_char(pay.paid_on, 'DD/MM/YYYY'));
  elsif decision = 'reject' and pay.status = 'reported' then
    update public.patient_payments set status = 'rejected', reviewed_at = clock_timestamp() where id = payment_id;
  elsif decision = 'void' and pay.status = 'confirmed' then
    update public.patient_payments set status = 'voided', reviewed_at = clock_timestamp() where id = payment_id;
  else
    raise exception using errcode = '22023', message = 'billing_review';
  end if;
  return public.billing_ledger_json(pay.patient_id);
end; $$;

-- La nutricionista perdona una cuota (o la vuelve a cobrar).
create or replace function public.set_patient_charge_waived(charge_id uuid, waived boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
begin
  select c.patient_id into target from public.patient_charges c where c.id = charge_id;
  if target is null then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  perform public.billing_assert_owner(target);
  if waived is null then
    raise exception using errcode = '22023', message = 'billing_review';
  end if;
  update public.patient_charges set status = case when waived then 'waived' else 'open' end where id = charge_id;
  return public.billing_ledger_json(target);
end; $$;

revoke all on function
  public.billing_sync_charges(uuid),
  public.billing_assert_owner(uuid),
  public.billing_ledger_json(uuid),
  public.billing_assert_payment(int, date, text, text),
  public.get_billing_board(),
  public.get_patient_ledger(uuid),
  public.set_payment_settings(int, text, text, text),
  public.set_patient_fee(uuid, int, date),
  public.record_patient_payment(uuid, int, date, text, text),
  public.report_patient_payment(uuid, int, date, text, text),
  public.review_patient_payment(uuid, text),
  public.set_patient_charge_waived(uuid, boolean)
from public, anon, authenticated;

grant execute on function
  public.get_billing_board(),
  public.get_patient_ledger(uuid),
  public.set_payment_settings(int, text, text, text),
  public.set_patient_fee(uuid, int, date),
  public.record_patient_payment(uuid, int, date, text, text),
  public.report_patient_payment(uuid, int, date, text, text),
  public.review_patient_payment(uuid, text),
  public.set_patient_charge_waived(uuid, boolean)
to authenticated;
