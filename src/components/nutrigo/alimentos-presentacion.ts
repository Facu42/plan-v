import { foodInputSchema, foodQuantityUnit, NUTRIENTS, normalizeFoodSearch, SARA2_SOURCE, scaleFoodNutrients, type Food, type FoodInput, type FoodNutrients } from '../../types/foods';

export type AlcanceAlimento = 'todos' | 'sara' | 'prop';

export type AltaAlimento = {
  nombre: string;
  fuente: string;
  kcal: string;
  proteina: string;
  medida: string;
  gramos: string;
};

export type PorcionVista = { clave: string; cantidad: number; etiqueta: string };

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

export function textoNumero(valor: number) {
  return numero.format(valor);
}

export function textoCantidad(valor: number, unidad: string) {
  return `${textoNumero(valor)} ${unidad}`;
}

/** La composición institucional no se edita. Un alimento propio sí, con el guardado que ya existe. */
export function seEdita(food: Pick<Food, 'owner_id' | 'source' | 'composition'>) {
  return food.owner_id !== null && food.source !== SARA2_SOURCE && !food.composition;
}

export function etiquetaTarjeta(food: Pick<Food, 'owner_id' | 'source' | 'composition'>) {
  if (food.source === SARA2_SOURCE || food.composition) return 'SARA 2';
  if (food.owner_id) return 'Alimento propio';
  return 'Catálogo';
}

export function grupoDe(food: Pick<Food, 'category'>) {
  return food.category.trim();
}

/** El boceto escribe «SARA 2», no la cita institucional. El dato del API no cambia. */
export function origenCorto(food: Pick<Food, 'owner_id' | 'source' | 'composition'>) {
  if (food.source === SARA2_SOURCE || food.composition?.dataset === 'sara2-2022-v1') return 'SARA 2';
  return food.source.trim();
}

export function anchoEnergia(kcal: number | null) {
  if (kcal == null) return 0;
  return Math.min(100, Math.round(kcal / 4));
}

/** El porcentaje sale de las kcal de lo que está cargado. Un vacío no cuenta como cero. */
export function repartoMacros(food: Pick<Food, 'nutrients'>) {
  const protein = food.nutrients.protein;
  const carbs = food.nutrients.carbs;
  const fat = food.nutrients.fat;
  const partes = [protein == null ? null : protein * 4, carbs == null ? null : carbs * 4, fat == null ? null : fat * 9];
  const total = partes.reduce<number>((suma, parte) => suma + (parte ?? 0), 0);
  const barras = partes.map(parte => (parte == null || total <= 0 ? 0 : Math.round(parte / total * 100))) as [number, number, number];
  return { protein, carbs, fat, barras };
}

const PORCIONES_EN_GRAMOS: PorcionVista[] = [
  { clave: '100', cantidad: 100, etiqueta: '100 g' },
  { clave: '30', cantidad: 30, etiqueta: '1 taza (30 g)' },
  { clave: '10', cantidad: 10, etiqueta: '1 cucharada (10 g)' },
];

/** En gramos el boceto siempre dibuja 100 g, la taza y la cucharada. Una medida propia se suma después. */
export function porcionesDe(food: Food): PorcionVista[] {
  if (foodQuantityUnit(food) === 'ml') return [{ clave: '100', cantidad: 100, etiqueta: '100 ml' }];
  const fijas = new Set(PORCIONES_EN_GRAMOS.map(porcion => porcion.cantidad));
  const propias = food.portions.filter(porcion => !fijas.has(porcion.grams)).map((porcion, indice) => ({
    clave: `propia:${indice}:${porcion.name}`,
    cantidad: porcion.grams,
    etiqueta: `${porcion.name} (${textoNumero(porcion.grams)} g)`,
  }));
  return [...PORCIONES_EN_GRAMOS, ...propias];
}

export function nutrientesDePorcion(food: Food, cantidad: number) {
  return scaleFoodNutrients(food.nutrients, cantidad);
}

export function filtrosDe(alcance: AlcanceAlimento, consulta: string) {
  return {
    q: consulta.trim(),
    kind: 'food' as const,
    scope: alcance === 'sara' ? 'platform' as const : alcance === 'prop' ? 'own' as const : 'all' as const,
    source: alcance === 'sara' ? SARA2_SOURCE : '',
    order: 'name-asc' as const,
    page: 0,
    page_size: 50,
  };
}

export function sigueEnVista(food: Food, alcance: AlcanceAlimento, consulta: string) {
  if (food.kind !== 'food') return false;
  if (alcance === 'sara' && (food.owner_id !== null || food.source !== SARA2_SOURCE)) return false;
  if (alcance === 'prop' && food.owner_id === null) return false;
  const aguja = normalizeFoodSearch(consulta);
  if (aguja && !normalizeFoodSearch(`${food.name} ${food.brand} ${food.category} ${food.source}`).includes(aguja)) return false;
  return true;
}

function decimal(value: string) {
  const texto = value.trim().replace(',', '.');
  if (!texto) return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : Number.NaN;
}

function vacios(): FoodNutrients {
  return Object.fromEntries(NUTRIENTS.map(([clave]) => [clave, null])) as FoodNutrients;
}

function mensaje(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const issue = error.issues[0];
  if (!issue) return 'Revisá los datos del alimento.';
  if (issue.path[0] === 'name') return 'Ingresá el nombre del alimento.';
  if (issue.path[0] === 'source') return issue.message.startsWith('Esa fuente') ? issue.message : 'Indicá la fuente de los valores.';
  if (issue.path[0] === 'nutrients' && issue.path[1] === 'kcal') return 'La energía tiene que ser un número entre 0 y 1.000, o quedar vacía.';
  if (issue.path[0] === 'nutrients' && issue.path[1] === 'protein') return 'Las proteínas tienen que ser un número entre 0 y 100, o quedar vacías.';
  if (issue.path[0] === 'portions') return 'Revisá el nombre y los gramos de la medida.';
  return issue.message;
}

export function borradorNuevo(alta: AltaAlimento): { ok: true; input: FoodInput } | { ok: false; error: string } {
  const medida = alta.medida.trim();
  const gramosTexto = alta.gramos.trim();
  if (medida && !gramosTexto) return { ok: false, error: 'La medida casera necesita los gramos. Sin gramos no se guarda.' };
  if (!medida && gramosTexto) return { ok: false, error: 'La medida casera necesita un nombre.' };
  const kcal = decimal(alta.kcal);
  const proteina = decimal(alta.proteina);
  const gramos = gramosTexto ? decimal(alta.gramos) : null;
  if (Number.isNaN(kcal) || Number.isNaN(proteina) || Number.isNaN(gramos)) return { ok: false, error: 'Ingresá un número, o dejá el campo vacío.' };
  if (gramos != null && (gramos <= 0 || gramos > 100000)) return { ok: false, error: 'Los gramos de la medida tienen que ser mayores que cero y hasta 100.000.' };
  const nutrients = vacios();
  nutrients.kcal = kcal;
  nutrients.protein = proteina;
  const parsed = foodInputSchema.safeParse({
    id: crypto.randomUUID(),
    expected_revision: 0,
    name: alta.nombre,
    brand: '',
    category: 'Propios',
    kind: 'food',
    source: alta.fuente,
    reference: '',
    nutrients,
    portions: medida && gramos != null ? [{ name: medida, grams: gramos }] : [],
  });
  if (!parsed.success) return { ok: false, error: mensaje(parsed.error) };
  return { ok: true, input: parsed.data };
}

/** El boceto solo cambia el nombre y la energía. El resto del alimento propio se conserva. */
export function borradorEdicion(food: Food, nombre: string, kcalTexto: string): { ok: true; input: FoodInput } | { ok: false; error: string } {
  if (!seEdita(food)) return { ok: false, error: 'SARA 2 no se edita. Creá un alimento propio.' };
  const kcal = decimal(kcalTexto);
  if (Number.isNaN(kcal)) return { ok: false, error: 'Ingresá un número, o dejá la energía vacía.' };
  const parsed = foodInputSchema.safeParse({
    id: food.id,
    expected_revision: food.revision,
    name: nombre,
    brand: food.brand,
    category: food.category,
    kind: food.kind,
    source: food.source,
    reference: food.reference,
    nutrients: { ...food.nutrients, kcal },
    portions: food.portions,
  });
  if (!parsed.success) return { ok: false, error: mensaje(parsed.error) };
  return { ok: true, input: parsed.data };
}
