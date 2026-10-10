import type { SupabaseClient } from '@supabase/supabase-js';
import type { CrmWorkItem, CrmWorkKind } from '../../src/types/crm-work.js';
import type { AiJobView } from '../../src/types/ai-jobs.js';
import type { PatientLedger } from '../../src/types/fees.js';
import { CARE_LABELS, type CareData } from '../../src/types/care.js';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { listCareRecords } from '../care/repository.js';
import { asAiJob, listAiJobs } from '../ai-jobs/repository.js';
import { getBoard } from '../fees/repository.js';
import { DEMO_NUTRITIONIST_ID, getStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { getPatientProgress } from '../progress/repository.js';
import { progressWindows } from '../progress/derive.js';
import { summarizePatient, totalsFor } from './progress-global.js';
import type { ProgressPeriodDays } from '../../src/types/progress.js';
import type { GlobalPatientProgress, GlobalProgressResponse } from '../../src/types/progress-global.js';

type Row = Record<string, unknown>;
export type WorkPatient = { id: string; name: string; user_id?: string | null; archived_at?: string | null; deactivated_at?: string | null; anonymized_at?: string | null };
export type WorkScope = { nutritionistId: string; actorId: string; persistent: boolean; patients: WorkPatient[] };
export type WorkSnapshot = {
  intakes: Array<{ id: string; patient_id: string; status: string; updated_at: string }>;
  meals: Array<{ id: string; patient_id: string; slot: string; status: string; logged_at: string }>;
  jobs: AiJobView[];
  messages: Array<{ id: string; patient_id: string; from: string; read_at?: string | null; sent_at: string }>;
  records: Array<{ id: string; patient_id: string; kind: CareData['kind']; source?: string; reviewed_at: string | null; created_at: string }>;
  appointments: Array<{ id: string; patient_id: string; status: string; starts_at: string; patient_reply?: string | null }>;
  ledgers: PatientLedger[];
  consents: Map<string, string[]>;
};

export function queueDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205', '42703'].includes(error.code ?? '')) {
    throw new CareError(501, 'La bandeja requiere actualizar los módulos de este entorno.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para consultar esta bandeja.');
  throw new CareError(503, 'No se pudo consultar toda la bandeja. Reintentá para recuperar los pendientes.');
}

/** Toda consulta se pagina; ningún contador se calcula sobre una muestra truncada. */
export async function readAllRows(makeQuery: (offset: number, end: number) => PromiseLike<{ data: unknown; error: { code?: string } | null }>): Promise<Row[]> {
  const result: Row[] = [];
  const size = 250;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await makeQuery(offset, offset + size - 1);
    queueDbError(error);
    if (!Array.isArray(data)) throw new CareError(503, 'No se pudo consultar toda la bandeja. Reintentá para recuperar los pendientes.');
    result.push(...data as Row[]);
    if (data.length < size) return result;
  }
}

export async function resolveWorkScope(actorId: string | null, persistent: boolean): Promise<WorkScope> {
  if (!persistent) return { nutritionistId: DEMO_NUTRITIONIST_ID, actorId: 'demo-nutri', persistent: false, patients: getStore().patients };
  if (!actorId) throw new CareError(403, 'Solo profesionales del consultorio.');
  const db = getRequestDb();
  const profile = await db.from('profiles').select('role').eq('id', actorId).maybeSingle();
  queueDbError(profile.error);
  if (profile.data?.role !== 'nutri') throw new CareError(403, 'Solo profesionales del consultorio.');
  const nutri = await db.from('nutritionists').select('id').eq('user_id', actorId).maybeSingle();
  queueDbError(nutri.error);
  if (!nutri.data?.id) throw new CareError(403, 'No encontramos tu consultorio.');
  const nutritionistId = String(nutri.data.id);
  const patients = await readAllRows((offset, end) => db.from('patients')
    .select('id,full_name,user_id,archived_at,deactivated_at,anonymized_at')
    .eq('nutritionist_id', nutritionistId).order('id').range(offset, end));
  return {
    nutritionistId, actorId, persistent: true,
    patients: patients.map(row => ({ id: String(row.id), name: String(row.full_name), user_id: row.user_id as string | null,
      archived_at: row.archived_at as string | null, deactivated_at: row.deactivated_at as string | null, anonymized_at: row.anonymized_at as string | null })),
  };
}

function activePatients(scope: WorkScope) {
  return scope.patients.filter(patient => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at);
}

async function scopedRows(db: SupabaseClient, table: string, columns: string, ids: string[], order: string, equals: Record<string, string | null> = {}): Promise<Row[]> {
  // Los lotes mantienen acotados los filtros en la URL, sin excluir consultorios grandes.
  const rows: Row[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    rows.push(...await readAllRows((offset, end) => {
      let query = db.from(table).select(columns).in('patient_id', batch).order(order).order('id');
      for (const [column, value] of Object.entries(equals)) query = value == null ? query.is(column, null) : query.eq(column, value);
      return query.range(offset, end);
    }));
  }
  return rows;
}

export async function loadWorkSnapshot(scope: WorkScope): Promise<WorkSnapshot> {
  const patients = activePatients(scope);
  const ids = patients.map(patient => patient.id);
  const snapshot: WorkSnapshot = { intakes: [], meals: [], jobs: [], messages: [], records: [], appointments: [], ledgers: [], consents: new Map() };
  if (!ids.length) return snapshot;

  if (!scope.persistent) {
    snapshot.ledgers = (await getBoard(false)).patients;
    const memory = new Map(getStore().patients.map(patient => [patient.id, patient]));
    for (const patient of patients) {
      const [bundle, jobs] = await Promise.all([
        currentCareConsents(patient.id, false), listAiJobs(scope.nutritionistId, patient.id, false),
      ]);
      snapshot.intakes.push(bundle.intake);
      snapshot.consents.set(patient.id, bundle.consented);
      snapshot.jobs.push(...jobs);
      const full = memory.get(patient.id)!;
      snapshot.meals.push(...full.meal_logs);
      snapshot.messages.push(...full.messages);
      if (full.appointment?.starts_at) snapshot.appointments.push({
        id: `appointment:${patient.id}`, patient_id: patient.id, status: 'scheduled',
        starts_at: full.appointment.starts_at, patient_reply: full.appointment.patient_reply,
      });
    }
    snapshot.records = (await listCareRecords(null, false)).map(record => ({
      id: record.id, patient_id: record.patient_id, kind: record.data.kind,
      source: 'source' in record.data ? record.data.source : undefined,
      reviewed_at: record.reviewed_at, created_at: record.created_at,
    }));
    return snapshot;
  }

  const db = getRequestDb();
  // En persistencia leer únicamente metadata con la sesión y sus políticas;
  // no cargar notas del ingreso, fotos, textos ni payloads de las propuestas.
  const [meals, records, messages, appointments, intakes, consents, jobs, board] = await Promise.all([
    scopedRows(db, 'meal_logs', 'id,patient_id,slot_label,status,logged_at', ids, 'logged_at', { status: 'pending_review' }),
    scopedRows(db, 'care_records', 'id,patient_id,kind:data->>kind,source:data->>source,reviewed_at,created_at', ids, 'created_at', { reviewed_at: null }),
    scopedRows(db, 'messages', 'id,patient_id,author_id,sent_at', ids, 'sent_at'),
    // Los turnos ya se leen con cliente del servidor en el directorio existente.
    // Nunca se consulta antes de obtener ids con RLS y el consultorio de la sesión.
    scopedRows(privilegedDb(), 'appointments', 'id,patient_id,status,starts_at,patient_reply', ids, 'starts_at', { status: 'scheduled' }),
    scopedRows(db, 'intake_sessions', 'id,patient_id,status,updated_at', ids, 'updated_at', { status: 'submitted' }),
    scopedRows(db, 'consent_events', 'id,patient_id,purpose,text_version,text_hash,decision,sequence', ids, 'sequence'),
    scopedRows(db, 'ai_jobs', 'id,patient_id,job_type,status,created_at,started_at,finished_at,applied_at,period_start:request->>period_start,period_end:request->>period_end', ids, 'created_at', { applied_at: null }),
    getBoard(true),
  ]);
  snapshot.ledgers = board.patients;
  snapshot.intakes = intakes.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), status: String(row.status), updated_at: String(row.updated_at) }));
  const latestConsents = new Map<string, Row>();
  for (const consent of consents) latestConsents.set(`${consent.patient_id}:${consent.purpose}`, consent);
  for (const patientId of ids) snapshot.consents.set(patientId, CONSENT_CATALOG.filter(text => {
    const latest = latestConsents.get(`${patientId}:${text.purpose}`);
    return latest?.decision === 'granted' && latest.text_version === text.text_version && latest.text_hash === text.text_hash;
  }).map(text => text.purpose));
  snapshot.jobs = jobs.map(row => asAiJob({ ...row, request: { period_start: row.period_start, period_end: row.period_end } }));
  snapshot.meals = meals.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), slot: String(row.slot_label), status: String(row.status), logged_at: String(row.logged_at) }));
  snapshot.records = records.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), kind: row.kind as CareData['kind'], source: row.source as string | undefined, reviewed_at: row.reviewed_at as string | null, created_at: String(row.created_at) }));
  snapshot.appointments = appointments.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), status: String(row.status), starts_at: String(row.starts_at), patient_reply: row.patient_reply as string | null }));

  const patientUsers = new Map(patients.map(patient => [patient.id, patient.user_id]));
  const incoming = messages.filter(row => row.sent_at && row.author_id && row.author_id === patientUsers.get(String(row.patient_id)));
  const readIds = new Set<string>();
  for (let index = 0; index < incoming.length; index += 100) {
    const messageIds = incoming.slice(index, index + 100).map(row => String(row.id));
    const receipts = await readAllRows((offset, end) => db.from('message_receipts')
      .select('message_id,read_at').eq('user_id', scope.actorId).in('message_id', messageIds).order('message_id').range(offset, end));
    for (const receipt of receipts) if (receipt.read_at) readIds.add(String(receipt.message_id));
  }
  snapshot.messages = incoming.map(row => ({ id: String(row.id), patient_id: String(row.patient_id), from: 'patient', sent_at: String(row.sent_at), read_at: readIds.has(String(row.id)) ? 'read' : null }));
  return snapshot;
}

function localDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(date);
}

function destination(kind: CrmWorkKind, patientId: string, entityId: string) {
  const params = new URLSearchParams({ paciente: patientId });
  if (kind === 'ai_menu') { params.set('propuesta', entityId); return `/crm/plan?${params}`; }
  if (kind === 'message') return `/crm/mensajes?${params}`;
  if (kind === 'payment') return `/crm/cobranzas?${params}`;
  params.set('seccion', kind === 'intake' ? 'ingreso' : kind === 'appointment' ? 'consultas' : 'registros');
  return `/crm/ficha?${params}`;
}

export function buildWorkItems(scope: WorkScope, snapshot: WorkSnapshot, now = new Date()): CrmWorkItem[] {
  const patients = new Map(activePatients(scope).map(patient => [patient.id, patient]));
  const items: CrmWorkItem[] = [];
  const add = (kind: CrmWorkKind, entityId: string, patientId: string, status: string, at: string, title: string, period?: CrmWorkItem['period']) => {
    const patient = patients.get(patientId);
    if (!patient) return;
    // La bandeja expone sólo metadata; no serializar objetos clínicos de origen.
    items.push({ id: `${kind}:${entityId}`, kind, patient_id: patientId, patient_name: patient.name,
      status, updated_at: at, href: destination(kind, patientId, entityId), title, ...(period ? { period } : {}) });
  };
  for (const intake of snapshot.intakes) if (intake.status === 'submitted') add('intake', intake.id, intake.patient_id, intake.status, intake.updated_at, 'Ingreso por revisar');
  for (const meal of snapshot.meals) if (meal.status === 'pending_review') add('meal', meal.id, meal.patient_id, meal.status, meal.logged_at, `Revisar comida · ${meal.slot}`);
  for (const job of snapshot.jobs) {
    if (job.job_type !== 'menu_draft' || job.applied_at || job.status === 'cancelled') continue;
    const permission = snapshot.consents.get(job.patient_id)?.includes('ai_menu_draft');
    const title = !permission ? 'Revisar permiso de IA' : job.status === 'succeeded' ? 'Propuesta de menú por aprobar'
      : job.status === 'stale' ? 'Propuesta de menú para regenerar' : job.status === 'failed' ? 'Generación de menú para reintentar' : 'Menú en preparación';
    const period = job.request.period_start && job.request.period_end ? { start: job.request.period_start, end: job.request.period_end } : undefined;
    add('ai_menu', job.id, job.patient_id, permission ? job.status : 'permission_required', job.finished_at ?? job.started_at ?? job.created_at, title, period);
  }
  for (const message of snapshot.messages) if (message.from === 'patient' && !message.read_at) add('message', message.id, message.patient_id, 'unread', message.sent_at, 'Mensaje sin leer');
  for (const ledger of snapshot.ledgers) for (const payment of ledger.payments) if (payment.status === 'reported') add('payment', payment.id, ledger.patient_id, payment.status, payment.created_at, 'Aviso de pago por confirmar');
  const today = localDate(now.toISOString());
  for (const appointment of snapshot.appointments) {
    if (appointment.status !== 'scheduled') continue;
    const day = localDate(appointment.starts_at);
    if (!day || day < today || (day !== today && appointment.patient_reply !== 'needs_change')) continue;
    add('appointment', appointment.id, appointment.patient_id, appointment.patient_reply ?? 'scheduled', appointment.starts_at,
      appointment.patient_reply === 'needs_change' ? 'Consulta para reprogramar' : 'Consulta de hoy');
  }
  for (const record of snapshot.records) {
    if (record.reviewed_at || record.kind === 'payment' || record.source === 'professional') continue;
    const needed = record.kind === 'body_photo' ? 'body_progress' : record.kind === 'clinical_document' ? 'clinical_document'
      : ['weight', 'waist', 'hip'].includes(record.kind) ? 'measurement' : null;
    if (needed && !snapshot.consents.get(record.patient_id)?.includes(needed)) continue;
    add('record', record.id, record.patient_id, 'pending_review', record.created_at, `Revisar registro · ${CARE_LABELS[record.kind] ?? 'Registro'}`);
  }
  return items;
}

/** Resumen de progreso de toda la cartera: reutiliza el cálculo por paciente (mismo permiso y mismas reglas de consentimiento). */
export async function loadGlobalProgress(scope: WorkScope, days: ProgressPeriodDays, now = new Date()): Promise<GlobalProgressResponse> {
  const patients = activePatients(scope);
  const rows: GlobalPatientProgress[] = [];
  const unavailable: GlobalProgressResponse['unavailable'] = [];
  let windows = progressWindows(days, now);
  for (let index = 0; index < patients.length; index += 5) {
    const batch = patients.slice(index, index + 5);
    const results = await Promise.allSettled(batch.map(patient => getPatientProgress(patient.id, days, scope.persistent)));
    results.forEach((result, position) => {
      const patient = batch[position]!;
      if (result.status === 'rejected') { unavailable.push({ patient_id: patient.id, patient_name: patient.name }); return; }
      windows = { current: result.value.current, previous: result.value.previous };
      rows.push(summarizePatient(patient.id, patient.name, result.value));
    });
  }
  rows.sort((a, b) => a.patient_name.localeCompare(b.patient_name, 'es-AR'));
  return { period_days: days, ...windows, patients: rows, totals: totalsFor(rows, unavailable.length), unavailable, source: scope.persistent ? 'supabase' : 'memory' };
}
