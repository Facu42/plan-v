import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function patchBilling(patientId: string, body: unknown) {
  return app.request(`/api/patients/${patientId}/billing`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('billing flow in memory mode', () => {
  beforeEach(() => resetStore());

  it('marks a valid period active and records a non-clinical timeline event', async () => {
    const response = await patchBilling('pat-marina', { status: 'active', billing_until: '2099-10-06' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.patient.billing_status).toBe('active');
    expect(payload.patient.billing_until).toBe('2099-10-06');
    expect(getPatient('pat-marina')?.timeline[0]).toMatchObject({
      kind: 'billing',
      title: 'Cobro · activo',
    });
  });

  it('supports an explicit waiver without inventing a billing period', async () => {
    const response = await patchBilling('pat-marina', { status: 'waived' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.patient.billing_status).toBe('waived');
    expect(payload.patient.billing_until).toBeNull();
  });

  it('turns an already expired active period into past due', async () => {
    const response = await patchBilling('pat-marina', { status: 'active', billing_until: '2020-01-01' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.patient.billing_status).toBe('past_due');
    expect(payload.patient.billing_until).toBe('2020-01-01');
  });

  it('rejects malformed billing updates and missing patients', async () => {
    expect((await patchBilling('pat-marina', { status: 'active' })).status).toBe(400);
    expect((await patchBilling('pat-marina', { status: 'past_due' })).status).toBe(400);
    expect((await patchBilling('missing', { status: 'pending' })).status).toBe(404);
  });
});
