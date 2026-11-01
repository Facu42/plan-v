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
  connections: { google: false, mercadopago: false }, status: '', busy: false, loading: false, error: '', focus: null, patients: [],
  onView: noop, onShift: noop, onToday: noop, onManage: noop, onCopy: noop, onConnect: noop, onConfirm: noop, onCancel: noop, onReschedule: noop, onBlock: noop, onRetry: noop,
};

describe('Agenda del boceto', () => {
  it('muestra los pedidos de turno, los lugares libres y el aviso de semana vacía', () => {
    const html = renderToStaticMarkup(<PanelAgendaView {...base} />);
    for (const label of ['Agenda', 'Pedidos de turno', 'Agustina Díaz con un nombre largo de verdad · primera vez', 'Pide viernes 23, 14:30', 'Aceptar', 'Proponer otro', 'Lugares libres', 'Bloquear horario', 'Nuevo turno', 'Octubre 2026']) expect(html).toContain(label);
    expect(html).not.toContain('WhatsApp');
    expect(html).toContain('Todavía no hay turnos esta semana.');
    expect(html).toContain('Cargá tus horarios y tipos de consulta');
  });

  it('dibuja los turnos con los colores del boceto y deja en negro solo el próximo', () => {
    const events = [
      { id: 'a', tone: 'seguimiento' as const, title: 'Ana López', subtitle: 'Seguimiento', day: '2026-10-21', startMin: 8 * 60 + 30, endMin: 9 * 60 + 15 },
      { id: 'b', tone: 'online' as const, title: 'Julia Sosa', subtitle: 'Videollamada', day: '2026-10-21', startMin: 14 * 60 + 30, endMin: 15 * 60 + 15 },
      { id: 'c', tone: 'primera' as const, title: 'Valeria Núñez', subtitle: 'Primera', day: '2026-10-21', startMin: 16 * 60, endMin: 17 * 60 },
    ];
    const html = renderToStaticMarkup(<PanelAgendaView {...base} events={events} />);
    expect(html).toContain('ev d');
    expect(html).toContain('ev n');
    expect(html).toContain('Próxima · videollamada');
    expect(html).toContain('ev f');
    expect(html).not.toContain('Todavía no hay turnos');
    expect(html).not.toContain('Entrar a la videollamada');
  });

  it('abre Meet en otra pestaña desde 10 minutos antes hasta el final', () => {
    const event = { id: 'b', tone: 'online' as const, title: 'Julia Sosa', subtitle: 'Videollamada', day: '2026-10-21', startMin: 14 * 60 + 30, endMin: 15 * 60 + 15, patientId: 'julia', meetUrl: 'https://meet.example/julia' };
    const dentro = renderToStaticMarkup(<PanelAgendaView {...base} now={new Date('2026-10-21T14:25:00-03:00')} events={[event]} />);
    expect(dentro).toContain('Entrar a la videollamada');
    expect(dentro).toContain('href="https://meet.example/julia"');
    expect(dentro).toContain('target="_blank"');
    expect(dentro).toContain('rel="noopener noreferrer"');
    const temprano = renderToStaticMarkup(<PanelAgendaView {...base} now={new Date('2026-10-21T14:19:00-03:00')} events={[event]} />);
    expect(temprano).not.toContain('Entrar a la videollamada');
    const sinMeet = renderToStaticMarkup(<PanelAgendaView {...base} now={new Date('2026-10-21T14:25:00-03:00')} events={[{ ...event, meetUrl: undefined }]} />);
    expect(sinMeet).not.toContain('Entrar a la videollamada');
  });

  it('muestra el recordatorio de turno como el boceto, activo o apagado, y no lo inventa mientras carga', () => {
    expect(renderToStaticMarkup(<PanelAgendaView {...base} recordatorio />)).toContain('activo · en la app y por mail 24 h antes');
    expect(renderToStaticMarkup(<PanelAgendaView {...base} recordatorio={false} />)).toContain('apagado · no se avisa antes del turno');
    expect(renderToStaticMarkup(<PanelAgendaView {...base} />)).not.toContain('Recordatorio de turno');
  });

  it('dice Conectado solo cuando el servidor ya lo confirmó', () => {
    const sin = renderToStaticMarkup(<PanelAgendaView {...base} focus="conexiones" />);
    expect(sin).not.toContain('Conectado');
    expect(sin).toContain('Conectar');
    const con = renderToStaticMarkup(<PanelAgendaView {...base} focus="conexiones" connections={{ google: true, mercadopago: false }} onDisconnect={noop} />);
    expect(con).toContain('Conectado');
    expect(con).toContain('Desconectar');
    expect(con.match(/>Conectar</g)?.length).toBe(1);
    expect(CONNECTION_MISSING).toMatch(/No hay una conexión activa/);
  });

  it('deja revisar una transferencia y conciliar un turno confirmado', () => {
    const html = renderToStaticMarkup(<PanelAgendaView {...base} focus="pagos" pending={[]} bookings={[{ ...booking, status: 'confirmed' }]} transfers={[{ id: 't1', amount_minor: 1500000, reference: 'MP-1' }]} moreBookings />);
    for (const label of ['Confirmar transferencia recibida', 'Rechazar', 'Conciliar Mercado Pago', 'Sincronizar calendario', 'Ver más reservas', 'No hay pedidos de turno.']) expect(html).toContain(label);
  });

  it('muestra los lugares libres sin pasarse del tope', () => {
    const libres = Array.from({ length: 15 }, (_, index) => ({ day: '2026-10-22', startMin: 600 + index * 30, dia: 'Jue 22', hora: `${10 + Math.floor(index / 2)}:${index % 2 ? '30' : '00'}` }));
    const html = renderToStaticMarkup(<PanelAgendaView {...base} libres={libres} />);
    expect(html.match(/<small>Jue 22<\/small>/g)?.length).toBe(8);
    expect(html).toContain('+7 más');
  });
});
