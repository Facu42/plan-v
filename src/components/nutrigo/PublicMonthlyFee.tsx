import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/error';
import { feeCheckoutApi } from '../../api/fee-checkout';
import { friendlyError } from '../../lib/error-messages';
import { payerEmailError } from '../../lib/panel-subscriptions';

export function PublicMonthlyFeeView({ busy, notice, onSubmit }: {
  busy: boolean;
  notice: string;
  onSubmit: (email: string) => void;
}) {
  return <section aria-label="Cuota del mes">
    <h2>Cuota del mes</h2>
    <p>Si ya tenés una cuota con este consultorio, podés pagarla ahora. Es un pago de un solo mes, no un débito automático.</p>
    <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onSubmit(String(data.get('correo') ?? ''));
    }}>
      <label>Correo <input name="correo" type="email" required maxLength={254} autoComplete="email" /></label>
      <button className="nd-action" type="submit" disabled={busy}>Pagar este mes</button>
    </form>
    {notice && <p role="status">{notice}</p>}
  </section>;
}

export function PublicMonthlyFee({ slug }: { slug: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const requestId = useRef(crypto.randomUUID());
  useEffect(() => {
    const controller = new AbortController();
    feeCheckoutApi.publicEnabled(slug, controller.signal).then(() => {
      if (!controller.signal.aborted) setEnabled(true);
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 404) setEnabled(false);
      else setNotice(friendlyError(error));
    });
    return () => controller.abort();
  }, [slug]);
  if (!enabled) return notice ? <p role="status">{notice}</p> : null;
  return <PublicMonthlyFeeView busy={busy} notice={notice} onSubmit={email => {
    const problem = payerEmailError(email);
    if (problem) { setNotice(problem); return; }
    setBusy(true);
    setNotice('');
    feeCheckoutApi.publicPay(slug, { email: email.trim(), client_request_id: requestId.current }).then(result => {
      if (!result.found) { setNotice(result.message); setBusy(false); return; }
      if (result.init_point?.startsWith('https://')) window.location.assign(result.init_point);
      else { setNotice('Estamos preparando el enlace. Reintentá en un momento.'); setBusy(false); }
    }).catch(error => { setNotice(friendlyError(error)); setBusy(false); requestId.current = crypto.randomUUID(); });
  }} />;
}
