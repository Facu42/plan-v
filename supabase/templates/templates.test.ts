import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = resolve('supabase/templates');
const files = ['confirmation.html', 'recovery.html', 'magic_link.html'] as const;

describe('plantillas de Auth de Supabase', () => {
  it('están en castellano, con marca Nutridash y el enlace de GoTrue', () => {
    expect(readdirSync(dir)).toEqual(expect.arrayContaining([...files, 'README.md']));
    for (const file of files) {
      const html = readFileSync(resolve(dir, file), 'utf8');
      expect(html).toContain('Nutridash');
      expect(html).toContain('{{ .ConfirmationURL }}');
      expect(html).toContain('#c5e46d');
      expect(html).toMatch(/podés|confirmá|recuperá|usá|entr/i);
      expect(html).not.toMatch(/Confirm your|Reset your password|Magic Link/i);
    }
  });
});
