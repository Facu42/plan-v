import { useState, type FormEvent } from 'react';
import { formatPesos, PAYMENT_METHOD_LABELS, type FeeState, type FeeSummary } from '../../fees';
import { localBillingDate } from '../../billing';
import type { PaymentInput, PaymentMethod, PaymentStatus } from '../../types/fees';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import { feeErrorMessage, parsePesos } from './cobranzas-utils';
import './cobranzas-fig.css';

/** dd/mm de una fecha AAAA-MM-DD. */
export function shortFeeDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

export function feeStateText(summary: FeeSummary): string {
  if (summary.state === 'debe') return summary.debt_since ? `Debe desde ${shortFeeDate(summary.debt_since)}` : 'Debe';
  if (summary.state === 'por_vencer') return summary.next_due ? `Vence el ${shortFeeDate(summary.next_due.due_on)}` : 'Por vencer';
  return summary.state === 'al_dia' ? 'Al día' : 'Sin cuota';
}

const STATE_TONE: Record<FeeState, 'green' | 'gold' | 'coral'> = { debe: 'coral', por_vencer: 'gold', al_dia: 'green', sin_cuota: 'green' };

export function FeeStateBadge({ summary }: { summary: FeeSummary }) {
  return <span className={`cbz-state cbz-state-${summary.state}`}><NvBadge tone={STATE_TONE[summary.state]}>{feeStateText(summary)}</NvBadge></span>;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  confirmed: 'Confirmado', reported: 'A confirmar', rejected: 'Rechazado', voided: 'Anulado',
};

export function FeeError({ message }: { message: string }) {
  return message ? <p className="cbz-error" role="alert">{message}</p> : null;
}

export function PaymentForm({ idPrefix, defaultAmount, submitLabel, hint, onSubmit }: {
  idPrefix: string;
  defaultAmount: number;
  submitLabel: string;
  hint?: string;
  onSubmit: (input: PaymentInput) => Promise<void>;
}) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [paidOn, setPaidOn] = useState(() => localBillingDate());
  const [method, setMethod] = useState<PaymentMethod>('transferencia');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(amount);
    if (!pesos) { setError('Escribí un monto en pesos, sin decimales.'); return; }
    if (!paidOn) { setError('Elegí la fecha del pago.'); return; }
    setBusy(true); setError('');
    try {
      await onSubmit({ amount: pesos, paid_on: paidOn, method, ...(note.trim() ? { note: note.trim() } : {}) });
      setNote('');
    } catch (reason) {
      setError(feeErrorMessage(reason));
    } finally { setBusy(false); }
  };

  return <form className="cbz-form" onSubmit={submit} noValidate>
    <div className="cbz-grid">
      <label htmlFor={`${idPrefix}-amount`}>Monto ($)<input id={`${idPrefix}-amount`} inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ej. 25000" disabled={busy} /></label>
      <label htmlFor={`${idPrefix}-date`}>Fecha<input id={`${idPrefix}-date`} type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} disabled={busy} /></label>
      <label htmlFor={`${idPrefix}-method`}>Medio<select id={`${idPrefix}-method`} value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} disabled={busy}>{(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => <option key={key} value={key}>{PAYMENT_METHOD_LABELS[key]}</option>)}</select></label>
    </div>
    <label htmlFor={`${idPrefix}-note`}>Nota (opcional)<input id={`${idPrefix}-note`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} disabled={busy} /></label>
    {hint && <p className="cbz-hint">{hint}</p>}
    <FeeError message={error} />
    <NvButton type="submit" disabled={busy}>{busy ? <Icon name="loader" size={14} /> : <Icon name="check" size={14} />}{busy ? 'Guardando…' : submitLabel}</NvButton>
  </form>;
}

export function ConfirmDialog({ title, description, confirmLabel, busy, error, onConfirm, onCancel }: {
  title: string; description: string; confirmLabel: string; busy: boolean; error: string; onConfirm: () => void; onCancel: () => void;
}) {
  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
    <section className="nv-dialog cbz-dialog" role="dialog" aria-modal="true" aria-labelledby="cbz-confirm-title">
      <h2 id="cbz-confirm-title">{title}</h2>
      <p>{description}</p>
      <FeeError message={error} />
      <div className="nv-dialog-actions">
        <NvButton className="nv-soft" onClick={onCancel} disabled={busy}>Cancelar</NvButton>
        <NvButton onClick={onConfirm} disabled={busy}>{busy ? 'Anulando…' : confirmLabel}</NvButton>
      </div>
    </section>
  </div>;
}

export { formatPesos };
