import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { noticeSaveSchema, templateInputSchema } from '../../src/types/ajustes.js';
import { deleteTemplate, listNotices, listTemplates, saveNotice, saveTemplate } from './repository.js';

async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new CareError(403, 'Sólo la nutricionista puede usar esta configuración.');
  return { owner: actor.nutritionistId, persistent: true };
}
async function body(c: Context) {
  const raw = await c.req.text();
  if (raw.length > 40000) throw new CareError(413, 'El contenido es demasiado grande.');
  try { return JSON.parse(raw); } catch { throw new CareError(400, 'Revisá el contenido que querés guardar.'); }
}

export function registerAjustesRoutes(app: Hono) {
  app.get('/api/ajustes/templates', async c => { const a = await professional(c); return c.json({ templates: await listTemplates(a.owner, a.persistent) }); });
  app.put('/api/ajustes/templates', async c => {
    const a = await professional(c), parsed = templateInputSchema.safeParse(await body(c));
    if (!parsed.success) throw new CareError(400, 'Revisá el nombre, el momento y el contenido de la plantilla.');
    return c.json({ template: await saveTemplate(a.owner, parsed.data, a.persistent) });
  });
  app.delete('/api/ajustes/templates/:id', async c => {
    const a = await professional(c), id = z.uuid().safeParse(c.req.param('id'));
    if (!id.success) throw new CareError(400, 'Plantilla inválida.');
    await deleteTemplate(a.owner, id.data, a.persistent); return c.json({ ok: true });
  });
  app.get('/api/ajustes/notices', async c => { const a = await professional(c); return c.json({ notices: await listNotices(a.owner, a.persistent) }); });
  app.put('/api/ajustes/notices', async c => {
    const a = await professional(c), parsed = noticeSaveSchema.safeParse(await body(c));
    if (!parsed.success) throw new CareError(400, 'Revisá el aviso: cuándo se manda y el mensaje.');
    return c.json({ notice: await saveNotice(a.owner, parsed.data, a.persistent) });
  });
}
