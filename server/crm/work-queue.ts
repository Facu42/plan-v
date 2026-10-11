import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { CRM_WORK_KINDS, type CrmWorkItem, type CrmWorkQuery, type CrmWorkResponse } from '../../src/types/crm-work.js';
import { CareError } from '../care/errors.js';

export const workQueueQuerySchema = z.object({
  patient_id: z.string().trim().min(1).max(100).optional(),
  kind: z.enum(CRM_WORK_KINDS).optional(),
  cursor: z.string().min(1).max(2000).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
}).strict();

const cursorSchema = z.object({
  v: z.literal(1),
  scope: z.string(),
  patient_id: z.string().nullable(),
  kind: z.enum(CRM_WORK_KINDS).nullable(),
  at: z.string(),
  id: z.string(),
}).strict();

// Orden estable: el identificador desempata registros con la misma fecha.
export function workOrder(a: CrmWorkItem, b: CrmWorkItem) {
  return b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id);
}

export function paginateWorkQueue(items: CrmWorkItem[], query: CrmWorkQuery, scope: string, source: CrmWorkResponse['source']): CrmWorkResponse {
  let cursor: z.infer<typeof cursorSchema> | null = null;
  if (query.cursor) {
    try {
      cursor = cursorSchema.parse(JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')));
      if (cursor.scope !== scope || cursor.patient_id !== (query.patient_id ?? null) || cursor.kind !== (query.kind ?? null)) throw new Error('different_filter');
    } catch {
      throw new CareError(400, 'La página no corresponde a estos filtros. Volvé a cargar la bandeja.');
    }
  }
  const matchingPatient = items.filter(item => !query.patient_id || item.patient_id === query.patient_id);
  const counts = Object.fromEntries(CRM_WORK_KINDS.map(kind => [kind, 0])) as CrmWorkResponse['counts'];
  for (const item of matchingPatient) counts[item.kind] += 1;
  const filtered = matchingPatient.filter(item => !query.kind || item.kind === query.kind).sort(workOrder);
  const available = cursor
    ? filtered.filter(item => workOrder(item, { updated_at: cursor!.at, id: cursor!.id } as CrmWorkItem) > 0)
    : filtered;
  const limit = query.limit ?? 30;
  const page = available.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page,
    next_cursor: last && available.length > limit ? Buffer.from(JSON.stringify({
      v: 1, scope, patient_id: query.patient_id ?? null, kind: query.kind ?? null, at: last.updated_at, id: last.id,
    })).toString('base64url') : null,
    total: filtered.length,
    counts,
    source,
  };
}
