import { z } from 'zod';

export const CONSULTATION_AUDIO_MAX_BYTES = 8 * 1024 * 1024;
export const CONSULTATION_AUDIO_RETENTION_DAYS = 7;
export const CONSULTATION_RECORDING_VERSION = 'consultation_recording.v1';
export const CONSULTATION_AI_VERSION = 'ai_consultation.v1';
export type ConsultationScope = { patientId: string; nutritionistId: string; requestedBy: string };
export type ConsultationSession = {
  id: string; patient_id: string; appointment_id: string | null; nutritionist_id: string;
  source: 'manual' | 'capture' | 'upload'; status: 'recording' | 'finished'; revision: number;
  started_at: string; finished_at: string | null; duration_seconds: number;
  microphone: boolean; remote_audio: boolean; incomplete: boolean;
  transcript: string; draft: string; manual_transcript: boolean;
};
export type ConsultationSharedSummary = {
  id: string; session_id: string; patient_id: string; version: number; summary: string;
  published_at: string; consultation_date: string;
};
export type ConsultationTask = {
  id: string; session_id: string; patient_id: string; nutritionist_id: string; requested_by: string;
  kind: 'chunk' | 'summary'; revision: number; index: number; status: 'uploading' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  audio_path: string | null; expires_at: string | null; duration_seconds: number; audio_sha256: string | null;
  run_token: string | null; lease_until: string | null; attempts: number; request_key: string;
  text: string; error: string | null; consent_version: string;
  segments?: Array<{start:number;end:number;text:string}>;
};
export type ConsultationView = { sessions: ConsultationSession[]; shared: ConsultationSharedSummary[]; tasks: Array<Pick<ConsultationTask, 'id' | 'session_id' | 'kind' | 'index' | 'status' | 'error'>> };
export const consultationCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), id: z.uuid(), source: z.enum(['manual', 'capture', 'upload']), appointment_id: z.uuid().nullable().optional(), microphone: z.boolean().optional(), remote_audio: z.boolean().optional(), recording_version: z.literal(CONSULTATION_RECORDING_VERSION).optional() }).strict(),
  z.object({ action: z.literal('finish'), id: z.uuid(), expected_revision: z.number().int().positive(), interrupted: z.boolean() }).strict(),
  z.object({ action: z.literal('draft'), id: z.uuid(), expected_revision: z.number().int().positive(), draft: z.string().max(50_000), transcript: z.string().max(100_000).optional() }).strict(),
  z.object({ action: z.literal('summarize'), id: z.uuid(), expected_revision: z.number().int().positive(), consent_version: z.literal(CONSULTATION_AI_VERSION) }).strict(),
  z.object({ action: z.literal('publish'), id: z.uuid(), expected_revision: z.number().int().positive(), summary: z.string().trim().min(1).max(30_000) }).strict(),
  z.object({ action: z.literal('retry'), id: z.uuid(), expected_revision: z.number().int().positive(), task_id: z.uuid() }).strict(),
]);
export type ConsultationCommand = z.infer<typeof consultationCommandSchema>;
export const consultationChunkSchema = z.object({ client_id: z.uuid(), index: z.number().int().min(0).max(999), audio: z.string().min(1).max(11_200_000), mime: z.literal('audio/wav'), consent_version: z.literal(CONSULTATION_AI_VERSION) }).strict();
