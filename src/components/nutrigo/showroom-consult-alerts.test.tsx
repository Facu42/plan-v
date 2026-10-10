import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildConsultAlerts } from './consult-alerts';
import { ConsultAlertStrip, ShowroomConsultAlerts } from './ShowroomConsultAlerts';

const alerts = buildConsultAlerts([
  { id: 'ana', name: 'Ana Ruiz', appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: 'https://meet.example.com/ana' } },
], new Date(2026, 8, 16, 10, 0, 0));

describe('Campana de avisos de consulta', () => {
  it('muestra el aviso de la paciente y aclara el alcance de teléfono y mail', () => {
    const html = renderToStaticMarkup(<ShowroomConsultAlerts audience="patient" alerts={alerts} onOpen={vi.fn()} defaultOpen storage={null} />);
    expect(html).toContain('Avisos, 1 pendientes');
    expect(html).toContain('Consulta con Verónica');
    expect(html).toContain('Mañana · 14:30');
    expect(html).toContain('buzón demo');
    expect(html).toContain('Avisos en este dispositivo');
    expect(html).toContain('Push (sin proveedor, no se envía)');
    expect(html).toContain('no salen a internet');
    expect(html).toContain('href="https://meet.example.com/ana"');
  });

  it('lista las consultas del consultorio al abrir el panel en markup estático', () => {
    const html = renderToStaticMarkup(<ConsultAlertStrip audience="pro" alerts={alerts} onOpen={vi.fn()} storage={null} />);
    expect(html).toContain('consulta con Ana Ruiz');
    expect(html).toContain('Mañana · 14:30');
    expect(html).toContain('Videollamada');
    expect(html).toContain('Ver agenda');
  });
});

describe('Novedades del consultorio en la campana', () => {
  const notices = [
    { id: 'messages:ana:1', kind: 'messages' as const, patientId: 'ana', title: 'Ana Ruiz te escribió', detail: '1 mensaje sin leer', page: 'mensajes' as const },
    { id: 'payment:luz:1', kind: 'payment' as const, patientId: 'luz', title: 'Luz Paz avisó un pago', detail: 'Falta confirmarlo', page: 'cobranzas' as const },
  ];
  const store = (read: string[] = []) => ({ getItem: (key: string) => (read.some(id => key.endsWith(id)) ? '1' : null), setItem: vi.fn() });

  it('cuenta las novedades sin leer y ofrece marcarlas como leídas', () => {
    const html = renderToStaticMarkup(<ShowroomConsultAlerts audience="pro" alerts={[]} proNotices={notices} onOpen={vi.fn()} onOpenProNotice={vi.fn()} defaultOpen storage={store()} />);
    expect(html).toContain('Avisos del consultorio, 2 pendientes');
    expect(html).toContain('Ana Ruiz te escribió');
    expect(html).toContain('Marcar como leída');
    expect(html).toContain('Marcar todas como leídas');
  });

  it('esconde las ya leídas y baja el número de la campana', () => {
    const html = renderToStaticMarkup(<ShowroomConsultAlerts audience="pro" alerts={[]} proNotices={notices} onOpen={vi.fn()} defaultOpen storage={store(['messages:ana:1'])} />);
    expect(html).toContain('Avisos del consultorio, 1 pendientes');
    expect(html).not.toContain('Ana Ruiz te escribió');
    expect(html).toContain('Luz Paz avisó un pago');
    expect(html).not.toContain('Marcar todas como leídas');
  });

  it('la paciente no ve novedades del consultorio', () => {
    const html = renderToStaticMarkup(<ShowroomConsultAlerts audience="patient" alerts={[]} proNotices={notices} onOpen={vi.fn()} defaultOpen storage={store()} />);
    expect(html).not.toContain('Novedades del consultorio');
  });
});
