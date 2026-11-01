/** Cliente de TOTP sobre supabase.auth.mfa (enroll / challenge / verify). Nunca registra la clave. */

export const CODE_MISMATCH_MESSAGE = 'El código no coincide. Revisá la hora de tu teléfono y probá con el código nuevo.';
export const PREPARE_ERROR_MESSAGE = 'No pudimos preparar el código. Probá de nuevo.';
export const VERIFY_ERROR_MESSAGE = 'No pudimos verificar el código. Probá de nuevo.';
export const DISABLE_ERROR_MESSAGE = 'No pudimos quitar el código. Volvé a entrar e intentá de nuevo.';
export const MISSING_FACTOR_MESSAGE = 'No encontramos tu código. Salí y volvé a entrar.';

type FactorLite = { id: string; factor_type?: string; status?: string };
type AuthError = { message?: string } | null;

export type MfaAuthClient = {
  auth: {
    mfa: {
      enroll: (args: { factorType: 'totp'; friendlyName?: string }) => Promise<{
        data: { id: string; totp: { qr_code: string; secret: string } } | null;
        error: AuthError;
      }>;
      challenge: (args: { factorId: string }) => Promise<{ data: { id: string } | null; error: AuthError }>;
      verify: (args: { factorId: string; challengeId: string; code: string }) => Promise<{ data: unknown; error: AuthError }>;
      unenroll: (args: { factorId: string }) => Promise<{ data: unknown; error: AuthError }>;
      listFactors: () => Promise<{
        data: { totp?: FactorLite[]; all?: FactorLite[] } | null;
        error: AuthError;
      }>;
    };
    refreshSession: () => Promise<unknown>;
  };
};

export type TotpEnrollment = { factorId: string; qr: string; secret: string };
export type TotpOk = { ok: true };
export type TotpErr = { ok: false; error: string };
export type TotpResult<T extends TotpOk = TotpOk> = T | TotpErr;

export function normalizeTotpCode(raw: string): string | null {
  const code = raw.replace(/\D/g, '');
  return /^\d{6}$/.test(code) ? code : null;
}

export async function discardUnverifiedTotp(client: MfaAuthClient): Promise<void> {
  const { data } = await client.auth.mfa.listFactors();
  for (const factor of data?.all ?? []) {
    if (factor.factor_type === 'totp' && factor.status === 'unverified') {
      await client.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
}

export async function enrollTotp(client: MfaAuthClient, friendlyName = 'Nutridash'): Promise<TotpResult<TotpOk & TotpEnrollment>> {
  try {
    await discardUnverifiedTotp(client);
    const created = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName });
    if (created.error || !created.data) return { ok: false, error: PREPARE_ERROR_MESSAGE };
    return { ok: true, factorId: created.data.id, qr: created.data.totp.qr_code, secret: created.data.totp.secret };
  } catch {
    return { ok: false, error: PREPARE_ERROR_MESSAGE };
  }
}

export async function challengeAndConfirmTotp(client: MfaAuthClient, factorId: string, rawCode: string): Promise<TotpResult> {
  const code = normalizeTotpCode(rawCode);
  if (!code) return { ok: false, error: CODE_MISMATCH_MESSAGE };
  try {
    const challenge = await client.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data?.id) return { ok: false, error: VERIFY_ERROR_MESSAGE };
    const verified = await client.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
    if (verified.error) return { ok: false, error: CODE_MISMATCH_MESSAGE };
    await client.auth.refreshSession();
    return { ok: true };
  } catch {
    return { ok: false, error: VERIFY_ERROR_MESSAGE };
  }
}

export async function listVerifiedTotp(client: MfaAuthClient): Promise<Array<{ id: string }>> {
  const { data } = await client.auth.mfa.listFactors();
  return (data?.totp ?? []).filter((factor) => factor.status !== 'unverified').map((factor) => ({ id: factor.id }));
}

export async function unenrollTotp(client: MfaAuthClient, factorId: string): Promise<TotpResult> {
  try {
    const result = await client.auth.mfa.unenroll({ factorId });
    if (result.error) return { ok: false, error: DISABLE_ERROR_MESSAGE };
    await client.auth.refreshSession();
    return { ok: true };
  } catch {
    return { ok: false, error: DISABLE_ERROR_MESSAGE };
  }
}
