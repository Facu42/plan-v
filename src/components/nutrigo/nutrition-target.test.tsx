import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NutritionTargetPanel, TargetSummary } from './ShowroomNutritionTarget';
import { calculateTarget, defaultsForGoal, type TargetInput } from '../../lib/nutrition-target';

const inputs: TargetInput = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('mantener') };

describe('meta de calorías y macros en pantalla', () => {
  it('la calculadora arranca vacía y pide los datos antes de proponer una meta', () => {
    const html = renderToStaticMarkup(<NutritionTargetPanel patientId="pat-sofia" patientName="Sofía" />);
    expect(html).toContain('Mifflin-St Jeor');
    expect(html).toContain('Completá edad, peso y talla');
    expect(html).toContain('Confirmar y compartir');
  });
  it('el resumen muestra kcal y los tres macronutrientes', () => {
    const result = calculateTarget(inputs);
    const html = renderToStaticMarkup(<TargetSummary target={{ patient_id: 'x', inputs, result, published_at: null, updated_at: '' }} />);
    expect(html).toContain(String(result.kcal));
    for (const label of ['Proteínas', 'Hidratos', 'Grasas']) expect(html).toContain(label);
  });
});
