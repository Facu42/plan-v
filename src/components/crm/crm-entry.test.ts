import { describe, expect, it } from 'vitest';
import { resolveCrmEntry } from './crm-entry';

const patients = [{ id: 'sofia' }, { id: 'marina' }, { id: 'arch', archived_at: '2026-09-01' }];

describe('entrada contextual al CRM', () => {
  it('abre la ficha del paciente solicitado, no la primera de la lista', () => {
    expect(resolveCrmEntry(patients, { patientId: 'marina', module: 'fichas' })).toEqual({ patientId: 'marina', module: 'fichas', tab: 'resumen' });
  });
  it('conserva el destino de revisión, plan o consultas', () => {
    for (const tab of ['comidas', 'plan', 'consultas'] as const) {
      expect(resolveCrmEntry(patients, { patientId: 'marina', module: 'fichas', tab })?.tab).toBe(tab);
    }
  });
  it('abre los módulos existentes sin heredar una pestaña de ficha', () => {
    expect(resolveCrmEntry(patients, { patientId: 'marina', module: 'agenda', tab: 'plan' })).toEqual({ patientId: 'marina', module: 'agenda', tab: 'resumen' });
  });
  it('rechaza un paciente eliminado o archivado en vez de abrir otro', () => {
    for (const patientId of ['missing', 'arch']) {
      expect(resolveCrmEntry(patients, { patientId, module: 'fichas' })).toBeNull();
    }
  });
  it('mantiene entrada tradicional y maneja una lista vacía', () => {
    expect(resolveCrmEntry(patients)?.patientId).toBe('sofia');
    expect(resolveCrmEntry([])).toBeNull();
    expect(resolveCrmEntry([{ id: 'arch', archived_at: 'x' }, { id: 'marina' }])?.patientId).toBe('marina');
  });
});
