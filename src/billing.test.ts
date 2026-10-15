import { describe, expect, it } from 'vitest';
import { hasFullPatientAccess, resolveBillingStatus } from './billing';

describe('patient billing access', () => {
  it('unlocks waived and active patients whose period includes today', () => {
    expect(hasFullPatientAccess({ billing_status: 'waived', billing_until: null }, '2026-09-06')).toBe(true);
    expect(hasFullPatientAccess({ billing_status: 'active', billing_until: '2026-09-06' }, '2026-09-06')).toBe(true);
    expect(hasFullPatientAccess({ billing_status: 'active', billing_until: '2026-10-06' }, '2026-09-06')).toBe(true);
  });

  it('locks pending patients and resolves expired active periods as past due', () => {
    expect(resolveBillingStatus({ billing_status: 'pending', billing_until: null }, '2026-09-06')).toBe('pending');
    expect(resolveBillingStatus({ billing_status: 'active', billing_until: '2026-09-05' }, '2026-09-06')).toBe('past_due');
    expect(resolveBillingStatus({ billing_status: 'active', billing_until: null }, '2026-09-06')).toBe('past_due');
    expect(hasFullPatientAccess({ billing_status: 'past_due', billing_until: '2026-09-05' }, '2026-09-06')).toBe(false);
  });
});
