import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MealLog, Patient } from '../../types';
import { MealReviewPanel } from './MealReviewPanel';

const log: MealLog = {
  id: 'meal-1',
  patient_id: 'pat-1',
  slot: 'Almuerzo',
  photo_url: 'https://cdn.ejemplo/foto.jpg',
  description: 'Pollo con arroz',
  foods: [{ name: 'pollo', portion_est: 120, portion_unit: 'g', confidence: 0.7 }],
  macros: { kcal: 400, protein_g: 30, carbs_g: 40, fat_g: 12 },
  confidence: 0.7,
  note_for_nutri: 'Revisar porción',
  status: 'pending_review',
  logged_at: '2026-09-05T12:00:00.000Z',
};

const patient = { id: 'pat-1', name: 'Sofía Gómez' } as Patient;

describe('editor Ajustar en la tarjeta', () => {
  it('queda en la misma pantalla, con la foto a la izquierda y Guardar en píldora lima', () => {
    const html = renderToStaticMarkup(<MealReviewPanel layout="card" patient={patient} log={log} onClose={() => undefined} />);
    expect(html).toContain('class="fxp nz-editor"');
    expect(html).toContain('class="nz-split"');
    expect(html).toContain('class="nz-foto"');
    expect(html).toContain('class="nz-lima"');
    expect(html).toContain('class="nz-glass"');
    expect(html).toContain('Nota interna:');
    expect(html).not.toContain('aria-modal');
    expect(html).not.toContain('Nota IA');
    expect(html).not.toContain('review-panel');
  });
});
