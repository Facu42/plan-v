import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoExercise } from './Exercise';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async original => ({ ...await original<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));
vi.mock('../../../store/useAppStore', () => ({ useAppStore: (select: (value: { refreshPatient: () => Promise<void> }) => unknown) => select({ refreshPatient: async () => undefined }) }));
const patient = { id: 'p1', name: 'Ana Real' } as unknown as ShowroomPatient;
const navigate = () => undefined;
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const activity = (index: number, extra: Record<string, unknown> = {}) => ({ id: `a${index}`, activity: `Actividad ${index}`, duration_minutes: 20, intensity: 'suave', note: null, logged_at: '2026-10-03T14:00:00Z', sets: null, reps: null, ...extra });
const render = (activities: unknown[], assignments: unknown[] = []) => { context.data = { assignments, activities }; return renderToStaticMarkup(<NutrigoExercise patient={patient} onNavigate={navigate} />); };
const LONG = 'Caminata rápida en cinta con inclinación progresiva y cambios de ritmo cada dos minutos durante toda la sesión de la mañana';
beforeEach(() => { context.mobile = false; context.data = null; });

describe.each([false, true])('variabilidad de datos en ejercicio (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('sin actividades, «Mostrando» dice 0 de 0 (no el tamaño de página)', () => {
    const html = render([]); expect(text(html)).toContain('Todavía no hay actividades ni rutinas indicadas.');
    if (mobile) { expect(html).not.toContain('data-name="Section Result"'); expect(html).not.toContain('Mostrando'); return; }
    expect(text(html.slice(html.indexOf('data-name="Section Result"'), html.indexOf('data-name="Section Result"') + 1500))).toMatch(/Mostrando 0 de 0/);
  });
  it('con muchas actividades, el escritorio pagina de a 12 y el celular (que no tiene paginación) muestra todas', () => {
    const html = render(Array.from({ length: 40 }, (_, index) => activity(index)));
    const rows = html.match(/data-name="Badge Status - Exercises"/g)?.length;
    if (mobile) { expect(rows).toBe(40); expect(html).not.toContain('aria-label="Página 2"'); return; }
    expect(rows).toBe(12); expect(text(html)).toMatch(/Mostrando 12 de 40/);
    expect(html).toContain('aria-label="Página 3"'); expect(html).not.toContain('aria-label="Página 4"'); expect(html.match(/<button[^>]*aria-label="Página siguiente"[^>]*>/)?.[0]).not.toContain('disabled');
  });
  it('un nombre larguísimo se corta con elipsis dentro de su celda y conserva el texto completo', () => {
    const html = render([activity(1, { activity: LONG })]); const start = html.lastIndexOf('data-name="Cell-Name"'); const cell = html.slice(start, html.indexOf('data-name="Cell-Sets"', start));
    expect(cell).toContain(`title="${LONG}"`); expect(cell).toMatch(/-webkit-line-clamp:2/); expect(cell).toMatch(/white-space:normal/); expect(cell).toMatch(/min-width:0/);
  });
  it('sin series, repeticiones, peso o calorías las celdas quedan en «—»', () => {
    const html = render([activity(1, { duration_minutes: 0 })]); const start = html.lastIndexOf('data-name="Cell-Name"'); const row = text(html.slice(start, html.indexOf('Badge Status - Exercises', start)));
    expect(row).not.toMatch(/ - /); expect(row).toContain('—');
  });
  it('los botones de página cambian de tono con las clases del archivo, sin estilos propios', () => {
    if (mobile) { expect(render(Array.from({ length: 30 }, (_, index) => activity(index)))).not.toContain('data-name="Pagination"'); return; }
    const html = render(Array.from({ length: 30 }, (_, index) => activity(index))); const pagination = html.slice(html.indexOf('data-name="Pagination"'), html.indexOf('data-name="Pagination"') + 3500);
    expect(pagination).not.toContain('style="background'); expect(pagination.match(/<button[^>]*aria-label="Página anterior"[^>]*>/)?.[0]).toContain('bg-[#f6f6f7]');
    expect(pagination.match(/<button[^>]*aria-label="Página siguiente"[^>]*>/)?.[0]).toContain('bg-white');
  });
  it('una rutina sin ejercicios y un registro con textos raros no rompen la tabla', () => {
    const html = render([activity(1, { activity: '<b>negrita</b> & "comillas"', note: 'x'.repeat(400), duration_minutes: 99999 })], [{ id: 'r1', title: 'Rutina vacía', items: [], feedback: null }]);
    expect(html).toContain('&lt;b&gt;negrita&lt;/b&gt;'); expect(text(html)).toContain('99999'); expect(text(html)).not.toMatch(/NaN|undefined|Infinity/);
  });
  it('el texto que se escribe en el buscador va alineado a la izquierda', () => {
    const html = render([activity(1)]); const input = html.match(/<input[^>]*type="search"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('text-left'); expect(input).not.toContain('text-center');
  });
});
