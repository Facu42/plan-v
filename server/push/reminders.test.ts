import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetPushReminderTick, tickPushReminders } from './reminders.js';
import { PUSH_TEXTS } from './push.js';

describe('aviso al teléfono el día antes de la consulta', () => {
  beforeEach(() => resetPushReminderTick());

  it('avisa una vez por paciente con consulta dentro de 24 horas y corre una sola vez por tramo', async () => {
    const list = vi.fn(async () => ['p1', 'p2']);
    const notify = vi.fn(async (id: string) => (id === 'p1' ? 2 : 0));
    expect(await tickPushReminders(new Date('2026-10-10T13:31:00Z'), { list, notify })).toEqual({ patients: 2, delivered: 2 });
    expect(list).toHaveBeenCalledExactlyOnceWith('2026-10-11T13:30:00.000Z', '2026-10-11T13:40:00.000Z');
    expect(notify.mock.calls.map(([id]) => id)).toEqual(['p1', 'p2']);
    expect(await tickPushReminders(new Date('2026-10-10T13:39:59Z'), { list, notify })).toBeNull();
    expect(list).toHaveBeenCalledTimes(1);
    expect(await tickPushReminders(new Date('2026-10-10T13:40:00Z'), { list, notify })).toEqual({ patients: 2, delivered: 2 });
  });

  it('sin claves de avisos o en la demo no hace nada', async () => {
    expect(await tickPushReminders(new Date('2026-10-10T13:31:00Z'), null)).toBeNull();
  });

  it('si un teléfono falla sigue con las demás, y si la base falla no rompe el reloj', async () => {
    const notify = vi.fn().mockRejectedValueOnce(new Error('caído')).mockResolvedValue(1);
    expect(await tickPushReminders(new Date('2026-10-10T13:31:00Z'), { list: async () => ['p1', 'p2'], notify })).toEqual({ patients: 2, delivered: 1 });
    expect(await tickPushReminders(new Date('2026-10-10T13:41:00Z'), { list: async () => { throw new Error('base'); }, notify })).toBeNull();
  });

  it('el texto no dice la hora, el lugar ni el nombre de la nutri', () => {
    expect(PUSH_TEXTS.reminder).toEqual({ title: 'Mañana tenés consulta', body: 'Mirá el horario en Nutridash.', url: '/app/agenda', tag: 'plan-v-reminder' });
  });
});
