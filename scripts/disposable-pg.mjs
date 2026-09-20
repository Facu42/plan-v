#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const action = process.argv[2] ?? 'up';
const bootstrap = fileURLToPath(new URL('../supabase/disposable/bootstrap.sql', import.meta.url));
const docker = ['sudo', 'docker'];
const container = process.env.DISPOSABLE_PG_CONTAINER || 'plan-v-disposable';
const image = process.env.DISPOSABLE_PG_IMAGE || 'postgres:16-alpine';
const url = process.env.DISPOSABLE_DATABASE_URL || 'postgres://planv@127.0.0.1:55433/planv_disposable';

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'inherit', ...opts });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function dockerArgs(args) {
  return [...docker.slice(1), ...args];
}

if (action === 'down') {
  spawnSync(docker[0], dockerArgs(['rm', '-f', container]), { encoding: 'utf8', stdio: 'inherit' });
  process.exit(0);
}

if (action === 'up' || action === 'reset') {
  if (action === 'reset') {
    spawnSync(docker[0], dockerArgs(['rm', '-f', container]), { encoding: 'utf8', stdio: 'inherit' });
  }
  const exists = spawnSync(docker[0], dockerArgs(['inspect', container]), { encoding: 'utf8' });
  if (exists.status !== 0) {
    run(docker[0], dockerArgs([
      'run', '-d',
      '--name', container,
      '--restart=no',
      '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
      '-e', 'POSTGRES_USER=planv',
      '-e', 'POSTGRES_DB=planv_disposable',
      '-p', '127.0.0.1:55433:5432',
      image,
    ]));
  } else {
    run(docker[0], dockerArgs(['start', container]));
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = spawnSync(docker[0], dockerArgs(['exec', container, 'pg_isready', '-U', 'planv', '-d', 'planv_disposable']), { encoding: 'utf8' });
    if (ready.status === 0) break;
    if (attempt === 39) {
      console.error('Disposable Postgres did not accept connections.');
      process.exit(1);
    }
    spawnSync('sleep', ['1']);
  }
  run('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', bootstrap]);
  console.log('Disposable Postgres is empty and bootstrapped.');
  console.log('Next: DISPOSABLE_SUPABASE_APPLY=I_UNDERSTAND_DISPOSABLE_ONLY DISPOSABLE_DATABASE_URL=postgres://planv@127.0.0.1:55433/planv_disposable npm run apply:disposable');
  process.exit(0);
}

console.error('usage: node scripts/disposable-pg.mjs up|reset|down');
process.exit(1);
