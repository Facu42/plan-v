// Rutas del directorio de nutris matriculadas.
// - /api/directory/me: la nutri ve su solicitud, sube la matrícula y elige si aparece.
// - /api/admin/nutritionists/:id/license: el administrador (con dos pasos) ve el archivo y aprueba o rechaza.
//   Pasa por la auditoría de /api/admin/* como cualquier otra acción del administrador.
// - /api/public/directory: la lista pública, sin datos privados.
import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { LICENSE_SCOPES } from '../../src/types/directory.js';
import * as repo from './repository.js';

const licenseSchema = z.object({
  license_number: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9 .\-/]+$/),
  license_scope: z.enum(LICENSE_SCOPES),
  license_province: z.string().trim().max(60).default(''),
  listed: z.boolean(),
  file: z.string().max(7_000_000),
}).strict();
const listedSchema = z.object({ listed: z.boolean() }).strict();
const reviewSchema = z.object({ decision: z.enum(['verify', 'reject']), reason: z.string().trim().max(200).default('') }).strict();
const uuid = z.uuid();

async function body<T>(c: Context, schema: z.ZodType<T>, max: number, message: string): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > max) throw new repo.CareError(413, 'El archivo pesa más de 5 MB. Probá con una foto más liviana.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, message); }
}

/** Solo la nutricionista dueña del consultorio. En demo, la vista de paciente no entra. */
async function nutri(c: Context): Promise<{ nid: string; persistent: boolean }> {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) {
    if (c.req.query('audience') === 'patient') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return { nid: DEMO_NUTRITIONIST_ID, persistent: false };
  }
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new repo.CareError(403, 'Solo la nutricionista puede subir su matrícula.');
  return { nid: actor.nutritionistId, persistent: true };
}

export type AdminGuard = (c: Context) => Promise<boolean>;

function nidParam(c: Context): string {
  const parsed = uuid.safeParse(c.req.param('id'));
  // En demo la nutri de ejemplo no tiene uuid.
  if (!parsed.success && c.req.param('id') !== DEMO_NUTRITIONIST_ID) throw new repo.CareError(404, 'Esa nutricionista no existe.');
  return c.req.param('id') ?? '';
}

export function registerDirectoryRoutes(app: Hono, requireAdmin: AdminGuard) {
  app.get('/api/directory/me', async c => {
    const a = await nutri(c);
    return c.json({ listing: await repo.myListing(a.nid, a.persistent) });
  });
  app.put('/api/directory/me/license', async c => {
    const a = await nutri(c);
    const input = await body(c, licenseSchema, 7_050_000, 'Revisá el número de matrícula y el archivo.');
    return c.json({ listing: await repo.submitLicense(a.nid, input, a.persistent) });
  });
  app.put('/api/directory/me/listed', async c => {
    const a = await nutri(c);
    const input = await body(c, listedSchema, 200, 'No se pudo leer el cambio.');
    return c.json({ listing: await repo.setListed(a.nid, input.listed, a.persistent) });
  });

  app.get('/api/admin/licenses', async c => {
    const persistent = await requireAdmin(c);
    return c.json({ licenses: await repo.adminList(persistent) });
  });
  app.get('/api/admin/nutritionists/:id/license/file', async c => {
    const persistent = await requireAdmin(c);
    return c.json({ url: await repo.adminFile(nidParam(c), persistent) });
  });
  app.post('/api/admin/nutritionists/:id/license/review', async c => {
    const persistent = await requireAdmin(c);
    const input = await body(c, reviewSchema, 1_000, 'Elegí aprobar o rechazar.');
    const auth = c.get('auth');
    return c.json({ license: await repo.adminReview(nidParam(c), input.decision, input.reason, 'userId' in auth ? auth.userId : null, persistent) });
  });

  app.get('/api/public/directory', async c => {
    try {
      return c.json({ nutris: await repo.publicDirectory(isSupabaseEnabled()) });
    } catch (error) {
      // Sin la migración instalada el directorio se ve vacío en vez de fallar.
      if (error instanceof repo.CareError && error.status === 501) return c.json({ nutris: [] });
      throw error;
    }
  });
}
