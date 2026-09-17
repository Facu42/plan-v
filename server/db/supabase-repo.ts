import type { Brief, MealLog, Message, Patient } from '../../src/types/index.ts';
import { resolveBillingStatus } from '../../src/billing.ts';
import type { Actor, PatientResource } from '../security/contracts.ts';
import { WEEK_DAYS } from '../schemas.ts';
import { getSupabaseAdmin } from './supabase-client.ts';

// Mapeo dominio (etiquetas UI) ↔ enums del contrato 016 v2 (meal_slot_kind).
const SLOT_LABEL_TO_ENUM: Record<string, string> = {
  Desayuno: 'desayuno',
  Colación: 'colacion',
  Almuerzo: 'almuerzo',
  Merienda: 'merienda',
  Cena: 'cena',
  Extra: 'extra',
};

const SLOT_ENUM_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SLOT_LABEL_TO_ENUM).map(([label, value]) => [value, label]),
);

// Recordatorios: etiquetas del dominio derivado ↔ enum reminder_kind (016 v2).
const REMINDER_LABEL_TO_ENUM: Record<string, string> = {
  comida: 'meal',
  agua: 'water',
  consulta: 'appointment',
  sueno: 'sleep',
};

const REMINDER_ENUM_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REMINDER_LABEL_TO_ENUM).map(([label, value]) => [value, label]),
);

// weekday del contrato: 0 = Lunes … 6 = Domingo, con fecha local (nunca UTC).
export function menuWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// YYYY-MM-DD del calendario local; nunca toISOString (el rollover UTC excluye días).
export function localDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================
// Consultas: timezone único v0 (Argentina, UTC-3, sin DST).
// Toda la lógica usa Intl con timeZone explícito: no depende del TZ del servidor.
// ============================================================
export const PATIENT_TIMEZONE = 'America/Argentina/Buenos_Aires';

const JS_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function tzParts(date: Date): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: PATIENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    weekday: JS_WEEKDAYS.indexOf(parts.weekday as (typeof JS_WEEKDAYS)[number]),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

// Convierte una hora de pared (y/m/d hh:mm en PATIENT_TIMEZONE) al instante UTC.
function zonedWallToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month, day, hour, minute);
  const rendered = tzParts(new Date(guess));
  const offset = Date.UTC(rendered.year, rendered.month, rendered.day, rendered.hour, rendered.minute) - guess;
  return new Date(guess - offset);
}

// Próxima ocurrencia del weekday a la hora de pared indicada (>= from).
export function nextAppointmentStartsAt(day: string, time: string, from = new Date()): string {
  const targetWeekday = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]); // 0=Lunes
  if (targetWeekday < 0) throw new Error('Invalid appointment day');
  const [hour, minute] = time.split(':').map(Number);

  const now = tzParts(from);
  const nowMondayIndex = (now.weekday + 6) % 7;
  let delta = (targetWeekday - nowMondayIndex + 7) % 7;
  if (delta === 0 && (now.hour > hour || (now.hour === hour && now.minute >= minute))) {
    delta = 7;
  }

  const target = new Date(Date.UTC(now.year, now.month, now.day + delta));
  return zonedWallToUtc(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), hour, minute).toISOString();
}

// 'Jueves · 14:30' a partir del instante persistido.
export function formatAppointmentWhen(startsAtIso: string): string {
  const parts = tzParts(new Date(startsAtIso));
  const dayName = WEEK_DAYS[(parts.weekday + 6) % 7];
  return `${dayName} · ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

// Etiqueta de timeline: HOY / AYER / dd/mm, con calendario local.
export function timelineAtLabel(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate);
  const todayId = localDateId(now);
  const dateId = localDateId(date);
  if (dateId === todayId) return 'HOY';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dateId === localDateId(yesterday)) return 'AYER';
  return dateId.slice(8, 10) + '/' + dateId.slice(5, 7);
}

function mapPatient(row: Record<string, unknown>, extras: {
  todayPlan?: Patient['todayPlan'];
  weekPlan?: Patient['weekPlan'];
  meal_logs?: MealLog[];
  messages?: Message[];
  brief?: Brief | null;
  timeline?: Patient['timeline'];
  habit_logs?: Patient['habit_logs'];
  hydration?: number;
  energy?: string | null;
  sleep_minutes?: number | null;
  briefDismissed?: boolean;
  appointment?: Patient['appointment'];
}): Patient {
  const billing = {
    billing_status: (row.billing_status as Patient['billing_status']) ?? 'pending',
    billing_until: (row.billing_until as string | null) ?? null,
  };

  return {
    id: row.id as string,
    name: row.full_name as string,
    initials: (row.initials as string) || (row.full_name as string).slice(0, 2).toUpperCase(),
    tone: (row.tone as Patient['tone']) ?? 'mint',
    status: row.status as string,
    billing_status: resolveBillingStatus(billing),
    billing_until: billing.billing_until,
    stage: row.stage as Patient['stage'],
    goal: row.goal as string,
    sensitive_hours: row.sensitive_hours as string,
    plan_b: row.plan_b as string,
    next_focus: row.next_focus as string,
    adherence_score: row.adherence_score as number,
    adherence_why: row.adherence_why as string,
    time: 'hoy',
    hydration: extras.hydration ?? 0,
    energy: extras.energy ?? null,
    sleep_minutes: extras.sleep_minutes ?? null,
    appointment: extras.appointment ?? null,
    habit_logs: extras.habit_logs ?? [],
    todayPlan: extras.todayPlan ?? [],
    weekPlan: extras.weekPlan ?? [],
    brief: extras.brief ?? null,
    briefDismissed: extras.briefDismissed ?? false,
    timeline: extras.timeline ?? [],
    meal_logs: extras.meal_logs ?? [],
    messages: extras.messages ?? [],
  };
}

function mapMealLog(row: Record<string, unknown>): MealLog {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    slot: (row.slot_label as string) || SLOT_ENUM_TO_LABEL[row.slot as string] || 'Extra',
    photo_url: (row.photo_path as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    foods: row.foods as MealLog['foods'],
    macros: row.macros as MealLog['macros'],
    confidence: Number(row.confidence),
    note_for_nutri: row.note_for_nutri as string,
    status: row.status as MealLog['status'],
    logged_at: row.logged_at as string,
  };
}

export function mapMessage(row: Record<string, unknown>, authorRole: unknown): Message | null {
  if (authorRole !== 'paciente' && authorRole !== 'nutri') return null;
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    from: authorRole === 'paciente' ? 'patient' : 'vero',
    text: row.body as string,
    suggested_by_ai: Boolean(row.suggested_by_ai),
    sent_at: row.sent_at as string,
  };
}

async function loadPatientExtras(patientId: string): Promise<Pick<Patient, 'todayPlan' | 'weekPlan' | 'meal_logs' | 'messages' | 'brief' | 'briefDismissed' | 'timeline' | 'habit_logs' | 'hydration' | 'energy' | 'sleep_minutes' | 'appointment'>> {
  const sb = getSupabaseAdmin()!;

  const [{ data: slots }, { data: logs }, { data: msgs }, { data: briefs }, { data: habits }, { data: appts }, { data: timelineRows }] = await Promise.all([
    sb.from('meal_slots').select('weekday, slot, title').eq('patient_id', patientId).order('weekday').order('slot'),
    sb.from('meal_logs').select('*').eq('patient_id', patientId).order('logged_at', { ascending: false }).limit(20),
    sb.from('messages').select('*').eq('patient_id', patientId).order('sent_at', { ascending: true }),
    sb.from('ai_briefs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('habit_logs').select('*').eq('patient_id', patientId).order('date', { ascending: false }).limit(14),
    sb.from('appointments').select('*').eq('patient_id', patientId).eq('status', 'scheduled').gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(1),
    sb.from('timeline_events').select('*').eq('patient_id', patientId).order('occurred_at', { ascending: false }).limit(20),
  ]);

  // Plantilla semanal recurrente (016 v2): agrupa por weekday 0=Lunes…6=Domingo.
  const mealsByWeekday = new Map<number, { slot: string; title: string }[]>();
  for (const s of slots ?? []) {
    const weekday = Number(s.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
    const meals = mealsByWeekday.get(weekday) ?? [];
    meals.push({
      slot: SLOT_ENUM_TO_LABEL[s.slot as string] ?? (s.slot as string),
      title: s.title as string,
    });
    mealsByWeekday.set(weekday, meals);
  }

  const weekPlan = [...mealsByWeekday.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, meals]) => ({ day: WEEK_DAYS[weekday], meals }));

  // Sin horarios en la plantilla: no se inventan, quedan vacíos.
  const todayPlan = (mealsByWeekday.get(menuWeekdayIndex(new Date())) ?? [])
    .map((meal) => ({ ...meal, time: '' }));

  // Último brief por created_at: pending es visible; dismissed queda interno
  // (briefDismissed=true, la acción se vacía al serializar); done/ausente → null.
  const briefStatus = briefs?.status as string | undefined;
  const brief: Brief | null = briefs && (briefStatus === 'pending_review' || briefStatus === 'dismissed')
    ? {
        suggested_action: briefs.suggested_action,
        up_next_title: briefs.up_next_title,
        up_next_body: briefs.up_next_body,
        draft_message: briefs.draft_message,
        source_ids: briefs.source_ids ?? [],
        adherence_why: briefs.adherence_why ?? '',
      }
    : null;
  const briefDismissed = briefStatus === 'dismissed';

  const meal_logs = (logs ?? []).map(mapMealLog);
  const authorIds = [...new Set((msgs ?? []).map((message) => message.author_id))];
  const { data: authors } = authorIds.length > 0
    ? await sb.from('profiles').select('id, role').in('id', authorIds)
    : { data: [] };
  const roleByAuthor = new Map((authors ?? []).map((author) => [author.id, author.role]));
  const messages: Message[] = (msgs ?? []).flatMap((message) => {
    const mapped = mapMessage(message, roleByAuthor.get(message.author_id));
    return mapped ? [mapped] : [];
  });

  // Timeline persistida (016 v2): sin fabricación desde meal_logs; si no hay
  // eventos, queda vacía. Los eventos se crean al cablear las rutas (sbAddTimelineEvent).
  const timeline: Patient['timeline'] = (timelineRows ?? []).map((event) => ({
    id: event.id as string,
    kind: event.kind as Patient['timeline'][number]['kind'],
    atLabel: timelineAtLabel(event.occurred_at as string),
    title: event.title as string,
    body: event.body as string,
  }));

  // habit_logs es la fuente de verdad: el snapshot del día se deriva, no se duplica.
  const habit_logs: Patient['habit_logs'] = (habits ?? []).map((h) => ({
    id: h.id as string,
    patient_id: h.patient_id as string,
    date: h.date as string,
    hydration: (h.hydration as number) ?? 0,
    energy: (h.energy as string | null) ?? null,
    sleep_minutes: (h.sleep_minutes as number | null) ?? null,
  }));
  const todayHabit = habit_logs.find((h) => h.date === localDateId(new Date()));

  const nextAppt = (appts ?? [])[0];
  const appointment: Patient['appointment'] = nextAppt
    ? {
        when: formatAppointmentWhen(nextAppt.starts_at as string),
        duration: nextAppt.duration_min as number,
        channel: nextAppt.channel as string,
        ...(nextAppt.meet_url ? { meet_url: nextAppt.meet_url as string } : {}),
      }
    : null;

  return {
    todayPlan,
    weekPlan,
    meal_logs,
    messages,
    brief,
    briefDismissed,
    timeline,
    habit_logs,
    hydration: todayHabit?.hydration ?? 0,
    energy: todayHabit?.energy ?? null,
    sleep_minutes: todayHabit?.sleep_minutes ?? null,
    appointment,
  };
}

export async function sbGetProfileRole(userId: string): Promise<'nutri' | 'paciente' | null> {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role === 'nutri' || data?.role === 'paciente' ? data.role : null;
}

export async function sbGetActor(userId: string): Promise<Actor | null> {
  const role = await sbGetProfileRole(userId);
  const sb = getSupabaseAdmin()!;

  if (role === 'nutri') {
    const { data } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
    return data?.id ? { role, userId, nutritionistId: data.id } : null;
  }

  if (role === 'paciente') {
    const { data } = await sb.from('patients').select('id').eq('user_id', userId).maybeSingle();
    return data?.id ? { role, userId, patientId: data.id } : null;
  }

  return null;
}

export async function sbGetPatientResource(patientId: string): Promise<PatientResource | null> {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb.from('patients').select('id,nutritionist_id,billing_status,billing_until').eq('id', patientId).maybeSingle();
  if (!data?.id || !data.nutritionist_id) return null;
  return {
    id: data.id,
    nutritionistId: data.nutritionist_id,
    billing_status: data.billing_status ?? 'pending',
    billing_until: data.billing_until ?? null,
  };
}

export async function sbGetPatientsForNutri(userId: string): Promise<Patient[]> {
  const sb = getSupabaseAdmin()!;
  const { data: nutri } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  if (!nutri) return [];

  const { data: rows } = await sb.from('patients').select('*').eq('nutritionist_id', nutri.id).order('created_at');
  const patients: Patient[] = [];
  for (const row of rows ?? []) {
    const extras = await loadPatientExtras(row.id);
    patients.push(mapPatient(row, extras));
  }
  return patients;
}

export async function sbGetPatientForUser(userId: string): Promise<Patient | null> {
  const sb = getSupabaseAdmin()!;
  const { data: row } = await sb.from('patients').select('*').eq('user_id', userId).maybeSingle();
  if (!row) return null;
  const extras = await loadPatientExtras(row.id);
  return mapPatient(row, extras);
}

export async function sbGetPatientById(id: string): Promise<Patient | null> {
  const sb = getSupabaseAdmin()!;
  const { data: row } = await sb.from('patients').select('*').eq('id', id).maybeSingle();
  if (!row) return null;
  const extras = await loadPatientExtras(row.id);
  return mapPatient(row, extras);
}

export async function sbAddMealLog(patientId: string, log: Omit<MealLog, 'id' | 'patient_id' | 'logged_at' | 'status'>): Promise<MealLog> {
  const sb = getSupabaseAdmin()!;
  if (log.photo_url?.startsWith('data:')) {
    throw new Error('Inline photos must be uploaded through the Storage contract first');
  }
  const { data, error } = await sb.from('meal_logs').insert({
    patient_id: patientId,
    slot_label: log.slot,
    photo_path: log.photo_url,
    description: log.description,
    foods: log.foods,
    macros: log.macros,
    confidence: log.confidence,
    note_for_nutri: log.note_for_nutri,
    status: 'pending_review',
  }).select().single();
  if (error) throw error;
  return mapMealLog(data);
}

export async function sbUpsertMenuSlot(patientId: string, day: string, slot: string, title: string): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const weekday = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]);
  const slotEnum = SLOT_LABEL_TO_ENUM[slot];
  if (weekday < 0 || !slotEnum) throw new Error('Invalid menu day or slot');
  const { error } = await sb.from('meal_slots').upsert(
    { patient_id: patientId, weekday, slot: slotEnum, title },
    { onConflict: 'patient_id,weekday,slot' },
  );
  if (error) throw error;
}

export async function sbDeleteMenuSlot(patientId: string, day: string, slot: string): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const weekday = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]);
  const slotEnum = SLOT_LABEL_TO_ENUM[slot];
  if (weekday < 0 || !slotEnum) throw new Error('Invalid menu day or slot');
  const { error } = await sb.from('meal_slots').delete()
    .eq('patient_id', patientId)
    .eq('weekday', weekday)
    .eq('slot', slotEnum);
  if (error) throw error;
}

export async function sbUpdateMealLog(patientId: string, mealId: string, patch: Partial<MealLog>): Promise<MealLog | null> {
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('meal_logs').update({
    status: patch.status,
    foods: patch.foods,
    macros: patch.macros,
  }).eq('id', mealId).eq('patient_id', patientId).select().single();
  if (error) return null;
  return mapMealLog(data);
}

export async function sbSetBrief(patientId: string, nutritionistId: string, brief: Brief): Promise<void> {
  const sb = getSupabaseAdmin()!;
  await sb.from('ai_briefs').delete().eq('patient_id', patientId).eq('status', 'pending_review');
  if (brief.suggested_action) {
    await sb.from('ai_briefs').insert({
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      suggested_action: brief.suggested_action,
      up_next_title: brief.up_next_title,
      up_next_body: brief.up_next_body,
      draft_message: brief.draft_message,
      source_ids: brief.source_ids,
      adherence_why: brief.adherence_why,
      status: 'pending_review',
    });
  }
  await sb.from('patients').update({ adherence_why: brief.adherence_why }).eq('id', patientId);
}

export type ReminderConfig = { kind: string; time: string; enabled: boolean };

export async function sbUpsertReminder(patientId: string, kind: string, timeLocal: string, enabled = true): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const kindEnum = REMINDER_LABEL_TO_ENUM[kind];
  if (!kindEnum) throw new Error(`Invalid reminder kind: ${kind}`);
  const { error } = await sb.from('reminders').upsert(
    { patient_id: patientId, kind: kindEnum, time_local: timeLocal, enabled },
    { onConflict: 'patient_id,kind,time_local' },
  );
  if (error) throw error;
}

export async function sbDeleteReminder(patientId: string, kind: string, timeLocal: string): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const kindEnum = REMINDER_LABEL_TO_ENUM[kind];
  if (!kindEnum) throw new Error(`Invalid reminder kind: ${kind}`);
  const { error } = await sb.from('reminders').delete()
    .eq('patient_id', patientId)
    .eq('kind', kindEnum)
    .eq('time_local', timeLocal);
  if (error) throw error;
}

export async function sbGetReminderConfig(patientId: string): Promise<ReminderConfig[]> {
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('reminders').select('kind, time_local, enabled')
    .eq('patient_id', patientId).order('time_local');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    kind: REMINDER_ENUM_TO_LABEL[row.kind as string] ?? (row.kind as string),
    time: String(row.time_local).slice(0, 5),
    enabled: Boolean(row.enabled),
  }));
}

export async function sbAddTimelineEvent(
  patientId: string,
  event: { kind: string; title: string; body: string; visibility?: 'professional' | 'patient' },
): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from('timeline_events').insert({
    patient_id: patientId,
    kind: event.kind,
    visibility: event.visibility ?? 'professional',
    title: event.title,
    body: event.body,
    occurred_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function sbSetAppointment(
  patientId: string,
  nutritionistId: string,
  appointment: { day: string; time: string; duration: number; channel: string; meet_url?: string } | null,
): Promise<void> {
  const sb = getSupabaseAdmin()!;
  // El dominio v0 tiene una sola consulta vigente por paciente: se reemplaza.
  const { error: deleteError } = await sb.from('appointments').delete()
    .eq('patient_id', patientId).eq('status', 'scheduled');
  if (deleteError) throw deleteError;
  if (!appointment) return;

  const { error } = await sb.from('appointments').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    starts_at: nextAppointmentStartsAt(appointment.day, appointment.time),
    duration_min: appointment.duration,
    channel: appointment.channel,
    status: 'scheduled',
    meet_url: appointment.meet_url ?? null,
  });
  if (error) throw error;
}

export async function sbDismissBrief(patientId: string, dismissedBy: string): Promise<void> {
  const sb = getSupabaseAdmin()!;
  // Sólo el brief pendiente: si ya estaba dismissed/done, es un no-op idempotente.
  const { error } = await sb.from('ai_briefs').update({
    status: 'dismissed',
    dismissed_at: new Date().toISOString(),
    dismissed_by: dismissedBy,
  }).eq('patient_id', patientId).eq('status', 'pending_review');
  if (error) throw error;
}

export async function sbUpdateHabits(patientId: string, data: { hydration?: number; energy?: string | null; sleep_minutes?: number | null }): Promise<void> {
  const sb = getSupabaseAdmin()!;
  const today = localDateId(new Date());
  const { data: existing } = await sb.from('habit_logs').select('*')
    .eq('patient_id', patientId).eq('date', today).maybeSingle();

  const payload: Record<string, unknown> = {
    patient_id: patientId,
    date: today,
    ...(existing ? {
      hydration: existing.hydration,
      energy: existing.energy,
      sleep_minutes: existing.sleep_minutes,
    } : {}),
  };
  if (data.hydration !== undefined) payload.hydration = data.hydration;
  if (data.energy !== undefined) payload.energy = data.energy;
  if (data.sleep_minutes !== undefined) payload.sleep_minutes = data.sleep_minutes;

  const { error } = await sb.from('habit_logs').upsert(payload, { onConflict: 'patient_id,date' });
  if (error) throw error;
}

export async function sbAddMessage(patientId: string, nutritionistId: string, authorId: string, text: string, suggestedByAi: boolean): Promise<void> {
  const sb = getSupabaseAdmin()!;
  await sb.from('messages').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    author_id: authorId,
    body: text,
    suggested_by_ai: suggestedByAi,
    sent_at: new Date().toISOString(),
  });
}

export async function sbGetNutritionistId(userId: string): Promise<string | null> {
  const sb = getSupabaseAdmin()!;
  const { data } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

export async function sbEnsureNutritionist(userId: string, displayName: string): Promise<string> {
  const existing = await sbGetNutritionistId(userId);
  if (existing) return existing;
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb.from('nutritionists').insert({ user_id: userId, display_name: displayName }).select('id').single();
  if (error) throw error;
  return data.id;
}

export function computeShoppingList(patient: Patient): string[] {
  const items = new Set<string>();
  for (const day of patient.weekPlan) for (const meal of day.meals) items.add(meal.title);
  for (const meal of patient.todayPlan) items.add(meal.title);
  return [...items];
}
