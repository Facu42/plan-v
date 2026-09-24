export const PRIVACY_REQUEST_KINDS = ['export', 'delete', 'correction'] as const;
export type PrivacyRequestKind = (typeof PRIVACY_REQUEST_KINDS)[number];

export const PRIVACY_REQUEST_STATUSES = ['requested', 'in_progress', 'completed', 'rejected'] as const;
export type PrivacyRequestStatus = (typeof PRIVACY_REQUEST_STATUSES)[number];

export const PRIVACY_EXPORT_VERSION = 'privacy-export.v1';
export const PRIVACY_PACKAGE_TTL_SECONDS = 15 * 60;

export type PrivacyRequestView = {
  id: string;
  patient_id: string;
  kind: PrivacyRequestKind;
  status: PrivacyRequestStatus;
  requested_at: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string;
  package_expires_at: string | null;
};

export type PrivacyAssetMeta = {
  id: string;
  category: string;
  mime: string;
  byte_size: number;
  status: string;
  created_at: string;
  withdrawn_at: string | null;
};

export type PrivacyAccessEvent = {
  id: string;
  patient_id: string;
  action: string;
  object_type: string;
  object_id: string | null;
  category: string | null;
  created_at: string;
};

export type PrivacyRetentionRule = {
  category: string;
  working_period: string;
  purge_delay_after_withdraw: string;
};
