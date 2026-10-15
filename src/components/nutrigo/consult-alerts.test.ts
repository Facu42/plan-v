import { describe, expect, it } from 'vitest';
import {
  buildConsultAlerts,
  consultAlertBadgeCount,
  consultAlertUrgency,
  dismissConsultAlert,
  visibleConsultAlerts,
} from './consult-alerts';

const ana = {
  id: 'ana',
  name: 'Ana Ruiz',
  appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' as const, meet_url: 'https://meet.example.com/ana' },
};

describe('Avisos de próximas consultas', () => {
  it('marca mañana, hoy y en breve según la fecha derivada', () => {
    expect(buildConsultAlerts([ana], new Date(2026, 8, 16, 10, 0, 0))[0]).toMatchObject({ urgency: 'tomorrow', whenLabel: 'Mañana · 14:30', dateId: '2026-09-17' });
    expect(buildConsultAlerts([ana], new Date(2026, 8, 17, 10, 0, 0))[0]).toMatchObject({ urgency: 'today', whenLabel: 'Hoy · 14:30' });
    expect(buildConsultAlerts([ana], new Date(2026, 8, 17, 13, 0, 0))[0].urgency).toBe('soon');
    expect(buildConsultAlerts([
      { id: 'bea', name: 'Beatriz', appointment: { when: 'Martes · 11:00', duration: 30, channel: 'presencial' } },
    ], new Date(2026, 8, 15, 8, 0, 0))[0].urgency).toBe('today');
    expect(consultAlertUrgency(new Date(2026, 8, 18, 11, 0, 0), new Date(2026, 8, 16, 10, 0, 0))).toBe('week');
  });

  it('arma avisos de todo el consultorio y omite turnos inválidos', () => {
    const alerts = buildConsultAlerts([
      ana,
      { id: 'bea', name: 'Beatriz Paz', appointment: { when: 'Martes · 11:00', duration: 30, channel: 'presencial' } },
      { id: 'carla', name: 'Carla Sol', appointment: null },
      { id: 'dora', name: 'Dora', appointment: { when: 'Feriado · 29:99', duration: 30, channel: 'video' } },
    ], new Date(2026, 8, 16, 10, 0, 0));
    expect(alerts.map((alert) => [alert.patientId, alert.dateId, alert.urgency, alert.channelLabel])).toEqual([
      ['ana', '2026-09-17', 'tomorrow', 'Videollamada'],
      ['bea', '2026-09-22', 'week', 'Presencial'],
    ]);
  });

  it('permite ocultar un aviso en el dispositivo sin inventar push', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (key: string) => store[key] ?? null, setItem: (key: string, value: string) => { store[key] = value; } };
    const alerts = buildConsultAlerts([ana], new Date(2026, 8, 16, 10, 0, 0));
    expect(consultAlertBadgeCount(alerts, 'patient', storage)).toBe(1);
    dismissConsultAlert(storage, 'patient', alerts[0].id);
    expect(visibleConsultAlerts(alerts, 'patient', storage)).toHaveLength(0);
    expect(consultAlertBadgeCount(alerts, 'pro', storage)).toBe(1);
  });
});
