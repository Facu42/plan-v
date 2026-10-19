import { currentCareConsents } from '../care/consents.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { getRequestDb } from '../db/supabase-client.js';
import { readAllRows, queueDbError } from './repository.js';

/** Permisos y estado del ingreso, sin respuestas del cuestionario ni notas clínicas. */
export async function previewPermissions(patientId: string, persistent: boolean) {
  if (!persistent) return currentCareConsents(patientId, false);
  const db = getRequestDb();
  const [events, intake] = await Promise.all([
    readAllRows((offset,end) => db.from('consent_events').select('id,purpose,text_version,text_hash,decision,sequence').eq('patient_id',patientId).order('sequence').order('id').range(offset,end)),
    db.from('intake_sessions').select('status').eq('patient_id',patientId).order('updated_at',{ascending:false}).range(0,0),
  ]);
  queueDbError(intake.error);
  const latest = new Map(events.map(event => [String(event.purpose),event]));
  const consented = CONSENT_CATALOG.filter(text => { const event=latest.get(text.purpose);return event?.decision==='granted'&&event.text_version===text.text_version&&event.text_hash===text.text_hash; }).map(text=>text.purpose);
  return { consented, intake: { status: String(intake.data?.[0]?.status ?? 'draft') } };
}

