import type { Hono } from 'hono';
import { z } from 'zod';
import { clientAddress } from '../security/client-address.js';
import { emitOpsAlert } from './alerts.js';
import { safePath, writeOpsLog } from './log.js';
import { consumeRateLimit } from './rate-limit.js';

/**
 * Fallas de la app en el navegador (pantalla rota, error sin atrapar). Sin esto, si a una paciente se le rompe
 * la pantalla, ella ve «Algo salió mal» y nadie se entera. Solo se guarda el tipo, la ruta sin datos y un texto
 * corto ya limpio de mails, ids y claves: nunca el contenido de la pantalla ni datos de salud.
 */
export const clientErrorSchema = z.object({
  kind: z.enum(['render', 'error', 'promise']),
  path: z.string().max(200),
  message: z.string().max(300),
}).strict();

/** Por dirección, a lo sumo diez avisos por minuto: un bucle de errores no llena los registros. */
const PER_ADDRESS_LIMIT = 10;

export function registerClientErrorRoutes(app: Hono) {
  app.post('/api/client-errors', async (c) => {
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
    const parsed = clientErrorSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
    if (!consumeRateLimit(`client-error:${clientAddress(c)}`, PER_ADDRESS_LIMIT).ok) return c.body(null, 204);
    const path = safePath(parsed.data.path);
    // La clave «message» no está en la lista que el registro tacha; el texto pasa igual por la limpieza del registro.
    writeOpsLog('warn', 'client_error', { kind: parsed.data.kind, path, message: parsed.data.message.slice(0, 200) });
    if (parsed.data.kind === 'render') emitOpsAlert({ kind: 'client_error', path });
    return c.body(null, 204);
  });
}
