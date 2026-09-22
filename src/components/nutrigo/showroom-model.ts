import type { Patient } from '../../types';
import { buildJourneySummary } from '../patient/journey-summary';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function filterShowroomPatients(patients: readonly Patient[], query = '') {
  return patients.filter((p) => !p.archived_at && normalize(`${p.name} ${p.goal}`).includes(normalize(query)));
}

// Explicit allowlist: the preview must not display professional notes in patient mode.
export function buildShowroomPatient(patient: Patient, now = new Date()) {
  const meals = patient.meal_logs.filter((log) => log.patient_id === patient.id);
  const habits = patient.habit_logs.filter((log) => log.patient_id === patient.id);
  const journey = buildJourneySummary({ meal_logs: meals, habit_logs: habits }, now);
  const todayIds = new Set(journey.days[journey.days.length - 1]?.mealLogIds ?? []);
  const nutritionLogs = meals.filter((log) => todayIds.has(log.id) && log.status !== 'pending_review' && log.macros != null);
  const macros = nutritionLogs.reduce((sum, log) => ({
    kcal: sum.kcal + (log.macros?.kcal ?? 0),
    protein_g: sum.protein_g + (log.macros?.protein_g ?? 0),
    carbs_g: sum.carbs_g + (log.macros?.carbs_g ?? 0),
    fat_g: sum.fat_g + (log.macros?.fat_g ?? 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  return {
    id: patient.id, name: patient.name, initials: patient.initials,
    goal: patient.goal, goalProgress: patient.goal_progress ?? 0,
    hydration: patient.hydration, energy: patient.energy ?? 'Sin registro',
    sleep: patient.sleep_minutes === null ? 'Sin registro' : `${Math.round(patient.sleep_minutes / 6) / 10} h`,
    sleepMinutes: patient.sleep_minutes,
    adherence: patient.adherence_score, macros, kcal: macros.kcal, nutritionLogCount: nutritionLogs.length, journey,
    appointment: patient.appointment ? {
      when: patient.appointment.when,
      duration: patient.appointment.duration,
      channel: patient.appointment.channel,
      meet_url: patient.appointment.meet_url,
      ...(patient.appointment.timezone ? { timezone: patient.appointment.timezone } : {}),
      ...(patient.appointment.patient_reply ? { patient_reply: patient.appointment.patient_reply } : {}),
      ...(patient.appointment.confirmed_at ? { confirmed_at: patient.appointment.confirmed_at } : {}),
    } : null,
    appointmentHistory: (patient.appointment_history ?? []).map(({ id, when, dateId, duration, channel, action, actor, at }) => ({ id, when, dateId, duration, channel, action, actor, at })),
    activities: (patient.activity_logs ?? []).filter((entry) => entry.patient_id === patient.id)
      .map(({ id, patient_id, activity, duration_minutes, intensity, note, logged_at }) => ({ id, patient_id, activity, duration_minutes, intensity, note, logged_at })),
    todayPlan: patient.todayPlan.map(({ slot, title, time }) => ({ slot, title, time })),
    weekPlan: patient.weekPlan.map(({ day, meals: plan }) => ({ day, meals: plan.map(({ slot, title }) => ({ slot, title })) })),
    logs: meals.map(({ id, slot, description, status, macros: nutrients, foods, logged_at }) => ({
      id, slot, description, status, macros: nutrients, logged_at,
      foods: status === 'pending_review' ? [] : foods.map(({ name }) => ({ name })),
    })),
    messages: patient.messages.filter((m) => m.patient_id === patient.id && Boolean(m.sent_at))
      .map(({ id, text, from, sent_at, delivered_at, read_at, attachment }) => ({
        id, text, from, sent_at, delivered_at: delivered_at ?? null, read_at: read_at ?? null,
        ...(attachment ? { attachment } : {}),
      })),
  };
}
export type ShowroomPatient = ReturnType<typeof buildShowroomPatient>;
