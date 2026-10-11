-- Cobros por paciente (2026-10-10): «Nuevo cobro» y «Asignar programa».
--
-- Sigue sobre el modelo de Cobranzas (patient_fees / patient_charges / patient_payments);
-- Plan V sigue sin mover plata: la paciente le paga directo a su nutricionista.
--
-- - patient_charges.kind: 'fee' es la cuota mensual que se genera sola; 'extra' es un cobro
--   suelto con concepto (consulta, taller, etc.). Los sueltos no se pisan entre sí aunque
--   caigan el mismo día, y cambiar la cuota mensual no los borra.
-- - patient_fees.program_name: nombre del programa con el que se fijó la cuota ('' si fue a mano).
-- - nutritionist_programs: programas de la nutricionista (nombre y monto mensual). Borrarlos no
--   cambia la cuota de quienes ya los tienen.
-- Lectura directa por RLS; escrituras sólo por RPC (mismo patrón que Cobranzas).

alter table public.patient_charges
  add column if not exists kind text not null default 'fee' check (kind in ('fee', 'extra')),
  add column if not exists concept text not null default '' check (char_length(concept) <= 80);

alter table public.patient_charges drop constraint if exists patient_charges_patient_id_due_on_key;
create unique index if not exists patient_charges_fee_due_uidx
  on public.patient_charges (patient_id, due_on) where kind = 'fee';

alter table public.patient_fees
  add column if not exists program_name text not null default '' check (char_length(program_name) <= 60);

create table if not exists public.nutritionist_programs (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  amount int not null check (amount between 1 and 100000000),
  created_at timestamptz not null default clock_timestamp()
);
create unique index if not exists nutritionist_programs_name_uidx
  on public.nutritionist_programs (nutritionist_id, lower(name));

alter table public.nutritionist_programs enable row level security;
drop policy if exists nutritionist_programs_select on public.nutritionist_programs;
create policy nutritionist_programs_select on public.nutritionist_programs
  for select using (nutritionist_id = (select public.my_nutritionist_id()));
revoke all on public.nutritionist_programs from public, anon, authenticated;
grant select on public.nutritionist_programs to authenticated;

-- Interna: genera las cuotas mensuales vencidas y la próxima (sólo kind = 'fee').
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
      insert into public.patient_charges (patient_id, nutritionist_id, due_on, amount, kind)
      values (target, f.nutritionist_id, d, f.amount, 'fee')
      on conflict (patient_id, due_on) where kind = 'fee' do nothing;
    end if;
    exit when d > current_date or n >= 600;
    n := n + 1;
  end loop;
end; $$;

-- Interna: la cuenta de una paciente, ahora con el tipo y el concepto de cada cobro.
create or replace function public.billing_ledger_json(target uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'patient_id', target,
    'fee', (
      select jsonb_build_object('amount', f.amount, 'first_due_on', f.first_due_on, 'program_name', f.program_name)
      from public.patient_fees f where f.patient_id = target
    ),
    'charges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'due_on', c.due_on, 'amount', c.amount, 'status', c.status, 'kind', c.kind, 'concept', c.concept
      ) order by c.due_on, c.created_at)
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

-- Interna: los programas de una nutricionista.
create or replace function public.billing_programs_json(nid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'amount', g.amount) order by lower(g.name)), '[]'::jsonb)
  from public.nutritionist_programs g where g.nutritionist_id = nid;
$$;

-- Nutricionista: el tablero de siempre, más sus programas.
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
    'programs', public.billing_programs_json(nid),
    'patients', coalesce((
      select jsonb_agg(public.billing_ledger_json(p.id) || jsonb_build_object('full_name', p.full_name) order by p.full_name)
      from public.patients p
      where p.nutritionist_id = nid and p.deactivated_at is null and p.anonymized_at is null and p.archived_at is null
    ), '[]'::jsonb)
  );
end; $$;

-- Interna: fija, cambia o quita (amount null) la cuota mensual. Lo ya vencido no se reescribe
-- y los cobros sueltos no se tocan.
create or replace function public.billing_apply_fee(target uuid, nid uuid, amount int, first_due_on date, program_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  last_due date;
begin
  perform public.billing_sync_charges(target);
  delete from public.patient_charges c where c.patient_id = target and c.kind = 'fee' and c.due_on > current_date;
  select max(c.due_on) into last_due from public.patient_charges c where c.patient_id = target and c.kind = 'fee';
  if amount is null then
    delete from public.patient_fees f where f.patient_id = target;
  else
    insert into public.patient_fees (patient_id, nutritionist_id, amount, first_due_on, charges_from, program_name, updated_at)
    values (target, nid, amount, first_due_on, last_due, coalesce(program_name, ''), clock_timestamp())
    on conflict (patient_id) do update
      set amount = excluded.amount, first_due_on = excluded.first_due_on,
          charges_from = excluded.charges_from, program_name = excluded.program_name, updated_at = excluded.updated_at;
    perform public.billing_sync_charges(target);
  end if;
end; $$;

create or replace function public.set_patient_fee(target uuid, amount int, first_due_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  nid := public.billing_assert_owner(target);
  if amount is not null and (amount < 1 or amount > 100000000 or first_due_on is null
    or first_due_on < current_date - 730 or first_due_on > current_date + 365) then
    raise exception using errcode = '22023', message = 'billing_fee';
  end if;
  perform public.billing_apply_fee(target, nid, amount, first_due_on, '');
  return public.billing_ledger_json(target);
end; $$;

-- Nuevo cobro: un cobro suelto con concepto.
create or replace function public.add_patient_charge(target uuid, amount int, due_on date, concept text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  label text := btrim(coalesce(concept, ''));
begin
  nid := public.billing_assert_owner(target);
  if amount is null or amount < 1 or amount > 100000000 or due_on is null
    or due_on < current_date - 730 or due_on > current_date + 365
    or char_length(label) < 1 or char_length(label) > 80 then
    raise exception using errcode = '22023', message = 'billing_charge';
  end if;
  insert into public.patient_charges (patient_id, nutritionist_id, due_on, amount, kind, concept)
  values (target, nid, due_on, amount, 'extra', label);
  insert into public.timeline_events (patient_id, kind, visibility, title, body)
  values (target, 'billing', 'patient', 'Nuevo cobro', label || ' · vence el ' || to_char(due_on, 'DD/MM/YYYY'));
  return public.billing_ledger_json(target);
end; $$;

-- Crea un programa o, si ya hay uno con ese nombre, le actualiza el monto. Devuelve la lista.
create or replace function public.save_billing_program(program_name text, amount int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  label text := btrim(coalesce(program_name, ''));
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'billing_pro_only';
  end if;
  if char_length(label) < 1 or char_length(label) > 60 or amount is null or amount < 1 or amount > 100000000 then
    raise exception using errcode = '22023', message = 'billing_program';
  end if;
  insert into public.nutritionist_programs (nutritionist_id, name, amount)
  values (nid, label, amount)
  on conflict (nutritionist_id, lower(name)) do update set amount = excluded.amount;
  return public.billing_programs_json(nid);
end; $$;

create or replace function public.delete_billing_program(program_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  removed int;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'billing_pro_only';
  end if;
  delete from public.nutritionist_programs g where g.id = program_id and g.nutritionist_id = nid;
  get diagnostics removed = row_count;
  if removed = 0 then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  return public.billing_programs_json(nid);
end; $$;

-- Asignar programa: la cuota de la paciente toma el monto del programa. program_id null quita la cuota.
create or replace function public.assign_patient_program(target uuid, program_id uuid, first_due_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  prog public.nutritionist_programs%rowtype;
  start_on date := coalesce(first_due_on, current_date);
begin
  nid := public.billing_assert_owner(target);
  if program_id is null then
    perform public.billing_apply_fee(target, nid, null, null, '');
    return public.billing_ledger_json(target);
  end if;
  select * into prog from public.nutritionist_programs g where g.id = program_id and g.nutritionist_id = nid;
  if not found then
    raise exception using errcode = '42501', message = 'billing_forbidden';
  end if;
  if start_on < current_date - 730 or start_on > current_date + 365 then
    raise exception using errcode = '22023', message = 'billing_fee';
  end if;
  perform public.billing_apply_fee(target, nid, prog.amount, start_on, prog.name);
  return public.billing_ledger_json(target);
end; $$;

revoke all on function
  public.billing_programs_json(uuid),
  public.billing_apply_fee(uuid, uuid, int, date, text),
  public.add_patient_charge(uuid, int, date, text),
  public.save_billing_program(text, int),
  public.delete_billing_program(uuid),
  public.assign_patient_program(uuid, uuid, date)
from public, anon, authenticated;

grant execute on function
  public.add_patient_charge(uuid, int, date, text),
  public.save_billing_program(text, int),
  public.delete_billing_program(uuid),
  public.assign_patient_program(uuid, uuid, date)
to authenticated;
