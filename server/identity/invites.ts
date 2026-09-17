export const INVITE_STATUSES = ['not_sent', 'pending', 'accepted', 'expired', 'revoked'] as const;
export type InviteStatus = typeof INVITE_STATUSES[number];

export const INVITE_EVENTS = ['created', 'sent', 'resent', 'accepted', 'expired', 'revoked', 'failed'] as const;
export type InviteEventType = typeof INVITE_EVENTS[number];

export const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PatientInvite = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  email: string;
  status: InviteStatus;
  invited_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InviteEvent = {
  id: string;
  invite_id: string;
  event: InviteEventType;
  actor_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

export type AcceptActor = {
  userId: string;
  email: string | null;
  emailConfirmed: boolean;
  role: 'paciente' | 'nutri';
};

export type AcceptResult =
  | { ok: true; patientId: string; invite: PatientInvite }
  | { ok: false; code: 'unconfirmed_email' | 'invite_unavailable' | 'already_linked'; message: string };

const UNAVAILABLE = {
  ok: false as const,
  code: 'invite_unavailable' as const,
  message: 'Invitación no disponible',
};

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isActiveInviteStatus(status: InviteStatus): boolean {
  return status === 'not_sent' || status === 'pending';
}

export function publicInviteView(invite: PatientInvite): PatientInvite {
  return {
    id: invite.id,
    patient_id: invite.patient_id,
    nutritionist_id: invite.nutritionist_id,
    email: invite.email,
    status: invite.status,
    invited_at: invite.invited_at,
    expires_at: invite.expires_at,
    accepted_at: invite.accepted_at,
    accepted_by: invite.accepted_by,
    revoked_at: invite.revoked_at,
    created_at: invite.created_at,
    updated_at: invite.updated_at,
  };
}

export function canOpenInvite(existing: PatientInvite[], input: {
  patientId: string;
  nutritionistId: string;
  email: string;
}): boolean {
  const email = normalizeInviteEmail(input.email);
  return !existing.some((invite) =>
    isActiveInviteStatus(invite.status)
    && (invite.patient_id === input.patientId || (invite.nutritionist_id === input.nutritionistId && invite.email === email)),
  );
}

export function createInviteRecord(input: {
  id: string;
  patientId: string;
  nutritionistId: string;
  email: string;
  now: Date;
}): PatientInvite {
  const stamp = input.now.toISOString();
  return {
    id: input.id,
    patient_id: input.patientId,
    nutritionist_id: input.nutritionistId,
    email: normalizeInviteEmail(input.email),
    status: 'not_sent',
    invited_at: null,
    expires_at: null,
    accepted_at: null,
    accepted_by: null,
    revoked_at: null,
    created_at: stamp,
    updated_at: stamp,
  };
}

export function activateInvite(
  invite: PatientInvite,
  now: Date,
  ttlMs = DEFAULT_INVITE_TTL_MS,
): { invite: PatientInvite; event: 'sent' | 'resent' } | null {
  if (!isActiveInviteStatus(invite.status)) return null;
  return {
    event: invite.status === 'pending' ? 'resent' : 'sent',
    invite: {
      ...invite,
      status: 'pending',
      invited_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      updated_at: now.toISOString(),
    },
  };
}

export function revokeInvite(invite: PatientInvite, now: Date): PatientInvite | null {
  if (!isActiveInviteStatus(invite.status)) return null;
  return {
    ...invite,
    status: 'revoked',
    revoked_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export function expireInviteIfNeeded(invite: PatientInvite, now: Date): PatientInvite {
  if (invite.status === 'pending' && invite.expires_at && new Date(invite.expires_at).getTime() <= now.getTime()) {
    return { ...invite, status: 'expired', updated_at: now.toISOString() };
  }
  return invite;
}

export function evaluateInviteAcceptance(input: {
  invite: PatientInvite;
  actor: AcceptActor;
  now: Date;
  patientUserId: string | null;
}): AcceptResult {
  if (!input.actor.emailConfirmed) {
    return { ok: false, code: 'unconfirmed_email', message: 'Confirmá tu email para aceptar la invitación' };
  }

  const current = expireInviteIfNeeded(input.invite, input.now);
  if (input.actor.role !== 'paciente' || current.status !== 'pending') return UNAVAILABLE;
  if (!current.expires_at || new Date(current.expires_at).getTime() <= input.now.getTime()) return UNAVAILABLE;
  if (normalizeInviteEmail(input.actor.email ?? '') !== current.email) return UNAVAILABLE;
  if (input.patientUserId && input.patientUserId !== input.actor.userId) {
    return { ok: false, code: 'already_linked', message: 'Invitación no disponible' };
  }

  return {
    ok: true,
    patientId: current.patient_id,
    invite: {
      ...current,
      status: 'accepted',
      accepted_at: input.now.toISOString(),
      accepted_by: input.actor.userId,
      updated_at: input.now.toISOString(),
    },
  };
}
