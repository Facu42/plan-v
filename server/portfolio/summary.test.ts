import { describe, expect, it } from 'vitest';
import { buildPortfolioIndicators, classifyPortfolioQuestion, indicatorsCsv, providerPortfolioContext } from './summary.js';
import { getPatient, resetStore } from '../store.js';

describe('cartera completa y contexto mínimo verificable', () => {
  it('cuenta mil pacientes sin convertir ausencia de datos en incumplimiento', () => {
    resetStore();
    const template = getPatient('pat-sofia')!;
    const data = buildPortfolioIndicators(Array.from({length:1000}, (_,i) => ({...template,id:`patient-${i}`,name:`Nombre ${i}`,meal_logs:[]})), 7, new Date('2026-10-12T15:00:00Z'));
    expect(data.patient_count).toBe(1000);
    expect(data.without_records).toBe(1000);
    expect(data.rows[0].meal_count).toBe(0);
    expect(data.rows[0].adherence).toBeNull();
  });
  it('no envía nombres, correos, notas, mensajes ni pregunta libre al proveedor', () => {
    resetStore();
    const p = {...getPatient('pat-sofia')!,name:'PRIVATE NAME',email:'private@example.com',adherence_why:'PRIVATE NOTE'};
    const raw = JSON.stringify(providerPortfolioContext(buildPortfolioIndicators([p],7,new Date())));
    expect(raw).not.toMatch(/PRIVATE|private@example|pat-sofia|messages|notes/i);
    expect(classifyPortfolioQuestion('¿Quiénes no tienen registros?')).toBe('missing_records');
  });
  it('rechaza períodos arbitrarios y protege exportaciones de fórmulas', () => {
    expect(() => buildPortfolioIndicators([],999,new Date())).toThrow();
    resetStore();
    const data = buildPortfolioIndicators([{...getPatient('pat-sofia')!,name:'=IMPORTXML("evil")'}],7,new Date());
    expect(indicatorsCsv(data)).toContain("'=IMPORTXML");
  });
  it('envía sólo agregados, sin filas individuales, adherencia ni referencias seudónimas', () => {
    resetStore();
    const data = buildPortfolioIndicators([getPatient('pat-sofia')!], 7, new Date());
    const context = providerPortfolioContext(data);
    expect(context).not.toHaveProperty('rows');
    expect(JSON.stringify(context)).not.toMatch(/row-|adherence|source_ids/);
    expect(context.patient_count).toBe(data.patient_count);
  });
  it('no reutiliza una adherencia histórica como indicador del período elegido', () => {
    resetStore();
    const data = buildPortfolioIndicators([{...getPatient('pat-sofia')!,adherence_score:87}], 90, new Date());
    expect(data.rows.every(row => row.adherence === null)).toBe(true);
  });
});
