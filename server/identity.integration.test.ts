import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getInviteById, getPatientInvite, listInviteEvents, resetStore } from './store.js';
import { RECOVERY_ACK } from './identity/provision.js';

function json(path: string, body: unknown, init?: RequestInit) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body: JSON.stringify(body),
    ...init,
  });
}

describe('PV-09 invite lifecycle in memory', () => {
  beforeEach(() => resetStore());

  it('creates, sends, resends and revokes a one-use invitation', async () => {
    const created = await json('/api/patients', {
      name: 'Ana Pérez',
      email: 'ana@example.com',
      goal: 'Organizar horarios',
    });
    const payload = await created.json();
    expect(created.status).toBe(201);
    expect(payload.invite.status).toBe('not_sent');
    expect(payload.invite.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(getPatientInvite(payload.patient.id)?.id).toBe(payload.invite.id);

    const sent = await json(`/api/invites/${payload.invite.id}/send`, {});
    const sentPayload = await sent.json();
    expect(sent.status).toBe(200);
    expect(sentPayload.invite.status).toBe('pending');
    expect(sentPayload.invite.expires_at).toBeTruthy();
    expect(listInviteEvents(payload.invite.id).map((event) => event.event)).toEqual(['created', 'sent']);

    const resent = await json(`/api/invites/${payload.invite.id}/send`, {});
    expect((await resent.json()).invite.status).toBe('pending');
    expect(listInviteEvents(payload.invite.id).map((event) => event.event)).toContain('resent');

    const revoked = await json(`/api/invites/${payload.invite.id}/revoke`, {});
    expect(revoked.status).toBe(200);
    expect((await revoked.json()).invite.status).toBe('revoked');
    expect(getInviteById(payload.invite.id)?.status).toBe('revoked');

    const again = await json(`/api/invites/${payload.invite.id}/revoke`, {});
    expect(again.status).toBe(409);
  });

  it('does not accept an invite without a verified account', async () => {
    const created = await (await json('/api/patients', {
      name: 'Ana Pérez',
      email: 'ana@example.com',
      goal: 'Organizar horarios',
    })).json();
    await json(`/api/invites/${created.invite.id}/send`, {});
    const accepted = await json('/api/invites/accept', { invite_id: created.invite.id });
    expect(accepted.status).toBe(401);
  });

  it('acknowledges recovery without revealing the address', async () => {
    const response = await json('/api/auth/recover', { email: 'ana@example.com' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: RECOVERY_ACK });
  });

  it('provisions a professional only with the ops secret', async () => {
    const denied = await json('/api/ops/nutritionists', {
      user_id: 'user-vero',
      display_name: 'Verónica Trenti',
    });
    expect(denied.status).toBe(401);

    const previous = process.env.PROVISION_SECRET;
    process.env.PROVISION_SECRET = 'ops-secret';
    const created = await json('/api/ops/nutritionists', {
      user_id: 'user-vero',
      display_name: 'Verónica Trenti',
    }, { headers: { 'Content-Type': 'application/json', 'X-PlanV-Provision': 'ops-secret' } });
    process.env.PROVISION_SECRET = previous;
    expect(created.status).toBe(201);
    const payload = await created.json();
    expect(payload.nutritionist_id).toBeTruthy();
    expect(payload.source).toBe('memory');
  });
});
