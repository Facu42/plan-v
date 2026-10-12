import type { ImportCandidate, ImportOrigin } from '../types/patient-import';

export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
export const MAX_IMPORT_TEXT = 200000;
export type MappingField = 'name'|'email'|'phone'|'date'|'weight'|'waist'|'hip'|'weight_unit'|'length_unit'|'history'|'study'|'plan';
export type ImportMapping = Partial<Record<MappingField, number>>;
export type LocalCandidate = Omit<ImportCandidate, 'reviewed'> & { warnings: string[] };
export type LocalDocument = { file: string; fingerprint: string; tables: { sheet: string; rows: string[][] }[]; pages: { page: number; text: string }[] };

export function validateImportFile(file: { name: string; size: number }) {
  if (!file.size || file.size > MAX_IMPORT_BYTES) throw new Error('Cada archivo debe pesar entre 1 byte y 20 MB.');
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xls' || ext === 'doc') throw new Error('Convertí los archivos antiguos a .xlsx o .docx antes de cargarlos.');
  if (!['xlsx','csv','docx','pdf','jpg','jpeg','png'].includes(ext ?? '')) throw new Error('Elegí Excel, CSV, Word, PDF o fotos JPG/PNG.');
  if (file.name.length > 120 || /[\\/]/.test(file.name)) throw new Error('Acortá el nombre del archivo (hasta 120 caracteres).');
  return ext!;
}

/** RFC 4180, con punto y coma para exportaciones regionales. No ejecuta fórmulas. */
export function parseCsv(text: string): string[][] {
  if (text.length > MAX_IMPORT_TEXT) throw new Error('El texto es demasiado extenso. Dividí el archivo.');
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const separator = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
  const result: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (char === separator && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) result.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Hay una celda con comillas sin cerrar. Revisá el CSV.');
  row.push(cell); if (row.some(Boolean)) result.push(row);
  return result;
}

export function parseImportNumber(text: string): number | null {
  const s = text.trim(); if (!s || !/^-?[\d.,]+$/.test(s)) return null;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized); return Number.isFinite(n) ? n : null;
}
export function parseImportDate(text: string): string | null {
  const s = text.trim(); const regional = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  let iso = regional ? `${regional[3]}-${regional[2].padStart(2,'0')}-${regional[1].padStart(2,'0')}` : s;
  if (/^\d{5}$/.test(s) && Number(s) >= 30000 && Number(s) <= 90000) iso = new Date(Date.UTC(1899,11,30) + Number(s)*86400000).toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === iso ? iso : null;
}
export function suggestMapping(headers: string[]): ImportMapping {
  const aliases: Record<MappingField, string[]> = {
    name: ['nombre','nombre completo','paciente','name'], email: ['email','mail','correo','e-mail'], phone: ['telefono','celular','phone'],
    date: ['fecha','date'], weight: ['peso','weight'], waist: ['cintura','waist'], hip: ['cadera','hip'],
    weight_unit: ['unidad peso'], length_unit: ['unidad perimetro'], history: ['antecedentes','historia','notas'], study: ['estudios','laboratorio'], plan: ['plan','plan historico'],
  };
  const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return Object.fromEntries(Object.entries(aliases).flatMap(([field, names]) => { const i = headers.findIndex(h => names.includes(normalize(h))); return i < 0 ? [] : [[field,i]]; }));
}
export function mapImportRows(rows: string[][], mapping: ImportMapping, origin: Omit<ImportOrigin,'row'>): LocalCandidate[] {
  const candidates = new Map<string, LocalCandidate>();
  rows.forEach((row, index) => {
    const value = (field: MappingField) => mapping[field] == null ? '' : (row[mapping[field]!] ?? '').trim();
    if (!row.some(Boolean)) return;
    const email = value('email').toLowerCase(); const name = value('name');
    const grouping = email ? `email:${email}` : `row:${index}`;
    const source: ImportOrigin = { ...origin, row: index + 2 };
    let candidate = candidates.get(grouping);
    if (!candidate) { candidate = { key: crypto.randomUUID(), name, email, phone: value('phone'), action:'create', patient_id:null, origins:[], history:[], measurements:[], warnings:[] }; candidates.set(grouping,candidate); }
    else if (candidate.name !== name) candidate.warnings.push('El mismo email tiene nombres distintos: revisá si son la misma persona.');
    candidate.origins.push(source);
    if (name.length < 2) candidate.warnings.push('Falta el nombre completo.');
    for (const kind of ['weight','waist','hip'] as const) {
      const raw = value(kind); if (!raw) continue;
      const number = parseImportNumber(raw); const date = parseImportDate(value('date'));
      const unit = value(kind === 'weight' ? 'weight_unit' : 'length_unit') || (kind === 'weight' ? 'kg' : 'cm');
      if (number == null || !date || !['kg','lb','cm','in'].includes(unit)) candidate.warnings.push(`Revisá fecha, valor y unidad de ${kind === 'weight' ? 'peso' : kind === 'waist' ? 'cintura' : 'cadera'} en fila ${index+2}.`);
      else candidate.measurements.push({kind,value:number,unit:unit as 'kg'|'lb'|'cm'|'in',date,origin:source});
    }
    for (const category of ['history','study','plan'] as const) { const text = value(category); if (text) candidate.history.push({category,text,origin:source}); }
  });
  if (candidates.size > 100) throw new Error('Dividí el lote: se pueden revisar hasta 100 pacientes por vez.');
  return [...candidates.values()];
}
