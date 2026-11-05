// «Descargar mis datos» (Ajustes › Mi cuenta › Tus datos): arma un .zip con
// · una planilla de Excel con las pacientes y otra hoja con los turnos,
// · la historia clínica de cada paciente en PDF (solo las que dieron el permiso de atención),
// · un LEEME.txt que dice qué entró y qué no, y por qué.
// Todo se lee con la sesión de la nutricionista (las políticas de la base siguen filtrando por consultorio).
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { z } from 'zod';
import { getRequestDb } from '../db/supabase-client.js';
import { getStore } from '../store.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { listMeasurements } from '../care/repository.js';
import { readIntakeBundle } from '../intake/repository.js';
import { getIntakeRecord } from '../intake/memory.js';
import { listImportedHistory } from '../patient-import/repository.js';
import { listImportedMeasurements } from '../patient-import/external-authorization.js';
import { auditClinicalAccess, clinicalExportBrand, clinicalSnapshot } from '../clinical-workspace/repository.js';
import { listHistory, type HistoryEntry } from '../crm/patient-history.js';
import { readAllRows, type WorkScope } from '../crm/repository.js';
import { argentinaToday } from '../progress/derive.js';
import { buildClinicalPdf, type PdfSection } from '../../src/lib/clinical-pdf.js';
import { intakeExportLines } from '../../src/lib/clinical-workspace.js';
import { historyTitle, recordLines } from '../../src/lib/clinical-record-lines.js';
import { importedClinicalSections } from '../../src/lib/imported-clinical-export.js';
import { metricDefinition } from '../../src/lib/body-metrics.js';
import type { ClinicBrand } from '../../src/types/clinical-workspace.js';
import { buildXlsx, type Cell, type Sheet } from './xlsx.js';

export const exportPartsSchema = z.object({
  pacientes: z.boolean(),
  turnos: z.boolean(),
  historia: z.boolean(),
}).strict().refine(p => p.pacientes || p.turnos || p.historia, { message: 'Elegí al menos una parte.' });
export type ExportParts = z.infer<typeof exportPartsSchema>;

/** Lee `?pacientes=1&turnos=0&historia=1`; sin ningún parámetro, va todo. */
export function readExportParts(query: (key: string) => string | undefined): ExportParts {
  const flag = (key: string) => { const v = query(key); return v === undefined ? undefined : v === '1' || v === 'true'; };
  const given = { pacientes: flag('pacientes'), turnos: flag('turnos'), historia: flag('historia') };
  const none = Object.values(given).every(v => v === undefined);
  const parsed = exportPartsSchema.safeParse(none ? { pacientes: true, turnos: true, historia: true } : { pacientes: !!given.pacientes, turnos: !!given.turnos, historia: !!given.historia });
  if (!parsed.success) throw new CareError(400, 'Elegí al menos una parte para descargar.');
  return parsed.data;
}

const STAGE: Record<string, string> = { ingreso: 'Ingreso', plan: 'Plan', seguimiento: 'Seguimiento', alta: 'Alta' };
const CHANNEL: Record<string, string> = { video: 'Videollamada', presencial: 'Consultorio' };
const APPT_STATUS: Record<string, string> = { scheduled: 'Agendado', done: 'Realizado', cancelled: 'Cancelado' };
const TZ = 'America/Argentina/Buenos_Aires';
const dayFmt = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fecha = (iso: string | null | undefined) => { if (!iso) return ''; const d = new Date(iso); return Number.isFinite(d.getTime()) ? dayFmt.format(d) : ''; };
const hora = (iso: string | null | undefined) => { if (!iso) return ''; const d = new Date(iso); return Number.isFinite(d.getTime()) ? timeFmt.format(d) : ''; };
const ymd = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : date;

export type ExportPatient = { id: string; name: string; email: string; phone: string; goal: string; stage: string; status: string; has_account: boolean; created_at: string | null; archived_at: string | null; deactivated_at: string | null; anonymized_at: string | null };
export type ExportAppointment = { patient_id: string; starts_at: string | null; when: string; duration_min: number; channel: string; status: string; prep_note: string; created_at: string | null };

function patientState(p: ExportPatient) {
  if (p.anonymized_at) return 'Datos borrados';
  if (p.deactivated_at) return 'Dada de baja';
  if (p.archived_at) return 'Archivada';
  return 'Activa';
}

async function loadPatients(scope: WorkScope): Promise<ExportPatient[]> {
  if (!scope.persistent) {
    return getStore().patients.map(p => ({ id: p.id, name: p.name, email: '', phone: p.phone ?? '', goal: p.goal ?? '', stage: p.stage, status: p.status ?? '', has_account: Boolean(p.has_account), created_at: p.created_at ?? null, archived_at: p.archived_at ?? null, deactivated_at: p.deactivated_at ?? null, anonymized_at: p.anonymized_at ?? null }));
  }
  const db = getRequestDb();
  try {
    const [rows, invites] = await Promise.all([
      readAllRows((offset, end) => db.from('patients').select('id,full_name,phone,goal,stage,status,user_id,created_at,archived_at,deactivated_at,anonymized_at').eq('nutritionist_id', scope.nutritionistId).order('full_name').order('id').range(offset, end)),
      readAllRows((offset, end) => db.from('patient_invites').select('id,patient_id,email,created_at').eq('nutritionist_id', scope.nutritionistId).order('created_at', { ascending: false }).order('id').range(offset, end)),
    ]);
    const email = new Map<string, string>();
    for (const invite of invites) if (!email.has(String(invite.patient_id))) email.set(String(invite.patient_id), String(invite.email ?? ''));
    return rows.map(r => ({
      id: String(r.id), name: String(r.full_name ?? ''), email: r.anonymized_at ? '' : email.get(String(r.id)) ?? '', phone: String(r.phone ?? ''), goal: String(r.goal ?? ''),
      stage: String(r.stage ?? ''), status: String(r.status ?? ''), has_account: Boolean(r.user_id), created_at: (r.created_at as string | null) ?? null,
      archived_at: (r.archived_at as string | null) ?? null, deactivated_at: (r.deactivated_at as string | null) ?? null, anonymized_at: (r.anonymized_at as string | null) ?? null,
    }));
  } catch (error) {
    if (error instanceof CareError) throw error;
    throw new CareError(503, 'No pudimos leer tus pacientes. Probá de nuevo en un momento.');
  }
}

async function loadAppointments(scope: WorkScope): Promise<ExportAppointment[]> {
  if (!scope.persistent) {
    const rows: ExportAppointment[] = [];
    for (const p of getStore().patients) {
      const a = p.appointment;
      if (a) rows.push({ patient_id: p.id, starts_at: a.starts_at ?? null, when: a.when ?? '', duration_min: a.duration, channel: a.channel, status: 'scheduled', prep_note: '', created_at: null });
    }
    return rows;
  }
  const db = getRequestDb();
  try {
    const rows = await readAllRows((offset, end) => db.from('appointments').select('id,patient_id,starts_at,duration_min,channel,status,prep_note,created_at').eq('nutritionist_id', scope.nutritionistId).order('starts_at').order('id').range(offset, end));
    return rows.map(r => ({ patient_id: String(r.patient_id), starts_at: (r.starts_at as string | null) ?? null, when: '', duration_min: Number(r.duration_min ?? 0), channel: String(r.channel ?? ''), status: String(r.status ?? ''), prep_note: String(r.prep_note ?? ''), created_at: (r.created_at as string | null) ?? null }));
  } catch (error) {
    if (error instanceof CareError) throw error;
    throw new CareError(503, 'No pudimos leer tus turnos. Probá de nuevo en un momento.');
  }
}

export function patientsSheet(patients: ExportPatient[]): Sheet {
  const rows: Cell[][] = [['Nombre', 'Mail', 'Teléfono', 'Objetivo', 'Etapa', 'Estado del seguimiento', 'Cuenta en la app', 'Alta en el consultorio', 'Situación']];
  for (const p of patients) {
    if (p.anonymized_at) { rows.push(['(datos borrados a pedido)', '', '', '', '', '', '', fecha(p.created_at), patientState(p)]); continue; }
    rows.push([p.name, p.email, p.phone, p.goal, STAGE[p.stage] ?? p.stage, p.status, p.has_account ? 'Sí' : 'No', fecha(p.created_at), patientState(p)]);
  }
  return { name: 'Pacientes', rows };
}

export function appointmentsSheet(appointments: ExportAppointment[], patients: ExportPatient[]): Sheet {
  const names = new Map(patients.map(p => [p.id, p.anonymized_at ? '(datos borrados a pedido)' : p.name]));
  const rows: Cell[][] = [['Fecha', 'Hora', 'Paciente', 'Duración (min)', 'Modalidad', 'Estado', 'Nota para preparar la consulta', 'Cargado el']];
  for (const a of appointments) rows.push([a.starts_at ? fecha(a.starts_at) : a.when, a.starts_at ? hora(a.starts_at) : '', names.get(a.patient_id) ?? '', a.duration_min || '', CHANNEL[a.channel] ?? a.channel, APPT_STATUS[a.status] ?? a.status, a.prep_note, fecha(a.created_at)]);
  return { name: 'Turnos', rows };
}

const TOPICS: Record<HistoryEntry['topic'], string> = {
  motivo: 'Motivo y objetivo', diag: 'Diagnósticos', med: 'Medicación y suplementos', alerg: 'Alergias e intolerancias', fam: 'Antecedentes familiares',
  halim: 'Historia alimentaria', r24: 'Recordatorio de 24 h', hab: 'Hábitos', act: 'Actividad física', sue: 'Sueño y estrés', dig: 'Digestión',
  ciclo: 'Ciclo menstrual', emb: 'Embarazo y lactancia', pref: 'Preferencias y rechazos',
};

/** Historia clínica por temas, en el orden de la ficha; lo dado de baja queda con su fecha. */
export function historySections(entries: HistoryEntry[]): PdfSection[] {
  const sections: PdfSection[] = [];
  for (const [topic, title] of Object.entries(TOPICS) as Array<[HistoryEntry['topic'], string]>) {
    const rows = entries.filter(e => e.topic === topic);
    if (!rows.length) continue;
    sections.push({ title: `Historia clínica · ${title}`, lines: rows.map(e => {
      const since = e.since ? ` (desde ${e.since})` : '';
      const ended = e.ended_on ? ` — dado de baja el ${ymd(e.ended_on)}${e.ended_reason ? `: ${e.ended_reason}` : ''}` : '';
      return `${ymd(e.recorded_on)} · ${e.text}${since}${ended}`;
    }) });
  }
  return sections;
}

let fontCache: Promise<Uint8Array> | null = null;
/** Poppins en TrueType para el PDF: el archivo que prepara el build o, si no está (la API no corre el build), se descomprime del paquete de la letra. */
export function pdfFont(): Promise<Uint8Array> {
  fontCache ??= (async () => {
    try { return new Uint8Array(await readFile(resolve(process.cwd(), 'public/clinical-pdf/Poppins-Regular.ttf'))); } catch { /* sigue con el paquete */ }
    const woff2 = await readFile(resolve(process.cwd(), 'node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2'));
    const mod = await import('wawoff2' as string) as { default?: { decompress: (b: Uint8Array) => Promise<Uint8Array> }; decompress?: (b: Uint8Array) => Promise<Uint8Array> };
    const decompress = mod.decompress ?? mod.default?.decompress;
    if (!decompress) throw new Error('pdf_font_unavailable');
    return new Uint8Array(await decompress(woff2));
  })().catch(error => { fontCache = null; throw error; });
  return fontCache;
}

async function patientPdf(scope: WorkScope, p: ExportPatient, brand: ClinicBrand, font: Uint8Array): Promise<Uint8Array> {
  const consents = (await currentCareConsents(p.id, scope.persistent)).consented;
  await auditClinicalAccess(p.id, 'export', scope.persistent);
  const intake = scope.persistent ? (await readIntakeBundle(p.id)).intake : getIntakeRecord(p.id);
  const [entries, snapshot, measurements, importedHistory, importedMeasurements] = await Promise.all([
    listHistory(scope, p.id).catch(() => [] as HistoryEntry[]),
    clinicalSnapshot(p.id, scope.nutritionistId, scope.persistent),
    consents.includes('measurement') ? listMeasurements(p.id, scope.persistent) : Promise.resolve([]),
    listImportedHistory(p.id, scope.persistent),
    listImportedMeasurements(p.id, scope.persistent),
  ]);
  const sections: PdfSection[] = [
    { title: 'Datos de la paciente', lines: [`Nombre: ${p.name}`, `Objetivo: ${p.goal || 'sin registrar'}`, ...(p.phone ? [`Teléfono: ${p.phone}`] : []), ...(p.email ? [`Mail: ${p.email}`] : []), `Situación: ${patientState(p)}`] },
    ...historySections(entries),
    { title: 'Formulario de ingreso', lines: intakeExportLines((intake?.payload ?? {}) as Record<string, unknown>) },
    { title: 'Mediciones', lines: measurements.length ? measurements.map(m => `${ymd(m.captured_on)}: ${metricDefinition(m.kind).label} ${m.value_numeric} ${m.unit}`) : ['Sin mediciones con permiso de la paciente.'] },
    ...snapshot.records.map(r => ({ title: `${historyTitle(r)} · ${ymd(r.recorded_on)}`, lines: recordLines(r) })),
    ...importedClinicalSections(importedHistory, importedMeasurements),
  ];
  const weight = measurements.filter(m => m.kind === 'weight' && ['kg', 'lb'].includes(m.unit)).map(m => ({ date: m.captured_on, value: m.unit === 'lb' ? m.value_numeric * 0.45359237 : m.value_numeric }));
  return buildClinicalPdf({ title: 'Historia clínica', patientName: p.name, brand, sections, charts: [{ title: 'Evolución del peso', unit: 'kg', points: weight }], fontBytes: font });
}

/** Nombre de archivo seguro y legible en cualquier compu: «Ana Perez.pdf» (sin tildes, porque algunos descompresores de Windows las rompen); si se repite, «Ana Perez (2).pdf». */
export function fileName(name: string, used: Set<string>, ext: string): string {
  const base = (name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80).replace(/[.\s]+$/, '')) || 'Paciente';
  let candidate = `${base}${ext}`, i = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base} (${i++})${ext}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

const HISTORY_BATCH = 4;

export async function buildDataExport(scope: WorkScope, parts: ExportParts, now = new Date()): Promise<{ filename: string; bytes: Uint8Array }> {
  const today = argentinaToday(now);
  const patients = await loadPatients(scope);
  const zip = new JSZip();
  const readme: string[] = [`Tus datos de Nutridash · descargados el ${ymd(today)}.`, ''];

  const sheets: Sheet[] = [];
  if (parts.pacientes) sheets.push(patientsSheet(patients));
  if (parts.turnos) sheets.push(appointmentsSheet(await loadAppointments(scope), patients));
  if (sheets.length) {
    const name = parts.pacientes && parts.turnos ? 'pacientes-y-turnos.xlsx' : parts.pacientes ? 'pacientes.xlsx' : 'turnos.xlsx';
    zip.file(name, await buildXlsx(sheets));
    readme.push(`· ${name}: ${sheets.map(s => `hoja «${s.name}» (${s.rows.length - 1} ${s.rows.length - 1 === 1 ? 'fila' : 'filas'})`).join(' y ')}.`);
  }

  if (parts.historia) {
    // Sin firma del consultorio cargada, el PDF sale con el nombre de Nutridash (la ficha pide la firma; acá no se frena toda la descarga).
    const brand: ClinicBrand = await clinicalExportBrand(scope.nutritionistId, scope.persistent) ?? { name: 'Nutridash', contact: '', license: '', logo: null };
    const font = await pdfFont();
    const folder = zip.folder('historias-clinicas')!;
    const used = new Set<string>(), skipped: string[] = [];
    const candidates = patients.filter(p => !p.anonymized_at && !p.deactivated_at);
    let done = 0;
    for (let i = 0; i < candidates.length; i += HISTORY_BATCH) {
      const batch = candidates.slice(i, i + HISTORY_BATCH);
      const results = await Promise.allSettled(batch.map(async p => {
        const consents = (await currentCareConsents(p.id, scope.persistent)).consented;
        if (!consents.includes('care_relationship')) return { p, pdf: null as Uint8Array | null, reason: 'todavía no dio el permiso de atención en la app' };
        return { p, pdf: await patientPdf(scope, p, brand, font), reason: '' };
      }));
      results.forEach((r, j) => {
        if (r.status === 'fulfilled' && r.value.pdf) { folder.file(fileName(r.value.p.name, used, '.pdf'), r.value.pdf); done++; return; }
        const reason = r.status === 'fulfilled' ? r.value.reason : 'no se pudo leer su ficha; probá de nuevo más tarde';
        skipped.push(`  - ${batch[j].name}: ${reason}.`);
      });
    }
    readme.push(`· historias-clinicas/: ${done} PDF, uno por paciente (datos, historia clínica, formulario de ingreso, mediciones, evaluaciones y datos importados). No incluye tus notas privadas.`);
    if (skipped.length) readme.push('  Sin PDF:', ...skipped);
    const gone = patients.filter(p => p.anonymized_at || p.deactivated_at).length;
    if (gone) readme.push(`  ${gone} ${gone === 1 ? 'paciente dada de baja o con datos borrados no tiene' : 'pacientes dadas de baja o con datos borrados no tienen'} PDF.`);
  }

  readme.push('', 'Los datos de salud son sensibles: guardá este archivo en un lugar seguro y no lo compartas.');
  zip.file('LEEME.txt', readme.join('\r\n') + '\r\n');
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return { filename: `nutridash-mis-datos-${today}.zip`, bytes };
}
