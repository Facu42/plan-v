import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node scripts/with-env.mjs <command>...');
  process.exit(1);
}

const mode = process.env.APP_MODE || 'demo';
const demoish = mode === 'demo' || mode === 'test';
const env = {
  ...process.env,
  APP_MODE: mode,
  AI_MODE: process.env.AI_MODE || (demoish ? 'demo' : 'disabled'),
  ...(demoish ? { VITE_ALLOW_DEMO: process.env.VITE_ALLOW_DEMO || 'true' } : {}),
};

const child = spawn(args.join(' '), {
  stdio: 'inherit',
  env,
  shell: true,
  windowsHide: true,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
