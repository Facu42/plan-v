import { getRequestDb } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { enqueueOutboxEvent, outboxDbError } from '../outbox/repository.js';
import type { OutboxSnapshot } from '../../src/types/outbox.js';
import type { WorkScope } from './repository.js';
import { buildAccompanimentMetrics } from './accompaniment.js';
/** La guardia persistente y el alta del aviso se ejecutan en una única función SQL. */
export async function enqueueFollowupReminder(scope: WorkScope, patientId: string, requestId: string): Promise<OutboxSnapshot | null> {
    if (scope.persistent) {
        const { data, error } = await getRequestDb().rpc('enqueue_followup_reminder', { target_patient: patientId, request_id: requestId });
        outboxDbError(error);
        if (data?.skipped === true)
            return null;
        if (!data || !Array.isArray(data.deliveries) || !data.event)
            throw new Error('No pudimos verificar el aviso.');
        return data as OutboxSnapshot;
    }
    const patient = getPatient(patientId);
    if (!patient || patient.archived_at || patient.deactivated_at || patient.anonymized_at)
        return null;
    const current = buildAccompanimentMetrics({ patients: [patient], meals: patient.meal_logs.map(m => ({ ...m, slot: m.slot })), habits: patient.habit_logs, activities: patient.activity_logs ?? [], measurements: [], permissions: {} }, 30);
    if (!current.quiet.some(p => p.id === patientId))
        return null;
    return enqueueOutboxEvent({ patient_id: patientId, event_type: 'reminder', client_id: requestId, dedupe_key: `record-request:${scope.nutritionistId}:${requestId}`, subject: '¿Cómo venís con tus registros?', body: 'Tu nutricionista te invita a retomar los registros en el Diario de Plan V. Cuando puedas, contale cómo venís.', kind: 'reminder' }, false);
}
