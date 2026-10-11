import { describe, expect, it } from 'vitest';
import { figmaAssetIds, overlappingChunks } from './scan-large-git-blobs.mjs';

describe('large historical secret scanning', () => {
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
