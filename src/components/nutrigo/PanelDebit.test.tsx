import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PatientSubscription, SubscriptionPlan } from '../../types/subscriptions';
import { PanelDebitView, PlanForm } from './PanelDebit';

const plan: SubscriptionPlan = {
  id: 'plan-1', name: 'Seguimiento mensual', description: 'Dos consultas', amount_cents: 5_400_000, currency: 'ARS',
  frequency: 1, frequency_type: 'months', public_visible: true, status: 'active', revision: 2,
};

function sub(patch: Partial<PatientSubscription> = {}): PatientSubscription {
  return {
    id: 'sub-1', plan_id: plan.id, plan_name: plan.name, patient_id: 'camila', contact_name: 'Camila Torres',
    payer_email_masked: 'ca•••@correo.com', source: 'panel', status: 'authorized', payment_state: 'ok', cancelled_by: null,
    amount_cents: plan.amount_cents, pending_amount_cents: null, pending_amount_on: null, next_payment_date: '2026-11-10',
    init_point: 'https://pago.example/camila', revision: 3, review_required: false, account_mismatch: false,
    expires_at: null, created_at: '2026-10-10T12:00:00Z', ...patch,
  };
}

const handlers = {
  onFilter: vi.fn(), onOpenPlans: vi.fn(), onOpenActivate: vi.fn(), onClose: vi.fn(), onCreate: vi.fn(), onSave: vi.fn(),
  onEdit: vi.fn(), onFormBack: vi.fn(), onActivate: vi.fn(), onCopy: vi.fn(), onReconcile: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onCancel: vi.fn(),
};

function visible(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('tarjeta de débito automático', () => {
  it('arma el plan mensual sin prueba gratis', () => {
    const html = renderToStaticMarkup(<PlanForm plan={null} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(html).toContain('Nuevo plan');
    expect(html).toContain('Se cobra una vez por mes.');
    expect(html).toContain('Mostrar en mi página pública');
    expect(html).not.toContain('prueba gratis');
    expect(html).not.toContain('WhatsApp');
  });

  it('deja el plan oculto en la página si Mercado Pago no está conectado', () => {
    const html = renderToStaticMarkup(<PlanForm plan={plan} canPublish={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(html).toContain('disabled');
    expect(html).not.toContain('checked');
  });

  it('muestra quién está al día, el enlace y Conciliar, sin chat ni WhatsApp', () => {
    const html = renderToStaticMarkup(<PanelDebitView
      plans={[plan]} subscriptions={[sub(), sub({ id: 'sub-2', patient_id: null, contact_name: 'Ana Paz', status: 'pending', payment_state: null, next_payment_date: null })]}
      summary={{ active: 1, pending: 1, problems: 0, unlinked: 1 }} patients={[{ id: 'camila', name: 'Camila Torres' }]}
      mercadoPago filter="todas" sheet="no" editing={null} creating={false} link="" notice="" busy={false} {...handlers}
    />);
    const text = visible(html);
    for (const label of ['Débito automático', 'Conciliar', 'Al día', 'Esperando el primer pago', 'Sin ficha', 'Copiar enlace', 'Crear plan', 'Activar débito automático', '1 activa']) expect(text).toContain(label);
    expect(text).not.toMatch(/\b(link|email|online|pending|whatsapp|copy|chat)\b/i);
    expect(html).not.toContain('Enviar por el chat');
    expect(html).not.toContain('Ver ficha');
    expect(html).not.toContain('wa.me');
  });

  it('no trata como al día un pago rechazado', () => {
    const html = renderToStaticMarkup(<PanelDebitView
      plans={[plan]} subscriptions={[sub({ payment_state: 'rejected', contact_name: 'Brenda Acosta' })]}
      summary={{ active: 0, pending: 0, problems: 1, unlinked: 0 }} patients={[]}
      mercadoPago filter="al_dia" sheet="no" editing={null} creating={false} link="" notice="" busy={false} {...handlers}
    />);
    expect(html).toContain('No hay débitos en este filtro.');
    expect(html).not.toContain('Brenda Acosta');
  });

  it('pide el correo de Mercado Pago y no activa el débito sin conexión', () => {
    const ready = renderToStaticMarkup(<PanelDebitView
      plans={[plan]} subscriptions={[]} summary={{ active: 0, pending: 0, problems: 0, unlinked: 0 }} patients={[{ id: 'camila', name: 'Camila Torres' }]}
      mercadoPago filter="todas" sheet="activar" editing={null} creating={false} link="" notice="" busy={false} {...handlers}
    />);
    expect(ready).toContain('Correo de la cuenta de Mercado Pago');
    expect(ready).toContain('Generar enlace');
    const blocked = renderToStaticMarkup(<PanelDebitView
      plans={[plan]} subscriptions={[]} summary={{ active: 0, pending: 0, problems: 0, unlinked: 0 }} patients={[]}
      mercadoPago={false} filter="todas" sheet="no" editing={null} creating={false} link="" notice="" busy={false} {...handlers}
    />);
    expect(blocked).toContain('Conectá Mercado Pago');
    expect(blocked).toContain('disabled');
  });
});
