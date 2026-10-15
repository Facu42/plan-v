import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaFoodDiaryProvider } from './FigmaFoodDiary';
import FoodDiary from './screens/FoodDiary';
import FoodDiaryTablet from './screens/FoodDiaryTablet';
import FoodDiaryMobile from './screens/FoodDiaryMobile';

const now = new Date('2026-09-23T12:00:00.000Z');
const patient = {
  id: 'p-diary', name: 'Ana Pérez', initials: 'AP',
  logs: [
    { id: 'log-1', slot: 'Almuerzo', description: 'Arroz con verduras', status: 'confirmed', analysis_status: 'completed', logged_at: '2026-09-22T15:00:00.000Z', macros: { kcal: 410, carbs_g: 55, protein_g: 18, fat_g: 12 }, foods: [] },
    { id: 'log-2', slot: 'Cena', description: 'Sopa de zapallo', status: 'pending_review', analysis_status: 'failed', logged_at: '2026-09-23T00:00:00.000Z', macros: null, foods: [] },
  ],
} as unknown as ShowroomPatient;
const render = (Screen: typeof FoodDiary, value = patient) => renderToStaticMarkup(<FigmaPatientIdentity patient={value}><FigmaFoodDiaryProvider patient={value} now={now} onLogMeal={() => {}}><Screen /></FigmaFoodDiaryProvider></FigmaPatientIdentity>);

describe('Figma patient food diary', () => {
  it.each([['escritorio', FoodDiary], ['tablet', FoodDiaryTablet], ['móvil', FoodDiaryMobile]])('uses reviewed meals in %s', (_, Screen) => {
    const html = render(Screen);
    expect(html).toContain('Arroz con verduras');
    expect(html).toContain('Sopa de zapallo');
    expect(html).toContain('410');
    expect(html).toContain('Análisis no disponible');
    expect(html).toContain('Registrar comida');
    expect(html).not.toContain('12,615');
    expect(html).not.toContain('Culpable');
    expect(html).not.toContain('de 84');
  });

  it('shows an empty week without fabricated rows', () => {
    const html = render(FoodDiaryMobile, { ...patient, logs: [] } as ShowroomPatient);
    expect(html).toContain('Sin registros esta semana');
    expect(html).toContain('Sin valores revisados');
    expect(html).not.toContain('Arroz con verduras');
  });
});
