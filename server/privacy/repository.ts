import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { processQueue } from '../jobs/queue.js';
import { privateAssetSnapshot, withdrawPrivateAsset } from '../assets/repository.js';
import {
  PRIVACY_PACKAGE_TTL_SECONDS,
  type PrivacyAccessEvent,
  type PrivacyRequestKind,
  type PrivacyRequestStatus,
  type PrivacyRequestView,
} from '../../src/types/privacy.js';
import { buildPrivacyPackage } from './package.js';

export { CareError } from '../care/errors.js';

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

type MemRequest = PrivacyRequestView & { package: Record<string, unknown> | null };

const requests = new Map<string, MemRequest>();
const accessEvents: PrivacyAccessEvent[] = [];

export function resetPrivacyMemory() {
  requests.clear();
  accessEvents.length = 0;
}

export function privacyAccessSnapshot() {
  return accessEvents.map((event) => ({ ...event }));
}

export function privacyDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'La exportación y el retiro requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116' || error.message === 'privacy_expired') {
    throw new CareError(404, 'No encontramos ese pedido o el enlace temporal venció.');
  }
  if (error.code === 'PT409') throw new CareError(409, 'Ese pedido ya no se puede completar.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el tipo de pedido.');
  }
  throw new CareError(503, 'No se pudo registrar el pedido. Reintentá sin duplicar la solicitud.');
}

function asKind(value: unknown): PrivacyRequestKind {
  if (value === 'export' || value === 'delete' || value === 'correction') return value;
  throw new CareError(400, 'Revisá el tipo de pedido.');
}

function asStatus(value: unknown): PrivacyRequestStatus {
  if (value === 'requested' || value === 'in_progress' || value === 'completed' || value === 'rejected') return value;
  throw new CareError(503, 'No se pudo registrar el pedido. Reintentá sin duplicar la solicitud.');
}

function asRequest(row: Record<string, unknown>): PrivacyRequestView {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    kind: asKind(row.kind),
    status: asStatus(row.status),
    requested_at: String(row.requested_at),
    due_at: row.due_at == null ? null : String(row.due_at),
    completed_at: row.completed_at == null ? null : String(row.completed_at),
    notes: String(row.notes ?? ''),
    package_expires_at: row.package_expires_at == null ? null : String(row.package_expires_at),
  };
}

function publicRequest(entry: MemRequest): PrivacyRequestView {
  const { package: _pkg, ...view } = entry;
  return view;
}

export function recordMemoryAccess(input: {
  patientId: string;
  action: string;
  objectType: string;
  objectId?: string | null;
  category?: string | null;
}) {
  accessEvents.push({
    id: randomUUID(),
    patient_id: input.patientId,
    action: input.action,
    object_type: input.objectType,
    object_id: input.objectId ?? null,
    category: input.category ?? null,
    created_at: new Date().toISOString(),
  });
}

async function recordAccess(input: {
  patientId: string;
  action: string;
  objectType: string;
  objectId?: string | null;
  category?: string | null;
  persistent: boolean;
}) {
  recordMemoryAccess(input);
  if (!input.persistent) return;
  const { error } = await getRequestDb().rpc('record_privacy_access', {
    payload: {
      patient_id: input.patientId,
      action: input.action,
      object_type: input.objectType,
      object_id: input.objectId ?? null,
      category: input.category ?? null,
    },
  });
  privacyDbError(error);
}

export async function requestPrivacyAction(
  patientId: string,
  kind: PrivacyRequestKind,
  persistent: boolean,
  notes = '',
): Promise<PrivacyRequestView> {
  if (!persistent && !getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('request_privacy_action', {
      payload: { patient_id: patientId, kind, notes },
    });
    privacyDbError(error);
    const created = asRequest(data as Record<string, unknown>);
    if (kind === 'export') {
      const pkg = await buildPrivacyPackage(patientId, true);
      const { data: done, error: completeError } = await getRequestDb().rpc('complete_privacy_export', {
        payload: { request_id: created.id, package: pkg },
      });
      privacyDbError(completeError);
      await recordAccess({
        patientId,
        action: 'export_requested',
        objectType: 'privacy_request',
        objectId: created.id,
        category: 'export',
        persistent: true,
      });
      await processQueue.enqueue({ kind: 'privacy_export', payload: { request_id: created.id, patient_id: patientId } });
      return asRequest((done ?? data) as Record<string, unknown>);
    }
    if (kind === 'delete') {
      await withdrawReadyAssets(patientId, true);
      const { data: done, error: completeError } = await getRequestDb().rpc('complete_privacy_delete', {
        target_request: created.id,
      });
      privacyDbError(completeError);
      await recordAccess({
        patientId,
        action: 'delete_requested',
        objectType: 'privacy_request',
        objectId: created.id,
        category: 'delete',
        persistent: true,
      });
      await processQueue.enqueue({
        kind: 'privacy_delete',
        payload: { request_id: created.id, patient_id: patientId, persistent: true },
      });
      return asRequest((done ?? data) as Record<string, unknown>);
    }
    await recordAccess({
      patientId,
      action: 'correction_requested',
      objectType: 'privacy_request',
      objectId: created.id,
      category: 'correction',
      persistent: true,
    });
    return created;
  }

  const patient = getPatient(patientId)!;
  if (kind === 'delete' && patient.deactivated_at) {
    const last = [...requests.values()].find((row) => row.patient_id === patientId && row.kind === 'delete');
    if (last) return publicRequest(last);
  }
  const stamp = new Date().toISOString();
  const id = randomUUID();
  const entry: MemRequest = {
    id,
    patient_id: patientId,
    kind,
    status: kind === 'correction' ? 'requested' : 'in_progress',
    requested_at: stamp,
    due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    notes,
    package_expires_at: null,
    package: null,
  };
  if (kind === 'export') {
    entry.package = await buildPrivacyPackage(patientId, false);
    entry.status = 'completed';
    entry.completed_at = stamp;
    entry.package_expires_at = new Date(Date.now() + PRIVACY_PACKAGE_TTL_SECONDS * 1000).toISOString();
    await processQueue.enqueue({ kind: 'privacy_export', payload: { request_id: id, patient_id: patientId } });
  }
  if (kind === 'delete') {
    patient.deactivated_at = stamp;
    await withdrawReadyAssets(patientId, false);
    entry.status = 'completed';
    entry.completed_at = stamp;
    await processQueue.enqueue({
      kind: 'privacy_delete',
      payload: { request_id: id, patient_id: patientId, persistent: false },
    });
  }
  requests.set(id, entry);
  recordMemoryAccess({
    patientId,
    action: `${kind}_requested`,
    objectType: 'privacy_request',
    objectId: id,
    category: kind,
  });
  return publicRequest(entry);
}

async function withdrawReadyAssets(patientId: string, persistent: boolean) {
  const ready = privateAssetSnapshot().assets.filter((asset) => asset.patient_id === patientId && asset.status === 'ready');
  for (const asset of ready) {
    await withdrawPrivateAsset(asset.id, patientId, persistent);
  }
}

export async function listPrivacyRequests(patientId: string, persistent: boolean): Promise<PrivacyRequestView[]> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('list_privacy_requests', { target_patient: patientId });
    privacyDbError(error);
    return Array.isArray(data) ? data.map((row) => asRequest(row as Record<string, unknown>)) : [];
  }
  if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
  return [...requests.values()]
    .filter((row) => row.patient_id === patientId)
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at))
    .map(publicRequest);
}

export async function downloadPrivacyPackage(patientId: string, requestId: string, persistent: boolean) {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('get_privacy_package', { target_request: requestId });
    privacyDbError(error);
    const row = data as { request?: Record<string, unknown>; package?: Record<string, unknown> } | null;
    if (!row?.package || !row.request) throw new CareError(404, 'No encontramos ese pedido o el enlace temporal venció.');
    const view = asRequest(row.request);
    if (view.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para esta acción.');
    await recordAccess({
      patientId,
      action: 'export_downloaded',
      objectType: 'privacy_package',
      objectId: requestId,
      category: 'export',
      persistent: true,
    });
    return { request: view, package: row.package };
  }
  const entry = requests.get(requestId);
  if (!entry || entry.patient_id !== patientId) throw new CareError(404, 'No encontramos ese pedido o el enlace temporal venció.');
  if (entry.kind !== 'export' || !entry.package) throw new CareError(404, 'No encontramos ese pedido o el enlace temporal venció.');
  if (entry.package_expires_at && Date.parse(entry.package_expires_at) <= Date.now()) {
    throw new CareError(404, 'No encontramos ese pedido o el enlace temporal venció.');
  }
  recordMemoryAccess({
    patientId,
    action: 'export_downloaded',
    objectType: 'privacy_package',
    objectId: requestId,
    category: 'export',
  });
  return { request: publicRequest(entry), package: entry.package };
}

export async function anonymizePatientLater(payload: Record<string, unknown>) {
  const patientId = String(payload.patient_id ?? '');
  if (!patientId) throw new CareError(400, 'privacy_payload');
  if (payload.persistent) return;
  const patient = getPatient(patientId);
  if (!patient?.deactivated_at) return;
  patient.anonymized_at = new Date().toISOString();
}
