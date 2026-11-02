import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/error';
import { subscriptionsApi } from '../../api/subscriptions';
import { friendlyError } from '../../lib/error-messages';
import { monthlyLabel, payerEmailError } from '../../lib/panel-subscriptions';
import type { SubscriptionPlan } from '../../types/subscriptions';

const storeKey = (slug: string, id: string) => `plan-v.suscripcion:${slug}:${id}`;

export function rememberSubscription(slug: string, id: string, token: string) {
  try { sessionStorage.setItem(storeKey(slug, id), token); } catch { /* El enlace de vuelta sigue en esta pantalla. */ }
}

export function rememberedSubscription(slug: string, id: string): string {
  try { return sessionStorage.getItem(storeKey(slug, id)) ?? ''; } catch { return ''; }
}

export function PublicFollowPlansView({ plans, busy, notice, onSubmit }: {
  plans: SubscriptionPlan[];
  busy: boolean;
  notice: string;
  onSubmit: (input: { planId: string; name: string; email: string; phone: string }) => void;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  if (!plans.length) return null;
  const chosen = plans.find(plan => plan.id === planId) ?? plans[0];
  return <section aria-label="Planes de seguimiento">
    <h2>Planes de seguimiento</h2>
    <p>Un débito mensual. La consulta suelta sigue más abajo.</p>
    {plans.map(plan => <article key={plan.id}>
      <h3>{plan.name}</h3>
      <p>{plan.description || 'Seguimiento mensual'}</p>
      <p>{monthlyLabel(plan.amount_cents)}</p>
      <button type="button" disabled={busy} aria-pressed={chosen.id === plan.id} onClick={() => setPlanId(plan.id)}>Suscribirme</button>
    </article>)}
    <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onSubmit({ planId: chosen.id, name: String(data.get('nombre') ?? ''), email: String(data.get('correo') ?? ''), phone: String(data.get('telefono') ?? '') });
    }}>
      <h3>Suscribirme a {chosen.name}</h3>
      <label>Nombre <input name="nombre" required minLength={2} maxLength={120} autoComplete="name" /></label>
      <label>Correo de tu cuenta de Mercado Pago <input name="correo" type="email" required maxLength={254} autoComplete="email" /></label>
      <p>Usá el mismo correo con el que vas a pagar.</p>
      <label>Teléfono <input name="telefono" type="tel" required minLength={5} maxLength={40} autoComplete="tel" /></label>
      <label><input type="checkbox" name="contacto" required />Autorizo a este consultorio a guardar mi contacto y escribirme sobre este plan.</label>
      <button className="nd-action" type="submit" disabled={busy}>Ir a Mercado Pago</button>
    </form>
    {notice && <p role="status">{notice}</p>}
  </section>;
}

export function PublicFollowPlans({ slug }: { slug: string }) {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const requestId = useRef(crypto.randomUUID());
  useEffect(() => {
    const controller = new AbortController();
    subscriptionsApi.publicPlans(slug, controller.signal).then(result => {
      if (!controller.signal.aborted) setPlans(result.plans.filter(plan => plan.public_visible !== false && plan.status !== 'archived'));
    }).catch(error => {
      if (!controller.signal.aborted && !(error instanceof ApiError && error.status === 404)) setNotice(friendlyError(error));
    });
    return () => controller.abort();
  }, [slug]);
  if (!plans?.length) return notice ? <p role="status">{notice}</p> : null;
  return <PublicFollowPlansView plans={plans} busy={busy} notice={notice} onSubmit={input => {
    const problem = payerEmailError(input.email);
    if (problem || input.name.trim().length < 2) { setNotice(problem || 'Escribí tu nombre.'); return; }
    setBusy(true);
    setNotice('');
    subscriptionsApi.publicCreate(slug, {
      plan_id: input.planId, payer_email: input.email.trim(), name: input.name.trim(), phone: input.phone.trim(), contact_ok: true, client_request_id: requestId.current,
    }).then(created => {
      if (created.guest_token) rememberSubscription(slug, created.id, created.guest_token);
      if (created.init_point?.startsWith('https://')) window.location.assign(created.init_point);
      else window.location.assign(`/consultorio/${slug}/suscripcion/${created.id}`);
    }).catch(error => { setNotice(friendlyError(error)); setBusy(false); requestId.current = crypto.randomUUID(); });
  }} />;
}

export function PublicSubscriptionReturn({ slug, id }: { slug: string; id: string }) {
  const [message, setMessage] = useState('Estamos esperando la confirmación de Mercado Pago.');
  const [again, setAgain] = useState(false);
  useEffect(() => {
    const token = rememberedSubscription(slug, id);
    if (!token) { setMessage('No pudimos abrir esta confirmación. Volvé a la página del consultorio.'); return; }
    const controller = new AbortController();
    const load = () => subscriptionsApi.publicStatus(slug, id, token, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setMessage(result.message);
      setAgain(result.status === 'cancelled' || result.status === 'expired' || result.status === 'failed');
    }).catch(error => { if (!controller.signal.aborted) setMessage(friendlyError(error)); });
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [slug, id]);
  return <section aria-label="Estado del débito">
    <h1>{message.startsWith('Tu débito') ? '¡Listo!' : 'Débito automático'}</h1>
    <p role="status">{message}</p>
    {again && <a href={`/consultorio/${slug}`}>Podés intentar de nuevo</a>}
    {!again && <a href={`/consultorio/${slug}`}>Volver al consultorio</a>}
  </section>;
}
