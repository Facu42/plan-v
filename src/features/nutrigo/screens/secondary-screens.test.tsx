import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceView, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { NutrigoDiary } from './Diary';
import { NutrigoAgenda, nextConsultation } from './Agenda';
import { NutrigoShopping } from './Shopping';
import { NutrigoExercise } from './Exercise';
import { NutrigoMessages } from './Messages';
import { NutrigoProgress } from './Progress';
import { NutrigoResources } from './Resources';
import type { PatientLibraryView } from '../../../types/resources';

const context = vi.hoisted(() => ({ mobile: false, data: null as unknown }));
const frames = import.meta.glob<SourceNode>('../source/*.json', { eager: true, import: 'default' });
vi.mock('../FramePair', () => ({ FramePair: ({ nodes, resolve, children }: { nodes: [string, string]; resolve: SourceResolver; children?: React.ReactNode }) => <><SourceView source={frames[`../source/${nodes[context.mobile ? 1 : 0].replace(':', '-')}.json`]} resolve={resolve} translate={translateSource} />{children}</> }));
vi.mock('./shared', async importOriginal => ({ ...await importOriginal<typeof import('./shared')>(), useRemote: () => ({ data: context.data, error: '', reload: vi.fn(), setData: vi.fn() }) }));
vi.mock('../../../store/useAppStore', () => ({ useAppStore: (select: (value: { refreshPatient: () => Promise<void> }) => unknown) => select({ refreshPatient: async () => undefined }) }));

const now = new Date('2026-10-03T12:00:00-03:00');
const patient = { id: 'p1', name: 'Ana Real', initials: 'AR', goal: 'Organizar comidas', hydration: 2, sleep: '7 h', sleepMinutes: 420, activities: [], logs: [], weekPlan: [], todayPlan: [], appointment: null, appointmentHistory: [], messages: [], journey: { days: [{ date: '2026-10-03', hydration: 2, sleepMinutes: 420 }], reviewedMeals: 0, pendingMeals: 0 } } as unknown as ShowroomPatient;
const navigate = () => undefined;
beforeEach(() => { context.mobile = false; context.data = null; });

describe.each([false, true])('pantallas desde MCP (celular: %s)', mobile => {
  it('agenda es solo de citas: ni el plan publicado ni comidas legacy aparecen', () => {
    context.mobile = mobile;
    context.data = { plan: { items: [{ id: 'dated', for_date: '2026-10-03', slot: 'Almuerzo', portions: 1, free_text: 'Plan publicado real', public_note: 'Nota profesional vigente' }] } };
    const actual = { ...patient, weekPlan: [{ day: 'Sábado', meals: [{ label: 'Legacy incorrecto' }] }] } as unknown as ShowroomPatient;
    const html = renderToStaticMarkup(<NutrigoAgenda patient={actual} onNavigate={navigate} now={now} />);
    expect(html).not.toContain('Plan publicado real'); expect(html).not.toContain('Nota profesional vigente'); expect(html).not.toContain('Legacy incorrecto');
  });
  it('el diario pagina los registros reales con la paginación del archivo', () => {
    context.mobile = mobile;
    const logs = Array.from({ length: 13 }, (_, index) => ({ id: `l${index}`, slot: 'Almuerzo', description: `Registro actual ${index}`, logged_at: `2026-10-03T${String(10 + (index % 10)).padStart(2, '0')}:${String(index).padStart(2, '0')}:00-03:00`, status: 'pending_review', macros: null, foods: [] }));
    const html = renderToStaticMarkup(<NutrigoDiary patient={{ ...patient, logs } as unknown as ShowroomPatient} onNavigate={navigate} now={now} />);
    // Dos páginas reales (12 + 1), sin las páginas 3 y 7 del ejemplo.
    expect(html).toContain('data-name="Pagination"'); expect(html).toContain('aria-label="Página 2"'); expect(html).not.toContain('aria-label="Página 3"'); expect(html).not.toContain('>7<');
    expect(html.match(/Registro actual \d+/g)).toHaveLength(12);
    if (!mobile) expect(html).toContain('de 13 registros');
    expect(html).not.toContain('out of 84');
  });
  it('el diario conserva la tabla y muestra sólo nutrientes revisados', () => {
    context.mobile = mobile;
    const actual = { ...patient, logs: [{ id: 'l1', slot: 'Almuerzo', description: 'Preparación real', logged_at: '2026-10-03T12:00:00-03:00', status: 'pending_review', macros: { kcal: 999999, carbs_g: 999999, protein_g: 999999, fat_g: 999999 }, foods: [] }] } as ShowroomPatient;
    const html = renderToStaticMarkup(<NutrigoDiary patient={actual} onNavigate={navigate} now={now} onLogMeal={() => undefined} />);
    expect(html).toContain('Preparación real'); expect(html).toContain('Pendiente de revisión'); expect(html).toContain('data-name="Table-Body"');
    expect(html).not.toContain('999999'); expect(html).not.toContain('Scrambled Eggs'); expect(html).not.toContain('12,615');
    expect(html).not.toContain('+1.45%'); expect(html).not.toContain('vs last week'); expect(html).toContain('aria-label="Registrar comida, agua o descanso"');
  });
  it('agenda genera fechas actuales y no conserva consultas del ejemplo', () => {
    context.mobile = mobile;
    const actual = { ...patient, appointment: { when: 'Lunes · 15:00', duration: 30, channel: 'video', meet_url: 'https://meet.google.com/test' } } as ShowroomPatient;
    const html = renderToStaticMarkup(<NutrigoAgenda patient={actual} onNavigate={navigate} now={now} />);
    expect(html).toContain('data-calendar-date="2026-10-03"'); expect(html).toContain('data-calendar-date="2026-10-05"');
    expect(html).not.toContain('Morning Yoga'); expect(html).not.toContain('General Health Check-up'); expect(html).not.toContain('September 2028');
    // Solo la categoría de citas; las tarjetas cuentan citas, no comidas ni actividad.
    expect(html.match(/aria-label="Mostrar consulta"/g)?.length).toBe(1);
    for (const gone of ['Mostrar plan', 'Mostrar diario', 'Mostrar actividad', 'Meal Planning', 'Physical Activities']) expect(html).not.toContain(gone);
    for (const label of ['Próximas', 'Confirmadas', 'Por confirmar']) expect(html).toContain(label);
    expect(html).toContain('box-shadow:inset 0 0 0 2px #c2e66e');
    expect(html).toContain('background:#ffffff');
    // El turno vive dentro del marco: botón del encabezado y tarjeta del detalle, sin controles sueltos.
    expect(html).toContain('aria-label="Cambiar horario de mi consulta"'); expect(html).not.toContain('Edit<'); expect(html).not.toContain('Remove<');
  });
  it('compras muestra cantidades del servidor y permite completar cada producto', () => {
    context.mobile = mobile; context.data = { items: [{ id: 'i1', source_key: 'manual:i1', name: 'Tomate real', kind: 'manual', quantity: 500, unit: 'g', checked: false }] };
    const html = renderToStaticMarkup(<NutrigoShopping patient={patient} onNavigate={navigate} />);
    expect(html).toContain('Tomate real'); expect(html).toMatch(/>500<\/p>/); expect(html).toMatch(/>g<\/p>/); expect(html).toContain('Marcar como comprado: Tomate real'); expect(html).toContain('Eliminar Tomate real');
    expect(html).not.toContain('Almond Butter'); expect(html).not.toContain('$157');
    // La tabla conserva la paginación del archivo con el total real, y los bloques de costos quedan en cero sin precios inventados.
    expect(html).toContain('data-name="Pagination"');if(!mobile)expect(html).toContain('de 1 producto');expect(html).toContain('aria-label="Página 1"');
    expect(html).toContain('Sin precios');expect(html).not.toContain('21,615');expect(html).not.toContain('Grains');expect(html).not.toContain('mcp-screen-state');
  });
  it('ejercicio conserva la tabla sin rutinas o calorías inventadas', () => {
    context.mobile = mobile; context.data = { assignments: [], activities: [{ id: 'a1', activity: 'Caminata real', duration_minutes: 25, intensity: 'suave', note: null, logged_at: '2026-10-03T14:00:00Z', sets: null, reps: null }] };
    const html = renderToStaticMarkup(<NutrigoExercise patient={patient} onNavigate={navigate} />);
    expect(html).toContain('Caminata real'); expect(html).toMatch(/>25<\/p><p[^>]*>min</); expect(html).toContain('Registrada'); expect(html).not.toContain('Squats'); expect(html).not.toContain('Deadlifts'); expect(html).not.toContain('180 cal');
  });
  it('mensajes usa el hilo propio y muestra comprobantes persistidos', () => {
    context.mobile = mobile;
    const actual = { ...patient, messages: [{ id: 'm1', from: 'patient', text: 'Mensaje real enviado', sent_at: '2026-10-03T14:00:00Z', delivered_at: null, read_at: null }, { id: 'm2', from: 'vero', text: 'Respuesta real', sent_at: '2026-10-03T14:01:00Z', delivered_at: null, read_at: null }] } as ShowroomPatient;
    const html = renderToStaticMarkup(<NutrigoMessages patient={actual} onNavigate={navigate} />);
    expect(html).toContain('Mensaje real enviado'); expect(html).toContain('Respuesta real'); expect(html).toContain('Enviado'); expect(html).toContain('Adjuntar archivo');
    expect(html).not.toContain('Mia Johnson'); expect(html).not.toContain('Thanks, Alex'); expect(html).not.toContain('Customized workout plan');
    // El perfil conserva los bloques del archivo (imágenes, archivos, enlaces) con datos reales o vacíos, nunca los de ejemplo.
    expect(html).toContain('Imágenes (0)'); expect(html).toContain('Todavía no compartieron archivos.'); expect(html).not.toContain('alexfosterfitness'); expect(html).not.toContain('Media (2)');
    expect(html.match(/data-name="Bubble"/g)).toHaveLength(2); expect(html).not.toContain('Actualizar conversación</button><');
  });
  it('progreso mantiene privados los datos ausentes y no inventa fases de sueño', () => {
    context.mobile = mobile; context.data = { progress: { series: [] }, care: { records: [] } };
    const html = renderToStaticMarkup(<NutrigoProgress patient={patient} onNavigate={navigate} />);
    expect(html).toContain('Sin registros de peso en este período.'); expect(html).toContain('0,5 L'); expect(html).toContain('25%'); expect(html).toContain('>7 h<');
    expect(html).toContain('aria-label="Período de las medidas: últimos 30 días. Cambiar a 90 días"');
    // Los bloques del archivo siguen en pantalla (no se reemplazan por listas propias), con datos reales o en cero.
    expect(html).toContain('data-name="Bars Stage"'); expect(html).toContain('data-name="Widget Hydration"'); expect(html).toContain('data-name="Chart Column"');
    expect(html).not.toContain('93.0'); expect(html).not.toContain('>85<'); expect(html).not.toContain('REM Phase'); expect(html).not.toContain('>82<'); expect(html).not.toContain('1,755'); expect(html).not.toContain('6h 45m');
  });
  it('recursos reemplaza textos y autores de muestra por el catálogo publicado', () => {
    context.mobile = mobile; context.data = { resources: [{ id: 'r1', slug: 'guia-real', kind: 'operational', title: 'Guía real publicada', summary: 'Contenido del servidor', category: 'Diario', author_name: 'Equipo Plan V', minutes: 2, reviewed_at: null, cover_url: null, tags: [], sections: [], related: [] }], articles: [], favorites: [], assignments: [] } as unknown as PatientLibraryView;
    const html = renderToStaticMarkup(<NutrigoResources patient={patient} onNavigate={navigate} />);
    expect(html).toContain('Guía real publicada'); expect(html).toContain('Contenido del servidor'); expect(html).toContain('Guardados'); expect(html).toContain('Equipo Plan V'); expect(html).not.toContain('The Importance of Hydration'); expect(html).not.toContain('Chef Michael Harris'); expect(html).not.toContain('90K Followers'); expect(html).not.toContain('#Hydration');
  });
  it('el detalle publica únicamente secciones, autoría y vínculos del recurso disponible', () => {
    context.mobile = mobile; context.data = { resources: [{ id: 'r1', slug: 'guia-real', kind: 'operational', title: 'Guía real publicada', summary: 'Contenido del servidor', category: 'Diario', author_name: 'Equipo Plan V', minutes: 2, reviewed_at: null, cover_url: null, tags: ['diario'], sections: [{ title: 'Sección revisada real', body: 'Texto publicado exacto del servidor.' }], related: ['otra-guia'], action_page: 'diario', action_label: 'Abrir diario', license_note: 'Recurso interno Plan V' }, { id: 'r2', slug: 'otra-guia', kind: 'operational', title: 'Otra guía real', category: 'Hábitos', author_name: 'Plan V', minutes: 2, reviewed_at: null, cover_url: null, tags: [], sections: [], related: [] }], articles: [], favorites: [], assignments: [] } as unknown as PatientLibraryView;
    const html = renderToStaticMarkup(<NutrigoResources patient={patient} onNavigate={navigate} resourceId="guia-real" />);
    expect(html).toContain('Detalle del recurso');
    expect(html).toContain('Sección revisada real'); expect(html).toContain('Texto publicado exacto del servidor.'); expect(html).toContain('Guardar recurso'); expect(html).toContain('Leer Otra guía real');
    expect(html).toContain('aria-label="Volver a Recursos"');
    expect(html).not.toContain('general guideline'); expect(html).not.toContain('Science Behind Hydration'); expect(html).not.toContain('Dr. Amelia Johnson');
  });
});
it('el turno sólo admite un día y hora válidos, y mueve la ocurrencia vencida a la próxima semana', () => {
  expect(nextConsultation('Día inventado · 15:00', now)).toBeNull(); expect(nextConsultation('Lunes · 99:00', now)).toBeNull();
  expect(nextConsultation('Sábado · 09:00', now)?.getTime()).toBeGreaterThan(now.getTime());
});
