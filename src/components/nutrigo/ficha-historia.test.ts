import { describe, expect, it } from 'vitest';
import type { HistoryEntry } from '../../api/patient-history';
import { anteriores, cambiosPorFecha, datosQueCambianElPlan, fechasDeCambio, resumenDeTemas, subtituloDelTema, ultimoCambio, vigentes } from './ficha-historia';

const dato = (id: string, topic: HistoryEntry['topic'], text: string, recorded_on: string, extra: Partial<HistoryEntry> = {}): HistoryEntry =>
  ({ id, topic, text, since: '', source: 'professional', recorded_on, edited_on: null, ended_on: null, ended_reason: '', ...extra });
const historia = [
  dato('1', 'med', 'Levotiroxina 25 µg en ayunas', '2025-06-10', { source: 'import', ended_on: '2026-03-12', ended_reason: 'la endocrinóloga subió la dosis' }),
  dato('2', 'med', 'Levotiroxina 50 µg en ayunas', '2026-03-12'),
  dato('3', 'alerg', 'Gluten (celiaquía)', '2026-03-12', { edited_on: '2026-10-14' }),
  dato('4', 'diag', 'Anemia leve', '2026-09-16'),
];

describe('historia clínica a una fecha', () => {
  it('muestra solo lo que ya estaba cargado y no se había dado de baja', () => {
    expect(vigentes(historia, 'med', '2026-10-27').map(e => e.id)).toEqual(['2']);
    expect(vigentes(historia, 'med', '2026-01-01').map(e => e.id)).toEqual(['1']);
    expect(vigentes(historia, 'diag', '2026-03-12')).toEqual([]);
  });
  it('lo dado de baja pasa a «Antes» recién desde ese día', () => {
    expect(anteriores(historia, 'med', '2026-03-11')).toEqual([]);
    expect(anteriores(historia, 'med', '2026-03-12').map(e => e.id)).toEqual(['1']);
  });
  it('el último cambio cuenta cargas, ediciones y bajas hasta esa fecha', () => {
    expect(ultimoCambio(historia, 'alerg', '2026-10-27')).toBe('2026-10-14');
    expect(ultimoCambio(historia, 'alerg', '2026-10-01')).toBe('2026-03-12');
    expect(ultimoCambio(historia, 'motivo', '2026-10-27')).toBe('');
  });
});

describe('índice de temas', () => {
  it('cuenta los catorce temas y marca «Falta completar» los que no tienen nada', () => {
    const temas = resumenDeTemas(historia, '2026-10-27');
    expect(temas).toHaveLength(14);
    expect(temas.filter(t => t.completo).map(t => t.clave)).toEqual(['diag', 'med', 'alerg']);
    expect(subtituloDelTema(temas.find(t => t.clave === 'med')!)).toBe('1 dato · 12/03/26');
    expect(subtituloDelTema(temas.find(t => t.clave === 'motivo')!)).toBe('Falta completar');
  });
  it('un tema con todos sus datos dados de baja sigue contando como completado', () => {
    const solo = [dato('9', 'hab', 'Fuma', '2025-06-10', { ended_on: '2026-03-12' })];
    expect(resumenDeTemas(solo, '2026-10-27').find(t => t.clave === 'hab')).toMatchObject({ completo: true, cantidad: 0 });
  });
});

describe('por fecha', () => {
  it('agrupa lo nuevo, lo editado y las bajas por día, del más nuevo al más viejo', () => {
    const dias = cambiosPorFecha(historia, '2026-10-27', 'Sofía');
    expect(dias.map(d => d.fecha)).toEqual(['2026-10-14', '2026-09-16', '2026-03-12', '2025-06-10']);
    expect(dias[0]!.cambios[0]).toMatchObject({ tipo: 'e', tema: 'Alergias e intolerancias' });
    expect(dias[2]!.cambios.map(c => c.tipo).sort()).toEqual(['b', 'n', 'n']);
  });
  it('no muestra cambios posteriores a la fecha elegida', () => {
    expect(cambiosPorFecha(historia, '2026-03-12', 'Sofía').map(d => d.fecha)).toEqual(['2026-03-12', '2025-06-10']);
    expect(fechasDeCambio(historia)[0]).toBe('2026-10-14');
  });
});

describe('datos que cambian el plan', () => {
  it('junta lo vigente de alergias, diagnósticos, medicación y preferencias', () => {
    expect(datosQueCambianElPlan(historia, '2026-10-27')).toEqual(['Gluten (celiaquía)', 'Anemia leve', 'Levotiroxina 50 µg en ayunas']);
  });
});
