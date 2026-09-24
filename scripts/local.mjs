import { spawn } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Ejecutá este entorno mediante npm run local.');
const env = {
  ...process.env,
  APP_MODE: process.env.APP_MODE || 'demo',
  AI_MODE: process.env.AI_MODE || 'demo',
  VITE_ALLOW_DEMO: process.env.VITE_ALLOW_DEMO || 'true',
};

const services = [
  ['api', ['run', 'dev:api']],
  ['app', ['run', 'dev:vite']],
  ['plan', ['run', 'dashboard']],
];

console.log('Plan V local');
console.log('Paciente:      http://127.0.0.1:5173/app/inicio');
console.log('Nutricionista: http://127.0.0.1:5173/crm/inicio');
console.log('Implementación: http://127.0.0.1:4317/#overview');
console.log('En la pantalla de acceso elegí “Continuar en modo demo”.');

let closing = false;
const children = services.map(([name, args]) => {
  const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: 'inherit', shell: false, windowsHide: true });
  child.on('error', (error) => {
    console.error(`[${name}] No se pudo iniciar: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (!closing && (code !== 0 || signal)) {
      console.error(`[${name}] terminó inesperadamente (${signal ?? code}).`);
      shutdown(code || 1);
    }
  });
  return child;
});

function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 100).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
