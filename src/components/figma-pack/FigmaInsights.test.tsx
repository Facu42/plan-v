import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaInsightsProvider } from './FigmaInsights';
import Insights from './screens/Insights';
import InsightsTablet from './screens/InsightsTablet';
import InsightsMobile from './screens/InsightsMobile';
import InsightDetails from './screens/InsightDetails';
import InsightDetailsTablet from './screens/InsightDetailsTablet';
import InsightDetailsMobile from './screens/InsightDetailsMobile';

const identity = { id: 'p-insights', name: 'Ana Pérez', initials: 'AP' } as ShowroomPatient;
const render = (Screen: typeof Insights, selectedId: string | null) => renderToStaticMarkup(<FigmaPatientIdentity patient={identity}><FigmaInsightsProvider patientId={identity.id} assignments={[{ id: 'assign-1', patient_id: identity.id, resource_id: 'leer-plan-semanal', assigned_at: '2026-09-20T12:00:00Z', read_at: null }]} selectedId={selectedId} onSelect={() => {}} onNavigate={() => {}}><Screen /></FigmaInsightsProvider></FigmaPatientIdentity>);

describe('Figma patient insights', () => {
  it.each([['escritorio', Insights], ['tablet', InsightsTablet], ['móvil', InsightsMobile]])('shows published guides in %s', (_, Screen) => {
    const html = render(Screen, null);
    expect(html).toContain('Cómo leer tu plan semanal');
    expect(html).toContain('Asignado');
    expect(html).toContain('Consejos populares');
    expect(html).not.toContain('Dr. Amelia Johnson');
    expect(html).not.toContain('2028');
  });

  it.each([['escritorio', InsightDetails], ['tablet', InsightDetailsTablet], ['móvil', InsightDetailsMobile]])('shows selected guide in %s', (_, Screen) => {
    const html = render(Screen, 'leer-plan-semanal');
    expect(html).toContain('Una semana, siete días');
    expect(html).toContain('Abrir mi plan');
    expect(html).toContain('Guías relacionadas');
    expect(html).not.toContain('Dr. Amelia Johnson');
  });
});
