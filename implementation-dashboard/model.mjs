import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { milestones, titles, findingTasks, coverage, documents, statuses } from './catalog.mjs';

export class BoardError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function parseDependencies(value) {
  if (/^[—–-]$/.test(value.trim())) return [];
  const result = [];
  for (const part of value.split(',')) {
    const match = part.trim().match(/^(?:PV-)?(\d{1,2})(?:[–…-](\d{1,2}))?$/);
    if (!match) throw new Error(`Dependencia no reconocida: ${part}`);
    const start = Number(match[1]), end = Number(match[2] ?? start);
    if (start < 1 || end < start || end > 99) throw new Error('Rango de dependencias inválido');
    for (let i = start; i <= end; i++) result.push(`PV-${String(i).padStart(2, '0')}`);
  }
  return [...new Set(result)];
}

export function parsePlan(markdown) {
  const rows = markdown.split(/\r?\n/).filter(line => /^\| PV-\d{2} \|/.test(line));
  const tasks = rows.map(line => {
    const [id, sizing, acceptance, dependencies, roles] = line.split('|').slice(1, -1).map(s => s.trim());
    const [priority, size] = sizing.split('/').map(s => s.trim());
    const milestone = milestones.find(m => m.tasks.includes(id))?.id;
    if (!milestone || !/^P[012]$/.test(priority) || !/^[SML]$/.test(size)) throw new Error(`Metadatos inválidos: ${id}`);
    return { id, title: titles[Number(id.slice(3)) - 1], acceptance, priority, size, roles, milestone, dependencies: parseDependencies(dependencies) };
  });
  if (!tasks.length || new Set(tasks.map(t => t.id)).size !== tasks.length) throw new Error('Backlog vacío o IDs duplicados');
  const byId = new Map(tasks.map(t => [t.id, t]));
  const visited = new Set(), visiting = new Set();
  const visit = id => {
    if (visiting.has(id)) throw new Error(`Ciclo de dependencias: ${id}`);
    if (visited.has(id)) return;
    const task = byId.get(id);
    if (!task) throw new Error(`Dependencia inexistente: ${id}`);
    visiting.add(id); task.dependencies.forEach(visit); visiting.delete(id); visited.add(id);
  };
  tasks.forEach(t => visit(t.id));
  const findings = markdown.split(/\r?\n/).filter(line => /^\| A-\d{2} \|/.test(line)).map(line => {
    const [id, severity, evidence, consequence] = line.split('|').slice(1, -1).map(s => s.trim());
    return { id, severity, evidence, consequence, tasks: findingTasks[id] ?? [] };
  });
  return { tasks, findings };
}

export const emptyState = () => ({ schemaVersion: 1, tasks: {}, history: [] });

export function validateState(state) {
  if (state?.schemaVersion !== 1 || !state.tasks || Array.isArray(state.tasks) || typeof state.tasks !== 'object' || !Array.isArray(state.history)) throw new Error('Archivo de seguimiento inválido. No se sobrescribió.');
  if (state.audit && (typeof state.audit.reviewedAt !== 'string' || Number.isNaN(Date.parse(state.audit.reviewedAt)) || typeof state.audit.commit !== 'string' || typeof state.audit.summary !== 'string' || !Array.isArray(state.audit.checks) || state.audit.checks.some(check => !check || typeof check.label !== 'string' || typeof check.result !== 'string' || !['passed', 'failed', 'skipped'].includes(check.status)))) throw new Error('Datos de revisión inválidos.');
  for (const [id, entry] of Object.entries(state.tasks)) {
    if (!/^PV-\d{2}$/.test(id) || !entry || !Object.hasOwn(statuses, entry.status) || ['owner', 'notes', 'evidence'].some(k => typeof entry[k] !== 'string')) throw new Error(`Estado inválido en ${id}. No se sobrescribió.`);
    if (entry.status === 'done' && !entry.evidence.trim()) throw new Error(`Falta evidencia de cierre en ${id}`);
    if (Object.keys(entry).some(key => !['status', 'owner', 'notes', 'evidence', 'updatedAt'].includes(key))) throw new Error(`Campo de seguimiento desconocido en ${id}`);
  }
  for (const entry of state.history) {
    if (!entry || typeof entry.taskId !== 'string' || !/^PV-\d{2}$/.test(entry.taskId) || !Object.hasOwn(statuses, entry.from) || !Object.hasOwn(statuses, entry.to) || !Array.isArray(entry.fields) || entry.fields.some(key => !['status', 'owner', 'notes', 'evidence'].includes(key)) || typeof entry.at !== 'string' || Number.isNaN(Date.parse(entry.at))) throw new Error('Registro de actividad inválido.');
  }
}

export function createStore({ planPath, statePath }) {
  let queue = Promise.resolve();
  async function read() {
    const markdown = await readFile(planPath, 'utf8');
    let raw;
    try { raw = await readFile(statePath, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; raw = JSON.stringify(emptyState()); }
    const state = JSON.parse(raw.replace(/^\uFEFF/, ''));
    validateState(state);
    const plan = parsePlan(markdown);
    for (const id of Object.keys(state.tasks)) if (!plan.tasks.some(t => t.id === id)) throw new Error(`El plan ya no contiene ${id}; reconciliá el seguimiento antes de continuar.`);
    const tasks = plan.tasks.map(t => ({ ...t, status: 'pending', owner: '', notes: '', evidence: '', updatedAt: null, ...state.tasks[t.id] }));
    for (const task of tasks) {
      task.waitingFor = task.dependencies.filter(id => tasks.find(t => t.id === id)?.status !== 'done');
      task.ready = task.status === 'pending' && !task.waitingFor.length;
      if (task.status === 'done' && task.waitingFor.length) throw new Error(`${task.id} figura completa con dependencias pendientes. Revisá el archivo de seguimiento.`);
    }
    const revision = createHash('sha256').update(markdown).update(raw).digest('hex');
    return { state, board: { revision, tasks, findings: plan.findings, milestones, coverage, documents, statuses, history: state.history, audit: state.audit ?? null, source: 'docs/plan-de-accion-2026-09-16.md', planDate: '2026-09-16', readAt: new Date().toISOString() } };
  }
  async function patch(id, input) {
    if (!input || typeof input !== 'object' || !Object.hasOwn(statuses, input.status)) throw new BoardError('Elegí un estado válido.');
    for (const [key, max] of [['owner', 120], ['notes', 8000], ['evidence', 8000]]) {
      if (typeof input[key] !== 'string' || input[key].length > max) throw new BoardError(`${key}: texto requerido (máximo ${max} caracteres).`);
    }
    const { state, board } = await read();
    if (input.revision !== board.revision) throw new BoardError('El tablero cambió. Recargá los datos de la ficha y revisá tus cambios antes de guardar.', 409);
    const task = board.tasks.find(t => t.id === id);
    if (!task) throw new BoardError('Entrega inexistente.', 404);
    if (input.status === 'done') {
      if (!input.evidence.trim()) throw new BoardError('Agregá evidencia de verificación antes de completar la entrega.');
      if (task.waitingFor.length) throw new BoardError(`Primero completá las dependencias: ${task.waitingFor.join(', ')}.`);
    }
    if (task.status === 'done' && input.status !== 'done') {
      const dependents = board.tasks.filter(t => t.status === 'done' && t.dependencies.includes(id));
      if (dependents.length) throw new BoardError(`Reabrí primero las entregas que dependen de esta: ${dependents.map(t => t.id).join(', ')}.`);
    }
    const next = { status: input.status, owner: input.owner.trim(), notes: input.notes.trim(), evidence: input.evidence.trim(), updatedAt: new Date().toISOString() };
    if (['status', 'owner', 'notes', 'evidence'].every(k => next[k] === task[k])) return board;
    state.tasks[id] = next;
    state.history.push({ id: randomUUID(), taskId: id, at: next.updatedAt, from: task.status, to: next.status, fields: ['status', 'owner', 'notes', 'evidence'].filter(k => next[k] !== task[k]) });
    await mkdir(dirname(statePath), { recursive: true });
    const temporaryPath = `${statePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(temporaryPath, statePath);
    return (await read()).board;
  }
  return { read: async () => (await read()).board, update(id, input) { const result = queue.then(() => patch(id, input)); queue = result.catch(() => {}); return result; } };
}
