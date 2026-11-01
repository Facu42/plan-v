import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/api/client.ts',
  'src/api/plans.ts',
  'src/api/scheduling.ts',
  'src/api/billing.ts',
].map((file) => readFileSync(resolve(file), 'utf8'));

describe('rutas que el front sí llama', () => {
  it('no pide GET /api/me, /api/plans, /api/billing/status ni /api/messages/threads', () => {
    const text = files.join('\n');
    expect(text).not.toMatch(/['"`]\/api\/me['"`]/);
    expect(text).not.toMatch(/['"`]\/api\/plans['"`]/);
    expect(text).not.toMatch(/['"`]\/api\/billing\/status['"`]/);
    expect(text).not.toMatch(/['"`]\/api\/messages\/threads['"`]/);
    expect(text).toContain('/api/me/patient');
    expect(text).toContain('/api/me/professional');
    expect(text).toContain('/api/billing/plan');
    expect(text).toContain('/api/messages/scheduled');
    expect(text).toContain('/api/scheduling/settings');
    expect(text).toContain('/api/scheduling?offset=');
  });
});
