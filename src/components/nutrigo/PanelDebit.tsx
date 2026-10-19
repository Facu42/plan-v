import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../api/error';
import { subscriptionsApi } from '../../api/subscriptions';
import { schedulingApi } from '../../api/scheduling';
import { friendlyError } from '../../lib/error-messages';
import { debitPerson, debitState, debitSummary, debitTone, filterDebits, monthlyLabel, nextChargeLabel, payerEmailError, planDraftError, type DebitFilter, type PlanDraft } from '../../lib/panel-subscriptions';
import type { PatientSubscription, SubscriptionList, SubscriptionPlan } from '../../types/subscriptions';

export type DebitSheet = 'no' | 'planes' | 'activar' | 'enlace';

const EMPTY: SubscriptionList = { subscriptions: [], summary: { active: 0, pending: 0, problems: 0, unlinked: 0 } };
const FILTERS: Array<[DebitFilter, string]> = [['todas', 'Todas'], ['al_dia', 'Al día'], ['problemas', 'Con problemas'], ['sin_ficha', 'Sin ficha']];

function pesosOf(plan: SubscriptionPlan): string {
  return String(Math.round(plan.amount_cents / 100));
}

export function PlanForm({ plan, canPublish = true, onSubmit, onCancel }: { plan: SubscriptionPlan | null; canPublish?: boolean; onSubmit: (draft: PlanDraft & { apply: boolean }) => void; onCancel: () => void }) {
  return <form className="p5-card" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get('nombre') ?? ''),
      pesos: String(data.get('precio') ?? ''),
      description: String(data.get('incluye') ?? ''),
      visible: data.get('visible') === 'on',
      apply: data.get('aplicar') === 'on',
    });
  }}>
    <h3>{plan ? 'Editar plan' : 'Nuevo plan'}</h3>
    <label>Nombre<input name="nombre" required minLength={2} maxLength={60} defaultValue={plan?.name ?? 'Seguimiento mensual'} /></label>
    <label>Precio en pesos<input name="precio" inputMode="numeric" required defaultValue={plan ? pesosOf(plan) : '54000'} /></label>
    <p className="p5-note">Se cobra una vez por mes.</p>
    <label>Qué incluye<textarea name="incluye" maxLength={280} defaultValue={plan?.description ?? ''} placeholder="Dos consultas por videollamada, plan semanal y mensajes" /></label>
    <label className="p5-check"><input type="checkbox" name="visible" defaultChecked={Boolean(canPublish && plan?.public_visible)} disabled={!canPublish} />Mostrar en mi página pública</label>
    {plan && <label className="p5-check"><input type="checkbox" name="aplicar" />Avisar 10 días y aplicarlo a las que ya están activas</label>}
    <div className="p5-row"><button type="button" className="p5-btn" onClick={onCancel}>Volver</button><button className="p5-btn p5-pri">Guardar plan</button></div>
  </form>;
}

export function PanelDebitView({
  plans, subscriptions, summary, patients, mercadoPago, filter, sheet, editing, creating, link, notice, busy,
  onFilter, onOpenPlans, onOpenActivate, onClose, onCreate, onSave, onEdit, onFormBack, onActivate, onCopy, onReconcile, onPause, onResume, onCancel,
}: {
  plans: SubscriptionPlan[];
  subscriptions: PatientSubscription[];
  summary: SubscriptionList['summary'];
  patients: { id: string; name: string }[];
  mercadoPago: boolean;
  filter: DebitFilter;
  sheet: DebitSheet;
  editing: SubscriptionPlan | null;
  creating: boolean;
  link: string;
  notice: string;
  busy: boolean;
  onFilter: (filter: DebitFilter) => void;
  onOpenPlans: () => void;
  onOpenActivate: () => void;
  onClose: () => void;
  onCreate: (draft: PlanDraft & { apply: boolean }) => void;
  onSave: (plan: SubscriptionPlan, draft: PlanDraft & { apply: boolean }) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onFormBack: () => void;
  onActivate: (input: { planId: string; patientId: string; email: string }) => void;
  onCopy: (url: string) => void;
  onReconcile: (id?: string) => void;
  onPause: (sub: PatientSubscription) => void;
  onResume: (sub: PatientSubscription) => void;
  onCancel: (sub: PatientSubscription) => void;
}) {
  const rows = filterDebits(subscriptions, filter);
  return <>
    <section className="p5-card" aria-label="Débito automático">
      <header><h3>Débito automático</h3><button type="button" className="p5-btn" disabled={busy} onClick={() => onReconcile()}>Conciliar</button></header>
      <p>{debitSummary(summary)}</p>
      {!mercadoPago && <p className="p5-note">Conectá Mercado Pago para cobrar con débito automático. <a href="/crm/desarrollo?modulo=configuracion">Ir a conexiones</a></p>}
      <div className="p5-seg" role="group" aria-label="Filtrar débitos">{FILTERS.map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => onFilter(id)}>{label}</button>)}</div>
      {!subscriptions.length && <p className="p5-empty">Todavía no tenés débitos automáticos. Creá un plan de seguimiento y mandáselo a tus pacientes.</p>}
      {subscriptions.length > 0 && !rows.length && <p className="p5-empty">No hay débitos en este filtro.</p>}
      {rows.map(sub => {
        const name = debitPerson(sub, patients);
        return <div className="p5-li p5-debit" key={sub.id}>
          <div className="p5-tx"><b>{name}</b><span>{sub.plan_name} · {monthlyLabel(sub.amount_cents)} · {nextChargeLabel(sub.next_payment_date)}</span></div>
          <span className={`p5-state p5-${debitTone(sub)}`}>{debitState(sub)}</span>
          <details className="p5-menu">
            <summary>Acciones de {name}</summary>
            {sub.init_point && <button type="button" className="p5-btn" onClick={() => onCopy(sub.init_point!)}>Copiar enlace</button>}
            {sub.status === 'authorized' && <button type="button" className="p5-btn" disabled={busy} onClick={() => onPause(sub)}>Pausar</button>}
            {sub.status === 'paused' && <button type="button" className="p5-btn" disabled={busy} onClick={() => onResume(sub)}>Reanudar</button>}
            {sub.status !== 'cancelled' && sub.status !== 'expired' && <button type="button" className="p5-btn" disabled={busy} onClick={() => onReconcile(sub.id)}>Conciliar este débito</button>}
            {sub.status !== 'cancelled' && sub.status !== 'expired' && <p className="p5-note">Se dejan de hacer cobros. Para volver hay que generar otro enlace.</p>}
            {sub.status !== 'cancelled' && sub.status !== 'expired' && <button type="button" className="p5-btn" disabled={busy} onClick={() => onCancel(sub)}>Cancelar débito</button>}
          </details>
        </div>;
      })}
      <div className="p5-row">
        <button type="button" className="p5-btn" onClick={onOpenPlans}>Crear plan</button>
        <button type="button" className="p5-btn p5-pri" onClick={onOpenActivate} disabled={!mercadoPago || !plans.length}>Activar débito automático</button>
      </div>
    </section>
    {sheet !== 'no' && <div className="p5-dialog" role="dialog" aria-modal="true" aria-label={sheet === 'activar' ? 'Activar débito automático' : sheet === 'enlace' ? 'Enlace del débito' : 'Planes de seguimiento'}><div className="p5-sheet">
      {sheet === 'enlace' && <div className="p5-card"><h3>Enlace listo</h3><p>Pasale este enlace a la paciente para que active el débito.</p><input readOnly value={link} aria-label="Enlace para la paciente" onFocus={event => event.currentTarget.select()} /><div className="p5-row"><button type="button" className="p5-btn" onClick={onClose}>Cerrar</button><button type="button" className="p5-btn p5-pri" onClick={() => onCopy(link)}>Copiar enlace</button></div></div>}
      {sheet === 'activar' && <form className="p5-card" onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onActivate({ planId: String(data.get('plan') ?? ''), patientId: String(data.get('paciente') ?? ''), email: String(data.get('correo') ?? '') });
      }}>
        <h3>Activar débito automático</h3>
        <label>Paciente<select name="paciente" required defaultValue="">{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}{!patients.length && <option value="">Todavía no hay pacientes</option>}</select></label>
        <label>Plan<select name="plan" required defaultValue="">{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {monthlyLabel(plan.amount_cents)}</option>)}</select></label>
        <label>Correo de la cuenta de Mercado Pago<input name="correo" type="email" required autoComplete="email" /></label>
        <p className="p5-note">Tiene que ser el mismo correo con el que va a pagar.</p>
        <div className="p5-row"><button type="button" className="p5-btn" onClick={onClose}>Volver</button><button className="p5-btn p5-pri" disabled={busy || !patients.length}>Generar enlace</button></div>
      </form>}
      {sheet === 'planes' && (creating || editing || !plans.length ? <PlanForm plan={editing} canPublish={mercadoPago} onCancel={onFormBack} onSubmit={draft => editing ? onSave(editing, draft) : onCreate(draft)} /> : <div className="p5-card"><header><h3>Planes de seguimiento</h3><button type="button" className="p5-btn" onClick={onOpenPlans}>Nuevo plan</button></header>
        {plans.map(plan => <div className="p5-li" key={plan.id}><div className="p5-tx"><b>{plan.name}</b><span>{monthlyLabel(plan.amount_cents)}{plan.public_visible ? ' · Visible en la página' : ''}</span></div><button type="button" className="p5-btn" onClick={() => onEdit(plan)}>Editar</button></div>)}
        <div className="p5-row"><button type="button" className="p5-btn" onClick={onClose}>Cerrar</button></div>
      </div>)}
      {notice && <p className="p5-status" role="status">{notice}</p>}
    </div></div>}
    {sheet === 'no' && notice && <p className="p5-status" role="status">{notice}</p>}
  </>;
}

export function usePanelDebit(patients: { id: string; name: string }[]) {
  const [enabled, setEnabled] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [list, setList] = useState<SubscriptionList>(EMPTY);
  const [mercadoPago, setMercadoPago] = useState(false);
  const [filter, setFilter] = useState<DebitFilter>('todas');
  const [sheet, setSheet] = useState<DebitSheet>('no');
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [planRows, next] = await Promise.all([subscriptionsApi.plans(), subscriptionsApi.list()]);
    setPlans(planRows.plans.filter(plan => plan.status === 'active'));
    setList(next);
    setEnabled(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([subscriptionsApi.plans(), subscriptionsApi.list(), schedulingApi.workspace(0, controller.signal).catch(() => null)])
      .then(([planRows, next, workspace]) => {
        if (controller.signal.aborted) return;
        setPlans(planRows.plans.filter(plan => plan.status === 'active'));
        setList(next);
        setMercadoPago(Boolean(workspace && 'connections' in workspace && workspace.connections.mercadopago));
        setEnabled(true);
      })
      .catch(error => {
        if (controller.signal.aborted || (error instanceof ApiError && error.status === 404)) return;
        setNotice(friendlyError(error));
      });
    return () => controller.abort();
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice('');
    try {
      await action();
      await reload();
    } catch (error) {
      setNotice(friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  const button: ReactNode = enabled ? <button type="button" className="p5-btn" onClick={() => { setCreating(false); setEditing(null); setSheet('planes'); }}>Planes de seguimiento</button> : null;
  const card: ReactNode = enabled ? <PanelDebitView
    plans={plans} subscriptions={list.subscriptions} summary={list.summary} patients={patients} mercadoPago={mercadoPago}
    filter={filter} sheet={sheet} editing={creating ? null : editing} creating={creating} link={link} notice={notice} busy={busy}
    onFilter={setFilter} onOpenPlans={() => { setCreating(true); setEditing(null); setSheet('planes'); }} onOpenActivate={() => setSheet('activar')} onClose={() => { setSheet('no'); setCreating(false); setEditing(null); }}
    onFormBack={() => { if ((creating || editing) && plans.length) { setCreating(false); setEditing(null); setNotice(''); return; } setSheet('no'); setCreating(false); setEditing(null); }}
    onCreate={draft => {
      const problem = planDraftError(draft);
      if (problem) { setNotice(problem); return; }
      void run(async () => {
        await subscriptionsApi.createPlan({ name: draft.name.trim(), description: draft.description.trim() || null, amount_cents: Number(draft.pesos) * 100, public_visible: mercadoPago && draft.visible });
        setCreating(false);
        setSheet('planes');
        setNotice('Plan guardado.');
      });
    }}
    onSave={(plan, draft) => {
      const problem = planDraftError(draft);
      if (problem) { setNotice(problem); return; }
      void run(async () => {
        await subscriptionsApi.updatePlan(plan.id, { expected_revision: plan.revision, name: draft.name.trim(), description: draft.description.trim() || null, amount_cents: Number(draft.pesos) * 100, ...(mercadoPago ? { public_visible: draft.visible } : {}), apply_to_active: draft.apply });
        setEditing(null);
        setNotice(draft.apply ? 'Las activas reciben el aviso de 10 días.' : 'Plan actualizado.');
      });
    }}
    onEdit={plan => { if (!plan?.id) { setCreating(true); setEditing(null); return; } setCreating(false); setEditing(plan); }}
    onActivate={input => {
      const problem = payerEmailError(input.email);
      if (problem || !input.planId || !input.patientId) { setNotice(problem || 'Elegí la paciente y el plan.'); return; }
      void run(async () => {
        const created = await subscriptionsApi.create({ plan_id: input.planId, patient_id: input.patientId, payer_email: input.email.trim(), source: 'panel', client_request_id: crypto.randomUUID() });
        setLink(created.init_point ?? '');
        setSheet(created.init_point ? 'enlace' : 'no');
        setNotice(created.init_point ? 'Enlace generado.' : 'Estamos preparando el enlace. Usá Conciliar en un momento.');
      });
    }}
    onCopy={url => {
      if (!url) { setNotice('Todavía no hay un enlace.'); return; }
      void navigator.clipboard.writeText(url).then(() => setNotice('Enlace copiado.')).catch(() => setNotice('No se pudo copiar. Seleccioná el enlace y copialo a mano.'));
    }}
    onReconcile={id => void run(async () => { const result = await subscriptionsApi.reconcile(id); setNotice(result.checked ? 'Estados actualizados.' : 'No había débitos para revisar.'); })}
    onPause={sub => void run(async () => { await subscriptionsApi.change(sub.id, 'pause', sub.revision); setNotice('Débito en pausa.'); })}
    onResume={sub => void run(async () => { await subscriptionsApi.change(sub.id, 'resume', sub.revision); setNotice('Débito reanudado.'); })}
    onCancel={sub => void run(async () => { await subscriptionsApi.change(sub.id, 'cancel', sub.revision); setNotice('Débito cancelado.'); })}
  /> : (notice ? <p className="p5-status" role="status">{notice}</p> : null);
  return { enabled, plans, button, card };
}
