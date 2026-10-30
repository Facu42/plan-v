import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientErrorMessage, reportClientError, resetClientErrorReports } from './client-errors';

describe('aviso de fallas de la app', () => {
  afterEach(() => { vi.unstubAllGlobals(); resetClientErrorReports(); });

  it('manda tipo, ruta sin búsqueda y mensaje recortado', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(reportClientError('render', new TypeError('x'.repeat(400)), { pathname: '/app/plan' })).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/client-errors$/);
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ kind: 'render', path: '/app/plan', message: expect.stringMatching(/^TypeError: x+$/) });
    expect(body.message).toHaveLength(300);
  });

  it('no manda más de cinco por carga de página', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    for (let i = 0; i < 8; i += 1) reportClientError('error', 'falla', { pathname: '/app' });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('si no hay red, la app sigue', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(() => reportClientError('promise', null, { pathname: '/app' })).not.toThrow();
    expect(clientErrorMessage(null)).toBe('Error sin detalle');
  });
});
