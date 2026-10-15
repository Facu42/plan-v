import { describe, expect, it, vi } from 'vitest';
import { checkTarget, runMonitor, TARGETS } from './monitor-produccion.mjs';

const response = (status, body = '') => ({ ok: status >= 200 && status < 300, status, text: async () => body });
const healthy = JSON.stringify({ status: 'ok', supabase: true });

describe('monitor de producción', () => {
  it('vigila la API y la web publicadas', () => {
    expect(TARGETS.map((target) => target.url)).toEqual([
      'https://api-production-aad6.up.railway.app/api/health',
      'https://plan-v-eight.vercel.app/',
    ]);
  });

  it('da por sana la API solo si responde ok y con la base conectada', async () => {
    const api = TARGETS[0];
    expect(await checkTarget(api, async () => response(200, healthy))).toEqual({ ok: true });
    expect(await checkTarget(api, async () => response(200, JSON.stringify({ status: 'ok', supabase: false }))))
      .toEqual({ ok: false, reason: 'responde sin la base de datos conectada' });
    expect(await checkTarget(api, async () => response(502, 'Bad gateway'))).toEqual({ ok: false, reason: 'respondió 502' });
    expect(await checkTarget(api, async () => { throw new Error('timeout'); })).toEqual({ ok: false, reason: 'no respondió (timeout)' });
  });

  it('da por sana la web si responde 200', async () => {
    const web = TARGETS[1];
    expect(await checkTarget(web, async () => response(200, '<html>'))).toEqual({ ok: true });
    expect(await checkTarget(web, async () => response(404))).toEqual({ ok: false, reason: 'respondió 404' });
  });

  it('reintenta antes de avisar, para no alarmar por un corte de segundos', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('reset'))
      .mockResolvedValue(response(200, healthy));
    const result = await runMonitor({ targets: [TARGETS[0]], fetcher, attempts: 3, waitMs: 0 });
    expect(result).toEqual({ ok: true, failures: [] });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('avisa con el nombre del servicio y el motivo cuando falla en todos los intentos', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(503));
    const result = await runMonitor({ targets: TARGETS, fetcher, attempts: 2, waitMs: 0 });
    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      { name: 'API (Railway)', url: TARGETS[0].url, reason: 'respondió 503' },
      { name: 'Web (Vercel)', url: TARGETS[1].url, reason: 'respondió 503' },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
});
