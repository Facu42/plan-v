import { randomUUID } from 'node:crypto';
import { generateReplacement } from '../ai/replacements.js';
import { AIUnavailableError } from '../ai/errors.js';
import { currentCareConsents, requireCareConsent } from '../care/consents.js';
import * as repo from '../care/repository.js';
import { purgePrivateAsset } from '../assets/repository.js';
import * as sb from '../db/supabase-repo.js';
import { getPatient } from '../store.js';
import { PermanentJobError } from './errors.js';
import type { ProcessingJob } from './types.js';

export async function handleProcessingJob(job: ProcessingJob) {
  if (job.kind === 'fail') throw new Error('forced_failure');
  if (job.kind === 'purge_asset') {
    const path = String(job.payload.path ?? '');
    if (!path) throw new PermanentJobError('purge_path');
    await purgePrivateAsset(job.payload);
    return;
  }
  if (job.kind !== 'menu_draft') throw new PermanentJobError('job_kind');
  const patientId = String(job.payload.patient_id ?? '');
  const recordId = String(job.payload.record_id ?? '');
  const persistent = Boolean(job.payload.persistent);
  if (!patientId || !recordId) throw new PermanentJobError('job_payload');
  try {
    const bundle = await requireCareConsent(patientId, persistent, 'ai_menu_draft');
    const record = (await repo.listCareRecords(patientId, persistent)).find((entry) => entry.id === recordId);
    if (!record || record.data.kind !== 'menu_request') throw new PermanentJobError('menu_request_missing');
    const existing = (await repo.listReplacements(patientId, persistent)).find((entry) => entry.request_id === record.id);
    if (existing) return;
    const consents = await currentCareConsents(patientId, persistent);
    if (!consents.consented.includes('ai_menu_draft')) throw new PermanentJobError('consent_revoked');
    const patient = persistent ? await sb.sbGetPatientById(patientId, 'professional') : getPatient(patientId);
    const result = await generateReplacement(record.data, bundle.intake.payload, patient?.weekPlan ?? []);
    await repo.saveReplacement({
      id: randomUUID(),
      patient_id: patientId,
      request_id: record.id,
      ...result,
      published_at: null,
      created_at: new Date().toISOString(),
    }, persistent);
  } catch (error) {
    if (error instanceof PermanentJobError || error instanceof AIUnavailableError) throw error;
    if (error instanceof repo.CareError) throw new PermanentJobError(error.message);
    throw error;
  }
}
