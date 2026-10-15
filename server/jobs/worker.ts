import { runPendingDocumentOrganizer } from '../document-organizer/worker.js';
import {runSchedulingSyncJobs} from '../scheduling/worker.js';
import { handleProcessingJob } from './handlers.js';
import { drain, processQueue } from './queue.js';
import { runCoverWorkers } from '../recipes/cover-workers.js';
import { tickAppointmentReminders } from '../mail/reminder-worker.js';
import { configureConsultationProcessing, runPendingConsultations } from '../consultations/worker.js';
import { cleanupExpiredConsultationAudio } from '../consultations/repository.js';
import { transcribeClinicalAudio, summarizeClinicalText } from '../clinical-processing/provider.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';

let timer: ReturnType<typeof setInterval> | null = null;
let draining = false;
let clinicalDraining = false;
let organizerDraining = false;
let schedulingDraining = false;
let cleanupRunning = false;
let lastCleanup = 0;

export function startJobWorker(owner = 'plan-v-worker', keepAlive = false) {
  if (process.env.VITEST === 'true') return;
  if (timer) return;
  configureConsultationProcessing({ transcribeClinicalAudio, summarizeClinicalText });
  timer = setInterval(() => {
    if (!draining) {
      draining = true;
      void drain(processQueue, owner, handleProcessingJob, 5).catch(() => undefined).finally(() => { draining = false; });
    }
    void runCoverWorkers();
    if (!schedulingDraining) { schedulingDraining = true; void runSchedulingSyncJobs(2).catch(() => writeOpsLog('warn', 'scheduling_worker_failed', { status: 'review_pending' })).finally(() => { schedulingDraining = false; }); }
    void tickAppointmentReminders().catch(() => undefined);
    if (!organizerDraining) { organizerDraining = true; void runPendingDocumentOrganizer(2).catch(() => writeOpsLog('warn', 'document_organizer_worker_failed', { status: 'review_pending' })).finally(() => { organizerDraining = false; }); }
    if (!clinicalDraining) {
      clinicalDraining = true;
      void runPendingConsultations(2).catch(() => writeOpsLog('warn', 'consultation_worker_failed', { status: 'retry_pending' })).finally(() => { clinicalDraining = false; });
    }
    if (isSupabaseEnabled() && !cleanupRunning && Date.now() - lastCleanup >= 60_000) {
      lastCleanup = Date.now(); cleanupRunning = true;
      void cleanupExpiredConsultationAudio().catch(() => writeOpsLog('warn', 'consultation_cleanup_failed', { status: 'retry_pending' })).finally(() => { cleanupRunning = false; });
    }
  }, 1_000);
  if (!keepAlive) timer.unref?.();
}

export function stopJobWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
