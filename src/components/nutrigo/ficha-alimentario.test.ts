import { describe, expect, it } from 'vitest';
import type { MealLog } from '../../types';
import { caloriasPorDia, planillaDeComidas, promedioDeMacros } from './ficha-alimentario';

const comida = (id: string, slot: string, logged_at: string, kcal: number | null): MealLog => ({
  id, patient_id: 'p1', slot, photo_url: null, description: slot, foods: [], confidence: 1, note_for_nutri: '', status: 'confirmed', logged_at,
  macros: kcal === null ? null : { kcal, protein_g: kcal / 20, carbs_g: kcal / 10, fat_g: kcal / 40 },
});
const logs = [
  comida('a', 'Desayuno', '2026-10-27T11:00:00Z', 400), comida('b', 'Almuerzo', '2026-10-27T16:00:00Z', 600),
  comida('c', 'Cena', '2026-10-26T23:30:00Z', 500), comida('d', 'Colación', '2026-10-25T14:00:00Z', null),
];

describe('Registro alimentario de la Ficha', () => {
  it('suma las calorías estimadas por día y deja en cero el día sin estimaciones', () => {
    const { valores, promedio } = caloriasPorDia(logs, '2026-10-27');
    expect(valores).toEqual([0, 0, 0, 0, 0, 500, 1000]);
    expect(promedio).toBe(750);
  });
  it('sin ninguna estimación no inventa promedio', () => {
    expect(promedioDeMacros([comida('x', 'Cena', '2026-10-27T20:00:00Z', null)])).toBeNull();
    expect(promedioDeMacros([])).toBeNull();
  });
  it('promedia macros por día registrado', () => {
    expect(promedioDeMacros(logs)).toEqual({ dias: 2, kcal: 750, protein_g: 38, carbs_g: 75, fat_g: 19 });
  });
  it('arma la planilla con una fila por comida y sin dejar que un texto actúe como fórmula', () => {
    const peligrosa = { ...comida('z', 'Cena', '2026-10-27T23:30:00Z', 400), description: '=HYPERLINK("http://x")' };
    const lineas = planillaDeComidas([logs[0]!, peligrosa]).replace('\uFEFF', '').trim().split('\r\n');
    expect(lineas[0]).toBe('"Fecha";"Hora";"Comida";"Qué comió";"Calorías";"Proteínas (g)";"Carbohidratos (g)";"Grasas (g)";"Estado"');
    expect(lineas[1]).toBe('"27/10/2026";"08:00";"Desayuno";"Desayuno";"400";"20";"40";"10";"Revisada"');
    expect(lineas[2]).toContain('"\'=HYPERLINK(""http://x"")"');
  });
});
