import { timingSafeEqual } from 'node:crypto';

export const RECOVERY_ACK = 'Si hay una cuenta con ese email, vas a recibir un mensaje para recuperarla.';

export type ProvisionInput = {
  userId: string;
  displayName: string;
  license?: string | null;
  monthlyFee?: number | null;
};

export type ValidProvision = {
  ok: true;
  userId: string;
  displayName: string;
  license: string | null;
  monthlyFee: number | null;
};

export function validateProvisionInput(input: ProvisionInput): ValidProvision | { ok: false; message: string } {
  const userId = input.userId.trim();
  const displayName = input.displayName.trim();
  if (!userId) return { ok: false, message: 'Usuario requerido' };
  if (displayName.length < 2) return { ok: false, message: 'Nombre profesional requerido' };
  if (input.monthlyFee != null && input.monthlyFee <= 0) {
    return { ok: false, message: 'El honorario debe ser positivo' };
  }
  const license = input.license?.trim() || null;
  return { ok: true, userId, displayName, license, monthlyFee: input.monthlyFee ?? null };
}

export function provisionSecretMatches(presented: string | undefined, expected: string | undefined): boolean {
  const secret = expected?.trim();
  const value = presented?.replace(/^Bearer\s+/i, '').trim();
  if (!secret || !value) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function recoveryAcknowledgement(): { message: string } {
  return { message: RECOVERY_ACK };
}
