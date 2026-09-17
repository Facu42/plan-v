import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const confirm = process.env.DISPOSABLE_SUPABASE_APPLY;
const databaseUrl = process.env.DISPOSABLE_DATABASE_URL;
const contract = new URL('../supabase/contracts/016_plan_v_contract_draft.sql', import.meta.url);

if (process.env.APP_MODE === 'production') {
  console.error('Refusing to apply SQL while APP_MODE=production.');
  process.exit(1);
}

if (confirm !== 'I_UNDERSTAND_DISPOSABLE_ONLY') {
  console.error('This script applies the 016 draft to a disposable database only.');
  console.error('Set DISPOSABLE_SUPABASE_APPLY=I_UNDERSTAND_DISPOSABLE_ONLY and DISPOSABLE_DATABASE_URL.');
  console.error('Do not point DISPOSABLE_DATABASE_URL at a project with real patients.');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('DISPOSABLE_DATABASE_URL is required.');
  process.exit(1);
}

const sql = await readFile(contract, 'utf8');
const hash = createHash('sha256').update(sql).digest('hex');
const file = fileURLToPath(contract);
console.log(`016 draft sha256 ${hash}`);
console.log('Applying only to DISPOSABLE_DATABASE_URL via psql.');

const result = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', file], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
