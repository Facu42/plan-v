import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/components/nutrigo';
const replacements = [
  [/font-size:\s*7px/g, 'font-size:11px'],
  [/font-size:\s*8px/g, 'font-size:12px'],
  [/font-size:\s*9px/g, 'font-size:12px'],
  [/font-size:\s*10px/g, 'font-size:13px'],
];

const changed = [];
for (const file of readdirSync(root)) {
  if (!file.endsWith('.css') || file === 'clinic-professional.css') continue;
  const path = join(root, file);
  const original = readFileSync(path, 'utf8');
  let next = original;
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  if (next !== original) {
    writeFileSync(path, next);
    changed.push(file);
  }
}

console.log(changed.join('\n'));
console.log('count', changed.length);
