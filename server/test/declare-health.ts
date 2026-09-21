import { app } from '../index.js';

export async function declareKnownHealth(
  patientId: string,
  allergies: { state: 'none' | 'reported'; items: string[] } = { state: 'none', items: [] },
  restrictions: { state: 'none' | 'reported'; items: string[] } = { state: 'none', items: [] },
  extra: Record<string, unknown> = {},
) {
  const started = await app.request(`/api/patients/${patientId}/intake`);
  const first = await started.json() as { intake: { revision: number } };
  return app.request(`/api/patients/${patientId}/intake`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expected_revision: first.intake.revision,
      step: 'allergies',
      payload: { preferred_name: 'Sofi', allergies, restrictions, ...extra },
    }),
  });
}
