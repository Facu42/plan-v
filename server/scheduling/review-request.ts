import { randomUUID } from 'node:crypto';
import { getPatient } from '../store.js';
import { CareError } from '../care/errors.js';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { sendThreadMessage } from '../messages/repository.js';
import { googleReviewLink, planReviewDelivery, type ReviewAudience, type ReviewDelivery } from '../../src/lib/google-review.js';
import * as repo from './repository.js';

const memoryAudience = new Map<string, ReviewAudience>();

export function setMemoryReviewAudience(patientId: string, audience: ReviewAudience) {
  memoryAudience.set(patientId, audience);
}

export function resetMemoryReviewAudience() {
  memoryAudience.clear();
}

const OPEN: ReviewAudience = { campaignOptOut: false, inApp: true, email: false, broadcasts: false };

function audienceFromRows(rows: {
  campaign: { opted_out?: boolean } | null;
  prefs: { in_app?: boolean; email?: boolean } | null;
  contact: { broadcasts?: boolean } | null;
}): ReviewAudience {
  return {
    campaignOptOut: rows.campaign?.opted_out === true,
    inApp: rows.prefs ? rows.prefs.in_app !== false : true,
    email: rows.prefs?.email === true,
    broadcasts: rows.contact?.broadcasts === true,
  };
}

async function loadAudience(patientId: string, nid: string, persistent: boolean): Promise<ReviewAudience | null | 'missing'> {
  if (!persistent) {
    if (!getPatient(patientId)) return 'missing';
    return memoryAudience.get(patientId) ?? OPEN;
  }
  const owned = await getRequestDb().from('patients').select('id,user_id').eq('id', patientId).eq('nutritionist_id', nid).maybeSingle();
  repo.schedulingDbError(owned.error);
  if (!owned.data) return 'missing';
  const db = privilegedDb();
  const userId = typeof owned.data.user_id === 'string' ? owned.data.user_id : '';
  const [campaign, prefs, contact] = await Promise.all([
    db.from('ops_campaign_optouts').select('opted_out').eq('patient_id', patientId).maybeSingle(),
    userId ? db.from('notification_preferences').select('in_app,email').eq('user_id', userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    db.from('ops_contact_preferences').select('broadcasts').eq('patient_id', patientId).maybeSingle(),
  ]);
  for (const result of [campaign, prefs, contact]) {
    if (result.error && !['42P01', '42703', 'PGRST205'].includes(result.error.code ?? '')) return null;
  }
  return audienceFromRows({
    campaign: campaign.data,
    prefs: prefs.data,
    contact: contact.data,
  });
}

export async function deliverReviewRequest(nid: string, patientId: string, persistent: boolean): Promise<ReviewDelivery> {
  const profile = await repo.profile(nid, persistent);
  const link = googleReviewLink(profile.config.page_extras?.google_business_url ?? '');
  if (!link) throw new CareError(400, 'Cargá un link https de Google para pedir la reseña.');
  const audience = await loadAudience(patientId, nid, persistent);
  if (audience === 'missing') throw new CareError(404, 'No encontramos a esa paciente en tu consultorio.');
  const plan = planReviewDelivery(link, audience);
  if (plan.delivered === 'chat') {
    await sendThreadMessage(patientId, {
      text: plan.text,
      from: 'vero',
      suggestedByAi: false,
      client_id: randomUUID(),
    }, persistent);
  }
  return plan;
}
