import { z } from 'zod';

export const ORG_MEMBER_ROLES = ['owner', 'admin', 'member'] as const;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export const ORG_MEMBER_STATUSES = ['active', 'invited', 'revoked'] as const;
export type OrgMemberStatus = (typeof ORG_MEMBER_STATUSES)[number];

export const ORG_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'waived'] as const;
export type OrgSubscriptionStatus = (typeof ORG_SUBSCRIPTION_STATUSES)[number];

/** Statuses an org owner may set without a payment provider. `active` is not among them. */
export const ORG_SUBSCRIPTION_MANUAL_STATUSES = ['trialing', 'waived', 'canceled', 'past_due'] as const;
export type OrgSubscriptionManualStatus = (typeof ORG_SUBSCRIPTION_MANUAL_STATUSES)[number];

export const CARE_LINK_ROLES = ['owner', 'delegate', 'observer'] as const;
export type CareLinkRole = (typeof CARE_LINK_ROLES)[number];

export const orgSlugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
export const orgNameSchema = z.string().trim().min(2).max(80);

export type OrgSubscriptionView = {
  organization_id: string;
  status: OrgSubscriptionStatus;
  plan_code: string;
  valid_until: string | null;
  note: string;
  updated_at: string;
};

export type OrgMemberView = {
  nutritionist_id: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  invited_by: string | null;
  joined_at: string | null;
};

export type OrgTeamView = {
  id: string;
  name: string;
  member_ids: string[];
};

export type OrganizationView = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  my_role: OrgMemberRole | null;
  my_status: OrgMemberStatus | null;
  subscription: OrgSubscriptionView;
  members: OrgMemberView[];
  teams: OrgTeamView[];
};

export type CareLinkView = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  organization_id: string;
  link_role: CareLinkRole;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
};

export type OwnershipTransferView = {
  id: string;
  patient_id: string;
  from_nutritionist_id: string;
  to_nutritionist_id: string;
  organization_id: string | null;
  actor_id: string;
  reason: string;
  occurred_at: string;
  child_tables: string[];
};
