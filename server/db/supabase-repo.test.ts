import { beforeEach, describe, expect, it, vi } from 'vitest';

type Call = {
  table: string;
  op: string;
  payload?: unknown;
  options?: unknown;
  filters: [string, unknown][];
};

const harness = vi.hoisted(() => {
  type Call = {
    table: string;
    op: string;
    payload?: unknown;
    options?: unknown;
    filters: [string, unknown][];
  };

  const calls: Call[] = [];
  const queues = new Map<string, unknown[]>();

  function push(table: string, response: unknown) {
    const queue = queues.get(table) ?? [];
    queue.push(response);
    queues.set(table, queue);
  }

  function next(table: string) {
    const queue = queues.get(table) ?? [];
    return queue.length > 0 ? queue.shift() : { data: null, error: null };
  }

  function from(table: string) {
    const call: Call = { table, op: 'select', filters: [] };
    calls.push(call);

    const builder: Record<string, unknown> = {};
    const MUTATIONS = new Set(['insert', 'update', 'upsert', 'delete']);
    const chain = (op: string) => (payload?: unknown, options?: unknown) => {
      // `.insert(...).select()` encadena: el select final no pisa la mutación.
      if (!(MUTATIONS.has(call.op) && op === 'select')) {
        call.op = op;
        if (payload !== undefined || MUTATIONS.has(op)) call.payload = payload;
        if (options !== undefined) call.options = options;
      }
      return builder;
    };
    const filter = (name: string) => (...args: unknown[]) => {
      call.filters.push([name, args.length === 1 ? args[0] : args]);
      return builder;
    };

    builder.select = chain('select');
    builder.insert = chain('insert');
    builder.update = chain('update');
    builder.upsert = chain('upsert');
    builder.delete = chain('delete');
    builder.eq = filter('eq');
    builder.in = filter('in');
    builder.gte = filter('gte');
    builder.order = filter('order');
    builder.limit = filter('limit');
    builder.single = () => Promise.resolve(next(table));
    builder.maybeSingle = () => Promise.resolve(next(table));
    builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(next(table)).then(resolve, reject);

    return builder;
  }

  return {
    calls,
    push,
    reset() {
      calls.length = 0;
      queues.clear();
    },
    client: { from },
  };
});

vi.mock('./supabase-client.js', () => ({
  getSupabaseAdmin: () => harness.client,
  isSupabaseEnabled: () => true,
}));

import {
  formatAppointmentWhen,
  localDateId,
  mapMessage,
  menuWeekdayIndex,
  nextAppointmentStartsAt,
  sbAddMealLog,
  sbAddMessage,
  sbAddTimelineEvent,
  sbDeleteMenuSlot,
  sbDeleteReminder,
  sbDismissBrief,
  sbGetPatientById,
  sbGetReminderConfig,
  sbSetAppointment,
  sbUpdateHabits,
  sbUpsertMenuSlot,
  sbUpsertReminder,
} from './supabase-repo.js';

const row = {
  id: 'message-1',
  patient_id: 'patient-1',
  body: 'Hola',
  suggested_by_ai: false,
  sent_at: '2026-09-05T15:00:00.000Z',
};

beforeEach(() => {
  harness.reset();
});

describe('mapMessage', () => {
  it('derives message direction from the author profile role', () => {
    expect(mapMessage(row, 'paciente')).toMatchObject({ from: 'patient', text: 'Hola' });
    expect(mapMessage(row, 'nutri')).toMatchObject({ from: 'vero', text: 'Hola' });
  });

  it('fails closed when the author role is missing or invalid', () => {
    expect(mapMessage(row, undefined)).toBeNull();
    expect(mapMessage(row, 'admin')).toBeNull();
  });
});

describe('sbAddMessage (016 v2)', () => {
  it('persists sent messages with sent_at so the patient thread can see them', async () => {
    await sbAddMessage('patient-1', 'nutri-1', 'user-1', 'Hola', false);

    const insert = harness.calls.find((call) => call.table === 'messages' && call.op === 'insert');
    expect(insert).toBeDefined();
    const payload = insert?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      patient_id: 'patient-1',
      nutritionist_id: 'nutri-1',
      author_id: 'user-1',
      body: 'Hola',
      suggested_by_ai: false,
    });
    expect(typeof payload.sent_at).toBe('string');
    expect(Number.isNaN(Date.parse(payload.sent_at as string))).toBe(false);
  });
});

describe('sbAddMealLog (016 v2)', () => {
  const baseLog = {
    slot: 'Almuerzo',
    photo_url: null,
    description: 'Bowl de quinoa',
    foods: [],
    macros: null,
    confidence: 0.9,
    note_for_nutri: '',
  };

  it('writes photo_path (never photo_url) per the 016 v2 schema', async () => {
    harness.push('meal_logs', { data: { id: 'log-1', patient_id: 'patient-1', slot_label: 'Almuerzo', confidence: 0.9, status: 'pending_review', logged_at: '2026-09-07T12:00:00.000Z' }, error: null });

    await sbAddMealLog('patient-1', { ...baseLog, photo_url: 'patients/patient-1/lunch.jpg' });

    const insert = harness.calls.find((call) => call.table === 'meal_logs' && call.op === 'insert');
    const payload = insert?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({ photo_path: 'patients/patient-1/lunch.jpg', status: 'pending_review' });
    expect(payload).not.toHaveProperty('photo_url');
  });

  it('rejects inline data URLs: photos must go through the Storage contract first', async () => {
    await expect(
      sbAddMealLog('patient-1', { ...baseLog, photo_url: 'data:image/jpeg;base64,AAAA' }),
    ).rejects.toThrow(/storage/i);
    expect(harness.calls.filter((call) => call.table === 'meal_logs' && call.op === 'insert')).toHaveLength(0);
  });
});

describe('weekly menu mapping (016 v2)', () => {
  it('maps meal_slots rows into weekPlan day groups and derives todayPlan', async () => {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', {
      data: [
        { weekday: 0, slot: 'almuerzo', title: 'Wrap de pollo' },
        { weekday: 0, slot: 'cena', title: 'Ensalada tibia' },
        { weekday: 2, slot: 'colacion', title: 'Yogur + fruta' },
      ],
      error: null,
    });
    harness.push('meal_logs', { data: [], error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: null, error: null });
    harness.push('habit_logs', { data: [], error: null });

    const patient = await sbGetPatientById('patient-1');
    expect(patient).not.toBeNull();

    expect(patient!.weekPlan).toEqual([
      { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Cena', title: 'Ensalada tibia' }] },
      { day: 'Miércoles', meals: [{ slot: 'Colación', title: 'Yogur + fruta' }] },
    ]);

    const todayIndex = menuWeekdayIndex(new Date());
    const todayName = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][todayIndex];
    const expectedToday = patient!.weekPlan.find((day) => day.day === todayName)?.meals ?? [];
    expect(patient!.todayPlan.map((meal) => ({ slot: meal.slot, title: meal.title }))).toEqual(expectedToday);
  });

  it('upserts slots by (patient_id, weekday, slot) using contract enums', async () => {
    await sbUpsertMenuSlot('patient-1', 'Miércoles', 'Colación', 'Yogur + fruta');

    const upsert = harness.calls.find((call) => call.table === 'meal_slots' && call.op === 'upsert');
    expect(upsert).toBeDefined();
    expect(upsert?.payload).toEqual({
      patient_id: 'patient-1',
      weekday: 2,
      slot: 'colacion',
      title: 'Yogur + fruta',
    });
    expect(upsert?.options).toMatchObject({ onConflict: 'patient_id,weekday,slot' });
  });

  it('deletes slots by (patient_id, weekday, slot)', async () => {
    await sbDeleteMenuSlot('patient-1', 'Lunes', 'Cena');

    const del = harness.calls.find((call) => call.table === 'meal_slots' && call.op === 'delete');
    expect(del).toBeDefined();
    const eqs = del!.filters.filter(([name]) => name === 'eq').map(([, pair]) => pair);
    expect(eqs).toEqual(expect.arrayContaining([
      ['patient_id', 'patient-1'],
      ['weekday', 0],
      ['slot', 'cena'],
    ]));
  });
});

describe('menuWeekdayIndex', () => {
  it('uses Monday=0 … Sunday=6 with local dates', () => {
    expect(menuWeekdayIndex(new Date(2026, 8, 7))).toBe(0); // lunes 2026-09-07
    expect(menuWeekdayIndex(new Date(2026, 8, 13))).toBe(6); // domingo
  });
});

describe('ai_briefs dismissal (016 v2)', () => {
  function pushPatientWithBrief(brief: unknown) {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs', { data: [], error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: brief, error: null });
    harness.push('habit_logs', { data: [], error: null });
  }

  const briefRow = {
    id: 'brief-1',
    patient_id: 'patient-1',
    nutritionist_id: 'nutri-1',
    suggested_action: 'mensaje',
    up_next_title: 'Mandarle un mensaje',
    up_next_body: 'Ayer no cargó el almuerzo.',
    draft_message: 'Hola Sofía, ¿cómo venís?',
    source_ids: ['meal-1'],
    adherence_why: 'Agua 3/7 días.',
    created_at: '2026-09-07T10:00:00.000Z',
  };

  it('maps a pending brief as visible (not dismissed)', async () => {
    pushPatientWithBrief({ ...briefRow, status: 'pending_review' });

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.brief).toMatchObject({
      suggested_action: 'mensaje',
      up_next_title: 'Mandarle un mensaje',
      source_ids: ['meal-1'],
    });
    expect(patient!.briefDismissed).toBe(false);
  });

  it('maps a dismissed latest brief with briefDismissed=true, keeping it internal', async () => {
    pushPatientWithBrief({ ...briefRow, status: 'dismissed', dismissed_at: '2026-09-07T11:00:00.000Z', dismissed_by: 'user-1' });

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.brief).toMatchObject({ suggested_action: 'mensaje' });
    expect(patient!.briefDismissed).toBe(true);
  });

  it('hides briefs whose latest status is done or missing', async () => {
    pushPatientWithBrief({ ...briefRow, status: 'done' });
    expect((await sbGetPatientById('patient-1'))!.brief).toBeNull();

    pushPatientWithBrief(null);
    expect((await sbGetPatientById('patient-1'))!.brief).toBeNull();
  });

  it('dismisses only the pending brief, with actor and timestamp', async () => {
    await sbDismissBrief('patient-1', 'user-1');

    const update = harness.calls.find((call) => call.table === 'ai_briefs' && call.op === 'update');
    expect(update).toBeDefined();
    const payload = update?.payload as Record<string, unknown>;
    expect(payload.status).toBe('dismissed');
    expect(payload.dismissed_by).toBe('user-1');
    expect(Number.isNaN(Date.parse(payload.dismissed_at as string))).toBe(false);

    const eqs = update!.filters.filter(([name]) => name === 'eq').map(([, pair]) => pair);
    expect(eqs).toEqual(expect.arrayContaining([
      ['patient_id', 'patient-1'],
      ['status', 'pending_review'],
    ]));
  });
});

describe('appointments (016 v2)', () => {
  // Referencias ART (UTC-3, sin DST): lunes 2026-09-07, jueves 2026-09-10.
  it('computes the next weekday occurrence at the patient wall time', () => {
    const mondayMorning = new Date('2026-09-07T13:00:00.000Z'); // lunes 10:00 ART
    expect(nextAppointmentStartsAt('Jueves', '14:30', mondayMorning)).toBe('2026-09-10T17:30:00.000Z');
  });

  it('uses the same day when the wall time is still ahead', () => {
    const thursdayMorning = new Date('2026-09-10T12:00:00.000Z'); // jueves 09:00 ART
    expect(nextAppointmentStartsAt('Jueves', '14:30', thursdayMorning)).toBe('2026-09-10T17:30:00.000Z');
  });

  it('rolls to next week when the wall time already passed', () => {
    const thursdayAfternoon = new Date('2026-09-10T18:00:00.000Z'); // jueves 15:00 ART
    expect(nextAppointmentStartsAt('Jueves', '14:30', thursdayAfternoon)).toBe('2026-09-17T17:30:00.000Z');
  });

  it('formats starts_at back to the domain display string', () => {
    expect(formatAppointmentWhen('2026-09-10T17:30:00.000Z')).toBe('Jueves · 14:30');
    expect(formatAppointmentWhen('2026-09-07T11:00:00.000Z')).toBe('Lunes · 08:00');
  });

  it('replaces the scheduled appointment and persists starts_at', async () => {
    await sbSetAppointment('patient-1', 'nutri-1', {
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
      meet_url: 'https://meet.example.com/consulta-sofia',
    });

    const del = harness.calls.find((call) => call.table === 'appointments' && call.op === 'delete');
    expect(del).toBeDefined();
    const delEqs = del!.filters.filter(([name]) => name === 'eq').map(([, pair]) => pair);
    expect(delEqs).toEqual(expect.arrayContaining([
      ['patient_id', 'patient-1'],
      ['status', 'scheduled'],
    ]));

    const insert = harness.calls.find((call) => call.table === 'appointments' && call.op === 'insert');
    const payload = insert?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      patient_id: 'patient-1',
      nutritionist_id: 'nutri-1',
      duration_min: 45,
      channel: 'video',
      status: 'scheduled',
      meet_url: 'https://meet.example.com/consulta-sofia',
    });
    const startsAt = Date.parse(payload.starts_at as string);
    expect(Number.isNaN(startsAt)).toBe(false);
    expect(startsAt).toBeGreaterThan(Date.now());
  });

  it('clears the scheduled appointment without inserting when null', async () => {
    await sbSetAppointment('patient-1', 'nutri-1', null);
    expect(harness.calls.some((call) => call.table === 'appointments' && call.op === 'delete')).toBe(true);
    expect(harness.calls.some((call) => call.table === 'appointments' && call.op === 'insert')).toBe(false);
  });

  it('maps the next scheduled appointment into the domain patient', async () => {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs', { data: [], error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: null, error: null });
    harness.push('habit_logs', { data: [], error: null });
    harness.push('appointments', {
      data: [{
        id: 'appt-1',
        starts_at: '2026-09-10T17:30:00.000Z',
        duration_min: 45,
        channel: 'video',
        meet_url: 'https://meet.example.com/consulta-sofia',
      }],
      error: null,
    });

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.appointment).toEqual({
      when: 'Jueves · 14:30',
      duration: 45,
      channel: 'video',
      meet_url: 'https://meet.example.com/consulta-sofia',
    });
  });

  it('leaves appointment null without scheduled rows', async () => {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs', { data: [], error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: null, error: null });
    harness.push('habit_logs', { data: [], error: null });
    harness.push('appointments', { data: [], error: null });

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.appointment).toBeNull();
  });
});

describe('timeline_events (016 v2)', () => {
  function pushPatientWithTimeline(events: unknown[], mealLogs: unknown[] = []) {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs', { data: mealLogs, error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: null, error: null });
    harness.push('habit_logs', { data: [], error: null });
    harness.push('appointments', { data: [], error: null });
    harness.push('timeline_events', { data: events, error: null });
  }

  it('inserts timeline events with professional visibility by default', async () => {
    await sbAddTimelineEvent('patient-1', { kind: 'menu', title: 'Menú · Lunes Almuerzo', body: 'Wrap de pollo' });

    const insert = harness.calls.find((call) => call.table === 'timeline_events' && call.op === 'insert');
    const payload = insert?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      patient_id: 'patient-1',
      kind: 'menu',
      visibility: 'professional',
      title: 'Menú · Lunes Almuerzo',
      body: 'Wrap de pollo',
    });
    expect(Number.isNaN(Date.parse(payload.occurred_at as string))).toBe(false);
  });

  it('allows explicit patient visibility for patient-safe events', async () => {
    await sbAddTimelineEvent('patient-1', { kind: 'message', title: 'Mensaje enviado', body: '', visibility: 'patient' });

    const insert = harness.calls.find((call) => call.table === 'timeline_events' && call.op === 'insert');
    expect((insert?.payload as Record<string, unknown>).visibility).toBe('patient');
  });

  it('maps persisted events with HOY/AYER/date labels, newest first', async () => {
    const now = new Date();
    const todayAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 5).toISOString();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 21, 47);
    const older = new Date(2026, 8, 5, 13, 30);

    pushPatientWithTimeline([
      { id: 't1', kind: 'meal_logged', title: 'Almuerzo · foto en revisión', body: '14:05', occurred_at: todayAt },
      { id: 't2', kind: 'meal_missed', title: 'Sin registro · cena', body: '21:47', occurred_at: yesterday.toISOString() },
      { id: 't3', kind: 'menu', title: 'Menú · Sábado Cena', body: 'Plan B', occurred_at: older.toISOString() },
    ]);

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.timeline).toEqual([
      { id: 't1', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · foto en revisión', body: '14:05' },
      { id: 't2', kind: 'meal_missed', atLabel: 'AYER', title: 'Sin registro · cena', body: '21:47' },
      { id: 't3', kind: 'menu', atLabel: '05/09', title: 'Menú · Sábado Cena', body: 'Plan B' },
    ]);
  });

  it('returns an empty timeline without fabricating events from meal logs', async () => {
    pushPatientWithTimeline([], [{
      id: 'log-1',
      patient_id: 'patient-1',
      slot_label: 'Almuerzo',
      confidence: 0.8,
      status: 'pending_review',
      logged_at: new Date().toISOString(),
      foods: [],
      macros: null,
      note_for_nutri: '',
    }]);

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.timeline).toEqual([]);
    expect(patient!.meal_logs).toHaveLength(1);
  });
});

describe('reminders (016 v2)', () => {
  it('upserts reminder config with contract enums and conflict key', async () => {
    await sbUpsertReminder('patient-1', 'comida', '13:30', true);

    const upsert = harness.calls.find((call) => call.table === 'reminders' && call.op === 'upsert');
    expect(upsert).toBeDefined();
    expect(upsert?.payload).toEqual({
      patient_id: 'patient-1',
      kind: 'meal',
      time_local: '13:30',
      enabled: true,
    });
    expect(upsert?.options).toMatchObject({ onConflict: 'patient_id,kind,time_local' });
  });

  it('maps all domain kinds: comida, agua, consulta, sueno', async () => {
    await sbUpsertReminder('patient-1', 'agua', '09:00');
    await sbUpsertReminder('patient-1', 'consulta', '14:30');
    await sbUpsertReminder('patient-1', 'sueno', '22:30');

    const kinds = harness.calls
      .filter((call) => call.table === 'reminders' && call.op === 'upsert')
      .map((call) => (call.payload as Record<string, unknown>).kind);
    expect(kinds).toEqual(['water', 'appointment', 'sleep']);
  });

  it('deletes reminder config by (patient_id, kind, time_local)', async () => {
    await sbDeleteReminder('patient-1', 'sueno', '22:30');

    const del = harness.calls.find((call) => call.table === 'reminders' && call.op === 'delete');
    const eqs = del!.filters.filter(([name]) => name === 'eq').map(([, pair]) => pair);
    expect(eqs).toEqual(expect.arrayContaining([
      ['patient_id', 'patient-1'],
      ['kind', 'sleep'],
      ['time_local', '22:30'],
    ]));
  });

  it('rejects unknown kinds without touching the database', async () => {
    await expect(sbUpsertReminder('patient-1', 'ejercicio', '08:00')).rejects.toThrow(/kind/i);
    expect(harness.calls.filter((call) => call.table === 'reminders')).toHaveLength(0);
  });

  it('loads reminder config with domain labels and HH:MM times', async () => {
    harness.push('reminders', {
      data: [
        { kind: 'meal', time_local: '13:30:00', enabled: true },
        { kind: 'appointment', time_local: '14:30:00', enabled: false },
        { kind: 'sleep', time_local: '22:30:00', enabled: true },
      ],
      error: null,
    });

    const config = await sbGetReminderConfig('patient-1');
    expect(config).toEqual([
      { kind: 'comida', time: '13:30', enabled: true },
      { kind: 'consulta', time: '14:30', enabled: false },
      { kind: 'sueno', time: '22:30', enabled: true },
    ]);
  });
});

describe('localDateId', () => {
  it('formats the local calendar date, never UTC', () => {
    expect(localDateId(new Date(2026, 8, 7, 23, 59))).toBe('2026-09-07');
    expect(localDateId(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });
});

describe('habit_logs (016 v2)', () => {
  function pushPatientWithHabits(habits: unknown[]) {
    harness.push('patients', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: '',
        sensitive_hours: '',
        plan_b: '',
        next_focus: '',
        adherence_score: 0,
        adherence_why: '',
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs', { data: [], error: null });
    harness.push('messages', { data: [], error: null });
    harness.push('ai_briefs', { data: null, error: null });
    harness.push('habit_logs', { data: habits, error: null });
  }

  it('derives today snapshot (hydration, energy, sleep) from the local-day habit log', async () => {
    const today = localDateId(new Date());
    pushPatientWithHabits([
      { id: 'h-today', patient_id: 'patient-1', date: today, hydration: 6, energy: 'Con energía', sleep_minutes: 450 },
      { id: 'h-old', patient_id: 'patient-1', date: '2026-08-30', hydration: 2, energy: 'Baja', sleep_minutes: 300 },
    ]);

    const patient = await sbGetPatientById('patient-1');
    expect(patient).not.toBeNull();
    expect(patient!.hydration).toBe(6);
    expect(patient!.energy).toBe('Con energía');
    expect(patient!.sleep_minutes).toBe(450);
    expect(patient!.habit_logs).toHaveLength(2);
    expect(patient!.habit_logs[0]).toMatchObject({ id: 'h-today', date: today, hydration: 6, sleep_minutes: 450 });
  });

  it('defaults the snapshot when there is no habit log for today', async () => {
    pushPatientWithHabits([
      { id: 'h-old', patient_id: 'patient-1', date: '2026-08-30', hydration: 2, energy: 'Baja', sleep_minutes: 300 },
    ]);

    const patient = await sbGetPatientById('patient-1');
    expect(patient!.hydration).toBe(0);
    expect(patient!.energy).toBeNull();
    expect(patient!.sleep_minutes).toBeNull();
  });

  it('upserts habit logs by (patient_id, date) merging with the existing row', async () => {
    const today = localDateId(new Date());
    harness.push('habit_logs', {
      data: { id: 'h-1', patient_id: 'patient-1', date: today, hydration: 2, energy: 'Baja', sleep_minutes: 400 },
      error: null,
    });

    await sbUpdateHabits('patient-1', { hydration: 5 });

    const upsert = harness.calls.find((call) => call.table === 'habit_logs' && call.op === 'upsert');
    expect(upsert).toBeDefined();
    expect(upsert?.payload).toEqual({
      patient_id: 'patient-1',
      date: today,
      hydration: 5,
      energy: 'Baja',
      sleep_minutes: 400,
    });
    expect(upsert?.options).toMatchObject({ onConflict: 'patient_id,date' });
    expect(harness.calls.filter((call) => call.table === 'patients' && call.op === 'update')).toHaveLength(0);
  });

  it('inserts a fresh row when the day has no log yet', async () => {
    const today = localDateId(new Date());
    harness.push('habit_logs', { data: null, error: null });

    await sbUpdateHabits('patient-1', { energy: 'Tranquila' });

    const upsert = harness.calls.find((call) => call.table === 'habit_logs' && call.op === 'upsert');
    expect(upsert?.payload).toEqual({
      patient_id: 'patient-1',
      date: today,
      energy: 'Tranquila',
    });
  });
});
