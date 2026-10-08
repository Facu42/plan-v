import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoMenu, NutrigoRecipeDetail, type DisplayRecipe } from './Menu';
import { effectiveYield, formatAmount, scaleQuantity } from '../recipe-format';
import { hideBrokenPhoto, photoUrl, plateImage } from '../plate-photo';
import { unavailableCard } from '../../../types/recipe-plate';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async original => ({ ...await original<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));
const patient = { id: 'p1', name: 'Ana Real' } as unknown as ShowroomPatient;
const navigate = () => undefined;
const base: DisplayRecipe = { id: 'r', title: 'Receta de prueba', version: 1, yield_portions: 2, ingredients: [{ id: 'i1', name: 'Lentejas', quantity: 200, unit: 'g' }], steps: ['Cocinar.', 'Servir.'], nutrient_source: 'Tabla', nutrition: { origin: 'declared', source: 'Tabla', per_portion: { kcal: 620, carbs_g: 80, protein_g: 20, fat_g: 15 } }, card: unavailableCard('Receta de prueba', 'Almuerzo') };
const withPhoto = (url: string | null, status: 'ready' | 'none' | 'failed' = 'ready', generation?: 'queued' | 'failed'): DisplayRecipe => ({ ...base, card: { ...base.card!, cover_status: status, cover_url: url, cover_generation: generation } });
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const detail = (recipe: DisplayRecipe, initialPortions?: number) => renderToStaticMarkup(<NutrigoRecipeDetail recipe={recipe} initialPortions={initialPortions} onBack={navigate} patientName="Ana" onNavigate={navigate} />);
const menu = (recipes: DisplayRecipe[], favorites: string[] = []) => { context.data = { recipes, favorites, favoriteRecipeIds: favorites }; return renderToStaticMarkup(<NutrigoMenu patient={patient} onNavigate={navigate} />); };
beforeEach(() => { context.mobile = false; context.data = null; });

describe('formato de cantidades', () => {
  it('muestra hasta dos decimales (1,25 porciones) y «—» si no es un número válido', () => {
    expect(formatAmount(1.25)).toBe('1,25'); expect(formatAmount(0)).toBe('0'); expect(formatAmount(0.333)).toBe('0,33');
    for (const bad of [NaN, Infinity, -5, null, undefined]) expect(formatAmount(bad)).toBe('—');
  });
  it('escala cantidades sin dividir por cero', () => {
    expect(scaleQuantity(200, 1, 2)).toBe(100); expect(scaleQuantity(200, 1, 0)).toBe(200); expect(scaleQuantity(200, 3, Number.NaN)).toBe(200);
  });
});
describe('fotos del plato', () => {
  it('sólo se usa la foto lista con dirección segura; el resto deja el recuadro gris del archivo', () => {
    expect(photoUrl(withPhoto('https://x.test/a.jpg').card)).toBe('https://x.test/a.jpg');
    expect(photoUrl(withPhoto('data:image/png;base64,AAAA').card)).toContain('data:image/png');
    for (const card of [withPhoto(null).card, withPhoto('https://x.test/a.jpg', 'none').card, withPhoto('https://x.test/a.jpg', 'failed').card, withPhoto('javascript:alert(1)').card, withPhoto('/relativa.png').card, undefined]) expect(photoUrl(card)).toBeNull();
  });
  it('si la foto no carga, se oculta y queda el recuadro gris del archivo', () => {
    const style = { display: '' }; hideBrokenPhoto({ currentTarget: { style } }); expect(style.display).toBe('none');
  });
  it('cada caso conserva el recuadro del archivo en la lista y el detalle', () => {
    for (const mobile of [false, true]) {
      context.mobile = mobile;
      for (const recipe of [withPhoto(null, 'none'), withPhoto(null, 'none', 'queued'), withPhoto(null, 'failed', 'failed')]) {
        const html = menu([recipe]); expect(html).not.toContain('<img alt="Receta'); expect(html).toContain('data-name="Place Image Here"');
        expect(detail(recipe)).toContain('data-name="Place Image Here"');
      }
      const ok = menu([withPhoto('https://x.test/a.jpg')]);
      expect(ok).toContain('src="https://x.test/a.jpg"'); expect(ok).toContain('loading="lazy"');
    }
  });
});
describe.each([false, true])('variabilidad de datos en el menú (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('porciones decimales del plan se ven completas (1,25) y no quedan NaN ni infinito con rinde 0', () => {
    const html = detail(base, 1.25); expect(text(html)).toContain('1,25 porciones'); expect(html).toContain('125 g Lentejas');
    const zero = text(detail({ ...base, yield_portions: 0 })); expect(zero).not.toMatch(/NaN|Infinity|∞/);
  });
  it('nutrientes ausentes, negativos o NaN muestran «—» dentro del bloque, sin «Sin dato» que desborda la ficha', () => {
    const none = { ...base, nutrition: undefined, nutrient_source: '', card: { ...base.card!, macros: null } };
    const bad = { ...base, nutrition: { origin: 'declared' as const, source: 'x', per_portion: { kcal: NaN, carbs_g: -4, protein_g: null, fat_g: 0 } } } as unknown as DisplayRecipe;
    for (const recipe of [none, bad]) {
      const list = text(menu([recipe])), page = text(detail(recipe));
      expect(list).not.toContain('Sin dato'); expect(page).not.toContain('Sin dato'); expect(list).not.toMatch(/NaN|Infinity|-4/); expect(page).not.toMatch(/NaN|Infinity|-4/);
      expect(list).toContain('—');
    }
    expect(text(menu([bad]))).toMatch(/0 g (grasas|G)\b/);
  });
  it('las fichas de nutrientes crecen con la cifra (1.234.567 kcal) en vez de montarse sobre la línea divisoria', () => {
    const big = { ...base, nutrition: { origin: 'declared' as const, source: 'x', per_portion: { kcal: 1234567, carbs_g: 98765, protein_g: 1, fat_g: 1 } } };
    const html = menu([big]);
    expect(html).toContain('1.234.567'); expect(html).toMatch(/style="[^"]*min-width:4[0-9]px[^"]*width:auto/);
  });
  it('un nombre de receta larguísimo se corta con elipsis en el destacado (4 renglones), en la lista (3) y en la barra lateral (2), con el nombre completo en el título', () => {
    const LONG = 'Ensalada templada de lentejas, vegetales asados de estación, queso fresco y aderezo cítrico de la casa con semillas tostadas';
    const html = menu([{ ...base, title: LONG }]);
    for (const lines of [4, 3, 2]) expect(html).toMatch(new RegExp(`-webkit-line-clamp:${lines}`)); expect(html).toContain(`title="${LONG}"`);
    expect(text(detail({ ...base, title: LONG }))).toContain(LONG);
  });
  it('sin coincidencias en la búsqueda, el destacado no dice que no hay recetas asignadas', () => {
    context.data = { recipes: [base], favorites: [] };
    const html = renderToStaticMarkup(<NutrigoMenu patient={patient} onNavigate={navigate} query="zzz" />);
    expect(text(html)).not.toContain('Todavía no tenés recetas asignadas'); expect(text(html)).toContain('Ninguna receta coincide con la búsqueda');
  });
  it('ingredientes sin cantidad válida se listan por su nombre, sin «0 g» ni NaN', () => {
    const html = text(detail({ ...base, ingredients: [{ id: 'a', name: 'Sal', quantity: 0, unit: 'g' }, { id: 'b', name: 'Pimienta', quantity: NaN, unit: 'g' }, { id: 'c', name: 'Aceite', quantity: 0.333, unit: 'cda' }] }));
    expect(html).toContain('Sal'); expect(html).not.toContain('0 g Sal'); expect(html).not.toMatch(/NaN/); expect(html).toContain('0,33 cda Aceite');
  });
  it('la receta conserva el pasito final de la lista del archivo (sin esconder la línea del último paso)', () => {
    const html = detail(base); expect(html).not.toContain('visibility:hidden');
  });
  it('favorita: usa la estrella del propio archivo (c88d0.svg), no un dibujo propio', () => {
    const html = renderToStaticMarkup(<NutrigoRecipeDetail recipe={base} onBack={navigate} patientName="Ana" onNavigate={navigate} onFavorite={navigate} saved />);
    expect(html).toContain('aria-label="Quitar de favoritas"'); expect(html).not.toContain('<svg'); expect(html).toContain('c88d0.svg');
  });
  it('sin puntaje, las barras son las barras blancas del archivo, sin estilos que las pisen', () => {
    const html = menu([base]); const chart = html.slice(html.indexOf('data-name="Chart Health Score"'));
    let end = 0; for (let n = 0; n < 10; n++) end = chart.indexOf('data-name="Bar"', end) + 1; const bars = chart.slice(0, end + 20); expect(bars.match(/data-name="Bar"/g)).toHaveLength(10); expect(bars).not.toContain('style=');
  });
  it('los filtros por momento cambian de tono con las clases del archivo, no con estilos propios', () => {
    const html = menu([base]); expect(html).not.toContain('background:#f6f6f7'); expect(html).not.toContain('background:#c2e66e');
  });
  it('la ficha nutricional crece con sus nueve filas (la lista no queda en alto cero y desborda la tarjeta)', () => {
    const html = detail(base); const facts = html.slice(html.indexOf('data-name="Widget Nutrition Facts"'));
    const list = facts.slice(facts.indexOf('data-name="List Nutrition Facts"'), facts.indexOf('data-name="List Nutrition Facts"') + 400);
    expect(list).toMatch(/style="[^"]*flex:0 0 auto/);
    for (const label of ['Fibra', 'Sodio', 'Colesterol', 'Azúcares', 'Vitamina C']) expect(text(facts)).toContain(label);
  });
  it('sin reseñas, la calificación queda en «—» y no queda un «0» suelto con la barra del archivo', () => {
    const html = detail(base); const reviews = text(html.slice(html.indexOf('data-name="Section Reviews"'), html.indexOf('data-name="Section Reviews"') + 6000));
    expect(reviews).toContain('Sin reseñas todavía'); expect(reviews).not.toMatch(/\b0\s*(\/5|—)/); expect(reviews).not.toContain('/5');
  });
  it('con un rinde inválido (0, NaN, negativo) la receta se muestra por porción base: la leyenda y las cantidades coinciden', () => {
    for (const bad of [0, NaN, -2]) {
      const html = text(detail({ ...base, yield_portions: bad })); expect(html).toContain('Rinde 1 porción'); expect(html).toContain('200 g Lentejas'); expect(html).not.toMatch(/NaN|Infinity|Rinde 0|Rinde —/);
      const two = text(detail({ ...base, yield_portions: bad }, 2)); expect(two).toContain('400 g Lentejas'); expect(two).toContain('2 porciones');
    }
  });
});
describe('rinde de la receta', () => {
  it('un rinde inválido cuenta como una porción base y uno válido se respeta', () => {
    for (const bad of [0, NaN, -1, Infinity]) { expect(effectiveYield(bad)).toBe(1); expect(scaleQuantity(200, 1, effectiveYield(bad))).toBe(200); }
    expect(effectiveYield(2)).toBe(2); expect(effectiveYield(0.5)).toBe(0.5);
  });
});
describe('la foto reemplazada por otra dirección vuelve a mostrarse', () => {
  it('cada dirección es un elemento nuevo (si la anterior falló y se ocultó, la nueva no hereda el ocultamiento)', () => {
    const card = (url: string) => ({ cover_status: 'ready', cover_url: url, cover_alt: 'x' });
    const key = (url: string) => (plateImage(card(url), 'x')?.children as { key: string | null }).key;
    expect(key('https://x.test/rota.jpg')).toBe('https://x.test/rota.jpg'); expect(key('https://x.test/buena.jpg')).not.toBe(key('https://x.test/rota.jpg'));
  });
});
