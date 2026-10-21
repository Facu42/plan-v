import { afterEach, describe, expect, it, vi } from 'vitest';
import { MpCallError, mercadoPago, parseMpErrorBody } from './mp.js';

afterEach(() => vi.restoreAllMocks());

describe('mpFetch error details', () => {
  it('reads MP body, attaches details and logs plain text without secrets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      message: 'Cannot operate between different countries for payer juan.perez@example.com',
      error: 'bad_request',
      status: 400,
      cause: [{ code: 'CC_VAL_433', description: 'Card token is invalid' }],
    }), { status: 400 }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = await mercadoPago.searchPreapproval('APP_USR-secret-token', 'ref?token=abc').catch((e) => e);
    expect(error).toBeInstanceOf(MpCallError);
    expect(error.httpStatus).toBe(400);
    expect(error.details).toMatchObject({ status: 400, error: 'bad_request', cause: [{ code: 'CC_VAL_433', description: 'Card token is invalid' }] });
    const line = String(warn.mock.calls[0][0]);
    expect(line).toMatch(/^mp_call_error method=GET path=\/preapproval\/search http_status=400/);
    expect(line).toContain('CC_VAL_433');
    expect(line).toContain('different countries');
    expect(line).not.toContain('juan.perez@example.com');
    expect(line).not.toContain('secret-token');
    expect(line).not.toContain('external_reference');
  });

  it('keeps 404 and maps 5xx to 503', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('', { status: 502 }));
    expect((await mercadoPago.getPreapproval('t', 'x').catch((e) => e)).httpStatus).toBe(404);
    expect((await mercadoPago.getPreapproval('t', 'x').catch((e) => e)).httpStatus).toBe(503);
  });

  it('parses text bodies', () => {
    expect(parseMpErrorBody('upstream down')).toEqual({ status: null, message: 'upstream down', error: null, cause: [] });
  });
});
