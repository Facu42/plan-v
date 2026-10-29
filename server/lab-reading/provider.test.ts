import { describe, expect, it, vi } from 'vitest';
import { MemoryClinicalBudget } from '../clinical-processing/budget.js';
import { createLabReadingProvider, LabReadingError, labReadingOperationKey } from './provider.js';

const env = { GROQ_API_KEY: 'k', GROQ_ZDR_VERIFIED: '1', CLINICAL_AI_COST_MODE: 'free', GROQ_FREE_TIER_VERIFIED: '1' };
const input = { date: '2026-10-01', previous_date: null, rows: [{ name: 'Glucosa', value: '110', unit: 'mg/dL', range: '70 - 99' }] };
const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ text: 'Glucosa por encima del rango del informe.' }) } }] }), { status: 200 });
const key = labReadingOperationKey('actor', 'patient', crypto.randomUUID());

describe('lectura de laboratorio con IA', () => {
  it('devuelve el borrador y manda sólo estudio, valor, unidad y rango', async () => {
    const fetch = vi.fn(async () => ok());
    const text = await createLabReadingProvider({ env, fetch: fetch as never, budget: new MemoryClinicalBudget(), authorize: async () => true }).read(input, key);
    expect(text).toContain('Glucosa');
    const sent = JSON.stringify((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent).toContain('Glucosa');
    expect(sent).not.toMatch(/patient|nombre del paciente|@/i);
  });
  it('no sale a internet si falta la configuración', async () => {
    const fetch = vi.fn();
    await expect(createLabReadingProvider({ env: {}, fetch: fetch as never, budget: new MemoryClinicalBudget(), authorize: async () => true }).read(input, key)).rejects.toMatchObject({ code: 'config' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('no sale a internet si el permiso no está vigente', async () => {
    const fetch = vi.fn();
    await expect(createLabReadingProvider({ env, fetch: fetch as never, budget: new MemoryClinicalBudget(), authorize: async () => false }).read(input, key)).rejects.toBeInstanceOf(LabReadingError);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('no repite un pedido ya procesado', async () => {
    const budget = new MemoryClinicalBudget();
    const provider = createLabReadingProvider({ env, fetch: (async () => ok()) as never, budget, authorize: async () => true });
    await provider.read(input, key);
    await expect(provider.read(input, key)).rejects.toMatchObject({ code: 'quota' });
  });
  it('descarta una respuesta que no tiene el formato esperado', async () => {
    const bad = (async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"otra":1}' } }] }), { status: 200 })) as never;
    await expect(createLabReadingProvider({ env, fetch: bad, budget: new MemoryClinicalBudget(), authorize: async () => true }).read(input, key)).rejects.toMatchObject({ code: 'invalid' });
  });
});
