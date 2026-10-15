-- Bolsa global exclusiva de operaciones nuevas. USD 5 = 5.000.000 microdólares.
create table public.clinical_ai_budget_months (
  month text primary key check (month ~ '^\d{4}-\d{2}$'),
  limit_micros bigint not null default 5000000 check (limit_micros between 0 and 5000000),
  used_micros bigint not null default 0 check (used_micros >= 0 and used_micros <= limit_micros)
);
create table public.clinical_ai_spend (
  operation_key text primary key check (length(operation_key) between 1 and 240),
  month text not null references public.clinical_ai_budget_months(month),
  reserved_micros bigint not null check (reserved_micros >= 0),
  charged_micros bigint not null default 0 check (charged_micros >= 0 and charged_micros <= reserved_micros),
  status text not null default 'reserved' check (status in ('reserved','charged','uncertain','released')),
  response_cache jsonb, created_at timestamptz not null default now()
);
alter table public.clinical_ai_budget_months enable row level security;
alter table public.clinical_ai_spend enable row level security;
comment on column public.clinical_ai_spend.response_cache is 'PHI: temporary private provider checkpoint; expired after seven days and on consent withdrawal';
revoke all on public.clinical_ai_budget_months,public.clinical_ai_spend from public,anon,authenticated;
grant select,insert,update on public.clinical_ai_budget_months,public.clinical_ai_spend to service_role;

create function public.reserve_clinical_ai_budget(operation_key text,budget_month text,reserve_micros bigint)
returns void language plpgsql security invoker set search_path=public as $$
declare m public.clinical_ai_budget_months;
begin
  if reserve_micros < 0 or budget_month <> to_char(now() at time zone 'America/Argentina/Buenos_Aires','YYYY-MM') then raise exception 'Reserva inválida'; end if;
  insert into public.clinical_ai_budget_months(month) values(budget_month) on conflict do nothing;
  select * into m from public.clinical_ai_budget_months where month=budget_month for update;
  if m.used_micros+reserve_micros>m.limit_micros then raise exception 'Bolsa agotada'; end if;
  insert into public.clinical_ai_spend(operation_key,month,reserved_micros) values(operation_key,budget_month,reserve_micros)
    on conflict on constraint clinical_ai_spend_pkey do update
    set month=excluded.month,reserved_micros=excluded.reserved_micros,charged_micros=0,response_cache=null,status='reserved',created_at=now()
    where clinical_ai_spend.status='released';
  if not found then raise exception 'Operación ya reservada'; end if;
  update public.clinical_ai_budget_months set used_micros=used_micros+reserve_micros where month=budget_month;
end $$;
create function public.settle_clinical_ai_budget(operation_key text,outcome text,cost_micros bigint)
returns void language plpgsql security invoker set search_path=public as $$
declare r public.clinical_ai_spend;
begin
  -- Mismo orden de bloqueo que reserve: mes antes de operación.
  select * into r from public.clinical_ai_spend where clinical_ai_spend.operation_key=settle_clinical_ai_budget.operation_key;
  if not found then raise exception 'Liquidación inválida'; end if;
  perform 1 from public.clinical_ai_budget_months where month=r.month for update;
  select * into r from public.clinical_ai_spend where clinical_ai_spend.operation_key=settle_clinical_ai_budget.operation_key for update;
  if not found or outcome not in ('charged','uncertain','released') or cost_micros<0 or cost_micros>r.reserved_micros then raise exception 'Liquidación inválida'; end if;
  if r.status <> 'reserved' then
    if r.status=outcome and r.charged_micros=cost_micros then return; end if;
    raise exception 'Reserva ya liquidada';
  end if;
  update public.clinical_ai_spend set status=outcome,charged_micros=case when outcome='released' then 0 else cost_micros end where clinical_ai_spend.operation_key=r.operation_key;
  if outcome<>'uncertain' then update public.clinical_ai_budget_months set used_micros=used_micros-r.reserved_micros+case when outcome='released' then 0 else cost_micros end where month=r.month; end if;
end $$;
revoke all on function public.reserve_clinical_ai_budget(text,text,bigint), public.settle_clinical_ai_budget(text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_clinical_ai_budget(text,text,bigint), public.settle_clinical_ai_budget(text,text,bigint) to service_role;
