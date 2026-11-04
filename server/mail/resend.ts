import { CareError } from '../care/errors.js';

/** Cola por proceso: Resend limita por cuenta; nunca reintentamos escrituras. */
let queue: Promise<unknown> = Promise.resolve();
let nextRequestAt = 0;
export class ResendClient {
  constructor(private readonly key: string, private readonly interval = 550) {}

  async call<T>(path: string, method = 'GET', body?: unknown, allowMissing = false): Promise<T> {
    const run = async () => {
      if (this.interval) {
        const wait = Math.max(0, nextRequestAt - Date.now());
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        nextRequestAt = Date.now() + this.interval;
      }
      try {
        const response = await fetch(`https://api.resend.com${path}`, {
          method,
          headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(15_000),
          redirect: 'error',
        });
        if (allowMissing && response.status === 404) return null as T;
        if (!response.ok) throw new CareError(response.status === 429 ? 429 : 503,
          response.status === 429 ? 'Resend alcanzó su límite. Esperá un momento antes de reintentar.' : 'Resend no pudo completar el pedido. Revisá el estado antes de reintentar.');
        return await response.json() as T;
      } catch (error) {
        if (error instanceof CareError) throw error;
        throw new CareError(503, 'No se pudo conectar con Resend. Revisá el estado antes de reintentar.');
      }
    };
    const pending = queue.then(run);
    queue = pending.catch(() => undefined);
    return pending;
  }
}
