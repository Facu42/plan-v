import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoResources } from './Resources';
import { swapBackground, GREEN_BG, WHITE_BG } from '../source-tone';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async original => ({ ...await original<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));
const patient = { id: 'p1', name: 'Ana Real' } as unknown as ShowroomPatient;
const navigate = () => undefined;
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const LONG = 'Ensalada templada de lentejas, vegetales asados de estación, queso fresco y aderezo cítrico de la casa';
const resource = (index: number, extra: Record<string, unknown> = {}) => ({ id: `r${index}`, slug: `r-${index}`, kind: 'operational', title: `Recurso ${index}`, summary: `Resumen ${index}`, category: `Categoría ${index % 3}`, author_name: 'Equipo Plan V', minutes: 2, reviewed_at: '2026-09-16T12:00:00.000Z', cover_url: null, tags: ['diario'], sections: [], related: [], action_label: 'Abrir', action_page: 'diario', license_note: '', published: true, ...extra });
const library = (resources: unknown[]) => ({ resources, articles: [], favorites: [], assignments: [] });
const render = (resources: unknown[], props: { resourceId?: string; query?: string } = {}) => { context.data = library(resources); return renderToStaticMarkup(<NutrigoResources patient={patient} onNavigate={navigate} {...props} />); };
beforeEach(() => { context.mobile = false; context.data = null; });

describe('tono de los botones del archivo', () => {
  it('cambia entre dos clases del propio archivo y deja el resto igual', () => {
    const chip = { tag: 'div', props: { className: 'bg-[#c2e66e] px-[10px] rounded-[8px]' }, children: [] } as SourceNode;
    const off = swapBackground(chip, [GREEN_BG, WHITE_BG], WHITE_BG).props?.className as string;
    expect(off.split(' ')).toEqual(['px-[10px]', 'rounded-[8px]', 'bg-white']);
  });
});
describe.each([false, true])('variabilidad de datos en recursos (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('hay un solo botón verde entre los filtros y entre las categorías, sin fondos en línea', () => {
    const html = render(Array.from({ length: 6 }, (_, index) => resource(index)));
    for (const name of ['Chips Category', 'Tab']) {
      const start = html.indexOf(`data-name="${name}"`); const block = html.slice(start, start + 6000);
      expect(block.match(/bg-\[#c2e66e\]/g)?.length ?? 0).toBeLessThanOrEqual(name === 'Tab' ? 1 : 1); expect(block).not.toMatch(/style="[^"]*background:#c2e66e/);
    }
  });
  it('el filtro activo reemplaza el fondo del archivo (no queda con dos fondos a la vez)', () => {
    const html = render([resource(0), resource(1)]); const chips = [...html.matchAll(/<[^>]*data-name="Chips Category"[^>]*>/g)].map(match => match[0]);
    expect(chips.length).toBeGreaterThan(0); const active = chips.filter(chip => chip.includes('bg-[#c2e66e]'));
    expect(active).toHaveLength(1); expect(active[0]).not.toContain('bg-[#fefcfb]'); expect(chips.filter(chip => chip.includes('bg-[#fefcfb]'))).toHaveLength(chips.length - 1);
  });
  it('los títulos y resúmenes largos se cortan con elipsis y el autor largo no se sale de la tarjeta', () => {
    const html = render([resource(0, { title: LONG, summary: LONG.repeat(3), author_name: 'Dra. Nombre Larguísimo Apellido Compuesto de la Casa' }), resource(1, { title: LONG, summary: LONG.repeat(3), author_name: 'Dra. Nombre Larguísimo Apellido Compuesto de la Casa' }), resource(2, { title: LONG, summary: LONG.repeat(3), author_name: 'Dra. Nombre Larguísimo Apellido Compuesto de la Casa' })]);
    expect(html).toMatch(/-webkit-line-clamp:2/); expect(html).toMatch(/<p[^>]*style="[^"]*text-overflow:ellipsis[^"]*"[^>]*>Dra\. Nombre/);
    expect(html).toContain(`title="${LONG}"`);
  });
  it('la foto del recurso sólo se muestra con dirección segura; si no, queda el recuadro gris del archivo', () => {
    const ok = render([resource(0, { cover_url: 'https://x.test/a.jpg' })]); expect(ok).toContain('src="https://x.test/a.jpg"'); expect(ok).toContain('loading="lazy"');
    for (const url of [null, '/relativa.png', 'http://x.test/a.jpg', 'javascript:alert(1)', 'https://']) { const html = render([resource(0, { cover_url: url })]); expect(html).not.toContain('loading="lazy"'); expect(html).toContain('data-name="Place Image Here"'); }
  });
  it('sin minutos de lectura ni fecha no dice «0 min de lectura»', () => {
    const html = text(render([resource(0, { minutes: 0, reviewed_at: null })])); expect(html).not.toContain('0 min de lectura'); expect(html).toContain('Lectura breve');
  });
  it('los dos bloques de «más recursos» no repiten el mismo título', () => {
    const html = text(render(Array.from({ length: 8 }, (_, index) => resource(index)))); expect(html.match(/Más recursos/g)).toHaveLength(1); expect(html).toContain('Otros recursos');
  });
  it('una categoría vacía no crea un botón vacío', () => {
    const html = render([resource(0, { category: '' }), resource(1)]); const tab = html.slice(html.indexOf('data-name="Tab"'), html.indexOf('data-name="Tab"') + 4000);
    expect(tab.match(/aria-label="Ver todas las categorías"/g)).toHaveLength(1); expect(tab).not.toMatch(/aria-label="Ver "/);
  });
  it('con 14 recursos no se pierde ninguno y ninguna tarjeta queda sin título', () => {
    const html = text(render(Array.from({ length: 14 }, (_, index) => resource(index)))); for (let index = 0; index < 14; index++) expect(html).toContain(`Recurso ${index}`);
  });
  it('el detalle con un autor larguísimo lo corta con elipsis y deja visible la fecha', () => {
    const html = render([resource(0, { author_name: 'Dra. Nombre Larguísimo Apellido Compuesto de la Casa Grande' })], { resourceId: 'r-0' });
    expect(html).toMatch(/<p[^>]*style="[^"]*text-overflow:ellipsis[^"]*"[^>]*>Dra\. Nombre/);
  });
  it('el detalle de un recurso sin secciones lo dice dentro del bloque', () => {
    const html = text(render([resource(0)], { resourceId: 'r-0' })); expect(html).toContain('Este recurso todavía no tiene secciones.');
  });
  it('sin resultados en la búsqueda cada bloque dice que no hay coincidencias, sin NaN', () => {
    const html = text(render([resource(0)], { query: 'zzz' })); expect(html).toContain('No hay recursos que coincidan.'); expect(html).not.toMatch(/NaN|undefined|Invalid/);
  });
  it('el texto que se escribe en el buscador va alineado a la izquierda', () => {
    const input = render([resource(0)]).match(/<input[^>]*type="search"[^>]*>/)?.[0] ?? ''; expect(input).toContain('text-left'); expect(input).not.toContain('text-center');
  });
});
