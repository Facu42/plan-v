import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CrmWorkItem } from '../../types/crm-work';
import { MessageNotices } from './MessageNotices';
import { groupUnreadMessages, relativeTimeLabel } from './message-notices';
import { buildConsultAlerts, dismissAllConsultAlerts, visibleConsultAlerts } from './consult-alerts';

const item = (id: string, patientId: string, patientName: string, at: string): CrmWorkItem => ({
  id: `message:${id}`, kind: 'message', patient_id: patientId, patient_name: patientName, status: 'unread', updated_at: at,
  href: `/crm/mensajes?paciente=${patientId}`, title: 'Mensaje sin leer',
});
const NOW = new Date('2026-10-10T15:00:00.000Z');

describe('Mensajes sin leer de la campana', () => {
  it('agrupa por paciente, cuenta y ordena por el mensaje más reciente', () => {
    const groups = groupUnreadMessages([
      item('1', 'p-ana', 'Ana Ruiz', '2026-10-10T10:00:00.000Z'),
      item('2', 'p-leo', 'Leo Paz', '2026-10-10T14:30:00.000Z'),
      item('3', 'p-ana', 'Ana Ruiz', '2026-10-10T14:00:00.000Z'),
    ]);
    expect(groups.map(group => [group.patientName, group.count])).toEqual([['Leo Paz', 1], ['Ana Ruiz', 2]]);
    expect(groups[1].latestAt).toBe('2026-10-10T14:00:00.000Z');
    expect(groups[0].href).toBe('/crm/mensajes?paciente=p-leo');
  });

  it('ignora lo que no es un mensaje sin leer y no devuelve texto de los mensajes', () => {
    const groups = groupUnreadMessages([
      { ...item('1', 'p-ana', 'Ana Ruiz', '2026-10-10T10:00:00.000Z'), kind: 'meal' as const },
      item('2', 'p-ana', 'Ana Ruiz', '2026-10-10T10:00:00.000Z'),
    ]);
    expect(groups).toHaveLength(1);
    expect(Object.keys(groups[0]).sort()).toEqual(['count', 'href', 'latestAt', 'patientId', 'patientName']);
  });

  it('expresa el tiempo transcurrido en español', () => {
    expect(relativeTimeLabel('2026-10-10T14:59:30.000Z', NOW)).toBe('ahora');
    expect(relativeTimeLabel('2026-10-10T14:30:00.000Z', NOW)).toBe('hace 30 min');
    expect(relativeTimeLabel('2026-10-10T12:00:00.000Z', NOW)).toBe('hace 3 h');
    expect(relativeTimeLabel('2026-10-08T15:00:00.000Z', NOW)).toBe('hace 2 días');
    expect(relativeTimeLabel('basura', NOW)).toBe('');
  });

  it('muestra «Sin mensajes nuevos» y el acceso a todos los mensajes cuando no hay pendientes', () => {
    const html = renderToStaticMarkup(<MessageNotices state={{ status: 'ready', groups: [], total: 0 }} now={NOW} onOpen={vi.fn()} onViewAll={vi.fn()} />);
    expect(html).toContain('Mensajes');
    expect(html).toContain('Sin mensajes nuevos');
    expect(html).toContain('Ver todos los mensajes');
  });

  it('lista las conversaciones con su cantidad y avisa cuando hay más de los que se muestran', () => {
    const groups = groupUnreadMessages([item('1', 'p-ana', 'Ana Ruiz', '2026-10-10T14:00:00.000Z'), item('2', 'p-ana', 'Ana Ruiz', '2026-10-10T14:10:00.000Z')]);
    const html = renderToStaticMarkup(<MessageNotices state={{ status: 'ready', groups, total: 120 }} now={NOW} onOpen={vi.fn()} onViewAll={vi.fn()} />);
    expect(html).toContain('Ana Ruiz');
    expect(html).toContain('2 mensajes sin leer');
    expect(html).toContain('hace 50 min');
    expect(html).toContain('120 mensajes sin leer en total');
  });

  it('distingue la carga y el error, y el error no afirma que no haya mensajes', () => {
    const loading = renderToStaticMarkup(<MessageNotices state={{ status: 'loading', groups: [], total: 0 }} now={NOW} onOpen={vi.fn()} onViewAll={vi.fn()} />);
    expect(loading).toContain('Buscando mensajes…');
    expect(loading).not.toContain('Sin mensajes nuevos');
    const failed = renderToStaticMarkup(<MessageNotices state={{ status: 'error', groups: [], total: 0 }} now={NOW} onOpen={vi.fn()} onViewAll={vi.fn()} onRetry={vi.fn()} />);
    expect(failed).toContain('No pudimos cargar tus mensajes');
    expect(failed).toContain('Reintentar');
    expect(failed).not.toContain('Sin mensajes nuevos');
  });
});

describe('Marcar avisos de consulta como listos (propuesta propia)', () => {
  it('retira todos los avisos visibles de una vez sin tocar mensajes', () => {
    const base = new Date(2026, 8, 16, 10, 0, 0);
    const alerts = buildConsultAlerts([
      { id: 'ana', name: 'Ana Ruiz', appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', meet_url: undefined } },
      { id: 'leo', name: 'Leo Paz', appointment: { when: 'Viernes · 11:00', duration: 30, channel: 'presencial', meet_url: undefined } },
    ], base);
    const store = new Map<string, string>();
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) };
    expect(visibleConsultAlerts(alerts, 'pro', storage).length).toBe(alerts.length);
    dismissAllConsultAlerts(storage, 'pro', alerts);
    expect(visibleConsultAlerts(alerts, 'pro', storage)).toEqual([]);
    expect(visibleConsultAlerts(alerts, 'patient', storage).length).toBe(alerts.length);
  });
});
