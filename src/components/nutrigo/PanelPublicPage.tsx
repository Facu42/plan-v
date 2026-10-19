import { useEffect, useState } from 'react';
import type { SchedulingSettings } from '../../types/scheduling';
import { bookingHref, depositMode, withHalfDeposit } from '../../lib/panel-agenda';
import { monthlyLabel, planDraftError } from '../../lib/panel-subscriptions';
import { subscriptionsApi } from '../../api/subscriptions';
import { ApiError } from '../../api/error';
import { friendlyError } from '../../lib/error-messages';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { Icon } from '../shared/Icon';
import { PlanForm } from './PanelDebit';
import { PanelConnections, type ConnectionKey } from './PanelConnections';
import { useUnsavedChanges } from './unsaved-changes';
import { usePanelScheduling } from './use-panel-scheduling';
import './panel-fase5.css';

const money = (minor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(minor / 100);

export function PanelPublicPageView({ config, published, pageUrl, connections, status, busy, loading, error, onChange, onPublish, onToggleEnabled, onConnect, onDisconnect, onRetry, plans = null, onTogglePlan, onEditPlan }: {
  config: SchedulingSettings; published: boolean; pageUrl: string; connections: Record<ConnectionKey, boolean>; status: string; busy: boolean; loading: boolean; error: string;
  onChange: (next: SchedulingSettings) => void; onPublish: () => void; onToggleEnabled: (enabled: boolean) => void; onConnect: (key: ConnectionKey) => void; onDisconnect?: (key: 'google' | 'mercadopago') => void; onRetry: () => void;
  plans?: SubscriptionPlan[] | null; onTogglePlan?: (plan: SubscriptionPlan, visible: boolean) => void; onEditPlan?: (plan: SubscriptionPlan | null) => void;
}) {
  const page = config.page;
  const mode = depositMode(config.types);
  const setPage = (patch: Partial<SchedulingSettings['page']>) => onChange({ ...config, page: { ...page, ...patch } });
  const previewTypes = config.types.slice(0, 4);
  return <section className="p5" aria-label="Página pública">
    <header className="p5-head"><div><h2>Página pública</h2><p>Tu página para que las pacientes reserven</p></div>
      {published ? <a className="p5-btn" href={pageUrl} target="_blank" rel="noreferrer"><Icon name="arrow" size={15} />Ver página</a> : <span className="p5-note">Todavía no está publicada.</span>}
      <button type="button" className="p5-btn p5-pri" disabled={busy || loading} onClick={onPublish}>Publicar cambios</button>
    </header>
    {error && <p className="p5-alert" role="alert">{error} <button type="button" onClick={onRetry}>Reintentar</button></p>}
    {status && <p className="p5-status" role="status">{status}</p>}
    {loading ? <p className="p5-empty">Cargando tu página…</p> : <div className="p5-public">
      <section className="p5-card"><header><h3>Perfil</h3></header>
        <label>Nombre<input value={page.title} maxLength={100} required onChange={event => setPage({ title: event.target.value })} /></label>
        <label>Presentación<textarea maxLength={1200} value={page.bio} onChange={event => setPage({ bio: event.target.value })} /></label>
        <label>Dirección del link<span className="p5-slug">planv.app/<input aria-label="Dirección del link" value={page.slug} pattern="[a-z0-9][a-z0-9-]{2,59}" onChange={event => setPage({ slug: event.target.value })} /></span></label>
        <label>Dónde atendés<input value={page.location} maxLength={200} onChange={event => setPage({ location: event.target.value })} /></label>
        <label>Contacto público<input value={page.contact} maxLength={150} onChange={event => setPage({ contact: event.target.value })} /></label>
        <label>Imagen pública<input type="url" placeholder="https://" value={page.logo_url} onChange={event => setPage({ logo_url: event.target.value })} /></label>
      </section>
      <div className="p5-stack">
        <section className="p5-card"><header><h3>Servicios</h3><button type="button" className="p5-btn" disabled={config.types.length >= 30} onClick={() => onChange({ ...config, types: [...config.types, { id: crypto.randomUUID(), name: 'Consulta', calendar_id: config.calendars[0].id, duration_min: 45, channel: 'video', price_minor: 0, deposit_minor: 0 }] })}>Agregar</button></header>
          {!config.types.length && <p className="p5-empty">Todavía no hay servicios.</p>}
          {config.types.map(type => <div className="p5-li" key={type.id}><div className="p5-tx"><input aria-label={`Nombre de ${type.name || 'servicio'}`} value={type.name} maxLength={80} onChange={event => onChange({ ...config, types: config.types.map(item => item.id === type.id ? { ...item, name: event.target.value } : item) })} /><span>{type.duration_min} min · {money(type.price_minor)}</span></div><button type="button" className="p5-btn" onClick={() => onChange({ ...config, types: config.types.filter(item => item.id !== type.id) })}>Quitar</button></div>)}
        </section>
        {plans && <section className="p5-card" aria-label="Planes de seguimiento"><header><h3>Planes de seguimiento</h3><button type="button" className="p5-btn" onClick={() => onEditPlan?.(null)}>Nuevo plan</button></header>
          {!connections.mercadopago && <p className="p5-note">Conectá Mercado Pago para cobrar con débito automático</p>}
          {!plans.length && <p className="p5-empty">Todavía no hay planes de seguimiento.</p>}
          {plans.map(plan => <div className="p5-li" key={plan.id}><div className="p5-tx"><b>{plan.name}</b><span>{monthlyLabel(plan.amount_cents)} · {plan.description || 'Seguimiento mensual'}</span></div><button type="button" className="p5-btn" onClick={() => onEditPlan?.(plan)}>Editar</button><button type="button" className={`p5-switch${plan.public_visible && connections.mercadopago ? ' on' : ''}`} aria-pressed={plan.public_visible && connections.mercadopago} disabled={!connections.mercadopago} onClick={() => onTogglePlan?.(plan, !plan.public_visible)}><span className="p5-sr">Mostrar en mi página {plan.name}</span></button></div>)}
        </section>}
        <section className="p5-card"><header><h3>Reservas</h3></header>
          <div className="p5-li"><div className="p5-tx"><b>Reserva desde la página</b><span>Las pacientes eligen día y hora</span></div><button type="button" className={`p5-switch${page.enabled ? ' on' : ''}`} aria-pressed={page.enabled} onClick={() => onToggleEnabled(!page.enabled)}><span className="p5-sr">Reserva desde la página</span></button></div>
          {mode === 'mixed' ? <p className="p5-note">La seña cambia según el servicio.</p> : <div className="p5-li"><div className="p5-tx"><b>Pedir seña</b><span>{connections.mercadopago ? '50% con Mercado Pago' : '50% cuando conectes Mercado Pago. No se cobra sola.'}</span></div>{mode !== 'none' && <button type="button" className={`p5-switch${mode === 'on' ? ' on' : ''}`} aria-pressed={mode === 'on'} onClick={() => onChange({ ...config, types: withHalfDeposit(config.types, mode !== 'on') })}><span className="p5-sr">Pedir seña</span></button>}</div>}
          <div className="p5-li"><div className="p5-tx"><b>Anticipación mínima</b><span>24 horas. Es la regla de la página.</span></div></div>
          <div className="p5-li"><div className="p5-tx"><b>Comprobar Google al ofrecer horarios</b><span>Solo si Google Calendar está conectado</span></div><button type="button" className={`p5-switch${config.google_enabled ? ' on' : ''}`} aria-pressed={config.google_enabled} disabled={!connections.google} onClick={() => onChange({ ...config, google_enabled: !config.google_enabled })}><span className="p5-sr">Comprobar Google al ofrecer horarios</span></button></div>
          <div className="p5-li"><div className="p5-tx"><b>Crear un enlace de Meet por consulta</b><span>Para las consultas online</span></div><button type="button" className={`p5-switch${config.create_meet ? ' on' : ''}`} aria-pressed={config.create_meet} onClick={() => onChange({ ...config, create_meet: !config.create_meet })}><span className="p5-sr">Crear un enlace de Meet por consulta</span></button></div>
          <label>Alias de transferencia<input maxLength={100} value={config.transfer_alias} onChange={event => onChange({ ...config, transfer_alias: event.target.value })} /></label>
          <PanelConnections connected={connections} onConnect={onConnect} onDisconnect={onDisconnect} />
        </section>
      </div>
      <section className="p5-card p5-preview" aria-label="Así la ve la paciente"><span>Así la ve la paciente</span>
        <div className="p5-phone">
          {page.logo_url.startsWith('https://') && <img src={page.logo_url} alt="" />}
          <strong>{page.title || 'Tu consultorio'}</strong>
          <p>{page.bio || 'Todavía no hay presentación.'}</p>
          <span className="p5-preview-cta" aria-hidden="true">Reservar turno</span>
          <h4>Consulta suelta</h4>
          {previewTypes.map(type => <div key={type.id}><b>{type.name}</b><small>{type.duration_min} min</small><em>{money(type.price_minor)}</em></div>)}
          {!previewTypes.length && <p className="p5-empty">Sin consulta suelta para mostrar.</p>}
          {plans && plans.some(plan => plan.public_visible) && <h4>Planes de seguimiento</h4>}
          {plans?.filter(plan => plan.public_visible).map(plan => <div key={plan.id}><b>{plan.name}</b><small>{plan.description || 'Seguimiento mensual'}</small><em>{monthlyLabel(plan.amount_cents)}</em><span className="p5-preview-cta">Suscribirme</span></div>)}
        </div>
      </section>
    </div>}
  </section>;
}

export function PanelPublicPage() {
  const scheduling = usePanelScheduling();
  const [draft, setDraft] = useState<SchedulingSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [editor, setEditor] = useState<SubscriptionPlan | 'nuevo' | null>(null);
  const [planNotice, setPlanNotice] = useState('');
  const loadPlans = () => {
    subscriptionsApi.plans().then(result => setPlans(result.plans.filter(plan => plan.status === 'active'))).catch(error => {
      if (error instanceof ApiError && error.status === 404) setPlans(null);
      else setPlanNotice(friendlyError(error));
    });
  };
  useEffect(loadPlans, []);
  const config = draft ?? scheduling.config;
  const loaded = Boolean(scheduling.snapshot);
  useUnsavedChanges(Boolean(draft), scheduling.busy);
  const published = Boolean(scheduling.snapshot?.profile.config.page.enabled);
  const pageUrl = published ? bookingHref(typeof window === 'undefined' ? 'https://plan.v' : window.location.origin, scheduling.snapshot?.profile.config.page.slug ?? config.page.slug) : '';
  const view = <PanelPublicPageView config={config} published={published} pageUrl={pageUrl} connections={{ google: Boolean(scheduling.snapshot?.connections.google), mercadopago: Boolean(scheduling.snapshot?.connections.mercadopago) }} status={planNotice || scheduling.status} busy={scheduling.busy} loading={!loaded && !scheduling.error} error={scheduling.error} onChange={setDraft} onRetry={() => void scheduling.load()} onConnect={key => void scheduling.connect(key)} onDisconnect={key => void scheduling.disconnect(key)} onToggleEnabled={enabled => { const next = { ...config, page: { ...config.page, enabled } }; setDraft(next); void scheduling.save(next, enabled ? 'La página acepta reservas.' : 'La página dejó de aceptar reservas.').then(ok => { if (ok) setDraft(null); }); }} onPublish={() => {
    if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(config.page.slug)) { scheduling.setStatus('La dirección usa minúsculas, números y guiones.'); return; }
    if (config.page.logo_url && !config.page.logo_url.startsWith('https://')) { scheduling.setStatus('La imagen tiene que ser un enlace https.'); return; }
    void scheduling.save({ ...config, page: { ...config.page, enabled: true, title: config.page.title.trim() || 'Mi consultorio' } }, 'Página publicada.').then(ok => { if (ok) setDraft(null); });
  }} plans={plans} onEditPlan={plan => { setPlanNotice(''); setEditor(plan ?? 'nuevo'); }} onTogglePlan={(plan, visible) => {
    subscriptionsApi.updatePlan(plan.id, { expected_revision: plan.revision, public_visible: visible }).then(loadPlans).catch(error => setPlanNotice(friendlyError(error)));
  }} />;
  const current = editor && editor !== 'nuevo' ? editor : null;
  return <>
    {view}
    {editor && <div className="p5-dialog" role="dialog" aria-modal="true" aria-label={current ? 'Editar plan' : 'Nuevo plan'}>
      <PlanForm plan={current} canPublish={Boolean(scheduling.snapshot?.connections.mercadopago)} onCancel={() => setEditor(null)} onSubmit={draft => {
        const problem = planDraftError(draft);
        if (problem) { setPlanNotice(problem); return; }
        const body = { name: draft.name.trim(), description: draft.description.trim() || null, amount_cents: Number(draft.pesos) * 100, public_visible: draft.visible && Boolean(scheduling.snapshot?.connections.mercadopago) };
        const action = current
          ? subscriptionsApi.updatePlan(current.id, { ...body, expected_revision: current.revision, apply_to_active: draft.apply })
          : subscriptionsApi.createPlan(body);
        action.then(() => { setEditor(null); setPlanNotice(current ? 'Plan actualizado.' : 'Plan guardado.'); loadPlans(); }).catch(error => setPlanNotice(friendlyError(error)));
      }} />
    </div>}
  </>;
}
