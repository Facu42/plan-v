import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CarePanel } from './CarePanel';
import { DEFAULT_CARE_PREFERENCES, type CareSnapshot } from '../../types/care';

const state = vi.hoisted(() => ({ data: null as CareSnapshot | null }));
vi.mock('./useCare', () => ({ useCare: () => ({ data: state.data, error: '', reload: vi.fn() }) }));
beforeEach(() => {
  const base = { patient_id: 'ana', recorded_on: '2026-10-10', created_at: '', reviewed_at: null };
  state.data = { source: 'supabase', preferences: DEFAULT_CARE_PREFERENCES, consented: ['clinical_document', 'body_progress'], measurements: [], replacements: [], records: [
    { ...base, id: 'lab', data: { kind: 'clinical_document', path: 'private/lab', filename: 'laboratorio.pdf', mime: 'application/pdf', document_kind: 'laboratorio', note: 'Muestra de laboratorio' } },
    { ...base, id: 'report', data: { kind: 'clinical_document', path: 'private/report', filename: 'informe.pdf', mime: 'application/pdf', document_kind: 'informe', note: 'Informe de consulta' } },
    { ...base, id: 'photo', data: { kind: 'body_photo', path: 'private/photo', note: 'Foto privada' } },
    { ...base, id: 'payment', data: { kind: 'payment', amount: 50, currency: 'ARS', method: 'efectivo', reference: 'Cobro ajeno a documentos', note: '' } },
  ] };
});
describe('Archivos y laboratorio en la ficha profesional', () => {
  it('muestra archivos autorizados sin mezclar cobros o medidas', () => {
    const html = renderToStaticMarkup(<CarePanel patientId="ana" mode="files" />);
    expect(html).toContain('laboratorio.pdf'); expect(html).toContain('informe.pdf'); expect(html).toContain('Foto privada');
    expect(html).toContain('Ver estudio'); expect(html).toContain('Ver foto privada'); expect(html).toContain('Marcar revisado');
    expect(html).not.toContain('Registro de pagos'); expect(html).not.toContain('Historial de medidas'); expect(html).not.toContain('Registrar peso');
    expect(html).not.toContain('private/lab'); expect(html).not.toContain('Retirar estudio');
  });
  it('laboratorio filtra los informes identificados y conserva revisión privada', () => {
    const html = renderToStaticMarkup(<CarePanel patientId="ana" mode="laboratory" />);
    expect(html).toContain('laboratorio.pdf'); expect(html).toContain('Marcar revisado');
    expect(html).not.toContain('informe.pdf'); expect(html).not.toContain('Foto privada'); expect(html).not.toContain('Cobro ajeno');
  });
  it('sin permiso los botones para abrir archivos quedan deshabilitados', () => {
    state.data!.consented = [];
    const html = renderToStaticMarkup(<CarePanel patientId="ana" mode="files" />);
    expect(html).toMatch(/disabled="">Ver estudio/); expect(html).toMatch(/disabled="">Ver foto privada/);
  });
});
