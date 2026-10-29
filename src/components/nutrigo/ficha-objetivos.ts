// Solapa Objetivos y hábitos de la Ficha v29: lo que la paciente registra en su app, resumido por semana y por quincena.
import type { Patient } from '../../types';
import { SYMPTOMS } from '../../types/symptoms';
import { waterGoalOf } from '../../types/water';
import { getGoalSnapshot, GOAL_STATUS_LABELS } from '../crm/crm-goals';
import { numero } from './ficha-presentacion';

const DIA = 86_400_000;
const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
/** Referencia general de sueño para un adulto; Nutridash no guarda una meta de sueño por paciente. */
export const HORAS_DE_SUENO_DE_REFERENCIA = 7;
const NIVEL_DE_ENERGIA: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };
const ETIQUETA_DE_ENERGIA: Record<string, string> = { Alta: 'Alta', Media: 'Normal', Baja: 'Baja' };

/** Los últimos `cuantos` días terminando en `hoy`, del más viejo al más nuevo. */
export function ultimosDias(hoy: string, cuantos: number) {
  const base = Date.parse(`${hoy}T12:00:00Z`);
  return Array.from({ length: cuantos }, (_, i) => new Date(base - (cuantos - 1 - i) * DIA).toISOString().slice(0, 10));
}
export const inicialDelDia = (fecha: string) => INICIALES[new Date(`${fecha}T12:00:00Z`).getUTCDay()]!;

export function objetivoDe(patient: Patient) {
  const meta = getGoalSnapshot(patient);
  return { titulo: patient.goal?.trim() || '', pct: Math.max(0, Math.min(100, Math.round(meta.progress))), estado: GOAL_STATUS_LABELS[meta.status], historial: meta.history };
}

export type HabitoDeLaSemana = { clave: string; nombre: string; valor: string; unidad: string; meta: string; pct: number | null; serie: number[]; alerta: boolean };
const redondear = (n: number, decimales = 1) => Math.round(n * 10 ** decimales) / 10 ** decimales;
const promedio = (valores: readonly number[]) => valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
const tope = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Agua, sueño, actividad y energía de los últimos siete días; sin registro dicen «—», nunca cero inventado. */
export function habitosDeLaSemana(patient: Patient, diasConActividad: ReadonlySet<string>, hoy: string, puedeVerActividad: boolean): HabitoDeLaSemana[] {
  const dias = ultimosDias(hoy, 7);
  const registros = new Map(patient.habit_logs.filter(h => h.patient_id === patient.id).map(h => [h.date, h]));
  const vasos = dias.map(d => registros.get(d)?.hydration ?? 0);
  const conAgua = dias.map(d => registros.get(d)).filter(h => h && (h.hydration > 0 || h.hydration_declared)).map(h => h!.hydration);
  const meta = waterGoalOf(patient);
  const horas = dias.map(d => (registros.get(d)?.sleep_minutes ?? null) === null ? 0 : registros.get(d)!.sleep_minutes! / 60);
  const horasRegistradas = horas.filter(h => h > 0);
  const energia = dias.map(d => NIVEL_DE_ENERGIA[registros.get(d)?.energy ?? ''] ?? 0);
  const energiaRegistrada = energia.filter(n => n > 0);
  const ultimaEnergia = [...dias].reverse().map(d => registros.get(d)?.energy ?? null).find(Boolean) ?? null;
  const actividad: number[] = dias.map(d => diasConActividad.has(d) ? 1 : 0);
  const diasActivos = actividad.reduce((a, b) => a + b, 0);
  const aguaMedia = promedio(conAgua), suenoMedio = promedio(horasRegistradas), energiaMedia = promedio(energiaRegistrada);
  return [
    { clave: 'agua', nombre: 'Agua', valor: aguaMedia === null ? '—' : numero(redondear(aguaMedia)), unidad: 'vasos/día', meta: `meta ${meta} vasos`, pct: aguaMedia === null ? null : tope(aguaMedia / meta * 100), serie: vasos, alerta: aguaMedia !== null && aguaMedia / meta < 0.8 },
    { clave: 'sueno', nombre: 'Sueño', valor: suenoMedio === null ? '—' : numero(redondear(suenoMedio)), unidad: 'h', meta: `referencia ${HORAS_DE_SUENO_DE_REFERENCIA} h`, pct: suenoMedio === null ? null : tope(suenoMedio / HORAS_DE_SUENO_DE_REFERENCIA * 100), serie: horas, alerta: suenoMedio !== null && suenoMedio / HORAS_DE_SUENO_DE_REFERENCIA < 0.8 },
    { clave: 'actividad', nombre: 'Actividad', valor: puedeVerActividad ? String(diasActivos) : '—', unidad: 'días', meta: puedeVerActividad ? 'de los últimos 7' : 'permiso de atención pendiente', pct: puedeVerActividad ? tope(diasActivos / 7 * 100) : null, serie: actividad, alerta: false },
    { clave: 'energia', nombre: 'Energía', valor: ultimaEnergia ? (ETIQUETA_DE_ENERGIA[ultimaEnergia] ?? ultimaEnergia) : '—', unidad: '', meta: energiaMedia === null ? 'sin registro' : `${energiaRegistrada.length} de 7 días registrados`, pct: energiaMedia === null ? null : tope(energiaMedia / 3 * 100), serie: energia, alerta: energiaMedia !== null && energiaMedia < 2 },
  ];
}

/** La energía de los últimos 14 días como columnas (3 con energía, 2 normal, 1 sin energía); sin registro, columna vacía. */
export function animoDeQuincena(patient: Patient, hoy: string) {
  const dias = ultimosDias(hoy, 14);
  const registros = new Map(patient.habit_logs.filter(h => h.patient_id === patient.id).map(h => [h.date, h]));
  const valores = dias.map(d => NIVEL_DE_ENERGIA[registros.get(d)?.energy ?? ''] ?? 0);
  const registrados = valores.filter(v => v > 0);
  return { valores, rotulos: dias.map(inicialDelDia), promedio: registrados.length ? redondear(registrados.reduce((a, b) => a + b, 0) / registrados.length) : null, registrados: registrados.length };
}

export type SintomaDeQuincena = { clave: string; nombre: string; dias: boolean[]; cantidad: number };
/** Cada síntoma que la paciente marcó en los últimos 14 días, del más repetido al menos. */
export function sintomasDeQuincena(patient: Patient, hoy: string): SintomaDeQuincena[] {
  const dias = ultimosDias(hoy, 14);
  const registros = new Map(patient.habit_logs.filter(h => h.patient_id === patient.id).map(h => [h.date, h]));
  return SYMPTOMS.map(({ key, label }) => { const marcados = dias.map(d => registros.get(d)?.symptoms?.includes(key) ?? false); return { clave: key, nombre: label, dias: marcados, cantidad: marcados.filter(Boolean).length }; })
    .filter(s => s.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad);
}

export const textoDeDias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;
