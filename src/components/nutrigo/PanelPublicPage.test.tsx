import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { schedulingDefaultSettings } from '../../types/scheduling';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { PanelPublicPageView } from './PanelPublicPage';

const plan: SubscriptionPlan = {
  id: 'plan-1', name: 'Seguimiento mensual', description: 'Dos consultas', amount_cents: 5_400_000, currency: 'ARS',
  frequency: 1, frequency_type: 'months', public_visible: true, status: 'active', revision: 1,
};

describe('Página pública del boceto', () => {
  it('edita el perfil, muestra la vista previa y deja las conexiones en Conectar', () => {
    const html = renderToStaticMarkup(<PanelPublicPageView config={schedulingDefaultSettings()} published={false} pageUrl="" connections={{ google: false, mercadopago: false }} status="" busy={false} loading={false} error="" onChange={vi.fn()} onPublish={vi.fn()} onToggleEnabled={vi.fn()} onConnect={vi.fn()} onRetry={vi.fn()} />);
    for (const label of ['Página pública', 'Presentación', 'Dirección del link', 'Así la ve la paciente', 'Reservar turno', 'Mercado Pago', 'Google Calendar', 'Conectar', '24 horas']) expect(html).toContain(label);
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Planes de seguimiento');
    expect(html).toContain('Consulta suelta');
    expect(html).toContain('Todavía no está publicada.');
    expect(html).not.toContain('Conectado');
    expect(html).not.toContain('>Publicar<');
  });

  it('muestra el plan mensual junto a la consulta suelta y bloquea la página sin Mercado Pago', () => {
    const shown = renderToStaticMarkup(<PanelPublicPageView config={schedulingDefaultSettings()} published pageUrl="https://plan.v/consultorio/veronica" connections={{ google: false, mercadopago: true }} status="" busy={false} loading={false} error="" onChange={vi.fn()} onPublish={vi.fn()} onToggleEnabled={vi.fn()} onConnect={vi.fn()} onRetry={vi.fn()} plans={[plan]} onTogglePlan={vi.fn()} onEditPlan={vi.fn()} />);
    expect(shown).toContain('Planes de seguimiento');
    expect(shown).toContain('Seguimiento mensual');
    expect(shown).toContain('Consulta suelta');
    expect(shown).toContain('Suscribirme');
    const blocked = renderToStaticMarkup(<PanelPublicPageView config={schedulingDefaultSettings()} published={false} pageUrl="" connections={{ google: false, mercadopago: false }} status="" busy={false} loading={false} error="" onChange={vi.fn()} onPublish={vi.fn()} onToggleEnabled={vi.fn()} onConnect={vi.fn()} onRetry={vi.fn()} plans={[plan]} onTogglePlan={vi.fn()} onEditPlan={vi.fn()} />);
    expect(blocked).toContain('Conectá Mercado Pago para cobrar con débito automático');
    expect(blocked).toContain('disabled');
  });
});
