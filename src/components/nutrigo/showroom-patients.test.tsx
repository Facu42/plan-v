import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ShowroomPatientCreate, ShowroomPatientEdit, ShowroomPatients, followFromDirectory } from './ShowroomPatients';

const emptyWeek = {start:'2026-10-03',end:'2026-10-09',recorded_days:0,meals_logged:0,meals_pending:0,water_days:0,water_average:null,pending_review:0};
const base: Patient = {
  weekly_registration:emptyWeek,
  id: 'sofia', name: 'Sofía', initials: 'S', tone: 'mint', status: 'En ritmo',
  billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Organizar comidas',
  sensitive_hours: 'después de las 20:30', plan_b: 'Ensalada a mano', next_focus: 'Sumar proteína',
  adherence_score: 85, adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: { when: 'Jueves · 14:30', duration: 30, channel: 'Videollamada' },
  habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [], meal_logs: [],
};
const patients: Patient[] = [
  base,
  { ...base, id: 'marina', name: 'Marina', initials: 'M', adherence_score: 55, status: 'A mirar', appointment: null, weekly_registration:{...emptyWeek,pending_review:2} },
  { ...base, id: 'laura', name: 'Laura', initials: 'L', adherence_score: 92, archived_at: '2026-09-01T00:00:00.000Z' },
];

const render = (props?: Partial<Parameters<typeof ShowroomPatients>[0]>) =>
  renderToStaticMarkup(<ShowroomPatients patients={patients} query="" onChanged={vi.fn()} onFollow={vi.fn()} {...props} />);

describe('directorio de pacientes del showroom', () => {
  it('mantiene acciones e identifica días, comidas, agua y pendientes por separado',()=>{
    const html=render({onRecord:vi.fn(),onPlan:vi.fn()});
    for(const label of ['Abrir ficha de Sofía','Abrir plan de Sofía','Ver seguimiento de Sofía','Editar ficha de Sofía','Archivar Sofía'])expect(html).toContain(label);
    expect(html).toContain('nv-directory-weekly');expect(html).toContain('Agua sin registrar');expect(html).toContain('0 de 7 días');
    expect(html).toContain('Filtrar pacientes activos');
    const missing=render({patients:[{...base,has_account:false,weekly_registration:null}]});
    expect(missing).toContain('Invitar a Sofía');expect(missing).toContain('Resumen no disponible');expect(missing).not.toContain('0 de 7 días');
  });
  it('ofrece elegir columnas y densidad, con las cinco columnas a la vista por defecto', () => {
    const html = render();
    expect(html).toContain('Columnas y densidad');
    for (const label of ['Estado', 'Próximo foco', 'Registro semanal']) expect(html).toContain(`<input type="checkbox" checked=""/>${label}`);
    expect(html.match(/role="columnheader"/g)).toHaveLength(5);
    expect(html).toContain('Cómoda');
    expect(html).toContain('Compacta');
  });
  it('suma la acción de mensaje sólo para quien ya tiene cuenta y deja la última consulta y la conexión como columnas opcionales', () => {
    const html = render({ onMessage: vi.fn() });
    expect(html).toContain('Escribirle a Sofía');
    expect(render({ onMessage: vi.fn(), patients: [{ ...base, has_account: false }] })).not.toContain('Escribirle a Sofía');
    expect(html).toContain('<input type="checkbox"/>Última consulta');
    expect(html).toContain('<input type="checkbox"/>Conexión');
  });
  it('resume el directorio completo y muestra activos por defecto', () => {
    const html = render();
    expect(html).toContain('Pacientes activos');
    expect(html).toContain('Pendientes de revisión');
    expect(html).toContain('Archivados');
    expect(html).toContain('Sofía');
    expect(html).toContain('Marina');
    expect(html).not.toContain('Laura');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Nuevo paciente');
  });

  it('ofrece acciones accesibles por paciente activo', () => {
    const html = render();
    expect(html).toContain('aria-label="Ver seguimiento de Sofía"');
    expect(html).toContain('aria-label="Editar ficha de Sofía"');
    expect(html).toContain('aria-label="Archivar Sofía"');
    expect(html).toContain('Jueves · 14:30');
    expect(html).toContain('Sumar proteína');
  });

  it('abre el centro de seguimiento del paciente, no el inicio del CRM', () => {
    expect(followFromDirectory('sofia')).toEqual({ patientId: 'sofia', module: 'seguimiento' });
  });

  it('lista archivados con restaurar y sin acciones operativas', () => {
    const html = render({ initialFilter: 'archived' });
    expect(html).toContain('Laura');
    expect(html).toContain('aria-label="Restaurar Laura"');
    expect(html).not.toContain('Ver seguimiento');
    expect(html).not.toContain('Archivar Laura');
    expect(html).not.toContain('Sofía');
  });

  it('pendientes lista registros sin revisar y excluye archivados', () => {
    const html = render({ initialFilter: 'attention' });
    expect(html).toContain('Marina');
    expect(html).not.toContain('Sofía');
    expect(html).not.toContain('Laura');
  });

  it('aplica la búsqueda externa sobre nombre, estado u objetivo', () => {
    expect(render({ query: 'marina' })).toContain('Marina');
    expect(render({ query: 'marina' })).not.toContain('Sofía');
    expect(render({ query: 'sin coincidencias' })).toContain('Sin coincidencias');
  });

  it('el alta nueva es un diálogo accesible y no promete envío de email', () => {
    const html = renderToStaticMarkup(<ShowroomPatientCreate onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Nombre completo');
    expect(html).toContain('Email para la invitación');
    expect(html).toContain('Objetivo declarado');
    expect(html).toContain('no sale un email real');
    expect(html).toContain('Crear alta');
  });

  it('el editor precarga la ficha operativa existente', () => {
    const html = renderToStaticMarkup(<ShowroomPatientEdit patient={base} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(html).toContain('aria-label="Cerrar editor"');
    expect(html).toContain('value="Sofía"');
    expect(html).toContain('value="En ritmo"');
    expect(html).toContain('value="después de las 20:30"');
    expect(html).toContain('Ensalada a mano');
    expect(html).toContain('Sumar proteína');
    expect(html).toContain('<option value="seguimiento" selected="">Seguimiento</option>');
    expect(html).toContain('Guardar cambios');
  });

  it('un acceso vencido se muestra como vencido y no se reactiva solo al guardar', () => {
    const html = renderToStaticMarkup(<ShowroomPatientEdit patient={{ ...base, billing_status: 'past_due', billing_until: '2020-01-01' }} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(html).toContain('<option value="past_due" disabled="" selected="">Vencido</option>');
    expect(html).not.toContain('Pagado hasta<input');
  });
});

describe('PV-47 enlace de invitación', () => {
  it('arma el enlace que acepta la app y un mensaje listo para WhatsApp', async () => {
    const { inviteLink, inviteMessage, accessLabel } = await import('./ShowroomPatients');
    const link = inviteLink('7d0f3c1e-1b2a-4c3d-8e9f-0a1b2c3d4e5f', 'https://plan-v.app');
    expect(link).toBe('https://plan-v.app/app/inicio?invite=7d0f3c1e-1b2a-4c3d-8e9f-0a1b2c3d4e5f');
    expect(inviteMessage('Lía Pérez', link)).toBe(`Hola Lía, te invito a Plan V para seguir tu plan conmigo. Creá tu cuenta con este enlace: ${link}`);
    expect(accessLabel({ billing_status: 'active', billing_until: '2026-10-31' })).toBe('Acceso hasta 31/10/2026');
    expect(accessLabel({ billing_status: 'pending', billing_until: null })).toBe('Acceso pendiente');
  });
});
