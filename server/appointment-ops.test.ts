import { describe, expect, it } from 'vitest';
import { historyEntry, occurrenceFromWhen, resolveAppointmentState, stampStartsAt } from './appointment-ops.js';

const now = new Date(2026, 8, 16, 10, 0, 0);

describe('appointment history ops', () => {
  it('derives the next published occurrence without inventing past visits', () => {
    const at = occurrenceFromWhen('Jueves · 14:30', now);
    expect(at?.getFullYear()).toBe(2026);
    expect(at?.getMonth()).toBe(8);
    expect(at?.getDate()).toBe(17);
    expect(occurrenceFromWhen('Feriado · 29:99', now)).toBeNull();
  });

  it('stamps starts_at once and archives an elapsed occurrence', () => {
    const stamped = stampStartsAt({ when: 'Jueves · 14:30', duration: 45, channel: 'video' }, now);
    expect(stamped.starts_at).toBeDefined();
    const start = new Date(2026, 8, 17, 14, 30, 0);
    const elapsedNow = new Date(2026, 8, 17, 16, 0, 0);
    const resolved = resolveAppointmentState({
      id: 'ana',
      appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', starts_at: start.toISOString() },
    }, elapsedNow, () => 'ah-1');
    expect(resolved.changed).toBe(true);
    expect(resolved.appointment_history[0]).toMatchObject({ action: 'elapsed', actor: 'system', when: 'Jueves · 14:30', dateId: '2026-09-17' });
    expect(resolved.appointment?.starts_at).not.toBe(start.toISOString());
  });

  it('does not duplicate an elapsed row already recorded', () => {
    const start = new Date(2026, 8, 17, 14, 30, 0);
    const entry = historyEntry({
      id: 'ah-1',
      slot: { when: 'Jueves · 14:30', duration: 45, channel: 'video', starts_at: start.toISOString() },
      action: 'elapsed',
      actor: 'system',
      at: new Date(2026, 8, 17, 15, 15, 0).toISOString(),
      now,
    });
    const resolved = resolveAppointmentState({
      id: 'ana',
      appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video', starts_at: start.toISOString() },
      appointment_history: [entry],
    }, new Date(2026, 8, 18, 10, 0, 0), () => 'ah-2');
    expect(resolved.appointment_history.filter((item) => item.action === 'elapsed')).toHaveLength(1);
  });
});
