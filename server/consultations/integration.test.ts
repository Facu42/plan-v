import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { maxBodyBytes } from '../ops/readiness.js';

describe('grabación y OCR en la configuración publicada', () => {
  it('admite segmentos de audio y habilita sólo los permisos necesarios', async () => {
    expect(maxBodyBytes('/api/patients/a/consultations/b/chunks')).toBeGreaterThanOrEqual(11_201_000);
    expect(maxBodyBytes('/api/auth/recover')).toBe(1_048_576);
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
    const headers = config.headers[0].headers as Array<{key:string;value:string}>;
    expect(headers.find(h => h.key === 'Permissions-Policy')?.value).toContain('microphone=(self)');
    expect(headers.find(h => h.key === 'Permissions-Policy')?.value).toContain('display-capture=(self)');
    const csp = headers.find(h => h.key === 'Content-Security-Policy')?.value;
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("worker-src 'self'");
  });
});
