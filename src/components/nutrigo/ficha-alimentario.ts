// Solapa Registro alimentario de la Ficha v29: lo que la paciente cargó, resumido por día y por comida.
import type { MealLog } from '../../types';
import { homeDay } from '../../lib/panel-home';
import { ultimosDias } from './ficha-objetivos';

const diaDe = (log: MealLog) => homeDay(new Date(log.logged_at));
const conCalorias = (logs: readonly MealLog[]) => logs.filter(log => log.macros);

/** Calorías estimadas de cada uno de los últimos siete días; un día sin estimaciones queda en cero. */
export function caloriasPorDia(logs: readonly MealLog[], hoy: string) {
  const dias = ultimosDias(hoy, 7);
  const porDia = new Map<string, number>();
  for (const log of conCalorias(logs)) porDia.set(diaDe(log), (porDia.get(diaDe(log)) ?? 0) + log.macros!.kcal);
  const valores = dias.map(d => Math.round(porDia.get(d) ?? 0));
  const registrados = valores.filter(v => v > 0);
  return { dias, valores, promedio: registrados.length ? Math.round(registrados.reduce((a, b) => a + b, 0) / registrados.length) : null };
}

/** Promedio por día registrado de calorías y macros; sin ninguna estimación devuelve null. */
export function promedioDeMacros(logs: readonly MealLog[]) {
  const estimadas = conCalorias(logs);
  const dias = new Set(estimadas.map(diaDe)).size;
  if (!dias) return null;
  const suma = estimadas.reduce((s, log) => ({ kcal: s.kcal + log.macros!.kcal, protein_g: s.protein_g + log.macros!.protein_g, carbs_g: s.carbs_g + log.macros!.carbs_g, fat_g: s.fat_g + log.macros!.fat_g }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  return { dias, kcal: Math.round(suma.kcal / dias), protein_g: Math.round(suma.protein_g / dias), carbs_g: Math.round(suma.carbs_g / dias), fat_g: Math.round(suma.fat_g / dias) };
}

export const ESTADO_DE_COMIDA: Record<MealLog['status'], { texto: string; clase: string }> = {
  pending_review: { texto: 'Por revisar', clase: 'p-wait' },
  confirmed: { texto: 'Revisada', clase: 'p-conf' },
  adjusted: { texto: 'Ajustada', clase: 'p-conf' },
};
