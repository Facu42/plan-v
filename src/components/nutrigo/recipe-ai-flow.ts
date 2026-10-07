import type { AiJobView } from '../../types/ai-jobs';

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/** Consultar una propuesta existente nunca vuelve a pedir otra generación. */
export async function waitForRecipeProposal(initial: AiJobView, options: {
  get: (id: string, signal?: AbortSignal) => Promise<{ job: AiJobView }>;
  signal?: AbortSignal;
  onProgress?: (job: AiJobView) => void;
  pause?: typeof pause;
  maxPolls?: number;
}): Promise<AiJobView> {
  let job = initial;
  let polls = 0;
  while (true) {
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    options.onProgress?.(job);
    if (job.status === 'stale' || job.error_code === 'stale_context') throw new Error('La información del paciente cambió. Volvé a generar la propuesta con los datos actuales.');
    if (job.status === 'failed' || job.status === 'cancelled') throw new Error('No se pudo preparar la receta. Podés reintentar; no se publicó ninguna propuesta.');
    if (job.status === 'succeeded') {
      if (job.artifact?.kind !== 'recipe_draft' || typeof job.artifact.payload.id !== 'string') throw new Error('No recibimos una receta completa. Volvé a consultar la propuesta.');
      return job;
    }
    if (polls >= (options.maxPolls ?? 60)) throw new Error('La propuesta sigue en proceso. Usá «Consultar propuesta» para revisar el resultado sin generar otra.');
    await (options.pause ?? pause)(2000, options.signal);
    job = (await options.get(job.id, options.signal)).job;
    polls += 1;
  }
}
