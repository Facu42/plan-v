import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { CRM_WORK_KINDS, type CrmWorkResponse } from '../../types/crm-work';
import { PanelHomeView, panelHomeGreeting, panelHomeWhen } from './PanelHome';

const data: CrmWorkResponse = { items: [{ id: 'meal:a', patient_id: 'a', patient_name: 'Ana', kind: 'meal', status: 'pending_review', title: 'Almuerzo para revisar', href: '/crm/ficha?paciente=a&seccion=registros', updated_at: '2026-10-19T12:00:00Z' }], counts: Object.fromEntries(CRM_WORK_KINDS.map(kind => [kind, kind === 'meal' ? 1 : kind === 'appointment' ? 3 : 0])) as CrmWorkResponse['counts'], total: 1, next_cursor: null, source: 'supabase' };
const props = { patients: [] as Patient[], now: new Date('2026-10-19T13:00:00Z'), data, loading: false, error: '', kind: '' as const, onKind: vi.fn(), onRefresh: vi.fn(), onNext: vi.fn(), hasPrevious: false, board: null, billingError: false, scheduling: null, schedulingError: false, onOpen: vi.fn(), onCopy: vi.fn(), copyStatus: '' };
describe('Inicio del boceto aprobado', () => {
  it('muestra sus bloques y enlaza las tareas reales con un solo botón por fila', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} />);
    for (const label of ['Resumen del día', 'Próxima consulta', 'Pendientes', 'Consultas de hoy', 'Necesitan atención', 'Buenas noticias', 'Tu consultorio', 'Nueva paciente', 'Armar un plan', 'Registrar cobro']) expect(html).toContain(label);
    expect(html).toContain('Almuerzo para revisar');
    expect(html).toContain('/crm/ficha?paciente=a&amp;seccion=registros');
    expect(html).not.toContain('lo armó tu asistente');
    expect(html).not.toContain('Sofía');
  });
  it('no presenta errores de carga como cero y ofrece reintento', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} data={null} error="No pudimos cargar los pendientes." billingError schedulingError />);
    expect(html).toContain('Reintentar pendientes');
    expect(html).toContain('No disponible');
    expect(html).toContain('Reintentar cobros');
    expect(html).toContain('Reintentar reservas');
  });
  it('no finge un enlace público cuando la agenda está deshabilitada', () => {
    const html = renderToStaticMarkup(<PanelHomeView {...props} />);
    expect(html).toContain('Configurar link de reserva');
    expect(html).not.toContain('href="/reservar/mi-consultorio"');
  });
  it('escribe la fecha como el boceto y saluda sin nombres inventados', () => {
    const now = new Date('2026-10-21T12:30:00Z');
    expect(panelHomeWhen(now)).toBe('Miércoles 21 de octubre');
    expect(panelHomeGreeting('', now)).toBe('Buen día');
    expect(panelHomeGreeting('Verónica Trenti', now)).toBe('Buen día, Verónica');
  });
});
