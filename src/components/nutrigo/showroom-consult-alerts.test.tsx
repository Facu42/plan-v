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
