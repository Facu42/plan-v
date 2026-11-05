// Importar el plan anterior, paso 2: pasar las comidas escritas a alimentos de la base (SARA 2) con sus calorías.
// Solo se convierte lo que se puede medir sin inventar: «200 g de pollo», «2 tostadas», «1 taza de leche».
// Lo que no tiene cantidad o no se encuentra queda como texto, igual que en el plan original.
import { foodApi } from '../../api/foods';
import { SARA2_SOURCE, foodQuantityUnit, normalizeFoodSearch, type Food } from '../../types/foods';
import type { PlanComponentInput } from '../../types/plan-components';
import type { PlanSlot } from '../../types/plans';
import { COMIDAS_EDITOR } from './planes-editor';
import type { PlanImportado } from './planes-importar';

export type Buscador = (consulta: string) => Promise<Food[]>;
export type ComponentesImportados = Map<string, PlanComponentInput[]>;
export type ResumenAlimentos = { componentes: ComponentesImportados; alimentos: number; comidas: number };

export const claveComida = (indiceDia: number, slot: PlanSlot) => `${indiceDia}|${slot}`;

const MAX_COMPONENTES = 12;
const MAX_TEXTO = 150;
const MEDIDAS_CASERAS = /^(tazas?|vasos?|cucharadas?|cucharaditas?|rebanadas?|fetas?|porcion(?:es)?|unidad(?:es)?|puñados?|punados?|palitos?|latas?|potes?)$/;
const RELLENO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'al', 'a', 'con', 'y', 'en']);
const NUMEROS: Record<string, number> = { un: 1, uno: 1, una: 1, medio: 0.5, media: 0.5, dos: 2, tres: 3, cuatro: 4 };

export type ParteLeida = { texto: string; cantidad: number | null; unidad: string | null; nombre: string };

/** Corta «tostadas con queso · té» en partes sueltas, una por alimento. */
export function partesDeComida(texto: string) {
  return texto.split(/\s+·\s+|\s*[,;+]\s*|\s+(?:con|y)\s+/i).map(parte => parte.trim()).filter(Boolean);
}

export function leerParte(texto: string): ParteLeida {
  const limpio = texto.trim().replace(/^[-•*]\s*/, '');
  const hallado = /^(\d+(?:[.,]\d+)?|un|uno|una|medio|media|dos|tres|cuatro)\s*(kg|gr?s?|gramos?|ml|cc|l)?(?![\p{L}])\s*(?:de\s+)?(.*)$/iu.exec(limpio);
  if (!hallado) return { texto: limpio, cantidad: null, unidad: null, nombre: limpio };
  const crudo = hallado[1].toLocaleLowerCase('es');
  const cantidad = NUMEROS[crudo] ?? Number(crudo.replace(',', '.'));
  let unidad = hallado[2] ? hallado[2].toLocaleLowerCase('es') : null;
  let nombre = hallado[3].trim();
  if (unidad === 'kg') return { texto: limpio, cantidad: cantidad * 1000, unidad: 'g', nombre };
  if (unidad && /^(g|gr|grs|gramo|gramos)$/.test(unidad)) unidad = 'g';
  else if (unidad === 'cc') unidad = 'ml';
  else if (unidad === 'l') return { texto: limpio, cantidad: cantidad * 1000, unidad: 'ml', nombre };
  if (!unidad) {
    const primera = normalizeFoodSearch(nombre).split(' ')[0] ?? '';
    if (MEDIDAS_CASERAS.test(primera)) { unidad = primera; nombre = nombre.slice(primera.length).trim().replace(/^de\s+/i, ''); }
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) return { texto: limpio, cantidad: null, unidad: null, nombre: limpio };
  return { texto: limpio, cantidad, unidad, nombre };
}

const raiz = (palabra: string) => palabra.length > 4 ? palabra.replace(/(es|s)$/, '') : palabra.replace(/s$/, '');
const palabrasDe = (valor: string) => normalizeFoodSearch(valor).split(/[^a-z0-9ñ]+/).filter(p => p && !RELLENO.has(p)).map(raiz);

/** El alimento cuyo nombre incluye todas las palabras; entre varios, el de nombre más corto. */
export function elegirAlimento(nombre: string, alimentos: Food[]): Food | null {
  const buscadas = palabrasDe(nombre);
  if (!buscadas.length) return null;
  const candidatos = alimentos.filter(f => {
    const propias = new Set(palabrasDe(f.name));
    return buscadas.every(p => propias.has(p));
  });
  return candidatos.sort((a, b) => a.name.length - b.name.length)[0] ?? null;
}

function medidaPara(alimento: Food, parte: ParteLeida) {
  const pistas = new Set([parte.unidad, ...palabrasDe(parte.nombre)].filter((p): p is string => Boolean(p)).map(raiz));
  return alimento.portions.find(porcion => palabrasDe(porcion.name).some(p => pistas.has(p))) ?? null;
}

/** Componente de la base si la cantidad se puede medir con certeza; si no, null y la parte queda como texto. */
export function componenteDe(parte: ParteLeida, alimento: Food): PlanComponentInput | null {
  if (parte.cantidad == null) return null;
  const base = { id: crypto.randomUUID(), kind: 'food' as const, food_id: alimento.id, food_revision: alimento.revision, public_note: '' };
  const unidadAlimento = foodQuantityUnit(alimento);
  if (parte.unidad === 'g' || parte.unidad === 'ml') {
    if (parte.unidad !== unidadAlimento) return null;
    return parte.cantidad <= 100000 ? { ...base, quantity: parte.cantidad, measure: null } : null;
  }
  if (unidadAlimento === 'ml') return null;
  const medida = medidaPara(alimento, parte);
  return medida ? { ...base, quantity: parte.cantidad, measure: medida.name } : null;
}

async function buscarConCache(consulta: string, buscar: Buscador, cache: Map<string, Promise<Food[]>>) {
  const clave = normalizeFoodSearch(consulta);
  if (!cache.has(clave)) cache.set(clave, buscar(consulta).catch(() => []));
  return cache.get(clave)!;
}

async function componentesDeComida(texto: string, buscar: Buscador, cache: Map<string, Promise<Food[]>>) {
  const partes = partesDeComida(texto).map(leerParte);
  if (!partes.length || partes.length > MAX_COMPONENTES) return null;
  const hechos = await Promise.all(partes.map(async (parte): Promise<PlanComponentInput> => {
    const texto = { id: crypto.randomUUID(), kind: 'text' as const, free_text: parte.texto.slice(0, MAX_TEXTO), public_note: '' };
    if (parte.cantidad == null) return texto;
    const palabras = palabrasDe(parte.nombre);
    if (!palabras.length) return texto;
    const alimento = elegirAlimento(parte.nombre, await buscarConCache(parte.nombre, buscar, cache))
      ?? elegirAlimento(parte.nombre, await buscarConCache(palabras[0], buscar, cache));
    return (alimento && componenteDe(parte, alimento)) || texto;
  }));
  return hechos.some(c => c.kind === 'food') ? hechos : null;
}

/** Busca en la base los alimentos del plan. Las comidas sin ningún alimento medible no aparecen en el resultado. */
export async function alimentosDelPlan(plan: PlanImportado, buscar: Buscador): Promise<ResumenAlimentos> {
  const cache = new Map<string, Promise<Food[]>>();
  const componentes: ComponentesImportados = new Map();
  let alimentos = 0;
  for (const [indice, dia] of plan.dias.entries()) {
    const hechas = await Promise.all(COMIDAS_EDITOR.filter(slot => dia.comidas[slot]).map(async slot => [slot, await componentesDeComida(dia.comidas[slot]!, buscar, cache)] as const));
    for (const [slot, lista] of hechas) {
      if (!lista) continue;
      componentes.set(claveComida(indice, slot), lista);
      alimentos += lista.filter(c => c.kind === 'food').length;
    }
  }
  return { componentes, alimentos, comidas: componentes.size };
}

export const buscarEnLaBase: Buscador = async consulta =>
  (await foodApi.search({ q: consulta, source: SARA2_SOURCE, kind: 'food', page_size: 25 })).foods;

export function resumenAlimentos({ alimentos, comidas }: Pick<ResumenAlimentos, 'alimentos' | 'comidas'>) {
  if (!alimentos) return 'No pude medir ningún alimento con la base (faltaban cantidades); quedó todo como texto.';
  return `${alimentos} ${alimentos === 1 ? 'alimento quedó cargado' : 'alimentos quedaron cargados'} de la base, con calorías, en ${comidas} ${comidas === 1 ? 'comida' : 'comidas'}. Lo que no tenía cantidad quedó como texto.`;
}
