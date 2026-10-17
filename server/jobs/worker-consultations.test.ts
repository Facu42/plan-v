import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  communications: vi.fn(async () => {}), consultations: vi.fn(async () => {}),
  scheduling: vi.fn(async () => {}), organizer: vi.fn(async () => {}),
  configure: vi.fn(), covers: vi.fn(), drain: vi.fn(async () => {}), log: vi.fn(),
}));
vi.mock('./handlers.js', () => ({ handleProcessingJob: vi.fn() }));
vi.mock('./queue.js', () => ({ processQueue: {}, drain: calls.drain }));
vi.mock('../recipes/cover-workers.js', () => ({ runCoverWorkers: calls.covers }));
vi.mock('../communications/worker.js', () => ({ tickCommunicationJobs: calls.communications }));
vi.mock('../scheduling/worker.js', () => ({ runSchedulingSyncJobs: calls.scheduling }));
vi.mock('../document-organizer/worker.js', () => ({ runPendingDocumentOrganizer: calls.organizer }));
vi.mock('../consultations/worker.js', () => ({ configureConsultationProcessing: calls.configure, runPendingConsultations: calls.consultations }));
vi.mock('../consultations/repository.js', () => ({ cleanupExpiredConsultationAudio: vi.fn() }));
vi.mock('../clinical-processing/provider.js', () => ({ transcribeClinicalAudio: vi.fn(), summarizeClinicalText: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => false }));
vi.mock('../ops/log.js', () => ({ writeOpsLog: calls.log }));
import { startJobWorker, stopJobWorker } from './worker.js';

beforeEach(() => { vi.useFakeTimers(); vi.stubEnv('VITEST', 'false'); vi.clearAllMocks(); });
afterEach(() => { stopJobWorker(); vi.useRealTimers(); vi.unstubAllEnvs(); });

it('arranca una sola cola de comunicaciones junto a consultas, importación y agenda; detiene nuevos ticks al cerrar', async () => {
  startJobWorker('test-owner');
  startJobWorker('duplicate-owner');
  expect(calls.configure).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1000);
  expect(calls.consultations).toHaveBeenCalledExactlyOnceWith(2);
  expect(calls.scheduling).toHaveBeenCalledExactlyOnceWith(2);
  expect(calls.organizer).toHaveBeenCalledExactlyOnceWith(2);
  expect(calls.communications).toHaveBeenCalledTimes(1);
  expect(calls.covers).toHaveBeenCalledTimes(1);
  expect(calls.drain).toHaveBeenCalledTimes(1);
  stopJobWorker();
  await vi.advanceTimersByTimeAsync(2000);
  for (const call of [calls.consultations, calls.scheduling, calls.organizer, calls.communications, calls.drain]) expect(call).toHaveBeenCalledTimes(1);
});

it('no solapa un lote pendiente y habilita el siguiente sólo después de finalizar', async () => {
  let finish!: () => void;
  calls.communications.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  startJobWorker('test-owner');
  await vi.advanceTimersByTimeAsync(3000);
  expect(calls.communications).toHaveBeenCalledTimes(1);
  expect(calls.consultations).toHaveBeenCalledTimes(3);
  finish();
  await vi.advanceTimersByTimeAsync(1000);
  expect(calls.communications).toHaveBeenCalledTimes(2);
});

it('un lote rechazado no bloquea el worker ni registra el error privado del proveedor', async () => {
  calls.communications.mockRejectedValueOnce(new Error('Contenido clínico ficticio que no debe registrarse'));
  startJobWorker('test-owner');
  await vi.advanceTimersByTimeAsync(2000);
  expect(calls.communications).toHaveBeenCalledTimes(2);
  expect(calls.consultations).toHaveBeenCalledTimes(2);
  expect(calls.log).toHaveBeenCalledExactlyOnceWith('warn', 'communication_worker_failed', { status: 'review_pending' });
});
