import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoDiary } from './Diary';

const context = vi.hoisted(() => ({ mobile: false }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('../../../store/useAppStore', () => ({ useAppStore: (select: (value: { refreshPatient: () => Promise<void> }) => unknown) => select({ refreshPatient: async () => undefined }) }));

const now = new Date('2026-10-03T12:00:00-03:00');
const base = { id: 'p1', name: 'Ana Real', initials: 'AR', goal: 'x', hydration: 0, sleep: '', sleepMinutes: 0, activities: [], logs: [], weekPlan: [], todayPlan: [], appointment: null, appointmentHistory: [], messages: [], journey: { days: [], reviewedMeals: 0, pendingMeals: 0 } };
type Raw = Record<string, unknown>;
const log = (id: string, extra: Raw = {}): Raw => ({ id, slot: 'Almuerzo', description: `Comida ${id}`, logged_at: '2026-10-03T11:00:00-03:00', status: 'reviewed', macros: { kcal: 300, carbs_g: 30, protein_g: 20, fat_g: 10 }, foods: [{ name: 'a' }], ...extra });
const render = (logs: Raw[], query = '') => renderToStaticMarkup(<NutrigoDiary patient={{ ...base, logs } as unknown as ShowroomPatient} onNavigate={() => undefined} now={now} query={query} />);
const original = process.env.TZ;
beforeEach(() => { context.mobile = false; });
afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

describe.each([false, true])('diario con datos variados (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });

  it('ordena por el instante real aunque las horas vengan con distinta zona', () => {
    // 14:00Z son las 11:00 en Buenos Aires: es más viejo que las 11:30 aunque como texto «14» sea mayor que «11».
    const html = render([log('viejo', { logged_at: '2026-10-03T14:00:00Z' }), log('nuevo', { logged_at: '2026-10-03T11:30:00-03:00' })]);
    expect(html.indexOf('Comida nuevo')).toBeGreaterThan(-1);
    expect(html.indexOf('Comida nuevo')).toBeLessThan(html.indexOf('Comida viejo'));
  });

  it('las tarjetas ignoran nutrientes inválidos en lugar de mostrar NaN o negativos', () => {
    const html = render([
      log('malo1', { macros: { kcal: Number.NaN, carbs_g: -40, protein_g: '20', fat_g: undefined } }),
      log('bueno', { macros: { kcal: 250, carbs_g: 10, protein_g: 5, fat_g: 2 } }),
    ]);
    expect(html).not.toContain('NaN'); expect(html).not.toContain('>-40<'); expect(html).toContain('>250<');
  });

  it('una cifra absurda se abrevia y no se sale de la tarjeta', () => {
    const html = render([log('enorme', { macros: { kcal: 9_000_000_000, carbs_g: 1, protein_g: 1, fat_g: 1 } })]);
    expect(html).not.toContain('9.000.000.000'); expect(html).toContain('9000 M');
  });

  it('día y hora se muestran en Argentina aunque el navegador esté en otra zona', () => {
    process.env.TZ = 'UTC';
    const html = render([log('noche', { logged_at: '2026-10-03T22:30:00-03:00' })]);
    expect(html).toContain('>3/10/2026<'); expect(html).toContain('>10:30 p. m.<'); expect(html).not.toContain('4/10/2026');
  });

  it('un nombre de comida larguísimo se recorta con puntos suspensivos y conserva el texto completo', () => {
    const largo = `Ensalada ${'completa con muchos ingredientes '.repeat(8)}`.trim();
    const html = render([log('largo', { description: largo })]);
    expect(html).toContain('-webkit-line-clamp:2'); expect(html).toContain(`title="${largo}"`);
  });

  it('un momento del día largo no pisa la columna vecina', () => {
    const html = render([log('largo', { slot: 'Colación de media mañana antes de entrenar' })]);
    expect(html).toContain('title="Colación de media mañana antes de entrenar"'); expect(html).toMatch(/text-overflow:ellipsis/);
  });

  it('una comida sin descripción ni alimentos conserva su fila con un texto corto', () => {
    const html = render([log('vacia', { description: '   ', foods: [] }), log('nula', { description: null, foods: [], logged_at: '2026-10-03T10:00:00-03:00' })]);
    expect(html.match(/>Comida registrada</g)).toHaveLength(2);
  });

  it('la búsqueda mira lo que se ve en la fila: una descripción vacía no coincide con «null» y sí con sus alimentos', () => {
    const rows = [log('a', { description: null, foods: [{ name: 'Queso fresco' }] })];
    expect(render(rows, 'null')).not.toContain('Queso fresco');
    expect(render(rows, 'queso')).toContain('Queso fresco');
  });

  it('con un solo registro el total es singular y hay una sola página', () => {
    const html = render([log('uno')]);
    // El celular no dibuja «Mostrando N de M»: ahí se comprueba que la única fila está y no hay segunda página.
    expect(html).toContain(mobile ? '>Comida uno<' : 'de 1 registro<');
    expect(html).not.toContain('aria-label="Página 2"');
  });

  it('con muchos registros la paginación abrevia con puntos y no se sale de rango', () => {
    const many = Array.from({ length: 100 }, (_, index) => log(`m${index}`, { logged_at: `2026-10-0${1 + (index % 3)}T${String(8 + (index % 12)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}:00-03:00` }));
    const html = render(many);
    expect(html).toContain('aria-label="Página 9"'); expect(html).not.toContain('aria-label="Página 10"'); expect(html).toContain(mobile ? 'aria-label="Página siguiente"' : 'de 100 registros');
    expect(html.match(/>Comida m\d+</g)).toHaveLength(12);
  });
});
