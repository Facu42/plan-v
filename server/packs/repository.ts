// Paquetes de consultas: la nutricionista vende N consultas y se van descontando
// (solas al marcar una consulta realizada, o a mano desde la ficha).
import { randomUUID } from 'node:crypto';
import { registerDemoState } from '../demo/state.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { localBillingDate } from '../../src/billing.js';
import { addCharge } from '../fees/repository.js';
import { packLeft, type OwnPack, type PackSaleInput, type PackUse, type PackUseInput, type PatientPack } from '../../src/types/packs.js';

export { CareError } from '../care/errors.js';

const PACK_EMPTY = 'No hay un paquete vigente con consultas disponibles.';

export function packsDbError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Los paquetes de consultas requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT409') throw new CareError(409, PACK_EMPTY);
  if (error.code === 'P0002') throw new CareError(404, 'Ese paquete o esa consulta ya no están.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá el nombre, las consultas, el precio y la fecha.');
  throw new CareError(503, 'No se pudo guardar. Reintentá en un momento.');
}

async function call(name: string, args: Record<string, unknown>): Promise<PatientPack[]> {
  const { data, error } = await getRequestDb().rpc(name, args);
  packsDbError(error);
  return asPacks(data);
}

function asPacks(data: unknown): PatientPack[] {
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    sessions: Number(row.sessions),
    amount: Number(row.amount),
    charge_id: row.charge_id ? String(row.charge_id) : null,
    starts_on: String(row.starts_on),
    expires_on: row.expires_on ? String(row.expires_on) : null,
    closed_at: row.closed_at ? String(row.closed_at) : null,
    created_at: String(row.created_at),
    uses: ((row.uses as Record<string, unknown>[] | null) ?? []).map((use) => ({
      id: String(use.id),
      used_on: String(use.used_on),
      note: String(use.note ?? ''),
      appointment_id: use.appointment_id ? String(use.appointment_id) : null,
      created_at: String(use.created_at),
    })),
  }));
}

// ---------- Modo demo (memoria) ----------

type MemoryUse = PackUse & { voided: boolean };
type MemoryPack = Omit<PatientPack, 'uses'> & { patient_id: string; uses: MemoryUse[] };
const packs = new Map<string, MemoryPack>();

function shiftDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localBillingDate(date);
}

function view(pack: MemoryPack): PatientPack {
  const { patient_id: _patient, ...rest } = pack;
  return { ...rest, uses: pack.uses.filter((use) => !use.voided).map(({ voided: _voided, ...use }) => use) };
}

function memoryList(patientId: string): PatientPack[] {
  return [...packs.values()].filter((pack) => pack.patient_id === patientId)
    .sort((a, b) => b.starts_on.localeCompare(a.starts_on) || b.created_at.localeCompare(a.created_at))
    .map(view);
}

function memoryPatient(patientId: string) {
  if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrada.');
}

function openFor(patientId: string, day: string): MemoryPack | undefined {
  return [...packs.values()]
    .filter((pack) => pack.patient_id === patientId && !pack.closed_at && (!pack.expires_on || pack.expires_on >= day) && packLeft(view(pack)) > 0)
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.created_at.localeCompare(b.created_at))[0];
}

function addUse(pack: MemoryPack, used_on: string, note: string, appointment_id: string | null) {
  pack.uses.push({ id: randomUUID(), used_on, note, appointment_id, created_at: new Date().toISOString(), voided: false });
  pack.uses.sort((a, b) => a.used_on.localeCompare(b.used_on) || a.created_at.localeCompare(b.created_at));
}

function packOf(packId: string): MemoryPack {
  const pack = packs.get(packId);
  if (!pack) throw new CareError(404, 'Ese paquete o esa consulta ya no están.');
  return pack;
}

// ---------- API común ----------

export async function listPacks(patientId: string, persistent: boolean): Promise<PatientPack[]> {
  if (persistent) return call('get_patient_packs', { target: patientId });
  memoryPatient(patientId);
  return memoryList(patientId);
}

/** La paciente ve su propio paquete: nombre, total, usadas y fechas (sin precio ni notas). */
export async function listOwnPacks(patientId: string, persistent: boolean): Promise<OwnPack[]> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('get_my_patient_packs', { target: patientId });
    packsDbError(error);
    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
      id: String(row.id), name: String(row.name), sessions: Number(row.sessions), used: Number(row.used),
      starts_on: String(row.starts_on), expires_on: row.expires_on ? String(row.expires_on) : null, closed: Boolean(row.closed),
    }));
  }
  memoryPatient(patientId);
  return memoryList(patientId).map((pack) => ({
    id: pack.id, name: pack.name, sessions: pack.sessions, used: pack.uses.length,
    starts_on: pack.starts_on, expires_on: pack.expires_on, closed: Boolean(pack.closed_at),
  }));
}

export async function sellPack(patientId: string, input: PackSaleInput, persistent: boolean): Promise<PatientPack[]> {
  const today = localBillingDate();
  if (input.starts_on < shiftDays(today, -365) || input.starts_on > shiftDays(today, 365) || (input.charge && input.amount < 1)) {
    throw new CareError(400, 'Revisá el nombre, las consultas, el precio y la fecha.');
  }
  if (persistent) {
    return call('sell_patient_pack', {
      target: patientId, pack_name: input.name, sessions: input.sessions, amount: input.amount,
      starts_on: input.starts_on, valid_days: input.valid_days, charge: input.charge,
    });
  }
  memoryPatient(patientId);
  const name = input.name.trim();
  let charge_id: string | null = null;
  if (input.charge) {
    const ledger = await addCharge(patientId, { amount: input.amount, due_on: input.starts_on, concept: `Paquete: ${name}`.slice(0, 80) }, false);
    charge_id = ledger.charges[ledger.charges.length - 1]?.id ?? null;
  }
  const id = randomUUID();
  packs.set(id, {
    id, patient_id: patientId, name, sessions: input.sessions, amount: input.amount, charge_id,
    starts_on: input.starts_on, expires_on: input.valid_days ? shiftDays(input.starts_on, input.valid_days) : null,
    closed_at: null, created_at: new Date().toISOString(), uses: [],
  });
  return memoryList(patientId);
}

export async function usePack(patientId: string, input: PackUseInput, persistent: boolean): Promise<PatientPack[]> {
  const today = localBillingDate();
  if (input.used_on < shiftDays(today, -365) || input.used_on > shiftDays(today, 1)) throw new CareError(400, 'Revisá la fecha de la consulta.');
  if (persistent) return call('use_patient_pack', { target: patientId, pack_id: input.pack_id ?? null, used_on: input.used_on, note: input.note ?? '' });
  memoryPatient(patientId);
  const pack = input.pack_id ? packs.get(input.pack_id) : openFor(patientId, input.used_on);
  if (!pack || pack.patient_id !== patientId || pack.closed_at || (pack.expires_on && pack.expires_on < input.used_on) || packLeft(view(pack)) < 1) {
    throw new CareError(409, PACK_EMPTY);
  }
  addUse(pack, input.used_on, (input.note ?? '').trim(), null);
  return memoryList(patientId);
}

export async function voidUse(useId: string, persistent: boolean): Promise<PatientPack[]> {
  if (persistent) return call('void_patient_pack_use', { use_id: useId });
  const pack = [...packs.values()].find((p) => p.uses.some((use) => use.id === useId && !use.voided));
  if (!pack) throw new CareError(404, 'Ese paquete o esa consulta ya no están.');
  pack.uses.find((use) => use.id === useId)!.voided = true;
  return memoryList(pack.patient_id);
}

export async function closePack(packId: string, persistent: boolean): Promise<PatientPack[]> {
  if (persistent) return call('close_patient_pack', { pack_id: packId });
  const pack = packOf(packId);
  if (pack.closed_at) throw new CareError(404, 'Ese paquete o esa consulta ya no están.');
  pack.closed_at = new Date().toISOString();
  return memoryList(pack.patient_id);
}

/** El dueño del paquete en modo demo (para revisar permisos antes de tocarlo). */
export function memoryPackPatient(packId: string): string | null {
  return packs.get(packId)?.patient_id ?? null;
}
export function memoryUsePatient(useId: string): string | null {
  return [...packs.values()].find((p) => p.uses.some((use) => use.id === useId))?.patient_id ?? null;
}

/** Consulta realizada: marcada descuenta una del paquete vigente (si hay); desmarcada la devuelve. */
export async function syncAppointment(patientId: string, appointmentId: string, completed: boolean, startsAt: string, persistent: boolean): Promise<void> {
  if (persistent) {
    const { error } = await getRequestDb().rpc('pack_sync_appointment', { target: patientId, appointment: appointmentId, completed });
    packsDbError(error);
    return;
  }
  const mine = [...packs.values()].filter((pack) => pack.patient_id === patientId);
  const used = mine.flatMap((pack) => pack.uses).filter((use) => use.appointment_id === appointmentId && !use.voided);
  if (!completed) { used.forEach((use) => { use.voided = true; }); return; }
  if (used.length) return;
  const day = localBillingDate(new Date(startsAt));
  const pack = openFor(patientId, day);
  if (pack) addUse(pack, day, 'Consulta realizada', appointmentId);
}

registerDemoState('packs/repository', () => ({ packs }));

/** Demo: Sofía tiene un paquete de 3 seguimientos con una consulta ya usada. */
function seedDemo() {
  const today = localBillingDate();
  const id = randomUUID();
  const starts_on = shiftDays(today, -20);
  packs.set(id, {
    id, patient_id: 'pat-sofia', name: 'Paquete de 3 seguimientos', sessions: 3, amount: 81000, charge_id: null,
    starts_on, expires_on: shiftDays(starts_on, 90), closed_at: null, created_at: new Date(`${starts_on}T12:00:00`).toISOString(),
    uses: [{ id: randomUUID(), used_on: shiftDays(today, -6), note: 'Seguimiento', appointment_id: null, created_at: new Date(`${shiftDays(today, -6)}T12:00:00`).toISOString(), voided: false }],
  });
}

export function resetPacksMemory() {
  packs.clear();
  seedDemo();
}
seedDemo();
