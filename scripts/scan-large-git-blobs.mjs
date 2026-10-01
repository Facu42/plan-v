import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Audited immutable Figma scene export: these fields contain public library,
// component and paint/style asset IDs, not credentials. No other blob is exempt.
const FIGMA_SCENE_BLOB = '2839c49b25b9cb16e91fd3f560581f9dafc14dfe';

export function figmaAssetIds(node, ids = new Set()) {
  if (!node || typeof node !== 'object') return ids;
  for (const [name, value] of Object.entries(node)) {
    if (typeof value === 'string' && (
      (['key', 'sourceLibraryKey', 'componentKey'].includes(name) && /^[a-f0-9]{40}$/.test(value))
      || (name === 'sourceLibraryKey' && ['SYMBOL', 'FRAME'].includes(node.type) && /^[A-Za-z0-9-]{131}$/.test(value))
    )) ids.add(value);
    else if (value && typeof value === 'object') figmaAssetIds(value, ids);
  }
  return ids;
}

export async function* overlappingChunks(source, blockSize = 1024 * 1024, overlap = 64 * 1024) {
  if (overlap < 0 || overlap >= blockSize) throw new Error('Invalid overlap');
  let pending = Buffer.alloc(0);
  for await (const bytes of source) {
    pending = Buffer.concat([pending, bytes]);
    while (pending.length >= blockSize) {
      yield pending.subarray(0, blockSize);
      pending = pending.subarray(blockSize - overlap);
    }
  }
  if (pending.length) yield pending;
}

async function main() {
  const scanner = process.argv[2];
  if (!scanner) throw new Error('Gitleaks executable required');
  const ids = execFileSync('git', ['rev-list', '--objects', '--all', '--no-object-names'], { maxBuffer: 32 * 1024 * 1024 });
  const metadata = execFileSync('git', ['cat-file', '--batch-check=%(objecttype) %(objectname) %(objectsize)'], { input: ids, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  // Include the entire decimal-MB/MiB boundary range in this second scan.
  const large = metadata.trim().split('\n').map(line => line.split(' ')).filter(([kind, , size]) => kind === 'blob' && Number(size) >= 5_000_000);
  const directory = await mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), 'plan-v-large-blobs-'));
  let configuration = await readFile('.gitleaks.toml', 'utf8');
  if (large.some(([, id]) => id === FIGMA_SCENE_BLOB)) {
    const scene = JSON.parse(execFileSync('git', ['cat-file', 'blob', FIGMA_SCENE_BLOB], { maxBuffer: 64 * 1024 * 1024 }));
    if (!Array.isArray(scene.nodeChanges) || !Array.isArray(scene.blobs)) throw new Error('Unexpected audited scene structure');
    const ids = [...figmaAssetIds(scene.nodeChanges)];
    // Two scene IDs are split at fragment boundaries (34 and 37 characters).
    // Include only those exact public ID prefixes, under the same immutable hash.
    const values = [...new Set(ids.flatMap(id => [id, id.slice(0, 34), id.slice(0, 37)]))];
    if (configuration.lastIndexOf('id = "generic-api-key"') < configuration.lastIndexOf('[[rules]]')) throw new Error('Unexpected scanner rule order');
    configuration += `\n[[rules.allowlists]]\ndescription = "Exact public Figma asset IDs and fragment prefixes in one audited immutable scene blob"\ncondition = "AND"\nregexTarget = "secret"\npaths = ['''${FIGMA_SCENE_BLOB}-[0-9]+\\.txt$''']\nregexes = ['''^(${values.join('|')})$''']\n`;
    console.log(JSON.stringify({ auditedPublicAssetIds: ids.length, immutableScene: FIGMA_SCENE_BLOB }));
  }
  // The main config ends in generic-api-key: only that rule receives this
  // additional AND allowlist (exact values AND exact immutable blob fragments).
  const configPath = join(directory, 'large-scan.toml');
  await writeFile(configPath, configuration);
  let fragments = 0;
  for (const [, id] of large) {
    const git = spawn('git', ['cat-file', 'blob', id], { stdio: ['ignore', 'pipe', 'inherit'] });
    const finished = new Promise((resolveExit, reject) => {
      git.once('error', reject);
      git.once('close', code => code === 0 ? resolveExit() : reject(new Error('Cannot read Git object')));
    });
    let index = 0;
    for await (const chunk of overlappingChunks(git.stdout)) {
      await writeFile(join(directory, `${id}-${index++}.txt`), chunk);
      fragments++;
    }
    await finished;
  }
  console.log(JSON.stringify({ largeObjects: large.length, fragments, overlapBytes: 65536 }));
  if (!large.length) return;
  // Keep diagnostics redacted. Reports stay in the private temporary directory.
  const args = ['dir', directory, '--config', configPath, '--redact', '--no-banner', '--max-decode-depth', '1', '--timeout', '600', '--exit-code', '1', '--report-format', 'json', '--report-path', join(directory, 'findings.json')];
  const scannerProcess = spawn(scanner, args, { stdio: 'inherit' });
  scannerProcess.once('error', error => { console.error(error.message); process.exitCode = 1; });
  scannerProcess.once('close', code => { process.exitCode = code ?? 1; });
  console.log(`Redacted report: ${join(directory, 'findings.json')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
