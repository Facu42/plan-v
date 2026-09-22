import { z } from 'zod';

export const OUTBOX_EVENT_TYPES = [
  'appointment_scheduled',
  'appointment_rescheduled',
  'appointment_cancelled',
  'appointment_confirmed',
  'thread_message',
  'invite_sent',
  'reminder',
] as const;
export type OutboxEventType = (typeof OUTBOX_EVENT_TYPES)[number];

export const OUTBOX_CHANNELS = ['email', 'push', 'in_app'] as const;
export type OutboxChannel = (typeof OUTBOX_CHANNELS)[number];

export const OUTBOX_DELIVERY_STATUSES = ['queued', 'sent', 'failed', 'skipped'] as const;
export type OutboxDeliveryStatus = (typeof OUTBOX_DELIVERY_STATUSES)[number];

export const OUTBOX_NOTICE_KINDS = ['appointment', 'reminder', 'message', 'invite'] as const;
export type OutboxNoticeKind = (typeof OUTBOX_NOTICE_KINDS)[number];

export const OUTBOX_SKIP_REASONS = ['deactivated', 'unlinked', 'pref_off', 'provider_unconfigured'] as const;
export type OutboxSkipReason = (typeof OUTBOX_SKIP_REASONS)[number];

export type NotificationPrefs = {
  in_app: boolean;
  email: boolean;
  push: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  in_app: true,
  email: false,
  push: false,
};

export type OutboxEvent = {
  id: string;
  event_type: OutboxEventType;
  patient_id: string;
  nutritionist_id: string | null;
  client_id: string;
  dedupe_key: string;
  payload: {
    subject: string;
    body: string;
    kind: OutboxNoticeKind;
  };
  created_at: string;
};

export type OutboxDelivery = {
  id: string;
  outbox_event_id: string;
  channel: OutboxChannel;
  recipient_user_id: string | null;
  status: OutboxDeliveryStatus;
  attempt: number;
  max_attempts: number;
  last_error: string | null;
  skip_reason: string | null;
  next_attempt_at: string | null;
  sent_at: string | null;
  created_at: string;
};

export type OutboxSnapshot = {
  event: OutboxEvent;
  deliveries: OutboxDelivery[];
};

export const notificationPrefsSchema = z.object({
  in_app: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
});

export const outboxEnqueueSchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  event_type: z.enum(OUTBOX_EVENT_TYPES),
  client_id: z.uuid(),
  dedupe_key: z.string().trim().min(1).max(180).optional(),
  subject: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(800),
  kind: z.enum(OUTBOX_NOTICE_KINDS),
});
