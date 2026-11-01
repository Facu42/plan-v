import { afterEach, expect, it, vi } from 'vitest';

const getSessionToken = vi.fn(async () => 'from-session');
vi.mock('../lib/supabase', () => ({ getSessionToken: () => getSessionToken() }));

import { request } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  getSessionToken.mockClear();
});

it('si ya hay token, no vuelve a pedir la sesión (el getSession del alta se traba)', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"ok":true}', { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  await request('/api/me/professional', { method: 'POST', accessToken: 'known-token', body: '{}' });
  expect(getSessionToken).not.toHaveBeenCalled();
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    headers: expect.objectContaining({ Authorization: 'Bearer known-token' }),
  });
});
