import { getSupabaseAdmin, isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { PRODUCT_BUCKETS, QUARANTINE_BUCKET, READY_BUCKETS, type AssetCategory } from './types.js';

const MISSING_BUCKETS = 'Storage privado no está habilitado. No se crean buckets en este proyecto.';

export function readyBucketFor(category: AssetCategory) {
  return READY_BUCKETS[category];
}

export async function listProductBuckets(): Promise<string[] | null> {
  if (!isSupabaseEnabled()) return [...PRODUCT_BUCKETS];
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.storage.listBuckets();
  if (error) throw new CareError(503, 'No se pudo comprobar Storage privado.');
  return (data ?? []).map((bucket) => bucket.name || bucket.id);
}

export function hasRequiredBuckets(have: string[] | null | undefined, needed: readonly string[]) {
  if (!have) return false;
  const names = new Set(have);
  return needed.every((name) => names.has(name));
}

export async function requireProductBuckets(needed: readonly string[]) {
  if (!isSupabaseEnabled()) return;
  const names = await listProductBuckets();
  if (!hasRequiredBuckets(names, needed)) throw new CareError(503, MISSING_BUCKETS);
}

export async function requirePersistentStorage(category: AssetCategory) {
  await requireProductBuckets([QUARANTINE_BUCKET, readyBucketFor(category)]);
}

export async function putStorageObject(bucket: string, path: string, bytes: Buffer, mime: string) {
  await requireProductBuckets([bucket]);
  const { error } = await privilegedDb().storage.from(bucket).upload(path, bytes, { contentType: mime, upsert: false });
  if (!error) return;
  if (String(error.statusCode) === '409' || error.message.toLowerCase().includes('already exists')) {
    const old = await privilegedDb().storage.from(bucket).download(path);
    if (!old.error && old.data && Buffer.from(await old.data.arrayBuffer()).equals(bytes)) return;
    throw new CareError(409, 'Ese archivo ya existe con otro contenido.');
  }
  if (/NoSuchBucket|Bucket not found|not found/i.test(error.message)) throw new CareError(503, MISSING_BUCKETS);
  throw new CareError(503, 'No se pudo guardar el archivo privado.');
}

export async function moveStorageObject(fromBucket: string, toBucket: string, fromPath: string, toPath: string, bytes: Buffer, mime: string) {
  await putStorageObject(toBucket, toPath, bytes, mime);
  const { error } = await privilegedDb().storage.from(fromBucket).remove([fromPath]);
  if (error && !/NoSuchBucket|not found/i.test(error.message)) {
    throw new CareError(503, 'No se pudo salir de cuarentena.');
  }
}

export async function removeStorageObject(bucket: string, path: string) {
  const names = await listProductBuckets();
  if (!names || !names.includes(bucket)) return;
  await privilegedDb().storage.from(bucket).remove([path]);
}

export async function signStorageObject(bucket: string, path: string, expiresIn = 60) {
  await requireProductBuckets([bucket]);
  const { data, error } = await privilegedDb().storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) throw new CareError(503, 'No se pudo abrir el archivo privado.');
  return data.signedUrl;
}
