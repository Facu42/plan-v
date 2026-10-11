import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import postcss from 'postcss';
import path from 'node:path';

// No Preflight import. Scope the emitted rules without changing the MCP classes.
await mkdir('.gstack', { recursive: true });
const classes = new Set();
function visit(node) {
  if (!node || typeof node !== 'object') return;
  for (const value of (node.props?.className ?? '').split(/\s+/)) if (value) classes.add(value);
  for (const child of node.children ?? []) visit(child);
}
for (const file of await readdir('src/features/nutrigo/source')) {
  if (file !== 'index.json' && file.endsWith('.json')) visit(JSON.parse(await readFile(`src/features/nutrigo/source/${file}`, 'utf8')));
}
// Scan parsed JSX classes, not JSON escapes (which are not real class names).
await writeFile('.gstack/nutrigo-classes.txt', [...classes].join('\n'));
const cli = JSON.parse(await readFile('node_modules/@tailwindcss/cli/package.json', 'utf8'));
const bin = typeof cli.bin === 'string' ? cli.bin : cli.bin.tailwindcss;
execFileSync(process.execPath, [path.resolve('node_modules/@tailwindcss/cli', bin),
  '-i', 'src/features/nutrigo/tailwind-input.css', '-o', '.gstack/nutrigo-utilities.css', '--minify'], { stdio: 'inherit' });
const css = postcss.parse(await readFile('.gstack/nutrigo-utilities.css', 'utf8'));
css.walkRules(rule => {
  // Nested selectors inherit their already scoped outer selector.
  if (rule.selector.includes('&')) return;
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type === 'rule' || (parent.type === 'atrule' && /keyframes$/i.test(parent.name))) return;
  }
  rule.selectors = rule.selectors.map(selector =>
    /^(?::root|:host)$/.test(selector) ? '.mcp-nutrigo' : `.mcp-nutrigo ${selector}`);
});
// The existing application has unlayered CSS. Keep scope specificity effective
// without introducing a global layer order that changes those screens.
css.walkAtRules('layer', rule => {
  if (rule.nodes) rule.replaceWith(rule.nodes);
  else rule.remove();
});
const defaults = await readFile('src/features/nutrigo/nutrigo.css', 'utf8');
await writeFile('src/features/nutrigo/nutrigo.generated.css', defaults + '\n' + css.toString() + '\n');
