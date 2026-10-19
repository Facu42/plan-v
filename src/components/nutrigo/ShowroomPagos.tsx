import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { ApiError } from '../../api/error';
import { feeCheckoutApi, type FeeOffer } from '../../api/fee-checkout';
import { friendlyError } from '../../lib/error-messages';
import { formatFeeDate, formatPesos, PAYMENT_METHOD_LABELS, summarizeLedger } from '../../fees';
import type { PatientLedgerView, PaymentInput } from '../../types/fees';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvState } from './primitives';
import { FeeStateBadge, PAYMENT_STATUS_LABELS, PaymentForm } from './cobranzas-shared';
import { feeErrorMessage, suggestedPaymentAmount } from './cobranzas-utils';
import './cobranzas-fig.css';

export function CopyAlias({ alias }: { alias: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(alias); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  };
  return <button type="button" className="nv-button nv-soft cbz-copy" onClick={() => void copy()} aria-label="Copiar alias">{copied ? 'Copiado' : 'Copiar'}</button>;
}

export function PagosScreen({ ledger, onLedger, today, monthlyPay }: {
  ledger: PatientLedgerView;
  onLedger: (ledger: PatientLedgerView) => void;
  today?: string;
  monthlyPay?: { title: string; amount: number; busy: boolean; notice: string; onPay: () => void } | null;
}) {
  const summary = useMemo(() => summarizeLedger(ledger, today), [ledger, today]);
  const info = ledger.payment_info;
  const history = [...ledger.payments].filter((payment) => payment.status !== 'voided').sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at));
  const hasInfo = Boolean(info && (info.alias || info.payment_link || info.instructions));
  const report = async (input: PaymentInput) => { onLedger((await api.addPatientPayment(ledger.patient_id, input, 'patient')).ledger); };

  if (!ledger.fee && !ledger.payments.length) {
    return <div className="cbz cbz-patient"><NvState title="Todavía no tenés una cuota" description={info?.nutritionist_name ? `Cuando ${info.nutritionist_name} defina tu cuota mensual, la vas a ver acá.` : 'Cuando tu nutricionista defina tu cuota mensual, la vas a ver acá.'} /></div>;
  }

  const headline = summary.state === 'debe' ? `Debés ${formatPesos(summary.owed)}${summary.debt_since ? ` desde el ${formatFeeDate(summary.debt_since)}` : ''}`
    : summary.next_due ? `Tu próxima cuota es de ${formatPesos(summary.next_due.amount)}, vence el ${formatFeeDate(summary.next_due.due_on)}`
    : summary.state === 'sin_cuota' ? 'Sin cuota por ahora' : 'Estás al día con tus pagos';

  return <div className="cbz cbz-patient">
    <section className={`cbz-status cbz-status-${summary.state}`} aria-label="Estado de tu cuota">
      <div><FeeStateBadge summary={summary} /><h2>{headline}</h2>
        {ledger.fee && <p>Cuota mensual de {formatPesos(ledger.fee.amount)}.{summary.credit > 0 ? ` Tenés ${formatPesos(summary.credit)} a favor.` : ''}</p>}
        {summary.pending_reports > 0 && <p><Icon name="clock" size={13} /> Tu aviso de pago está a confirmar por tu nutricionista.</p>}
        {monthlyPay && <p>{monthlyPay.title}. {formatPesos(monthlyPay.amount)}.</p>}
        {monthlyPay && <button type="button" className="nv-button" disabled={monthlyPay.busy} onClick={monthlyPay.onPay}>Pagar este mes</button>}
        {monthlyPay?.notice && <p role="status">{monthlyPay.notice}</p>}
      </div>
    </section>

    <div className="cbz-patient-grid">
      <NvCard title="Cómo pagar" action={<Icon name="wallet" size={16} />}>
        {hasInfo && info ? <div className="cbz-howto">
          {info.nutritionist_name && <p className="cbz-muted">Le pagás directo a {info.nutritionist_name}.</p>}
          {info.alias && <div className="cbz-alias"><div><small>Alias o CBU</small><strong>{info.alias}</strong></div><CopyAlias alias={info.alias} /></div>}
          {info.payment_link && /^https:\/\//i.test(info.payment_link) && <a className="nv-button" href={info.payment_link} target="_blank" rel="noopener noreferrer">Pagar con link</a>}
          {info.instructions && <p className="cbz-instructions">{info.instructions}</p>}
        </div> : <p className="cbz-muted">Tu nutricionista todavía no cargó los datos de pago. Consultale por Mensajes cómo abonar.</p>}
      </NvCard>

      <NvCard title="Ya pagué">
        <PaymentForm idPrefix="cbz-report" defaultAmount={suggestedPaymentAmount(summary, ledger.fee)} submitLabel="Avisar que pagué"
          hint="Tu nutricionista lo confirma y recién ahí se descuenta de tu cuota." onSubmit={report} />
      </NvCard>
    </div>

    <NvCard title="Tus pagos">
      {history.length ? <ul className="cbz-list">{history.map((payment) => <li key={payment.id} className={`cbz-row${payment.status === 'rejected' ? ' cbz-dim' : ''}`}>
        <div><strong>{formatPesos(payment.amount)}</strong><small>{formatFeeDate(payment.paid_on)} · {PAYMENT_METHOD_LABELS[payment.method]}{payment.note ? ` · ${payment.note}` : ''}</small></div>
        <NvBadge tone={payment.status === 'confirmed' ? 'green' : payment.status === 'reported' ? 'gold' : 'coral'}>{payment.status === 'reported' ? 'A confirmar por tu nutricionista' : PAYMENT_STATUS_LABELS[payment.status]}</NvBadge>
      </li>)}</ul> : <p className="cbz-muted">Todavía no registraste pagos.</p>}
    </NvCard>
  </div>;
}

export function ShowroomPagos({ patientId }: { patientId: string }) {
  const [ledger, setLedger] = useState<PatientLedgerView | null>(null);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<FeeOffer | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payNotice, setPayNotice] = useState('');
  const load = useCallback(() => {
    setError(''); setLedger(null);
    api.getPatientLedger(patientId, 'patient').then((result) => setLedger(result.ledger)).catch((reason) => setError(feeErrorMessage(reason, 'No pudimos cargar tus pagos.')));
  }, [patientId]);
  useEffect(load, [load]);
  useEffect(() => {
    feeCheckoutApi.offer().then(setOffer).catch(reason => {
      if (!(reason instanceof ApiError && reason.status === 404)) setPayNotice(friendlyError(reason));
    });
  }, [patientId]);
  const monthlyPay = offer?.available ? {
    title: offer.title,
    amount: offer.amount,
    busy: payBusy,
    notice: payNotice,
    onPay: () => {
      setPayBusy(true);
      setPayNotice('');
      feeCheckoutApi.pay({ client_request_id: crypto.randomUUID(), due_on: offer.due_on }).then(created => {
        if (created.init_point?.startsWith('https://')) window.location.assign(created.init_point);
        else setPayNotice('Estamos preparando el enlace. Reintentá en un momento.');
      }).catch(reason => setPayNotice(friendlyError(reason))).finally(() => setPayBusy(false));
    },
  } : null;

  if (error) return <NvState kind="error" title="No pudimos cargar tus pagos" description={error} action={<NvButton className="nv-soft" onClick={load}>Reintentar</NvButton>} />;
  if (!ledger) return <NvState kind="loading" title="Cargando tus pagos…" description="Un momento." />;
  return <PagosScreen ledger={ledger} onLedger={setLedger} monthlyPay={monthlyPay} />;
}
