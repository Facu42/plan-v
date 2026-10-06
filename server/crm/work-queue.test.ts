import { describe, expect, it } from 'vitest';
import { asAiJob } from '../ai-jobs/repository.js';
import { buildWorkItems, readAllRows, type WorkScope, type WorkSnapshot } from './repository.js';
import { paginateWorkQueue, workQueueQuerySchema } from './work-queue.js';

const at = '2026-10-05T15:00:00.000Z';
const scope: WorkScope = { nutritionistId: 'consultorio-a', actorId: 'nutri-a', persistent: true,
  patients: [{ id: 'patient-a', name: 'Paciente A' }, { id: 'patient-archived', name: 'Archivada', archived_at: at }] };
const empty = (): WorkSnapshot => ({ intakes: [], meals: [], jobs: [], messages: [], records: [], appointments: [], ledgers: [], consents: new Map([['patient-a', ['measurement', 'ai_menu_draft']]]) });
const job = (id: string, status: string, applied_at: string | null = null) => asAiJob({
  id, status, applied_at, patient_id: 'patient-a', job_type: 'menu_draft', prompt_version: 'v2', context_hash: 'hash', created_at: at,
  request: { period_start: '2026-10-05', period_end: '2026-10-11' },
  artifact: { id: 'private-artifact', kind: 'menu_draft', payload: { clinical_notes: 'nota privada', recipe: 'borrador privado' }, created_at: at },
});

describe('Bandeja del consultorio: pendientes, privacidad y paginación', () => {
  it('aísla pacientes ajenos, archivados y datos de origen en todas las categorías', () => {
    const snapshot = empty();
    for (const id of ['patient-a', 'patient-b', 'patient-archived']) {
      snapshot.intakes.push({ id: `intake-${id}`, patient_id: id, status: 'submitted', updated_at: at });
      snapshot.meals.push({ id: `meal-${id}`, patient_id: id, slot: 'Almuerzo', status: 'pending_review', logged_at: at });
      snapshot.messages.push({ id: `message-${id}`, patient_id: id, from: 'patient', sent_at: at });
      snapshot.records.push({ id: `record-${id}`, patient_id: id, kind: 'activity', created_at: at, reviewed_at: null });
      snapshot.appointments.push({ id: `appointment-${id}`, patient_id: id, status: 'scheduled', starts_at: at });
      snapshot.ledgers.push({ patient_id: id, fee: null, charges: [], payments: [{ id: `payment-${id}`, amount: 20000, method: 'efectivo', paid_on: '2026-10-05', note: 'referencia privada', reported_by_patient: true, status: 'reported', created_at: at }] });
    }
    snapshot.jobs.push(job('job-a', 'succeeded'));
    const result = buildWorkItems(scope, snapshot, new Date(at));
    expect(result).toHaveLength(7);
    expect(new Set(result.map(item => item.patient_id))).toEqual(new Set(['patient-a']));
    expect(result.every(item => item.href.includes('paciente=patient-a'))).toBe(true);
    expect(result.find(item => item.kind === 'ai_menu')).toMatchObject({ href: '/crm/plan?paciente=patient-a&propuesta=job-a', period: { start: '2026-10-05', end: '2026-10-11' } });
    expect(JSON.stringify(result)).not.toMatch(/nota privada|borrador privado|referencia privada|private-artifact|amount|clinical_notes/);
  });

  it('retira tareas resueltas y conserva IA obsoleta o fallida con una recuperación visible', () => {
    const snapshot = empty();
    snapshot.jobs = [job('ready', 'succeeded'), job('applied', 'succeeded', at), job('rejected', 'cancelled'), job('stale', 'stale'), job('failed', 'failed')];
    snapshot.intakes = [{ id: 'reviewed', patient_id: 'patient-a', status: 'reviewed', updated_at: at }];
    snapshot.meals = [{ id: 'confirmed', patient_id: 'patient-a', status: 'confirmed', slot: 'Cena', logged_at: at }];
    snapshot.messages = [{ id: 'read', patient_id: 'patient-a', from: 'patient', read_at: at, sent_at: at }, { id: 'sent', patient_id: 'patient-a', from: 'vero', sent_at: at }];
    snapshot.records = [{ id: 'reviewed', patient_id: 'patient-a', kind: 'activity', reviewed_at: at, created_at: at }];
    const items = buildWorkItems(scope, snapshot, new Date(at));
    expect(items.map(item => item.id)).toEqual(['ai_menu:ready', 'ai_menu:stale', 'ai_menu:failed']);
    expect(items.find(item => item.id === 'ai_menu:stale')?.title).toContain('regenerar');
    snapshot.consents.set('patient-a', []);
    expect(buildWorkItems(scope, snapshot).map(item => item.status)).toEqual(['permission_required', 'permission_required', 'permission_required']);
  });

  it('oculta registros sensibles después de retirar el permiso y evita revisar datos ya cargados por la profesional', () => {
    const snapshot = empty();
    snapshot.records = [
      { id: 'body', patient_id: 'patient-a', kind: 'body_photo', created_at: at, reviewed_at: null },
      { id: 'document', patient_id: 'patient-a', kind: 'clinical_document', created_at: at, reviewed_at: null },
      { id: 'weight', patient_id: 'patient-a', kind: 'weight', source: 'patient', created_at: at, reviewed_at: null },
      { id: 'professional', patient_id: 'patient-a', kind: 'weight', source: 'professional', created_at: at, reviewed_at: null },
    ];
    expect(buildWorkItems(scope, snapshot).map(item => item.id)).toEqual(['record:weight']);
    snapshot.consents.set('patient-a', ['body_progress', 'clinical_document']);
    expect(buildWorkItems(scope, snapshot).map(item => item.id)).toEqual(['record:body', 'record:document']);
  });

  it('muestra consultas del día de Buenos Aires y pedidos futuros de reprogramación', () => {
    const snapshot = empty();
    snapshot.appointments = [
      { id: 'today', patient_id: 'patient-a', status: 'scheduled', starts_at: '2026-10-06T01:00:00Z' },
      { id: 'tomorrow', patient_id: 'patient-a', status: 'scheduled', starts_at: '2026-10-06T15:00:00Z' },
      { id: 'change', patient_id: 'patient-a', status: 'scheduled', starts_at: '2026-10-07T15:00:00Z', patient_reply: 'needs_change' },
      { id: 'cancelled', patient_id: 'patient-a', status: 'cancelled', starts_at: at },
      { id: 'past', patient_id: 'patient-a', status: 'scheduled', starts_at: '2026-10-04T15:00:00Z' },
    ];
    expect(buildWorkItems(scope, snapshot, new Date(at)).map(item => item.id)).toEqual(['appointment:today', 'appointment:change']);
  });

  it('pagina sin duplicados aun con fechas iguales y deriva contadores del mismo conjunto', () => {
    const snapshot = empty();
    snapshot.meals = Array.from({ length: 61 }, (_, index) => ({ id: `meal-${String(index).padStart(2, '0')}`, patient_id: 'patient-a', status: 'pending_review', slot: 'Cena', logged_at: at }));
    snapshot.messages = [{ id: 'message', patient_id: 'patient-a', from: 'patient', sent_at: at }];
    const items = buildWorkItems(scope, snapshot, new Date(at));
    const first = paginateWorkQueue(items, { patient_id: 'patient-a', kind: 'meal', limit: 30 }, scope.nutritionistId, 'supabase');
    expect(first.total).toBe(61);
    expect(first.counts).toMatchObject({ meal: 61, message: 1 });
    expect(first.items).toHaveLength(30);
    const second = paginateWorkQueue(items, { patient_id: 'patient-a', kind: 'meal', limit: 30, cursor: first.next_cursor! }, scope.nutritionistId, 'supabase');
    const third = paginateWorkQueue(items, { patient_id: 'patient-a', kind: 'meal', limit: 30, cursor: second.next_cursor! }, scope.nutritionistId, 'supabase');
    expect(new Set([...first.items, ...second.items, ...third.items].map(item => item.id)).size).toBe(61);
    expect(third.next_cursor).toBeNull();
    expect(() => paginateWorkQueue(items, { cursor: first.next_cursor!, kind: 'message' }, scope.nutritionistId, 'supabase')).toThrow('filtros');
    expect(() => paginateWorkQueue(items, { cursor: first.next_cursor!, patient_id: 'patient-a', kind: 'meal' }, 'consultorio-b', 'supabase')).toThrow('filtros');
    expect(() => paginateWorkQueue(items, { cursor: 'invalid' }, scope.nutritionistId, 'supabase')).toThrow('filtros');
  });

  it('lee páginas de fuentes completas y devuelve un error si falla cualquiera de ellas', async () => {
    const calls: number[] = [];
    const result = await readAllRows(async (offset, end) => {
      calls.push(offset);
      return { data: Array.from({ length: Math.min(end + 1, 501) - offset }, (_, index) => ({ id: offset + index })), error: null };
    });
    expect(calls).toEqual([0, 250, 500]);
    expect(result).toHaveLength(501);
    await expect(readAllRows(async offset => ({ data: offset ? null : Array.from({ length: 250 }, () => ({})), error: offset ? { code: '08006' } : null }))).rejects.toThrow('toda la bandeja');
    await expect(readAllRows(async () => ({ data: null, error: null }))).rejects.toThrow('toda la bandeja');
    expect(workQueueQuerySchema.safeParse({ kind: 'all', limit: 0 }).success).toBe(false);
    expect(workQueueQuerySchema.safeParse({ nutritionist_id: 'consultorio-b' }).success).toBe(false);
  });
});
