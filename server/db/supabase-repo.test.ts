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
    builder.range = (from: number, to: number) => {
      call.filters.push(['range', [from, to]]);
      return builder;
    };
    builder.single = () => Promise.resolve(next(table));
    builder.maybeSingle = () => Promise.resolve(next(table));
    builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(next(table)).then(resolve, reject);

    return builder;
  }

  function rpc(name: string, payload?: unknown) {
    calls.push({ table: name, op: 'rpc', payload, filters: [] });
    return Promise.resolve(next(name));
  }

  return {
    calls,
    push,
    reset() {
      calls.length = 0;
      queues.clear();
    },
    client: { from, rpc },
  };
});

vi.mock('./supabase-client.js', () => ({
  getSupabaseAdmin: () => harness.client,
  getRequestDb: () => harness.client,
  privilegedDb: () => harness.client,
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
  sbGetPatientForUser,
  sbGetReminderConfig,
  sbGetScheduledAppointment,
  sbListPatientsForNutri,
  sbSetAppointment,
  sbSetBrief,
  sbUpdateGoal,
  sbUpdateHabits,
  sbUpdatePatientProfile,
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
    expect(mapMessage(row, 'nutri', { delivered_at: row.sent_at, read_at: null })).toMatchObject({
      from: 'vero',
      text: 'Hola',
      delivered_at: row.sent_at,
      read_at: null,
    });
  });

  it('fails closed when the author role is missing or invalid', () => {
    expect(mapMessage(row, undefined)).toBeNull();
    expect(mapMessage(row, 'admin')).toBeNull();
  });
});

describe('sbAddMessage (thread RPC)', () => {
  it('persists sent messages with a client id so retries do not duplicate', async () => {
    harness.push('send_thread_message', { data: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, error: null });
    await sbAddMessage('patient-1', 'Hola', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    const call = harness.calls.find((entry) => entry.table === 'send_thread_message' && entry.op === 'rpc');
    expect(call?.payload).toMatchObject({
      thread_message_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      target: 'patient-1',
      body_value: 'Hola',
      suggested_flag: false,
    });
    expect(call?.payload).not.toHaveProperty('message_id');
  });

  it('propagates an unsuccessful message insert', async () => {
    const error = { message: 'synthetic database failure' };
    harness.push('send_thread_message', { data: null, error });
    await expect(sbAddMessage('patient-1', 'hola', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))
      .rejects.toEqual(error);
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
    analysis_status: 'pending' as const,
  };

  it('writes photo_path (never photo_url) per the 016 v2 schema', async () => {
    harness.push('save_meal_capture', { data: { id: 'log-1', patient_id: 'patient-1', slot_label: 'Almuerzo', photo_path: 'patients/patient-1/lunch.jpg', foods: [], macros: null, confidence: 0, status: 'pending_review', analysis_status: 'pending', logged_at: '2026-09-07T12:00:00.000Z' }, error: null });

    await sbAddMealLog('patient-1', { ...baseLog, photo_url: 'patients/patient-1/lunch.jpg' });

    const call = harness.calls.find((entry) => entry.op === 'rpc' && entry.table === 'save_meal_capture');
    const payload = call?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({ photo_path_value: 'patients/patient-1/lunch.jpg', target: 'patient-1' });
    expect(payload).not.toHaveProperty('photo_url');
  });

  it('rejects inline data URLs: photos must go through the Storage contract first', async () => {
    await expect(
      sbAddMealLog('patient-1', { ...baseLog, photo_url: 'data:image/jpeg;base64,AAAA' }),
    ).rejects.toThrow(/storage/i);
    expect(harness.calls.filter((call) => call.op === 'rpc' && call.table === 'save_meal_capture')).toHaveLength(0);
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
    harness.push('save_appointment', { data: { id: 'appt-1' }, error: null });
    await sbSetAppointment('patient-1', 'nutri-1', {
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
      meet_url: 'https://meet.example.com/consulta-sofia',
    });

    const save = harness.calls.find((call) => call.table === 'save_appointment' && call.op === 'rpc');
    expect(save?.payload).toMatchObject({
      target: 'patient-1',
      duration_value: 45,
      channel_value: 'video',
      meet_url_value: 'https://meet.example.com/consulta-sofia',
      timezone_value: 'America/Argentina/Buenos_Aires',
    });
    expect(Date.parse((save?.payload as { starts_at_value: string }).starts_at_value)).toBeGreaterThan(Date.now());
  });

  it('clears the scheduled appointment without inserting when null', async () => {
    harness.push('cancel_appointment', { data: null, error: null });
    await sbSetAppointment('patient-1', 'nutri-1', null);
    expect(harness.calls.some((call) => call.table === 'cancel_appointment' && call.op === 'rpc')).toBe(true);
    expect(harness.calls.some((call) => call.table === 'save_appointment')).toBe(false);
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
      starts_at: '2026-09-10T17:30:00.000Z',
      timezone: 'America/Argentina/Buenos_Aires',
      confirmation: null,
      confirmed_at: null,
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
      { id: 't1', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · foto en revisión', body: '14:05', visibility: 'professional' },
      { id: 't2', kind: 'meal_missed', atLabel: 'AYER', title: 'Sin registro · cena', body: '21:47', visibility: 'professional' },
      { id: 't3', kind: 'menu', atLabel: '05/09', title: 'Menú · Sábado Cena', body: 'Plan B', visibility: 'professional' },
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

  it('filters timeline to patient visibility when loading the patient actor view', async () => {
    harness.push('patients_patient_view', {
      data: {
        id: 'patient-1',
        nutritionist_id: 'nutri-1',
        user_id: 'user-patient',
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
    harness.push('meal_logs_patient_view', { data: [], error: null });
    harness.push('messages_patient_view', { data: [], error: null });
    harness.push('habit_logs', { data: [], error: null });
    harness.push('appointments_patient_view', { data: [], error: null });
    harness.push('timeline_events', { data: [], error: null });

    await sbGetPatientForUser('user-patient');
    const timelineCall = harness.calls.find((call) => call.table === 'timeline_events' && call.op === 'select');
    expect(timelineCall?.filters).toContainEqual(['eq', ['visibility', 'patient']]);
  });

  it('does not publish unclassified timeline on professional reads via a patient filter', async () => {
    pushPatientWithTimeline([]);
    await sbGetPatientById('patient-1');
    const timelineCall = harness.calls.find((call) => call.table === 'timeline_events' && call.op === 'select');
    expect(timelineCall?.filters).not.toContainEqual(['eq', ['visibility', 'patient']]);
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

describe('sbSetBrief write failures', () => {
  const brief = {
    suggested_action: 'mensaje' as const,
    up_next_title: 'Mandarle un mensaje',
    up_next_body: 'Un toque corto',
    draft_message: 'Hola',
    source_ids: [],
    adherence_why: 'Pendiente',
  };

  it('aborts when deleting the previous brief fails', async () => {
    const error = { message: 'synthetic database failure' };
    harness.push('ai_briefs', { data: null, error });
    await expect(sbSetBrief('patient-1', 'nutri-1', brief)).rejects.toEqual(error);
    expect(harness.calls.filter((call) => call.table === 'patients')).toHaveLength(0);
  });
});

describe('patient audience queries', () => {
  it('selects an allowlist without professional-only columns and skips AI briefs', async () => {
    harness.push('patients_patient_view', {
      data: {
        id: 'patient-1',
        full_name: 'Sofía',
        status: 'En ritmo',
        stage: 'plan',
        goal: 'Ritmo',
        adherence_score: 60,
        billing_status: 'waived',
        billing_until: null,
      },
      error: null,
    });
    harness.push('meal_slots', { data: [], error: null });
    harness.push('meal_logs_patient_view', { data: [], error: null });
    harness.push('messages_patient_view', { data: [], error: null });
    harness.push('habit_logs', { data: [], error: null });
    harness.push('appointments_patient_view', { data: [], error: null });
    harness.push('timeline_events', { data: [], error: null });

    const patient = await sbGetPatientForUser('user-1');
    expect(patient).not.toBeNull();
    expect(patient!.plan_b).toBe('');
    expect(patient!.adherence_why).toBe('');

    const patientsSelect = harness.calls.find((call) => call.table === 'patients_patient_view' && call.op === 'select');
    expect(String(patientsSelect?.payload)).not.toContain('plan_b');
    expect(String(patientsSelect?.payload)).not.toContain('*');
    const mealSelect = harness.calls.find((call) => call.table === 'meal_logs_patient_view' && call.op === 'select');
    expect(String(mealSelect?.payload)).not.toContain('note_for_nutri');
    expect(harness.calls.some((call) => call.table === 'ai_briefs')).toBe(false);
  });
});

describe('PV-11 directory summaries', () => {
  const summaryRow = {
    id: 'patient-1',
    full_name: 'Sofía',
    initials: 'SR',
    tone: 'mint',
    status: 'En ritmo',
    stage: 'plan',
    goal: 'Ritmo',
    adherence_score: 60,
    billing_status: 'waived',
    billing_until: null,
  };

  it('pages directory rows without loading meal logs or messages', async () => {
    harness.push('nutritionists', { data: { id: 'nutri-1' }, error: null });
    harness.push('patients', {
      data: [summaryRow, { ...summaryRow, id: 'patient-2', full_name: 'Ana' }, { ...summaryRow, id: 'patient-3', full_name: 'Beto' }],
      error: null,
    });
    harness.push('appointments', {
      data: [{
        id: 'appt-1',
        patient_id: 'patient-1',
        starts_at: nextAppointmentStartsAt('Jueves', '14:30', new Date('2026-09-14T12:00:00-03:00')),
        duration_min: 45,
        channel: 'video',
        status: 'scheduled',
      }],
      error: null,
    });

    const listed = await sbListPatientsForNutri('user-1', { offset: 0, limit: 2 });
    expect(listed.page).toEqual({ offset: 0, limit: 2, has_more: true });
    expect(listed.patients).toHaveLength(2);
    expect(listed.patients[0].meal_logs).toEqual([]);
    expect(listed.patients[0].messages).toEqual([]);
    expect(listed.patients[0].weekPlan).toEqual([]);
    expect(listed.patients.find((patient) => patient.id === 'patient-1')?.appointment?.when).toContain('Jueves');
    expect(listed.patients.find((patient) => patient.id === 'patient-1')?.appointment).toMatchObject({
      duration: 45,
      channel: 'video',
    });
    expect(harness.calls.some((call) => call.table === 'meal_logs')).toBe(false);
    expect(harness.calls.some((call) => call.table === 'messages')).toBe(false);
    expect(harness.calls.some((call) => call.table === 'ai_briefs')).toBe(false);
    expect(harness.calls.find((call) => call.table === 'patients')?.filters).toEqual(
      expect.arrayContaining([['range', [0, 2]]]),
    );
  });
});

describe('PV-10 persistent writes', () => {
  it('updates the professional profile columns without touching billing', async () => {
    await sbUpdatePatientProfile('patient-1', { name: 'Sofía Ríos', status: 'Atención', next_focus: 'Cena' });
    const update = harness.calls.find((call) => call.table === 'patients' && call.op === 'update');
    expect(update?.payload).toEqual({
      full_name: 'Sofía Ríos',
      initials: 'SR',
      status: 'Atención',
      next_focus: 'Cena',
    });
    expect(JSON.stringify(update?.payload)).not.toContain('billing');
  });

  it('persists the published goal text', async () => {
    await sbUpdateGoal('patient-1', 'Comer con regularidad');
    const update = harness.calls.find((call) => call.table === 'patients' && call.op === 'update');
    expect(update?.payload).toEqual({ goal: 'Comer con regularidad' });
  });

  it('reads the next scheduled appointment as local day and time', async () => {
    harness.push('appointments', {
      data: {
        id: 'appt-1',
        patient_id: 'patient-1',
        starts_at: nextAppointmentStartsAt('Jueves', '14:30', new Date('2026-09-14T12:00:00-03:00')),
        duration_min: 45,
        channel: 'video',
        meet_url: 'https://meet.example/sofia',
        status: 'scheduled',
      },
      error: null,
    });
    const appointment = await sbGetScheduledAppointment('patient-1');
    expect(appointment).toMatchObject({
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
      meet_url: 'https://meet.example/sofia',
    });
  });

  it('saves and cancels appointments through transactional RPCs', async () => {
    harness.push('save_appointment', { data: { id: 'appt-1' }, error: null });
    await sbSetAppointment('patient-1', 'nutri-1', {
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
    });
    const save = harness.calls.find((call) => call.table === 'save_appointment' && call.op === 'rpc');
    expect(save?.payload).toMatchObject({
      target: 'patient-1',
      duration_value: 45,
      channel_value: 'video',
      timezone_value: 'America/Argentina/Buenos_Aires',
    });

    harness.push('cancel_appointment', { data: null, error: null });
    await sbSetAppointment('patient-1', 'nutri-1', null);
    expect(harness.calls.some((call) => call.table === 'cancel_appointment' && call.op === 'rpc')).toBe(true);
  });
});
