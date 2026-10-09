import { argentinaToday } from '../progress/derive.js';
import type { Brief, MealLog, Message, Patient } from '../../src/types/index.ts';
import { signMealPhotos } from '../care/meal-photos.js';
import { resolveBillingStatus } from '../../src/billing.ts';
import type { Actor, PatientResource } from '../security/contracts.ts';
import { MESSAGE_PAGE_SIZE, WEEK_DAYS } from '../schemas.ts';
import type { ListPage } from '../pagination.ts';
import { getRequestDb, privilegedDb } from './supabase-client.ts';
import { listThreadMessagesPersist } from '../messages/repository.js';
import { listPatientAppointmentPersist } from '../appointments/repository.js';
import { appointmentHasNotEnded, appointmentReadSince } from '../appointment-ops.js';
import { writeOpsLog } from '../ops/log.js';
import {
  appointmentColumns,
  mealLogColumns,
  messageColumns,
  patientTableColumns,
  type QueryAudience,
} from './columns.ts';
import {
  publicInviteView,
  type PatientInvite,
} from '../identity/invites.ts';

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

function rows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? data as Record<string, unknown>[] : [];
}

function row(data: unknown): Record<string, unknown> | null {
  return data !== null && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
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
  appointment_history?: Patient['appointment_history'];
  resource_assignments?: Patient['resource_assignments'];
}, audience: QueryAudience = 'professional'): Patient {
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
    archived_at: (row.archived_at as string | null | undefined) ?? null,
    billing_status: resolveBillingStatus(billing),
    billing_until: billing.billing_until,
    ...(audience === 'professional' && 'user_id' in row ? { has_account: row.user_id != null } : {}),
    stage: row.stage as Patient['stage'],
    goal: row.goal as string,
    sensitive_hours: audience === 'patient' ? '' : row.sensitive_hours as string,
    plan_b: audience === 'patient' ? '' : row.plan_b as string,
    next_focus: audience === 'patient' ? '' : row.next_focus as string,
    adherence_score: row.adherence_score as number,
    adherence_why: audience === 'patient' ? '' : row.adherence_why as string,
    time: 'hoy',
    hydration: extras.hydration ?? 0,
    energy: extras.energy ?? null,
    sleep_minutes: extras.sleep_minutes ?? null,
    appointment: extras.appointment ?? null,
    appointment_history: extras.appointment_history ?? [],
    habit_logs: extras.habit_logs ?? [],
    todayPlan: extras.todayPlan ?? [],
    weekPlan: extras.weekPlan ?? [],
    brief: extras.brief ?? null,
    briefDismissed: extras.briefDismissed ?? false,
    timeline: extras.timeline ?? [],
    meal_logs: extras.meal_logs ?? [],
    messages: extras.messages ?? [],
    resource_assignments: extras.resource_assignments ?? [],
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
    ...(row.nutrition_origin === 'declared' || row.nutrition_origin === 'ai_estimate' ? {nutrition_origin:row.nutrition_origin} : {}),
    note_for_nutri: (row.note_for_nutri as string) ?? '',
    status: row.status as MealLog['status'],
    logged_at: row.logged_at as string,
    ...(row.analysis_status === 'pending' || row.analysis_status === 'succeeded' || row.analysis_status === 'failed'
      ? { analysis_status: row.analysis_status }
      : {}),
  };
}

export function mapMessage(row: Record<string, unknown>, authorRole: unknown): Message | null {
  const from = row.from === 'patient' || row.from === 'vero'
    ? row.from
    : authorRole === 'paciente' ? 'patient'
      : authorRole === 'nutri' ? 'vero'
        : null;
  if (!from) return null;
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    from,
    text: String(row.text ?? row.body ?? ''),
    suggested_by_ai: Boolean(row.suggested_by_ai),
    sent_at: row.sent_at as string,
    ...('delivered_at' in row ? { delivered_at: row.delivered_at == null ? null : String(row.delivered_at) } : {}),
    ...('read_at' in row ? { read_at: row.read_at == null ? null : String(row.read_at) } : {}),
    ...(row.attachment && typeof row.attachment === 'object' ? {
      attachment: {
        asset_id: String((row.attachment as { asset_id?: unknown }).asset_id ?? ''),
        filename: String((row.attachment as { filename?: unknown }).filename ?? 'adjunto'),
        mime: String((row.attachment as { mime?: unknown }).mime ?? ''),
        byte_size: Number((row.attachment as { byte_size?: unknown }).byte_size ?? 0),
        kind: String((row.attachment as { mime?: unknown }).mime ?? '').startsWith('image/') ? 'image' as const : 'pdf' as const,
        available: (row.attachment as { available?: unknown }).available !== false,
      },
    } : {}),
  };
}

async function loadPatientExtras(
  patientId: string,
  audience: 'professional' | 'patient' = 'professional',
): Promise<Pick<Patient, 'todayPlan' | 'weekPlan' | 'meal_logs' | 'messages' | 'brief' | 'briefDismissed' | 'timeline' | 'habit_logs' | 'hydration' | 'energy' | 'sleep_minutes' | 'steps' | 'appointment' | 'appointment_history' | 'resource_assignments'>> {
  const sb = getRequestDb();

  const timelineQuery = sb.from('timeline_events').select('id,kind,title,body,visibility,occurred_at').eq('patient_id', patientId);
  const appointmentNow = new Date();
  const scopedTimeline = audience === 'patient'
    ? timelineQuery.eq('visibility', 'patient')
    : timelineQuery;

  const briefQuery = audience === 'patient'
    ? Promise.resolve({ data: null as Record<string, unknown> | null })
    // Sin permiso de tabla para la nutricionista: lo lee el servidor; quien llama ya la autorizó sobre esta paciente.
    : privilegedDb().from('ai_briefs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).maybeSingle();

  const [{ data: slots }, { data: logs }, { data: msgs }, briefsResult, { data: habits }, { data: appts }, { data: timelineRows }, resourceAssignments] = await Promise.all([
    sb.from('meal_slots').select('weekday, slot, title').eq('patient_id', patientId).order('weekday').order('slot'),
    sb.from(audience === 'patient' ? 'meal_logs_patient_view' : 'meal_logs').select(mealLogColumns[audience]).eq('patient_id', patientId).order('logged_at', { ascending: false }).limit(20),
    sb.from(audience === 'patient' ? 'messages_patient_view' : 'messages').select(messageColumns[audience]).eq('patient_id', patientId).order('sent_at', { ascending: false }).limit(MESSAGE_PAGE_SIZE),
    briefQuery,
    sb.from('habit_logs').select('*').eq('patient_id', patientId).order('date', { ascending: false }).limit(14),
    sb.from(audience === 'patient' ? 'appointments_patient_view' : 'appointments').select(appointmentColumns[audience]).eq('patient_id', patientId).eq('status', 'scheduled').gte('starts_at', appointmentReadSince(appointmentNow)).order('starts_at', { ascending: true }),
    scopedTimeline.order('occurred_at', { ascending: false }).limit(20),
    loadResourceAssignments([patientId]),
  ]);
  const briefs = briefsResult.data;

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

  const meal_logs = await signMealPhotos(patientId, rows(logs).map(mapMealLog));
  const listed = await listThreadMessagesPersist(patientId);
  let messages: Message[];
  if (listed) {
    messages = listed.slice().reverse();
  } else {
    const authorIds = [...new Set(rows(msgs).map((message) => String(message.author_id)))];
    const { data: authors } = authorIds.length > 0
      ? await sb.from('profiles').select('id, role').in('id', authorIds)
      : { data: [] };
    const roleByAuthor = new Map((authors ?? []).map((author) => [author.id, author.role]));
    messages = rows(msgs).slice().reverse().flatMap((message) => {
      const mapped = mapMessage(message, roleByAuthor.get(message.author_id as string));
      return mapped ? [mapped] : [];
    });
  }

  // Timeline persistida (016 v2): sin fabricación desde meal_logs; si no hay
  // eventos, queda vacía. Los eventos se crean al cablear las rutas (sbAddTimelineEvent).
  const timeline: Patient['timeline'] = (timelineRows ?? []).map((event) => ({
    id: event.id as string,
    kind: event.kind as Patient['timeline'][number]['kind'],
    atLabel: timelineAtLabel(event.occurred_at as string),
    title: event.title as string,
    body: event.body as string,
    visibility: event.visibility === 'patient' ? 'patient' : 'professional',
  }));

  // habit_logs es la fuente de verdad: el snapshot del día se deriva, no se duplica.
  const habit_logs: Patient['habit_logs'] = (habits ?? []).map((h) => ({
    id: h.id as string,
    patient_id: h.patient_id as string,
    date: h.date as string,
    hydration: (h.hydration as number) ?? 0,
    hydration_declared: h.hydration_declared === true,
    energy: (h.energy as string | null) ?? null,
    sleep_minutes: (h.sleep_minutes as number | null) ?? null,
    steps: (h.steps as number | null) ?? null,
  }));
  const todayHabit = habit_logs.find((h) => h.date === argentinaToday(new Date()));

  const listedAppt = await listPatientAppointmentPersist(patientId);
  const nextAppt = rows(appts).find(appt => appointmentHasNotEnded(appt, appointmentNow));
  const appointment = listedAppt ? listedAppt.appointment : mapScheduledAppointment(nextAppt);
  const appointment_history = listedAppt?.history ?? [];

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
    steps: todayHabit?.steps ?? null,
    appointment,
    appointment_history,
    resource_assignments: resourceAssignments.get(patientId) ?? [],
  };
}

function mapScheduledAppointment(nextAppt: Record<string, unknown> | undefined | null): Patient['appointment'] {
  if (!nextAppt?.starts_at) return null;
  const reply = nextAppt.patient_reply;
  return {
    when: formatAppointmentWhen(String(nextAppt.starts_at)),
    duration: Number(nextAppt.duration_min),
    channel: String(nextAppt.channel),
    starts_at: String(nextAppt.starts_at),
    ...(nextAppt.meet_url ? { meet_url: String(nextAppt.meet_url) } : {}),
    ...(typeof nextAppt.timezone === 'string' && nextAppt.timezone ? { timezone: String(nextAppt.timezone) } : {}),
    ...(reply === 'attending' || reply === 'needs_change' ? { patient_reply: reply } : {}),
    ...(nextAppt.confirmed_at ? { confirmed_at: String(nextAppt.confirmed_at) } : {}),
  };
}

export async function sbGetProfileRole(userId: string): Promise<'nutri' | 'paciente' | null> {
  const sb = getRequestDb();
  const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role === 'nutri' || data?.role === 'paciente' ? data.role : null;
}

export async function sbGetActor(userId: string): Promise<Actor | null> {
  const role = await sbGetProfileRole(userId);
  const sb = getRequestDb();

  if (role === 'nutri') {
    const { data } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
    return data?.id ? { role, userId, nutritionistId: data.id } : null;
  }

  if (role === 'paciente') {
    const { data } = await sb.from('patients_patient_view').select('id').eq('user_id', userId).maybeSingle();
    return data?.id ? { role, userId, patientId: data.id } : null;
  }

  return null;
}

export async function sbGetPatientResource(patientId: string): Promise<PatientResource | null> {
  const sb = getRequestDb();
  const { data } = await sb.from('patient_access_view').select('id,nutritionist_id,billing_status,billing_until').eq('id', patientId).maybeSingle();
  if (!data?.id || !data.nutritionist_id) return null;
  return {
    id: data.id,
    nutritionistId: data.nutritionist_id,
    billing_status: data.billing_status ?? 'pending',
    billing_until: data.billing_until ?? null,
  };
}

export type PatientListPage = {
  patients: Patient[];
  page: ListPage;
};

export async function sbListPatientsForNutri(userId: string, query: { offset: number; limit: number }): Promise<PatientListPage> {
  const sb = getRequestDb();
  const { data: nutri } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  if (!nutri) return { patients: [], page: { offset: query.offset, limit: query.limit, has_more: false } };

  const end = query.offset + query.limit;
  const { data: rowsData } = await sb.from('patients')
    .select(patientTableColumns.professional)
    .eq('nutritionist_id', nutri.id)
    .order('full_name', { ascending: true })
    .range(query.offset, end);

  const listed = rows(rowsData);
  const hasMore = listed.length > query.limit;
  const pageRows = hasMore ? listed.slice(0, query.limit) : listed;
  const ids = pageRows.map((patientRow) => String(patientRow.id));

  const nextByPatient = new Map<string, Record<string, unknown>>();
  const appointmentNow = new Date();
  if (ids.length > 0) {
    // Sin permiso de tabla para la nutricionista: lo lee el servidor, sólo de las pacientes de esta página
    // (salieron de su consulta con permisos de fila).
    const { data: appts } = await privilegedDb().from('appointments')
      .select(appointmentColumns.professional)
      .in('patient_id', ids)
      .eq('status', 'scheduled')
      .gte('starts_at', appointmentReadSince(appointmentNow))
      .order('starts_at', { ascending: true });
    for (const appt of rows(appts)) {
      if (!appointmentHasNotEnded(appt, appointmentNow)) continue;
      const patientId = String(appt.patient_id);
      if (!nextByPatient.has(patientId)) nextByPatient.set(patientId, appt);
    }
  }

  const [archivedAt, resourceAssignments] = await Promise.all([loadArchivedAt(ids), loadResourceAssignments(ids)]);
  return {
    patients: pageRows.map((patientRow) => mapPatient({ ...patientRow, archived_at: archivedAt.get(String(patientRow.id)) ?? null }, {
      appointment: mapScheduledAppointment(nextByPatient.get(String(patientRow.id))),
      resource_assignments: resourceAssignments.get(String(patientRow.id)) ?? [],
    }, 'professional')),
    page: { offset: query.offset, limit: query.limit, has_more: hasMore },
  };
}

async function loadResourceAssignments(ids: string[]) {
  const grouped = new Map<string, NonNullable<Patient['resource_assignments']>>();
  if (!ids.length) return grouped;
  // La sesión y las reglas de ambas tablas delimitan las asignaciones visibles.
  const { data, error } = await getRequestDb().from('resource_assignments')
    .select('id,patient_id,assigned_at,first_read_at,resources!inner(slug)').in('patient_id', ids);
  if (error) throwWriteError(error);
  for (const assignment of rows(data)) {
    const resource = row(assignment.resources);
    if (typeof resource?.slug !== 'string') throw new Error('Resource assignment returned no slug');
    const patientId = String(assignment.patient_id);
    const list = grouped.get(patientId) ?? [];
    list.push({id:String(assignment.id),patient_id:patientId,resource_id:resource.slug,assigned_at:String(assignment.assigned_at),read_at:assignment.first_read_at == null ? null : String(assignment.first_read_at)});
    grouped.set(patientId, list);
  }
  return grouped;
}

// archived_at llega con la migración 20260928140000; si la base todavía no la
// tiene, la lista sigue funcionando y nadie figura archivado.
async function loadArchivedAt(ids: string[]): Promise<Map<string, string | null>> {
  const archived = new Map<string, string | null>();
  if (ids.length === 0) return archived;
  const { data, error } = await getRequestDb().from('patients').select('id,archived_at').in('id', ids);
  if (error) return archived;
  for (const patientRow of rows(data)) {
    archived.set(String(patientRow.id), (patientRow.archived_at as string | null) ?? null);
  }
  return archived;
}

export async function sbGetPatientsForNutri(userId: string): Promise<Patient[]> {
  const listed = await sbListPatientsForNutri(userId, { offset: 0, limit: 100 });
  return listed.patients;
}

export async function sbGetPatientForUser(userId: string): Promise<Patient | null> {
  const sb = getRequestDb();
  const { data } = await sb.from('patients_patient_view').select(patientTableColumns.patient).eq('user_id', userId).maybeSingle();
  const patientRow = row(data);
  if (!patientRow) return null;
  const extras = await loadPatientExtras(patientRow.id as string, 'patient');
  return mapPatient(patientRow, extras, 'patient');
}

export async function sbGetPatientById(id: string, audience: QueryAudience = 'professional'): Promise<Patient | null> {
  const sb = getRequestDb();
  const { data } = await sb.from(audience === 'patient' ? 'patients_patient_view' : 'patients').select(patientTableColumns[audience]).eq('id', id).maybeSingle();
  const patientRow = row(data);
  if (!patientRow) return null;
  const extras = await loadPatientExtras(patientRow.id as string, audience);
  if (audience === 'professional') {
    const archivedAt = await loadArchivedAt([String(patientRow.id)]);
    return mapPatient({ ...patientRow, archived_at: archivedAt.get(String(patientRow.id)) ?? null }, extras, audience);
  }
  return mapPatient(patientRow, extras, audience);
}

export async function sbAddMealLog(patientId: string, log: Omit<MealLog, 'id' | 'patient_id' | 'logged_at' | 'status'>): Promise<MealLog> {
  const sb = getRequestDb();
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
  const sb = getRequestDb();
  const weekday = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]);
  const slotEnum = SLOT_LABEL_TO_ENUM[slot];
  if (weekday < 0 || !slotEnum) throw new Error('Invalid menu day or slot');
  const { error } = await sb.from('meal_slots').upsert(
    { patient_id: patientId, weekday, slot: slotEnum, title },
    { onConflict: 'patient_id,weekday,slot' },
  );
  if (error) throwWriteError(error);
}

export async function sbDeleteMenuSlot(patientId: string, day: string, slot: string): Promise<void> {
  const sb = getRequestDb();
  const weekday = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]);
  const slotEnum = SLOT_LABEL_TO_ENUM[slot];
  if (weekday < 0 || !slotEnum) throw new Error('Invalid menu day or slot');
  const { error } = await sb.from('meal_slots').delete()
    .eq('patient_id', patientId)
    .eq('weekday', weekday)
    .eq('slot', slotEnum);
  if (error) throwWriteError(error);
}

export async function sbUpdateMealLog(patientId: string, mealId: string, patch: Partial<MealLog>): Promise<MealLog | null> {
  const sb = getRequestDb();
  const { data, error } = await sb.from('meal_logs').update({
    status: patch.status,
    foods: patch.foods,
    macros: patch.macros,
  }).eq('id', mealId).eq('patient_id', patientId).select().single();
  if (error) return null;
  return mapMealLog(data);
}

export async function sbSetBrief(patientId: string, nutritionistId: string, brief: Brief): Promise<void> {
  const sb = getRequestDb();
  // La nutricionista no tiene permiso de tabla sobre los briefs: los escribe el servidor, que ya
  // comprobó en la ruta que la paciente es de su consultorio.
  const admin = privilegedDb();
  // Not transactional yet: a later RPC in PV-08 must make delete/insert/update atomic.
  const { error: deleteError } = await admin.from('ai_briefs').delete().eq('patient_id', patientId).eq('status', 'pending_review');
  if (deleteError) throw deleteError;
  if (brief.suggested_action) {
    const { error: insertError } = await admin.from('ai_briefs').insert({
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
    if (insertError) throw insertError;
  }
  const { error: updateError } = await sb.from('patients').update({ adherence_why: brief.adherence_why }).eq('id', patientId);
  if (updateError) throw updateError;
}

export type ReminderConfig = { kind: string; time: string; enabled: boolean };

export async function sbUpsertReminder(patientId: string, kind: string, timeLocal: string, enabled = true): Promise<void> {
  const sb = getRequestDb();
  const kindEnum = REMINDER_LABEL_TO_ENUM[kind];
  if (!kindEnum) throw new Error(`Invalid reminder kind: ${kind}`);
  const { error } = await sb.from('reminders').upsert(
    { patient_id: patientId, kind: kindEnum, time_local: timeLocal, enabled },
    { onConflict: 'patient_id,kind,time_local' },
  );
  if (error) throw error;
}

export async function sbDeleteReminder(patientId: string, kind: string, timeLocal: string): Promise<void> {
  const sb = getRequestDb();
  const kindEnum = REMINDER_LABEL_TO_ENUM[kind];
  if (!kindEnum) throw new Error(`Invalid reminder kind: ${kind}`);
  const { error } = await sb.from('reminders').delete()
    .eq('patient_id', patientId)
    .eq('kind', kindEnum)
    .eq('time_local', timeLocal);
  if (error) throw error;
}

export async function sbGetReminderConfig(patientId: string): Promise<ReminderConfig[]> {
  const sb = getRequestDb();
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
  const sb = getRequestDb();
  const { error } = await sb.from('timeline_events').insert({
    patient_id: patientId,
    kind: event.kind,
    visibility: event.visibility ?? 'professional',
    title: event.title,
    body: event.body,
    occurred_at: new Date().toISOString(),
  });
  if (error) throwWriteError(error);
}

/**
 * Para acciones de la paciente: RLS sólo deja escribir la línea de tiempo a la
 * profesional (RLS-11). La acción principal ya quedó guardada, así que si el
 * evento no entra se registra en el log y no se devuelve error.
 */
export async function sbAddTimelineEventBestEffort(
  patientId: string,
  event: { kind: string; title: string; body: string; visibility?: 'professional' | 'patient' },
): Promise<void> {
  try {
    await sbAddTimelineEvent(patientId, event);
  } catch (error) {
    writeOpsLog('warn', 'timeline_write_skipped', {
      kind: event.kind,
      message: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? 'unknown'),
    });
  }
}

export async function sbSetAppointment(
  patientId: string,
  nutritionistId: string,
  appointment: { day: string; time: string; duration: number; channel: string; meet_url?: string } | null,
): Promise<void> {
  const sb = getRequestDb();
  // El dominio v0 tiene una sola consulta vigente por paciente: se reemplaza.
  const { error: deleteError } = await sb.from('appointments').delete()
    .eq('patient_id', patientId).eq('status', 'scheduled');
  if (deleteError) throwWriteError(deleteError);
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
  if (error) throwWriteError(error);
}

export async function sbDismissBrief(patientId: string, dismissedBy: string): Promise<void> {
  // Sin permiso de tabla para la nutricionista: lo escribe el servidor tras autorizar la ruta.
  const sb = privilegedDb();
  // Sólo el brief pendiente: si ya estaba dismissed/done, es un no-op idempotente.
  const { error } = await sb.from('ai_briefs').update({
    status: 'dismissed',
    dismissed_at: new Date().toISOString(),
    dismissed_by: dismissedBy,
  }).eq('patient_id', patientId).eq('status', 'pending_review');
  if (error) throwWriteError(error);
}

export async function sbUpdateHabits(patientId: string, data: { hydration?: number; energy?: string | null; sleep_minutes?: number | null; steps?: number | null }): Promise<void> {
  const sb = getRequestDb();
  const today = argentinaToday(new Date());
  const { data: existing } = await sb.from('habit_logs').select('*')
    .eq('patient_id', patientId).eq('date', today).maybeSingle();

  const payload: Record<string, unknown> = {
    patient_id: patientId,
    date: today,
    ...(existing ? {
      hydration: existing.hydration,
      energy: existing.energy,
      sleep_minutes: existing.sleep_minutes,
      // Sólo si la columna existe: la app puede publicarse antes que la migración de pasos.
      ...('steps' in existing ? { steps: existing.steps } : {}),
    } : {}),
  };
  if (data.hydration !== undefined) { payload.hydration = data.hydration; payload.hydration_declared = true; }
  if (data.energy !== undefined) payload.energy = data.energy;
  if (data.sleep_minutes !== undefined) payload.sleep_minutes = data.sleep_minutes;
  if (data.steps !== undefined) payload.steps = data.steps;

  const { error } = await sb.from('habit_logs').upsert(payload, { onConflict: 'patient_id,date' });
  if (error) throwWriteError(error);
}

export async function sbUpdatePatientProfile(patientId: string, input: {
  name?: string;
  status?: string;
  stage?: Patient['stage'];
  sensitive_hours?: string;
  plan_b?: string;
  next_focus?: string;
}): Promise<void> {
  const sb = getRequestDb();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    patch.full_name = input.name;
    patch.initials = patientInitials(input.name);
  }
  if (input.status !== undefined) patch.status = input.status;
  if (input.stage !== undefined) patch.stage = input.stage;
  if (input.sensitive_hours !== undefined) patch.sensitive_hours = input.sensitive_hours;
  if (input.plan_b !== undefined) patch.plan_b = input.plan_b;
  if (input.next_focus !== undefined) patch.next_focus = input.next_focus;
  const { error } = await sb.from('patients').update(patch).eq('id', patientId);
  if (error) throwWriteError(error);
}

export async function sbUpdateGoal(patientId: string, goal: string): Promise<void> {
  const sb = getRequestDb();
  const { error } = await sb.from('patients').update({ goal }).eq('id', patientId);
  if (error) throwWriteError(error);
}

export type ScheduledAppointment = {
  day: string;
  time: string;
  duration: number;
  channel: string;
  meet_url?: string;
};

export async function sbGetScheduledAppointment(patientId: string): Promise<ScheduledAppointment | null> {
  const sb = getRequestDb();
  const { data, error } = await sb.from('appointments')
    .select(appointmentColumns.professional)
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throwWriteError(error);
  const next = row(data);
  if (!next?.starts_at) return null;
  const when = formatAppointmentWhen(String(next.starts_at)).split(' · ');
  return {
    day: when[0] ?? '',
    time: when[1] ?? '',
    duration: Number(next.duration_min),
    channel: String(next.channel),
    ...(next.meet_url ? { meet_url: String(next.meet_url) } : {}),
  };
}

export async function sbAddMessage(patientId: string, nutritionistId: string, authorId: string, text: string, suggestedByAi: boolean): Promise<void> {
  const sb = getRequestDb();
  const { error } = await sb.from('messages').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    author_id: authorId,
    body: text,
    suggested_by_ai: suggestedByAi,
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function sbGetNutritionistId(userId: string): Promise<string | null> {
  const sb = getRequestDb();
  const { data } = await sb.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  return data?.id ?? null;
}

// Una cuenta ya vinculada como paciente no se convierte en profesional: su
// ficha y su historial dependen de otra nutricionista.
export async function sbUserHasPatientLink(userId: string): Promise<boolean> {
  const { data, error } = await privilegedDb().from('patients').select('id').eq('user_id', userId).limit(1);
  if (error) throw error;
  return rows(data).length > 0;
}

export async function sbEnsureNutritionist(userId: string, displayName: string): Promise<string> {
  const existing = await sbGetNutritionistId(userId);
  if (existing) return existing;
  return sbProvisionNutritionist({ userId, displayName });
}

export class SchemaUnavailableError extends Error {
  constructor(message = 'Persistent invite schema is not available') {
    super(message);
    this.name = 'SchemaUnavailableError';
  }
}

export class UniqueInviteError extends Error {
  constructor(message = 'Ya existe una invitación para ese email') {
    super(message);
    this.name = 'UniqueInviteError';
  }
}

function isMissingRelation(error: { code?: string; message?: string } | null | undefined): boolean {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`;
  return /42P01|PGRST205|schema cache|does not exist/i.test(text);
}

function throwWriteError(error: { code?: string; message?: string } | null): never {
  if (isMissingRelation(error)) throw new SchemaUnavailableError();
  if (error?.code === '23505') throw new UniqueInviteError();
  throw error ?? new Error('Database write failed');
}

function patientInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
}

function mapInvite(row: Record<string, unknown>): PatientInvite {
  return publicInviteView({
    id: row.id as string,
    patient_id: row.patient_id as string,
    nutritionist_id: row.nutritionist_id as string,
    email: row.email as string,
    status: row.status as PatientInvite['status'],
    invited_at: (row.invited_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    accepted_at: (row.accepted_at as string | null) ?? null,
    accepted_by: (row.accepted_by as string | null) ?? null,
    revoked_at: (row.revoked_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | null) ?? (row.created_at as string),
  });
}

export async function sbCreatePatient(input: {
  nutritionistId: string;
  name: string;
  email: string;
  goal: string;
}): Promise<{ patient: Patient; invite: PatientInvite }> {
  const sb=getRequestDb();
  const {data,error}=await sb.rpc('create_patient_with_invite',{payload:{name:input.name,email:input.email,goal:input.goal}});
  if(error){if(error.code==='PT409')throw new UniqueInviteError();throwWriteError(error);}
  const saved=row(data);const inviteRow=row(saved?.invite);
  if(!saved||!inviteRow)throw new Error('Patient creation returned no invitation');
  const patient=await sbGetPatientById(String(saved.patient_id),'professional');
  if(!patient)throw new Error('Created patient is not accessible');
  return {patient,invite:mapInvite(inviteRow)};
}

export async function sbGetInvite(inviteId: string): Promise<PatientInvite | null> {
  const sb = getRequestDb();
  const { data, error } = await sb.from('patient_invites').select('*').eq('id', inviteId).maybeSingle();
  if (error) throwWriteError(error);
  const mapped = row(data);
  return mapped ? mapInvite(mapped) : null;
}

// El historial de invitaciones es sólo del servidor (la tabla no tiene reglas
// para usuarias). Antes se escribía con la sesión de la nutricionista y la base
// lo rechazaba sin avisar: se perdía. La invitación ya se validó con su sesión.
async function logInviteEvent(inviteId: string, event: 'created' | 'sent' | 'resent' | 'revoked'): Promise<void> {
  try {
    const { error } = await privilegedDb().from('patient_invite_events').insert({ invite_id: inviteId, event });
    if (error) writeOpsLog('warn', 'invite_event_failed', { event, code: error.code ?? 'unknown' });
  } catch {
    writeOpsLog('warn', 'invite_event_failed', { event, code: 'no_admin' });
  }
}

export async function sbSendInvite(inviteId: string, ttlMs = 7 * 24 * 60 * 60 * 1000): Promise<PatientInvite> {
  const current = await sbGetInvite(inviteId);
  if (current?.status === 'accepted') return current;
  if (!current || (current.status !== 'not_sent' && current.status !== 'pending')) {
    throw new Error('Invite unavailable');
  }
  const now = new Date();
  const event = current.status === 'pending' ? 'resent' : 'sent';
  // La nutricionista sólo puede leer y crear invitaciones (permiso de tabla); el cambio de estado lo hace
  // el servidor. `current` ya salió con su sesión, así que la invitación es de su consultorio.
  const sb = privilegedDb();
  const { data, error } = await sb.from('patient_invites').update({
    status: 'pending',
    invited_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    updated_at: now.toISOString(),
  }).eq('id', inviteId).in('status', ['not_sent', 'pending']).select('*').maybeSingle();
  if (error) throwWriteError(error);
  if (!data) {
    // La aceptación puede ocurrir después de la lectura. No reabrir su enlace.
    const latest = await sbGetInvite(inviteId);
    if (latest?.status === 'accepted') return latest;
    throw new Error('Invite unavailable');
  }
  await logInviteEvent(inviteId, event);
  return mapInvite(row(data) ?? {});
}

export async function sbRevokeInvite(inviteId: string): Promise<PatientInvite> {
  const current = await sbGetInvite(inviteId);
  if (!current || (current.status !== 'not_sent' && current.status !== 'pending')) {
    throw new Error('Invite unavailable');
  }
  const now = new Date().toISOString();
  // Igual que al enviar: `current` salió con la sesión de la nutricionista; el cambio lo hace el servidor.
  const sb = privilegedDb();
  const { data, error } = await sb.from('patient_invites').update({
    status: 'revoked',
    revoked_at: now,
    updated_at: now,
  }).eq('id', inviteId).in('status', ['not_sent', 'pending']).select('*').maybeSingle();
  if (error) throwWriteError(error);
  if (!data) throw new Error('Invite unavailable');
  await logInviteEvent(inviteId, 'revoked');
  return mapInvite(row(data) ?? {});
}

/**
 * Deja lista una invitación para compartir por enlace: reusa la vigente
 * (renovando el vencimiento) o abre una nueva con el mismo email si la anterior
 * venció o se revocó. null si la paciente ya vinculó su cuenta.
 */
export async function sbRenewPatientInvite(patientId: string, nutritionistId: string): Promise<PatientInvite | null> {
  const sb = getRequestDb();
  const { data, error } = await sb.from('patient_invites').select('*')
    .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10);
  if (error) throwWriteError(error);
  const invites = rows(data).map(mapInvite);
  if (!invites.length || invites.some((invite) => invite.status === 'accepted')) return null;
  const open = invites.find((invite) => invite.status === 'not_sent' || invite.status === 'pending');
  if (open) return sbSendInvite(open.id);
  const { data: created, error: createError } = await sb.from('patient_invites').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    email: invites[0].email,
    status: 'not_sent',
  }).select('*').single();
  if (createError || !created) throwWriteError(createError);
  const invite = mapInvite(row(created) ?? {});
  await logInviteEvent(invite.id, 'created');
  return sbSendInvite(invite.id);
}

export async function sbAcceptInvite(inviteId: string): Promise<string> {
  const sb = getRequestDb();
  const { data, error } = await sb.rpc('accept_patient_invite', { invite_id: inviteId });
  if (error) {
    if (isMissingRelation(error)) throw new SchemaUnavailableError();
    const message = error.message ?? '';
    if (/unconfirmed|email_confirmed/i.test(message)) {
      throw Object.assign(new Error('Confirmá tu email para aceptar la invitación'), { code: 'unconfirmed_email' });
    }
    throw Object.assign(new Error('Invitación no disponible'), { code: 'invite_unavailable' });
  }
  return String(data);
}

export async function sbProvisionNutritionist(input: {
  userId: string;
  displayName: string;
  license?: string | null;
  monthlyFee?: number | null;
}): Promise<string> {
  const sb = privilegedDb();
  const { data, error } = await sb.rpc('provision_nutritionist', {
    target_user_id: input.userId,
    display_name: input.displayName,
    license_value: input.license ?? null,
    monthly_fee_value: input.monthlyFee ?? null,
  });
  if (error) {
    if (isMissingRelation(error)) throw new SchemaUnavailableError();
    throw error;
  }
  return String(data);
}

export async function sbRequestPasswordRecovery(email: string, redirectTo?: string): Promise<void> {
  const sb = privilegedDb();
  const { error } = await sb.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  if (error && !isMissingRelation(error)) {
    return;
  }
}

export function computeShoppingList(patient: Patient): string[] {
  const items = new Set<string>();
  for (const day of patient.weekPlan) for (const meal of day.meals) items.add(meal.title);
  for (const meal of patient.todayPlan) items.add(meal.title);
  return [...items];
}
