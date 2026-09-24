import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { paginateItems } from './pagination.js';
import { resetStore } from './store.js';

describe('PV-11 paginated directory', () => {
  beforeEach(() => resetStore());
  it('slices in-memory collections with an explicit page contract', () => {
    expect(paginateItems(['a', 'b', 'c'], 0, 2)).toEqual({
      items: ['a', 'b'],
      page: { offset: 0, limit: 2, has_more: true },
    });
    expect(paginateItems(['a', 'b', 'c'], 2, 2)).toEqual({
      items: ['c'],
      page: { offset: 2, limit: 2, has_more: false },
    });
  });

  it('returns one directory page and does not store the response', async () => {
    const all = await app.request('/api/patients');
    const full = await all.json() as { patients: unknown[] };
    const response = await app.request('/api/patients?limit=1&offset=0');
    const body = await response.json() as { patients: unknown[]; page: { has_more: boolean; limit: number; offset: number } };
    expect(response.status).toBe(200);
    expect(body.patients).toHaveLength(1);
    expect(body.page).toEqual({ offset: 0, limit: 1, has_more: full.patients.length > 1 });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects an invalid page size', async () => {
    const response = await app.request('/api/patients?limit=0');
    expect(response.status).toBe(400);
  });
});
