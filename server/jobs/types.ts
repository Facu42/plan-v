export const JOB_KINDS = ['menu_draft', 'recipe_draft', 'purge_asset', 'privacy_export', 'privacy_delete', 'fail'] as const;
export type JobKind = (typeof JOB_KINDS)[number];
export const JOB_STATUSES = ['queued', 'leased', 'succeeded', 'failed', 'dead'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type ProcessingJob = {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  lease_owner: string | null;
  lease_until: string | null;
  run_after: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type JobStore = {
  enqueue(input: { kind: JobKind; payload?: Record<string, unknown>; max_attempts?: number; run_after?: string }): Promise<ProcessingJob>;
  lease(owner: string, now?: Date, leaseMs?: number): Promise<ProcessingJob | null>;
  complete(id: string, error?: string): Promise<ProcessingJob>;
  get(id: string): Promise<ProcessingJob | null>;
  counts(): Promise<{ queued: number; leased: number; dead: number; succeeded: number }>;
  snapshot(): Promise<ProcessingJob[]>;
  replaceAll(jobs: ProcessingJob[]): Promise<void>;
};
