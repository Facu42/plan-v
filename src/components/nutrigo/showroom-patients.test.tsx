import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ShowroomPatientCreate, ShowroomPatientEdit, ShowroomPatients, followFromDirectory } from './ShowroomPatients';
import { PanelPacientes, type AccionesPaciente } from './PanelPacientes';

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

const acciones: AccionesPaciente = { onFollow: vi.fn(), onAgenda: vi.fn(), onEdit: vi.fn(), onInvite: vi.fn(), onArchive: vi.fn(), archiveConfirmation: null, busyId: null };
const renderPanel = (abierta: string, lista: Patient[] = patients, extra: Partial<AccionesPaciente> = {}) =>
  renderToStaticMarkup(<PanelPacientes pacientes={lista} ahora={new Date('2026-10-27T15:00:00Z')} board={null} billingError={false} previews={{}} acciones={{ ...acciones, ...extra }} onOpen={vi.fn()} abierta={abierta} onAbrir={vi.fn()} />);

describe('directorio de pacientes del showroom', () => {
  it('el editor permite conservar o corregir teléfono opcional sin inventarlo', () => {
    const patient = { ...base, phone: '+54 11 1234 5678' };
    const html = renderToStaticMarkup(<ShowroomPatientEdit patient={patient} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(html).toContain('Teléfono'); expect(html).toContain('type="tel"'); expect(html).toContain('+54 11 1234 5678');
    expect(renderToStaticMarkup(<ShowroomPatientEdit patient={base} onClose={vi.fn()} onSaved={vi.fn()} />)).toContain('type="tel"');
  });
  it('muestra las solapas del boceto con su cantidad y los botones de arriba', () => {
    const html = render();
    for (const label of ['Todas · 2', 'Necesitan atención · 1', 'Primera vez · 0', 'Inactivas · 1']) expect(html).toContain(label);
    expect(html).toContain('Plan por vencer · —');
    expect(html).toContain('Importar'); expect(html).toContain('Nueva paciente');
    expect(html).toContain('Ordenar por'); expect(html).toContain('Próxima consulta');
    for (const label of ['Paciente', 'Patologías', 'Avance', 'Adherencia', 'Estado']) expect(html).toContain(`<th>${label}</th>`);
  });
  it('cada fila trae objetivo, adherencia, próxima consulta y estado reales', () => {
    const html = render();
    expect(html).toContain('Organizar comidas'); expect(html).toContain('85 %'); expect(html).toContain('Sin declarar');
    expect(html).toContain('aria-label="Ver resumen de Sofía"'); expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Sin turno'); expect(html).toContain('último registro: sin registros');
    expect(html).not.toMatch(/NaN|undefined/);
  });
  it('el detalle desplegado ofrece ficha, plan, mensaje, agendar y las acciones de gestión', () => {
    const html = renderPanel('sofia');
    for (const label of ['Abrir ficha de Sofía', 'Abrir plan de Sofía', 'Escribirle a Sofía', 'Agendar a Sofía', 'Ver seguimiento de Sofía', 'Editar ficha de Sofía', 'Archivar Sofía']) expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('Sin patologías declaradas'); expect(html).toContain('Peso actual'); expect(html).toContain('Avance al objetivo'); expect(html).toContain('Adherencia, 7 días');
    expect(html).toContain('aria-expanded="true"');
    const sinCuenta = renderPanel('sofia', [{ ...base, has_account: false }]);
    expect(sinCuenta).toContain('aria-label="Invitar a Sofía"'); expect(sinCuenta).not.toContain('Escribirle a Sofía');
  });
  it('pide confirmar antes de archivar', () => {
    expect(renderPanel('sofia', undefined, { archiveConfirmation: 'sofia' })).toContain('aria-label="Confirmar archivo de Sofía"');
  });

  it('abre el centro de seguimiento del paciente, no el inicio del CRM', () => {
    expect(followFromDirectory('sofia')).toEqual({ patientId: 'sofia', module: 'seguimiento' });
  });

  it('lista las inactivas con restaurar y sin acciones operativas', () => {
    const html = render({ initialFilter: 'archived' });
    expect(html).toContain('Laura');
    expect(html).not.toContain('Sofía');
    const detalle = renderPanel('laura');
    expect(detalle).toContain('aria-label="Restaurar Laura"');
    expect(detalle).not.toContain('Ver seguimiento'); expect(detalle).not.toContain('Archivar Laura'); expect(detalle).not.toContain('Abrir ficha de Laura');
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
    expect(inviteMessage('Lía Pérez', link)).toBe(`Hola Lía, te invito a Nutridash para seguir tu plan conmigo. Creá tu cuenta con este enlace: ${link}`);
    expect(accessLabel({ billing_status: 'active', billing_until: '2026-10-31' })).toBe('Acceso hasta 31/10/2026');
    expect(accessLabel({ billing_status: 'pending', billing_until: null })).toBe('Acceso pendiente');
  });
});

describe('movimiento de Pacientes', () => {
  it('el detalle se despliega y entra con keyframes, solo si la persona no pidió reducir movimiento', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(new URL('./panel-v29-app.css', import.meta.url), 'utf8');
    const bloque = css.slice(css.indexOf('Detalle de Pacientes: se despliega'));
    expect(bloque).toContain('@media (prefers-reduced-motion: no-preference)');
    for (const pieza of ['pvOpen', 'pvClose', '#s-pacientes .pw-g .ln', '#s-pacientes .pg-g .pv', '#s-pacientes .pa7 i', '#s-pacientes .pd-tl li']) expect(bloque).toContain(pieza);
    expect(bloque.slice(0, bloque.indexOf('@media'))).not.toMatch(/animation/);
  });
});
