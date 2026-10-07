import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoMessages } from './Messages';

const context = vi.hoisted(() => ({ mobile: false }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('../../../store/useAppStore', () => ({ useAppStore: (select: (value: { refreshPatient: () => Promise<void> }) => unknown) => select({ refreshPatient: async () => undefined }) }));

const now = new Date('2026-10-03T12:00:00-03:00');
const base = { id: 'p1', name: 'Ana Real', initials: 'AR', goal: 'x', hydration: 0, sleep: '', sleepMinutes: 0, activities: [], logs: [], weekPlan: [], todayPlan: [], appointment: null, appointmentHistory: [], messages: [], journey: { days: [], reviewedMeals: 0, pendingMeals: 0 } };
type Raw = Record<string, unknown>;
const message = (id: string, from: 'vero' | 'patient', sent_at: string, extra: Raw = {}): Raw => ({ id, from, text: `Texto ${id}`, sent_at, delivered_at: null, read_at: null, ...extra });
const render = (messages: Raw[]) => renderToStaticMarkup(<NutrigoMessages patient={{ ...base, messages } as unknown as ShowroomPatient} onNavigate={() => undefined} now={now} />);
const original = process.env.TZ;
beforeEach(() => { context.mobile = false; });
afterEach(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

describe.each([false, true])('mensajes con datos variados (celular: %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });

  it('ordena el chat por el instante real aunque las horas vengan con distinta zona', () => {
    // 14:00Z son las 11:00 en Buenos Aires: tiene que ir antes que las 11:30 aunque como texto sea mayor.
    const html = render([message('tarde', 'vero', '2026-10-03T11:30:00-03:00'), message('temprano', 'vero', '2026-10-03T14:00:00Z')]);
    // Se mira sólo el chat: la vista previa de la lista también nombra al último mensaje.
    const chat = html.slice(html.indexOf('role="log"'));
    expect(chat.indexOf('Texto temprano')).toBeGreaterThan(-1);
    expect(chat.indexOf('Texto temprano')).toBeLessThan(chat.indexOf('Texto tarde'));
  });

  it('un mensaje con fecha inválida no rompe la pantalla: se muestra al final, sin hora, y cuenta como no leído', () => {
    const html = render([message('malo', 'vero', 'ayer a la tarde'), message('bueno', 'vero', '2026-10-03T14:00:00Z')]);
    const chat = html.slice(html.indexOf('role="log"'));
    expect(chat).toContain('Texto bueno'); expect(chat).toContain('Texto malo');
    expect(chat.indexOf('Texto malo')).toBeGreaterThan(chat.indexOf('Texto bueno'));
    expect(html).not.toContain('Invalid');
  });

  it('el círculo de no leídos no crece sin límite', () => {
    const many = Array.from({ length: 150 }, (_, index) => message(`n${index}`, 'vero', `2026-10-03T14:${String(index % 60).padStart(2, '0')}:00Z`));
    const html = render(many);
    expect(html).toContain('>99+<'); expect(html).not.toContain('>150<');
  });

  it('las horas se muestran en Argentina aunque el navegador esté en otra zona', () => {
    process.env.TZ = 'UTC';
    const html = render([message('noche', 'patient', '2026-10-03T22:30:00-03:00')]);
    expect(html).toContain('10:30 p. m.'); expect(html).not.toContain('01:30 a. m.');
  });

  it('cada acción del encabezado tiene su propio nombre y se conservan los tres íconos del archivo', () => {
    const html = render([message('a', 'vero', '2026-10-03T14:00:00Z')]);
    // Antes «Adjuntar archivo» estaba dos veces: en el ícono de videollamada y en el clip del campo de texto.
    expect(html.match(/aria-label="Adjuntar archivo"/g)).toHaveLength(1);
    expect(html.match(/aria-label="Ver mi próxima consulta"/g)).toHaveLength(1);
    expect(html.match(/aria-label="Actualizar conversación"/g)).toHaveLength(1);
    // Cada control con su nombre propio: contactar (teléfono), redactar (lápiz) y «Nuevo mensaje»; ninguno repetido ni genérico.
    expect(html.match(/aria-label="Contactar a mi nutricionista"/g)).toHaveLength(1);
    expect(html.match(/aria-label="Redactar un mensaje"/g)).toHaveLength(1);
    expect(html.match(/aria-label="Nuevo mensaje"/g)).toHaveLength(1);
    expect(html).not.toContain('aria-label="Escribir a mi nutricionista"');
    const icons = mobile ? ['d99b5', '38345', '0aba1'] : ['87f30', '2e9a9', '9f190'];
    for (const icon of icons) expect(html).toContain(icon);
  });

  it('el botón de adjuntar usa un ícono del archivo, no un dibujo propio', () => {
    const html = render([]);
    expect(html).not.toContain('M21 11.5l-8.6 8.6');
    expect(html).toContain('ce0a3');
  });

  it('una imagen compartida no lleva el símbolo de reproducir de los videos', () => {
    const image = message('foto', 'vero', '2026-10-03T14:00:00Z', { attachment: { asset_id: 'a', filename: 'foto.jpg', mime: 'image/jpeg', byte_size: 2048, kind: 'image' } });
    const html = render([image]);
    expect(html).toContain('foto.jpg'); expect(html).not.toContain('data-name="Play"');
  });

  it('los enlaces compartidos muestran primero los más nuevos y los largos no se salen de la tarjeta', () => {
    const links = Array.from({ length: 5 }, (_, index) => message(`e${index}`, 'vero', `2026-10-03T14:0${index}:00Z`, { text: `https://ejemplo.com/enlace-${index}` }));
    const long = message('largo', 'vero', '2026-10-03T14:09:00Z', { text: `https://ejemplo.com/${'a'.repeat(120)}` });
    const html = render([...links, long]);
    // El texto de cada mensaje también está en el chat: se mira sólo la sección «Enlaces» del perfil.
    const panel = html.slice(html.indexOf('>Enlaces<'));
    expect(panel).toContain('enlace-4'); expect(panel).toContain('ejemplo.com/aaaa'); expect(panel).toContain('enlace-3'); expect(panel).not.toContain('enlace-0');
    expect(panel).toMatch(/text-overflow:ellipsis/);
    expect(panel).toContain(`title="https://ejemplo.com/${'a'.repeat(120)}"`);
  });

  it('un archivo con nombre larguísimo se recorta dentro de su tarjeta y conserva el nombre completo', () => {
    const filename = 'Plan alimentario semanal actualizado octubre 2026 con indicaciones de la nutricionista.pdf';
    const doc = message('doc', 'vero', '2026-10-03T14:00:00Z', { attachment: { asset_id: 'b', filename, mime: 'application/pdf', byte_size: 3 * 1048576, kind: 'pdf' } });
    const panel = render([doc]).slice(render([doc]).indexOf('>Archivos (1)<'));
    expect(panel).toContain(`title="${filename}"`); expect(panel).toMatch(/title="Plan alimentario[^"]*"[^>]*style="[^"]*width:100%/);
  });

  it('un archivo sin tamaño no muestra NaN', () => {
    const doc = message('doc', 'vero', '2026-10-03T14:00:00Z', { attachment: { asset_id: 'b', filename: 'plan.pdf', mime: 'application/pdf', byte_size: undefined, kind: 'pdf' } });
    const html = render([doc]);
    expect(html).toContain('plan.pdf'); expect(html).not.toContain('NaN');
  });
});
