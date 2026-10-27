import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { CRM_WORK_KINDS, type CrmWorkResponse } from '../../types/crm-work';
import { readFileSync } from 'node:fs';
import { Cuenta, PanelHomeView, panelHomeGreeting, panelHomeHeading, panelHomeWhen } from './PanelHome';

const data: CrmWorkResponse = { items: [{ id: 'meal:a', patient_id: 'a', patient_name: 'Ana', kind: 'meal', status: 'pending_review', title: 'Almuerzo para revisar', href: '/crm/ficha?paciente=a&seccion=registros', updated_at: '2026-10-19T12:00:00Z' }], counts: Object.fromEntries(CRM_WORK_KINDS.map(kind => [kind, kind === 'meal' ? 1 : kind === 'appointment' ? 3 : 0])) as CrmWorkResponse['counts'], total: 1, next_cursor: null, source: 'supabase' };
const props = { patients: [] as Patient[], now: new Date('2026-10-19T13:00:00Z'), data, loading: false, error: '', onRefresh: vi.fn(), onNext: vi.fn(), hasPrevious: false, board: null, billingError: false, scheduling: null, schedulingError: false, onOpen: vi.fn() };
const sofia = { id: 's', name: 'Sofía Gómez', initials: 'SG', tone: 'mint', goal: 'Bajar de peso', goal_progress: 74, adherence_score: 86, meal_logs: [], habit_logs: [], messages: [], appointment: { starts_at: '2026-10-19T13:30:00Z', when: '', duration: 40, channel: 'presencial' } } as unknown as Patient;

describe('Inicio v29', () => {
  it('arma las tres zonas del boceto: listas, tarjeta oscura, consultas y los cinco números', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} />);
    for (const marca of ['class="iup"', 'id="pfil2"', 'id="plist"', 'id="alist"', 'id="det"', 'dv dvx dv-j', 'class="hoy"', 'id="rows"', 'class="kpis"']) expect(html).toContain(marca);
    for (const titulo of ['Pendientes', 'Necesitan atención', 'Consultas de hoy', 'Para hacer', 'Felicitar', 'Consultas de hoy', 'Pacientes activas', 'Adherencia al plan', 'Por cobrar']) expect(html).toContain(titulo);
    expect((html.match(/class="card kpi"/g) ?? []).length).toBe(5);
  });
  it('enlaza las tareas reales y no inventa pacientes del boceto', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} />);
    expect(html).toContain('Revisar la comida de Ana');
    expect(html).toContain('Almuerzo para revisar');
    expect(html).toContain('Revisar comida');
    for (const inventado of ['Sofía Gómez', 'Martina Díaz', 'Verónica', '$1,28']) expect(html).not.toContain(inventado);
  });
  it('sin datos muestra cero o un texto corto y no esconde ningún bloque', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} data={null} loading />);
    expect(html).toContain('Consultando pendientes');
    expect(html).toContain('No tenés consultas programadas para hoy.');
    expect(html).toContain('Sin alertas en los datos disponibles.');
    expect(html).toContain('Todo al día');
  });
  it('no presenta errores de carga como cero y ofrece reintento', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} data={null} error="No pudimos cargar los pendientes." billingError schedulingError />);
    expect(html).toContain('Reintentar pendientes');
    expect(html).toContain('No disponible');
    expect(html).toContain('Reintentar cobros');
    expect(html).toContain('Reintentar reservas');
  });
  it('pone a la próxima paciente en la tarjeta oscura y en la tabla del día', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} patients={[sofia]} />);
    expect(html).toContain('Preparar la consulta de Sofía Gómez');
    expect(html).toContain('Próxima consulta');
    expect(html).toContain('10:30');
    expect(html).toContain('74% del objetivo');
    expect(html).toContain('<tr class="now">');
    expect(html).toContain('Próxima</span>');
    expect(html).toContain('Consultorio');
  });
  it('escribe fecha, saludo y resumen como el boceto, sin nombres inventados', () => {
    const now = new Date('2026-10-21T12:30:00Z');
    expect(panelHomeWhen(now)).toBe('Miércoles 21 de octubre');
    expect(panelHomeGreeting('', now)).toBe('Buen día');
    expect(panelHomeGreeting('Verónica Trenti', now)).toBe('Buen día, Verónica');
    expect(panelHomeHeading('Verónica', [], now)).toEqual({ title: 'Buen día, Verónica', titleSuffix: '· sin consultas hoy', when: 'Miércoles 21 de octubre · no queda otra consulta hoy' });
    expect(panelHomeHeading('Verónica', [sofia], new Date('2026-10-19T13:00:00Z')).when).toBe('Lunes 19 de octubre · la próxima es a las 10:30');
  });
  it('el movimiento del boceto está y se apaga con «reducir movimiento»', () => {
    const css = readFileSync(new URL('./panel-v29-app.css', import.meta.url), 'utf8');
    const bloque = css.slice(css.indexOf('Movimiento de Inicio'));
    expect(bloque).toContain('@media (prefers-reduced-motion: no-preference)');
    for (const pieza of ['pvDrift', 'pvDraw', 'pvSway', 'pvRing', '#det.dvx .xhero b', '#s-inicio .kpis .kpi', '#s-inicio .klol i']) expect(bloque).toContain(pieza);
    // Todo lo animado vive dentro de la consulta de movimiento: afuera no hay `animation:`.
    expect(bloque.slice(0, bloque.indexOf('@media')).includes('animation:')).toBe(false);
  });
  it('el conteo deja el número final en el texto estático', () => {
    expect(renderToStaticMarkup(<Cuenta valor="$30" />)).toBe('$30');
    expect(renderToStaticMarkup(<Cuenta valor="11:30" />)).toBe('11:30');
  });
});
