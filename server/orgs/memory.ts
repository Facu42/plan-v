import { randomUUID } from 'node:crypto';
import type {
  CareLinkRole,
  CareLinkView,
  OrgMemberRole,
  OrgMemberStatus,
  OrgMemberView,
  OrgSubscriptionStatus,
  OrgTeamView,
  OrganizationView,
  OrgSubscriptionView,
  OwnershipTransferView,
} from '../../src/types/orgs.js';

export const DEMO_OWNER_NUTRITIONIST_ID = 'nutri-demo';
export const DEMO_PEER_NUTRITIONIST_ID = 'nutri-demo-b';

type MemberRow = OrgMemberView & { organization_id: string };
type OrgRow = { id: string; name: string; slug: string; created_at: string; created_by: string };

const orgs = new Map<string, OrgRow>();
const members = new Map<string, MemberRow>();
const subscriptions = new Map<string, OrgSubscriptionView>();
const teams = new Map<string, OrgTeamView & { organization_id: string }>();
const links = new Map<string, CareLinkView>();
const transfers: OwnershipTransferView[] = [];
const patientOwners = new Map<string, string>();

function memberKey(orgId: string, nutritionistId: string) {
  return `${orgId}:${nutritionistId}`;
}

export function resetOrgMemory() {
  orgs.clear();
  members.clear();
  subscriptions.clear();
  teams.clear();
  links.clear();
  transfers.length = 0;
  patientOwners.clear();
}

export function newOrgId() {
  return randomUUID();
}

export function demoPatientOwner(patientId: string) {
  return patientOwners.get(patientId) ?? DEMO_OWNER_NUTRITIONIST_ID;
}

function now() {
  return new Date().toISOString();
}

function snapshot(orgId: string, actorId: string): OrganizationView {
  const org = orgs.get(orgId);
  if (!org) {
    const error = new Error('org_missing') as Error & { code: string };
    error.code = 'P0002';
    throw error;
  }
  const mine = members.get(memberKey(orgId, actorId));
  if (!mine || mine.status === 'revoked') {
    const error = new Error('org_forbidden') as Error & { code: string };
    error.code = '42501';
    throw error;
  }
  const sub = subscriptions.get(orgId)!;
  const orgMembers = [...members.values()].filter((row) => row.organization_id === orgId);
  const orgTeams = [...teams.values()].filter((row) => row.organization_id === orgId);
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    created_at: org.created_at,
    my_role: mine.role,
    my_status: mine.status,
    subscription: { ...sub },
    members: orgMembers.map(({ organization_id: _org, ...row }) => row),
    teams: orgTeams.map(({ organization_id: _org, ...row }) => ({ ...row, member_ids: [...row.member_ids] })),
  };
}

function requireNutri(actorId: string) {
  if (!actorId.startsWith('nutri-')) {
    const error = new Error('org_role') as Error & { code: string };
    error.code = '42501';
    throw error;
  }
}

function manager(orgId: string, actorId: string) {
  const mine = members.get(memberKey(orgId, actorId));
  return Boolean(mine && mine.status === 'active' && (mine.role === 'owner' || mine.role === 'admin'));
}

function activeMember(orgId: string, nutritionistId: string) {
  const row = members.get(memberKey(orgId, nutritionistId));
  return Boolean(row && row.status === 'active');
}

function subscriptionAllows(orgId: string) {
  const status = subscriptions.get(orgId)?.status;
  return status === 'waived' || status === 'trialing' || status === 'active';
}

function raise(code: string, message: string): never {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  throw error;
}

export function memoryCreateOrganization(name: string, slug: string, actorId: string): OrganizationView {
  requireNutri(actorId);
  const normalized = slug.trim().toLowerCase();
  if ([...orgs.values()].some((row) => row.slug === normalized)) raise('23505', 'org_slug');
  const id = newOrgId();
  const created = now();
  orgs.set(id, { id, name: name.trim(), slug: normalized, created_at: created, created_by: actorId });
  members.set(memberKey(id, actorId), {
    organization_id: id,
    nutritionist_id: actorId,
    role: 'owner',
    status: 'active',
    invited_by: actorId,
    joined_at: created,
  });
  const teamId = newOrgId();
  teams.set(teamId, { id: teamId, organization_id: id, name: 'consultorio', member_ids: [actorId] });
  subscriptions.set(id, {
    organization_id: id,
    status: 'waived',
    plan_code: 'b2b_team',
    valid_until: null,
    note: 'piloto gratuito manual',
    updated_at: created,
  });
  return snapshot(id, actorId);
}

export function memoryListOrganizations(actorId: string): OrganizationView[] {
  requireNutri(actorId);
  return [...members.values()]
    .filter((row) => row.nutritionist_id === actorId && (row.status === 'active' || row.status === 'invited'))
    .map((row) => snapshot(row.organization_id, actorId));
}

export function memoryInviteMember(orgId: string, target: string, role: OrgMemberRole, actorId: string): OrganizationView {
  requireNutri(actorId);
  if (!manager(orgId, actorId)) raise('42501', 'org_forbidden');
  if (role !== 'admin' && role !== 'member') raise('22023', 'org_role_invalid');
  if (target === actorId) raise('22023', 'org_self');
  const existing = members.get(memberKey(orgId, target));
  if (existing?.status === 'active') raise('22023', 'org_already_member');
  members.set(memberKey(orgId, target), {
    organization_id: orgId,
    nutritionist_id: target,
    role,
    status: 'invited',
    invited_by: actorId,
    joined_at: null,
  });
  return snapshot(orgId, actorId);
}

export function memoryAcceptInvite(orgId: string, actorId: string): OrganizationView {
  requireNutri(actorId);
  const existing = members.get(memberKey(orgId, actorId));
  if (!existing || existing.status !== 'invited') raise('42501', 'org_invite_missing');
  const joined = now();
  members.set(memberKey(orgId, actorId), { ...existing, status: 'active', joined_at: joined });
  const team = [...teams.values()].find((row) => row.organization_id === orgId);
  if (team && !team.member_ids.includes(actorId)) team.member_ids.push(actorId);
  return snapshot(orgId, actorId);
}

export function memoryGetSubscription(orgId: string, actorId: string): OrgSubscriptionView {
  return snapshot(orgId, actorId).subscription;
}

export function memorySetSubscription(orgId: string, status: OrgSubscriptionStatus, note: string, actorId: string): OrgSubscriptionView {
  if (!manager(orgId, actorId)) raise('42501', 'org_forbidden');
  if (status === 'active') raise('22023', 'org_subscription_provider');
  if (!['trialing', 'waived', 'canceled', 'past_due'].includes(status)) raise('22023', 'org_subscription_invalid');
  const current = subscriptions.get(orgId);
  if (!current) raise('P0002', 'org_missing');
  const next: OrgSubscriptionView = {
    ...current,
    status,
    note: note.trim() || current.note,
    updated_at: now(),
  };
  subscriptions.set(orgId, next);
  return next;
}

export function memoryListCareLinks(patientId: string, actorId: string): CareLinkView[] {
  const owner = demoPatientOwner(patientId);
  const visible = [...links.values()].filter((row) => row.patient_id === patientId);
  const allowed = owner === actorId || visible.some((row) => row.nutritionist_id === actorId && !row.revoked_at);
  if (!allowed) raise('42501', 'org_forbidden');
  return visible;
}

export function memoryDelegateCare(
  patientId: string,
  delegateId: string,
  role: CareLinkRole,
  orgId: string,
  actorId: string,
): CareLinkView[] {
  if (demoPatientOwner(patientId) !== actorId) raise('42501', 'org_forbidden');
  if (role !== 'delegate' && role !== 'observer') raise('22023', 'care_role_invalid');
  if (!activeMember(orgId, actorId) || !subscriptionAllows(orgId)) raise('22023', 'org_subscription_blocked');
  if (!activeMember(orgId, delegateId)) raise('22023', 'org_peer_required');
  if (delegateId === actorId) raise('22023', 'care_self');
  if ([...links.values()].some((row) => row.patient_id === patientId && row.nutritionist_id === delegateId && !row.revoked_at)) {
    raise('23505', 'care_duplicate');
  }
  const id = newOrgId();
  links.set(id, {
    id,
    patient_id: patientId,
    nutritionist_id: delegateId,
    organization_id: orgId,
    link_role: role,
    granted_by: actorId,
    granted_at: now(),
    revoked_at: null,
  });
  return memoryListCareLinks(patientId, actorId);
}

export function memoryRevokeCare(linkId: string, actorId: string): CareLinkView[] {
  const row = links.get(linkId);
  if (!row) raise('P0002', 'care_missing');
  if (demoPatientOwner(row.patient_id) !== actorId && row.granted_by !== actorId) raise('42501', 'org_forbidden');
  links.set(linkId, { ...row, revoked_at: row.revoked_at ?? now() });
  return memoryListCareLinks(row.patient_id, actorId);
}

export function memoryTransferOwnership(patientId: string, toNutritionist: string, reason: string, actorId: string): OwnershipTransferView {
  const fromId = demoPatientOwner(patientId);
  if (fromId !== actorId) raise('42501', 'org_forbidden');
  if (toNutritionist === fromId) raise('22023', 'transfer_self');
  const shared = [...members.values()].find((row) => (
    row.nutritionist_id === actorId
    && row.status === 'active'
    && activeMember(row.organization_id, toNutritionist)
    && subscriptionAllows(row.organization_id)
  ));
  if (!shared) raise('22023', 'org_peer_required');
  for (const row of links.values()) {
    if (row.patient_id === patientId && !row.revoked_at && (row.nutritionist_id === fromId || row.nutritionist_id === toNutritionist)) {
      links.set(row.id, { ...row, revoked_at: now() });
    }
  }
  const ownerLinkId = newOrgId();
  links.set(ownerLinkId, {
    id: ownerLinkId,
    patient_id: patientId,
    nutritionist_id: toNutritionist,
    organization_id: shared.organization_id,
    link_role: 'owner',
    granted_by: actorId,
    granted_at: now(),
    revoked_at: null,
  });
  patientOwners.set(patientId, toNutritionist);
  const event: OwnershipTransferView = {
    id: newOrgId(),
    patient_id: patientId,
    from_nutritionist_id: fromId,
    to_nutritionist_id: toNutritionist,
    organization_id: shared.organization_id,
    actor_id: actorId,
    reason,
    occurred_at: now(),
    child_tables: ['messages', 'resource_assignments', 'shopping_manual_items'],
  };
  transfers.push(event);
  return event;
}

export function memoryCanCare(patientId: string, actorId: string) {
  if (demoPatientOwner(patientId) === actorId) return true;
  return [...links.values()].some((row) => (
    row.patient_id === patientId
    && row.nutritionist_id === actorId
    && !row.revoked_at
    && row.link_role === 'delegate'
    && subscriptionAllows(row.organization_id)
  ));
}

export type { OrgMemberRole, OrgMemberStatus };
