import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { chargeTitle, formatFeeDate, formatPesos, PAYMENT_METHOD_LABELS, reminderWhatsAppHref, summarizeLedger } from '../../fees';
import { localBillingDate } from '../../billing';
import type { BillingBoard, BillingBoardPatient, BillingProgram, PatientLedger, PaymentDecision, PaymentInput, PaymentSettings } from '../../types/fees';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvState } from './primitives';
import { ConfirmDialog, FeeError, FeeStateBadge, PAYMENT_STATUS_LABELS, PaymentForm } from './cobranzas-shared';
import { BOARD_FILTERS, boardTotals, buildBoardRows, feeErrorMessage, filterBoardRows, parsePesos, replaceLedger, suggestedPaymentAmount, type BoardFilter } from './cobranzas-utils';
import { CopyLinkButton, NewChargeForm, ProgramAssigner } from './cobranzas-cobros';
import './cobranzas-fig.css';
import { useUnsavedChanges, canLeaveWorkspace } from './unsaved-changes';

function SettingsCard({ settings, onSaved }: { settings: PaymentSettings; onSaved: (settings: PaymentSettings) => void }) {
  const [fee, setFee] = useState(settings.default_fee ? String(settings.default_fee) : '');
  const [alias, setAlias] = useState(settings.alias);
  const [link, setLink] = useState(settings.payment_link);
  const [instructions, setInstructions] = useState(settings.instructions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useUnsavedChanges(fee !== (settings.default_fee ? String(settings.default_fee) : '') || alias.trim() !== settings.alias || link.trim() !== settings.payment_link || instructions.trim() !== settings.instructions, busy);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = fee.trim() ? parsePesos(fee) : null;
    if (fee.trim() && !amount) { setError('La cuota por defecto tiene que ser un monto en pesos, sin decimales.'); return; }
    if (link.trim() && !/^https:\/\//i.test(link.trim())) { setError('El link de pago tiene que empezar con https://'); return; }
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await api.savePaymentSettings({ default_fee: amount, alias: alias.trim(), payment_link: link.trim(), instructions: instructions.trim() });
      onSaved(result.settings); setSaved(true);
    } catch (reason) { setError(feeErrorMessage(reason, 'No pudimos guardar los datos de cobro.')); } finally { setBusy(false); }
  };

  return <NvCard title="Datos de cobro" className="cbz-settings" action={<Icon name="wallet" size={16} />}>
    <p className="cbz-hint">Tus pacientes ven estos datos en su pantalla de Pagos para saber cómo abonarte.</p>
    <form className="cbz-form" onSubmit={save} noValidate>
      <div className="cbz-grid cbz-grid-2">
        <label htmlFor="cbz-set-fee">Cuota por defecto ($)<input id="cbz-set-fee" inputMode="numeric" value={fee} onChange={(event) => setFee(event.target.value)} placeholder="Ej. 30000" disabled={busy} /></label>
        <label htmlFor="cbz-set-alias">Alias o CBU<input id="cbz-set-alias" value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={80} disabled={busy} /></label>
      </div>
      <label htmlFor="cbz-set-link">Link de pago (Mercado Pago u otro)<input id="cbz-set-link" type="url" inputMode="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" disabled={busy} /></label>
      <label htmlFor="cbz-set-instructions">Indicaciones para la paciente<textarea id="cbz-set-instructions" rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={500} disabled={busy} /></label>
      <FeeError message={error} />
      {saved && !error && <p className="cbz-ok" role="status">Datos de cobro guardados.</p>}
      <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar datos de cobro'}</NvButton>
    </form>
  </NvCard>;
}

function FeeEditor({ patient, defaultFee, onLedger }: { patient: BillingBoardPatient; defaultFee: number | null; onLedger: (ledger: PatientLedger) => void }) {
  const [amount, setAmount] = useState(String(patient.fee?.amount ?? defaultFee ?? ''));
  const [firstDue, setFirstDue] = useState(patient.fee?.first_due_on ?? localBillingDate());
  const [initialFee] = useState(() => String(patient.fee?.amount ?? defaultFee ?? ''));
  const [initialDue] = useState(() => patient.fee?.first_due_on ?? localBillingDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useUnsavedChanges(amount !== initialFee || firstDue !== initialDue, busy);
  const save = async (fee: { amount: number; first_due_on: string } | null) => {
    setBusy(true); setError('');
    try { onLedger((await api.setPatientFee(patient.patient_id, fee)).ledger); }
    catch (reason) { setError(feeErrorMessage(reason, 'No pudimos guardar la cuota.')); } finally { setBusy(false); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(amount);
    if (!pesos) { setError('Escribí el monto de la cuota en pesos, sin decimales.'); return; }
    if (!firstDue) { setError('Elegí el primer vencimiento.'); return; }
    void save({ amount: pesos, first_due_on: firstDue });
  };

  return <form className="cbz-form" onSubmit={submit} noValidate>
    <div className="cbz-grid cbz-grid-2">
      <label htmlFor="cbz-fee-amount">Cuota mensual ($)<input id="cbz-fee-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label>
      <label htmlFor="cbz-fee-due">Primer vencimiento<input id="cbz-fee-due" type="date" value={firstDue} onChange={(event) => setFirstDue(event.target.value)} disabled={busy} /></label>
    </div>
    <FeeError message={error} />
    <div className="cbz-actions">
      <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : patient.fee ? 'Cambiar cuota' : 'Guardar cuota'}</NvButton>
      {patient.fee && <NvButton className="nv-soft" disabled={busy} onClick={() => void save(null)}>Quitar cuota</NvButton>}
    </div>
  </form>;
}

export type PatientTool = 'cobro' | 'programa';

export function PatientPanel({ patient, settings, programs = [], onPrograms = () => undefined, onLedger, onBack, today, initialTool = null }: {
  patient: BillingBoardPatient; settings: PaymentSettings; programs?: BillingProgram[]; onPrograms?: (programs: BillingProgram[]) => void;
  onLedger: (ledger: PatientLedger) => void; onBack: () => void; today?: string; initialTool?: PatientTool | null;
}) {
  const [tool, setTool] = useState<PatientTool | null>(initialTool);
  const summary = useMemo(() => summarizeLedger(patient, today), [patient, today]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState<string | null>(null);
  useUnsavedChanges(false, Boolean(busyId));

  const act = async (id: string, run: () => Promise<{ ledger: PatientLedger }>): Promise<boolean> => {
    setBusyId(id); setError('');
    try { onLedger((await run()).ledger); return true; }
    catch (reason) { setError(feeErrorMessage(reason)); return false; } finally { setBusyId(''); }
  };
  const review = (paymentId: string, decision: PaymentDecision) => act(paymentId, () => api.reviewPatientPayment(paymentId, decision));
  const record = async (input: PaymentInput) => { onLedger((await api.addPatientPayment(patient.patient_id, input)).ledger); };

  const reported = patient.payments.filter((payment) => payment.status === 'reported');
  const history = [...patient.payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at));
  const busy = Boolean(busyId);
  const pendingCharge = summary.charges.find((charge) => charge.status === 'open' && charge.paid < charge.amount && charge.due)
    ?? summary.charges.find((charge) => charge.status === 'open' && charge.paid < charge.amount);
  const nextChargeTitle = pendingCharge ? chargeTitle(pendingCharge) : 'Cuota mensual';
  const nextChargeAmount = pendingCharge ? pendingCharge.amount - pendingCharge.paid : patient.fee?.amount ?? 0;
  const nextChargeDue = pendingCharge?.due_on ?? today ?? localBillingDate();

  return <aside className="cbz-panel" aria-label={`Cobranzas de ${patient.full_name}`}>
    <button type="button" className="cbz-back" onClick={() => { if (canLeaveWorkspace()) onBack(); }}><Icon name="chevron" size={14} />Volver a la lista</button>
    <header className="cbz-panel-head">
      <div><h2>{patient.full_name}</h2><p>{patient.fee ? `${patient.fee.program_name ? `${patient.fee.program_name} · ` : ''}Cuota de ${formatPesos(patient.fee.amount)} por mes` : 'Sin cuota definida'}</p></div>
      <FeeStateBadge summary={summary} />
    </header>
    <dl className="cbz-figures">
      <div><dt>Debe</dt><dd>{formatPesos(summary.owed)}</dd></div>
      <div><dt>A favor</dt><dd>{formatPesos(summary.credit)}</dd></div>
      <div><dt>Pagado este mes</dt><dd>{formatPesos(summary.paid_this_month)}</dd></div>
    </dl>
    <FeeError message={error} />
    <div className="cbz-actions cbz-tools" role="group" aria-label="Cobros de la paciente">
      <NvButton aria-expanded={tool === 'cobro'} onClick={() => setTool(tool === 'cobro' ? null : 'cobro')}>Nuevo cobro</NvButton>
      <NvButton className="nv-soft" aria-expanded={tool === 'programa'} onClick={() => setTool(tool === 'programa' ? null : 'programa')}>Asignar programa</NvButton>
      <CopyLinkButton input={{ patientName: patient.full_name, title: nextChargeTitle, amount: nextChargeAmount, dueOn: nextChargeDue, alias: settings.alias, paymentLink: settings.payment_link }} />
    </div>
    {!settings.alias && !settings.payment_link && <p className="cbz-muted">Cargá tu link o alias en «Datos de cobro» para poder copiar el link de pago.</p>}
    {tool === 'cobro' && <section className="cbz-block"><h3>Nuevo cobro</h3><NewChargeForm patientId={patient.patient_id} onLedger={onLedger} onDone={() => setTool(null)} /></section>}
    {tool === 'programa' && <section className="cbz-block"><h3>Asignar programa</h3>
      <ProgramAssigner patientId={patient.patient_id} currentName={patient.fee?.program_name ?? ''} programs={programs} onPrograms={onPrograms} onLedger={onLedger} onDone={() => setTool(null)} /></section>}
    {summary.owed > 0 && <a className="nv-button nv-soft cbz-whatsapp" href={reminderWhatsAppHref({ patientName: patient.full_name, owed: summary.owed, alias: settings.alias, paymentLink: settings.payment_link })} target="_blank" rel="noopener noreferrer">Recordar por WhatsApp</a>}

    {reported.length > 0 && <section className="cbz-block cbz-reports" aria-label="Avisos de pago por confirmar">
      <h3>Avisó que pagó</h3>
      {reported.map((payment) => <article key={payment.id} className="cbz-row">
        <div><strong>{formatPesos(payment.amount)}</strong><small>{formatFeeDate(payment.paid_on)} · {PAYMENT_METHOD_LABELS[payment.method]}{payment.note ? ` · ${payment.note}` : ''}</small></div>
        <div className="cbz-actions">
          <NvButton disabled={busy} onClick={() => void review(payment.id, 'confirm')}>{busyId === payment.id ? 'Guardando…' : 'Confirmar'}</NvButton>
          <NvButton className="nv-soft" disabled={busy} onClick={() => void review(payment.id, 'reject')}>Rechazar</NvButton>
        </div>
      </article>)}
    </section>}

    <section className="cbz-block"><h3>Cuota mensual</h3><FeeEditor key={`${patient.patient_id}-${patient.fee?.amount ?? 0}-${patient.fee?.first_due_on ?? ''}`} patient={patient} defaultFee={settings.default_fee} onLedger={onLedger} /></section>

    <section className="cbz-block"><h3>Registrar pago</h3>
      <PaymentForm key={`${patient.patient_id}-${summary.owed}-${patient.payments.length}`} idPrefix="cbz-pay" defaultAmount={suggestedPaymentAmount(summary, patient.fee)} submitLabel="Registrar pago" onSubmit={record} />
    </section>

    <section className="cbz-block"><h3>Cuotas</h3>
      {summary.charges.length ? <ul className="cbz-list">{[...summary.charges].reverse().map((charge) => {
        const waived = charge.status === 'waived';
        const done = !waived && charge.paid >= charge.amount;
        const label = waived ? 'Perdonada' : done ? 'Pagada' : charge.paid > 0 ? `Parcial · ${formatPesos(charge.paid)} de ${formatPesos(charge.amount)}` : charge.due ? 'Vencida' : 'Pendiente';
        return <li key={charge.id} className="cbz-row">
          <div><strong>{formatPesos(charge.amount)}</strong><small>{chargeTitle(charge)} · vence {formatFeeDate(charge.due_on)}</small></div>
          <div className="cbz-actions">{!waived && !done && <CopyLinkButton className="nv-ghost" label="Copiar link" input={{ patientName: patient.full_name, title: chargeTitle(charge), amount: charge.amount - charge.paid, dueOn: charge.due_on, alias: settings.alias, paymentLink: settings.payment_link }} />}<NvBadge tone={waived || done ? 'green' : charge.due ? 'coral' : 'gold'}>{label}</NvBadge>
            <NvButton className="nv-ghost" disabled={busy} onClick={() => void act(charge.id, () => api.setChargeWaived(charge.id, !waived))}>{busyId === charge.id ? '…' : waived ? 'Volver a cobrar' : 'Perdonar'}</NvButton></div>
        </li>;
      })}</ul> : <p className="cbz-muted">Todavía no hay cuotas generadas.</p>}
    </section>

    <section className="cbz-block"><h3>Historial de pagos</h3>
      {history.length ? <ul className="cbz-list">{history.map((payment) => <li key={payment.id} className={`cbz-row${payment.status === 'voided' || payment.status === 'rejected' ? ' cbz-dim' : ''}`}>
        <div><strong>{formatPesos(payment.amount)}</strong><small>{formatFeeDate(payment.paid_on)} · {PAYMENT_METHOD_LABELS[payment.method]}{payment.note ? ` · ${payment.note}` : ''}</small></div>
        <div className="cbz-actions"><NvBadge tone={payment.status === 'confirmed' ? 'green' : payment.status === 'reported' ? 'gold' : 'coral'}>{PAYMENT_STATUS_LABELS[payment.status]}</NvBadge>
          {payment.status === 'confirmed' && <NvButton className="nv-ghost" disabled={busy} onClick={() => setVoiding(payment.id)}>Anular</NvButton>}</div>
      </li>)}</ul> : <p className="cbz-muted">Todavía no hay pagos registrados.</p>}
    </section>

    {voiding && <ConfirmDialog title="¿Anular este pago?" description="El pago deja de contar para las cuotas. Queda en el historial como anulado." confirmLabel="Anular pago" busy={busyId === voiding} error={error}
      onCancel={() => setVoiding(null)} onConfirm={() => void review(voiding, 'void').then((ok) => { if (ok) setVoiding(null); })} />}
  </aside>;
}

export function CobranzasScreen({ board, onBoard, today, initialSelectedId = null, initialFilter = 'todas', initialTool = null }: {
  board: BillingBoard; onBoard: (board: BillingBoard) => void; today?: string; initialSelectedId?: string | null; initialFilter?: BoardFilter; initialTool?: PatientTool | null;
}) {
  const [filter, setFilter] = useState<BoardFilter>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const rows = useMemo(() => buildBoardRows(board, today), [board, today]);
  const visible = filterBoardRows(rows, filter);
  const totals = boardTotals(rows);
  const selected = selectedId ? board.patients.find((patient) => patient.patient_id === selectedId) ?? null : null;

  return <div className="cbz">
    <dl className="cbz-summary">
      <div className="cbz-stat"><dt>Cobrado este mes</dt><dd>{formatPesos(totals.collected)}</dd></div>
      <div className="cbz-stat"><dt>Total adeudado</dt><dd>{formatPesos(totals.owed)}</dd></div>
      <div className="cbz-stat"><dt>Pacientes que deben</dt><dd>{totals.debtors}</dd></div>
      <div className="cbz-stat"><dt>Avisos por confirmar</dt><dd>{totals.pending}</dd></div>
    </dl>
    <div className={`cbz-layout${selected ? ' cbz-has-selection' : ''}`}>
      <div className="cbz-list-col">
        <section className="cbz-directory" aria-label="Pacientes y cuotas">
          <header><h2>Pacientes</h2>
            <nav aria-label="Filtrar pacientes">{BOARD_FILTERS.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</nav>
          </header>
          {!rows.length ? <NvState title="Todavía no hay pacientes" description="Cuando sumes pacientes vas a poder definir su cuota y registrar sus pagos acá." />
            : !visible.length ? <p className="cbz-muted cbz-pad">No hay pacientes en este filtro.</p>
            : <ul className="cbz-patients">{visible.map(({ patient, summary }) => <li key={patient.patient_id}>
              <button type="button" className={patient.patient_id === selectedId ? 'cbz-selected' : ''} aria-pressed={patient.patient_id === selectedId} aria-label={`Ver cobranzas de ${patient.full_name}`} onClick={() => { if (canLeaveWorkspace()) setSelectedId(patient.patient_id); }}>
                <span className="cbz-who"><strong>{patient.full_name}</strong><small>{patient.fee ? `${formatPesos(patient.fee.amount)} por mes` : 'Sin cuota'}</small></span>
                <span className="cbz-side">{summary.owed > 0 && <b className="cbz-owed">{formatPesos(summary.owed)}</b>}
                  <FeeStateBadge summary={summary} />
                  {summary.pending_reports > 0 && <span className="cbz-pending"><Icon name="bell" size={12} />{summary.pending_reports === 1 ? 'Aviso de pago' : `${summary.pending_reports} avisos de pago`}</span>}</span>
              </button>
            </li>)}</ul>}
        </section>
        <SettingsCard settings={board.settings} onSaved={(settings) => onBoard({ ...board, settings })} />
      </div>
      {selected ? <PatientPanel key={selected.patient_id} patient={selected} settings={board.settings} programs={board.programs ?? []} onPrograms={(programs) => onBoard({ ...board, programs })} initialTool={initialTool} today={today} onBack={() => setSelectedId(null)} onLedger={(ledger) => onBoard(replaceLedger(board, ledger))} />
        : <aside className="cbz-panel cbz-panel-empty" aria-label="Detalle de cobranzas"><p>Elegí un paciente para ver su cuota, registrar pagos y revisar sus avisos.</p></aside>}
    </div>
  </div>;
}

export function ShowroomCobranzas({ initialSelectedId }: { initialSelectedId?: string } = {}) {
  const [board, setBoard] = useState<BillingBoard | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError(''); setBoard(null);
    api.getBillingBoard().then((result) => setBoard(result.board)).catch((reason) => setError(feeErrorMessage(reason, 'No pudimos cargar las cobranzas.')));
  }, []);
  useEffect(load, [load]);

  if (error) return <NvState kind="error" title="No pudimos cargar las cobranzas" description={error} action={<NvButton className="nv-soft" onClick={load}>Reintentar</NvButton>} />;
  if (!board) return <NvState kind="loading" title="Cargando cobranzas…" description="Estamos buscando las cuotas de tus pacientes." />;
  return <CobranzasScreen board={board} onBoard={setBoard} initialSelectedId={initialSelectedId} />;
}
