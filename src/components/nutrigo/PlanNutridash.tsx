import { useEffect, useState } from 'react';
import { billingApi, mpCheckoutUrl, type BillingCycle, type PlanCode, type PlatformBillingView } from '../../api/billing';
import { friendlyError } from '../../lib/error-messages';
import { SettingsDialog } from './EquipoAjustesShared';
import { FxKv } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';

const pesos = (cents: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);
const fecha = (iso: string | null) => iso ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(iso)) : '—';
const estado: Record<string, string> = { pending: 'Pendiente de pago', authorized: 'Al día', paused: 'Pausado', past_due: 'Pago rechazado', canceled: 'Cancelado' };

function Barra({ etiqueta, usado, tope }: { etiqueta: string; usado: number; tope: number | null }) {
  const ancho = tope == null || tope <= 0 ? 100 : Math.min(100, Math.round((usado / tope) * 100));
  return <div><span className="t"><b>{etiqueta}</b><small>{tope == null ? `${usado} · sin tope` : `${usado} de ${tope}`}</small></span><span className="bar" role="meter" aria-label={etiqueta} aria-valuenow={usado} aria-valuemax={tope ?? usado}><i style={{ width: `${ancho}%` }} /></span></div>;
}

export function PlanNutridash() {
  const [data, setData] = useState<PlatformBillingView | null>(null);
  const [error, setError] = useState('');
  const [dialogo, setDialogo] = useState<'elegir' | 'pagos' | 'cancelar' | null>(null);
  const [ciclo, setCiclo] = useState<BillingCycle>('monthly');
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState('');
  const cargar = () => {
    const c = new AbortController();
    setError('');
    billingApi.plan(c.signal).then((view) => { if (!c.signal.aborted) setData(view); }).catch((e) => { if (!c.signal.aborted) setError(friendlyError(e)); });
    return () => c.abort();
  };
  useEffect(() => cargar(), []);
  const ir = (url: string | null | undefined) => {
    const destino = url ? mpCheckoutUrl(url) : null;
    if (!destino) { setAviso('El enlace de pago no es válido.'); return; }
    window.location.assign(destino);
  };
  const elegir = async (code: PlanCode) => {
    setAviso('');
    try {
      if (data?.subscription && data.subscription.status !== 'pending') {
        const next = await billingApi.change({ plan_code: code, billing_cycle: ciclo });
        setData(next);
        setDialogo(null);
        setAviso('Plan actualizado.');
        return;
      }
      const out = await billingApi.checkout({ plan_code: code, billing_cycle: ciclo, client_request_id: crypto.randomUUID() });
      ir(out.init_point);
    } catch (e) { setAviso(friendlyError(e)); }
  };
  const cancelar = async () => {
    setAviso('');
    try {
      setData(await billingApi.cancel(motivo));
      setDialogo(null);
      setAviso('La baja quedó hecha. Seguís con acceso hasta el fin del período ya pago.');
    } catch (e) { setAviso(friendlyError(e)); }
  };
  if (!data) {
    return <>
      <div className="ajplan"><b>—</b><small>{error || 'Todavía no hay datos de tu servicio'}</small></div>
      <FxKv filas={[['Pacientes activas', '—'], ['Equipo', '—'], ['Próximo pago', '—'], ['Medio', '—']]} />
      <div className="fxfoot"><button type="button" className="sbtn cbtn" disabled>Ver pagos</button><button type="button" className="sbtn cbtn" disabled><PanelV29Icon name="dl" size={13} />Descargar factura</button></div>
    </>;
  }
  if (!data.enabled) {
    return <>
      <div className="ajplan"><b>—</b><small>El cobro de planes todavía no está activado</small></div>
      <FxKv filas={[['Pacientes activas', '—'], ['Equipo', '—'], ['Próximo pago', '—'], ['Medio', '—']]} />
      <div className="fxfoot"><button type="button" className="sbtn cbtn" disabled>Ver pagos</button><button type="button" className="sbtn cbtn" disabled title="La factura todavía no está disponible."><PanelV29Icon name="dl" size={13} />Descargar factura</button></div>
    </>;
  }
  const sub = data.subscription;
  const plan = data.plans.find((item) => item.code === sub?.plan_code) ?? null;
  const uso = data.usage;
  const gracia = data.signup_grace;
  const diasGracia = gracia ? (gracia.days_left === 1 ? 'Te queda 1 día para regularizar el pago.' : gracia.days_left > 1 ? `Te quedan ${gracia.days_left} días para regularizar el pago.` : null) : null;
  return <>
    <div className="ajplan"><b>{sub?.founder ? 'Fundadora' : (sub?.plan_name ?? 'Sin plan')}</b><small>{sub?.founder && sub.founder_until ? `40% hasta el ${fecha(sub.founder_until)}` : sub ? `${sub.billing_cycle === 'annual' ? 'Anual' : 'Mensual'} · ${estado[sub.status] ?? sub.status}` : 'Elegí un plan para empezar'}</small></div>
    {sub?.attention ? <p className="nthint" role="status">{sub.attention}</p> : null}
    {diasGracia && !gracia?.read_only ? <p className="nthint" role="status">{diasGracia} Podés seguir cargando pacientes.</p> : null}
    {sub?.read_only || gracia?.read_only ? <p className="nthint">Estás en solo lectura. Tus pacientes siguen viendo sus datos y los mensajes.</p> : null}
    {uso && plan ? <div className="ajuso">
      <Barra etiqueta="Pacientes activas" usado={uso.active_patients} tope={plan.max_active_patients} />
      <Barra etiqueta="Equipo" usado={uso.nutritionists} tope={plan.max_nutritionists} />
      <Barra etiqueta="Fotos con IA" usado={uso.ai_photos} tope={plan.max_ai_meal_photos_month} />
    </div> : <FxKv filas={[['Pacientes activas', '—'], ['Equipo', '—'], ['Próximo pago', '—']]} />}
    <FxKv filas={[['Próximo pago', sub ? `${pesos(sub.current_amount_cents)} · ${fecha(sub.current_period_end)}` : '—'], ['Medio', 'Mercado Pago'], ['Cupo fundadora', data.founder_seats_left == null ? '—' : String(data.founder_seats_left)]]} />
    {aviso ? <p className="nthint" role="status">{aviso}</p> : null}
    <div className="fxfoot">
      <button type="button" className="sbtn cbtn" onClick={() => sub?.status === 'pending' && sub.init_point ? ir(sub.init_point) : setDialogo('elegir')}>{sub?.status === 'pending' && sub.init_point ? 'Continuar pago' : sub && sub.status !== 'pending' ? 'Cambiar plan' : gracia ? 'Pagar' : 'Elegir plan'}</button>
      <button type="button" className="sbtn cbtn" onClick={() => setDialogo('pagos')} disabled={!sub}>Ver pagos</button>
      {sub?.attention && sub.init_point ? <button type="button" className="sbtn cbtn" onClick={() => ir(sub.init_point)}>Actualizar medio de pago</button> : null}
      {sub && sub.status !== 'canceled' ? <button type="button" className="sbtn cbtn" onClick={() => setDialogo('cancelar')}>Cancelar</button> : null}
      <button type="button" className="sbtn cbtn" disabled title="La factura todavía no está disponible."><PanelV29Icon name="dl" size={13} />Descargar factura</button>
    </div>
    {dialogo === 'elegir' ? <SettingsDialog title="Elegí tu plan" onClose={() => setDialogo(null)}>
      <div className="pubhr"><div><b>Ciclo</b><span>{ciclo === 'annual' ? 'Anual, 20% menos. No se suma al 40% de fundadora.' : 'Mensual'}</span><button type="button" className="sbtn" onClick={() => setCiclo(ciclo === 'monthly' ? 'annual' : 'monthly')}>{ciclo === 'monthly' ? 'Ver anual' : 'Ver mensual'}</button></div></div>
      <div className="publk">{data.plans.map((item) => {
        const nueva = !sub || sub.status === 'pending';
        const conFundadora = nueva && (data.founder_seats_left ?? 0) > 0;
        const monto = ciclo === 'annual' ? (conFundadora ? item.founder_annual_amount_cents : item.annual_amount_cents) : (conFundadora ? item.founder_monthly_amount_cents : item.monthly_amount_cents);
        const lista = ciclo === 'annual' ? item.annual_amount_cents : item.monthly_amount_cents;
        return <div key={item.code}><span className="t"><b>{item.name}</b><small>{pesos(monto)}{monto !== lista ? ` · lista ${pesos(lista)}` : ''} · {item.max_active_patients == null ? 'pacientes sin tope' : `${item.max_active_patients} pacientes`} · {item.max_ai_meal_photos_month == null ? 'fotos sin tope' : `${item.max_ai_meal_photos_month} fotos`}</small></span><button type="button" className="sbtn" onClick={() => void elegir(item.code)}>Elegir</button></div>;
      })}</div>
      {aviso ? <p role="alert">{aviso}</p> : null}
    </SettingsDialog> : null}
    {dialogo === 'pagos' ? <SettingsDialog title="Tus pagos de Nutridash" onClose={() => setDialogo(null)}>
      {data.payments.length === 0 ? <span className="ntempty">Todavía no hay pagos.</span> : <FxKv filas={data.payments.map((item) => [fecha(item.paid_at), `${pesos(item.amount_cents)} · ${item.status === 'approved' ? 'Pagado' : item.status === 'rejected' ? 'Rechazado' : item.status === 'refunded' ? 'Devuelto' : item.status === 'charged_back' ? 'Contracargo' : 'Pendiente'}`])} />}
    </SettingsDialog> : null}
    {dialogo === 'cancelar' ? <SettingsDialog title="Cancelar el plan" onClose={() => setDialogo(null)}>
      <p className="pubbio">Seguís con acceso hasta el fin de lo que ya pagaste. No se devuelve la plata sola y el cupo de fundadora no vuelve al pozo.</p>
      <label className="af">Motivo<textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} rows={3} /></label>
      <button type="button" className="sbtn k" disabled={motivo.trim().length < 2} onClick={() => void cancelar()}>Confirmar baja</button>
    </SettingsDialog> : null}
  </>;
}
