import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { DEFAULT_CARE_PREFERENCES, isMeasurementData, isMeasurementKind, type CareInput, type CareRecord, type CarePreferences, type CareReplacement, type Measurement, type ReplacementRecipe } from '../../src/types/care.js';
import { inspectPrivateFile } from '../assets/inspect.js';
import { requireProductBuckets } from '../assets/storage.js';
import { CareError } from './errors.js';
export { CareError } from './errors.js';
const records = new Map<string, CareRecord>();
const preferences = new Map<string, CarePreferences>();
const replacements = new Map<string, CareReplacement>();
const photos = new Map<string, string>();
const documents = new Map<string, string>();
const measurements = new Map<string, Measurement>();
export function resetCareMemory() { records.clear(); preferences.clear(); replacements.clear(); photos.clear(); documents.clear(); measurements.clear(); }
export function careDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01','42883','PGRST202','PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'El seguimiento requiere instalar la migración de este módulo.');
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso o falta el consentimiento vigente.');
  if (error.code === '23505' || error.code === 'PT409') throw new CareError(409, 'Ese registro ya existe con otros datos. Recargá para revisarlo.');
  if (['22023','23514','22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá los datos del registro.');
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}
export async function listCareRecords(patientId: string | null, persistent: boolean): Promise<CareRecord[]> {
  if (!persistent) return [...records.values()].filter(r => !patientId || r.patient_id === patientId).sort((a,b) => b.created_at.localeCompare(a.created_at));
  let query = getRequestDb().from('care_records').select('id,patient_id,recorded_on,data,created_at,reviewed_at').order('created_at', { ascending: false }).limit(500);
  if (patientId) query = query.eq('patient_id', patientId);
  const { data, error } = await query; careDbError(error); return data as CareRecord[];
}
export async function saveCareRecord(patientId: string, input: CareInput, persistent: boolean): Promise<CareRecord> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_care_record', { target: patientId, record_id: input.id, record_date: input.recorded_on, record_data: input.data });
    careDbError(error); return data as CareRecord;
  }
  const old = records.get(input.id);
  if (old) {
    if (old.patient_id !== patientId || old.recorded_on !== input.recorded_on || JSON.stringify(old.data) !== JSON.stringify(input.data)) throw new CareError(409, 'El identificador ya corresponde a otro registro.');
    return old;
  }
  const record = { ...input, patient_id: patientId, created_at: new Date().toISOString(), reviewed_at: input.data.kind === 'payment' ? new Date().toISOString() : null };
  records.set(record.id, record);
  rememberMeasurement(record);
  return record;
}
function rememberMeasurement(record: CareRecord) {
  if (!isMeasurementData(record.data)) return;
  measurements.set(record.id, {
    id: record.id,
    patient_id: record.patient_id,
    kind: record.data.kind,
    value_numeric: record.data.value,
    unit: record.data.unit,
    source: record.data.source,
    captured_on: record.recorded_on,
    created_at: record.created_at,
  });
}
function asMeasurement(row: { id: string; patient_id: string; kind: string; value_numeric: number | string; unit: string; source: string; captured_on: string; created_at: string }): Measurement {
  if (!isMeasurementKind(row.kind)) throw new CareError(400, 'Revisá los datos del registro.');
  if (row.source !== 'patient' && row.source !== 'professional') throw new CareError(400, 'Revisá los datos del registro.');
  return {
    id: row.id,
    patient_id: row.patient_id,
    kind: row.kind,
    value_numeric: Number(row.value_numeric),
    unit: row.unit,
    source: row.source,
    captured_on: row.captured_on,
    created_at: row.created_at,
  };
}
export async function listMeasurements(patientId: string, persistent: boolean): Promise<Measurement[]> {
  if (!persistent) {
    return [...measurements.values()]
      .filter((entry) => entry.patient_id === patientId)
      .sort((a, b) => b.captured_on.localeCompare(a.captured_on) || b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await getRequestDb()
    .from('measurements')
    .select('id,patient_id,kind,value_numeric,unit,source,captured_on,created_at')
    .eq('patient_id', patientId)
    .order('captured_on', { ascending: false })
    .limit(500);
  careDbError(error);
  return (data ?? []).map(asMeasurement);
}
export async function reviewCareRecord(patientId: string, id: string, persistent: boolean) {
  if (persistent) { const { error } = await getRequestDb().rpc('review_care_record', { target: patientId, record_id: id }); careDbError(error); return; }
  const record = records.get(id); if (!record || record.patient_id !== patientId) throw new CareError(404, 'Registro no encontrado.');
  record.reviewed_at ??= new Date().toISOString();
}
export async function getCarePreferences(patientId: string, persistent: boolean): Promise<CarePreferences> {
  if (!persistent) return preferences.get(patientId) ?? { ...DEFAULT_CARE_PREFERENCES };
  const { data, error } = await getRequestDb().from('care_preferences').select('settings').eq('patient_id', patientId).maybeSingle();
  careDbError(error); return data?.settings ?? { ...DEFAULT_CARE_PREFERENCES };
}
export async function saveCarePreferences(patientId: string, settings: CarePreferences, persistent: boolean) {
  if (!persistent) { preferences.set(patientId, settings); return; }
  const { error } = await getRequestDb().rpc('save_care_preferences', { target: patientId, settings_value: settings }); careDbError(error);
}
export async function listReplacements(patientId: string, persistent: boolean): Promise<CareReplacement[]> {
  if (!persistent) return [...replacements.values()].filter(r => r.patient_id === patientId);
  const { data, error } = await getRequestDb().from('care_replacements').select('id,patient_id,request_id,recipe,source,published_at,created_at').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(100);
  careDbError(error); return data as CareReplacement[];
}
export async function saveReplacement(entry: CareReplacement, persistent: boolean) {
  if (!persistent) { replacements.set(entry.id, entry); return; }
  const { error } = await getRequestDb().from('care_replacements').insert(entry); careDbError(error);
}
export async function publishReplacement(patientId: string, id: string, persistent: boolean, expected:ReplacementRecipe, recipe:ReplacementRecipe) {
  if (!persistent) {
    const entry = replacements.get(id); if (!entry || entry.patient_id !== patientId) throw new CareError(404, 'Propuesta no encontrada.');
    if(entry.published_at){if(JSON.stringify(entry.recipe)===JSON.stringify(recipe))return;throw new CareError(409,'Esta alternativa ya fue publicada.');}
    if(JSON.stringify(entry.recipe)!==JSON.stringify(expected))throw new CareError(409,'La propuesta cambió. Recargá antes de publicar.');
    entry.recipe=recipe;entry.published_at=new Date().toISOString(); await reviewCareRecord(patientId,entry.request_id,false); return;
  }
  const { error } = await getRequestDb().rpc('publish_care_replacement', { target: patientId, replacement_id: id, expected_recipe:expected, recipe_value:recipe }); careDbError(error);
}
export function validatePhoto(dataUrl: string) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new CareError(400, 'Usá una imagen JPG, PNG o WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 5 * 1024 * 1024) throw new CareError(413, 'La foto debe pesar menos de 5 MB.');
  const valid = match[1] === 'jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : match[1] === 'png' ? bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a' : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!valid) throw new CareError(400, 'El contenido no corresponde a una imagen válida.');
  const inspected = inspectPrivateFile('body_progress', bytes, `image/${match[1]}`);
  return { bytes: inspected.bytes, mime: inspected.mime };
}
export async function storeCarePhoto(path: string, dataUrl: string, persistent: boolean) {
  const { bytes, mime } = validatePhoto(dataUrl);
  const cleaned = `data:${mime};base64,${bytes.toString('base64')}`;
  if (!persistent) { const previous=photos.get(path); if(previous && !validatePhoto(previous).bytes.equals(bytes)) throw new CareError(409,'Ese registro ya tiene otra foto.'); photos.set(path, cleaned); return; }
  await requireProductBuckets(['care-photos', 'care-quarantine']);
  const { error } = await getRequestDb().storage.from('care-photos').upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    // Recuperar una carga aceptada cuyo acuse se perdió, sin sobrescribirla.
    if (String(error.statusCode)==='409' || error.message.toLowerCase().includes('already exists')) {
      const old=await getRequestDb().storage.from('care-photos').download(path);
      if (!old.error && old.data && Buffer.from(await old.data.arrayBuffer()).equals(bytes)) return;
      throw new CareError(409,'Ese registro ya tiene otra foto.');
    }
    throw new CareError(503, 'No se pudo guardar la foto privada.');
  }
}
export async function deleteCarePhoto(patientId:string,id:string,persistent:boolean) {
  const record=(await listCareRecords(patientId,persistent)).find(r=>r.id===id);
  if(!record || record.data.kind!=='body_photo')throw new CareError(404,'Foto no encontrada.');
  if(!persistent){photos.delete(record.data.path);records.delete(id);return;}
  if(record.data.path!==`${patientId}/${id}`)throw new CareError(403,'Ruta de foto inválida.');
  // Borrado acotado tras verificar propietario en la ruta y leer la fila con RLS.
  // Permite eliminar el blob aun cuando retirar consentimiento ya bloqueó SELECT.
  const {error}=await privilegedDb().storage.from('care-photos').remove([record.data.path]);
  if(error)throw new CareError(503,'No se pudo eliminar la foto. Reintentá.');
  const result=await getRequestDb().rpc('delete_care_photo',{target:patientId,record_id:id});careDbError(result.error);
}
export async function carePhotoUrl(path: string, persistent: boolean) {
  if (!persistent) { const url = photos.get(path); if (!url) throw new CareError(404, 'La foto demo ya no está disponible.'); return url; }
  const { data, error } = await getRequestDb().storage.from('care-photos').createSignedUrl(path, 60);
  if (error || !data) throw new CareError(503, 'No se pudo abrir la foto.'); return data.signedUrl;
}
export function sanitizeDocumentFilename(name: string) {
  const filename = name.replace(/[/\\]/g, '').trim().slice(0, 120);
  if (!filename) throw new CareError(400, 'El archivo necesita un nombre.');
  return filename;
}
export function validateDocument(dataUrl: string) {
  const match = /^data:(application\/pdf|image\/jpeg|image\/png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new CareError(400, 'Usá un PDF, JPG o PNG.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 20 * 1024 * 1024) throw new CareError(413, 'El estudio debe pesar menos de 20 MB.');
  const mime = match[1] as 'application/pdf' | 'image/jpeg' | 'image/png';
  const valid = mime === 'application/pdf'
    ? bytes.subarray(0, 4).toString() === '%PDF'
    : mime === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  if (!valid) throw new CareError(400, 'El contenido no corresponde al tipo de archivo indicado.');
  const inspected = inspectPrivateFile('clinical_document', bytes, mime);
  return { bytes: inspected.bytes, mime };
}
async function putPrivateBlob(bucket: 'care-photos' | 'care-documents', path: string, bytes: Buffer, mime: string, previous: string | undefined, persistent: boolean) {
  if (!persistent) {
    if (previous) {
      const old = bucket === 'care-photos' ? validatePhoto(previous).bytes : validateDocument(previous).bytes;
      if (!old.equals(bytes)) throw new CareError(409, bucket === 'care-photos' ? 'Ese registro ya tiene otra foto.' : 'Ese registro ya tiene otro estudio.');
    }
    return;
  }
  const { error } = await getRequestDb().storage.from(bucket).upload(path, bytes, { contentType: mime, upsert: false });
  if (!error) return;
  if (String(error.statusCode) === '409' || error.message.toLowerCase().includes('already exists')) {
    const old = await getRequestDb().storage.from(bucket).download(path);
    if (!old.error && old.data && Buffer.from(await old.data.arrayBuffer()).equals(bytes)) return;
    throw new CareError(409, bucket === 'care-photos' ? 'Ese registro ya tiene otra foto.' : 'Ese registro ya tiene otro estudio.');
  }
  throw new CareError(503, bucket === 'care-photos' ? 'No se pudo guardar la foto privada.' : 'No se pudo guardar el estudio.');
}
export async function storeCareDocument(path: string, dataUrl: string, persistent: boolean) {
  const { bytes, mime } = validateDocument(dataUrl);
  if (persistent) await requireProductBuckets(['care-documents', 'care-quarantine']);
  await putPrivateBlob('care-documents', path, bytes, mime, documents.get(path), persistent);
  if (!persistent) documents.set(path, `data:${mime};base64,${bytes.toString('base64')}`);
}
export async function deleteCareDocument(patientId: string, id: string, persistent: boolean) {
  const record = (await listCareRecords(patientId, persistent)).find(r => r.id === id);
  if (!record || record.data.kind !== 'clinical_document') throw new CareError(404, 'Estudio no encontrado.');
  if (!persistent) { documents.delete(record.data.path); records.delete(id); return; }
  if (record.data.path !== `${patientId}/${id}`) throw new CareError(403, 'Ruta de estudio inválida.');
  const { error } = await privilegedDb().storage.from('care-documents').remove([record.data.path]);
  if (error) throw new CareError(503, 'No se pudo eliminar el estudio. Reintentá.');
  const result = await getRequestDb().rpc('delete_care_document', { target: patientId, record_id: id }); careDbError(result.error);
}
export async function careDocumentUrl(path: string, persistent: boolean) {
  if (!persistent) { const url = documents.get(path); if (!url) throw new CareError(404, 'El estudio demo ya no está disponible.'); return url; }
  const { data, error } = await getRequestDb().storage.from('care-documents').createSignedUrl(path, 60);
  if (error || !data) throw new CareError(503, 'No se pudo abrir el estudio.'); return data.signedUrl;
}
