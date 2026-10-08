import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import { buildShowroomPatient } from '../../../components/nutrigo/showroom-model';
import type { Patient } from '../../../types';
import { NutrigoHome } from './Home';
import { NutrigoProgress } from './Progress';
import { assignment, basePatient, recipeOf, homeData, journeyDays, NOW, patientWith, planItem, routineItem, target, weightRow } from './home-progress-fixtures';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async original => ({ ...await original<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));

const nav = () => undefined;
const home = (patient = basePatient, now = NOW) => renderToStaticMarkup(<NutrigoHome patient={patient} now={now} onNavigate={nav} onRecord={nav} onHydration={nav} onRest={nav} onLogMeal={nav} />);
const progress = (patient = basePatient) => renderToStaticMarkup(<NutrigoProgress patient={patient} onNavigate={nav} onRecord={nav} onHydration={nav} onRest={nav} />);
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
const atArgentina = (hour: string) => new Date(`2026-10-07T${hour}-03:00`);

beforeEach(() => { context.mobile = false; context.data = null; });
describe.each([false, true])('Inicio: variabilidad de datos (celular %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });

  it('las tres barras de macronutrientes conservan su Progress Bar original con el ancho real', () => {
    context.data = homeData({ target });
    const html = home(patientWith({ nutritionLogCount: 1, kcal: 800, macros: { kcal: 800, carbs_g: 125, protein_g: 50, fat_g: 30 } }));
    expect(count(html, /data-node-id="(I[^"]*;)?67:681"/g)).toBe(3);
    expect(html).toContain('padding-right:50%');
  });
  it('sin dato las barras de macros siguen ahí, vacías', () => {
    context.data = homeData();
    expect(count(home(), /data-node-id="(I[^"]*;)?67:681"/g)).toBe(3);
  });
  it('porcentajes por encima de 100 % muestran el valor real y la barra se llena al tope', () => {
    context.data = homeData({ target });
    const html = home(patientWith({ nutritionLogCount: 1, kcal: 800, macros: { kcal: 800, carbs_g: 450, protein_g: 50, fat_g: 30 } }));
    expect(text(html)).toContain('180%');
    expect(html).toContain('padding-right:0%');
  });
  it('la comida ya registrada conserva el tilde original y la pendiente queda en blanco', () => {
    context.data = homeData({ plan: { items: [planItem('a', 'Desayuno', 'Avena'), planItem('b', 'Almuerzo', 'Pollo')] } });
    const html = home(patientWith({ logs: [{ id: 'l', slot: 'Almuerzo', description: 'Pollo', logged_at: '2026-10-07T15:00:00Z', status: 'reviewed' }] }));
    const checkbox = (slot: string) => html.match(new RegExp(`aria-label="Registrar ${slot}"[^>]*>[\\s\\S]*?</button>`))?.[0] ?? '';
    expect(checkbox('Almuerzo')).toContain('<img');
    expect(checkbox('Desayuno')).not.toContain('<img');
  });
  it('una sola porción se escribe en singular', () => {
    context.data = homeData({ plan: { items: [planItem('a', 'Almuerzo', 'Pollo', { portions: 1 })] } });
    const out = text(home());
    expect(out).toContain('1 porción');
    expect(out).not.toContain('1 porciones');
  });
  it('los litros de agua muestran hasta dos decimales', () => {
    context.data = homeData();
    expect(text(home(patientWith({ hydration: 5 })))).toContain('1,25');
  });
  it('NaN, Infinity y negativos nunca llegan al CSS ni al texto', () => {
    context.data = homeData({ target, body: { weight_kg: Number.NaN }, exercise: { assignments: [assignment([routineItem('x', 'Plancha', { sets: 0 })])], activities: [] }, care: { measurements: [], records: [{ recorded_on: '2026-10-07', data: { kind: 'activity', kcal: Number.NaN } }] } });
    const html = home(patientWith({ steps: Number.NaN, sleepMinutes: Number.POSITIVE_INFINITY, hydration: Number.NaN, nutritionLogCount: 1, kcal: Number.NaN, macros: { kcal: 1, carbs_g: Number.NaN, protein_g: -5, fat_g: Number.POSITIVE_INFINITY }, journey: { days: journeyDays(8, () => ({ hydration: Number.NaN, sleepMinutes: -30 })) } }));
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });
  it('actividad: la semana de ejercicio cuenta días de Buenos Aires, no horas UTC', () => {
    const item = routineItem('x', 'Sentadilla', { sets: 3 });
    const log = (loggedAt: string) => ({ id: loggedAt, assignment_id: 'a1', activity: 'Sentadilla', sets: 3, logged_at: loggedAt });
    context.data = homeData({ exercise: { assignments: [assignment([item])], activities: [log('2026-09-30T22:00:00-03:00')] } });
    expect(text(home())).toContain('(0/3)');
    context.data = homeData({ exercise: { assignments: [assignment([item])], activities: [log('2026-10-01T00:30:00-03:00')] } });
    expect(text(home())).toContain('(3/3)');
  });
  it('el calendario sale de la fecha de Buenos Aires aunque el navegador esté en otra zona', () => {
    context.data = homeData();
    const previous = process.env.TZ;
    process.env.TZ = 'Pacific/Auckland';
    try {
      const out = text(home(basePatient, new Date('2026-10-31T23:30:00-03:00')));
      expect(out).toContain('Octubre 2026');
    } finally { process.env.TZ = previous; }
  });
  it('en domingo el calendario de escritorio igual muestra y marca hoy', () => {
    context.data = homeData();
    const html = home(basePatient, new Date('2026-10-11T12:00:00-03:00'));
    const active = html.match(/<p class="[^"]*"[^>]*>11<\/p>/);
    expect(active).not.toBeNull();
    expect(text(html)).toContain('Dom');
  });
  it('sin cambio de peso desde el inicio no dice «−0»', () => {
    context.data = homeData({ care: { measurements: [weightRow('a', 74, '2026-09-01'), weightRow('b', 74, '2026-10-05')], records: [] } });
    const out = text(home());
    expect(out).toContain('Sin cambios desde el inicio');
    expect(out).not.toContain('−0');
  });
  it('los rótulos largos de calorías pueden achicarse y partirse en vez de salirse de la tarjeta', () => {
    context.data = homeData();
    const html = home();
    expect(html).toMatch(/data-name="Info Eaten Calories"[^>]*style="[^"]*min-width:0/);
    expect(html).toMatch(/data-name="Info Burned Calories"[^>]*style="[^"]*min-width:0/);
    expect(count(html, /data-name="Info"[^>]*style="[^"]*white-space:normal/g)).toBeGreaterThanOrEqual(2);
  });
  it('las macros de cada comida del plan pasan a otra línea si no entran', () => {
    context.data = homeData({ plan: { items: [planItem('a', 'Almuerzo', 'Pollo')] } });
    const html = home();
    expect(html).toMatch(/data-name="Detail Nutrients"[^>]*style="[^"]*flex-wrap:wrap/);
  });
  it('nombres larguísimos de receta, ejercicio y actividad no rompen el bloque ni se cortan', () => {
    const long = 'Supercalifragilisticoespialidosoconlentejasasadasyvegetalesdelaestacion '.repeat(3);
    context.data = homeData({ plan: { items: [planItem('a', 'Almuerzo', long)] }, recipes: [], exercise: { assignments: [assignment([routineItem('x', long)])], activities: [] } });
    const html = home(patientWith({ activities: [{ id: 'a', activity: long, duration_minutes: 40, intensity: 'suave', logged_at: '2026-10-07T13:00:00Z' }] }));
    expect(text(html)).toContain(long.trim());
    expect(html).not.toMatch(/NaN|undefined/);
  });
  it('el nombre de una rutina larga se parte en líneas dentro de su tarjeta (el archivo lo dibuja sin partir)', () => {
    const long = 'Sentadilla búlgara con mancuernas por lado y pausa arriba';
    context.data = homeData({ exercise: { assignments: [assignment([routineItem('x', long)])], activities: [] } });
    expect(home()).toMatch(new RegExp(`<p[^>]*style="[^"]*white-space:normal[^"]*"[^>]*>${long}</p>`));
  });
  it('muchas comidas y muchos ejercicios no pierden bloques del archivo', () => {
    const items = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'].map((slot, index) => planItem(`i${index}`, slot, `Comida ${index}`));
    context.data = homeData({ plan: { items }, exercise: { assignments: [assignment(Array.from({ length: 7 }, (_, i) => routineItem(`x${i}`, `Ejercicio ${i}`)))], activities: [] } });
    const html = home();
    expect(count(html, /data-name="Card Meal Plan"/g)).toBe(6);
    expect(count(html, /data-name="Card Recommended Exercise"/g)).toBe(3);
    expect(count(html, /data-name="Item List Macronutrients"[^>]*aria-label="Ver Ejercicio/g)).toBe(3);
  });
});

const point = (id: string, value: number, on: string) => ({ id, value, source: 'patient', captured_on: on, created_at: `${on}T12:00:00Z` });
const series = (kind: string, unit: string, values: [string, number][]) => ({ kind, unit, current: values.map(([on, value], index) => point(`${kind}${index}`, value, on)), previous: [], current_last: values.length ? point('last', values[values.length - 1][1], values[values.length - 1][0]) : null, previous_last: null, declared_delta: null });
const progressData = (patch: Record<string, unknown> = {}) => ({ progress: { series: [], meals: {} }, care: { records: [], measurements: [] }, target: null, ...patch });

describe.each([false, true])('Progreso: variabilidad de datos (celular %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('las medidas que Plan V no registra se ven como raya, no como casilla en blanco', () => {
    context.data = progressData({ progress: { series: [series('waist', 'cm', [['2026-10-01', 88]]), series('hip', 'cm', [['2026-10-01', 100]])], meals: {} } });
    const out = text(progress());
    if (mobile) expect(out).toMatch(/Cintura 88 cm/);
    else expect(out).toMatch(/1\/10\/2026 — — 88 100 —/);
    // Pecho, brazo y muslo no se registran: se ven como «Sin dato» en la figura, no vacíos.
    expect(out).toMatch(/Pecho Sin dato/);
  });
  it('una fecha con solo cintura deja la cadera en raya, no en blanco', () => {
    context.data = progressData({ progress: { series: [series('waist', 'cm', [['2026-10-01', 88], ['2026-10-02', 89]]), series('hip', 'cm', [['2026-10-01', 100]])], meals: {} } });
    const out = text(progress());
    if (mobile) { expect(out).toMatch(/Cintura 89 cm/); expect(out).toMatch(/Cadera 100 cm/); expect(out).not.toContain('Sección de medidas'); }
    else expect(out).toMatch(/2\/10\/2026 — — 89 — —/);
  });
  it('NaN e Infinity en las series, calorías, sueño y agua no llegan al CSS ni al texto', () => {
    context.data = progressData({ progress: { series: [series('weight', 'kg', [['2026-10-01', Number.NaN], ['2026-10-02', 70]]), series('waist', 'cm', [['2026-10-01', Number.POSITIVE_INFINITY]])], meals: {} }, target: { result: { kcal: Number.NaN } } });
    const html = progress(patientWith({ journey: { days: journeyDays(7, () => ({ hydration: Number.NaN, sleepMinutes: Number.POSITIVE_INFINITY })) }, logs: [{ id: 'l', slot: 'Almuerzo', description: 'x', logged_at: '2026-10-07T15:00:00Z', status: 'reviewed', macros: { kcal: Number.NaN } }] }));
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });
  it('el agua muestra litros con dos decimales', () => {
    context.data = progressData();
    const out = text(progress(patientWith({ journey: { days: journeyDays(7, () => ({ hydration: 5, sleepMinutes: 420 })) } })));
    expect(out).toContain('1,25 L');
  });
  it('muchas fotos y registros de peso se reparten sin perder los marcos del archivo', () => {
    const many = Array.from({ length: 40 }, (_, index) => [`2026-09-${String((index % 28) + 1).padStart(2, '0')}`, 70 + index / 10] as [string, number]);
    context.data = progressData({ progress: { series: [series('weight', 'kg', many)], meals: {} }, care: { records: Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, recorded_on: `2026-10-0${i + 1}`, data: { kind: 'body_photo' } })), measurements: [] } });
    const html = progress();
    expect(count(html, /data-name="Item List Photo Carousel"/g)).toBe(9);
    expect(html).not.toMatch(/NaN|undefined/);
  });
});
afterEach(() => { context.data = null; });

const frameCount = (frame: string, name: string) => {
  const walk = (node: SourceNode): number => (node.props['data-name'] === name ? 1 : 0) + node.children.reduce<number>((sum, child) => sum + (typeof child === 'object' ? walk(child) : 0), 0);
  return walk(frames[`../source/${frame}.json`]);
};
const nameCount = (html: string, name: string) => count(html, new RegExp(`data-name="${name}"`, 'g'));
const readyCard = (url: string, status = 'ready') => ({ category: 'Almuerzo', prep_minutes: null, macro_status: 'unavailable', macros: null, cover_status: status, cover_alt: 'Plato real', cover_url: url });

describe.each([false, true])('Inicio: nodos originales siempre presentes y fotos seguras (celular %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  it('las fotos del plato usan el mismo cargador que el resto: solo https y estado «lista»', () => {
    const recipes = [recipeOf('r1', 'Con foto', { card: readyCard('https://fotos.example/plato.jpg') }), recipeOf('r2', 'Sin estado', { card: readyCard('https://fotos.example/otra.jpg', 'none') })];
    context.data = homeData({ recipes, plan: { items: [planItem('p', 'Almuerzo', 'Pollo', { recipe_proposal: { ...recipeOf('r9', 'Pollo'), card: readyCard('javascript:alert(1)') } })] } });
    const html = home();
    expect(html).toContain('src="https://fotos.example/plato.jpg"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('otra.jpg');
    expect(html).not.toContain('javascript:');
  });
  it('una comida del plan sin nombre dice «Comida sin nombre»', () => {
    context.data = homeData({ plan: { items: [planItem('p', 'Almuerzo', '', { free_text: '   ', recipe_proposal: undefined })] } });
    expect(text(home())).toContain('Comida sin nombre');
  });
  it('la fecha de una actividad vieja es la de Buenos Aires aunque el dispositivo esté en Tokio', () => {
    process.env.TZ = 'Asia/Tokyo';
    context.data = homeData();
    const out = text(home(patientWith({ activities: [{ id: 'a', activity: 'Yoga', duration_minutes: 30, intensity: 'suave', logged_at: '2026-10-02T23:30:00-03:00' }] })));
    expect(out).toContain('2 oct');
    expect(out).not.toContain('3 oct');
  });
  it('actividad reciente usa los ítems originales: solo el último va sin línea y nada queda oculto', () => {
    context.data = homeData();
    const activities = [1, 2, 3].map(i => ({ id: `a${i}`, activity: `Yoga ${i}`, duration_minutes: 30, intensity: 'suave', logged_at: `2026-10-0${i}T13:00:00Z` }));
    const html = home(patientWith({ activities }));
    expect(html).not.toContain('visibility:hidden');
    const list = html.slice(html.indexOf('data-name="List Recent Activity"'));
    expect(count(list, /data-name="Line"/g)).toBe(2);
  });
  it('sin minutos de descanso las barras de la tarjeta Descanso siguen en su lugar, con alto 0', () => {
    context.data = homeData();
    const html = home(patientWith({ sleepMinutes: null, journey: { days: [] } }));
    expect(count(html, /style="height:0;min-height:0"/g)).toBe(8);
    expect(html).not.toContain('display:none;');
  });
});

describe.each([false, true])('Progreso: nodos originales siempre presentes (celular %s)', mobile => {
  beforeEach(() => { context.mobile = mobile; });
  const frame = mobile ? '498-18237' : '105-2790';
  it('la curva de peso conserva sus nodos «Line» y «Line Area», con o sin registros', () => {
    context.data = progressData();
    const empty = progress();
    context.data = progressData({ progress: { series: [series('weight', 'kg', [['2026-10-01', 74], ['2026-10-05', 72]])], meals: {} } });
    const filled = progress();
    for (const html of [empty, filled]) { expect(nameCount(html, 'Line')).toBe(frameCount(frame, 'Line')); expect(nameCount(html, 'Line Area')).toBe(1); }
    expect(filled).toContain('stroke="#ffcb65"');
    expect(filled).toContain('stop-opacity="0.24"');
  });
  it('sin sueño registrado todas las barras de fases del archivo siguen presentes y sin etiqueta rota', () => {
    context.data = progressData();
    const html = progress();
    for (const name of ['Deep', 'Light', 'REM', 'Awake']) expect(nameCount(html, name)).toBe(frameCount(frame, name));
    expect(html).not.toContain('role="img"');
  });
  it('con sueño registrado la barra lleva nombre accesible y los minutos fraccionarios se redondean', () => {
    context.data = progressData();
    const html = progress(patientWith({ journey: { days: journeyDays(7, () => ({ hydration: 1, sleepMinutes: 450.5 })) } }));
    expect(html).toContain('aria-label="Mié: 7 h 31 min"');
    expect(html).not.toMatch(/\d\.\d min/);
    for (const name of ['Deep', 'Light', 'REM', 'Awake']) expect(nameCount(html, name)).toBe(frameCount(frame, name));
  });
  it('una barra de calorías en 0 % queda con su nodo y alto 0, no oculta', () => {
    context.data = progressData();
    const html = progress();
    expect(html).not.toContain('display:none');
  });
});

/** vite.config.ts fija la zona de Buenos Aires para toda la suite: acá cada prueba la cambia y la restaura. */
const suiteZone = process.env.TZ;
afterEach(() => { if (suiteZone === undefined) delete process.env.TZ; else process.env.TZ = suiteZone; });

const showroomPatient = (now: string, mealAt: string) => buildShowroomPatient({
  id: 'p1', name: 'Ana Real', initials: 'AR', goal: 'x', hydration: 5, energy: null, sleep_minutes: 420, steps: null, adherence_score: 0, appointment: null,
  habit_logs: [{ id: 'h', patient_id: 'p1', date: '2026-10-07', hydration: 5, energy: null, sleep_minutes: 420 }],
  meal_logs: [{ id: 'comida', patient_id: 'p1', slot: 'Cena', description: 'Sopa', status: 'confirmed', logged_at: mealAt, foods: [], macros: { kcal: 640, carbs_g: 60, protein_g: 30, fat_g: 20 } }],
  todayPlan: [], weekPlan: [], messages: [], activity_logs: [],
} as unknown as Patient, new Date(now));

// Con el dispositivo en Tokio la comida de las 09:30 de Buenos Aires cae el día siguiente; en Los Ángeles la de las 23:00 de ayer cae «hoy».
const cases = [
  { zone: 'Asia/Tokyo', now: '2026-10-07T22:30:00-03:00', mealAt: '2026-10-07T09:30:00-03:00', counts: true },
  { zone: 'America/Los_Angeles', now: '2026-10-08T01:30:00-03:00', mealAt: '2026-10-07T23:00:00-03:00', counts: false },
];
describe.each(cases)('con el dispositivo en $zone', ({ zone, now, mealAt, counts }) => {
  it('Inicio cuenta las calorías del día de Buenos Aires', () => {
    process.env.TZ = zone;
    context.mobile = false;
    context.data = homeData({ target });
    const out = text(home(showroomPatient(now, mealAt), new Date(now)));
    if (counts) { expect(out).toContain('1.360'); expect(out).toContain('640'); }
    else { expect(out).not.toContain('1.360'); expect(out).not.toContain('640'); }
  });
  it('Progreso cuenta las calorías de hoy argentino en el último día', () => {
    process.env.TZ = zone;
    context.mobile = false;
    context.data = progressData({ target: { result: { kcal: 2000 } } });
    const out = text(progress(showroomPatient(now, mealAt)));
    expect(out).toContain(counts ? '1.360 kcal restantes hoy' : '2.000 kcal restantes hoy');
  });
});
