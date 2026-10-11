import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deserialize, serialize } from 'node:v8';
import type { RuntimeConfig } from '../config/runtime.js';

type Group = Record<string, unknown>;
type Registry = Map<string, () => Group>;
const registry: Registry = new Map();
let active: DemoStateFile | undefined;

/** Los getters siguen funcionando después de los resets usados por las pruebas. */
export function registerDemoState(domain: string, read: () => Group) { registry.set(domain, read); }

function kind(value: unknown): string {
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  if (Array.isArray(value)) return 'array';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) return 'object';
  throw new Error('Estado de demostración inválido');
}
function keys(value: Group) { return Object.keys(value).sort().join('\n'); }

/** Sólo se activa expresamente en el servidor local de demostración. */
export class DemoStateFile {
  private readonly file: string;
  private readonly lock: string;
  private closed = false;
  constructor(file: string, config: RuntimeConfig, private readonly domains: Registry = registry) {
    if (config.mode !== 'demo' || config.dataMode !== 'memory') throw new Error('El guardado local sólo está permitido en la demostración');
    this.file = resolve(file); this.lock = this.file + '.lock';
    mkdirSync(dirname(this.file), { recursive: true });
    if (existsSync(this.lock)) {
      const { pid } = JSON.parse(readFileSync(this.lock, 'utf8')) as { pid: number };
      if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Bloqueo de demostración inválido');
      let alive = true;
      try { process.kill(pid, 0); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ESRCH') alive = false; else throw error; }
      if (alive) throw new Error('Otra demostración ya está usando estos datos');
      unlinkSync(this.lock);
    }
    writeFileSync(this.lock, JSON.stringify({ pid: process.pid }), { flag: 'wx', mode: 0o600 });
    try { this.restore(); } catch (error) { this.release(); throw error; }
  }
  private restore() {
    if (!existsSync(this.file)) return;
    const saved = deserialize(readFileSync(this.file)) as { version?: number; domains?: Record<string, Group> };
    if (saved?.version !== 1 || !saved.domains || Object.getPrototypeOf(saved.domains) !== Object.prototype) throw new Error('Copia local incompatible o dañada; se conservó el archivo');
    const current = Object.fromEntries([...this.domains].map(([name, read]) => [name, read()]));
    // Ampliación v1 conocida: el catálogo de modelos inicia vacío. No admitir
    // otros dominios faltantes ni modificar el archivo antes de validar todo.
    if (current.models?.models instanceof Map && !Object.prototype.hasOwnProperty.call(saved.domains, 'models')) {
      saved.domains.models = { models: new Map() };
    }
    if (keys(current) !== keys(saved.domains)) throw new Error('La copia local tiene dominios diferentes; se conservó el archivo');
    // Validar todo antes de restaurar para no dejar un estado parcial.
    for (const [name, values] of Object.entries(current)) {
      const other = saved.domains[name];
      // Única ampliación conocida del formato v1: favoritos profesionales.
      // La copia previa queda intacta hasta completar todas las validaciones.
      if (name === 'recipes/repository' && values.professionalFavorites instanceof Map && other &&
        Object.getPrototypeOf(other) === Object.prototype && !Object.prototype.hasOwnProperty.call(other, 'professionalFavorites')) {
        const { professionalFavorites: _favorites, ...previousShape } = values;
        if (keys(previousShape) === keys(other)) other.professionalFavorites = new Map();
      }
      if (!other || Object.getPrototypeOf(other) !== Object.prototype || keys(values) !== keys(other)) throw new Error('Copia local incompleta');
      for (const key of Object.keys(values)) if (kind(values[key]) !== kind(other[key])) throw new Error('Copia local inválida');
    }
    for (const [name, values] of Object.entries(current)) for (const [key, target] of Object.entries(values)) {
      const value = saved.domains[name]![key];
      if (target instanceof Map && value instanceof Map) { target.clear(); for (const [k,v] of value) target.set(k,v); }
      else if (target instanceof Set && value instanceof Set) { target.clear(); for (const v of value) target.add(v); }
      else if (Array.isArray(target) && Array.isArray(value)) { target.length = 0; for (const v of value) target.push(v); }
      else { const object = target as Group; for (const k of Object.keys(object)) delete object[k]; Object.assign(object, value); }
    }
  }
  save() {
    if (this.closed) throw new Error('La demostración está cerrada');
    const data = serialize({ version: 1, domains: Object.fromEntries([...this.domains].map(([name, read]) => [name, read()])) });
    const temporary = this.file + '.' + process.pid + '.tmp';
    // Síncrono: ninguna escritura puede adelantar a otra dentro de este proceso.
    try {
      writeFileSync(temporary, data, { mode: 0o600 });
      for (let attempt=0;;attempt++) {
        try { renameSync(temporary, this.file); break; }
        catch (error) {
          if (attempt>=5 || !['EPERM','EBUSY','EACCES'].includes((error as NodeJS.ErrnoException).code??'')) throw error;
          // Un escáner de Windows puede retener el archivo brevemente. La copia
          // anterior permanece intacta y los intentos no reejecutan la acción.
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50);
        }
      }
    }
    finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }
  private release() { if (!this.closed) { this.closed = true; unlinkSync(this.lock); } }
  close() { if (!this.closed) { try { this.save(); } finally { this.release(); } } }
}

export function startDemoState(file: string | undefined, config: RuntimeConfig) {
  if (!file) return undefined;
  active = new DemoStateFile(file, config);
  return active;
}
export function persistDemoState() { active?.save(); }
