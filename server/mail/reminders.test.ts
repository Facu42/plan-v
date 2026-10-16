import { describe, expect, it, vi } from 'vitest';
import { reminderWindow, sendDueReminders, type DueAppointment } from './reminders.js';
import { stableUuid } from './brevo.js';

const due = (extra: Partial<DueAppointment> = {}): DueAppointment => ({ id: 'turno-1', starts_at: '2026-10-11T13:30:00Z', channel: 'video', meet_url: 'https://meet.test/a', patient_name: 'Ana', patient_email: 'ana@example.com', nutritionist_name: 'Verónica', ...extra });

describe('recordatorios de turnos', () => {
  it('cada tramo de 10 minutos busca los turnos que empiezan 24 horas después', () => {
    expect(reminderWindow(new Date('2026-10-10T13:34:59Z'))).toEqual({ from: '2026-10-11T13:30:00.000Z', to: '2026-10-11T13:40:00.000Z' });
  });

  it('manda uno por turno con una llave fija para ese turno y horario, y sigue si uno falla', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('Brevo 500')).mockResolvedValue({ status: 'sent' });
    const result = await sendDueReminders([due({ id: 'falla' }), due(), due({ id: 'sin-mail', patient_email: null })], 'https://plan-v.test', send);
    expect(result).toEqual({ sent: 1, failed: 1, skipped: 1 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toMatchObject({ to: { email: 'ana@example.com', name: 'Ana' }, idempotencyKey: stableUuid('reminder:turno-1:2026-10-11T13:30:00Z') });
  });
  it('vuelve a verificar preferencia y consentimiento antes de enviar y falla cerrado',async()=>{
    const send=vi.fn();
    const permitted=vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('unavailable'));
    expect(await sendDueReminders([due(),due({id:'second'})],'https://plan-v.test',send,permitted)).toEqual({sent:0,failed:1,skipped:1});
    expect(send).not.toHaveBeenCalled();
  });
});

describe('reloj de recordatorios', () => {
  it('corre una sola vez por tramo y no hace nada sin Brevo', async () => {
    const { tickAppointmentReminders, resetReminderTick } = await import('./reminder-worker.js');
    resetReminderTick();
    const list = vi.fn(async () => [due()]);
    const send = vi.fn(async () => ({ status: 'sent' }));
    const deps = { list, send, site: 'https://plan-v.test' };
    expect(await tickAppointmentReminders(new Date('2026-10-10T13:31:00Z'), deps)).toEqual({ sent: 1, failed: 0, skipped: 0 });
    expect(await tickAppointmentReminders(new Date('2026-10-10T13:39:00Z'), deps)).toBeNull();
    expect(list).toHaveBeenCalledExactlyOnceWith('2026-10-11T13:30:00.000Z', '2026-10-11T13:40:00.000Z');
    expect(await tickAppointmentReminders(new Date('2026-10-10T13:41:00Z'), null)).toBeNull();
  });
});
