import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { formatFeeDate, formatPesos } from '../../fees';
import { localBillingDate } from '../../billing';
import { serviceTotals, SERVICE_METHOD_LABELS, SERVICE_STATE_LABELS, summarizeService } from '../../service';
import type { ServiceBoard, ServiceNutritionist, ServiceOverride, ServicePaymentInput, ServicePaymentMethod, ServiceSettings } from '../../types/service';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvState } from './primitives';
import { ConfirmDialog, FeeError } from './cobranzas-shared';
import { feeErrorMessage, parsePesos } from './cobranzas-utils';
import { buildServiceRows, daysLeftText, replaceNutritionist, SERVICE_STATE_TONE, serviceEventLabel, shortDateTime } from './servicio-utils';
import './cobranzas-fig.css';
import './servicio-fig.css';

function SettingsCard({ settings, onSaved }: { settings: ServiceSettings; onSaved: (settings: ServiceSettings) => void }) {
  const [price, setPrice] = useState(settings.monthly_price ? String(settings.monthly_price) : '');
  const [trial, setTrial] = useState(String(settings.trial_days));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const monthly = price.trim() ? parsePesos(price) : null;
    if (price.trim() && !monthly) { setError('El precio mensual tiene que ser un monto en pesos, sin decimales.'); return; }
    const days = Number(trial);
    if (!trial.trim() || !Number.isInteger(days) || days < 0 || days > 365) { setError('Los días de prueba van de 0 a 365.'); return; }
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await api.saveServiceSettings({ monthly_price: monthly, trial_days: days });
      onSaved(result.settings); setSaved(true);
    } catch (reason) { setError(feeErrorMessage(reason, 'No pudimos guardar el precio y la prueba.')); } finally { setBusy(false); }
  };

  return <NvCard title="Precio y prueba" className="cbz-settings" action={<Icon name="wallet" size={16} />}>
    <p className="cbz-hint">El precio se sugiere al registrar un pago. Los días de prueba valen para las nutricionistas nuevas.</p>
    <form className="cbz-form" onSubmit={save} noValidate>
      <div className="cbz-grid cbz-grid-2">
        <label htmlFor="svc-set-price">Precio mensual ($)<input id="svc-set-price" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Sin definir" disabled={busy} /></label>
        <label htmlFor="svc-set-trial">Días de prueba<input id="svc-set-trial" inputMode="numeric" value={trial} onChange={(event) => setTrial(event.target.value)} disabled={busy} /></label>
      </div>
      <FeeError message={error} />
      {saved && !error && <p className="cbz-ok" role="status">Precio y prueba guardados.</p>}
      <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</NvButton>
    </form>
  </NvCard>;
}

function PaymentForm({ defaultAmount, onSubmit }: { defaultAmount: number | null; onSubmit: (input: ServicePaymentInput) => Promise<void> }) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [months, setMonths] = useState('1');
  const [paidOn, setPaidOn] = useState(() => localBillingDate());
  const [method, setMethod] = useState<ServicePaymentMethod>('transferencia');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(amount);
    const count = Number(months);
    if (!pesos) { setError('Escribí un monto en pesos, sin decimales.'); return; }
    if (!Number.isInteger(count) || count < 1 || count > 24) { setError('Los meses van de 1 a 24.'); return; }
    if (!paidOn) { setError('Elegí la fecha del pago.'); return; }
    setBusy(true); setError('');
    try {
      await onSubmit({ amount: pesos, months: count, paid_on: paidOn, method, ...(note.trim() ? { note: note.trim() } : {}) });
      setNote('');
    } catch (reason) { setError(feeErrorMessage(reason)); } finally { setBusy(false); }
  };

  return <form className="cbz-form" onSubmit={submit} noValidate>
    <div className="cbz-grid cbz-grid-2">
      <label htmlFor="svc-pay-amount">Monto ($)<input id="svc-pay-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ej. 25000" disabled={busy} /></label>
      <label htmlFor="svc-pay-months">Meses que cubre<input id="svc-pay-months" inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value)} disabled={busy} /></label>
      <label htmlFor="svc-pay-date">Fecha<input id="svc-pay-date" type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} disabled={busy} /></label>
      <label htmlFor="svc-pay-method">Medio<select id="svc-pay-method" value={method} onChange={(event) => setMethod(event.target.value as ServicePaymentMethod)} disabled={busy}>{(Object.keys(SERVICE_METHOD_LABELS) as ServicePaymentMethod[]).map((key) => <option key={key} value={key}>{SERVICE_METHOD_LABELS[key]}</option>)}</select></label>
    </div>
    <label htmlFor="svc-pay-note">Nota (opcional)<input id="svc-pay-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} disabled={busy} /></label>
    <FeeError message={error} />
    <NvButton type="submit" disabled={busy}>{busy ? <Icon name="loader" size={14} /> : <Icon name="check" size={14} />}{busy ? 'Guardando…' : 'Registrar pago'}</NvButton>
  </form>;
}

export function ServiceStateBadge({ state }: { state: keyof typeof SERVICE_STATE_LABELS }) {
  return <span className={`cbz-state svc-state-${state}`}><NvBadge tone={SERVICE_STATE_TONE[state]}>{SERVICE_STATE_LABELS[state]}</NvBadge></span>;
}

export function NutritionistPanel({ nutritionist, monthlyPrice, onChange, onBack, today }: {
  nutritionist: ServiceNutritionist; monthlyPrice: number | null; onChange: (nutritionist: ServiceNutritionist) => void; onBack: () => void; today: string;
}) {
  const summary = useMemo(() => summarizeService(nutritionist.subscription, today), [nutritionist, today]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState('15');
  const [overrideNote, setOverrideNote] = useState('');

  const act = async (id: string, run: () => Promise<{ nutritionist: ServiceNutritionist }>): Promise<boolean> => {
    setBusyId(id); setError('');
    try { onChange((await run()).nutritionist); return true; }
    catch (reason) { setError(feeErrorMessage(reason)); return false; } finally { setBusyId(''); }
  };
  const record = async (input: ServicePaymentInput) => { onChange((await api.addServicePayment(nutritionist.id, input)).nutritionist); };
  const extend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const days = Number(trialDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) { setError('Los días van de 1 a 365.'); return; }
    void act('trial', () => api.extendServiceTrial(nutritionist.id, days));
  };
  const setOverride = (override: ServiceOverride) => act(`override-${override}`, () => api.setServiceOverride(nutritionist.id, override, overrideNote.trim())).then((ok) => { if (ok) setOverrideNote(''); });

  const history = [...nutritionist.payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at));
  const current = nutritionist.subscription.override;
  const busy = Boolean(busyId);

  return <aside className="cbz-panel" aria-label={`Servicio de ${nutritionist.display_name}`}>
    <button type="button" className="cbz-back" onClick={onBack}><Icon name="chevron" size={14} />Volver a la lista</button>
    <header className="cbz-panel-head">
      <div><h2>{nutritionist.display_name}</h2><p>{nutritionist.email}</p></div>
      <ServiceStateBadge state={summary.state} />
    </header>
    <dl className="cbz-figures">
      <div><dt>{summary.until ? 'Hasta' : 'Vigencia'}</dt><dd>{summary.until ? formatFeeDate(summary.until) : 'Sin fecha'}</dd></div>
      <div><dt>Pacientes activos</dt><dd>{nutritionist.patients_active}</dd></div>
      <div><dt>Último ingreso</dt><dd>{nutritionist.last_sign_in_at ? shortDateTime(nutritionist.last_sign_in_at) : 'Nunca'}</dd></div>
    </dl>
    {nutritionist.subscription.note && <p className="cbz-muted">Nota: {nutritionist.subscription.note}</p>}
    <FeeError message={error} />

    <section className="cbz-block"><h3>Registrar pago</h3>
      <PaymentForm key={`${nutritionist.id}-${nutritionist.payments.length}-${monthlyPrice ?? 0}`} defaultAmount={monthlyPrice} onSubmit={record} />
    </section>

    <section className="cbz-block"><h3>Extender prueba</h3>
      <form className="cbz-form" onSubmit={extend} noValidate>
        <p className="cbz-hint">La prueba termina el {formatFeeDate(nutritionist.subscription.trial_ends_on)}.</p>
        <label htmlFor="svc-trial-days">Días a sumar<input id="svc-trial-days" inputMode="numeric" value={trialDays} onChange={(event) => setTrialDays(event.target.value)} disabled={busy} /></label>
        <NvButton type="submit" className="nv-soft" disabled={busy}>{busyId === 'trial' ? 'Guardando…' : 'Extender prueba'}</NvButton>
      </form>
    </section>

    <section className="cbz-block"><h3>Excepción</h3>
      <p className="cbz-hint">{current === 'waived' ? 'Tiene el servicio sin cargo.' : current === 'suspended' ? 'Está suspendida.' : 'Sin excepciones: se rige por la prueba y los pagos.'}</p>
      <div className="cbz-form"><label htmlFor="svc-override-note">Nota (opcional)<input id="svc-override-note" value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} maxLength={280} disabled={busy} /></label></div>
      <div className="cbz-actions">
        {current !== 'waived' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('waived')}>Sin cargo</NvButton>}
        {current !== 'suspended' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('suspended')}>Suspender</NvButton>}
        {current !== 'none' && <NvButton className="nv-soft" disabled={busy} onClick={() => void setOverride('none')}>Quitar excepción</NvButton>}
      </div>
    </section>

    <section className="cbz-block"><h3>Historial de pagos</h3>
      {history.length ? <ul className="cbz-list">{history.map((payment) => <li key={payment.id} className={`cbz-row${payment.status === 'voided' ? ' cbz-dim' : ''}`}>
        <div><strong>{formatPesos(payment.amount)} · {payment.months === 1 ? '1 mes' : `${payment.months} meses`}</strong><small>{formatFeeDate(payment.paid_on)} · {SERVICE_METHOD_LABELS[payment.method]}{payment.note ? ` · ${payment.note}` : ''}</small></div>
        <div className="cbz-actions"><NvBadge tone={payment.status === 'confirmed' ? 'green' : 'coral'}>{payment.status === 'confirmed' ? 'Confirmado' : 'Anulado'}</NvBadge>
          {payment.status === 'confirmed' && <NvButton className="nv-ghost" disabled={busy} onClick={() => setVoiding(payment.id)}>Anular</NvButton>}</div>
      </li>)}</ul> : <p className="cbz-muted">Todavía no hay pagos registrados.</p>}
    </section>

    {voiding && <ConfirmDialog title="¿Anular este pago?" description="El pago deja de contar para la vigencia. Queda en el historial como anulado." confirmLabel="Anular pago" busy={busyId === voiding} error={error}
      onCancel={() => setVoiding(null)} onConfirm={() => void act(voiding, () => api.voidServicePayment(voiding)).then((ok) => { if (ok) setVoiding(null); })} />}
  </aside>;
}

export function ServicioScreen({ board, onBoard, today = localBillingDate(), initialSelectedId = null }: {
  board: ServiceBoard; onBoard: (board: ServiceBoard) => void; today?: string; initialSelectedId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const rows = useMemo(() => buildServiceRows(board, today), [board, today]);
  const totals = serviceTotals(board.nutritionists, today);
  const selected = selectedId ? board.nutritionists.find((item) => item.id === selectedId) ?? null : null;
  const names = useMemo(() => new Map(board.nutritionists.map((item) => [item.id, item.display_name])), [board.nutritionists]);

  return <div className="cbz svc">
    <header className="svc-head"><h2>Panel del servicio</h2><p>Acá no hay datos de salud de las pacientes: solo cantidades.</p></header>
    <dl className="cbz-summary">
      <div className="cbz-stat"><dt>Activas</dt><dd>{totals.activas}</dd></div>
      <div className="cbz-stat"><dt>En prueba</dt><dd>{totals.prueba}</dd></div>
      <div className="cbz-stat"><dt>Vencidas</dt><dd>{totals.vencidas}</dd></div>
      <div className="cbz-stat"><dt>Cobrado este mes</dt><dd>{formatPesos(totals.cobrado_mes)}</dd></div>
    </dl>
    <div className={`cbz-layout${selected ? ' cbz-has-selection' : ''}`}>
      <div className="cbz-list-col">
        <section className="cbz-directory" aria-label="Nutricionistas">
          <header><h2>Nutricionistas</h2></header>
          {!rows.length ? <NvState title="Todavía no hay nutricionistas" description="Cuando se sumen las vas a ver acá con su prueba y sus pagos." />
            : <ul className="cbz-patients">{rows.map(({ nutritionist, summary }) => <li key={nutritionist.id}>
              <button type="button" className={nutritionist.id === selectedId ? 'cbz-selected' : ''} aria-pressed={nutritionist.id === selectedId} aria-label={`Ver servicio de ${nutritionist.display_name}`} onClick={() => setSelectedId(nutritionist.id)}>
                <span className="cbz-who"><strong>{nutritionist.display_name}</strong><small>{nutritionist.email}</small>
                  <small>{nutritionist.patients_active === 1 ? '1 paciente activa' : `${nutritionist.patients_active} pacientes activas`} · Último ingreso: {nutritionist.last_sign_in_at ? shortDateTime(nutritionist.last_sign_in_at) : 'nunca'}</small></span>
                <span className="cbz-side">
                  <ServiceStateBadge state={summary.state} />
                  {summary.until && <small className="svc-until">Hasta {formatFeeDate(summary.until)}</small>}
                  {summary.days_left !== null && <small className="svc-until">{daysLeftText(summary)}</small>}
                </span>
              </button>
            </li>)}</ul>}
        </section>
        <SettingsCard settings={board.settings} onSaved={(settings) => onBoard({ ...board, settings })} />
        <NvCard title="Actividad reciente">
          {board.events.length ? <ul className="cbz-list svc-events">{board.events.slice(0, 15).map((event) => <li key={event.id} className="cbz-row">
            <div><strong>{serviceEventLabel(event.action)}</strong><small>{event.nutritionist_id ? names.get(event.nutritionist_id) ?? 'Nutricionista' : 'General'} · {shortDateTime(event.occurred_at)}</small></div>
          </li>)}</ul> : <p className="cbz-muted">Todavía no hay movimientos.</p>}
        </NvCard>
      </div>
      {selected ? <NutritionistPanel nutritionist={selected} monthlyPrice={board.settings.monthly_price} today={today} onBack={() => setSelectedId(null)} onChange={(next) => onBoard(replaceNutritionist(board, next))} />
        : <aside className="cbz-panel cbz-panel-empty" aria-label="Detalle del servicio"><p>Elegí una nutricionista para registrar pagos, extender su prueba o cambiar su estado.</p></aside>}
    </div>
  </div>;
}

export function ShowroomServicio() {
  const [board, setBoard] = useState<ServiceBoard | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError(''); setBoard(null);
    api.getServiceBoard().then((result) => setBoard(result.board)).catch((reason) => setError(feeErrorMessage(reason, 'No pudimos cargar el panel del servicio.')));
  }, []);
  useEffect(load, [load]);

  if (error) return <NvState kind="error" title="No pudimos cargar el panel del servicio" description={error} action={<NvButton className="nv-soft" onClick={load}>Reintentar</NvButton>} />;
  if (!board) return <NvState kind="loading" title="Cargando el panel…" description="Estamos buscando las nutricionistas y sus pagos." />;
  return <ServicioScreen board={board} onBoard={setBoard} />;
}
