import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const confirm = process.env.DISPOSABLE_SUPABASE_APPLY;
const databaseUrl = process.env.DISPOSABLE_DATABASE_URL;
const dir = new URL('../supabase/migrations/', import.meta.url);

if (process.env.APP_MODE === 'production') {
  console.error('Refusing to apply SQL while APP_MODE=production.');
  process.exit(1);
}

if (confirm !== 'I_UNDERSTAND_DISPOSABLE_ONLY') {
  console.error('This script applies executable migrations to an empty disposable database only.');
  console.error('Set DISPOSABLE_SUPABASE_APPLY=I_UNDERSTAND_DISPOSABLE_ONLY and DISPOSABLE_DATABASE_URL.');
  console.error('Do not point DISPOSABLE_DATABASE_URL at a project with real patients.');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('DISPOSABLE_DATABASE_URL is required.');
  process.exit(1);
}

const files = (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort();
if (!files.length) {
  console.error('No executable migrations found under supabase/migrations/.');
  process.exit(1);
}

for (const name of files) {
  const text = await readFile(new URL(name, dir), 'utf8');
  if (/^\s*--.*(?:\bDRAFT\b|DO NOT APPLY|NO CORRER)/im.test(text)) {
    console.error(`Refusing review-only SQL: ${name}`);
    process.exit(1);
  }
}

const guard = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-tA', '-c', `
do $guard$
declare n int := 0;
begin
  if to_regclass('public.patients') is not null then
    execute 'select count(*)::int from public.patients' into n;
    if n > 0 then
      raise exception 'Refusing to apply SQL: public.patients already has % row(s).', n;
    end if;
  end if;
end
$guard$;
select 0;
`], { encoding: 'utf8' });

if (guard.status !== 0) {
  console.error(guard.stderr || 'Could not inspect the disposable database.');
  process.exit(guard.status ?? 1);
}

const patientCount = Number((guard.stdout || '0').trim().split('\n').pop());
if (!Number.isFinite(patientCount)) {
  console.error('Could not read patient count from the disposable database.');
  process.exit(1);
}
if (patientCount > 0) {
  console.error(`Refusing to apply SQL: public.patients already has ${patientCount} row(s).`);
  process.exit(1);
}

console.log(`Empty schema confirmed. Applying ${files.length} executable migration(s) via psql.`);
for (const name of files) {
  const file = fileURLToPath(new URL(name, dir));
  console.log(name);
  const result = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Disposable schema updated.');
