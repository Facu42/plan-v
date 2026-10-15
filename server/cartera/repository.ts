import type { ActionSignal } from '../../src/types/cartera.js';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { listCareRecords } from '../care/repository.js';
import { getBoard } from '../fees/repository.js';
import { registerDemoState } from '../demo/state.js';
import { getStore } from '../store.js';
import { activePatients, consentPurposes, queueDbError, scopedRows, type WorkScope } from '../crm/repository.js';
import { LOOKBACK_DAYS, emptySnapshot, type CarteraSnapshot } from './derive.js';
import { argentinaToday, shiftIsoDate } from '../progress/derive.js';

type Row = Record<string, unknown>;
const demoDismissals = new Map<string, { patient_id: string; signal: ActionSignal; fingerprint: string }>();
registerDemoState('cartera/repository', () => ({ demoDismissals }));
export function resetCarteraMemory() { demoDismissals.clear(); }

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Desde cuándo leer: el período, su anterior y el tramo con que se miden las acciones. */
export function sinceFor(days: number, now = new Date(), overview = true): string {
  const today = argentinaToday(now);
  const start = shiftIsoDate(today, -(days - 1));
  if (!overview) return start;
  const previousStart = shiftIsoDate(start, -days);
  const lookback = shiftIsoDate(today, -(LOOKBACK_DAYS - 1));
  return previousStart < lookback ? previousStart : lookback;
}

const day = (value: unknown) => String(value).slice(0, 10);
const argentinaInstant = (date: string) => `${date}T00:00:00-03:00`;

export async function loadCarteraSnapshot(scope: WorkScope, since: string, full: boolean): Promise<CarteraSnapshot> {
  const patients = activePatients(scope);
  const snapshot = emptySnapshot();
  const ids = patients.map(patient => patient.id);
  snapshot.patients = patients.map(patient => ({
    id: patient.id, name: patient.name, created_at: patient.created_at ?? null, has_account: Boolean(patient.user_id),
  }));
  if (!ids.length) return snapshot;
  const idSet = new Set(ids);

  if (!scope.persistent) {
    const memory = new Map(getStore().patients.map(patient => [patient.id, patient]));
    snapshot.patients = patients.map(patient => ({
      id: patient.id, name: patient.name, created_at: memory.get(patient.id)?.created_at ?? null,
      has_account: Boolean(memory.get(patient.id)?.has_account),
    }));
    for (const patient of patients) {
      const source = memory.get(patient.id);
      if (!source) continue;
      for (const meal of source.meal_logs) snapshot.meals.push({ id: meal.id, patient_id: patient.id, logged_at: meal.logged_at, slot: meal.slot, status: meal.status });
      for (const habit of source.habit_logs) snapshot.habits.push({ patient_id: patient.id, date: habit.date, hydration: habit.hydration, hydration_declared: habit.hydration_declared, energy: habit.energy, sleep_minutes: habit.sleep_minutes, steps: habit.steps });
      for (const activity of source.activity_logs ?? []) snapshot.activities.push({ id: activity.id, patient_id: patient.id, at: activity.logged_at, name: activity.activity, minutes: activity.duration_minutes, kcal: null });
      for (const message of source.messages) if (message.from === 'vero' && message.sent_at) snapshot.messages.push({ id: message.id, patient_id: patient.id, sent_at: message.sent_at });
      if (source.appointment?.starts_at) snapshot.appointments.push({ patient_id: patient.id, status: 'scheduled', starts_at: source.appointment.starts_at });
    }
    // Las medidas ya llegan filtradas por permiso vigente.
    for (const record of await listCareRecords(null, false)) {
      if (!idSet.has(record.patient_id)) continue;
      const data = record.data;
      if (data.kind === 'activity') snapshot.activities.push({ id: record.id, patient_id: record.patient_id, at: `${record.recorded_on}T12:00:00-03:00`, name: data.activity, minutes: data.minutes, kcal: data.kcal });
      else if ((data.kind === 'weight' || data.kind === 'waist' || data.kind === 'hip') && data.source === 'patient') {
        snapshot.measurements.push({ id: record.id, patient_id: record.patient_id, kind: data.kind, value: data.value, unit: data.unit, at: `${record.recorded_on}T12:00:00-03:00` });
      } else if (data.kind === 'menu_request') snapshot.replacements.push({ id: record.id, patient_id: record.patient_id, recorded_on: record.recorded_on });
    }
    if (full) {
      for (const ledger of (await getBoard(false)).patients) {
        if (!idSet.has(ledger.patient_id)) continue;
        for (const payment of ledger.payments) snapshot.payments.push({ id: payment.id, patient_id: ledger.patient_id, amount: payment.amount, paid_on: payment.paid_on, status: payment.status });
      }
    }
    snapshot.dismissals = [...demoDismissals.values()].filter(entry => idSet.has(entry.patient_id));
    return snapshot;
  }

  const db = getRequestDb();
  const sinceInstant = argentinaInstant(since);
  const [meals, habits, logs, records, consentEvents] = await Promise.all([
    scopedRows(db, 'meal_logs', 'id,patient_id,slot_label,status,logged_at', ids, 'logged_at', {}, { column: 'logged_at', value: sinceInstant }),
    scopedRows(db, 'habit_logs', 'patient_id,date,hydration,hydration_declared,energy,sleep_minutes,steps', ids, 'date', {}, { column: 'date', value: since }),
    scopedRows(db, 'activity_logs', 'id,patient_id,activity,duration_minutes,logged_at', ids, 'logged_at', {}, { column: 'logged_at', value: sinceInstant }),
    scopedRows(db, 'care_records', 'id,patient_id,recorded_on,kind:data->>kind,source:data->>source,value:data->>value,unit:data->>unit,name:data->>activity,minutes:data->>minutes,kcal:data->>kcal', ids, 'recorded_on', {}, { column: 'recorded_on', value: since }),
    scopedRows(db, 'consent_events', 'id,patient_id,purpose,text_version,text_hash,decision,sequence', ids, 'sequence'),
  ]);
  const consents = consentPurposes(consentEvents, ids);
  snapshot.meals = meals.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), logged_at: String(row.logged_at), slot: String(row.slot_label ?? ''), status: String(row.status) }));
  snapshot.habits = habits.map(row => ({
    patient_id: String(row.patient_id), date: day(row.date), hydration: Number(row.hydration ?? 0), hydration_declared: row.hydration_declared === true,
    energy: (row.energy as string | null) ?? null, sleep_minutes: num(row.sleep_minutes), steps: num(row.steps),
  }));
  snapshot.activities = logs.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), at: String(row.logged_at), name: String(row.activity), minutes: Number(row.duration_minutes), kcal: null }));
  for (const row of records) {
    const patientId = String(row.patient_id);
    const kind = String(row.kind);
    if (kind === 'activity') {
      snapshot.activities.push({ id: String(row.id), patient_id: patientId, at: `${day(row.recorded_on)}T12:00:00-03:00`, name: String(row.name ?? 'Actividad'), minutes: num(row.minutes) ?? 0, kcal: num(row.kcal) });
    } else if (kind === 'weight' || kind === 'waist' || kind === 'hip') {
      // Sin permiso de medidas vigente no se leen ni cuentan, aunque la fila exista.
      if (row.source === 'professional' || !consents.get(patientId)?.includes('measurement')) continue;
      const value = num(row.value);
      if (value !== null) snapshot.measurements.push({ id: String(row.id), patient_id: patientId, kind, value, unit: String(row.unit ?? ''), at: `${day(row.recorded_on)}T12:00:00-03:00` });
    } else if (kind === 'menu_request') snapshot.replacements.push({ id: String(row.id), patient_id: patientId, recorded_on: day(row.recorded_on) });
  }
  if (!full) return snapshot;

  const [messages, appointments, dismissals, board] = await Promise.all([
    scopedRows(db, 'messages', 'id,patient_id,author_id,sent_at', ids, 'sent_at', {}, { column: 'sent_at', value: sinceInstant }),
    // Los turnos ya se leen con cliente del servidor en el resto del consultorio; los ids salen de la sesión con RLS.
    scopedRows(privilegedDb(), 'appointments', 'id,patient_id,status,starts_at,duration_min', ids, 'starts_at'),
    scopedRows(db, 'crm_action_dismissals', 'patient_id,signal,fingerprint,dismissed_at', ids, 'dismissed_at'),
    getBoard(true),
  ]);
  const accounts = new Map(patients.map(patient => [patient.id, patient.user_id]));
  snapshot.messages = messages
    .filter(row => row.sent_at && row.author_id && row.author_id !== accounts.get(String(row.patient_id)))
    .map(row => ({ id: String(row.id), patient_id: String(row.patient_id), sent_at: String(row.sent_at) }));
  snapshot.appointments = appointments.map(row => ({ patient_id: String(row.patient_id), status: String(row.status), starts_at: String(row.starts_at), duration_min: num(row.duration_min) ?? 0 }));
  snapshot.dismissals = dismissals.map(row => ({ patient_id: String(row.patient_id), signal: row.signal as ActionSignal, fingerprint: String(row.fingerprint) }));
  for (const ledger of board.patients) {
    if (!idSet.has(ledger.patient_id)) continue;
    for (const payment of ledger.payments) snapshot.payments.push({ id: payment.id, patient_id: ledger.patient_id, amount: payment.amount, paid_on: payment.paid_on, status: payment.status });
  }
  return snapshot;
}

export async function dismissAction(scope: WorkScope, input: { patient_id: string; signal: ActionSignal; fingerprint: string }): Promise<void> {
  if (!activePatients(scope).some(patient => patient.id === input.patient_id)) throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
  if (!scope.persistent) {
    demoDismissals.set(`${input.patient_id}:${input.signal}:${input.fingerprint}`, input);
    return;
  }
  const { error } = await getRequestDb().rpc('dismiss_crm_action', {
    target: input.patient_id, action_signal: input.signal, action_fingerprint: input.fingerprint,
  });
  if (error?.code === '42501') throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
  if (error?.code === '22023') throw new CareError(400, 'No pudimos descartar esa acción.');
  queueDbError(error);
}
