import { test } from 'node:test';
import { request as httpRequest } from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore, parsePlan, parseDependencies, emptyState } from './model.mjs';
import { createDashboardServer } from './server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = `| PV-01 | P0 / S | Verificar baseline | — | DEV |
| PV-02 | P0 / M | Verificar modos | 01 | DEV |
| PV-03 | P0 / M | Verificar privacidad | 01 | DEV+QA |`;
async function setup(t, markdown = fixture) {
  const dir = await mkdtemp(join(tmpdir(), 'plan-v-dashboard-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const planPath = join(dir, 'plan.md'), statePath = join(dir, 'status.json');
  await writeFile(planPath, markdown); await writeFile(statePath, JSON.stringify(emptyState()));
  return { store: createStore({ planPath, statePath }), planPath, statePath };
}
const change = (board, status, extra = {}) => ({ revision: board.revision, status, owner: '', notes: '', evidence: '', ...extra });

test('el plan real conserva 39 tickets únicos, 12 hallazgos y rangos de dependencias', async () => {
  const plan = parsePlan(await readFile(join(root, 'docs/plan-de-accion-2026-09-16.md'), 'utf8'));
  assert.equal(plan.tasks.length, 39); assert.equal(plan.findings.length, 12);
  assert.equal(new Set(plan.tasks.map(t => t.id)).size, 39);
  const gate = plan.tasks.find(t => t.id === 'PV-33');
  assert.equal(gate.dependencies.length, 15);
  assert.ok(gate.dependencies.includes('PV-16')); assert.ok(gate.dependencies.includes('PV-31'));
  assert.deepEqual(parseDependencies('13–15,22,28–31'), ['PV-13', 'PV-14', 'PV-15', 'PV-22', 'PV-28', 'PV-29', 'PV-30', 'PV-31']);
});
test('los errores del plan no producen un tablero de éxito parcial', () => {
  assert.throws(() => parsePlan(`${fixture}\n| PV-01 | P0 / S | duplicada | — | DEV |`), /duplicados/);
  assert.throws(() => parsePlan(fixture.replace('| — |', '| 02 |')), /Ciclo/);
  assert.throws(() => parsePlan(fixture.replace('| — |', '| 99 |')), /inexistente/);
  assert.throws(() => parseDependencies('1–0'), /inválido/);
});
test('el estado inicial no atribuye avance: sólo PV-01 puede iniciarse', async t => {
  const { store } = await setup(t); const board = await store.read();
  assert.deepEqual(board.tasks.filter(t => t.ready).map(t => t.id), ['PV-01']);
  assert.ok(board.tasks.every(t => t.status === 'pending')); assert.equal(board.history.length, 0);
});
test('cerrar requiere evidencia y dependencias completas', async t => {
  const { store } = await setup(t); const board = await store.read();
  await assert.rejects(store.update('PV-01', change(board, 'done')), /evidencia/);
  await assert.rejects(store.update('PV-02', change(board, 'done', { evidence: 'Prueba sintética.' })), /dependencias/);
  assert.equal((await store.read()).history.length, 0);
});
test('persistencia, historial y reapertura mantienen coherencia tras reiniciar', async t => {
  const { store, planPath, statePath } = await setup(t);
  let board = await store.read();
  board = await store.update('PV-01', change(board, 'done', { owner: ' QA ', evidence: 'Baseline validado en fixture.' }));
  assert.equal(board.tasks[0].owner, 'QA'); assert.equal(board.tasks[1].ready, true);
  board = await store.update('PV-02', change(board, 'done', { evidence: 'Modos probados en fixture.' }));
  await assert.rejects(store.update('PV-01', change(board, 'pending')), /Reabrí primero/);
  const rebooted = await createStore({ planPath, statePath }).read();
  assert.equal(rebooted.tasks[1].status, 'done'); assert.equal(rebooted.history.length, 2);
  assert.equal(rebooted.history[1].taskId, 'PV-02');
});
test('dos ediciones simultáneas no se pisan y cambios del plan invalidan la ficha', async t => {
  const { store, planPath } = await setup(t); const board = await store.read();
  const results = await Promise.allSettled([
    store.update('PV-01', change(board, 'in_progress', { notes: 'Primera edición' })),
    store.update('PV-01', change(board, 'blocked', { notes: 'Segunda edición' })),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  const newer = await store.read();
  await writeFile(planPath, fixture.replace('Verificar baseline', 'Nuevo criterio de aceptación'));
  await assert.rejects(store.update('PV-01', change(newer, 'review')), e => e.status === 409);
});
test('el archivo corrupto no se sobrescribe y un cierre manual sin evidencia falla', async t => {
  const { store, statePath } = await setup(t);
  await writeFile(statePath, '{ roto');
  await assert.rejects(store.read()); assert.equal(await readFile(statePath, 'utf8'), '{ roto');
  const state = emptyState(); state.tasks['PV-01'] = { status: 'done', owner: '', notes: '', evidence: '' };
  await writeFile(statePath, JSON.stringify(state));
  await assert.rejects(store.read(), /Falta evidencia/);
});
test('HTTP valida origen, conflictos y sirve sólo recursos permitidos', async t => {
  const { planPath, statePath } = await setup(t);
  const server = createDashboardServer({ planPath, statePath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const board = await (await fetch(`${base}/api/board`)).json();
  const input = JSON.stringify(change(board, 'in_progress', { notes: 'Prueba HTTP' }));
  const request = origin => fetch(`${base}/api/tasks/PV-01`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: origin }, body: input });
  assert.equal((await request('https://example.com')).status, 403);
  assert.equal((await request(base)).status, 200);
  assert.equal((await request(base)).status, 409);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  const invalidHost = await new Promise((resolve, reject) => {
    const req = httpRequest(`${base}/api/board`, { headers: { Host: 'example.com' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(invalidHost, 403);
  const page = await fetch(base); assert.equal(page.status, 200); assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(await page.text(), /Plan V/);
});
