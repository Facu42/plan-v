import type { BillingBoard } from '../../types/fees';
import { schedulingDefaultSettings } from '../../types/scheduling';
import type { PatientSubscription, SubscriptionPlan } from '../../types/subscriptions';
import { X } from '@phosphor-icons/react';
import { Icon, Mark } from '../shared/Icon';
import { PanelCobranzasView } from './PanelCobranzas';
import { PanelDebitView } from './PanelDebit';
import { PanelFeePayDialog } from './PanelFeePay';
import { PanelNavigation } from './PanelNavigation';
import { PanelPublicPageView } from './PanelPublicPage';
import { PublicFollowPlansView } from './PublicFollowPlans';
import { PublicMonthlyFeeView } from './PublicMonthlyFee';
import { PRO_TABS } from './showroom-nav';
import './nutrigo.css';
import './panel-nutri-tokens.css';
import './panel-nutri-shell.css';
import './panel-fase5.css';
import './scheduling.css';

const plan: SubscriptionPlan = {
  id: 'plan-1', name: 'Seguimiento mensual', description: 'Dos consultas por videollamada y el plan de la semana',
  amount_cents: 5_400_000, currency: 'ARS', frequency: 1, frequency_type: 'months', public_visible: true, status: 'active', revision: 1,
};

const patients = [{ id: 'camila', name: 'Camila Torres' }, { id: 'brenda', name: 'Brenda Acosta' }];

const subscriptions: PatientSubscription[] = [
  {
    id: 'sub-1', plan_id: plan.id, plan_name: plan.name, patient_id: 'camila', contact_name: null, payer_email_masked: 'ca•••@correo.com',
    source: 'panel', status: 'authorized', payment_state: 'ok', cancelled_by: null, amount_cents: plan.amount_cents,
    pending_amount_cents: null, pending_amount_on: null, next_payment_date: '2026-11-10', init_point: 'https://pago.example/camila',
    revision: 2, review_required: false, account_mismatch: false, expires_at: null, created_at: '2026-10-10T12:00:00Z',
  },
  {
    id: 'sub-2', plan_id: plan.id, plan_name: plan.name, patient_id: 'brenda', contact_name: null, payer_email_masked: 'br•••@correo.com',
    source: 'panel', status: 'pending', payment_state: null, cancelled_by: null, amount_cents: plan.amount_cents,
    pending_amount_cents: null, pending_amount_on: null, next_payment_date: null, init_point: 'https://pago.example/brenda',
    revision: 1, review_required: false, account_mismatch: false, expires_at: '2026-10-26T12:00:00Z', created_at: '2026-10-19T12:00:00Z',
  },
];

const board: BillingBoard = {
  settings: { default_fee: null, alias: 'nutri.plan', payment_link: '', instructions: '' },
  patients: [{
    patient_id: 'camila', full_name: 'Camila Torres', fee: { amount: 54000, first_due_on: '2026-10-01', program_name: 'Mensual' },
    charges: [{ id: 'c1', due_on: '2026-10-14', amount: 54000, status: 'open' }],
    payments: [{ id: 'p1', amount: 54000, paid_on: '2026-10-21', method: 'mercado_pago', note: 'Débito automático · Seguimiento mensual · octubre 2026', status: 'confirmed', reported_by_patient: false, created_at: '2026-10-21T12:00:00Z', source: 'subscription' }],
  }, {
    patient_id: 'marina', full_name: 'Marina López', fee: { amount: 28000, first_due_on: '2026-10-01', program_name: 'Mensual' },
    charges: [{ id: 'c2', due_on: '2026-10-01', amount: 28000, status: 'open' }],
    payments: [],
  }],
};

const noop = () => undefined;

export function SubscriptionPreview() {
  const params = new URLSearchParams(window.location.search);
  const dark = params.get('tema') === 'oscuro';
  const screen = params.get('pantalla') ?? 'cobranzas';
  const config = schedulingDefaultSettings();
  config.page.title = 'Lic. Verónica Trenti';
  config.page.bio = 'Acompaño a mujeres a comer mejor, con un plan que entra en la rutina.';
  config.types = [{ id: '00000000-0000-4000-a000-000000000002', name: 'Consulta suelta', calendar_id: config.calendars[0].id, duration_min: 60, channel: 'presencial', price_minor: 4_000_000, deposit_minor: 0 }];
  const shell = screen !== 'suscripcion';
  const current = screen === 'publica' ? '/crm/agenda?agenda=publica' : '/crm/cobranzas';
  const title = screen === 'publica' ? 'Página pública' : 'Cobranzas';
  const moreCurrent = screen.startsWith('cobranzas') || screen === 'publica';
  return <div className={`nv-app nv-pro pn-panel${screen.startsWith('cobranzas') ? ' nv-fees-page' : ''}${screen === 'publica' ? ' nv-agenda-page' : ''}${dark ? ' nv-dark' : ''}`} style={{ minHeight: '100vh' }}>
    {shell && <aside className="nv-sidebar" aria-label="Consultorio">
      <button className="pn-mobile-close" type="button" aria-label="Cerrar navegación"><X size={18} aria-hidden="true" /></button>
      <a className="nv-brand" href="/crm/inicio"><Mark /><span>Plan V<small>Tu consultorio</small></span></a>
      <PanelNavigation patients={[]} unread={0} admin={false} current={current} collapsed={false} onOpen={noop} />
      <div className="pn-sidebar-account"><span className="nv-user-avatar" aria-hidden="true">VT</span><span className="pn-nav-label"><strong>Verónica Trenti</strong><small>Nutricionista</small></span></div>
    </aside>}
    <div className="nv-workspace">
    {shell && <header className="nv-topbar">
      <a className="nv-brand" href="/crm/inicio"><Mark /><span>Plan V</span></a>
      <h1 className="nv-topbar-title" aria-label={title}><span className="nv-topbar-label-desktop">{title}</span><span className="nv-topbar-label-mobile" aria-hidden="true">{title}</span></h1>
      <button type="button" className="nv-button nv-ghost nv-menu-toggle" aria-label="Abrir el menú"><Icon name="list" size={20} /></button>
    </header>}
    <div className={shell ? 'nv-content-layout' : undefined}>
    <main className={shell ? 'nv-main' : undefined} id="nv-main">
      {screen.startsWith('cobranzas') && <PanelCobranzasView
        board={board} today="2026-10-21" filter="todos" reminders={false} onFilter={noop} onExport={noop} onOpen={noop} onRemind={noop} onRetry={noop} error="" loading={false}
        plansAction={<button type="button" className="p5-btn">Planes de seguimiento</button>}
        followNames={['Seguimiento mensual']}
        debit={<PanelDebitView
          plans={[plan]} subscriptions={subscriptions} summary={{ active: 1, pending: 1, problems: 0, unlinked: 0 }} patients={patients}
          mercadoPago filter="todas" sheet={screen === 'cobranzas-plan' ? 'planes' : 'no'} editing={null} creating={screen === 'cobranzas-plan'}
          link="https://pago.example/camila" notice="" busy={false}
          onFilter={noop} onOpenPlans={noop} onOpenActivate={noop} onClose={noop} onCreate={noop} onSave={noop} onEdit={noop} onFormBack={noop} onActivate={noop} onCopy={noop} onReconcile={noop} onPause={noop} onResume={noop} onCancel={noop}
        />}
        onFeePay={noop}
        feeBlocked={['camila']}
      />}
      {screen === 'cobranzas-cobro' && <PanelFeePayDialog name="Marina López" options={[{ due_on: '2026-10-01', amount: 28000, title: 'Cuota de octubre 2026' }]} busy={false} notice="Enlace generado." link="https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=uno" onClose={noop} onCreate={noop} onCopy={noop} />}
      {screen === 'publica' && <PanelPublicPageView
        config={config} published pageUrl="https://plan.v/consultorio/veronica-trenti" connections={{ google: false, mercadopago: true }}
        status="" busy={false} loading={false} error="" onChange={noop} onPublish={noop} onToggleEnabled={noop} onConnect={noop} onRetry={noop}
        plans={[plan]} onTogglePlan={noop} onEditPlan={noop}
      />}
      {screen === 'suscripcion' && <section className="care-panel scheduling-panel" aria-label="Reservas del consultorio">
        <header><h1>Lic. Verónica Trenti</h1><p>Acompaño a mujeres a comer mejor, con un plan que entra en la rutina.</p></header>
        <PublicFollowPlansView plans={[plan]} busy={false} notice="" onSubmit={noop} />
        <PublicMonthlyFeeView busy={false} notice="" onSubmit={noop} />
        <h2>Consulta suelta</h2>
        <p>Horarios en Argentina. El consultorio confirma las solicitudes.</p>
        <form><label>Tipo de consulta <select defaultValue="consulta"><option value="consulta">Consulta suelta · 60 min · $40.000</option></select></label><button type="button">Solicitar turno</button></form>
      </section>}
    </main>
    </div>
    </div>
    {shell && <nav className="nv-tabbar" aria-label="Secciones principales">
      {PRO_TABS.map(tab => <button key={tab.id} type="button"><span className="nv-tab-icon"><Icon name={tab.icon} size={22} /></span><span>{tab.label}</span></button>)}
      <button type="button" aria-current={moreCurrent ? 'page' : undefined}><span className="nv-tab-icon"><Icon name="grid" size={22} /></span><span>Más</span></button>
    </nav>}
  </div>;
}
