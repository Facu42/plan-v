import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoShopping } from './Shopping';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async importOriginal => ({ ...await importOriginal<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));

const patient = { id: 'p1', name: 'Ana Real' } as unknown as ShowroomPatient;
type Line = Record<string, unknown>;
const item = (id: string, extra: Line = {}): Line => ({ id, source_key: `derived:${id}`, kind: 'derived', name: `Producto ${id}`, quantity: 1, unit: 'u', occurrences: 1, checked: false, ...extra });
const render = (items: Line[], now = new Date('2026-10-03T12:00:00-03:00')) => { context.data = { items }; return renderToStaticMarkup(<NutrigoShopping patient={patient} onNavigate={() => undefined} now={now} />); };
const original = process.env.TZ;
beforeEach(() => { context.mobile = false; context.data = null; });
afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

describe.each([false, true])('compras con datos variados (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });

  it('un nombre largo se recorta con puntos suspensivos y no pisa la columna de origen', () => {
    const name = 'Avena arrollada instantánea con manzana, canela y semillas de chía orgánicas';
    const html = render([item('a', { name })]);
    expect(html).toContain(`title="${name}"`); expect(html).toMatch(/text-overflow:ellipsis/);
  });

  it('las cantidades con decimales no pierden precisión y las inválidas no muestran NaN', () => {
    const html = render([item('a', { quantity: 0.25, unit: 'g' }), item('b', { quantity: Number.NaN }), item('c', { quantity: -4 }), item('d', { quantity: 3.5, unit: 'cda' })]);
    expect(html).toMatch(/>0,25<\/p>/); expect(html).toMatch(/>3,5<\/p>/); expect(html).not.toContain('NaN'); expect(html).not.toContain('>-4<'); expect(html).not.toContain('>0,3<');
  });

  it('concuerda el plural de los comprados', () => {
    expect(render([item('a', { checked: true }), item('b')])).toContain('>1 comprado<');
    expect(render([item('a', { checked: true }), item('b', { checked: true })])).toContain('>2 comprados<');
    expect(render([])).toContain('>0 comprados<');
  });

  it('el resumen de meses cuenta el mes en Argentina: el 31 de octubre 22:30 no pasa a noviembre', () => {
    process.env.TZ = 'UTC';
    const html = render([], new Date('2026-11-01T01:30:00Z'));
    expect(html).toContain('>Oct<'); expect(html).not.toContain('>Nov<'); expect(html).toContain('Oct 2026');
  });

  it('«Comprado» no se parte en dos renglones: la etiqueta no conserva el ancho fijo de 60 del texto «Purchased»', () => {
    expect(render([item('a', { checked: true })])).toMatch(/<p[^>]*style="[^"]*white-space:nowrap[^"]*"[^>]*>Comprado</);
  });

  it('una cantidad enorme se recorta en su caja en lugar de partirse en dos renglones', () => {
    expect(render([item('a', { quantity: 12_500_000 })])).toMatch(/<p[^>]*style="[^"]*text-overflow:ellipsis[^"]*"[^>]*>12,5 M</);
  });

  it('las etiquetas de la leyenda de origen no se cortan a mitad de palabra en la columna angosta', () => {
    const html = render([item('a', { kind: 'text' })]);
    expect(html).toMatch(/<p[^>]*style="[^"]*text-overflow:ellipsis[^"]*"[^>]*>Indicaciones</);
  });

  it('el buscador queda alineado a la izquierda, como el texto del archivo antes de escribir', () => {
    const html = render([item('a')]);
    const input = html.match(/<input[^>]*aria-label="Buscar producto"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('text-left'); expect(input).not.toContain('text-center');
  });

  it('con 45 productos pagina de a diez y muestra una ventana de cuatro páginas', () => {
    const html = render(Array.from({ length: 45 }, (_, index) => item(`p${index}`)));
    expect(html.match(/>Producto p\d+</g)).toHaveLength(10); expect(html).toContain('aria-label="Página 4"'); expect(html).not.toContain('aria-label="Página 5"');
    // El celular no dibuja «de N productos»: ahí se comprueba que se puede avanzar a las páginas restantes.
    expect(html).toContain(mobile ? 'aria-label="Página siguiente"' : 'de 45 productos');
  });

  it('sin productos conserva la tabla, las tarjetas en cero y un texto corto', () => {
    const html = render([]);
    expect(html).toContain('No hay productos'); expect(html).toContain('data-name="Pagination"'); expect(html).toContain('>0<'); expect(html).not.toContain('NaN');
  });
});
