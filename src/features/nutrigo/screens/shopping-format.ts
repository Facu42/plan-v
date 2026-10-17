import { argentinaMonth } from './ar-time';
import type { ShoppingCategory } from '../../../components/patient/shopping-list';
import type { ShoppingLine } from '../../../types/shopping';

const compact = (value: number) => new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value).replace(/ /g, ' ');

/** Cantidad de un producto: hasta dos decimales (0,25 no se redondea a 0,3); sin dato o inválida, un guion. */
export function quantityLabel(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '-';
  if (value < 0.01) return '<0,01';
  if (value >= 10_000_000) return compact(value);
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}
/** Cómo se pide en un comercio de Argentina lo que suma el plan: «1/2 kg» en vez de 480 g, «1,5 l»,
 * «1 docena» de huevos, unidades enteras. Siempre redondea para arriba (no falta nada) y a pasos chicos.
 * Las medidas de cocina (cda, cdita, taza) y las cantidades chicas quedan como vienen. */
export type LocalAmount = { amount: string; unit: string; exact: string };
const QUARTERS: Record<number, string> = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };
const up = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;
const named = (value: number) => QUARTERS[value] ?? quantityLabel(value);
export function localAmount(quantity: number | null | undefined, unit: string | null, name = ''): LocalAmount {
  const exact = quantityLabel(quantity);
  const plainUnit = unit ?? '';
  const exactText = exact === '-' ? '' : `${exact}${plainUnit ? ` ${plainUnit}` : ''}`;
  const keep = { amount: exact, unit: plainUnit, exact: exactText };
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || quantity >= 10_000_000) return keep;
  if (unit === 'g' || unit === 'ml') {
    const bigUnit = unit === 'g' ? 'kg' : 'l';
    if (quantity >= 1000) return { amount: named(up(quantity / 1000, 0.25)), unit: bigUnit, exact: exactText };
    if (unit === 'g' && quantity >= 100) {
      const grams = up(quantity, 50);
      return grams % 250 === 0 ? { amount: named(grams / 1000), unit: 'kg', exact: exactText } : { amount: quantityLabel(grams), unit: 'g', exact: exactText };
    }
    if (unit === 'ml' && QUARTERS[quantity / 1000]) return { amount: QUARTERS[quantity / 1000], unit: 'l', exact: exactText };
    return keep;
  }
  if (unit === 'u') {
    if (/(^|[^a-z])huevos?([^a-z]|$)/.test(plain(name)) && quantity > 1) {
      const dozens = up(quantity, 6) / 12;
      return { amount: named(dozens), unit: dozens > 1 ? 'docenas' : 'docena', exact: exactText };
    }
    return { amount: quantityLabel(Math.ceil(quantity - 1e-9)), unit: 'u', exact: exactText };
  }
  return keep;
}
export const productCount = (count: number) => `${count} ${count === 1 ? 'producto' : 'productos'}`;
export const boughtLabel = (count: number) => `${count} ${count === 1 ? 'comprado' : 'comprados'}`;

/** Los últimos `count` meses, el más viejo primero, terminando en el mes de Argentina de `now`. */
export function recentMonths(now: Date, count: number): { year: number; month: number }[] {
  const { year, month } = argentinaMonth(now);
  return Array.from({ length: count }, (_, position) => { const index = year * 12 + month - (count - 1) + position; return { year: Math.floor(index / 12), month: index % 12 }; });
}
/** Nombre corto del mes («Oct»). */
export const monthName = (month: number) => new Date(Date.UTC(2026, month, 15)).toLocaleDateString('es-AR', { timeZone: 'UTC', month: 'short' }).replace('.', '').replace(/^./, letter => letter.toUpperCase());

/** Comercios de la lista en el orden y con los colores del widget «Grocery Category» del archivo
 * (Bar 1 a Bar 6: #C2E66E, #FFCB65, #FFA257, #FFBE8A, #FFE1C9 y el gris de «Others»). */
export const SHOPPING_STORES: ReadonlyArray<{ category: ShoppingCategory; color: string }> = [
  { category: 'Verdulería', color: '#c2e66e' },
  { category: 'Panadería y cereales', color: '#ffcb65' },
  { category: 'Proteínas', color: '#ffa257' },
  { category: 'Almacén', color: '#ffbe8a' },
  { category: 'Lácteos', color: '#ffe1c9' },
  { category: 'Otros', color: '#e1e1e2' },
];

/** Palabras (sin tildes, comienzo de palabra) que ubican un producto en su comercio. */
const STORE_WORDS: ReadonlyArray<[ShoppingCategory, readonly string[]]> = [
  ['Proteínas', ['pollo', 'pechuga', 'muslo', 'carne', 'asado', 'bife', 'nalga', 'peceto', 'lomo', 'cuadril', 'vacio', 'cerdo', 'bondiola', 'milanesa', 'hamburguesa', 'pescado', 'merluza', 'salmon', 'atun', 'caballa', 'sardina', 'huevo', 'pavita', 'pavo', 'jamon']],
  ['Lácteos', ['leche', 'yogur', 'queso', 'ricota', 'manteca', 'crema', 'kefir', 'postrecito']],
  ['Panadería y cereales', ['pan', 'tostada', 'galleta', 'avena', 'arroz', 'quinoa', 'fideo', 'pasta', 'harina', 'granola', 'cereal', 'polenta', 'cous', 'tapa', 'bizcocho']],
  ['Almacén', ['lenteja', 'garbanzo', 'poroto', 'arveja seca', 'legumbre', 'aceite', 'aceituna', 'vinagre', 'sal', 'azucar', 'edulcorante', 'miel', 'nuez', 'nueces', 'almendra', 'mani', 'castaña', 'frutos secos', 'semilla', 'chia', 'lino', 'cacao', 'cafe', 'te', 'yerba', 'mermelada', 'salsa', 'pure de tomate', 'tomate triturado', 'caldo', 'especia', 'condimento', 'oregano', 'pimenton', 'comino', 'mostaza', 'mayonesa']],
  ['Verdulería', ['fruta', 'verdura', 'vegetal', 'ensalada', 'banana', 'manzana', 'pera', 'naranja', 'mandarina', 'limon', 'pomelo', 'frutilla', 'uva', 'kiwi', 'durazno', 'ciruela', 'anana', 'mango', 'melon', 'sandia', 'arandano', 'palta', 'tomate', 'lechuga', 'espinaca', 'acelga', 'brocoli', 'coliflor', 'zanahoria', 'zapallo', 'zapallito', 'calabaza', 'cebolla', 'ajo', 'papa', 'batata', 'pepino', 'morron', 'pimiento', 'berenjena', 'choclo', 'rucula', 'apio', 'remolacha', 'repollo', 'champi', 'hongo', 'perejil', 'albahaca', 'puerro', 'verdeo', 'chaucha']],
];
/** Nombre del comercio en la etiqueta de la tabla, que en el archivo es angosta: «Panadería y cereales» va corto. */
export const storeBadge = (store: ShoppingCategory) => (store === 'Panadería y cereales' ? 'Panadería' : store);
/** Platos armados: no son un producto de un solo comercio. */
const DISH_WORDS = ['pizza', 'panqueque', 'licuado', 'tarta', 'empanada', 'guiso', 'sopa', 'wrap', 'sandwich', 'sanguche', 'omelette', 'tortilla', 'budin', 'torta', 'risotto', 'salteado', 'bowl'];
const plain = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
/** Dónde empieza `word` en `text` (comienzo de palabra); las palabras cortas («sal», «te», «pan») tienen que
 * estar enteras, con su plural, para que «salvado» o «panceta» no las tomen. Sin coincidencia, -1. */
const wordAt = (text: string, word: string) => {
  const tail = word.length <= 4 ? '(es|s)?([^a-z]|$)' : '';
  return text.search(new RegExp(`(^|[^a-z])${plain(word)}${tail}`));
};

/** Comercio de un producto: el de la primera palabra conocida del nombre («Avena con manzana» va a cereales).
 * Si el nombre empieza por un plato armado («Tarta de pollo»), va a «Otros». */
export function storeOf(name: string): ShoppingCategory {
  const text = plain(name);
  let best: { store: ShoppingCategory; at: number } | null = null;
  for (const [store, words] of STORE_WORDS) for (const word of words) {
    const at = wordAt(text, word);
    if (at >= 0 && (!best || at < best.at)) best = { store, at };
  }
  const dish = Math.min(...DISH_WORDS.map(word => wordAt(text, word)).filter(at => at >= 0));
  return best && best.at < dish ? best.store : 'Otros';
}

type ShareLine = Pick<ShoppingLine, 'name' | 'quantity' | 'unit' | 'checked'>;

/** Texto para mandar por WhatsApp o copiar: lo que falta comprar, agrupado por comercio.
 * Si ya está todo comprado, va la lista completa. */
export function shoppingShareText(items: readonly ShareLine[]): string {
  const pending = items.filter(item => !item.checked);
  const chosen = pending.length ? pending : items;
  const lines = ['Lista del súper'];
  if (!chosen.length) return `${lines[0]}\n\nTodavía no hay productos.`;
  for (const { category } of SHOPPING_STORES) {
    const group = chosen.filter(item => storeOf(item.name) === category).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (!group.length) continue;
    lines.push('', category.toLocaleUpperCase('es-AR'));
    for (const item of group) {
      const { amount, unit } = localAmount(item.quantity, item.unit, item.name);
      lines.push(`• ${item.name}${amount !== '-' ? ` · ${amount}${unit ? ` ${unit}` : ''}` : ''}`);
    }
  }
  return lines.join('\n');
}

/** Enlace de WhatsApp que abre el envío con el texto ya escrito (la paciente elige a quién). */
export const whatsappShareUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
