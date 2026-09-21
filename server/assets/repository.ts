import { randomBytes, randomUUID } from 'node:crypto';
import { CareError } from '../care/errors.js';
import { processQueue } from '../jobs/queue.js';
import {
  BYTE_LIMIT_BY_CATEGORY,
  PATIENT_QUOTA,
  QUARANTINE_BUCKET,
  type AssetCategory,
  type PrivateAsset,
  type UploadIntent,
} from './types.js';
import { inspectPrivateFile, parseDataUrl } from './inspect.js';
import { moveStorageObject, putStorageObject, readyBucketFor, removeStorageObject, requirePersistentStorage, signStorageObject } from './storage.js';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';

const intents = new Map<string, UploadIntent>();
const assets = new Map<string, PrivateAsset>();
const blobs = new Map<string, { bucket: string; path: string; bytes: Buffer; mime: string }>();
const accessTokens = new Map<string, { assetId: string; expiresAt: number }>();

function blobKey(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

export function resetPrivateAssets() {
  intents.clear();
  assets.clear();
  blobs.clear();
  accessTokens.clear();
}

export function privateAssetSnapshot() {
  return {
    intents: [...intents.values()],
    assets: [...assets.values()],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function persist() {
  return isSupabaseEnabled();
}

function quotaFromMemory(patientId: string) {
  const ready = [...assets.values()].filter((asset) => asset.patient_id === patientId && asset.status === 'ready');
  const open = [...intents.values()].filter((intent) => (
    intent.patient_id === patientId
    && (intent.status === 'reserved' || intent.status === 'quarantine')
    && Date.parse(intent.expires_at) > Date.now()
  ));
  return {
    bytes: ready.reduce((sum, asset) => sum + asset.byte_size, 0),
    files: ready.length,
    open: open.length,
  };
}

export function assertQuota(patientId: string, extraBytes: number) {
  const used = quotaFromMemory(patientId);
  if (used.open >= PATIENT_QUOTA.maxOpenIntents) throw new CareError(429, 'Hay demasiadas subidas en curso. Esperá o cancelá una reserva.');
  if (used.files >= PATIENT_QUOTA.maxReadyFiles) throw new CareError(413, 'Alcanzaste el máximo de archivos privados.');
  if (used.bytes + extraBytes > PATIENT_QUOTA.maxReadyBytes) throw new CareError(413, 'Alcanzaste la cuota de archivos privados.');
}

async function quotaFromDb(patientId: string, extraBytes: number) {
  const db = privilegedDb();
  const ready = await db.from('patient_assets').select('byte_size,status').eq('patient_id', patientId).eq('status', 'ready');
  if (ready.error) throw new CareError(503, 'No se pudo comprobar la cuota de archivos.');
  const open = await db.from('asset_upload_intents').select('id,status,expires_at').eq('patient_id', patientId).in('status', ['reserved', 'quarantine']);
  if (open.error) throw new CareError(503, 'No se pudo comprobar la cuota de archivos.');
  const bytes = (ready.data ?? []).reduce((sum, row) => sum + Number(row.byte_size ?? 0), 0);
  const files = (ready.data ?? []).length;
  const openCount = (open.data ?? []).filter((row) => Date.parse(String(row.expires_at)) > Date.now()).length;
  if (openCount >= PATIENT_QUOTA.maxOpenIntents) throw new CareError(429, 'Hay demasiadas subidas en curso. Esperá o cancelá una reserva.');
  if (files >= PATIENT_QUOTA.maxReadyFiles) throw new CareError(413, 'Alcanzaste el máximo de archivos privados.');
  if (bytes + extraBytes > PATIENT_QUOTA.maxReadyBytes) throw new CareError(413, 'Alcanzaste la cuota de archivos privados.');
}

function expireMemoryIntents(patientId?: string) {
  const now = Date.now();
  for (const intent of intents.values()) {
    if (patientId && intent.patient_id !== patientId) continue;
    if ((intent.status === 'reserved' || intent.status === 'quarantine') && Date.parse(intent.expires_at) <= now) {
      intent.status = 'rejected';
      blobs.delete(blobKey(QUARANTINE_BUCKET, intent.object_path));
    }
  }
}

export async function reserveUploadIntent(input: {
  patientId: string;
  nutritionistId: string;
  category: AssetCategory;
  mimeDeclared: string;
  persistent: boolean;
}) {
  const byteLimit = BYTE_LIMIT_BY_CATEGORY[input.category];
  if (input.persistent) {
    await requirePersistentStorage(input.category);
    await quotaFromDb(input.patientId, 0);
  } else {
    expireMemoryIntents(input.patientId);
    assertQuota(input.patientId, 0);
  }
  const id = randomUUID();
  const intent: UploadIntent = {
    id,
    patient_id: input.patientId,
    nutritionist_id: input.nutritionistId,
    category: input.category,
    object_path: `patients/${input.patientId}/q/${id}`,
    mime_declared: input.mimeDeclared,
    byte_limit: byteLimit,
    status: 'reserved',
    asset_id: null,
    created_at: nowIso(),
    expires_at: new Date(Date.now() + PATIENT_QUOTA.intentTtlMs).toISOString(),
  };
  if (input.persistent) {
    const { error } = await privilegedDb().from('asset_upload_intents').insert(intent);
    if (error) throw new CareError(503, 'No se pudo reservar la subida.');
  } else {
    intents.set(id, intent);
  }
  return intent;
}

async function loadIntent(id: string, persistent: boolean) {
  if (!persistent) {
    expireMemoryIntents();
    const intent = intents.get(id);
    if (!intent) throw new CareError(404, 'La reserva ya no está disponible.');
    return intent;
  }
  const { data, error } = await privilegedDb().from('asset_upload_intents').select('*').eq('id', id).maybeSingle();
  if (error) throw new CareError(503, 'No se pudo leer la reserva.');
  if (!data) throw new CareError(404, 'La reserva ya no está disponible.');
  return data as UploadIntent;
}

export async function uploadIntentBytes(id: string, patientId: string, dataUrl: string, persistent: boolean) {
  const intent = await loadIntent(id, persistent);
  if (intent.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para esta reserva.');
  if (Date.parse(intent.expires_at) <= Date.now()) throw new CareError(409, 'La reserva venció. Pedí una nueva.');
  if (intent.status !== 'reserved' && intent.status !== 'quarantine') throw new CareError(409, 'Esa reserva ya no admite archivos.');
  const parsed = parseDataUrl(dataUrl);
  if (parsed.bytes.length > intent.byte_limit) throw new CareError(413, 'El archivo supera el límite de la reserva.');
  inspectPrivateFile(intent.category, parsed.bytes, parsed.mime);
  if (persistent) {
    await putStorageObject(QUARANTINE_BUCKET, intent.object_path, parsed.bytes, parsed.mime);
    const { error } = await privilegedDb().from('asset_upload_intents').update({ status: 'quarantine', mime_declared: parsed.mime }).eq('id', id);
    if (error) throw new CareError(503, 'No se pudo pasar el archivo a cuarentena.');
  } else {
    blobs.set(blobKey(QUARANTINE_BUCKET, intent.object_path), {
      bucket: QUARANTINE_BUCKET,
      path: intent.object_path,
      bytes: parsed.bytes,
      mime: parsed.mime,
    });
    intent.status = 'quarantine';
    intent.mime_declared = parsed.mime;
  }
  return { ...intent, status: 'quarantine' as const, mime_declared: parsed.mime };
}

async function quarantineBytes(intent: UploadIntent, persistent: boolean) {
  if (!persistent) {
    const blob = blobs.get(blobKey(QUARANTINE_BUCKET, intent.object_path));
    if (!blob) throw new CareError(409, 'Todavía no hay un archivo en cuarentena.');
    return blob;
  }
  const { data, error } = await privilegedDb().storage.from(QUARANTINE_BUCKET).download(intent.object_path);
  if (error || !data) throw new CareError(409, 'Todavía no hay un archivo en cuarentena.');
  return { bytes: Buffer.from(await data.arrayBuffer()), mime: intent.mime_declared, path: intent.object_path, bucket: QUARANTINE_BUCKET };
}

export async function completeUploadIntent(id: string, patientId: string, persistent: boolean) {
  const intent = await loadIntent(id, persistent);
  if (intent.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para esta reserva.');
  if (intent.status === 'ready' && intent.asset_id) {
    return persistent
      ? await loadAsset(intent.asset_id, persistent)
      : assets.get(intent.asset_id)!;
  }
  if (Date.parse(intent.expires_at) <= Date.now()) throw new CareError(409, 'La reserva venció. Pedí una nueva.');
  if (intent.status !== 'quarantine') throw new CareError(409, 'Subí el archivo a cuarentena antes de finalizar.');
  const blob = await quarantineBytes(intent, persistent);
  const inspected = inspectPrivateFile(intent.category, blob.bytes, blob.mime);
  if (persistent) await quotaFromDb(patientId, inspected.bytes.length);
  else assertQuota(patientId, inspected.bytes.length);
  const assetId = randomUUID();
  const readyPath = `patients/${patientId}/${assetId}`;
  const readyBucket = readyBucketFor(intent.category);
  const asset: PrivateAsset = {
    id: assetId,
    patient_id: patientId,
    nutritionist_id: intent.nutritionist_id,
    category: intent.category,
    bucket: readyBucket,
    object_path: readyPath,
    mime: inspected.mime,
    byte_size: inspected.bytes.length,
    checksum_sha256: inspected.checksum,
    status: 'ready',
    uploaded_by: null,
    created_at: nowIso(),
    withdrawn_at: null,
  };
  if (persistent) {
    await moveStorageObject(QUARANTINE_BUCKET, readyBucket, intent.object_path, readyPath, inspected.bytes, inspected.mime);
    const inserted = await privilegedDb().from('patient_assets').insert({
      id: asset.id,
      patient_id: asset.patient_id,
      nutritionist_id: asset.nutritionist_id,
      bucket: asset.bucket,
      object_path: asset.object_path,
      uploaded_by: asset.uploaded_by,
      category: asset.category,
      mime: asset.mime,
      byte_size: asset.byte_size,
      checksum_sha256: asset.checksum_sha256,
      status: asset.status,
    });
    if (inserted.error) throw new CareError(503, 'No se pudo confirmar el archivo.');
    const updated = await privilegedDb().from('asset_upload_intents').update({ status: 'ready', asset_id: asset.id }).eq('id', id);
    if (updated.error) throw new CareError(503, 'No se pudo confirmar el archivo.');
  } else {
    blobs.delete(blobKey(QUARANTINE_BUCKET, intent.object_path));
    blobs.set(blobKey(readyBucket, readyPath), { bucket: readyBucket, path: readyPath, bytes: inspected.bytes, mime: inspected.mime });
    assets.set(asset.id, asset);
    intent.status = 'ready';
    intent.asset_id = asset.id;
  }
  return asset;
}

async function loadAsset(id: string, persistent: boolean) {
  if (!persistent) {
    const asset = assets.get(id);
    if (!asset) throw new CareError(404, 'Archivo no encontrado.');
    return asset;
  }
  const { data, error } = await privilegedDb().from('patient_assets').select('*').eq('id', id).maybeSingle();
  if (error) throw new CareError(503, 'No se pudo leer el archivo.');
  if (!data) throw new CareError(404, 'Archivo no encontrado.');
  return data as PrivateAsset;
}

export async function accessPrivateAsset(id: string, patientId: string, persistent: boolean) {
  const asset = await loadAsset(id, persistent);
  if (asset.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para este archivo.');
  if (asset.status === 'withdrawn' || asset.withdrawn_at) throw new CareError(404, 'El archivo ya no está disponible.');
  if (asset.status !== 'ready') throw new CareError(409, 'El archivo todavía no está listo.');
  if (persistent) {
    return { url: await signStorageObject(asset.bucket, asset.object_path, PATIENT_QUOTA.signedUrlSeconds), expires_in: PATIENT_QUOTA.signedUrlSeconds, mime: asset.mime };
  }
  const token = randomBytes(18).toString('hex');
  accessTokens.set(token, { assetId: asset.id, expiresAt: Date.now() + PATIENT_QUOTA.signedUrlSeconds * 1000 });
  return { url: `/api/assets/blob/${token}`, expires_in: PATIENT_QUOTA.signedUrlSeconds, mime: asset.mime };
}

export function readSignedBlob(token: string) {
  const grant = accessTokens.get(token);
  if (!grant || grant.expiresAt <= Date.now()) throw new CareError(404, 'El enlace temporal venció.');
  const asset = assets.get(grant.assetId);
  if (!asset) throw new CareError(404, 'El archivo ya no está disponible.');
  const blob = blobs.get(blobKey(asset.bucket, asset.object_path));
  if (!blob) throw new CareError(404, 'El archivo ya no está disponible.');
  return { bytes: blob.bytes, mime: blob.mime, filename: asset.object_path.split('/').pop() ?? 'archivo' };
}

export async function withdrawPrivateAsset(id: string, patientId: string, persistent: boolean) {
  const asset = await loadAsset(id, persistent);
  if (asset.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para este archivo.');
  if (asset.status === 'withdrawn') return asset;
  const withdrawnAt = nowIso();
  if (persistent) {
    const { error } = await privilegedDb().from('patient_assets').update({ status: 'withdrawn', withdrawn_at: withdrawnAt, deleted_at: withdrawnAt }).eq('id', id);
    if (error) throw new CareError(503, 'No se pudo retirar el archivo.');
  } else {
    asset.status = 'withdrawn';
    asset.withdrawn_at = withdrawnAt;
  }
  await processQueue.enqueue({
    kind: 'purge_asset',
    payload: { asset_id: asset.id, bucket: asset.bucket, path: asset.object_path, persistent },
  });
  return { ...asset, status: 'withdrawn' as const, withdrawn_at: withdrawnAt };
}

export async function purgePrivateAsset(payload: Record<string, unknown>) {
  const bucket = String(payload.bucket ?? '');
  const path = String(payload.path ?? '');
  if (!bucket || !path) throw new CareError(400, 'purge_path');
  if (payload.persistent) {
    await removeStorageObject(bucket, path);
    return;
  }
  blobs.delete(blobKey(bucket, path));
}

export async function ingestReadyAsset(input: {
  patientId: string;
  nutritionistId: string;
  category: AssetCategory;
  dataUrl: string;
  persistent: boolean;
}) {
  const parsed = parseDataUrl(input.dataUrl);
  inspectPrivateFile(input.category, parsed.bytes, parsed.mime);
  const intent = await reserveUploadIntent({
    patientId: input.patientId,
    nutritionistId: input.nutritionistId,
    category: input.category,
    mimeDeclared: parsed.mime,
    persistent: input.persistent,
  });
  await uploadIntentBytes(intent.id, input.patientId, input.dataUrl, input.persistent);
  return completeUploadIntent(intent.id, input.patientId, input.persistent);
}

export function memoryBlob(bucket: string, path: string) {
  const blob = blobs.get(blobKey(bucket, path));
  if (!blob) return null;
  return `data:${blob.mime};base64,${blob.bytes.toString('base64')}`;
}
