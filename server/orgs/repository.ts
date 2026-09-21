import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import {
  memoryAcceptInvite,
  memoryCreateOrganization,
  memoryDelegateCare,
  memoryGetSubscription,
  memoryInviteMember,
  memoryListCareLinks,
  memoryListOrganizations,
  memoryRevokeCare,
  memorySetSubscription,
  memoryTransferOwnership,
} from './memory.js';
import type {
  CareLinkRole,
  CareLinkView,
  OrgMemberRole,
  OrgMemberView,
  OrgSubscriptionStatus,
  OrgSubscriptionView,
  OrganizationView,
  OwnershipTransferView,
} from '../../src/types/orgs.js';

export { CareError } from '../care/errors.js';
export { resetOrgMemory } from './memory.js';

export function orgDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Las organizaciones requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') {
    throw new CareError(403, 'No tenés permiso para esta acción.');
  }
  if (error.code === 'P0002' || error.code === 'PGRST116') {
    throw new CareError(404, 'No encontramos esa organización.');
  }
  if (['22023', '23514', '22P02', '23503', '23505'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá la organización, el equipo y las reglas de delegación.');
  }
  throw new CareError(503, 'No se pudo guardar la organización. Reintentá en un momento.');
}

function asSubscription(value: unknown): OrgSubscriptionView {
  const row = (value ?? {}) as Record<string, unknown>;
  const status = row.status;
  const allowed: OrgSubscriptionStatus[] = ['trialing', 'active', 'past_due', 'canceled', 'waived'];
  return {
    organization_id: String(row.organization_id ?? ''),
    status: allowed.includes(status as OrgSubscriptionStatus) ? status as OrgSubscriptionStatus : 'waived',
    plan_code: String(row.plan_code ?? 'b2b_team'),
    valid_until: row.valid_until == null ? null : String(row.valid_until),
    note: String(row.note ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function asOrganization(value: unknown): OrganizationView | null {
  const row = (value ?? {}) as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.slug !== 'string') return null;
  const members = Array.isArray(row.members) ? row.members.flatMap((entry) => {
    const item = entry as Record<string, unknown>;
    if (typeof item.nutritionist_id !== 'string') return [];
    const role: OrgMemberRole = item.role === 'owner' || item.role === 'admin' || item.role === 'member' ? item.role : 'member';
    const status: OrgMemberView['status'] = item.status === 'active' || item.status === 'invited' || item.status === 'revoked' ? item.status : 'invited';
    return [{
      nutritionist_id: String(item.nutritionist_id),
      role,
      status,
      invited_by: item.invited_by == null ? null : String(item.invited_by),
      joined_at: item.joined_at == null ? null : String(item.joined_at),
    }];
  }) : [];
  const teams = Array.isArray(row.teams) ? row.teams.flatMap((entry) => {
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string') return [];
    return [{
      id: String(item.id),
      name: String(item.name ?? 'consultorio'),
      member_ids: Array.isArray(item.member_ids) ? item.member_ids.map((id) => String(id)) : [],
    }];
  }) : [];
  const myRole = row.my_role;
  const myStatus = row.my_status;
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    slug: String(row.slug),
    created_at: String(row.created_at ?? ''),
    my_role: myRole === 'owner' || myRole === 'admin' || myRole === 'member' ? myRole : null,
    my_status: myStatus === 'active' || myStatus === 'invited' || myStatus === 'revoked' ? myStatus : null,
    subscription: asSubscription(row.subscription),
    members,
    teams,
  };
}

function asOrganizations(value: unknown): OrganizationView[] {
  if (!Array.isArray(value)) {
    const parsed = asOrganization(value);
    return parsed ? [parsed] : [];
  }
  return value.flatMap((entry) => {
    const parsed = asOrganization(entry);
    return parsed ? [parsed] : [];
  });
}

function asCareLinks(value: unknown): CareLinkView[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string') return [];
    const role = row.link_role;
    if (role !== 'owner' && role !== 'delegate' && role !== 'observer') return [];
    return [{
      id: String(row.id),
      patient_id: String(row.patient_id),
      nutritionist_id: String(row.nutritionist_id),
      organization_id: String(row.organization_id),
      link_role: role,
      granted_by: String(row.granted_by),
      granted_at: String(row.granted_at),
      revoked_at: row.revoked_at == null ? null : String(row.revoked_at),
    }];
  });
}

function asTransfer(value: unknown): OwnershipTransferView {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ''),
    patient_id: String(row.patient_id ?? ''),
    from_nutritionist_id: String(row.from_nutritionist_id ?? ''),
    to_nutritionist_id: String(row.to_nutritionist_id ?? ''),
    organization_id: row.organization_id == null ? null : String(row.organization_id),
    actor_id: String(row.actor_id ?? ''),
    reason: String(row.reason ?? ''),
    occurred_at: String(row.occurred_at ?? ''),
    child_tables: Array.isArray(row.child_tables) ? row.child_tables.map((name) => String(name)) : [],
  };
}

function assertNoProviderKeys(value: unknown) {
  const text = JSON.stringify(value ?? {});
  if (/(mercadopago|mp_access|stripe_secret|provider_customer|OPENAI_API_KEY)/i.test(text)) {
    throw new CareError(503, 'No se pudo guardar la organización. Reintentá en un momento.');
  }
}

function fromMemory<T>(run: () => T): T {
  try {
    return run();
  } catch (error) {
    orgDbError(error as { code?: string; message?: string });
    throw error;
  }
}

async function rpc(name: string, args: Record<string, unknown>) {
  let result: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    result = await getRequestDb().rpc(name, args);
  } catch {
    throw new CareError(501, 'Las organizaciones requieren instalar la migración de este módulo.');
  }
  orgDbError(result.error);
  assertNoProviderKeys(result.data);
  return result.data;
}

export async function createOrganization(name: string, slug: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryCreateOrganization(name, slug, actorId));
  const parsed = asOrganization(await rpc('create_organization', { input_name: name, input_slug: slug }));
  if (!parsed) throw new CareError(503, 'No se pudo guardar la organización. Reintentá en un momento.');
  return parsed;
}

export async function listOrganizations(persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryListOrganizations(actorId));
  return asOrganizations(await rpc('list_my_organizations', {}));
}

export async function inviteOrgMember(orgId: string, nutritionistId: string, role: OrgMemberRole, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryInviteMember(orgId, nutritionistId, role, actorId));
  const parsed = asOrganization(await rpc('invite_org_member', {
    org_id: orgId,
    target_nutritionist: nutritionistId,
    input_role: role,
  }));
  if (!parsed) throw new CareError(503, 'No se pudo guardar la organización. Reintentá en un momento.');
  return parsed;
}

export async function acceptOrgInvite(orgId: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryAcceptInvite(orgId, actorId));
  const parsed = asOrganization(await rpc('accept_org_invite', { org_id: orgId }));
  if (!parsed) throw new CareError(503, 'No se pudo guardar la organización. Reintentá en un momento.');
  return parsed;
}

export async function getOrgSubscription(orgId: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryGetSubscription(orgId, actorId));
  return asSubscription(await rpc('get_organization_subscription', { org_id: orgId }));
}

export async function setOrgSubscription(
  orgId: string,
  status: OrgSubscriptionStatus,
  note: string,
  persistent: boolean,
  actorId: string,
) {
  if (!persistent) return fromMemory(() => memorySetSubscription(orgId, status, note, actorId));
  return asSubscription(await rpc('set_organization_subscription_status', {
    org_id: orgId,
    input_status: status,
    input_note: note,
  }));
}

export async function listCareLinks(patientId: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryListCareLinks(patientId, actorId));
  return asCareLinks(await rpc('list_patient_care_links', { target_patient: patientId }));
}

export async function delegateCare(
  patientId: string,
  delegateId: string,
  role: CareLinkRole,
  orgId: string,
  persistent: boolean,
  actorId: string,
) {
  if (!persistent) return fromMemory(() => memoryDelegateCare(patientId, delegateId, role, orgId, actorId));
  return asCareLinks(await rpc('delegate_patient_care', {
    target_patient: patientId,
    delegate_nutritionist: delegateId,
    input_role: role,
    org_id: orgId,
  }));
}

export async function revokeCare(linkId: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryRevokeCare(linkId, actorId));
  return asCareLinks(await rpc('revoke_patient_care', { link_id: linkId }));
}

export async function transferOwnership(patientId: string, toNutritionist: string, reason: string, persistent: boolean, actorId: string) {
  if (!persistent) return fromMemory(() => memoryTransferOwnership(patientId, toNutritionist, reason, actorId));
  return asTransfer(await rpc('transfer_patient_ownership', {
    target_patient: patientId,
    to_nutritionist: toNutritionist,
    reason,
  }));
}
