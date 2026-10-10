import type { Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { searchWorkspace } from './repository.js';

const searchQuerySchema = z.object({ q: z.string().trim().min(2).max(80) }).strict();

export function registerSearchRoutes(app: Hono) {
  app.get('/api/search', async c => {
    const parsed = searchQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw new CareError(400, 'Escribí al menos dos letras para buscar.');
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    return c.json(await searchWorkspace('userId' in auth ? auth.userId : null, persistent, parsed.data.q));
  });
}
