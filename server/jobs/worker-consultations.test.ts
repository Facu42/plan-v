import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ reminders: vi.fn(async () => {}), consultations: vi.fn(async () => {}), organizer: vi.fn(async () => {}), configure: vi.fn(), scheduling: vi.fn(async () => {}), covers: vi.fn(), drain: vi.fn(async () => {}), log: vi.fn() }));
vi.mock('./handlers.js', () => ({ handleProcessingJob: vi.fn() }));
vi.mock('./queue.js', () => ({ processQueue: {}, drain: calls.drain }));
vi.mock('../recipes/cover-workers.js', () => ({ runCoverWorkers: calls.covers }));
vi.mock('../scheduling/worker.js', () => ({ runSchedulingSyncJobs: calls.scheduling }));
vi.mock('../document-organizer/worker.js', () => ({ runPendingDocumentOrganizer: calls.organizer }));
vi.mock('../ops/log.js', () => ({ writeOpsLog: calls.log }));
vi.mock('../mail/reminder-worker.js', () => ({ tickAppointmentReminders: calls.reminders }));
vi.mock('../consultations/worker.js', () => ({ configureConsultationProcessing: calls.configure, runPendingConsultations: calls.consultations }));
vi.mock('../consultations/repository.js', () => ({ cleanupExpiredConsultationAudio: vi.fn() }));
vi.mock('../clinical-processing/provider.js', () => ({ transcribeClinicalAudio: vi.fn(), summarizeClinicalText: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => false }));
import { startJobWorker, stopJobWorker } from './worker.js';
beforeEach(() => { vi.useFakeTimers(); vi.stubEnv('VITEST', 'false'); vi.clearAllMocks(); });
afterEach(() => { stopJobWorker(); vi.useRealTimers(); vi.unstubAllEnvs(); });
it('suma consultas sin dejar de procesar los recordatorios existentes y detiene ambos al cerrar', async () => {
  startJobWorker('test-owner');
  expect(calls.configure).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1000);
  expect(calls.consultations).toHaveBeenCalledWith(2);
  expect(calls.scheduling).toHaveBeenCalledWith(2);
  expect(calls.organizer).toHaveBeenCalledWith(2);
  expect(calls.reminders).toHaveBeenCalledTimes(1);
  expect(calls.covers).toHaveBeenCalledTimes(1);
  expect(calls.drain).toHaveBeenCalledTimes(1);
  stopJobWorker();
  await vi.advanceTimersByTimeAsync(1000);
  expect(calls.reminders).toHaveBeenCalledTimes(1);
  expect(calls.consultations).toHaveBeenCalledTimes(1);
  expect(calls.scheduling).toHaveBeenCalledTimes(1);
  expect(calls.organizer).toHaveBeenCalledTimes(1);
});

it('una sincronización pendiente no se solapa ni detiene las otras colas', async () => {
  let finish!: () => void;
  calls.scheduling.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  startJobWorker('test-owner');
  await vi.advanceTimersByTimeAsync(3000);
  expect(calls.scheduling).toHaveBeenCalledTimes(1);
  for (const call of [calls.consultations, calls.organizer, calls.reminders]) expect(call).toHaveBeenCalledTimes(3);
  finish();
  await vi.advanceTimersByTimeAsync(1000);
  expect(calls.scheduling).toHaveBeenCalledTimes(2);
});

it('una sincronización fallida permite el próximo lote sin registrar detalles privados', async () => {
  calls.scheduling.mockRejectedValueOnce(new Error('Dato clínico ficticio privado del proveedor'));
  startJobWorker('test-owner');
  await vi.advanceTimersByTimeAsync(2000);
  expect(calls.scheduling).toHaveBeenCalledTimes(2);
  expect(calls.reminders).toHaveBeenCalledTimes(2);
  expect(calls.log).toHaveBeenCalledExactlyOnceWith('warn', 'scheduling_worker_failed', { status: 'review_pending' });
});
