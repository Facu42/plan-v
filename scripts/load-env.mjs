import { existsSync, readFileSync } from 'node:fs';

function parseEnvValue(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

export function loadProjectEnv() {
  const values = new Map();
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) values.set(match[1], parseEnvValue(match[2]));
    }
  }
  for (const [name, value] of values) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
}
