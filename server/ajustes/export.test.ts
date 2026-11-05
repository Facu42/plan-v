import { Hono } from 'hono';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerAjustesRoutes } from './routes.js';
import { CareError } from '../care/errors.js';
import { resetRateLimits } from '../ops/rate-limit.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { appendConsent } from '../intake/memory.js';
import { addHistoryEntry } from '../crm/patient-history.js';
import { resolveWorkScope } from '../crm/repository.js';
import { appointmentsSheet, fileName, historySections, patientsSheet, readExportParts, type ExportPatient } from './export.js';
import { buildXlsx, columnName, sheetName } from './xlsx.js';

const mock = vi.hoisted(() => ({ actor: vi.fn(), enabled: false }));
vi.mock('../db/supabase-client.js', async original => ({ ...await original<typeof import('../db/supabase-client.js')>(), isSupabaseEnabled: () => mock.enabled }));
vi.mock('../db/supabase-repo.js', async original => ({ ...await original<typeof import('../db/supabase-repo.js')>(), sbGetActor: mock.actor }));

function app(real = false) {
  const api = new Hono();
  api.use('*', async (c, next) => { c.set('auth', real ? { userId: 'actor' } : { demo: true }); await next(); });
  api.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: String(error) }, 500));
  registerAjustesRoutes(api); return api;
}
const patient = (over: Partial<ExportPatient> = {}): ExportPatient => ({ id: 'p1', name: 'Ana Pérez', email: 'ana@ejemplo.com', phone: '11 5555-0000', goal: 'Bajar 4 kg', stage: 'seguimiento', status: 'En ritmo', has_account: true, created_at: '2026-10-01T15:00:00Z', archived_at: null, deactivated_at: null, anonymized_at: null, ...over });
function grant(purpose: string) { const text = CONSENT_CATALOG.find(c => c.purpose === purpose)!; appendConsent('pat-sofia', { purpose: text.purpose, text_version: text.text_version, text_hash: text.text_hash, decision: 'granted', actor_id: 'demo-patient' }); }
beforeEach(() => { resetStore(); resetRateLimits(); mock.enabled = false; mock.actor.mockReset(); });

describe('Descargar mis datos', () => {
  it('arma el zip con la planilla, una historia clínica en PDF por paciente y el LEEME', async () => {
    grant('care_relationship'); grant('measurement');
    await addHistoryEntry(await resolveWorkScope(null, false), 'pat-sofia', { topic: 'alerg', text: 'Celiaquía confirmada', since: '2019' });
    const res = await app().request('/api/ajustes/export');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/zip');
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="nutridash-mis-datos-\d{4}-\d{2}-\d{2}\.zip"/);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const zip = await JSZip.loadAsync(await res.arrayBuffer());
    const names = Object.keys(zip.files);
    expect(names).toContain('pacientes-y-turnos.xlsx');
    expect(names).toContain('LEEME.txt');
    const xlsx = await JSZip.loadAsync(await zip.file('pacientes-y-turnos.xlsx')!.async('uint8array'));
    const workbook = await xlsx.file('xl/workbook.xml')!.async('string');
    expect(workbook).toContain('name="Pacientes"');
    expect(workbook).toContain('name="Turnos"');
    const pacientes = await xlsx.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(pacientes).toContain('<t xml:space="preserve">Nombre</t>');
    const readme = await zip.file('LEEME.txt')!.async('string');
    expect(readme).toContain('No incluye tus notas privadas');
    const pdfs = names.filter(n => n.startsWith('historias-clinicas/') && n.endsWith('.pdf'));
    expect(pdfs).toEqual(['historias-clinicas/Sofia R.pdf']);
    expect(readme).toContain('1 PDF');
    expect(readme).toMatch(/Marina C\.: todavía no dio el permiso de atención/);
    for (const name of pdfs) {
      const pdf = await PDFDocument.load(await zip.file(name)!.async('uint8array'));
      expect(pdf.getPageCount()).toBeGreaterThan(0);
      expect(pdf.getTitle()).toBe('Historia clínica');
    }
  }, 60_000);

  it('baja solo lo elegido', async () => {
    const zip = await JSZip.loadAsync(await (await app().request('/api/ajustes/export?pacientes=1&turnos=0&historia=0')).arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['LEEME.txt', 'pacientes.xlsx']);
  });

  it('pide al menos una parte y frena los pedidos seguidos', async () => {
    expect((await app().request('/api/ajustes/export?pacientes=0&turnos=0&historia=0')).status).toBe(400);
    const api = app();
    for (let i = 0; i < 3; i++) expect((await api.request('/api/ajustes/export?turnos=1')).status).toBe(200);
    expect((await api.request('/api/ajustes/export?turnos=1')).status).toBe(429);
  });

  it('solo la nutricionista puede descargar', async () => {
    mock.enabled = true; mock.actor.mockResolvedValue({ role: 'paciente' });
    expect((await app(true).request('/api/ajustes/export')).status).toBe(403);
  });
});

describe('Contenido de la descarga', () => {
  it('lee qué partes pidió; sin parámetros va todo', () => {
    expect(readExportParts(() => undefined)).toEqual({ pacientes: true, turnos: true, historia: true });
    const q: Record<string, string> = { historia: '1' };
    expect(readExportParts(k => q[k])).toEqual({ pacientes: false, turnos: false, historia: true });
    expect(() => readExportParts(k => ({ pacientes: '0' } as Record<string, string>)[k])).toThrow(CareError);
  });

  it('las pacientes con datos borrados no muestran nombre ni contacto', () => {
    const sheet = patientsSheet([patient(), patient({ id: 'p2', name: 'Bea', anonymized_at: '2026-10-02T00:00:00Z' }), patient({ id: 'p3', name: 'Caro', archived_at: '2026-10-03T00:00:00Z', has_account: false })]);
    expect(sheet.rows[1]).toEqual(['Ana Pérez', 'ana@ejemplo.com', '11 5555-0000', 'Bajar 4 kg', 'Seguimiento', 'En ritmo', 'Sí', '01/10/2026', 'Activa']);
    expect(sheet.rows[2][0]).toBe('(datos borrados a pedido)');
    expect(sheet.rows[2]).not.toContain('Bea');
    expect(sheet.rows[3].slice(-3)).toEqual(['No', '01/10/2026', 'Archivada']);
  });

  it('los turnos salen con fecha y hora de Argentina y en español', () => {
    const sheet = appointmentsSheet([{ patient_id: 'p1', starts_at: '2026-11-10T13:30:00Z', when: '', duration_min: 45, channel: 'video', status: 'done', prep_note: 'Traer análisis', created_at: '2026-11-01T12:00:00Z' }], [patient()]);
    expect(sheet.rows[1]).toEqual(['10/11/2026', '10:30', 'Ana Pérez', 45, 'Videollamada', 'Realizado', 'Traer análisis', '01/11/2026']);
  });

  it('la historia clínica va por tema y conserva lo dado de baja', () => {
    const sections = historySections([
      { id: '1', topic: 'med', text: 'Levotiroxina 50', since: '2020', source: 'professional', recorded_on: '2026-10-01', edited_on: null, ended_on: '2026-10-20', ended_reason: 'la suspendió el médico' },
      { id: '2', topic: 'motivo', text: 'Bajar de peso', since: '', source: 'professional', recorded_on: '2026-10-01', edited_on: null, ended_on: null, ended_reason: '' },
    ]);
    expect(sections.map(s => s.title)).toEqual(['Historia clínica · Motivo y objetivo', 'Historia clínica · Medicación y suplementos']);
    expect(sections[1].lines[0]).toBe('01/10/2026 · Levotiroxina 50 (desde 2020) — dado de baja el 20/10/2026: la suspendió el médico');
  });

  it('nombres de archivo seguros y sin repetir', () => {
    const used = new Set<string>();
    expect(fileName('Ana/Pérez Muñoz', used, '.pdf')).toBe('Ana Perez Munoz.pdf');
    expect(fileName('ana perez muñoz', used, '.pdf')).toBe('ana perez munoz (2).pdf');
    expect(fileName('  ', used, '.pdf')).toBe('Paciente.pdf');
  });
});

describe('Planilla de Excel', () => {
  it('columnas y hojas con nombres válidos', () => {
    expect([0, 25, 26, 27, 701].map(columnName)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ']);
    const used = new Set<string>();
    expect(sheetName('Turnos', used)).toBe('Turnos');
    expect(sheetName('turnos', used)).toBe('turnos 2');
    expect(sheetName('a/b:c*'.padEnd(40, 'x'), used)).toHaveLength(31);
  });
  it('escapa el texto y no deja fórmulas', async () => {
    const xlsx = await JSZip.loadAsync(await buildXlsx([{ name: 'Hoja', rows: [['A'], ['=HYPERLINK("x") <b>&\u0001'], [12.5]] }]));
    expect(Object.keys(xlsx.files).filter(n => n.endsWith('/'))).toEqual([]);
    const sheet = await xlsx.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(sheet).toContain('=HYPERLINK(&quot;x&quot;) &lt;b&gt;&amp;</t>');
    expect(sheet).not.toContain('<f>');
    expect(sheet).toContain('<c r="A3"><v>12.5</v></c>');
  });
});
