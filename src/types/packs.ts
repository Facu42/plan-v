// Paquetes de consultas: la nutricionista vende N consultas a una paciente y Plan V lleva cuántas le quedan.
export type PackUse = { id: string; used_on: string; note: string; appointment_id: string | null; created_at: string };
export type PatientPack = {
  id: string; name: string; sessions: number; amount: number; charge_id: string | null;
  starts_on: string; expires_on: string | null; closed_at: string | null; created_at: string; uses: PackUse[];
};
export type PackSaleInput = { name: string; sessions: number; amount: number; starts_on: string; valid_days: number | null; charge: boolean };
export type PackUseInput = { pack_id?: string | null; used_on: string; note?: string };
export type PackStatus = 'activo' | 'terminado' | 'vencido' | 'baja';

/** Estado del paquete en una fecha (AAAA-MM-DD). */
export function packStatus(pack: PatientPack, today: string): PackStatus {
  if (pack.closed_at) return 'baja';
  if (pack.uses.length >= pack.sessions) return 'terminado';
  if (pack.expires_on && pack.expires_on < today) return 'vencido';
  return 'activo';
}

export const packLeft = (pack: PatientPack) => Math.max(0, pack.sessions - pack.uses.length);

/** El paquete que se muestra primero: el vigente más viejo con lugar; si no hay, el último vendido. */
export function currentPack(packs: readonly PatientPack[], today: string): PatientPack | null {
  const activos = packs.filter(p => packStatus(p, today) === 'activo').sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.created_at.localeCompare(b.created_at));
  return activos[0] ?? [...packs].sort((a, b) => b.starts_on.localeCompare(a.starts_on) || b.created_at.localeCompare(a.created_at))[0] ?? null;
}

/** Lo que ve la paciente de su paquete: sin precio ni notas de la nutricionista. */
export type OwnPack = { id: string; name: string; sessions: number; used: number; starts_on: string; expires_on: string | null; closed: boolean };

/** El paquete que se le muestra a la paciente: el vigente más viejo con consultas; si no hay, ninguno. */
export function ownCurrentPack(packs: readonly OwnPack[], today: string): OwnPack | null {
  return [...packs]
    .filter(p => !p.closed && p.used < p.sessions && (!p.expires_on || p.expires_on >= today))
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0] ?? null;
}
