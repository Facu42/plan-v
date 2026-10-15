import { describe, expect, it } from 'vitest';
import { productionContentSecurityPolicy } from './content-security-policy';

describe('production browser CSP', () => {
  it('limits scripts to local assets and connections to the configured service', () => {
    const policy = productionContentSecurityPolicy('https://project.supabase.co');
    expect(policy).toContain("script-src 'self';");
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).toContain("connect-src 'self' https://project.supabase.co wss://project.supabase.co;");
    expect(policy).not.toContain('*.supabase.co');
  });
  it('does not permit arbitrary connections when Supabase is absent', () => {
    expect(productionContentSecurityPolicy()).toContain("connect-src 'self';");
  });
  it('rejects invalid or unsafe service URLs before producing deployable HTML', () => {
    for (const url of ['http://project.supabase.co', 'https://user:pass@project.supabase.co', 'https://project.supabase.co/path', 'https://project.supabase.co?x=1']) {
      expect(() => productionContentSecurityPolicy(url)).toThrow();
    }
  });
});
