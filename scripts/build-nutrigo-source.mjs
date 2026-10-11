import ts from 'typescript';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const original = 'design/figma-reference/original';
const out = 'src/features/nutrigo/source';
await mkdir(out, { recursive: true });
await mkdir('src/features/nutrigo/assets', { recursive: true });
const manifest = JSON.parse(await readFile('design/figma-reference/manifest.json', 'utf8'));
const assetsManifest = JSON.parse(await readFile('design/figma-reference/source-assets.json', 'utf8'));
// Static source JSX is evaluated once, without a browser, requests or screenshot.
function createFigmaNode(tag, props, ...children) {
  if (tag === 'fragment') return children.flat(Infinity).filter(x => x !== false && x != null);
  if (typeof tag === 'function') return tag({ ...props, children });
  return { tag, props: props ?? {}, children: children.flat(Infinity).filter(x => x !== false && x != null) };
}
const index = [];
for (const frame of manifest.nodes) {
  const key = frame.nodeId.replace(':', '-');
  const source = await readFile(`${original}/${key}.tsx`, 'utf8');
  const sha = createHash('sha256').update(source).digest('hex');
  if (sha !== frame.codeSha256) throw new Error(`Source changed: ${frame.nodeId}`);
  const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'createFigmaNode', module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'createFigmaNode', 'React', js)(module.exports, module, createFigmaNode, { Fragment: 'fragment' });
  const tree = module.exports.default();
  const assets = new Set();
  async function visit(node) {
    if (typeof node !== 'object') return;
    if (node.props?.src?.includes('figma.com/api/mcp/asset')) {
      const filename = node.props.src.split('/').pop();
      const asset = assetsManifest.find(entry => entry.file === filename);
      if (!asset) throw new Error(`Missing captured asset ${frame.nodeId}: ${filename}`);
      const bytes = await readFile(`src/features/nutrigo/assets/${filename}`);
      if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error(`Asset changed ${filename}`);
      node.props.src = `asset:${filename}`;
      assets.add(filename);
    }
    for (const child of node.children ?? []) await visit(child);
  }
  await visit(tree);
  await writeFile(`${out}/${key}.json`, JSON.stringify(tree));
  index.push({ ...frame, sourceSha256: sha, assets: [...assets] });
}
await writeFile(`${out}/index.json`, JSON.stringify(index, null, 2) + '\n');
console.log(`Converted ${index.length} original MCP frames, exact classes and verified local assets.`);
