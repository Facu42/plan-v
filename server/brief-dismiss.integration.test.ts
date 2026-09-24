import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

describe('copilot brief dismissal in memory mode', () => {
  beforeEach(() => resetStore());

  it('dismisses the current action and restores it only after regenerating the brief', async () => {
    const dismissed = await app.request('/api/patients/pat-sofia/brief/dismiss', { method: 'POST' });
    const dismissedBody = await dismissed.json();

    expect(dismissed.status).toBe(200);
    expect(dismissedBody.patient.brief).toMatchObject({
      suggested_action: null,
      up_next_title: null,
      up_next_body: null,
      draft_message: null,
    });
    expect(getPatient('pat-sofia')?.brief?.suggested_action).toBe('mensaje');
    expect(getPatient('pat-sofia')?.briefDismissed).toBe(true);

    const secondDismiss = await app.request('/api/patients/pat-sofia/brief/dismiss', { method: 'POST' });
    expect(secondDismiss.status).toBe(200);
    expect(getPatient('pat-sofia')?.briefDismissed).toBe(true);

    const regenerated = await app.request('/api/patients/pat-sofia/copilot', { method: 'POST' });
    const regeneratedBody = await regenerated.json();
    expect(regenerated.status).toBe(200);
    expect(regeneratedBody.patient.briefDismissed).toBe(false);
    expect(regeneratedBody.patient.brief.suggested_action).not.toBeNull();
  });

  it('returns 404 for an unknown patient', async () => {
    const response = await app.request('/api/patients/missing/brief/dismiss', { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
