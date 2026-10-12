import { describe, expect, it } from 'vitest';
import { RECORD_TABS, recordTab, appointmentRecordSummary, documentInSection } from './patient-record-sections';
import type { AppointmentHistoryEntry } from '../../types';

describe('Ficha completa del paciente', () => {
  it('ofrece las diez secciones y mantiene accesos operativos', () => {
    expect(RECORD_TABS.map(([, label]) => label)).toEqual(expect.arrayContaining(['Historia clínica', 'Evolución', 'Notas de consulta', 'Plan actual', 'Plan semanal', 'Lista de compras', 'Registro alimentario', 'Chat', 'Archivos', 'Laboratorio', 'Resumen', 'Planificación', 'Consultas', 'Cobros']));
  });
  it('conserva enlaces existentes y resuelve enlaces desconocidos al resumen', () => {
    expect(recordTab('ingreso')).toBe('historia');
    expect(recordTab('registros')).toBe('evolucion');
    expect(recordTab('mensajes')).toBe('chat');
    expect(recordTab('plan')).toBe('plan');
    expect(recordTab('cobros')).toBe('cobros');
    expect(recordTab('desconocida')).toBe('resumen');
  });
  it('distingue horario transcurrido de asistencia confirmada y deduplica eventos', () => {
    const entry = { id: 'a', action: 'elapsed', dateId: '2026-10-10', when: '', duration: 45, channel: 'video', actor: 'system', at: '' } as AppointmentHistoryEntry;
    expect(appointmentRecordSummary([entry, entry, { ...entry, id: 'b', action: 'confirmed' }])).toEqual({ elapsed: 1, confirmed: 1 });
    expect(appointmentRecordSummary(undefined)).toEqual({ elapsed: 0, confirmed: 0 });
  });
  it('laboratorio sólo muestra estudios identificados y archivos conserva todos los adjuntos', () => {
    expect(documentInSection({ kind: 'clinical_document', document_kind: 'laboratorio' }, 'laboratory')).toBe(true);
    expect(documentInSection({ kind: 'clinical_document', document_kind: '' }, 'laboratory')).toBe(false);
    expect(documentInSection({ kind: 'body_photo' }, 'laboratory')).toBe(false);
    expect(documentInSection({ kind: 'clinical_document', document_kind: 'informe' }, 'files')).toBe(true);
    expect(documentInSection({ kind: 'body_photo' }, 'files')).toBe(true);
    expect(documentInSection({ kind: 'weight' }, 'files')).toBe(false);
  });
});
