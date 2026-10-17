import { describe, expect, it } from 'vitest';
import { MemoryClinicalBudget } from '../clinical-processing/budget.js';
import { costMicroUsd, modelPrice, reserveSpend, worstCaseMicroUsd } from './spend.js';

describe('tope de gasto mensual de la IA de apoyo', () => {
  it('sin precios el modelo es gratis y no toca la bolsa', async () => {
    const price = modelPrice({});
    expect(costMicroUsd({ inputTokens: 9000, outputTokens: 8000 }, price)).toBe(0);
    expect(worstCaseMicroUsd(9000, price)).toBe(0);
    const budget = new MemoryClinicalBudget();
    await (await reserveSpend('a', 0, budget)).charge(0);
    expect(await budget.used('2026-10')).toBe(0);
  });

  it('calcula el costo en millonésimas de dólar por millón de tokens', () => {
    const price = modelPrice({ AI_PRICE_INPUT_USD_PER_MTOK: '0.15', AI_PRICE_OUTPUT_USD_PER_MTOK: '0.6' });
    expect(costMicroUsd({ inputTokens: 10_000, outputTokens: 2_000 }, price)).toBe(2_700);
    expect(modelPrice({ AI_PRICE_INPUT_USD_PER_MTOK: '-1', AI_PRICE_OUTPUT_USD_PER_MTOK: 'x' })).toEqual({ inputUsdPerMTok: 0, outputUsdPerMTok: 0 });
  });

  it('corta antes de llamar cuando el peor caso pasaría los US$5 y libera lo que no se gastó', async () => {
    const budget = new MemoryClinicalBudget();
    const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).format(new Date());
    const first = await reserveSpend('job-1', 4_000_000, budget);
    await expect(reserveSpend('job-2', 1_500_000, budget)).rejects.toMatchObject({ status: 429 });
    await first.charge(500_000);
    expect(await budget.used(month)).toBe(500_000);
    const second = await reserveSpend('job-3', 4_000_000, budget);
    await second.charge(0);
    await expect(reserveSpend('job-4', 5_000_001, budget)).rejects.toMatchObject({ status: 429 });
  });

  it('si la llamada falla sin respuesta confiable, la reserva sigue contando', async () => {
    const budget = new MemoryClinicalBudget();
    const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).format(new Date());
    await (await reserveSpend('job-1', 3_000_000, budget)).keepReserved();
    expect(await budget.used(month)).toBe(3_000_000);
    await expect(reserveSpend('job-2', 2_500_000, budget)).rejects.toMatchObject({ status: 429 });
  });

  it('nunca cobra más que lo reservado', async () => {
    const budget = new MemoryClinicalBudget();
    const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).format(new Date());
    await (await reserveSpend('job-1', 1_000_000, budget)).charge(9_000_000);
    expect(await budget.used(month)).toBe(1_000_000);
  });

  it('una falla de la base al reservar no deja gastar sin control', async () => {
    const broken = { reserve: async () => { throw new Error('La bolsa de IA no está disponible o llegó a su límite.'); }, settle: async () => undefined };
    await expect(reserveSpend('job-1', 1_000, broken)).rejects.toMatchObject({ status: 429 });
    const down = { reserve: async () => { throw new Error('connection reset'); }, settle: async () => undefined };
    await expect(reserveSpend('job-1', 1_000, down)).rejects.toMatchObject({ status: 503 });
  });
});
