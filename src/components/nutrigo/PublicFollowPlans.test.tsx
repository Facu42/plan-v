import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { SubscriptionPlan } from '../../types/subscriptions';
import { PublicFollowPlansView, PublicSubscriptionReturn, rememberSubscription, rememberedSubscription } from './PublicFollowPlans';

const plan: SubscriptionPlan = {
  id: 'plan-1', name: 'Seguimiento mensual', description: 'Dos consultas por videollamada', amount_cents: 5_400_000, currency: 'ARS',
  frequency: 1, frequency_type: 'months', public_visible: true, status: 'active', revision: 1,
};

describe('página donde la paciente elige el plan', () => {
  it('ofrece el plan mensual y la consulta suelta sigue aparte', () => {
    const html = renderToStaticMarkup(<PublicFollowPlansView plans={[plan]} busy={false} notice="" onSubmit={vi.fn()} />);
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const label of ['Planes de seguimiento', 'Suscribirme', 'Seguimiento mensual', 'Correo de tu cuenta de Mercado Pago', 'Usá el mismo correo', 'Ir a Mercado Pago', 'consulta suelta']) expect(text).toContain(label);
    expect(text).not.toMatch(/\b(link|email|whatsapp|pending|online)\b/i);
    expect(html).not.toContain('wa.me');
  });

  it('no muestra planes si la bandera o la visibilidad los dejan vacíos', () => {
    expect(renderToStaticMarkup(<PublicFollowPlansView plans={[]} busy={false} notice="" onSubmit={vi.fn()} />)).toBe('');
  });

  it('guarda el comprobante de la vuelta en esta pantalla', () => {
    const memory = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    });
    rememberSubscription('veronica', '11111111-1111-4111-8111-111111111111', 'invitada');
    expect(rememberedSubscription('veronica', '11111111-1111-4111-8111-111111111111')).toBe('invitada');
    vi.unstubAllGlobals();
  });

  it('arranca esperando la confirmación de Mercado Pago', () => {
    const html = renderToStaticMarkup(<PublicSubscriptionReturn slug="veronica" id="11111111-1111-4111-8111-111111111111" />);
    expect(html).toContain('Estamos esperando la confirmación de Mercado Pago.');
    expect(html).toContain('Volver al consultorio');
  });
});
