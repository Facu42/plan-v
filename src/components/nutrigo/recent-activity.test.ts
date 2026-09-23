import { describe, expect, it } from 'vitest';
import { buildRecentActivity } from './recent-activity';

const now = new Date('2026-09-23T15:00:00');
const patient = {
  name: 'Ana',
  logs: [{ id: 'l1', slot: 'Almuerzo', description: 'Ensalada', logged_at: '2026-09-23T13:00:00' }],
  activities: [],
  messages: [{ id: 'm1', from: 'patient', sent_at: '2026-09-23T12:00:00' }],
} as unknown as Parameters<typeof buildRecentActivity>[0];

describe('actividad reciente', () => {
  it('le habla al paciente en segunda persona', () => {
    expect(buildRecentActivity(patient, now).map((item) => item.text)).toEqual(['Registraste almuerzo: Ensalada', 'Le escribiste a Verónica']);
  });

  it('se la cuenta al nutricionista en tercera persona', () => {
    expect(buildRecentActivity(patient, now, 'professional').map((item) => item.text)).toEqual(['Registró almuerzo: Ensalada', 'Te escribió']);
  });
});
