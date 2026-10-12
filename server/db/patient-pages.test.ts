import { describe, expect, it } from 'vitest';
import { collectPatientPages } from './patient-pages.js';

describe('cartera completa sin truncar a cien pacientes', () => {
  it('recorre mil pacientes y no mezcla el alcance del actor', async () => {
    const requested: number[] = [];
    const patients = await collectPatientPages(async (offset, limit) => {
      requested.push(offset);
      return { patients: Array.from({ length: Math.min(limit, 1000 - offset) }, (_, i) => ({ id: `patient-${offset + i}` })), page: { has_more: offset + limit < 1000 } };
    });
    expect(patients).toHaveLength(1000);
    expect(patients.at(-1)?.id).toBe('patient-999');
    expect(requested).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  });
  it('interrumpe una página vacía que afirma tener más, sin devolver una cartera parcial', async () => {
    await expect(collectPatientPages(async () => ({ patients: [], page: { has_more: true } }))).rejects.toThrow();
  });
});
