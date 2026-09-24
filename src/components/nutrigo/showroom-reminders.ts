import type { ShowroomPatient } from './showroom-model';
import { buildDailyReminders, type DailyReminder } from '../patient/daily-reminders';

export function buildShowroomReminders(patient: ShowroomPatient, now: Date): DailyReminder[] {
  return buildDailyReminders({
    todayPlan: patient.todayPlan,
    meal_logs: patient.logs.map((log) => ({
      id: log.id,
      patient_id: patient.id,
      slot: log.slot,
      photo_url: null,
      description: log.description,
      foods: [],
      macros: log.macros,
      confidence: 1,
      note_for_nutri: '',
      status: log.status,
      logged_at: log.logged_at,
    })),
    hydration: patient.hydration,
    sleep_minutes: patient.sleepMinutes,
    appointment: patient.appointment,
  }, now);
}

export function openShowroomReminders(reminders: readonly DailyReminder[]): DailyReminder[] {
  return reminders.filter((reminder) => reminder.state !== 'done');
}

export function reminderPage(kind: DailyReminder['kind']): 'diario' | 'progreso' | 'agenda' {
  if (kind === 'comida') return 'diario';
  if (kind === 'consulta') return 'agenda';
  return 'progreso';
}
