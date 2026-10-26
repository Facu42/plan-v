import { componentInput, componentNutrients, componentTitle, type PlanComponentView } from '../../types/plan-components';
import { recipePortionNutrients } from '../../types/plan-recipe-selection';
import {
  eachIsoDate, planWeekIndex, type PlanItemView, type PlanSlot, type PlanVersionView,
} from '../../types/plans';
import { diasHasta } from './planes-lista';

export const COMIDAS_EDITOR: PlanSlot[] = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'];
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const HORAS_EDITOR: Record<PlanSlot, string> = {
  Desayuno: '08:00',
  Colación: '10:30',
  Almuerzo: '13:00',
  Merienda: '17:00',
  Cena: '20:30',
  Extra: '21:30',
};

export type MacrosDia = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
};

export type LineaEditor = {
  clave: string;
  nombre: string;
  detalle: string;
  cantidad: number | null;
  unidad: string;
  nota: string;
  macros: MacrosDia;
};

export type ComidaEditor = {
  slot: PlanSlot;
  hora: string;
  titulo: string;
  lineas: LineaEditor[];
  macros: MacrosDia;
};

const VACIO: MacrosDia = { kcal: null, protein: null, carbs: null, fat: null, fiber: null };
const CERO: MacrosDia = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function sumarDias(iso: string, dias: number) {
  const fecha = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)) + dias));
  return fecha.toISOString().slice(0, 10);
}

export function indiceLunes(iso: string) {
  const dia = new Date(`${iso}T12:00:00-03:00`).getUTCDay();
  return (dia + 6) % 7;
}

/** Lunes de la semana que contiene esa fecha, en Argentina. */
export function lunesDeSemana(iso: string) {
  return sumarDias(iso, -indiceLunes(iso));
}

export function semanasDelPeriodo(inicio: string, fin: string) {
  return Math.max(1, Math.ceil(eachIsoDate(inicio, fin).length / 7));
}

/** El boceto arranca vacío con cuatro semanas. Un plan ya guardado muestra las suyas. */
export const SEMANAS_AL_EMPEZAR = 4;

export function finVisible(inicio: string, fin: string, vacio: boolean) {
  if (!vacio) return fin;
  const cuatro = sumarDias(inicio, SEMANAS_AL_EMPEZAR * 7 - 1);
  return fin > cuatro ? fin : cuatro;
}

/** El borrador no acepta más de 21 días entre el inicio y el fin. */
export function pasaElTope(inicio: string, fecha: string) {
  return fecha > sumarDias(inicio, 21);
}

export function fechasDeSemana(inicio: string, fin: string, semana: number) {
  return eachIsoDate(inicio, fin).slice(semana * 7, semana * 7 + 7);
}

export function semanaInicial(inicio: string, fin: string, hoy: string) {
  return planWeekIndex(inicio, fin, hoy);
}

function numero(valor: number | null | undefined) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

function deNutrientes(origen: Partial<{ kcal: number | null; protein: number | null; carbs: number | null; fat: number | null; fiber: number | null }> | null): MacrosDia {
  if (!origen) return { ...VACIO };
  return {
    kcal: numero(origen.kcal),
    protein: numero(origen.protein),
    carbs: numero(origen.carbs),
    fat: numero(origen.fat),
    fiber: numero(origen.fiber),
  };
}

export function sumarMacros(lista: MacrosDia[]): MacrosDia {
  if (!lista.length) return { ...CERO };
  const sumar = (clave: keyof MacrosDia) => (
    lista.some(item => item[clave] == null) ? null : lista.reduce((total, item) => total + (item[clave] ?? 0), 0)
  );
  return { kcal: sumar('kcal'), protein: sumar('protein'), carbs: sumar('carbs'), fat: sumar('fat'), fiber: sumar('fiber') };
}

function macrosDeComponente(componente: PlanComponentView): MacrosDia {
  return deNutrientes(componentNutrients(componente));
}

function macrosDePlato(item: PlanItemView): MacrosDia {
  if (item.recipe && item.portions != null) return deNutrientes(recipePortionNutrients(item.recipe, item.portions));
  if (item.recipe_proposal?.nutrition && item.portions != null) {
    const porcion = item.recipe_proposal.nutrition.per_portion;
    const veces = item.portions;
    return { kcal: porcion.kcal * veces, protein: porcion.protein_g * veces, carbs: porcion.carbs_g * veces, fat: porcion.fat_g * veces, fiber: null };
  }
  return { ...VACIO };
}

function detalleDe(componente: PlanComponentView) {
  if (componente.kind === 'food') return componente.measure ?? '';
  if (componente.kind === 'recipe') return 'porción';
  return '';
}

function lineaDeComponente(item: PlanItemView, componente: PlanComponentView): LineaEditor {
  return {
    clave: `${item.id}:${componente.id}`,
    nombre: componentTitle(componente),
    detalle: detalleDe(componente),
    cantidad: componente.kind === 'food' ? componente.quantity : componente.kind === 'recipe' ? componente.portions : componente.portions ?? null,
    unidad: componente.kind === 'food' ? (componente.measure ?? 'g') : 'porción',
    nota: componente.public_note,
    macros: macrosDeComponente(componente),
  };
}

function lineaDePlato(item: PlanItemView): LineaEditor {
  const nombre = item.recipe_title || item.recipe?.title || item.free_text || 'Indicación';
  return {
    clave: `${item.id}:plato`,
    nombre,
    detalle: item.recipe_id ? 'porción' : '',
    cantidad: item.portions,
    unidad: item.portions != null ? 'porción' : '',
    nota: item.public_note,
    macros: macrosDePlato(item),
  };
}

export function lineasDeItem(item: PlanItemView): LineaEditor[] {
  if (item.components?.length) return item.components.map(componente => lineaDeComponente(item, componente));
  if (item.recipe_id || item.free_text || item.recipe_title) return [lineaDePlato(item)];
  return [];
}

export function comidaDelDia(items: PlanItemView[], fecha: string, slot: PlanSlot, hora: string): ComidaEditor {
  const propios = items.filter(item => item.for_date === fecha && item.slot === slot);
  const lineas = propios.flatMap(lineasDeItem);
  const titulo = lineas.length ? lineas.map(linea => linea.nombre).join(' · ') : 'Sin alimentos';
  return { slot, hora, titulo, lineas, macros: sumarMacros(lineas.map(linea => linea.macros)) };
}

export function comidasDelDia(
  items: PlanItemView[],
  fecha: string,
  horas: Partial<Record<PlanSlot, string>> = {},
) {
  const slots: PlanSlot[] = items.some(item => item.for_date === fecha && item.slot === 'Extra')
    ? [...COMIDAS_EDITOR, 'Extra']
    : [...COMIDAS_EDITOR];
  return slots.map(slot => comidaDelDia(items, fecha, slot, horas[slot] || HORAS_EDITOR[slot]));
}

export function cantidadValida(unidad: string, cantidad: number) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return false;
  if (unidad === 'porción') return cantidad <= 50;
  return cantidad <= 100_000;
}

export function cambiarCantidad(items: PlanItemView[], clave: string, cantidad: number): PlanItemView[] | null {
  const [itemId, parte] = clave.split(':');
  const actual = items.find(item => item.id === itemId);
  if (!actual) return null;
  if (parte === 'plato') {
    if (!cantidadValida('porción', cantidad)) return null;
    return items.map(item => item.id === itemId ? { ...item, portions: cantidad } : item);
  }
  const componente = actual.components?.find(item => item.id === parte);
  if (!componente) return null;
  if (componente.kind === 'text') {
    if (!cantidadValida('porción', cantidad)) return null;
    return items.map(item => item.id !== itemId ? item : {
      ...item,
      components: item.components?.map(pieza => pieza.id === parte && pieza.kind === 'text' ? { ...pieza, portions: cantidad } : pieza),
    });
  }
  if (!cantidadValida(componente.kind === 'food' ? 'g' : 'porción', cantidad)) return null;
  return items.map(item => item.id !== itemId ? item : {
    ...item,
    components: item.components?.map(pieza => {
      if (pieza.id !== parte) return pieza;
      if (pieza.kind === 'food') return { ...pieza, quantity: cantidad };
      if (pieza.kind === 'recipe') return { ...pieza, portions: cantidad };
      return pieza;
    }),
  });
}

export function cambiarNota(items: PlanItemView[], clave: string, nota: string): PlanItemView[] | null {
  const limpia = nota.trim().slice(0, 200);
  const [itemId, parte] = clave.split(':');
  const actual = items.find(item => item.id === itemId);
  if (!actual) return null;
  if (parte === 'plato') return items.map(item => item.id === itemId ? { ...item, public_note: limpia } : item);
  if (!actual.components?.some(pieza => pieza.id === parte)) return null;
  return items.map(item => item.id !== itemId ? item : {
    ...item,
    components: item.components?.map(pieza => pieza.id === parte ? { ...pieza, public_note: limpia } : pieza),
  });
}

export function quitarLinea(items: PlanItemView[], clave: string): PlanItemView[] {
  const [itemId, parte] = clave.split(':');
  if (parte === 'plato') return items.filter(item => item.id !== itemId);
  return items.flatMap(item => {
    if (item.id !== itemId) return [item];
    const components = item.components?.filter(pieza => pieza.id !== parte) ?? [];
    return components.length ? [{ ...item, components }] : [];
  });
}

function clonarItem(item: PlanItemView, fecha: string): PlanItemView {
  return {
    ...structuredClone(item),
    id: crypto.randomUUID(),
    for_date: fecha,
    components: item.components?.map(pieza => ({ ...pieza, id: crypto.randomUUID() })),
  };
}

/** Copia las comidas de un día a otro. El día de destino se reemplaza. */
export function duplicarDia(items: PlanItemView[], desde: string, hacia: string): PlanItemView[] {
  if (desde === hacia) return items;
  const copiados = items.filter(item => item.for_date === desde).map(item => clonarItem(item, hacia));
  if (!copiados.length) return items;
  return [...items.filter(item => item.for_date !== hacia), ...copiados];
}

/** Copia un plan a un período nuevo, día por día desde la primera fecha. */
export function copiarPlan(origen: readonly PlanItemView[], inicio: string): PlanItemView[] {
  const fechas = [...new Set(origen.map(item => item.for_date))].sort();
  if (!fechas.length) return [];
  const limite = sumarDias(inicio, 21);
  return origen.flatMap(item => {
    const destino = sumarDias(inicio, diasHasta(fechas[0], item.for_date));
    return destino <= limite ? [clonarItem(item, destino)] : [];
  });
}

export function periodoDe(items: readonly PlanItemView[], respaldoInicio: string, respaldoFin: string) {
  const fechas = [...new Set(items.map(item => item.for_date))].sort();
  if (!fechas.length) return { inicio: respaldoInicio, fin: respaldoFin };
  const ultima = fechas[fechas.length - 1];
  return { inicio: fechas[0] < respaldoInicio ? fechas[0] : respaldoInicio, fin: ultima > respaldoFin ? ultima : respaldoFin };
}

export type ControlEntrega = {
  conAlimentos: number;
  vacias: number;
  diasFuera: string[];
};

export function controlEntrega(inicio: string, fin: string, items: PlanItemView[], metaKcal: number | null): ControlEntrega {
  const fechas = eachIsoDate(inicio, fin);
  let conAlimentos = 0;
  let vacias = 0;
  const diasFuera: string[] = [];
  for (const fecha of fechas) {
    const comidas = COMIDAS_EDITOR.map(slot => comidaDelDia(items, fecha, slot, HORAS_EDITOR[slot]));
    conAlimentos += comidas.filter(comida => comida.lineas.length > 0).length;
    vacias += comidas.filter(comida => comida.lineas.length === 0).length;
    const kcal = sumarMacros(comidas.flatMap(comida => comida.lineas.map(linea => linea.macros))).kcal;
    if (metaKcal && kcal != null && kcal > 0 && Math.abs(kcal / metaKcal - 1) > 0.1) diasFuera.push(fecha);
  }
  return { conAlimentos, vacias, diasFuera };
}

export type GrupoCompra = { nombre: string; items: Array<{ nombre: string; cantidad: string }> };

export function listaDeCompras(items: readonly PlanItemView[], fechas: readonly string[]): GrupoCompra[] {
  const grupos = new Map<string, Map<string, { nombre: string; cantidad: number; unidad: string }>>();
  const sumar = (grupo: string, nombre: string, cantidad: number, unidad: string) => {
    const bolsa = grupos.get(grupo) ?? new Map();
    const clave = `${nombre}|${unidad}`;
    const previo = bolsa.get(clave);
    bolsa.set(clave, { nombre, cantidad: (previo?.cantidad ?? 0) + cantidad, unidad });
    grupos.set(grupo, bolsa);
  };
  for (const item of items) {
    if (!fechas.includes(item.for_date)) continue;
    for (const componente of item.components ?? []) {
      if (componente.kind === 'food') sumar(componente.food_snapshot?.category || 'Alimentos', componentTitle(componente), componente.quantity, componente.measure || 'g');
      else if (componente.kind === 'recipe') sumar('Recetas', componentTitle(componente), componente.portions, 'porción');
      else sumar('Indicaciones', componente.free_text, componente.portions ?? 1, componente.portions ? 'porción' : '');
    }
    if (!item.components?.length && (item.recipe_title || item.free_text)) {
      sumar(item.recipe_id ? 'Recetas' : 'Indicaciones', item.recipe_title || item.free_text || 'Indicación', item.portions ?? 1, item.portions ? 'porción' : '');
    }
  }
  return [...grupos.entries()].map(([nombre, bolsa]) => ({
    nombre,
    items: [...bolsa.values()].map(item => ({
      nombre: item.nombre,
      cantidad: item.unidad ? `${redondear(item.cantidad)} ${item.unidad}` : redondear(item.cantidad),
    })),
  }));
}

function redondear(valor: number) {
  return (Math.round(valor * 100) / 100).toLocaleString('es-AR');
}

export type FilaVersion = { id: string; titulo: string; detalle: string; restaurar: boolean };

export function paraGuardar(item: PlanItemView) {
  const conPartes = Boolean(item.components?.length);
  return {
    ...(conPartes ? { components: item.components!.map(componentInput) } : {}),
    for_date: item.for_date,
    slot: item.slot,
    ...(conPartes || !item.recipe_id ? {} : { recipe_id: item.recipe_id, recipe_version: item.recipe_version ?? undefined }),
    ...(conPartes || item.recipe_id || !item.free_text ? {} : { free_text: item.free_text }),
    ...(conPartes || item.portions == null ? {} : { portions: item.portions }),
    public_note: item.public_note,
    ...(conPartes || item.recipe_id || !item.recipe_proposal ? {} : { recipe_proposal: item.recipe_proposal }),
  };
}

export function filasDeVersiones(actual: PlanVersionView | null, historial: readonly PlanVersionView[]) {
  const lista = historial.length ? historial : actual ? [actual] : [];
  return [...lista].sort((a, b) => b.version - a.version).map((version): FilaVersion => ({
    id: version.id,
    titulo: `Versión ${version.version}`,
    detalle: version.status === 'published' ? 'Publicada' : version.status === 'scheduled' ? 'Programada' : version.status === 'archived' ? 'Archivada' : 'Borrador',
    restaurar: version.status !== 'draft',
  }));
}
