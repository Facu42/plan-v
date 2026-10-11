-- Cobranzas: cambiar el día de vencimiento no debe generar una segunda cuota en el mismo mes.
-- Antes, al pasar del día 5 al 15, quedaban la cuota del 5 (ya generada) y una nueva del 15.
-- charges_from guarda hasta dónde ya se generaron cuotas; se lleva al último día de ese mes,
-- así la próxima cuota nueva cae en el mes siguiente. Sirve para cualquier versión de
-- set_patient_fee o billing_sync_charges porque actúa sobre la fila de patient_fees.
-- No borra ni cambia cuotas existentes.

create or replace function private.patient_fees_charges_from_month_end()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.charges_from is not null then
    new.charges_from := (date_trunc('month', new.charges_from) + interval '1 month - 1 day')::date;
  end if;
  return new;
end; $$;

revoke all on function private.patient_fees_charges_from_month_end() from public, anon, authenticated;

drop trigger if exists patient_fees_charges_from_month_end on public.patient_fees;
create trigger patient_fees_charges_from_month_end
  before insert or update of charges_from on public.patient_fees
  for each row execute function private.patient_fees_charges_from_month_end();
