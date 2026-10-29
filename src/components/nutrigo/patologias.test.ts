import { describe, expect, it } from 'vitest';
import type { HistoryEntry } from '../../api/patient-history';
import { clasePatologia, patologiasDe } from './patologias';

const entrada = (parcial: Partial<HistoryEntry>): HistoryEntry => ({
  id: 'e1', topic: 'diag', text: 'Hipotiroidismo', since: '2019', source: 'professional', recorded_on: '2026-10-01', edited_on: null, ended_on: null, ended_reason: '', ...parcial,
});

describe('patologías del panel de pacientes', () => {
  it('toma solo los diagnósticos vigentes de la historia clínica', () => {
    const lista = [entrada({}), entrada({ id: 'e2', text: 'Anemia', ended_on: '2026-10-10' }), entrada({ id: 'e3', topic: 'med', text: 'Levotiroxina' })];
    expect(patologiasDe(lista, '2026-10-28')).toEqual([{ texto: 'Hipotiroidismo', desde: '2019' }]);
  });

  it('pinta cada patología con el mismo color que el boceto', () => {
    expect(clasePatologia('Celíaca')).toBe('pa');
    expect(clasePatologia('Intolerancia a la lactosa')).toBe('pa');
    expect(clasePatologia('Diabetes tipo 2')).toBe('pr');
    expect(clasePatologia('Hipertensión')).toBe('pb');
  });
});
