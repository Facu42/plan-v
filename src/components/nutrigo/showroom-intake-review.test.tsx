import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfessionalIntakeView } from '../../types/intake';
import { healthFactLabel, intakeMissingItems } from './intake-review';
import { IntakeReviewPanel } from './ShowroomIntakeReview';

const submitted: ProfessionalIntakeView = {
  intake: {
    status: 'submitted',
    revision: 3,
    payload: {
      preferred_name: 'Sofi',
      patient_intent: 'Quiero regular horarios',
      allergies: { state: 'reported', items: ['maní'] },
      restrictions: { state: 'none', items: [] },
    },
    submitted_at: '2026-09-17T12:00:00.000Z',
  },
  consents: [{ purpose: 'care_relationship', decision: 'granted', text_version: 'care_relationship.v1' }],
  review: { reviewed_by: null, reviewed_at: null },
  clinical_notes: [{ id: 'n1', patient_id: 'sofia', author_id: 'nutri', version: 1, body: 'Validar alergia en consulta', created_at: '2026-09-17T13:00:00.000Z' }],
};

describe('revisión profesional del ingreso', () => {
  it('separa alergias autodeclaradas de faltantes y notas privadas', () => {
    expect(healthFactLabel({ state: 'unknown', items: [] }, 'alergias')).toContain('Todavía no indicó');
    expect(healthFactLabel({ state: 'none', items: [] }, 'alergias')).toContain('no tiene');
    expect(intakeMissingItems(submitted)).toContain('Alergias autodeclaradas para revisar');
    const html = renderToStaticMarkup(
      <IntakeReviewPanel view={submitted} note="" error="" busy={false} onNoteChange={vi.fn()} onReview={vi.fn()} onSaveNote={vi.fn()} />,
    );
    expect(html).toContain('maní');
    expect(html).toContain('Validar alergia en consulta');
    expect(html).toContain('Marcar ingreso como revisado');
    expect(html).toContain('Guardar observación profesional');
    expect(html).not.toContain('Agregar nota');
  });
});
