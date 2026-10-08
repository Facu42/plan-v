import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoPlan } from './Plan';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async original => ({ ...await original<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));
const patient = { id: 'p1', name: 'Ana Real' } as unknown as ShowroomPatient;
const navigate = () => undefined;
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
type Item = Record<string, unknown>;
const item = (extra: Item = {}): Item => ({ id: 'i1', for_date: '2026-10-05', slot: 'Almuerzo', recipe_id: null, recipe_version: null, recipe_title: null, recipe: null, free_text: 'Ensalada', portions: 1, public_note: '', ...extra });
const plan = (items: Item[], end = '2026-10-05') => ({ plan: { id: 'pl', version: 1, period_start: '2026-10-05', period_end: end, published_at: '2026-10-04T12:00:00Z', items } });
const render = (data: unknown, query = '') => { context.data = data; return renderToStaticMarkup(<NutrigoPlan patient={patient} onNavigate={navigate} query={query} />); };
const photoItem = (url: string | null, status: 'ready' | 'none' | 'failed' = 'ready') => item({ dish_card: { category: 'Almuerzo', prep_minutes: null, macro_status: 'unavailable', macros: null, cover_status: status, cover_alt: 'Ensalada', cover_url: url }, recipe_proposal: { title: 'Ensalada', yield_portions: 1, ingredients: [{ name: 'Lechuga', quantity: 1, unit: 'u' }], steps: ['Mezclar'], nutrition: null } });
beforeEach(() => { context.mobile = false; context.data = null; });

describe.each([false, true])('variabilidad de datos en el plan (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('una comida con texto largo hace crecer la fila del archivo en vez de salirse de la celda', () => {
    const html = render(plan([item({ free_text: 'Ensalada templada de lentejas, vegetales asados de estación, queso fresco y aderezo cítrico de la casa', public_note: 'Nota larga '.repeat(30) })]));
    expect(text(html)).toContain('Nota larga');
    const row = html.slice(html.indexOf('data-name="Table-row-meal plan"'), html.indexOf('data-name="Table-row-meal plan"') + 400);
    if (mobile) { expect(html).not.toContain('min-height:96px'); return; }
    expect(row).toMatch(/style="[^"]*min-height:96px/); expect(row).toMatch(/style="[^"]*height:auto/);
  });
  it('una comida sin nombre ni texto no deja la celda vacía', () => {
    const html = text(render(plan([item({ free_text: null, recipe_title: null, public_note: 'Sin sal' })])));
    expect(html).toContain('Comida sin nombre'); expect(html).toContain('Sin sal');
  });
  it('presenta cantidades de todos los componentes y busca alimentos sin depender del título anterior', () => {
    const food={id:'food',kind:'food',food_id:'f',food_revision:1,quantity:2,measure:'Cucharada',public_note:'Sin sal',food_snapshot:{name:'Avena',portions:[{name:'Cucharada',grams:10}]}};
    const recipe={id:'recipe',kind:'recipe',recipe_id:'r',recipe_version:3,portions:0.5,public_note:'',recipe_snapshot:{title:'Tortilla',version:3,yield_portions:1,ingredients:[],steps:[]}};
    const html=render(plan([item({components:[food,recipe],free_text:null})]),'avena');
    expect(text(html)).toContain('Avena · 20 g + Tortilla · 0,5 porciones');
    expect(html).toContain('Ver Almuerzo: Avena');
    expect(text(html)).not.toContain('No hay comidas que coincidan');
  });
  it('sitúa indicaciones publicadas junto al plan y no muestra indicaciones sin copia publicada', () => {
    const data=plan([item()]);
    const html=render({...data,plan:{...data.plan,guidance:{recommendations:['Recomendación publicada'],avoid:['Evitar publicado']}}});
    expect(text(html)).toContain('Recomendaciones y alimentos a evitar');
    expect(text(html)).toContain('Recomendación publicada');
    expect(text(html)).toContain('Evitar publicado');
    expect(html.indexOf('Recomendación publicada')).toBeLessThan(html.indexOf('data-name="Table-row-meal plan"'));
    expect(text(render({plan:null}))).not.toContain('Recomendaciones y alimentos a evitar');
  });
  it('la foto del plato usa el recuadro del archivo: lista y con dirección segura se muestra; el resto deja el gris original', () => {
    const ok = render(plan([photoItem('https://x.test/a.jpg')])); expect(ok).toContain('src="https://x.test/a.jpg"'); expect(ok).toContain('loading="lazy"');
    for (const bad of [photoItem(null, 'none'), photoItem('https://x.test/a.jpg', 'failed'), photoItem('javascript:alert(1)'), photoItem('/relativa.png')]) {
      const html = render(plan([bad])); expect(html).not.toContain('<img alt="Ensalada"'); expect(html).toContain('data-name="Image-Meal Plan"');
    }
  });
  it('un plan de tres semanas se recorre de a siete días, sin días fuera de rango', () => {
    const html = render(plan([item()], '2026-10-25')); expect(html).toContain('Semana 1'); expect(html.match(/data-name="Cell-Y - Meal Plan"/g)?.length).toBe(7);
    if (mobile) expect(html.match(/<button[^>]*aria-label="Semana 1 de 3: cambiar semana"[^>]*>/)?.[0]).not.toContain('disabled');
    else expect(html.match(/<button[^>]*aria-label="Semana siguiente"[^>]*>/)?.[0]).not.toContain('disabled');
  });
  it('sin plan, con plan sin comidas o sin coincidencias queda el bloque con su texto, sin NaN ni «Invalid Date»', () => {
    for (const data of [{ plan: null }, plan([]), plan([item()])]) { const out = text(render(data, data === context.data ? '' : 'zzz')); expect(out).not.toMatch(/NaN|Invalid Date|undefined/); }
    expect(text(render({ plan: null }))).toContain('Todavía no tenés un plan publicado.');
    expect(text(render(plan([item()]), 'zzz'))).toContain('No hay comidas que coincidan con la búsqueda.');
    expect(text(render(plan([])))).toContain('Sin indicación');
  });
  it('el buscador del plan tiene el texto a la izquierda', () => {
    const html = render(plan([item()])); const input = html.match(/<input[^>]*type="search"[^>]*>/)?.[0] ?? '';
    if (mobile) { expect(input).toBe(''); return; } // el celular abre la búsqueda en «Opciones del plan»
    expect(input).toContain('text-left'); expect(input).not.toContain('text-center');
  });
});
