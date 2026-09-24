import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decideSeedApply, SEED_CONFIRM } from './seed-demo-guard.mjs';

const databaseUrl = process.env.DISPOSABLE_DATABASE_URL;
const confirm = process.env.PLANV_SEED_APPLY;
const appMode = process.env.APP_MODE;
const sqlFile = fileURLToPath(new URL('./seed-demo.sql', import.meta.url));

function refuse(message) {
  console.error(message);
  process.exit(1);
}

const preflight = decideSeedApply({
  databaseUrl,
  confirm,
  appMode,
  patientCount: 0,
});
if (!preflight.ok && preflight.reason !== 'unverified') {
  if (preflight.reason === 'production') refuse('Refusing demo seed while APP_MODE=production.');
  if (preflight.reason === 'confirm') {
    refuse(`Refusing demo seed. Set PLANV_SEED_APPLY=${SEED_CONFIRM} and a local empty DISPOSABLE_DATABASE_URL.`);
  }
  if (preflight.reason === 'hosted') {
    refuse('Refusing demo seed: hosted Supabase and plan-v-app are blocked. Last note (2026-09-21) recorded patients on plan-v-app. This run does not re-verify that project and will not connect to it.');
  }
  refuse('Refusing demo seed: DISPOSABLE_DATABASE_URL must be postgres:// on 127.0.0.1 or localhost.');
}

const count = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-tA', '-c', `
do $guard$
declare n int := 0;
begin
  if to_regclass('public.patients') is null then
    raise exception 'Refusing demo seed: public.patients is missing. Apply disposable migrations first.';
  end if;
  execute 'select count(*)::int from public.patients' into n;
  if n > 0 then
    raise exception 'Refusing demo seed: public.patients already has % row(s).', n;
  end if;
end
$guard$;
select 0;
`], { encoding: 'utf8' });

if (count.status !== 0) {
  const detail = `${count.stderr || ''}${count.stdout || ''}`;
  if (/already has/i.test(detail)) {
    refuse(detail.trim() || 'Refusing demo seed: public.patients already has rows. No SQL was applied.');
  }
  refuse(detail.trim() || 'Could not inspect public.patients. No seed SQL was applied.');
}

const patientCount = Number((count.stdout || '').trim().split('\n').pop());
const decision = decideSeedApply({ databaseUrl, confirm, appMode, patientCount });
if (!decision.ok) {
  refuse(`Refusing demo seed (${decision.reason}). No seed SQL was applied.`);
}

console.log('Empty local schema confirmed. Applying synthetic demo seed.');
const applied = spawnSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', sqlFile], { stdio: 'inherit' });
if (applied.status !== 0) process.exit(applied.status ?? 1);
console.log('Synthetic demo seed applied. Re-running stops if patients rows exist.');
