import { useEffect, useState } from 'react';
import { api, ApiError } from '../../../api/client';
import type { PlanesBoard, PlanPrecio } from '../../../types/centro';
import type { HubNutri } from '../../../types/hub';
import { money, num } from './centro-format';
import { PlanesCuentas, SIN_PLAN, planDe, venceProntoCount } from './PlanesCuentas';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const cuando = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

function aviso(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No se pudo guardar.';
  try {
    const body = JSON.parse(error.message) as { error?: string };
    if (body.error) return body.error;
  } catch { /* el texto ya es el mensaje */ }
  return error.message;
}

function campos(plan: PlanPrecio) {
  return {
    monthly_pesos: plan.monthly_pesos,
    annual_pesos: plan.annual_pesos,
    founder_monthly_pesos: plan.founder_monthly_pesos,
    founder_annual_pesos: plan.founder_annual_pesos,
    active: plan.active,
  };
}

function resumen(nutris: HubNutri[] | null) {
  if (!nutris) return [];
  const conPlan = nutris.filter((n) => planDe(n) !== SIN_PLAN).length;
  const prueba = nutris.filter((n) => n.state === 'prueba').length;
  const sinPlan = nutris.filter((n) => planDe(n) === SIN_PLAN).length;
  return [
    { label: 'Con plan de pago', value: num(conPlan), note: `de ${num(nutris.length)} cuentas` },
    { label: 'En prueba', value: num(prueba), note: 'Todavía sin cobro' },
    { label: 'Vencen en 7 días', value: num(venceProntoCount(nutris)), note: 'Conviene avisarles' },
    { label: 'Sin plan de pago', value: num(sinPlan), note: 'Prueba, bajas o servicio sin plan' },
  ];
}

export function PlanesPrecios({ data, onSaved }: { data: PlanesBoard; onSaved: (next: PlanesBoard) => void }) {
  const [drafts, setDrafts] = useState<Record<string, ReturnType<typeof campos>>>({});
  const [mails, setMails] = useState(data.testers.join('\n'));
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState('');
  const [nutris, setNutris] = useState<HubNutri[] | null>(null);
  const [nutrisError, setNutrisError] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    let vivo = true;
    api.getHubNutris()
      .then((row) => { if (vivo) setNutris(row.nutris.filter((n) => !n.is_test)); })
      .catch(() => { if (vivo) setNutrisError(true); });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    setDrafts(Object.fromEntries(data.plans.map((plan) => [plan.code, campos(plan)])));
    setMails(data.testers.join('\n'));
  }, [data]);

  const guardar = async (plan: PlanPrecio) => {
    const draft = drafts[plan.code];
    if (!draft) return;
    setBusy(plan.code);
    setError('');
    setOk('');
    try {
      const next = await api.savePlan(plan.code, draft);
      onSaved(next);
      setOk(`Listo. ${plan.name} quedó guardado. Los cobros ya hechos no cambian.`);
    } catch (cause) {
      setError(aviso(cause));
    } finally {
      setBusy('');
    }
  };

  const guardarMails = async () => {
    setBusy('mails');
    setError('');
    setOk('');
    try {
      const emails = mails.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
      const next = await api.savePlanTesters(emails);
      onSaved(next);
      setOk('Lista de prueba guardada.');
    } catch (cause) {
      setError(aviso(cause));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="nd-planes">
      <section className="nd-page-head">
        <div className="nd-grow">
          <div className="nd-eyebrow">Plataforma</div>
          <h1 className="nd-h1">Planes y precios</h1>
          <p className="nd-sub nd-mt-6">Los montos son pesos enteros. El precio nuevo vale para el próximo alta. Un cobro ya hecho sigue con el monto con el que se creó.</p>
        </div>
      </section>
      {error ? <p className="nd-planes-msg is-error" role="alert">{error}</p> : null}
      {ok ? <p className="nd-planes-msg" role="status">{ok}</p> : null}
      <section className="nd-grid nd-kpis nd-planes-kpis" aria-label="Resumen de planes">
        {resumen(nutris).map((item) => (
          <article key={item.label} className="nd-card kpi">
            <span className="kpi-label">{item.label}</span>
            <div className="kpi-value">{item.value}</div>
            <div className="kpi-foot"><span>{item.note}</span></div>
          </article>
        ))}
      </section>
      <div className="nd-planes-grid">
        {data.plans.map((plan) => {
          const draft = drafts[plan.code] ?? campos(plan);
          const set = (key: keyof typeof draft, value: number | boolean) => setDrafts((current) => ({ ...current, [plan.code]: { ...draft, [key]: value } }));
          const cuentas = nutris ? nutris.filter((n) => planDe(n) === plan.code).length : null;
          return (
            <article key={plan.code} className="nd-card nd-planes-card">
              <div className="nd-card-head">
                <div className="nd-grow">
                  <div className="nd-card-title">{plan.name}</div>
                  <div className="nd-card-sub">{plan.listed ? 'Visible en el catálogo' : 'Oculto. No usa el cupo de fundadora.'}</div>
                </div>
                <span className={`nd-badge${draft.active ? ' is-green' : ''}`}>{draft.active ? 'Activo' : 'Pausado'}</span>
              </div>
              <div className="nd-planes-precio">
                <div className="nd-planes-cuentas-n">{cuentas == null ? '—' : num(cuentas)}<small>{cuentas === 1 ? 'nutri' : 'nutris'}</small></div>
                <dl className="nd-planes-lista">
                  <div><dt>Mensual</dt><dd>{money(draft.monthly_pesos)}</dd></div>
                  <div><dt>Anual</dt><dd>{money(draft.annual_pesos)}</dd></div>
                  <div><dt>Fundadora mensual</dt><dd>{money(draft.founder_monthly_pesos)}</dd></div>
                </dl>
              </div>
              <button type="button" className="nd-btn is-sm" onClick={() => setFiltro(plan.code)} disabled={!cuentas}>Ver las nutris de este plan</button>
              <details className="nd-planes-editar">
                <summary>Editar montos</summary>
                <div className="nd-planes-fields">
                  <label>Mensual<input inputMode="numeric" type="number" min={1} step={1} value={draft.monthly_pesos} onChange={(event) => set('monthly_pesos', Number(event.target.value))} /></label>
                  <label>Anual<input inputMode="numeric" type="number" min={1} step={1} value={draft.annual_pesos} onChange={(event) => set('annual_pesos', Number(event.target.value))} /></label>
                  <label>Fundadora mensual<input inputMode="numeric" type="number" min={1} step={1} value={draft.founder_monthly_pesos} onChange={(event) => set('founder_monthly_pesos', Number(event.target.value))} /></label>
                  <label>Fundadora anual<input inputMode="numeric" type="number" min={1} step={1} value={draft.founder_annual_pesos} onChange={(event) => set('founder_annual_pesos', Number(event.target.value))} /></label>
                </div>
                <label className="nd-planes-check"><input type="checkbox" checked={draft.active} onChange={(event) => set('active', event.target.checked)} /> Activo para altas nuevas</label>
                <button type="button" className="nd-btn is-action" disabled={!data.editable || busy === plan.code} onClick={() => void guardar(plan)}>{busy === plan.code ? 'Guardando…' : 'Guardar montos'}</button>
              </details>
            </article>
          );
        })}
      </div>
      {nutrisError ? <p className="nd-planes-msg is-error" role="alert">No se pudo leer la lista de nutris. Los planes y los montos siguen andando.</p> : null}
      {nutris ? <PlanesCuentas plans={data.plans} nutris={nutris} filtro={filtro} onFiltro={setFiltro} /> : null}
      <section className="nd-card nd-planes-side">
        <div className="nd-card-head">
          <div className="nd-grow">
            <div className="nd-card-title">Quién ve el plan de prueba</div>
            <div className="nd-card-sub">Un mail por línea. El resto no lo ve y no puede contratarlo.</div>
          </div>
        </div>
        <textarea aria-label="Mails del plan de prueba" value={mails} onChange={(event) => setMails(event.target.value)} rows={5} placeholder="facu@ejemplo.com" />
        <button type="button" className="nd-btn is-action" disabled={!data.editable || busy === 'mails'} onClick={() => void guardarMails()}>{busy === 'mails' ? 'Guardando…' : 'Guardar lista'}</button>
      </section>
      <section className="nd-card nd-planes-history">
        <div className="nd-card-head">
          <div className="nd-grow">
            <div className="nd-card-title">Historial</div>
            <div className="nd-card-sub">Quién cambió un precio y cuándo.</div>
          </div>
        </div>
        {data.changes.length === 0 ? <p className="nd-sub">Todavía no hay cambios.</p> : (
          <ul className="nd-planes-log">
            {data.changes.map((change) => (
              <li key={change.id}>
                <b>{change.plan_code}</b>
                <span>{pesos.format(change.monthly_pesos)} mensual · {pesos.format(change.founder_monthly_pesos)} fundadora</span>
                <span>{change.actor_email}</span>
                <time dateTime={change.created_at}>{cuando.format(new Date(change.created_at))}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
