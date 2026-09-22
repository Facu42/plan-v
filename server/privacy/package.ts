import { toPatientIntakeView } from '../intake/views.js';
import { getIntakeRecord, listConsentEvents } from '../intake/memory.js';
import { readIntakeBundle } from '../intake/repository.js';
import { toPatientSelfMealLog, toPatientSelfView } from '../security/contracts.js';
import { getPatient } from '../store.js';
import { listMeasurements } from '../care/repository.js';
import { getPublishedMealPlan } from '../plans/repository.js';
import { privateAssetSnapshot } from '../assets/repository.js';
import { getRequestDb } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { PRIVACY_EXPORT_VERSION, type PrivacyAssetMeta } from '../../src/types/privacy.js';
import { retentionRulesForExport } from './retention.js';
import type { Patient } from '../../src/types/index.js';

const FORBIDDEN_KEYS = ['clinical_notes', 'adherence_why', 'ai_artifacts', 'brief', 'goal_history', 'note_for_nutri'];

export function stripLiveUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('data:')) return null;
    if (/^https?:\/\//i.test(value)) return null;
    if (/[?&](?:token|signature|key)=/i.test(value)) return null;
    return value;
  }
  if (Array.isArray(value)) return value.map(stripLiveUrls);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.includes(key)) continue;
      next[key] = stripLiveUrls(entry);
    }
    return next;
  }
  return value;
}

export function assertSafePackage(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  if (/clinical_notes|adherence_why|ai_artifacts|note_for_nutri/.test(raw)) {
    throw new Error('privacy_forbidden_fields');
  }
  if (/[?&](?:token|signature)=/i.test(raw) || /"https?:\/\//i.test(raw)) {
    throw new Error('privacy_live_url');
  }
}

function mapAssetMeta(asset: {
  id: string;
  category: string;
  mime: string;
  byte_size: number;
  status: string;
  created_at: string;
  withdrawn_at: string | null;
}): PrivacyAssetMeta {
  return {
    id: asset.id,
    category: asset.category,
    mime: asset.mime,
    byte_size: asset.byte_size,
    status: asset.status,
    created_at: asset.created_at,
    withdrawn_at: asset.withdrawn_at,
  };
}

async function assetMeta(patientId: string, persistent: boolean): Promise<PrivacyAssetMeta[]> {
  if (!persistent) {
    return privateAssetSnapshot().assets
      .filter((asset) => asset.patient_id === patientId)
      .map(mapAssetMeta);
  }
  const { data, error } = await getRequestDb()
    .from('patient_assets')
    .select('id,category,mime,byte_size,status,created_at,withdrawn_at')
    .eq('patient_id', patientId)
    .limit(200);
  if (error) return [];
  return (data ?? []).map((row) => mapAssetMeta({
    id: String(row.id),
    category: String(row.category ?? ''),
    mime: String(row.mime ?? ''),
    byte_size: Number(row.byte_size ?? 0),
    status: String(row.status ?? ''),
    created_at: String(row.created_at ?? ''),
    withdrawn_at: row.withdrawn_at == null ? null : String(row.withdrawn_at),
  }));
}

async function loadPatient(patientId: string, persistent: boolean): Promise<Patient | null> {
  if (!persistent) return getPatient(patientId) ?? null;
  return sb.sbGetPatientById(patientId, 'patient');
}

export async function buildPrivacyPackage(patientId: string, persistent: boolean) {
  const patient = await loadPatient(patientId, persistent);
  const profile = patient ? stripLiveUrls(toPatientSelfView(patient)) : { id: patientId };
  const intakeBundle = persistent
    ? await readIntakeBundle(patientId)
    : { intake: getIntakeRecord(patientId), consents: listConsentEvents(patientId) };
  const intake = toPatientIntakeView(intakeBundle.intake, intakeBundle.consents);
  const published = await getPublishedMealPlan(patientId, persistent);
  const measurements = await listMeasurements(patientId, persistent);
  const meals = patient ? patient.meal_logs.map((log) => stripLiveUrls(toPatientSelfMealLog(log))) : [];
  const messages = patient ? toPatientSelfView(patient).messages : [];
  const payload = {
    version: PRIVACY_EXPORT_VERSION,
    generated_at: new Date().toISOString(),
    patient_id: patientId,
    profile,
    intake,
    consents: intake.consents,
    published_plan: stripLiveUrls(published),
    meals,
    messages,
    measurements,
    assets: await assetMeta(patientId, persistent),
    retained: {
      payments: 'Pagos y webhooks no se exportan ni se borran con un click (guarda fiscal).',
      audit: 'La auditoría opaca se conserva.',
      clinical_notes: 'Las notas profesionales no forman parte de este paquete.',
      published_plans_professional: 'La profesional puede conservar planes ya publicados.',
      ai_artifacts: 'Los borradores de IA no se exportan.',
    },
    retention: retentionRulesForExport(),
    working_periods_not_legal: true,
  };
  const safe = stripLiveUrls(payload) as Record<string, unknown>;
  assertSafePackage(safe);
  return safe;
}
