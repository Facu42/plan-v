import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const exec = promisify(execFile);
const cliVersion = '2.120.0';
const prefix = join(tmpdir(), 'plan-v-signed-auth-');
const workdir = await mkdtemp(prefix);
const projectId = 'plan-v-signed-auth-' + randomUUID().slice(0, 8);
let pool;
let startAttempted = false;
let phase = 'comprobar Docker';

async function advisors(label, dbUrl) {
  const { stdout } = await cli(['db','advisors','--db-url',dbUrl,'--type','security','--output-format','json'],120000);
  const report = JSON.parse(stdout);
  const views = report.results.filter(item => item.name === 'security_definer_view');
  if (label === 'after' && views.some(item => item.metadata?.name === 'meal_logs_patient_view')) {
    throw new Error('El advisor sigue detectando la vista de comidas con permisos de dueño.');
  }
  const evidence = process.env.PLANV_SECURITY_EVIDENCE_DIR;
  if (evidence) {
    await mkdir(evidence,{recursive:true});
    await writeFile(join(evidence,`security-${label}.json`),stdout);
  }
  console.log('Advisors de seguridad ejecutados: ' + label + '; vistas definer: ' + views.length + '.');
}

async function cli(args, timeout = 60000) {
  const executable = process.env.PLANV_SUPABASE_CLI;
  const command = executable || process.execPath;
  if (!executable && !process.env.npm_execpath) throw new Error('Ejecutar mediante npm run test:auth-isolation.');
  const commandArgs = executable ? args : [process.env.npm_execpath, 'exec', '--yes', '--package', 'supabase@' + cliVersion, '--', 'supabase', ...args];
  // No se imprime status/start: pueden incluir claves exclusivamente locales.
  return exec(command, [...commandArgs, '--workdir', workdir], { timeout, maxBuffer: 16 * 1024 * 1024 });
}

function loopback(raw, protocols) {
  const url = new URL(raw);
  if (url.search||url.hash||!protocols.includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('La prueba solo permite servicios locales.');
  }
  return raw;
}

try {
  await exec('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 20000 });
  await mkdir(join(workdir, 'supabase'));
  const config = await readFile(new URL('../supabase/auth-isolation/config.toml', import.meta.url), 'utf8');
  await writeFile(join(workdir, 'supabase', 'config.toml'), config.replace('PLAN_V_ISOLATION_PROJECT', projectId));
  console.log('Iniciando Supabase temporal con Auth, base y API de datos.');
  phase = 'iniciar servicios locales';
  startAttempted = true;
  await cli(['start', '--exclude', 'studio,meta,realtime,edge-runtime,functions,imgproxy,inbucket,analytics,vector'], 600000);
  const { stdout } = await cli(['status', '--output', 'json']);
  phase = 'preparar esquema local';
  const status = JSON.parse(stdout);
  const apiUrl = loopback(status.API_URL, ['http:']);
  const dbUrl = loopback(status.DB_URL, ['postgres:', 'postgresql:']);
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) throw new Error('Faltan claves del entorno local.');
  pool = new pg.Pool({ connectionString: dbUrl, max: 2 });
  const { rows } = await pool.query("select to_regclass('public.patients') as patients");
  if (rows[0].patients !== null) throw new Error('La base temporal debe estar vacía.');
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  const snapshot = await readFile(new URL('../supabase/auth-isolation/live-policy-snapshot.sql', import.meta.url), 'utf8');
  let snapshotApplied = false;
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    phase = 'migración local ' + file;
    // La instantánea reproduce el estado vulnerable antes de su corrección.
    if (file.endsWith('_close_legacy_patient_row_access.sql')) {
      await pool.query(snapshot);
      await pool.query(await readFile(new URL('../supabase/auth-isolation/live-view-options.sql', import.meta.url), 'utf8'));
      snapshotApplied = true;
    }
    if (file.endsWith('_readonly_patient_meal_views.sql')) {
      phase = 'advisors antes del cierre de vistas';
      await advisors('before',dbUrl);
      // Real Supabase reproduction with fictional identities, always rolled back.
      await pool.query('begin');
      try {
        const owner=randomUUID(),a=randomUUID(),b=randomUUID(),pa=randomUUID(),pb=randomUUID(),mid=randomUUID();
        await pool.query("insert into auth.users(id,email,email_confirmed_at) values($1,'view-owner@example.test',now()),($2,'view-a@example.test',now()),($3,'view-b@example.test',now())",[owner,a,b]);
        const nid=(await pool.query("select public.provision_nutritionist($1,'Ficticia') as id",[owner])).rows[0].id;
        await pool.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'A ficticia','waived'),($4,$2,$5,'B ficticia','waived')",[pa,nid,a,pb,b]);
        await pool.query('set local role authenticated');
        await pool.query("select set_config('request.jwt.claim.sub',$1,true)",[a]);
        await pool.query("insert into public.meal_logs_patient_view(id,patient_id,slot_label) values($1,$2,'Cena')",[mid,pb]);
        await pool.query('reset role');
        if((await pool.query('select patient_id from public.meal_logs where id=$1',[mid])).rows[0]?.patient_id!==pb) throw new Error('No se reprodujo el INSERT cruzado.');
        console.log('INSERT cruzado reproducido en Supabase temporal; datos revertidos.');
      } finally { await pool.query('rollback'); }
    }
    await pool.query(await readFile(new URL(file, migrations), 'utf8'));
    if (file.endsWith('_readonly_patient_meal_views.sql')) {
      phase = 'advisors después del cierre de vistas';
      await advisors('after',dbUrl);
    }
  }
  if (!snapshotApplied) await pool.query(snapshot);
  await pool.query("notify pgrst, 'reload schema'");
  await pool.end(); pool = undefined;
  // Esperar solo el refresco del catálogo; las pruebas hacen además controles positivos.
  await new Promise(resolve => setTimeout(resolve, 2000));
  const env = {
    ...process.env,
    APP_MODE: 'staging', AI_MODE: 'disabled', RATE_LIMIT_ENABLED: '0',
    PLANV_LOCAL_SIGNED_AUTH: '1',
    PLANV_LOCAL_AUTH_DB_URL: dbUrl,
    SUPABASE_URL: apiUrl, SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: apiUrl, VITE_SUPABASE_ANON_KEY: status.ANON_KEY,
  };
  // Ninguna configuración heredada puede activar proveedores o el runner hospedado.
  for (const key of ['PLANV_LIVE_AUTH', 'RLS_JWT_NUTRI_A', 'RLS_JWT_NUTRI_B', 'RLS_PATIENT_B_ID', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'RESEND_API_KEY', 'ALERT_WEBHOOK_URL']) delete env[key];
  const vitest = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url));
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [vitest, 'run', '--config', 'vitest.auth-isolation.config.ts', '--maxWorkers=1'], { env, stdio: 'inherit' });
    child.on('error', reject); child.on('exit', code => resolve(code ?? 1));
  });
  if (code !== 0) process.exitCode = 1;
  else if (process.env.PLANV_PRODUCT_BROWSER === '1') {
    phase = 'recorrido en navegador con sesiones locales';
    const script = fileURLToPath(new URL('./product-browser.local.mjs', import.meta.url));
    const browserCode = await new Promise((resolve,reject) => {
      const child = spawn(process.execPath,[script],{env,stdio:'inherit'});
      child.on('error',reject);child.on('exit',code=>resolve(code ?? 1));
    });
    if (browserCode !== 0) process.exitCode = 1;
  }
} catch (error) {
  // No volcar stdout/stderr de las herramientas: pueden contener claves temporales.
  console.error('No se completó la prueba de sesiones (' + phase + '): ' + (error?.code || error?.name || 'error') + '.');
  const diagnostic = error?.stderr || (error instanceof Error ? error.message : '');
  console.error(String(diagnostic).split('\n').slice(-15).map(line => /(?:key|secret|password|token)/i.test(line)
    ? '[Credenciales omitidas]' : line.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT omitido]')).join('\n'));
  process.exitCode = 1;
} finally {
  await pool?.end();
  if (startAttempted) {
    try {
      await cli(['stop', '--project-id', projectId, '--no-backup'], 90000);
      console.log('Contenedores y datos ficticios eliminados.');
    } catch {
      console.error('No se pudo limpiar el entorno local ' + projectId + '.');
      process.exitCode = 1;
    }
  }
  const target = resolve(workdir);
  if (!target.startsWith(resolve(prefix)) || !target.startsWith(resolve(tmpdir()) + sep)) {
    throw new Error('Ruta temporal fuera del espacio de prueba.');
  }
  await rm(target, { recursive: true, force: true });
}

