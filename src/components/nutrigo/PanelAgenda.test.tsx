import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import { PanelAgendaView } from './PanelAgenda';
import { CONNECTION_MISSING } from './use-panel-scheduling';

const booking = { id: 'b1', contact_name: 'Agustina Díaz con un nombre largo de verdad', starts_at: '2026-10-23T14:30:00-03:00', duration_min: 60, status: 'requested', paid_minor: 0, revision: 1, patient_id: null, type_id: 't', nutritionist_id: 'n', calendar_id: 'c', total_minor: 100, deposit_minor: 0, currency: 'ARS', appointment_id: null, contact_email: 'a@example.com', contact_phone: '1', google_sync_status: 'not_connected', meet_url: null, created_at: '2026-10-21T12:00:00Z' } as SchedulingBooking;
const noop = vi.fn();
const base = {
  title: 'Agenda', subtitle: 'Semana del 19 al 24 de octubre', view: 'semana' as const, days: ['2026-10-21'], today: '2026-10-21', now: new Date('2026-10-21T13:10:00-03:00'),
  events: [], pending: [booking], types: [] as SchedulingSettings['types'], page: { slug: 'consultorio', enabled: false, title: 'Consultorio', bio: '', location: '', contact: '', logo_url: '' },
  connections: { google: false, mercadopago: false, whatsapp: false }, status: '', busy: false, loading: false, error: '', focus: null, patients: [],
  onView: noop, onShift: noop, onToday: noop, onManage: noop, onCopy: noop, onConnect: noop, onConfirm: noop, onCancel: noop, onReschedule: noop, onBlock: noop, onRetry: noop,
};

describe('Agenda del boceto', () => {
  it('muestra la semana, las reservas y Conectar sin fingir que hay claves', () => {
    const html = renderToStaticMarkup(<PanelAgendaView {...base} />);
    for (const label of ['Agenda', 'Por confirmar', 'Agustina Díaz con un nombre largo de verdad', 'Mercado Pago', 'Google Calendar', 'WhatsApp', 'Conectar', 'Bloquear horario', 'Nueva consulta']) expect(html).toContain(label);
    expect(html).not.toContain('Conectado');
    expect(html).toContain('Todavía no hay turnos esta semana.');
    expect(CONNECTION_MISSING).toMatch(/No hay una conexión activa/);
  });

  it('dice Conectado solo cuando el servidor ya lo confirmó', () => {
    const html = renderToStaticMarkup(<PanelAgendaView {...base} connections={{ google: true, mercadopago: false, whatsapp: false }} />);
    expect(html).toContain('Conectado');
    expect(html.match(/Conectar/g)?.length).toBe(2);
  });
});
