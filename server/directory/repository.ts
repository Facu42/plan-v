// Directorio de nutris matriculadas: solicitud de la nutri, revisión del administrador y lista pública.
// En la base, el archivo vive en el bucket privado license-files y solo lo toca el servidor.
import { randomUUID } from 'node:crypto';
import { privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { registerDemoState } from '../demo/state.js';
import { putStorageObject, removeStorageObject, signStorageObject } from '../assets/storage.js';
import { payerEmail } from '../billing-platform/repository.js';
import * as scheduling from '../scheduling/repository.js';
import { isPublicSlug } from '../../src/types/public-slug.js';
import { publicPageProfile } from '../../src/lib/public-page-profile.js';
import {
  LICENSE_MAX_BYTES, licenseLabel,
  type AdminLicenseRow, type DirectoryCard, type DirectoryLicenseInput, type DirectoryListingView, type LicenseMime, type LicenseScope, type LicenseStatus,
} from '../../src/types/directory.js';
import type { SchedulingSettings } from '../../src/types/scheduling.js';

export { CareError };
export const LICENSE_BUCKET = 'license-files';
const MAX_PUBLIC = 500;

type Row = {
  nutritionist_id: string;
  license_number: string;
  license_scope: LicenseScope;
  license_province: string;
  file_path: string;
  file_mime: LicenseMime;
  status: LicenseStatus;
  listed: boolean;
  reject_reason: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export const memoryListings = new Map<string, Row>();
export const memoryFiles = new Map<string, Buffer>();
registerDemoState('directory', () => ({ memoryListings, memoryFiles }));

function dbError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (['42P01', 'PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'El directorio necesita instalar su migración.');
  throw new CareError(503, 'No se pudo guardar. Probá de nuevo en un rato.');
}

const DATA_URL = /^data:(application\/pdf|image\/jpeg|image\/png);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Revisa que el archivo sea de verdad un PDF, JPG o PNG (por su cabecera, no por lo que dice el navegador). */
export function decodeLicenseFile(value: string): { bytes: Buffer; mime: LicenseMime } {
  const match = DATA_URL.exec(value);
  if (!match) throw new CareError(415, 'Subí la matrícula en PDF, JPG o PNG.');
  const mime = match[1] as LicenseMime;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length < 100) throw new CareError(400, 'El archivo está vacío o dañado.');
  if (bytes.length > LICENSE_MAX_BYTES) throw new CareError(413, 'El archivo pesa más de 5 MB. Probá con una foto más liviana.');
  const head = bytes.subarray(0, 8);
  const ok = mime === 'application/pdf' ? head.subarray(0, 5).toString('latin1') === '%PDF-'
    : mime === 'image/png' ? head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (!ok) throw new CareError(415, 'El archivo no es un PDF, JPG o PNG válido.');
  return { bytes, mime };
}

function view(row: Row): DirectoryListingView {
  return {
    license_number: row.license_number,
    license_scope: row.license_scope,
    license_province: row.license_province,
    status: row.status,
    listed: row.listed,
    reject_reason: row.status === 'rejected' ? row.reject_reason : '',
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    file_kind: row.file_mime === 'application/pdf' ? 'PDF' : 'Foto',
  };
}

async function readRow(nid: string, persistent: boolean): Promise<Row | null> {
  if (!persistent) return memoryListings.get(nid) ?? null;
  const r = await privilegedDb().from('directory_listings').select('*').eq('nutritionist_id', nid).maybeSingle();
  dbError(r.error);
  return (r.data as Row | null) ?? null;
}

export async function myListing(nid: string, persistent: boolean): Promise<DirectoryListingView | null> {
  const row = await readRow(nid, persistent);
  return row ? view(row) : null;
}

/** Subir o reemplazar la matrícula. Cualquier cambio de número o archivo vuelve a «En revisión». */
export async function submitLicense(nid: string, input: DirectoryLicenseInput, persistent: boolean): Promise<DirectoryListingView> {
  const { bytes, mime } = decodeLicenseFile(input.file);
  const previous = await readRow(nid, persistent);
  const path = `${nid}/${randomUUID()}.${mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg'}`;
  const row: Row = {
    nutritionist_id: nid,
    license_number: input.license_number,
    license_scope: input.license_scope,
    license_province: input.license_scope === 'provincial' ? input.license_province : '',
    file_path: path,
    file_mime: mime,
    status: 'pending',
    listed: input.listed,
    reject_reason: '',
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
  };
  if (!persistent) {
    memoryFiles.set(path, bytes);
    memoryListings.set(nid, row);
    if (previous) memoryFiles.delete(previous.file_path);
    return view(row);
  }
  await putStorageObject(LICENSE_BUCKET, path, bytes, mime);
  const saved = await privilegedDb().from('directory_listings').upsert({ ...row, updated_at: row.submitted_at }, { onConflict: 'nutritionist_id' }).select('*').single();
  if (saved.error) {
    await removeStorageObject(LICENSE_BUCKET, path).catch(() => undefined);
    dbError(saved.error);
  }
  // El archivo anterior ya no respalda nada: se borra para no guardar documentos de más.
  if (previous && previous.file_path !== path) await removeStorageObject(LICENSE_BUCKET, previous.file_path).catch(() => undefined);
  return view(saved.data as Row);
}

/** Aparecer o no en el directorio. No cambia la revisión. */
export async function setListed(nid: string, listed: boolean, persistent: boolean): Promise<DirectoryListingView> {
  const row = await readRow(nid, persistent);
  if (!row) throw new CareError(404, 'Primero subí tu matrícula.');
  if (!persistent) {
    const next = { ...row, listed };
    memoryListings.set(nid, next);
    return view(next);
  }
  const r = await privilegedDb().from('directory_listings').update({ listed, updated_at: new Date().toISOString() }).eq('nutritionist_id', nid).select('*').single();
  dbError(r.error);
  return view(r.data as Row);
}

// ——— Administrador ———

async function namesFor(ids: string[]): Promise<Map<string, { name: string; userId: string }>> {
  if (!ids.length) return new Map();
  const r = await privilegedDb().from('nutritionists').select('id,display_name,user_id').in('id', ids);
  dbError(r.error);
  return new Map((r.data ?? []).map(n => [String(n.id), { name: String(n.display_name ?? ''), userId: String(n.user_id ?? '') }]));
}

/** Las que esperan revisión primero; después las últimas revisadas. */
export async function adminList(persistent: boolean): Promise<AdminLicenseRow[]> {
  let rows: Row[];
  if (!persistent) rows = [...memoryListings.values()];
  else {
    const r = await privilegedDb().from('directory_listings').select('*').order('submitted_at', { ascending: true }).limit(300);
    dbError(r.error);
    rows = (r.data ?? []) as Row[];
  }
  const order: Record<LicenseStatus, number> = { pending: 0, rejected: 1, verified: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status] || a.submitted_at.localeCompare(b.submitted_at));
  if (!persistent) return rows.map(row => ({ ...view(row), nutritionist_id: row.nutritionist_id, name: 'Lic. Verónica Trenti (demo)', email: 'demo@nutridash.net' }));
  const names = await namesFor(rows.map(r => r.nutritionist_id));
  return Promise.all(rows.map(async row => {
    const who = names.get(row.nutritionist_id);
    return { ...view(row), nutritionist_id: row.nutritionist_id, name: who?.name ?? '', email: who?.userId ? (await payerEmail(who.userId)) ?? '' : '' };
  }));
}

/** Enlace firmado de un minuto. En demo devuelve el archivo como data URL. */
export async function adminFile(nid: string, persistent: boolean): Promise<string> {
  const row = await readRow(nid, persistent);
  if (!row) throw new CareError(404, 'Esa nutricionista no subió matrícula.');
  if (!persistent) {
    const bytes = memoryFiles.get(row.file_path);
    if (!bytes) throw new CareError(404, 'No encontramos el archivo.');
    return `data:${row.file_mime};base64,${bytes.toString('base64')}`;
  }
  return signStorageObject(LICENSE_BUCKET, row.file_path, 60);
}

export async function adminReview(nid: string, decision: 'verify' | 'reject', reason: string, adminUserId: string | null, persistent: boolean): Promise<AdminLicenseRow> {
  const row = await readRow(nid, persistent);
  if (!row) throw new CareError(404, 'Esa nutricionista no subió matrícula.');
  if (decision === 'reject' && !reason.trim()) throw new CareError(400, 'Escribí el motivo del rechazo: la nutri lo ve.');
  const patch = {
    status: (decision === 'verify' ? 'verified' : 'rejected') as LicenseStatus,
    reject_reason: decision === 'reject' ? reason.trim() : '',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUserId,
  };
  if (!persistent) {
    memoryListings.set(nid, { ...row, ...patch });
  } else {
    // Solo se revisa el archivo que el administrador tuvo a la vista: si la nutri subió otro, falla y se recarga.
    const r = await privilegedDb().from('directory_listings').update({ ...patch, updated_at: patch.reviewed_at })
      .eq('nutritionist_id', nid).eq('file_path', row.file_path).select('nutritionist_id');
    dbError(r.error);
    if (!r.data?.length) throw new CareError(409, 'La nutri cambió su matrícula. Recargá la lista.');
  }
  return (await adminList(persistent)).find(item => item.nutritionist_id === nid)!;
}

// ——— Público ———

export function cardFor(slug: string, config: SchedulingSettings, row: Pick<Row, 'license_scope' | 'license_number' | 'license_province'>): DirectoryCard {
  const profile = publicPageProfile(config.page_extras);
  return {
    slug,
    title: config.page.title,
    area: profile.area,
    location: config.page.location,
    modality: profile.modality ?? '',
    specialties: profile.specialties.slice(0, 6),
    license: licenseLabel(row.license_scope, row.license_number, row.license_province),
    photo: config.page.logo_url.startsWith('https://') ? config.page.logo_url : '',
  };
}

/** Nutris verificadas que eligieron aparecer y tienen la página pública prendida. */
export async function publicDirectory(persistent: boolean): Promise<DirectoryCard[]> {
  const cards: DirectoryCard[] = [];
  if (!persistent) {
    for (const row of memoryListings.values()) {
      if (row.status !== 'verified' || !row.listed) continue;
      const p = scheduling.profiles.get(row.nutritionist_id);
      if (p?.config.page.enabled && isPublicSlug(p.slug)) cards.push(cardFor(p.slug, p.config, row));
    }
  } else {
    const r = await privilegedDb().from('directory_listings').select('nutritionist_id,license_number,license_scope,license_province')
      .eq('status', 'verified').eq('listed', true).limit(MAX_PUBLIC);
    dbError(r.error);
    const rows = (r.data ?? []) as Array<Pick<Row, 'nutritionist_id' | 'license_scope' | 'license_number' | 'license_province'>>;
    if (rows.length) {
      const profiles = await privilegedDb().from('scheduling_profiles').select('nutritionist_id,slug,config').in('nutritionist_id', rows.map(x => x.nutritionist_id));
      dbError(profiles.error);
      const byId = new Map((profiles.data ?? []).map(p => [String(p.nutritionist_id), p as { slug: string; config: SchedulingSettings }]));
      for (const row of rows) {
        const p = byId.get(row.nutritionist_id);
        if (p?.config?.page?.enabled && isPublicSlug(String(p.slug))) cards.push(cardFor(String(p.slug), p.config, row));
      }
    }
  }
  return cards.sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

/** Para el sello en la página pública: la matrícula verificada o vacío. */
export async function verifiedLicense(nid: string, persistent: boolean): Promise<string> {
  try {
    const row = await readRow(nid, persistent);
    return row?.status === 'verified' ? licenseLabel(row.license_scope, row.license_number, row.license_province) : '';
  } catch {
    return '';
  }
}

export function resetDirectoryMemory(): void {
  memoryListings.clear();
  memoryFiles.clear();
}
