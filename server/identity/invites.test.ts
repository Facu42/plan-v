import { describe, expect, it } from 'vitest';
import {
  activateInvite,
  canOpenInvite,
  createInviteRecord,
  evaluateInviteAcceptance,
  expireInviteIfNeeded,
  normalizeInviteEmail,
  revokeInvite,
} from './invites.js';

const now = new Date('2026-09-17T12:00:00.000Z');

function invite(overrides: Partial<ReturnType<typeof createInviteRecord>> = {}) {
  return {
    ...createInviteRecord({
      id: '11111111-1111-4111-8111-111111111111',
      patientId: 'pat-1',
      nutritionistId: 'nutri-1',
      email: '  ANA@Example.COM ',
      now,
    }),
    ...overrides,
  };
}

const patientActor = {
  userId: 'user-ana',
  email: 'ana@example.com',
  emailConfirmed: true,
  role: 'paciente' as const,
};

describe('invite lifecycle', () => {
  it('normalizes destination email and starts unsent', () => {
    const created = invite();
    expect(created.email).toBe('ana@example.com');
    expect(created.status).toBe('not_sent');
    expect(created.expires_at).toBeNull();
    expect(normalizeInviteEmail('  ANA@Example.COM ')).toBe('ana@example.com');
  });

  it('rejects a second active invite for the same patient or nutri+email', () => {
    const existing = [invite({ status: 'pending' })];
    expect(canOpenInvite(existing, { patientId: 'pat-1', nutritionistId: 'nutri-1', email: 'otro@example.com' })).toBe(false);
    expect(canOpenInvite(existing, { patientId: 'pat-2', nutritionistId: 'nutri-1', email: 'ana@example.com' })).toBe(false);
    expect(canOpenInvite(existing, { patientId: 'pat-2', nutritionistId: 'nutri-1', email: 'nueva@example.com' })).toBe(true);
    expect(canOpenInvite([{ ...existing[0], status: 'accepted' }], {
      patientId: 'pat-1', nutritionistId: 'nutri-1', email: 'ana@example.com',
    })).toBe(true);
  });

  it('activates a one-use window and can resend without changing identity', () => {
    const sent = activateInvite(invite(), now, 60_000);
    expect(sent?.event).toBe('sent');
    expect(sent?.invite.status).toBe('pending');
    expect(sent?.invite.expires_at).toBe('2026-09-17T12:01:00.000Z');

    const resent = activateInvite(sent!.invite, new Date('2026-09-17T12:00:30.000Z'), 60_000);
    expect(resent?.event).toBe('resent');
    expect(resent?.invite.id).toBe(sent!.invite.id);
    expect(activateInvite({ ...sent!.invite, status: 'accepted' }, now)).toBeNull();
  });

  it('revokes an active invite and refuses a second revoke', () => {
    const revoked = revokeInvite(invite({ status: 'pending' }), now);
    expect(revoked?.status).toBe('revoked');
    expect(revoked?.revoked_at).toBe(now.toISOString());
    expect(revokeInvite(revoked!, now)).toBeNull();
  });

  it('accepts only a pending invite with confirmed matching email', () => {
    const pending = activateInvite(invite(), now, 3_600_000)!.invite;
    const accepted = evaluateInviteAcceptance({
      invite: pending,
      actor: patientActor,
      now: new Date('2026-09-17T12:10:00.000Z'),
      patientUserId: null,
    });
    expect(accepted).toMatchObject({ ok: true, patientId: 'pat-1' });
    if (accepted.ok) {
      expect(accepted.invite.status).toBe('accepted');
      expect(accepted.invite.accepted_by).toBe('user-ana');
    }

    const replay = evaluateInviteAcceptance({
      invite: accepted.ok ? accepted.invite : pending,
      actor: patientActor,
      now: new Date('2026-09-17T12:11:00.000Z'),
      patientUserId: 'user-ana',
    });
    expect(replay).toEqual({ ok: false, code: 'invite_unavailable', message: 'Invitación no disponible' });
  });

  it('does not distinguish expired, revoked or mismatched email to the caller', () => {
    const pending = activateInvite(invite(), now, 60_000)!.invite;
    const cases = [
      evaluateInviteAcceptance({ invite: pending, actor: { ...patientActor, email: 'otra@example.com' }, now, patientUserId: null }),
      evaluateInviteAcceptance({ invite: pending, actor: { ...patientActor, role: 'nutri' }, now, patientUserId: null }),
      evaluateInviteAcceptance({
        invite: pending,
        actor: patientActor,
        now: new Date('2026-09-17T12:02:00.000Z'),
        patientUserId: null,
      }),
      evaluateInviteAcceptance({
        invite: { ...pending, status: 'revoked', revoked_at: now.toISOString() },
        actor: patientActor,
        now,
        patientUserId: null,
      }),
    ];
    for (const result of cases) {
      expect(result).toEqual({ ok: false, code: 'invite_unavailable', message: 'Invitación no disponible' });
    }
  });

  it('asks an authenticated user to confirm email before treating the invite as missing', () => {
    const pending = activateInvite(invite(), now, 3_600_000)!.invite;
    expect(evaluateInviteAcceptance({
      invite: pending,
      actor: { ...patientActor, emailConfirmed: false },
      now,
      patientUserId: null,
    })).toEqual({
      ok: false,
      code: 'unconfirmed_email',
      message: 'Confirmá tu email para aceptar la invitación',
    });
  });

  it('marks a pending invite expired when the window has closed', () => {
    const pending = activateInvite(invite(), now, 1_000)!.invite;
    const expired = expireInviteIfNeeded(pending, new Date('2026-09-17T12:00:02.000Z'));
    expect(expired.status).toBe('expired');
  });
});
