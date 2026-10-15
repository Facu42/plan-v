import { createHash, randomUUID } from 'node:crypto';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import {
  ASSET_CATEGORIES,
  AssetError,
  destBucket,
  inspectAndSanitize,
  parseDataUrl,
  PATIENT_ASSET_QUOTA,
  type AssetCategory,
} from './inspect.js';

export type AssetStatus = 'reserved' | 'quarantine' | 'ready' | 'rejected' | 'withdrawn';
export type PatientAsset = {
  id: string;
  patient_id: string;
  category: AssetCategory;
  status: AssetStatus;
  bucket: string;
  object_path: string;
  mime: string | null;
  byte_size: number;
  checksum: string | null;
  created_at: string;
};

const intents = new Map<string, PatientAsset & { expires_at: string; blobs?: Buffer }>();
const blobs = new Map<string, Buffer>();

export function resetAssetMemory() {
  intents.clear();
  blobs.clear();
}

function checksum(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function objectPath(patientId: string, id: string) {
  return `patients/${patientId}/${id}`;
}

function quotaOf(patientId: string) {
  const rows = [...intents.values()].filter(row => row.patient_id === patientId && row.status !== 'withdrawn' && row.status !== 'rejected');
  return {
    files: rows.length,
    bytes: rows.reduce((sum, row) => sum + row.byte_size, 0),
  };
}

async function nutritionistId(patientId: string) {
  const { data, error } = await getRequestDb()
    .from('patient_access_view')
    .select('nutritionist_id')
    .eq('id', patientId)
    .maybeSingle();
  if (error || !data?.nutritionist_id) throw new AssetError(403, 'No tenés permiso para esta acción.');
  return data.nutritionist_id as string;
}

export async function signedQuarantineUpload(objectPath: string) {
  const { data, error } = await privilegedDb().storage.from('asset-quarantine').createSignedUploadUrl(objectPath);
  if (error || !data) throw new AssetError(503, 'No se pudo abrir la carga temporal.');
  return { url: data.signedUrl, token: data.token, expires_in: 900 };
}

export async function peekIntent(patientId: string, id: string, persistent: boolean) {
  const row = persistent ? await readIntent(patientId, id) : intents.get(id);
  if (!row || row.patient_id !== patientId) throw new AssetError(404, 'La reserva ya no está disponible.');
  return row;
}

export async function reserveAsset(patientId: string, category: AssetCategory, persistent: boolean): Promise<PatientAsset> {
  if (!ASSET_CATEGORIES.includes(category)) throw new AssetError(400, 'Elegí el tipo de archivo.');
  const used = persistent ? await loadQuota(patientId) : quotaOf(patientId);
  if (used.files >= PATIENT_ASSET_QUOTA.maxFiles || used.bytes >= PATIENT_ASSET_QUOTA.maxBytes) {
    throw new AssetError(413, 'Llegaste al límite de archivos de este consultorio.');
  }
  const id = randomUUID();
  const now = new Date();
  const row: PatientAsset & { expires_at: string } = {
    id,
    patient_id: patientId,
    category,
    status: 'reserved',
    bucket: 'asset-quarantine',
    object_path: objectPath(patientId, id),
    mime: null,
    byte_size: 0,
    checksum: null,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
  };
  if (!persistent) {
    intents.set(id, row);
    return row;
  }
  const { data, error } = await getRequestDb().rpc('reserve_asset_intent', {
    target: patientId,
    category_value: category,
    intent_id: id,
    path: row.object_path,
  });
  if (error) {
    if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
      throw new AssetError(501, 'Los archivos privados requieren instalar la migración de este módulo.');
    }
    if (error.code === '42501') throw new AssetError(403, 'No tenés permiso o falta el consentimiento vigente.');
    throw new AssetError(503, 'No se pudo reservar el archivo. Reintentá.');
  }
  return {
    ...row,
    created_at: typeof data?.created_at === 'string' ? data.created_at : row.created_at,
  };
}

async function loadQuota(patientId: string) {
  const db = getRequestDb();
  const assets = await db.from('patient_assets').select('byte_size,status').eq('patient_id', patientId);
  if (['42P01', 'PGRST205'].includes(assets.error?.code ?? '')) throw new AssetError(501, 'Los archivos privados requieren instalar la migración de este módulo.');
  const rows = (assets.data ?? []).filter(row => row.status !== 'withdrawn' && row.status !== 'rejected');
  return { files: rows.length, bytes: rows.reduce((sum, row) => sum + Number(row.byte_size ?? 0), 0) };
}

async function bytesFromComplete(patientId: string, intent: PatientAsset & { expires_at?: string }, dataUrl: string | undefined, persistent: boolean) {
  if (dataUrl) return parseDataUrl(dataUrl);
  if (!persistent) throw new AssetError(400, 'El archivo no tiene un formato reconocible.');
  const downloaded = await privilegedDb().storage.from('asset-quarantine').download(intent.object_path);
  if (downloaded.error || !downloaded.data) throw new AssetError(409, 'Todavía no llegó el archivo a cuarentena.');
  return Buffer.from(await downloaded.data.arrayBuffer());
}

export async function completeAsset(patientId: string, id: string, dataUrl: string | undefined, persistent: boolean): Promise<PatientAsset> {
  const intent = persistent ? await readIntent(patientId, id) : intents.get(id);
  if (!intent || intent.patient_id !== patientId) throw new AssetError(404, 'La reserva ya no está disponible.');
  const raw = await bytesFromComplete(patientId, intent, dataUrl, persistent);
  if (intent.status === 'ready') {
    const previous = persistent ? intent : intents.get(id);
    if (previous?.checksum && previous.checksum === checksum(inspectAndSanitize(intent.category, raw).bytes)) return previous;
    throw new AssetError(409, 'Ese archivo ya se confirmó con otro contenido.');
  }
  if (intent.status === 'withdrawn' || intent.status === 'rejected') throw new AssetError(409, 'Ese archivo ya no se puede completar.');
  if ('expires_at' in intent && Date.parse(String(intent.expires_at)) < Date.now()) throw new AssetError(409, 'La reserva venció. Volvé a elegir el archivo.');
  const clean = inspectAndSanitize(intent.category, raw);
  const used = persistent ? await loadQuota(patientId) : quotaOf(patientId);
  if (used.bytes + clean.bytes.length > PATIENT_ASSET_QUOTA.maxBytes) throw new AssetError(413, 'Llegaste al límite de archivos de este consultorio.');
  const hash = checksum(clean.bytes);
  const ready: PatientAsset = {
    id,
    patient_id: patientId,
    category: intent.category,
    status: 'ready',
    bucket: destBucket(intent.category),
    object_path: intent.object_path,
    mime: clean.mime,
    byte_size: clean.bytes.length,
    checksum: hash,
    created_at: intent.created_at,
  };
  if (!persistent) {
    blobs.set(id, clean.bytes);
    intents.set(id, { ...ready, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() });
    return ready;
  }
  const store = privilegedDb().storage.from('asset-quarantine');
  await store.upload(intent.object_path, clean.bytes, { contentType: clean.mime, upsert: true });
  const dest = privilegedDb().storage.from(ready.bucket);
  const moved = await dest.upload(ready.object_path, clean.bytes, { contentType: clean.mime, upsert: false });
  if (moved.error && !String(moved.error.message).toLowerCase().includes('already exists')) {
    throw new AssetError(503, 'No se pudo guardar el archivo verificado.');
  }
  await privilegedDb().storage.from('asset-quarantine').remove([intent.object_path]);
  const insert = await privilegedDb().from('patient_assets').upsert({
    id,
    patient_id: patientId,
    nutritionist_id: await nutritionistId(patientId),
    bucket: ready.bucket,
    object_path: ready.object_path,
    category: ready.category,
    status: 'ready',
    mime: ready.mime,
    byte_size: ready.byte_size,
    checksum: ready.checksum,
  });
  if (insert.error) throw new AssetError(503, 'No se pudo confirmar el archivo.');
  await privilegedDb().from('asset_upload_intents').update({ status: 'ready' }).eq('id', id);
  return ready;
}

async function readIntent(patientId: string, id: string) {
  const { data, error } = await getRequestDb().from('asset_upload_intents').select('id,patient_id,category,object_path,status,created_at,expires_at').eq('id', id).maybeSingle();
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code ?? '')) throw new AssetError(501, 'Los archivos privados requieren instalar la migración de este módulo.');
    throw new AssetError(503, 'No se pudo leer la reserva.');
  }
  if (!data || data.patient_id !== patientId) return null;
  return data as PatientAsset & { expires_at: string };
}

export async function accessAsset(patientId: string, id: string, persistent: boolean): Promise<{ url: string; expires_in: number }> {
  const row = persistent ? await readReady(patientId, id) : intents.get(id);
  if (!row || row.patient_id !== patientId) throw new AssetError(404, 'Archivo no encontrado.');
  if (row.status !== 'ready') throw new AssetError(404, 'Archivo no encontrado.');
  if (!persistent) {
    const stored = blobs.get(id);
    if (!stored) throw new AssetError(404, 'La foto demo ya no está disponible.');
    return { url: `data:${row.mime};base64,${stored.toString('base64')}`, expires_in: 60 };
  }
  const { data, error } = await getRequestDb().storage.from(row.bucket).createSignedUrl(row.object_path, 60);
  if (error || !data) throw new AssetError(503, 'No se pudo abrir el archivo.');
  return { url: data.signedUrl, expires_in: 60 };
}

async function readReady(patientId: string, id: string) {
  const { data, error } = await getRequestDb().from('patient_assets').select('id,patient_id,category,status,bucket,object_path,mime,byte_size,checksum,created_at').eq('id', id).maybeSingle();
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code ?? '')) throw new AssetError(501, 'Los archivos privados requieren instalar la migración de este módulo.');
    throw new AssetError(503, 'No se pudo leer el archivo.');
  }
  if (!data || data.patient_id !== patientId || data.status !== 'ready') return null;
  return data as PatientAsset;
}

export async function withdrawAsset(patientId: string, id: string, persistent: boolean) {
  if (!persistent) {
    const row = intents.get(id);
    if (!row || row.patient_id !== patientId) throw new AssetError(404, 'Archivo no encontrado.');
    row.status = 'withdrawn';
    blobs.delete(id);
    return;
  }
  const current = await readReady(patientId, id);
  if (!current) throw new AssetError(404, 'Archivo no encontrado.');
  await privilegedDb().storage.from(current.bucket).remove([current.object_path]);
  const { error } = await privilegedDb().from('patient_assets').update({ status: 'withdrawn', deleted_at: new Date().toISOString() }).eq('id', id).eq('patient_id', patientId);
  if (error) throw new AssetError(503, 'No se pudo retirar el archivo.');
}

export async function listReadyAssets(patientId: string, persistent: boolean) {
  if (!persistent) return [...intents.values()].filter(row => row.patient_id === patientId && row.status === 'ready');
  const { data, error } = await getRequestDb().from('patient_assets').select('id,patient_id,category,status,bucket,object_path,mime,byte_size,checksum,created_at').eq('patient_id', patientId).eq('status', 'ready');
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code ?? '')) throw new AssetError(501, 'Los archivos privados requieren instalar la migración de este módulo.');
    throw new AssetError(503, 'No se pudieron listar los archivos.');
  }
  return (data ?? []) as PatientAsset[];
}
