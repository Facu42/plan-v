import { describe, expect, it } from 'vitest';
import { provisionSecretMatches, recoveryAcknowledgement, validateProvisionInput } from './provision.js';

describe('professional provisioning', () => {
  it('requires a display name and a positive fee when provided', () => {
    expect(validateProvisionInput({ userId: 'user-1', displayName: '  Verónica Trenti  ' })).toMatchObject({
      ok: true,
      displayName: 'Verónica Trenti',
      license: null,
      monthlyFee: null,
    });
    expect(validateProvisionInput({ userId: 'user-1', displayName: 'V' }).ok).toBe(false);
    expect(validateProvisionInput({ userId: '', displayName: 'Verónica' }).ok).toBe(false);
    expect(validateProvisionInput({ userId: 'user-1', displayName: 'Verónica', monthlyFee: 0 }).ok).toBe(false);
  });

  it('does not accept an empty or mismatched provision secret', () => {
    expect(provisionSecretMatches('secret', 'secret')).toBe(true);
    expect(provisionSecretMatches('Bearer secret', 'secret')).toBe(true);
    expect(provisionSecretMatches('secret', 'other')).toBe(false);
    expect(provisionSecretMatches('secret', '')).toBe(false);
    expect(provisionSecretMatches(undefined, 'secret')).toBe(false);
    expect(provisionSecretMatches('abc', 'ab')).toBe(false);
  });
});

describe('account recovery', () => {
  it('acknowledges recovery without revealing whether the email exists', () => {
    expect(recoveryAcknowledgement().message).toMatch(/Si hay una cuenta/);
    expect(JSON.stringify(recoveryAcknowledgement())).not.toContain('@');
  });
});
