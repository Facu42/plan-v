import type { PatientInvite } from '../../api/client';
import type { Patient } from '../../types';

export function invitationReady(invite: PatientInvite, now = Date.now()) {
  return invite.status === 'pending' && Boolean(invite.expires_at) && Date.parse(invite.expires_at!) > now;
}
type Created = { patient: Patient; invite: PatientInvite; source: string };
type Input = { name: string; email: string; goal: string };
/** An activation failure must keep the created patient and the unprepared invitation. */
export async function createPatientWithInvitation(input: Input, transport: { create: (input: Input) => Promise<Created>; activate: (id: string) => Promise<{ invite: PatientInvite; source: string }> }) {
  const created = await transport.create(input);
  if (created.invite.status === 'accepted') return created;
  try { return { ...created, invite: (await transport.activate(created.invite.id)).invite }; }
  catch { return created; }
}
