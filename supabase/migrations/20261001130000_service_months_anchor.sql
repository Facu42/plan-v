-- "Pagado hasta": los meses de pagos seguidos se suman desde el mismo comienzo, así pagar 1 mes y
-- después 2 da lo mismo que pagar 3 juntos (antes cada pago sumaba sobre una fecha ya recortada
-- a fin de mes: 31/10 + 1 mes = 30/11, + 2 meses = 30/01 y no 31/01).
-- Misma regla de siempre: un pago dentro de los 7 días de gracia sigue desde el vencimiento anterior;
-- si el corte fue más largo, cuenta desde el día que pagó. Sólo cambia cómo se suman los meses.
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
  run_start date;
  run_months int;
begin
  select * into sub from public.nutritionist_subscriptions s where s.nutritionist_id = target for update;
  if not found then
    return;
  end if;
  covered := null;
  run_start := null;
  run_months := 0;
  for p in
    select sp.paid_on, sp.months from public.service_payments sp
    where sp.nutritionist_id = target and sp.status = 'confirmed'
    order by sp.paid_on, sp.created_at
  loop
    start_on := coalesce(covered, sub.trial_ends_on);
    if start_on < p.paid_on - 7 then
      run_start := p.paid_on;
      run_months := p.months;
    elsif run_start is null then
      run_start := start_on;
      run_months := p.months;
    else
      run_months := run_months + p.months;
    end if;
    covered := (run_start + make_interval(months => run_months))::date;
  end loop;
  update public.nutritionist_subscriptions
  set paid_until = covered, updated_at = clock_timestamp()
  where nutritionist_id = target;
end; $$;
