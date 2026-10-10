import { describe, expect, it } from 'vitest';
import { deriveActions, deriveOverview, deriveProgress, emptySnapshot, type CarteraSnapshot } from './derive.js';

// 2026-10-10 12:00 en Argentina. Ventana de 30 días: 2026-09-11 a 2026-10-10; anterior: 2026-08-12 a 2026-09-10.
const NOW = new Date('2026-10-10T15:00:00Z');
const base = (patch: Partial<CarteraSnapshot> = {}): CarteraSnapshot => ({
  ...emptySnapshot(),
  patients: [
    { id: 'a', name: 'Ana Ficticia', created_at: '2026-06-01T12:00:00Z', has_account: true },
    { id: 'b', name: 'Beto Ficticio', created_at: '2026-10-03T12:00:00Z', has_account: true },
    { id: 'c', name: 'Cora Ficticia', created_at: '2026-08-20T12:00:00Z', has_account: false },
  ],
  ...patch,
});

describe('indicadores de Inicio', () => {
  it('cuenta pacientes nuevos por día argentino, sin pasar a otro día por la hora UTC', () => {
    const snapshot = base({ patients: [
      { id: 'a', name: 'A', created_at: '2026-09-11T02:00:00Z', has_account: true }, // 10-sep 23:00 ART: período anterior
      { id: 'b', name: 'B', created_at: '2026-10-10T01:00:00Z', has_account: true }, // 9-oct 22:00 ART
      { id: 'c', name: 'C', created_at: null, has_account: true },
    ] });
    const overview = deriveOverview(snapshot, 30, NOW);
    const indicator = overview.indicators.find((entry) => entry.id === 'new_patients')!;
    expect(indicator).toMatchObject({ value: 1, previous: 1 });
    expect(indicator.series).toHaveLength(30);
    expect(indicator.series[28]).toBe(1);
  });

  it('separa primera consulta y seguimiento, ignora canceladas y futuras', () => {
    const snapshot = base({ appointments: [
      { patient_id: 'a', status: 'scheduled', starts_at: '2026-08-20T15:00:00Z' },
      { patient_id: 'a', status: 'scheduled', starts_at: '2026-10-01T15:00:00Z' },
      { patient_id: 'a', status: 'scheduled', starts_at: '2026-10-05T15:00:00Z' },
      { patient_id: 'a', status: 'cancelled', starts_at: '2026-10-06T15:00:00Z' },
      { patient_id: 'a', status: 'scheduled', starts_at: '2026-10-12T15:00:00Z' },
      { patient_id: 'b', status: 'cancelled', starts_at: '2026-09-20T15:00:00Z' },
      { patient_id: 'b', status: 'done', starts_at: '2026-10-03T15:00:00Z' },
    ] });
    const overview = deriveOverview(snapshot, 30, NOW);
    const get = (id: string) => overview.indicators.find((entry) => entry.id === id)!;
    expect(get('first_consultations')).toMatchObject({ value: 1, previous: 1 });
    expect(get('follow_up_consultations')).toMatchObject({ value: 2, previous: 0 });
    expect(overview.consultations_trend.reduce((total, row) => total + row.first + row.follow_up, 0)).toBe(3);
  });

  it('suma sólo ingresos confirmados y cuenta pacientes distintos', () => {
    const snapshot = base({ payments: [
      { id: '1', patient_id: 'a', amount: 30000, paid_on: '2026-10-02', status: 'confirmed' },
      { id: '2', patient_id: 'a', amount: 30000, paid_on: '2026-09-15', status: 'confirmed' },
      { id: '3', patient_id: 'b', amount: 20000, paid_on: '2026-10-04', status: 'reported' },
      { id: '4', patient_id: 'b', amount: 15000, paid_on: '2026-09-01', status: 'confirmed' },
      { id: '5', patient_id: 'b', amount: 5000, paid_on: '2026-10-05', status: 'voided' },
    ] });
    const overview = deriveOverview(snapshot, 30, NOW);
    expect(overview.indicators.find((entry) => entry.id === 'income')).toMatchObject({ value: 60000, previous: 15000 });
    expect(overview.paying_patients).toBe(1);
  });

  it('cuenta mensajes enviados por la profesional en el período', () => {
    const snapshot = base({ messages: [
      { id: 'm1', patient_id: 'a', sent_at: '2026-10-09T10:00:00Z' },
      { id: 'm2', patient_id: 'a', sent_at: '2026-09-01T10:00:00Z' },
    ] });
    expect(deriveOverview(snapshot, 7, NOW).indicators.find((entry) => entry.id === 'messages_sent')).toMatchObject({ value: 1, previous: 0 });
  });

  it('muestra pacientes con registros por tramo sin convertirlo en porcentaje de cumplimiento', () => {
    const snapshot = base({
      meals: [{ id: 'x', patient_id: 'a', logged_at: '2026-10-10T15:00:00Z', slot: 'Almuerzo', status: 'confirmed' }],
      habits: [{ patient_id: 'b', date: '2026-10-10', hydration: 0, hydration_declared: true, energy: null, sleep_minutes: null }],
    });
    const overview = deriveOverview(snapshot, 7, NOW);
    expect(overview.registration_trend[overview.registration_trend.length - 1]).toMatchObject({ patients: 2 });
    expect(JSON.stringify(overview)).not.toMatch(/adherencia|adherence|%/i);
  });

  it('un cero de agua no declarado no cuenta como registro', () => {
    const snapshot = base({ habits: [{ patient_id: 'b', date: '2026-10-10', hydration: 0, energy: null, sleep_minutes: null }] });
    expect((() => { const trend = deriveOverview(snapshot, 7, NOW).registration_trend; return trend[trend.length - 1]; })()).toMatchObject({ patients: 0 });
  });
});

describe('próximas acciones', () => {
  it('redacta hechos y sólo para pacientes con cuenta', () => {
    const snapshot = base({ meals: [{ id: 'x', patient_id: 'a', logged_at: '2026-09-28T15:00:00Z', slot: 'Cena', status: 'confirmed' }] });
    const actions = deriveActions(snapshot, NOW);
    expect(actions.map((a) => a.patient_id)).toEqual(['a', 'b']);
    expect(actions[0]).toMatchObject({ signal: 'no_records', title: 'Sin registros hace 12 días' });
    expect(actions[1].title).toBe('Todavía sin registros');
    expect(actions[1].detail).toContain('Se sumó hace 7 días');
    expect(JSON.stringify(actions)).not.toMatch(/riesgo|abandono|adherencia/i);
  });

  it('no señala a quien registró hace poco ni a quien no tiene cuenta', () => {
    const snapshot = base({ meals: [
      { id: 'x', patient_id: 'a', logged_at: '2026-10-08T15:00:00Z', slot: 'Cena', status: 'confirmed' },
      { id: 'y', patient_id: 'b', logged_at: '2026-10-09T15:00:00Z', slot: 'Cena', status: 'confirmed' },
    ] });
    expect(deriveActions(snapshot, NOW)).toEqual([]);
  });

  it('una paciente recién sumada no aparece como sin registros', () => {
    const snapshot = base({ patients: [{ id: 'n', name: 'Nueva', created_at: '2026-10-08T12:00:00Z', has_account: true }] });
    expect(deriveActions(snapshot, NOW)).toEqual([]);
  });

  it('descartar oculta la señal hasta que cambia el hecho que la originó', () => {
    const meals = [{ id: 'x', patient_id: 'a', logged_at: '2026-09-28T15:00:00Z', slot: 'Cena', status: 'confirmed' }];
    const first = deriveActions(base({ meals }), NOW).find((a) => a.patient_id === 'a')!;
    const dismissed = base({ meals, dismissals: [{ patient_id: 'a', signal: 'no_records', fingerprint: first.fingerprint }] });
    expect(deriveActions(dismissed, NOW).some((a) => a.patient_id === 'a')).toBe(false);
    const changed = base({ meals: [{ ...meals[0], logged_at: '2026-09-29T15:00:00Z' }], dismissals: dismissed.dismissals });
    expect(deriveActions(changed, NOW).some((a) => a.patient_id === 'a')).toBe(true);
  });

  it('avisa muchos pedidos de reemplazo con el conteo real', () => {
    const snapshot = base({
      meals: [{ id: 'x', patient_id: 'a', logged_at: '2026-10-09T15:00:00Z', slot: 'Cena', status: 'confirmed' }, { id: 'y', patient_id: 'b', logged_at: '2026-10-09T15:00:00Z', slot: 'Cena', status: 'confirmed' }],
      replacements: [
        { id: 'r1', patient_id: 'a', recorded_on: '2026-10-01' },
        { id: 'r2', patient_id: 'a', recorded_on: '2026-10-03' },
        { id: 'r3', patient_id: 'a', recorded_on: '2026-10-08' },
        { id: 'r4', patient_id: 'b', recorded_on: '2026-10-08' },
        { id: 'r5', patient_id: 'b', recorded_on: '2026-08-01' },
      ],
    });
    const actions = deriveActions(snapshot, NOW);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ signal: 'many_replacements', patient_id: 'a', title: '3 pedidos de reemplazo en 30 días' });
  });
});

describe('Progreso global', () => {
  const rich = () => base({
    meals: [
      { id: 'm1', patient_id: 'a', logged_at: '2026-10-09T15:00:00Z', slot: 'Almuerzo', status: 'confirmed' },
      { id: 'm2', patient_id: 'b', logged_at: '2026-10-08T15:00:00Z', slot: 'Cena', status: 'pending_review' },
      { id: 'm3', patient_id: 'a', logged_at: '2026-07-01T15:00:00Z', slot: 'Cena', status: 'confirmed' },
    ],
    activities: [
      { id: 'ac1', patient_id: 'a', at: '2026-10-07T15:00:00Z', name: 'Caminata', minutes: 30, kcal: 120 },
      { id: 'ac2', patient_id: 'b', at: '2026-10-06T15:00:00Z', name: 'Yoga', minutes: 45, kcal: null },
    ],
    measurements: [{ id: 'me1', patient_id: 'a', kind: 'weight', value: 64.1, unit: 'kg', at: '2026-10-05T15:00:00Z' }],
    habits: [{ patient_id: 'a', date: '2026-10-04', hydration: 5, hydration_declared: true, energy: 'Alta', sleep_minutes: 420 }],
  });

  it('cuenta por filtro dentro del período y resume actividad con kcal declaradas', () => {
    const result = deriveProgress(rich(), { days: 30 }, NOW);
    expect(result.counts).toEqual({ all: 6, measurement: 1, activity: 2, meal: 2, habit: 1 });
    expect(result.activity).toEqual({ sessions: 2, minutes: 75, kcal_declared: 120, sessions_with_kcal: 1 });
    expect(result.items.map((item) => item.id)).toEqual(['meal:m1', 'meal:m2', 'activity:ac1', 'activity:ac2', 'measurement:me1', 'habit:a:2026-10-04']);
  });

  it('filtra por tipo y por paciente y no mezcla pacientes', () => {
    const byKind = deriveProgress(rich(), { days: 30, filter: 'activity' }, NOW);
    expect(byKind.items).toHaveLength(2);
    const byPatient = deriveProgress(rich(), { days: 30, patientId: 'b' }, NOW);
    expect(new Set(byPatient.items.map((item) => item.patient_id))).toEqual(new Set(['b']));
    expect(byPatient.activity.sessions).toBe(1);
  });

  it('pagina con cursor estable', () => {
    const first = deriveProgress(rich(), { days: 30, limit: 2 }, NOW);
    expect(first.items).toHaveLength(2);
    expect(first.next_cursor).toBeTruthy();
    const second = deriveProgress(rich(), { days: 30, limit: 2, cursor: first.next_cursor! }, NOW);
    expect(second.items.map((item) => item.id)).toEqual(['activity:ac1', 'activity:ac2']);
    const last = deriveProgress(rich(), { days: 30, limit: 2, cursor: second.next_cursor! }, NOW);
    expect(last.next_cursor).toBeNull();
    expect(last.total).toBe(6);
  });

  it('no incluye textos privados de las comidas', () => {
    const text = JSON.stringify(deriveProgress(rich(), { days: 30 }, NOW));
    expect(text).not.toMatch(/description|note_for_nutri|photo/);
  });
});
