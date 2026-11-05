// Sedes del consultorio. Cada «agenda» de la configuración de turnos es una sede:
// tiene nombre y, si la nutri lo carga, dirección y modalidad (presencial u online).
// Los turnos de la página pública ya traen su sede; los que carga la nutri la guardan aparte.
import type { SchedulingSettings } from '../types/scheduling';

export type Sede = SchedulingSettings['calendars'][number];
export type SedeModalidad = NonNullable<Sede['modality']>;

export const MAX_SEDES = 10;
export const MODALIDADES: ReadonlyArray<readonly [SedeModalidad, string]> = [['presencial', 'Presencial'], ['online', 'Online']];

/** Nombre de la sede para mostrar; si no existe (se borró), «Sin sede». */
export function nombreDeSede(sedes: readonly Sede[], id: string | null | undefined): string {
  return sedes.find(s => s.id === id)?.name ?? 'Sin sede';
}

/** Sede de un turno: la elegida si sigue existiendo; si no, la primera (la sede principal). */
export function sedeDelTurno(sedes: readonly Sede[], id: string | null | undefined): string | null {
  if (!sedes.length) return null;
  return sedes.some(s => s.id === id) ? id as string : sedes[0].id;
}

/** Texto corto debajo del nombre: «Presencial · Av. Siempreviva 742». */
export function detalleDeSede(sede: Pick<Sede, 'address' | 'modality'>): string {
  const partes = [sede.modality === 'online' ? 'Online' : sede.modality === 'presencial' ? 'Presencial' : '', sede.address?.trim() ?? ''].filter(Boolean);
  return partes.join(' · ');
}

export function nuevaSede(numero: number, id: string = crypto.randomUUID()): Sede {
  return { id, name: `Sede ${numero}`, address: '', modality: 'presencial' };
}

/**
 * Quita una sede sin dejar nada colgado: los tipos de consulta, los horarios y los bloqueos que
 * eran de esa sede pasan a la primera que queda. Nunca deja el consultorio sin sedes.
 */
export function quitarSede(config: SchedulingSettings, id: string): SchedulingSettings {
  const restantes = config.calendars.filter(s => s.id !== id);
  if (!restantes.length || restantes.length === config.calendars.length) return config;
  const destino = restantes[0].id;
  const mover = <T extends { calendar_id: string }>(fila: T): T => fila.calendar_id === id ? { ...fila, calendar_id: destino } : fila;
  return { ...config, calendars: restantes, types: config.types.map(mover), weekly: config.weekly.map(mover), blocks: config.blocks.map(mover) };
}

export function cambiarSede(config: SchedulingSettings, id: string, cambio: Partial<Omit<Sede, 'id'>>): SchedulingSettings {
  return { ...config, calendars: config.calendars.map(s => s.id === id ? { ...s, ...cambio } : s) };
}

export function agregarSede(config: SchedulingSettings, id?: string): SchedulingSettings {
  if (config.calendars.length >= MAX_SEDES) return config;
  return { ...config, calendars: [...config.calendars, nuevaSede(config.calendars.length + 1, id)] };
}
