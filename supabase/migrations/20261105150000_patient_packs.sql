-- Paquetes de consultas (2026-11-05): la nutricionista le vende a una paciente un paquete de N consultas
-- y Plan V lleva cuántas le quedan.
--
-- Solo agrega: dos tablas nuevas y funciones nuevas. No cambia ni borra nada existente.
-- - patient_packs: el paquete vendido (nombre, consultas, precio, desde cuándo y hasta cuándo vale).
--   Si se cobra, se crea un cobro suelto en Cobranzas (patient_charges, kind 'extra') y se guarda su id.
-- - patient_pack_uses: cada consulta descontada. Se descuenta sola al marcar una consulta como realizada
--   (pack_sync_appointment) o a mano desde la ficha. Deshacer no borra la fila: le pone voided_at.
-- Lectura directa por RLS solo para la nutricionista; escrituras únicamente por estas funciones.

create table if not exists public.patient_packs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  nutritionist_id uuid not null references public.nutritionists(id),
  name text not null check (char_length(name) between 1 and 60),
  sessions int not null check (sessions between 1 and 50),
  amount int not null check (amount between 0 and 100000000),
  charge_id uuid,
  starts_on date not null,
  expires_on date check (expires_on is null or expires_on >= starts_on),
  closed_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists patient_packs_patient_idx on public.patient_packs (patient_id, starts_on);
create index if not exists patient_packs_nutritionist_idx on public.patient_packs (nutritionist_id);

create table if not exists public.patient_pack_uses (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.patient_packs(id),
  patient_id uuid not null references public.patients(id),
  appointment_id uuid references public.appointments(id),
  used_on date not null,
  note text not null default '' check (char_length(note) <= 120),
  voided_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists patient_pack_uses_pack_idx on public.patient_pack_uses (pack_id);
create index if not exists patient_pack_uses_patient_idx on public.patient_pack_uses (patient_id);
create index if not exists patient_pack_uses_appointment_idx on public.patient_pack_uses (appointment_id);
create unique index if not exists patient_pack_uses_appointment_uidx
  on public.patient_pack_uses (appointment_id) where appointment_id is not null and voided_at is null;

alter table public.patient_packs enable row level security;
alter table public.patient_pack_uses enable row level security;
create policy patient_packs_select on public.patient_packs
  for select to authenticated using (nutritionist_id = (select public.my_nutritionist_id()));
create policy patient_pack_uses_select on public.patient_pack_uses
  for select to authenticated using (exists (
    select 1 from public.patient_packs p where p.id = pack_id and p.nutritionist_id = (select public.my_nutritionist_id())
  ));
revoke all on public.patient_packs, public.patient_pack_uses from public, anon, authenticated;
grant select on public.patient_packs, public.patient_pack_uses to authenticated;
grant all on public.patient_packs, public.patient_pack_uses to service_role;

-- Interna: los paquetes de una paciente con sus consultas usadas (las deshechas no cuentan).
create or replace function public.pack_list_json(target uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'sessions', p.sessions, 'amount', p.amount, 'charge_id', p.charge_id,
    'starts_on', p.starts_on, 'expires_on', p.expires_on, 'closed_at', p.closed_at, 'created_at', p.created_at,
    'uses', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'used_on', u.used_on, 'note', u.note, 'appointment_id', u.appointment_id, 'created_at', u.created_at)
        order by u.used_on, u.created_at)
      from public.patient_pack_uses u where u.pack_id = p.id and u.voided_at is null
    ), '[]'::jsonb)
  ) order by p.starts_on desc, p.created_at desc), '[]'::jsonb)
  from public.patient_packs p where p.patient_id = target;
$$;

-- Interna: el paquete vigente con lugar en una fecha (el más viejo primero). null si no hay.
create or replace function public.pack_open_for(target uuid, on_day date)
returns uuid language sql stable security definer set search_path = '' as $$
  select p.id from public.patient_packs p
  where p.patient_id = target and p.closed_at is null
    and (p.expires_on is null or p.expires_on >= on_day)
    and (select count(*) from public.patient_pack_uses u where u.pack_id = p.id and u.voided_at is null) < p.sessions
  order by p.starts_on, p.created_at
  limit 1;
$$;

create or replace function public.get_patient_packs(target uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.billing_assert_owner(target);
  return public.pack_list_json(target);
end; $$;

-- Vender un paquete. Con cobrar = true suma el cobro suelto «Paquete: <nombre>» en Cobranzas.
create or replace function public.sell_patient_pack(target uuid, pack_name text, sessions int, amount int, starts_on date, valid_days int, charge boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  label text := btrim(coalesce(pack_name, ''));
  cid uuid;
begin
  nid := public.billing_assert_owner(target);
  if char_length(label) < 1 or char_length(label) > 60 or sessions is null or sessions < 1 or sessions > 50
    or amount is null or amount < 0 or amount > 100000000 or starts_on is null
    or starts_on < current_date - 365 or starts_on > current_date + 365
    or (valid_days is not null and (valid_days < 1 or valid_days > 730))
    or (coalesce(charge, false) and amount < 1) then
    raise exception using errcode = '22023', message = 'pack_invalid';
  end if;
  if coalesce(charge, false) then
    insert into public.patient_charges (patient_id, nutritionist_id, due_on, amount, kind, concept)
    values (target, nid, starts_on, amount, 'extra', left('Paquete: ' || label, 80))
    returning id into cid;
    insert into public.timeline_events (patient_id, kind, visibility, title, body)
    values (target, 'billing', 'patient', 'Nuevo cobro', left('Paquete: ' || label, 80) || ' · vence el ' || to_char(starts_on, 'DD/MM/YYYY'));
  end if;
  insert into public.patient_packs (patient_id, nutritionist_id, name, sessions, amount, charge_id, starts_on, expires_on)
  values (target, nid, label, sessions, amount, cid, starts_on, case when valid_days is null then null else starts_on + valid_days end);
  return public.pack_list_json(target);
end; $$;

-- Descontar una consulta a mano. Sin pack_id usa el paquete vigente más viejo con lugar.
create or replace function public.use_patient_pack(target uuid, pack_id uuid, used_on date, note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := pack_id;
  p public.patient_packs%rowtype;
  label text := btrim(coalesce(note, ''));
begin
  perform public.billing_assert_owner(target);
  if used_on is null or used_on < current_date - 365 or used_on > current_date + 1 or char_length(label) > 120 then
    raise exception using errcode = '22023', message = 'pack_use_invalid';
  end if;
  if pid is null then pid := public.pack_open_for(target, used_on); end if;
  select * into p from public.patient_packs where id = pid and patient_id = target for update;
  if not found then raise exception using errcode = 'PT409', message = 'pack_empty'; end if;
  if p.closed_at is not null or (p.expires_on is not null and p.expires_on < used_on)
    or (select count(*) from public.patient_pack_uses u where u.pack_id = p.id and u.voided_at is null) >= p.sessions then
    raise exception using errcode = 'PT409', message = 'pack_empty';
  end if;
  insert into public.patient_pack_uses (pack_id, patient_id, used_on, note) values (p.id, target, used_on, label);
  return public.pack_list_json(target);
end; $$;

-- Deshacer una consulta descontada (queda marcada, no se borra).
create or replace function public.void_patient_pack_use(use_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  select u.patient_id into target from public.patient_pack_uses u where u.id = use_id and u.voided_at is null;
  if target is null then raise exception using errcode = 'P0002', message = 'pack_use_missing'; end if;
  perform public.billing_assert_owner(target);
  update public.patient_pack_uses set voided_at = clock_timestamp() where id = use_id;
  return public.pack_list_json(target);
end; $$;

-- Dar de baja un paquete: deja de descontar consultas. Lo usado y el cobro quedan como estaban.
create or replace function public.close_patient_pack(pack_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  select p.patient_id into target from public.patient_packs p where p.id = pack_id and p.closed_at is null;
  if target is null then raise exception using errcode = 'P0002', message = 'pack_missing'; end if;
  perform public.billing_assert_owner(target);
  update public.patient_packs set closed_at = clock_timestamp() where id = pack_id;
  return public.pack_list_json(target);
end; $$;

-- Consulta realizada: si se marca, descuenta una del paquete vigente (si hay); si se desmarca, la devuelve.
-- No falla cuando la paciente no tiene paquete.
create or replace function public.pack_sync_appointment(target uuid, appointment uuid, completed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
  day date;
  pid uuid;
begin
  nid := public.billing_assert_owner(target);
  select (a.starts_at at time zone 'America/Argentina/Buenos_Aires')::date into day
  from public.appointments a where a.id = appointment and a.patient_id = target and a.nutritionist_id = nid;
  if day is null then raise exception using errcode = '42501', message = 'appointment_forbidden'; end if;
  if coalesce(completed, false) then
    if exists (select 1 from public.patient_pack_uses u where u.appointment_id = appointment and u.voided_at is null) then
      return public.pack_list_json(target);
    end if;
    pid := public.pack_open_for(target, day);
    if pid is not null then
      perform 1 from public.patient_packs where id = pid for update;
      if (select count(*) from public.patient_pack_uses u where u.pack_id = pid and u.voided_at is null)
        < (select sessions from public.patient_packs where id = pid) then
        insert into public.patient_pack_uses (pack_id, patient_id, appointment_id, used_on, note)
        values (pid, target, appointment, day, 'Consulta realizada');
      end if;
    end if;
  else
    update public.patient_pack_uses set voided_at = clock_timestamp()
    where appointment_id = appointment and patient_id = target and voided_at is null;
  end if;
  return public.pack_list_json(target);
end; $$;

revoke all on function public.pack_list_json(uuid), public.pack_open_for(uuid, date) from public, anon, authenticated;
revoke all on function public.get_patient_packs(uuid), public.sell_patient_pack(uuid, text, int, int, date, int, boolean),
  public.use_patient_pack(uuid, uuid, date, text), public.void_patient_pack_use(uuid), public.close_patient_pack(uuid),
  public.pack_sync_appointment(uuid, uuid, boolean) from public, anon;
grant execute on function public.get_patient_packs(uuid), public.sell_patient_pack(uuid, text, int, int, date, int, boolean),
  public.use_patient_pack(uuid, uuid, date, text), public.void_patient_pack_use(uuid), public.close_patient_pack(uuid),
  public.pack_sync_appointment(uuid, uuid, boolean) to authenticated;
