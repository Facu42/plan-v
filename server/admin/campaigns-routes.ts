import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { campaignConfig, campaignService, contactSchema, draftSchema, parseLeadsCsv } from './campaigns.js';

async function body<T>(c: Context, schema: z.ZodType<T>) {
  const raw = await c.req.text();
  if (raw.length > 110_000) throw new CareError(413, 'Los datos son demasiado largos.');
  try { return schema.parse(JSON.parse(raw)); }
  catch { throw new CareError(400, 'Revisá los datos cargados.'); }
}
const id = (value: string) => {
  if (!z.uuid().safeParse(value).success) throw new CareError(400, 'El identificador no es válido.');
  return value;
};
const cursor = (c: Context) => c.req.query('after') ? id(c.req.query('after')!) : undefined;

export function registerCampaignRoutes(app: Hono, requireAdmin: (c: Context) => Promise<boolean>) {
  app.use('/api/admin/campaigns/*', async (c, next) => {
    // El modo demo nunca habilita el cliente real, aunque haya credenciales locales.
    if (!await requireAdmin(c)) throw new CareError(403, 'Las campañas requieren una sesión de administración verificada.');
    await next();
  });
  app.get('/api/admin/campaigns/config', (c) => {
    const config = campaignConfig();
    return c.json({ campaigns_ready: Boolean(config.key && config.audience && z.uuid().safeParse(config.audience).success), mail_ready: Boolean(config.key), from: config.from, reply_to: config.reply_to });
  });
  app.get('/api/admin/campaigns/contacts', async (c) => c.json(await campaignService().contacts(cursor(c))));
  app.post('/api/admin/campaigns/contacts', async (c) => {
    const input = await body(c, contactSchema);
    return c.json(await campaignService().addContact(input), 201);
  });
  app.post('/api/admin/campaigns/import', async (c) => {
    const input = await body(c, z.object({ csv: z.string().max(100_000) }).strict());
    const contacts = parseLeadsCsv(input.csv);
    return c.json(await campaignService().importContacts(contacts));
  });
  app.get('/api/admin/campaigns/broadcasts', async (c) => c.json(await campaignService().broadcasts(cursor(c))));
  app.post('/api/admin/campaigns/broadcasts', async (c) => {
    const input = await body(c, draftSchema);
    return c.json(await campaignService().createDraft(input), 201);
  });
  app.get('/api/admin/campaigns/broadcasts/:id', async (c) => c.json(await campaignService().broadcast(id(c.req.param('id')))));
  app.get('/api/admin/campaigns/broadcasts/:id/opened', async (c) => c.json({ opened: await campaignService().opened(id(c.req.param('id'))) }));
  app.post('/api/admin/campaigns/broadcasts/:id/send', async (c) => {
    await body(c, z.object({ confirm: z.literal(true) }).strict());
    return c.json(await campaignService().send(id(c.req.param('id'))));
  });
  app.get('/api/admin/campaigns/emails', async (c) => c.json(await campaignService().emails(cursor(c))));
  app.get('/api/admin/campaigns/emails/:id', async (c) => c.json(await campaignService().email(id(c.req.param('id')))));
}
