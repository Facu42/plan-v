import { describe, expect, it } from 'vitest';
import { auditedBinaryAllowlist, figmaAssetIds, overlappingChunks } from './scan-large-git-blobs.mjs';

describe('large historical secret scanning', () => {
  it('exempts only the Facebook pattern inside the one audited binary blob', () => {
    expect(auditedBinaryAllowlist('0'.repeat(40))).toBe('');
    const rule = auditedBinaryAllowlist('664f5dde8309c599f8e1fc4575e58342a9668782');
    expect(rule).toBe([
      '',
      '[[rules]]',
      'id = "facebook-page-access-token"',
      '[[rules.allowlists]]',
      'description = "Random bytes in the audited Impeccable engine binary (one immutable blob)"',
      "paths = ['''664f5dde8309c599f8e1fc4575e58342a9668782-[0-9]+\\.txt$''']",
      '',
    ].join('\n'));
  });
  it('does not treat unrelated credential fields as public scene assets', () => {
    const publicId = 'a'.repeat(40);
    const unrelatedCredential = 'b'.repeat(40);
    const ids = figmaAssetIds([{ type: 'SYMBOL', componentKey: publicId, api_key: unrelatedCredential, nested: { password: unrelatedCredential, sourceLibraryKey: 'c'.repeat(131) } }]);
    expect([...ids]).toEqual([publicId]);
  });
  it('preserves every byte and keeps a secret crossing a fragment boundary intact', async () => {
    const token = 'SYNTHETIC_SECRET_SPANNING_THE_BOUNDARY';
    const input = Buffer.from('x'.repeat(90) + token + 'y'.repeat(200));
    const source = async function* () { for (let i = 0; i < input.length; i += 17) yield input.subarray(i, i + 17); };
    const chunks: Buffer[] = [];
    for await (const chunk of overlappingChunks(source(), 100, 50)) chunks.push(chunk);
    expect(chunks.some(chunk => chunk.toString().includes(token))).toBe(true);
    expect(Buffer.concat(chunks.map((chunk, i) => i ? chunk.subarray(50) : chunk))).toEqual(input);
    expect(chunks.every(chunk => chunk.length <= 100)).toBe(true);
  });
});
