import { describe, expect, it, vi } from 'vitest';
import {
  CODE_MISMATCH_MESSAGE,
  PREPARE_ERROR_MESSAGE,
  VERIFY_ERROR_MESSAGE,
  challengeAndConfirmTotp,
  discardUnverifiedTotp,
  enrollTotp,
  listVerifiedTotp,
  normalizeTotpCode,
  unenrollTotp,
  type MfaAuthClient,
} from './mfa-totp';

const SECRET = 'JBSWY3DPEHPK3PXP';
const QR = 'data:image/svg+xml;base64,ZmljdGljaW8=';

function client(partial: Partial<MfaAuthClient['auth']['mfa']> & { refreshSession?: () => Promise<unknown> }): MfaAuthClient {
  return {
    auth: {
      mfa: {
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        unenroll: vi.fn(),
        listFactors: vi.fn(),
        ...partial,
      },
      refreshSession: partial.refreshSession ?? vi.fn(async () => ({ data: {}, error: null })),
    },
  };
}

describe('normalizeTotpCode', () => {
  it('acepta seis cifras y descarta cualquier otra cosa', () => {
    expect(normalizeTotpCode('123456')).toBe('123456');
    expect(normalizeTotpCode(' 12 34 56 ')).toBe('123456');
    expect(normalizeTotpCode('12345')).toBeNull();
    expect(normalizeTotpCode('1234567')).toBeNull();
    expect(normalizeTotpCode('abcdef')).toBeNull();
  });
});

describe('enroll / challenge / verify', () => {
  it('da de alta un TOTP y devuelve QR y clave sin usar challengeAndVerify', async () => {
    const mfa = client({
      listFactors: vi.fn(async () => ({ data: { totp: [], all: [] }, error: null })),
      enroll: vi.fn(async () => ({
        data: { id: 'factor-1', totp: { qr_code: QR, secret: SECRET } },
        error: null,
      })),
    });
    const result = await enrollTotp(mfa);
    expect(result).toEqual({ ok: true, factorId: 'factor-1', qr: QR, secret: SECRET });
    expect(mfa.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: 'totp', friendlyName: 'Nutridash' });
    expect(mfa.auth.mfa).not.toHaveProperty('challengeAndVerify');
  });

  it('tira un alta a medias antes de pedir otra', async () => {
    const unenroll = vi.fn(async () => ({ data: {}, error: null }));
    const mfa = client({
      listFactors: vi.fn(async () => ({
        data: {
          totp: [],
          all: [
            { id: 'viejo', factor_type: 'totp', status: 'unverified' },
            { id: 'ok', factor_type: 'totp', status: 'verified' },
          ],
        },
        error: null,
      })),
      unenroll,
      enroll: vi.fn(async () => ({
        data: { id: 'nuevo', totp: { qr_code: QR, secret: SECRET } },
        error: null,
      })),
    });
    await enrollTotp(mfa);
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'viejo' });
    expect(unenroll).not.toHaveBeenCalledWith({ factorId: 'ok' });
  });

  it('confirma el código con challenge y después verify', async () => {
    const challenge = vi.fn(async () => ({ data: { id: 'chal-9' }, error: null }));
    const verify = vi.fn(async () => ({ data: {}, error: null }));
    const refreshSession = vi.fn(async () => ({ data: {}, error: null }));
    const mfa = client({ challenge, verify, refreshSession });
    expect(await challengeAndConfirmTotp(mfa, 'factor-1', '123 456')).toEqual({ ok: true });
    expect(challenge).toHaveBeenCalledWith({ factorId: 'factor-1' });
    expect(verify).toHaveBeenCalledWith({ factorId: 'factor-1', challengeId: 'chal-9', code: '123456' });
    expect(refreshSession).toHaveBeenCalled();
  });

  it('rechaza un código inválido sin llamar a Supabase', async () => {
    const challenge = vi.fn();
    const mfa = client({ challenge });
    expect(await challengeAndConfirmTotp(mfa, 'factor-1', '12')).toEqual({ ok: false, error: CODE_MISMATCH_MESSAGE });
    expect(challenge).not.toHaveBeenCalled();
  });

  it('no mete la clave secreta en el error si el alta falla', async () => {
    const mfa = client({
      listFactors: vi.fn(async () => ({ data: { totp: [], all: [] }, error: null })),
      enroll: vi.fn(async () => ({ data: null, error: { message: `secret ${SECRET}` } })),
    });
    const result = await enrollTotp(mfa);
    expect(result).toEqual({ ok: false, error: PREPARE_ERROR_MESSAGE });
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it('dice que el código no coincide si verify falla, sin filtrar el secreto', async () => {
    const mfa = client({
      challenge: vi.fn(async () => ({ data: { id: 'chal-1' }, error: null })),
      verify: vi.fn(async () => ({ data: null, error: { message: `bad ${SECRET}` } })),
    });
    const result = await challengeAndConfirmTotp(mfa, 'factor-1', '123456');
    expect(result).toEqual({ ok: false, error: CODE_MISMATCH_MESSAGE });
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it('si no hay desafío, no intenta verify', async () => {
    const verify = vi.fn();
    const mfa = client({
      challenge: vi.fn(async () => ({ data: null, error: { message: 'no' } })),
      verify,
    });
    expect(await challengeAndConfirmTotp(mfa, 'factor-1', '123456')).toEqual({ ok: false, error: VERIFY_ERROR_MESSAGE });
    expect(verify).not.toHaveBeenCalled();
  });
});

describe('listado y baja', () => {
  it('cuenta solo los TOTP verificados', async () => {
    const mfa = client({
      listFactors: vi.fn(async () => ({
        data: { totp: [{ id: 'a', status: 'verified' }, { id: 'b', status: 'unverified' }], all: [] },
        error: null,
      })),
    });
    expect(await listVerifiedTotp(mfa)).toEqual([{ id: 'a' }]);
  });

  it('quita el factor y refresca la sesión', async () => {
    const unenroll = vi.fn(async () => ({ data: {}, error: null }));
    const refreshSession = vi.fn(async () => ({ data: {}, error: null }));
    const mfa = client({ unenroll, refreshSession });
    expect(await unenrollTotp(mfa, 'factor-1')).toEqual({ ok: true });
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'factor-1' });
    expect(refreshSession).toHaveBeenCalled();
  });

  it('descarta solo los TOTP sin confirmar', async () => {
    const unenroll = vi.fn(async () => ({ data: {}, error: null }));
    const mfa = client({
      listFactors: vi.fn(async () => ({
        data: {
          totp: [],
          all: [
            { id: 'u', factor_type: 'totp', status: 'unverified' },
            { id: 'p', factor_type: 'phone', status: 'unverified' },
          ],
        },
        error: null,
      })),
      unenroll,
    });
    await discardUnverifiedTotp(mfa);
    expect(unenroll).toHaveBeenCalledTimes(1);
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'u' });
  });
});
