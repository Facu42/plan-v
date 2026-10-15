import { beforeAll, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { importedClinicalSections } from './imported-clinical-export';
import { buildClinicalPdf } from './clinical-pdf';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const origin = { file: 'historia-original.xlsx', fingerprint: 'a'.repeat(64), sheet: 'Evolución', page: 2, row: 7 };
const history = [{ id: 'history', patient_id: 'patient', category: 'plan' as const, body: 'Plan del 01/09/2020: texto original sin publicar.', origin, created_at: '2026-10-13T12:00:00Z' }];
const measurements = [{ id: 'measurement', patient_id: 'patient', kind: 'weight' as const, value: 132.25, unit: 'lb' as const, recorded_on: '2020-09-01', origin, created_at: '2026-10-13T12:00:00Z' }];
beforeAll(() => { execFileSync(process.execPath, ['scripts/prepare-clinical-pdf.mjs'], { stdio: 'pipe' }); });
it('preserva texto, fecha, unidad y procedencia sin convertir históricos a cálculos actuales', () => {
  const sections = importedClinicalSections(history, measurements);
  const text = sections.flatMap(s => [s.title, ...s.lines]).join('\n');
  for (const value of [history[0].body, '132,25 lb', '01/09/2020', origin.file, 'Evolución', 'Página: 2', 'Fila: 7', origin.fingerprint]) expect(text).toContain(value);
  expect(text).toContain('no se incorporan a estadísticas ni cálculos actuales');
  expect(text).not.toContain('59,98 kg');
  expect(history[0].body).toBe('Plan del 01/09/2020: texto original sin publicar.');
});
it('produce un PDF cuyo texto extraído conserva los datos originales históricos', async () => {
  const fontBytes = await readFile(new URL('../../public/clinical-pdf/Poppins-Regular.ttf', import.meta.url));
  const bytes = await buildClinicalPdf({ title: 'Históricos importados', patientName: 'Paciente ficticia', brand: { name: 'Consultorio', contact: '', license: '', logo: null }, fontBytes, sections: importedClinicalSections(history, measurements) });
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  const pdf = await loading.promise;
  try {
    const pages: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) pages.push((await (await pdf.getPage(n)).getTextContent()).items.map(item => 'str' in item ? item.str : '').join(' '));
    const text = pages.join(' ');
    for (const value of ['132,25 lb', '01/09/2020', origin.file, 'Plan del 01/09/2020', 'históricos']) expect(text).toContain(value);
    expect(text).not.toContain('Evolución del peso');
  } finally { await loading.destroy(); }
});
