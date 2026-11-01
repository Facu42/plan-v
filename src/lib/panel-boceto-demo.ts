import { isLocalDemoAllowed } from '../context/auth-policy';
import type { SchedulingBooking, SchedulingSettings } from '../types/scheduling';
import type { SchedulingWorkspaceSnapshot } from '../api/scheduling';
import type { BillingBoard, BillingBoardPatient, PatientCharge, PatientPayment } from '../types/fees';
import type { Patient } from '../types';
import { CRM_WORK_KINDS, type CrmWorkItem, type CrmWorkKind, type CrmWorkResponse } from '../types/crm-work';
import { mondayOf, shiftDay } from './panel-agenda';

/** Solo la demo local. En producción `DEV` es falso y esto no se activa. */
export function panelDemoEnabled(env: { DEV: boolean; VITE_ALLOW_DEMO?: string } = {
  DEV: import.meta.env.DEV,
  VITE_ALLOW_DEMO: import.meta.env.VITE_ALLOW_DEMO,
}): boolean {
  return isLocalDemoAllowed(env);
}

const CAL = '00000000-0000-4000-a000-0000000000a1';
const PRIMERA = '00000000-0000-4000-a000-0000000000b1';
const SEGUIMIENTO = '00000000-0000-4000-a000-0000000000b2';
const ONLINE = '00000000-0000-4000-a000-0000000000b3';
const MENSUAL = '00000000-0000-4000-a000-0000000000b4';
const TRIMESTRAL = '00000000-0000-4000-a000-0000000000b5';

function shift(day: string, delta: number): string {
  return shiftDay(day, delta);
}

function at(day: string, hour: number, minute = 0): string {
  return `${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`;
}

function booking(id: string, name: string, typeId: string, starts: string, minutes: number, status: SchedulingBooking['status'], paid: number, total: number): SchedulingBooking {
  return {
    id, nutritionist_id: 'demo', type_id: typeId, calendar_id: CAL, starts_at: starts, duration_min: minutes, status, revision: 1,
    total_minor: total, deposit_minor: Math.round(total / 2), paid_minor: paid, currency: 'ARS', appointment_id: null, patient_id: null,
    contact_name: name, contact_email: 'demo@nutridash.app', contact_phone: '', google_sync_status: 'not_connected', meet_url: null, created_at: starts,
  };
}

/** Turnos, bloqueos y tipos parecidos al boceto de la semana que se está mirando. */
export function bocetoWorkspace(now: Date): SchedulingWorkspaceSnapshot {
  const monday = mondayOf(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(now));
  const day = (offset: number) => shift(monday, offset);
  const types: SchedulingSettings['types'] = [
    { id: PRIMERA, name: 'Primera consulta', calendar_id: CAL, duration_min: 60, channel: 'presencial', price_minor: 4_000_000, deposit_minor: 2_000_000 },
    { id: SEGUIMIENTO, name: 'Seguimiento', calendar_id: CAL, duration_min: 40, channel: 'presencial', price_minor: 3_000_000, deposit_minor: 1_500_000 },
    { id: ONLINE, name: 'Consulta online', calendar_id: CAL, duration_min: 40, channel: 'video', price_minor: 3_000_000, deposit_minor: 1_500_000 },
    { id: MENSUAL, name: 'Programa mensual', calendar_id: CAL, duration_min: 40, channel: 'presencial', price_minor: 5_400_000, deposit_minor: 2_700_000 },
    { id: TRIMESTRAL, name: 'Programa trimestral', calendar_id: CAL, duration_min: 40, channel: 'presencial', price_minor: 15_300_000, deposit_minor: 7_650_000 },
  ];
  const config: SchedulingSettings = {
    timezone: 'America/Argentina/Buenos_Aires',
    calendars: [{ id: CAL, name: 'Consultorio' }],
    types,
    weekly: [1, 2, 3, 4, 5].map(weekday => ({ calendar_id: CAL, weekday, start: '09:00', end: '19:00' })),
    blocks: [
      { id: '00000000-0000-4000-a000-0000000000c1', calendar_id: CAL, label: 'Hospital', start: at(day(1), 13), end: at(day(1), 17) },
      { id: '00000000-0000-4000-a000-0000000000c2', calendar_id: CAL, label: 'Sábado libre', start: at(day(5), 9), end: at(day(5), 12) },
    ],
    page: {
      slug: 'veronica-trenti', enabled: true, title: 'Lic. Verónica Trenti',
      bio: 'Nutricionista. Acompaño a mujeres a comer mejor sin dietas extremas, con planes que se adaptan a tu rutina.',
      location: '', contact: 'MN 8421 · MP 3310', logo_url: '',
    },
    google_calendar_id: 'primary', google_enabled: false, create_meet: false, transfer_alias: 'vero.nutricion',
  };
  const bookings: SchedulingBooking[] = [
    booking('00000000-0000-4000-a000-000000000101', 'Valentina Sosa', SEGUIMIENTO, at(day(0), 9), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000102', 'Brenda Acosta', PRIMERA, at(day(0), 11), 60, 'confirmed', 0, 4_000_000),
    booking('00000000-0000-4000-a000-000000000103', 'Paula Herrera', ONLINE, at(day(0), 15), 90, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000104', 'Julieta Paz', SEGUIMIENTO, at(day(1), 9, 30), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000105', 'Lucía Fernández', ONLINE, at(day(1), 18), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000106', 'Martina Ruiz', PRIMERA, at(day(2), 9), 30, 'confirmed', 0, 4_000_000),
    booking('00000000-0000-4000-a000-000000000107', 'Julieta Paz', ONLINE, at(day(2), 9, 30), 45, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000108', 'Sofía Gómez', SEGUIMIENTO, at(day(2), 10, 30), 45, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000109', 'Lucía Fernández', ONLINE, at(day(2), 11, 15), 45, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000110', 'Rocío Medina', PRIMERA, at(day(2), 15), 60, 'confirmed', 0, 4_000_000),
    booking('00000000-0000-4000-a000-000000000111', 'Paula Herrera', ONLINE, at(day(2), 17, 30), 45, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000112', 'Brenda Acosta', SEGUIMIENTO, at(day(3), 10), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000113', 'Camila Torres', SEGUIMIENTO, at(day(3), 14), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000114', 'Mariana López', SEGUIMIENTO, at(day(3), 16, 30), 60, 'requested', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000115', 'Florencia Romero', SEGUIMIENTO, at(day(4), 9), 60, 'confirmed', 0, 3_000_000),
    booking('00000000-0000-4000-a000-000000000116', 'Agustina Díaz', PRIMERA, at(day(4), 11, 30), 60, 'requested', 2_000_000, 4_000_000),
    booking('00000000-0000-4000-a000-000000000117', 'Natalia Vera', PRIMERA, at(day(4), 15), 60, 'confirmed', 0, 4_000_000),
  ];
  return {
    profile: { nutritionist_id: 'demo', config, revision: 1 },
    connections: { google: false, mercadopago: false },
    available: { google: false, mercadopago: false },
    bookings, transfers: [], has_more: false,
  };
}

function pay(id: string, amount: number, paidOn: string, method: PatientPayment['method'], note: string): PatientPayment {
  return { id, amount, paid_on: paidOn, method, note, status: 'confirmed', reported_by_patient: false, created_at: `${paidOn}T15:00:00.000Z` };
}

function charge(id: string, due: string, amount: number, concept: string): PatientCharge {
  return { id, due_on: due, amount, status: 'open', kind: 'extra', concept };
}

function patient(id: string, name: string, program: 'Mensual' | 'Trimestral' | null, charges: PatientCharge[], payments: PatientPayment[]): BillingBoardPatient {
  return {
    patient_id: id, full_name: name,
    fee: program ? { amount: program === 'Trimestral' ? 153000 : 54000, first_due_on: charges[0]?.due_on ?? payments[0]?.paid_on ?? '2026-01-10', program_name: program } : null,
    charges, payments,
  };
}

function monthShift(today: string, delta: number): string {
  const [year, month] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 10));
  return date.toISOString().slice(0, 10);
}

/** Cobranzas de ejemplo: los totales del boceto salen de estos movimientos. */
export function bocetoBillingBoard(today: string): BillingBoard {
  const bars: Array<[string, number, string]> = [
    ['Valentina Sosa', 620000, monthShift(today, -5)],
    ['Julieta Paz', 710000, monthShift(today, -4)],
    ['Paula Herrera', 680000, monthShift(today, -3)],
    ['Rocío Medina', 840000, monthShift(today, -2)],
    ['Natalia Vera', 960000, monthShift(today, -1)],
  ];
  const quiet = (name: string, program: 'Mensual' | 'Trimestral') => patient(`demo-${name}`, name, program, [], []);
  const patients: BillingBoardPatient[] = [
    ...bars.map(([name, amount, paidOn]) => patient(`demo-${name}`, name, 'Mensual', [charge(`c-${name}`, paidOn, amount, 'Consultas del mes')], [pay(`p-${name}`, amount, paidOn, 'transferencia', 'Consultas del mes')])),
    patient('demo-sofia', 'Sofía Gómez', 'Mensual', [charge('c-sofia', today, 54000, 'Programa mensual · noviembre')], [pay('p-sofia', 54000, today, 'transferencia', 'Programa mensual · noviembre')]),
    patient('demo-agustina', 'Agustina Díaz', null, [charge('c-agustina', today, 20000, 'Seña primera consulta')], [pay('p-agustina', 20000, today, 'mercado_pago', 'Seña primera consulta')]),
    patient('demo-lucia', 'Lucía Fernández', 'Trimestral', [charge('c-lucia', today, 153000, 'Programa trimestral')], [pay('p-lucia', 153000, today, 'transferencia', 'Programa trimestral')]),
    patient('demo-martina', 'Martina Ruiz', null, [charge('c-martina', today, 40000, 'Primera consulta')], [pay('p-martina', 40000, today, 'efectivo', 'Primera consulta')]),
    patient('demo-resto', 'Otras consultas de octubre', null, [charge('c-resto', today, 575000, 'Resto de octubre')], [pay('p-resto', 575000, today, 'transferencia', 'Resto de octubre')]),
    patient('demo-camila', 'Camila Torres', 'Mensual', [charge('c-camila', shift(today, -5), 54000, 'Programa mensual')], []),
    patient('demo-brenda', 'Brenda Acosta', 'Mensual', [charge('c-brenda', shift(today, -2), 54000, 'Programa mensual')], []),
    patient('demo-florencia', 'Florencia Romero', 'Mensual', [charge('c-florencia', shift(today, 4), 54000, 'Programa mensual')], []),
    patient('demo-up-1', 'Elena Vidal', 'Mensual', [charge('c-up-1', shift(today, 6), 54000, 'Programa mensual')], []),
    patient('demo-up-2', 'Irina Costa', 'Mensual', [charge('c-up-2', shift(today, 8), 45000, 'Programa mensual')], []),
    patient('demo-up-3', 'Noelia Paz', 'Mensual', [charge('c-up-3', shift(today, 9), 45000, 'Programa mensual')], []),
    patient('demo-up-4', 'Lara Benítez', 'Trimestral', [charge('c-up-4', shift(today, 7), 45000, 'Programa trimestral')], []),
    patient('demo-up-5', 'Delfina Ortiz', 'Trimestral', [charge('c-up-5', shift(today, 10), 45000, 'Programa trimestral')], []),
    quiet('Ana López', 'Mensual'), quiet('Eva Núñez', 'Mensual'),
    quiet('Clara Díaz', 'Trimestral'), quiet('Mia Ferreyra', 'Trimestral'), quiet('Luz Pereyra', 'Trimestral'), quiet('Zoe Ibáñez', 'Trimestral'),
  ];
  return {
    settings: { default_fee: 54000, alias: 'vero.nutricion', payment_link: '', instructions: 'La paciente sigue usando la app y ve un aviso para ponerse al día.' },
    patients,
  };
}

function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toLocaleUpperCase('es-AR');
}

/** Turnos del boceto como pacientes de Inicio, solo para la demo. */
export function bocetoHomePatients(snapshot: SchedulingWorkspaceSnapshot): Patient[] {
  return snapshot.bookings.filter(booking => booking.status !== 'cancelled').map(booking => {
    const channel = snapshot.profile.config.types.find(type => type.id === booking.type_id)?.channel === 'video' ? 'video' : 'presencial';
    return {
      id: booking.id, name: booking.contact_name, initials: personInitials(booking.contact_name), tone: 'mint', status: 'Activo',
      billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Seguimiento', sensitive_hours: '', plan_b: '',
      next_focus: '', adherence_score: 0, adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
      appointment: { when: '', duration: booking.duration_min, channel, starts_at: booking.starts_at },
      habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], meal_logs: [], messages: [],
    };
  });
}

/** Pendientes de cobro del boceto. El resto de la bandeja queda vacío: no inventa comidas ni mensajes. */
export function bocetoHomeWork(today: string): CrmWorkResponse {
  const counts = Object.fromEntries(CRM_WORK_KINDS.map(kind => [kind, 0])) as Record<CrmWorkKind, number>;
  const items: CrmWorkItem[] = [
    { id: 'demo-camila', kind: 'fee_overdue', patient_id: 'demo-camila', patient_name: 'Camila Torres', status: 'open', updated_at: `${shift(today, -5)}T15:00:00.000Z`, href: '/crm/cobranzas', title: 'Mensual · $54.000 · cuota vencida' },
    { id: 'demo-brenda', kind: 'fee_overdue', patient_id: 'demo-brenda', patient_name: 'Brenda Acosta', status: 'open', updated_at: `${shift(today, -2)}T15:00:00.000Z`, href: '/crm/cobranzas', title: 'Mensual · $54.000 · cuota vencida' },
  ];
  counts.fee_overdue = items.length;
  return { items, next_cursor: null, total: items.length, counts, source: 'memory', home: { quiet: [], reschedule_count: 0, meal_streaks: [] } };
}
