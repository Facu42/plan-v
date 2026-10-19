import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { resolveWorkScope } from './repository.js';
import { accompanimentMealQuery, loadAccompanimentMeals, loadAccompanimentMetrics } from './accompaniment-repository.js';
import { enqueueFollowupReminder } from './accompaniment-reminders.js';
import type { AccompanimentDays } from '../../src/types/accompaniment.js';
async function scopeFor(c: Context) { const auth = c.get('auth'), persistent = 'userId' in auth && isSupabaseEnabled(); if (!persistent && c.req.query('audience') === 'patient')
    throw new CareError(403, 'Sólo profesionales del consultorio.'); return resolveWorkScope('userId' in auth ? auth.userId : null, persistent); }
const reminders = z.object({ request_id: z.uuid(), patient_ids: z.array(z.string().trim().min(1).max(100)).min(1).max(50).refine(ids => new Set(ids).size === ids.length) }).strict();
export function registerAccompanimentRoutes(app: Hono) {
    app.get('/api/crm/accompaniment/metrics', async (c) => {
        const scope = await scopeFor(c), days = Number(c.req.query('days') ?? 30);
        if (![30, 90, 365].includes(days) || Object.keys(c.req.query()).some(k => k !== 'days'))
            throw new CareError(400, 'Elegí mes, trimestre o año.');
        return c.json(await loadAccompanimentMetrics(scope, days as AccompanimentDays));
    });
    app.get('/api/crm/accompaniment/meals', async (c) => {
        const scope = await scopeFor(c), parsed = accompanimentMealQuery.safeParse(c.req.query());
        if (!parsed.success)
            throw new CareError(400, 'Revisá los filtros y la página solicitada.');
        return c.json(await loadAccompanimentMeals(scope, parsed.data));
    });
    app.post('/api/crm/accompaniment/reminders', async (c) => {
        const scope = await scopeFor(c), raw = await c.req.text();
        if (raw.length > 10000)
            throw new CareError(413, 'La lista es demasiado larga.');
        const parsed = reminders.safeParse((() => { try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        } })());
        if (!parsed.success)
            throw new CareError(400, 'Revisá las pacientes y el aviso.');
        if (parsed.data.patient_ids.some(id => !scope.patients.some(p => p.id === id && !p.archived_at && !p.deactivated_at && !p.anonymized_at)))
            throw new CareError(403, 'Una paciente ya no está disponible en tu consultorio.');
        const metrics = await loadAccompanimentMetrics(scope, 30), eligible = new Set(metrics.quiet.map(p => p.id));
        const results: Array<{
            id: string;
            status: 'sent' | 'skipped' | 'failed';
            reason?: string;
        }> = [];
        for (const id of parsed.data.patient_ids) {
            if (!eligible.has(id)) {
                results.push({ id, status: 'skipped', reason: 'Ya tiene registros o todavía no pasó una semana desde el alta.' });
                continue;
            }
            try {
                const event = await enqueueFollowupReminder(scope, id, parsed.data.request_id);
                const delivery = event?.deliveries.find(d => d.channel === 'in_app');
                results.push({ id, status: delivery?.status === 'sent' ? 'sent' : 'skipped', ...(delivery?.status !== 'sent' ? { reason: event ? 'El aviso no está habilitado o la paciente todavía no vinculó su cuenta.' : 'La paciente ya registró o dejó de estar disponible.' } : {}) });
            }
            catch {
                results.push({ id, status: 'failed', reason: 'No pudimos confirmar el aviso. Reintentá con la misma solicitud.' });
            }
        }
        return c.json({ request_id: parsed.data.request_id, results });
    });
}
