import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PlanNotifyPatient, planPublishedNoticeText } from './PlanNotifyPatient';

describe('avisarle a la paciente que su plan está publicado', () => {
  it('el mensaje nombra a la paciente, la versión y dónde verlo', () => {
    expect(planPublishedNoticeText('Sofía Rodríguez', 3)).toBe('Hola Sofía, ya publiqué tu plan alimentario (versión 3). Lo ves en la sección Plan de Plan V. Cualquier duda, escribime por acá.');
    expect(planPublishedNoticeText('', 1)).toMatch(/^Hola, ya publiqué/);
  });

  it('solo aparece con una versión publicada y dice si ya se avisó', () => {
    expect(renderToStaticMarkup(<PlanNotifyPatient patientName="Sofía" publishedVersion={null} busy={false} sentVersion={null} onNotify={vi.fn()} />)).toBe('');
    const ready = renderToStaticMarkup(<PlanNotifyPatient patientName="Sofía" publishedVersion={2} busy={false} sentVersion={null} onNotify={vi.fn()} />);
    expect(ready).toContain('Avisarle a Sofía');
    const sent = renderToStaticMarkup(<PlanNotifyPatient patientName="Sofía" publishedVersion={2} busy={false} sentVersion={2} onNotify={vi.fn()} />);
    expect(sent).toContain('Le avisamos por Mensajes que la versión 2 está publicada.');
  });
});
