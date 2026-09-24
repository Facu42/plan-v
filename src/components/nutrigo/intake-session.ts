import { createIntakeSaveQueue } from './intake-save-queue';

type Saved = { intake: { revision: number; status: string } };
type Draft = { step: string; payload: unknown };
type Transport = {
  save: (data: Draft & { expected_revision: number }) => Promise<Saved>;
  submit: (revision: number) => Promise<Saved>;
};

// La revisión se actualiza DENTRO de la cola, antes de empezar la siguiente escritura.
export function createIntakeSession(initialRevision: number, transport: Transport) {
  const queue = createIntakeSaveQueue();
  queue.markReady();
  let revision = initialRevision;
  let submissionRevision: number | null = null;
  let sending = false;
  let receipt: Saved | null = null;
  let disposed = false;
  const saveNow = async (draft: Draft) => {
    const saved = await transport.save({ ...draft, expected_revision: revision });
    revision = saved.intake.revision;
    return saved;
  };
  return {
    get blocked() { return queue.blocked; },
    get awaitingReceipt() { return submissionRevision !== null && receipt === null; },
    save(draft: Draft) {
      if (sending || submissionRevision !== null || receipt || disposed) return Promise.resolve(null);
      return queue.enqueue(() => saveNow(draft));
    },
    consent<T>(task: () => Promise<T>) {
      if (sending || submissionRevision !== null || receipt || disposed) return Promise.resolve(null);
      return queue.enqueue(task);
    },
    async submit(draft: Draft) {
      if (receipt) return receipt;
      if (sending || disposed) return null;
      sending = true;
      try {
        return await queue.enqueue(async () => {
          // Si se perdió la respuesta del envío, reintentamos la misma operación idempotente.
          if (submissionRevision === null) {
            await saveNow(draft);
            submissionRevision = revision;
          }
          const saved = await transport.submit(submissionRevision);
          receipt = saved;
          revision = saved.intake.revision;
          return saved;
        });
      } finally { sending = false; }
    },
    dispose() { disposed = true; queue.stop(); },
  };
}
export type IntakeSession = ReturnType<typeof createIntakeSession>;
