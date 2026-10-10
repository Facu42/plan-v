import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import type { CrmFeedResponse } from '../../src/types/crm-feed.js';

describe('Novedades de la cartera: API demo', () => {
  beforeEach(() => resetStore());

  it('devuelve comidas y agua recientes sin descripciones, fotos ni notas', async () => {
    const response = await app.request('/api/crm/feed?days=7');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json() as CrmFeedResponse;
    expect(body.source).toBe('memory');
    expect(body.items.some((item) => item.kind === 'water')).toBe(true);
    const text = JSON.stringify(body);
    for (const meal of getPatient('pat-sofia')!.meal_logs) {
      if (meal.description) expect(text).not.toContain(meal.description);
      if (meal.note_for_nutri) expect(text).not.toContain(meal.note_for_nutri);
    }
  });

  it('filtra por paciente y por revisión, y rechaza filtros inválidos o ajenos', async () => {
    const own = await (await app.request('/api/crm/feed?days=30&patient_id=pat-sofia')).json() as CrmFeedResponse;
    expect(own.items.every((item) => item.patient_id === 'pat-sofia')).toBe(true);
    const pending = await (await app.request('/api/crm/feed?days=30&status=pending_review')).json() as CrmFeedResponse;
    expect(pending.items.every((item) => item.kind === 'meal' && item.status === 'pending_review')).toBe(true);
    expect((await app.request('/api/crm/feed?patient_id=other-clinic')).status).toBe(403);
    expect((await app.request('/api/crm/feed?days=5')).status).toBe(400);
    expect((await app.request('/api/crm/feed?audience=patient')).status).toBe(403);
  });

  it('las pacientes archivadas no aparecen', async () => {
    getPatient('pat-sofia')!.archived_at = new Date().toISOString();
    const body = await (await app.request('/api/crm/feed?days=30')).json() as CrmFeedResponse;
    expect(body.items.some((item) => item.patient_id === 'pat-sofia')).toBe(false);
  });
});
